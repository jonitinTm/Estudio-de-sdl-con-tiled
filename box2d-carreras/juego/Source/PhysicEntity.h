#pragma once

#include "ModulePhysics.h"

// Base class for everything in the scene that has a physics body
class PhysicEntity
{
protected:

	PhysicEntity(PhysBody* _body)
		: body(_body)
	{
	}

public:
	virtual ~PhysicEntity() = default;

	// Called once per frame while the race is running
	virtual void Update() = 0;

public:
	PhysBody* body;
};
