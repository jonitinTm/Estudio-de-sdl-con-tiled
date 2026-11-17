#pragma once

#include "Entity.h"
#include "Animation.h"
#include "Pathfinding.h"
#include "Timer.h"
#include <SDL3/SDL.h>
#include <vector>

class PhysBody;

// Slime: patrols its platform and chases the player with BFS when it sees him (L11, L12)
class Enemy : public Entity
{
public:
	Enemy();

	bool Awake() override;
	bool Start() override;
	bool Update(float dt) override;
	bool CleanUp() override;

	void Kill();
	bool IsDying() const { return dying; }
	void GetBodyPosition(int& x, int& y) const;

private:
	void Think();          // decide where to go
	void Move();
	void Draw();

private:
	SDL_Texture* texture = nullptr;
	AnimationSet anims;
	PhysBody* pbody = nullptr;

	float patrolSpeed = 2.0f;   // m/s
	float chaseSpeed = 3.2f;    // m/s
	int sight = 10;             // tiles

	int direction = 1;          // patrol: +1 right, -1 left
	bool chasing = false;
	bool dying = false;

	Pathfinding pathfinding;
	std::vector<Vector2D> path; // tiles
	Timer thinkTimer;           // the path is not recomputed every frame
	int deadX = 0, deadY = 0;   // last position, to draw the death animation after the body is gone
};
