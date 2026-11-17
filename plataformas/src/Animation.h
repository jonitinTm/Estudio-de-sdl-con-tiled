#pragma once

#include <SDL3/SDL.h>
#include <map>
#include <string>
#include <vector>

// A sequence of frames (rectangles of a spritesheet) with a duration each (L10)
class Animation
{
public:
	void AddFrame(const SDL_Rect& rect, int durationMs) { frames.push_back({ rect, durationMs }); }
	void SetLoop(bool l) { loop = l; }
	void Reset() { currentFrame = 0; timer = 0.0f; finished = false; }
	void Update(float dtMs);

	const SDL_Rect& GetCurrentFrame() const { return frames[currentFrame].rect; }
	bool HasFinished() const { return finished; }
	bool IsEmpty() const { return frames.empty(); }

private:
	struct Frame { SDL_Rect rect; int durationMs; };
	std::vector<Frame> frames;
	int currentFrame = 0;
	float timer = 0.0f;
	bool loop = true;
	bool finished = false;
};

// All the animations of a character, loaded from a Tiled .tsx
class AnimationSet
{
public:
	// aliases: id of the first tile of each animation -> name ("idle", "run"...)
	bool LoadFromTSX(const char* path, const std::map<int, std::string>& aliases);

	void SetCurrent(const std::string& name);
	void SetLoop(const std::string& name, bool loop);
	const std::string& GetCurrentName() const { return current; }
	void Update(float dtMs);
	const SDL_Rect& GetCurrentFrame() const;
	bool HasFinished() const;

private:
	std::map<std::string, Animation> animations;
	std::string current;
};
