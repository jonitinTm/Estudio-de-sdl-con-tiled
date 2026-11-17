#include "Render.h"
#include "Engine.h"
#include "Window.h"
#include "Log.h"

Render::Render()
{
	name = "render";
}

bool Render::Awake()
{
	SDL_Window* window = Engine::GetInstance().window->window;
	renderer = SDL_CreateRenderer(window, nullptr);
	if (renderer == nullptr)
	{
		LOG("SDL_CreateRenderer error: %s", SDL_GetError());
		return false;
	}

	vsync = configParameters.child("vsync").attribute("value").as_bool();
	SDL_SetRenderVSync(renderer, vsync ? 1 : 0);

	camera.w = Engine::GetInstance().window->GetWidth();
	camera.h = Engine::GetInstance().window->GetHeight();
	SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);
	return true;
}

bool Render::PreUpdate()
{
	SDL_SetRenderDrawColor(renderer, background.r, background.g, background.b, background.a);
	SDL_RenderClear(renderer);
	return true;
}

bool Render::PostUpdate()
{
	SDL_RenderPresent(renderer);
	return true;
}

bool Render::CleanUp()
{
	if (renderer != nullptr) SDL_DestroyRenderer(renderer);
	renderer = nullptr;
	return true;
}

bool Render::DrawTexture(SDL_Texture* texture, int x, int y, const SDL_Rect* section, float speed, double angle, bool flipH) const
{
	if (texture == nullptr) return false;

	SDL_FRect src;
	if (section != nullptr) src = { (float)section->x, (float)section->y, (float)section->w, (float)section->h };
	else src = { 0, 0, (float)texture->w, (float)texture->h };

	// World -> screen: add the camera (multiplied by speed: 0 = fixed on screen, < 1 = parallax)
	SDL_FRect dst = { (float)(int)(camera.x * speed) + x, (float)(int)(camera.y * speed) + y, src.w, src.h };

	SDL_FlipMode flip = flipH ? SDL_FLIP_HORIZONTAL : SDL_FLIP_NONE;
	return SDL_RenderTextureRotated(renderer, texture, &src, &dst, angle, nullptr, flip);
}

bool Render::DrawRectangle(const SDL_Rect& rect, Uint8 r, Uint8 g, Uint8 b, Uint8 a, bool filled, bool useCamera) const
{
	SDL_SetRenderDrawColor(renderer, r, g, b, a);
	SDL_FRect f = { (float)rect.x, (float)rect.y, (float)rect.w, (float)rect.h };
	if (useCamera) { f.x += camera.x; f.y += camera.y; }
	return filled ? SDL_RenderFillRect(renderer, &f) : SDL_RenderRect(renderer, &f);
}

bool Render::DrawLine(int x1, int y1, int x2, int y2, Uint8 r, Uint8 g, Uint8 b, Uint8 a, bool useCamera) const
{
	SDL_SetRenderDrawColor(renderer, r, g, b, a);
	int ox = useCamera ? camera.x : 0, oy = useCamera ? camera.y : 0;
	return SDL_RenderLine(renderer, (float)(x1 + ox), (float)(y1 + oy), (float)(x2 + ox), (float)(y2 + oy));
}

bool Render::DrawText(const char* text, int x, int y, float scale, Uint8 r, Uint8 g, Uint8 b) const
{
	SDL_SetRenderScale(renderer, scale, scale);
	SDL_SetRenderDrawColor(renderer, 0, 0, 0, 200);
	SDL_RenderDebugText(renderer, x / scale + 1, y / scale + 1, text);   // shadow
	SDL_SetRenderDrawColor(renderer, r, g, b, 255);
	bool ok = SDL_RenderDebugText(renderer, x / scale, y / scale, text);
	SDL_SetRenderScale(renderer, 1.0f, 1.0f);
	return ok;
}

bool Render::SaveScreenshot(const char* path) const
{
	SDL_Surface* surface = SDL_RenderReadPixels(renderer, nullptr);
	if (surface == nullptr) return false;
	bool ok = SDL_SaveBMP(surface, path);
	SDL_DestroySurface(surface);
	return ok;
}
