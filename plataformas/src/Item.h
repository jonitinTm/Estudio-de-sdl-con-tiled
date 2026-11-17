#pragma once

#include "Entity.h"
#include "Animation.h"
#include <SDL3/SDL.h>

class PhysBody;

// A coin: a static sensor. Touch it and it is collected
class Item : public Entity
{
public:
	Item();

	bool Start() override;
	bool Update(float dt) override;
	bool CleanUp() override;

	void OnCollision(PhysBody* physA, PhysBody* physB) override;

private:
	SDL_Texture* texture = nullptr;
	AnimationSet anims;
	PhysBody* pbody = nullptr;
	int coinFx = 0;
};
