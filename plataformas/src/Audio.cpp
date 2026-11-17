#include "Audio.h"
#include "Log.h"

Audio::Audio()
{
	name = "audio";
}

bool Audio::Awake()
{
	volume = configParameters.child("volume").attribute("value").as_float(0.6f);

	device = SDL_OpenAudioDevice(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, nullptr);
	if (device == 0)
		LOG("No audio device (%s): the game runs without sound", SDL_GetError());
	return true; // not having sound is not a reason to close the game
}

int Audio::LoadFx(const char* path)
{
	if (device == 0) return 0;

	Fx fx;
	SDL_AudioSpec spec;
	if (!SDL_LoadWAV(path, &spec, &fx.data, &fx.length))
	{
		LOG("Could not load sound %s: %s", path, SDL_GetError());
		return 0;
	}

	// One stream per sound, converting from the WAV format to the device format
	fx.stream = SDL_CreateAudioStream(&spec, nullptr);
	SDL_SetAudioStreamGain(fx.stream, volume);
	SDL_BindAudioStream(device, fx.stream);

	fxs.push_back(fx);
	return (int)fxs.size();   // ids start at 1
}

void Audio::PlayFx(int id)
{
	if (id <= 0 || id > (int)fxs.size()) return;
	Fx& fx = fxs[id - 1];
	SDL_ClearAudioStream(fx.stream);                        // restart if it was already playing
	SDL_PutAudioStreamData(fx.stream, fx.data, (int)fx.length);
}

bool Audio::CleanUp()
{
	for (Fx& fx : fxs)
	{
		SDL_DestroyAudioStream(fx.stream);
		SDL_free(fx.data);
	}
	fxs.clear();
	if (device != 0) SDL_CloseAudioDevice(device);
	device = 0;
	return true;
}
