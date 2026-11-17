#include "Textures.h"
#include "Engine.h"
#include "Render.h"
#include "Log.h"

#include <SDL3_image/SDL_image.h>

Textures::Textures()
{
	name = "textures";
}

SDL_Texture* Textures::Load(const char* path)
{
	SDL_Texture* texture = IMG_LoadTexture(Engine::GetInstance().render->renderer, path);
	if (texture == nullptr)
	{
		LOG("Could not load texture %s: %s", path, SDL_GetError());
		return nullptr;
	}
	SDL_SetTextureScaleMode(texture, SDL_SCALEMODE_NEAREST);   // pixel art: no blur
	textures.push_back(texture);
	return texture;
}

void Textures::UnLoad(SDL_Texture* texture)
{
	if (texture == nullptr) return;
	textures.remove(texture);
	SDL_DestroyTexture(texture);
}

bool Textures::CleanUp()
{
	for (SDL_Texture* texture : textures) SDL_DestroyTexture(texture);
	textures.clear();
	return true;
}
