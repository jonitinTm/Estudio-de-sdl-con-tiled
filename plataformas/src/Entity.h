#pragma once

#include <string>
#include "Vector2D.h"
#include "pugixml.hpp"

class PhysBody;

enum class EntityType { PLAYER, ITEM, ENEMY, UNKNOWN };

// Base class of everything that lives in the level: player, coins, enemies (L04)
class Entity
{
public:
	Entity(EntityType type) : type(type) {}
	virtual ~Entity() {}

	virtual bool Awake() { return true; }
	virtual bool Start() { return true; }
	virtual bool Update(float dt) { return true; }
	virtual bool CleanUp() { return true; }

	// Called by Physics when our body touches / stops touching another one (L08)
	virtual void OnCollision(PhysBody* physA, PhysBody* physB) {}
	virtual void OnCollisionEnd(PhysBody* physA, PhysBody* physB) {}

	// Its node of config.xml (L10)
	virtual void SetParameters(pugi::xml_node p) { parameters = p; }

public:
	std::string name;
	EntityType type;
	bool active = true;
	bool pendingToDelete = false;   // the EntityManager deletes it at the end of the frame
	bool started = false;           // Awake() and Start() already called
	Vector2D position;              // pixels
	pugi::xml_node parameters;
};
