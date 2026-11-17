#pragma once

#include "Module.h"
#include <SDL3/SDL.h>

enum KeyState
{
	KEY_IDLE = 0,   // not pressed
	KEY_DOWN,       // pressed THIS frame
	KEY_REPEAT,     // held down
	KEY_UP          // released THIS frame
};

class Input : public Module
{
public:
	Input();

	bool PreUpdate() override;

	KeyState GetKey(int id) const { return keyboard[id]; }
	bool GetWindowClose() const { return windowClosed; }

	// Optional: press a key from code (automatic tests, replays, on-screen buttons)
	void SetVirtualKey(int id, bool pressed) { virtualKeys[id] = pressed; }

private:
	KeyState keyboard[SDL_SCANCODE_COUNT] = {};
	bool virtualKeys[SDL_SCANCODE_COUNT] = {};
	bool windowClosed = false;
};
