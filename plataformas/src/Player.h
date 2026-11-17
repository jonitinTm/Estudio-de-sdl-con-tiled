#pragma once

#include "Entity.h"
#include "Animation.h"
#include "Timer.h"
#include <SDL3/SDL.h>

class PhysBody;

class Player : public Entity
{
public:
	Player();

	bool Awake() override;
	bool Start() override;
	bool Update(float dt) override;
	bool CleanUp() override;

	void OnCollision(PhysBody* physA, PhysBody* physB) override;

	// Back to a point of the level (spawn, load game). Keeps lives and coins
	void Respawn(int x, int y);
	// New game: full lives, alive
	void ResetForNewGame(int x, int y);

	void ToggleGodMode();
	bool IsDead() const { return dead && anims.HasFinished(); }
	void GetBodyPosition(int& x, int& y) const;

public:
	int lives = 3;
	int maxLives = 3;
	bool reachedGoal = false;
	bool godMode = false;

private:
	void Move();
	void Jump();
	void GodMove();
	void Hurt(bool instantDeath);
	void UpdateAnimation(float dt);
	void Draw();

private:
	SDL_Texture* texture = nullptr;
	AnimationSet anims;
	PhysBody* pbody = nullptr;

	float speed = 6.0f;       // m/s
	float jumpSpeed = 12.5f;  // m/s
	int bodyW = 20, bodyH = 36;

	bool grounded = false;
	bool facingLeft = false;
	bool dead = false;
	bool pendingRespawn = false;
	Timer airTimer;           // coyote time: you can still jump right after leaving a platform
	Timer hurtTimer;          // invulnerability after being hit
	bool invulnerable = false;
	float invulnerableSec = 1.5f;

	int jumpFx = 0, hurtFx = 0, stompFx = 0;
};
