#pragma once

#include <SDL3/SDL.h>

// Millisecond timer (SDL_GetTicks). Enough for gameplay: cooldowns, lap times, invulnerability...
class Timer
{
public:
	Timer() { Start(); }

	void Start() { startTime = SDL_GetTicks(); }
	float ReadMSec() const { return (float)(SDL_GetTicks() - startTime); }
	float ReadSec() const { return ReadMSec() / 1000.0f; }

private:
	Uint64 startTime = 0;
};

// High precision timer (performance counter). For profiling and frame timing
class PerfTimer
{
public:
	PerfTimer()
	{
		if (frequency == 0) frequency = SDL_GetPerformanceFrequency();
		Start();
	}

	void Start() { startTime = SDL_GetPerformanceCounter(); }
	double ReadMs() const { return 1000.0 * (double)(SDL_GetPerformanceCounter() - startTime) / (double)frequency; }

private:
	Uint64 startTime = 0;
	static inline Uint64 frequency = 0;
};
