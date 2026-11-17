#pragma once

#include "Module.h"
#include <SDL3/SDL.h>
#include <vector>

// Sound effects with the SDL3 audio API (no extra library): WAV files only
class Audio : public Module
{
public:
	Audio();

	bool Awake() override;
	bool CleanUp() override;

	// Returns an id > 0, or 0 if it could not be loaded
	int LoadFx(const char* path);
	void PlayFx(int id);

private:
	struct Fx
	{
		Uint8* data = nullptr;
		Uint32 length = 0;
		SDL_AudioStream* stream = nullptr;
	};

	SDL_AudioDeviceID device = 0;
	std::vector<Fx> fxs;
	float volume = 0.6f;
};
