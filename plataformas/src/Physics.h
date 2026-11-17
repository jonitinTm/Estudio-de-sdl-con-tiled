#pragma once

#include "Module.h"
#include <box2d/box2d.h>
#include <list>

// Box2D works in meters, the game in pixels (L08)
#define PIXELS_PER_METER 32.0f
#define METERS_TO_PIXELS(m) ((int)floorf(PIXELS_PER_METER * (m)))
#define PIXEL_TO_METERS(p)  ((float)(p) / PIXELS_PER_METER)
#define GRAVITY_Y 25.0f        // m/s^2, positive = down on screen. Platformers use more than 9.8
#define PHYSICS_DT (1.0f / 60.0f)

class Entity;

enum class ColliderType { PLAYER, ITEM, ENEMY, PLATFORM, DEATH, GOAL, UNKNOWN };
enum class BodyType { DYNAMIC, STATIC, KINEMATIC };

// Our wrapper of a Box2D body: what the rest of the game sees
class PhysBody
{
public:
	void GetPosition(int& x, int& y) const;   // center, in pixels
	float GetRotation() const;               // radians

public:
	b2BodyId body = b2_nullBodyId;
	int width = 0, height = 0;               // pixels (circles: width = height = diameter)
	Entity* listener = nullptr;              // who is told about the collisions of this body
	ColliderType ctype = ColliderType::UNKNOWN;
	bool pendingToDelete = false;
};

class Physics : public Module
{
public:
	Physics();

	bool Start() override;
	bool PreUpdate() override;
	bool PostUpdate() override;
	bool CleanUp() override;

	// x, y = CENTER in pixels. width, height = full size in pixels
	PhysBody* CreateRectangle(int x, int y, int width, int height, BodyType type);
	PhysBody* CreateCircle(int x, int y, int radius, BodyType type);
	PhysBody* CreateRectangleSensor(int x, int y, int width, int height, BodyType type);

	// Marks the body: it is destroyed at the beginning of the next PreUpdate (never during the Step)
	void DeletePhysBody(PhysBody* pbody);

	// Is this body touching something below it? (normal of the contact pointing up)
	bool IsOnGround(const PhysBody* pbody) const;

	b2Vec2 GetLinearVelocity(const PhysBody* pbody) const;
	void SetLinearVelocity(PhysBody* pbody, b2Vec2 velocity);
	void ApplyLinearImpulse(PhysBody* pbody, b2Vec2 impulse);
	void SetPosition(PhysBody* pbody, int x, int y);   // teleport (respawn), in pixels

	void ToggleDebug() { debug = !debug; }

private:
	PhysBody* AddBody(b2BodyId body, int width, int height);
	void ProcessContactEvents();
	void DestroyPendingBodies();

private:
	b2WorldId world = b2_nullWorldId;
	std::list<PhysBody*> bodies;
	bool debug = false;
	float accumulator = 0.0f;   // fixed time step
};
