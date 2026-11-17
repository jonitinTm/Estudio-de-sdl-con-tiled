#pragma once

#include "Module.h"
#include <SDL3/SDL.h>

class Window : public Module
{
public:
	Window();

	bool Awake() override;
	bool CleanUp() override;

	void SetTitle(const char* title);
	int GetWidth() const { return width; }
	int GetHeight() const { return height; }
	int GetScale() const { return scale; }

public:
	SDL_Window* window = nullptr;

private:
	int width = 1280;
	int height = 720;
	int scale = 1;
};
