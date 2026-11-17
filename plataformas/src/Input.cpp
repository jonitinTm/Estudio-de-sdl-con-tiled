#include "Input.h"

Input::Input()
{
	name = "input";
}

bool Input::PreUpdate()
{
	// 1) Empty the event queue (L01)
	SDL_Event event;
	while (SDL_PollEvent(&event))
	{
		if (event.type == SDL_EVENT_QUIT) windowClosed = true;
	}

	// 2) Update the state of every key: IDLE -> DOWN -> REPEAT -> UP -> IDLE
	const bool* keys = SDL_GetKeyboardState(nullptr);
	for (int i = 0; i < SDL_SCANCODE_COUNT; ++i)
	{
		bool pressed = keys[i] || virtualKeys[i];
		if (pressed)
			keyboard[i] = (keyboard[i] == KEY_IDLE || keyboard[i] == KEY_UP) ? KEY_DOWN : KEY_REPEAT;
		else
			keyboard[i] = (keyboard[i] == KEY_REPEAT || keyboard[i] == KEY_DOWN) ? KEY_UP : KEY_IDLE;
	}
	return true;
}
