#include "Window.h"
#include "Engine.h"
#include "Log.h"

Window::Window()
{
	name = "window";
}

bool Window::Awake()
{
	if (!SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO))
	{
		LOG("SDL_Init error: %s", SDL_GetError());
		return false;
	}

	// <window><resolution width="1280" height="720" scale="1"/> ...
	width = configParameters.child("resolution").attribute("width").as_int(1280);
	height = configParameters.child("resolution").attribute("height").as_int(720);
	scale = configParameters.child("resolution").attribute("scale").as_int(1);

	SDL_WindowFlags flags = 0;
	if (configParameters.child("fullscreen").attribute("value").as_bool()) flags |= SDL_WINDOW_FULLSCREEN;
	if (configParameters.child("borderless").attribute("value").as_bool()) flags |= SDL_WINDOW_BORDERLESS;
	if (configParameters.child("resizable").attribute("value").as_bool()) flags |= SDL_WINDOW_RESIZABLE;

	window = SDL_CreateWindow(Engine::GetInstance().GetTitle(), width, height, flags);
	if (window == nullptr)
	{
		LOG("SDL_CreateWindow error: %s", SDL_GetError());
		return false;
	}
	return true;
}

bool Window::CleanUp()
{
	if (window != nullptr) SDL_DestroyWindow(window);
	window = nullptr;
	SDL_Quit();
	return true;
}

void Window::SetTitle(const char* title)
{
	SDL_SetWindowTitle(window, title);
}
