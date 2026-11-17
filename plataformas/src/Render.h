#pragma once

#include "Module.h"
#include <SDL3/SDL.h>

class Render : public Module
{
public:
	Render();

	bool Awake() override;
	bool PreUpdate() override;
	bool PostUpdate() override;
	bool CleanUp() override;

	// x, y in WORLD pixels: the camera is applied inside. speed = 0 draws on screen (HUD)
	bool DrawTexture(SDL_Texture* texture, int x, int y, const SDL_Rect* section = nullptr,
	                 float speed = 1.0f, double angle = 0.0, bool flipH = false) const;
	bool DrawRectangle(const SDL_Rect& rect, Uint8 r, Uint8 g, Uint8 b, Uint8 a = 255,
	                   bool filled = true, bool useCamera = true) const;
	bool DrawLine(int x1, int y1, int x2, int y2, Uint8 r, Uint8 g, Uint8 b, Uint8 a = 255, bool useCamera = true) const;
	// Text with the built-in SDL3 debug font (8x8 pixels per letter, times scale). Always on screen
	bool DrawText(const char* text, int x, int y, float scale, Uint8 r, Uint8 g, Uint8 b) const;

	void SetBackgroundColor(SDL_Color color) { background = color; }
	bool SaveScreenshot(const char* path) const;

public:
	SDL_Renderer* renderer = nullptr;
	SDL_Rect camera = { 0, 0, 1280, 720 };   // camera.x/y are NEGATIVE: drawn at x + camera.x
	bool vsync = false;

private:
	SDL_Color background = { 0, 0, 0, 255 };
};
