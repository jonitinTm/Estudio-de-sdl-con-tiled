#pragma once

#include "Module.h"
#include <SDL3/SDL.h>
#include <list>

class Textures : public Module
{
public:
	Textures();

	bool CleanUp() override;

	SDL_Texture* Load(const char* path);
	void UnLoad(SDL_Texture* texture);

private:
	std::list<SDL_Texture*> textures;   // everything loaded, to free it in CleanUp
};
