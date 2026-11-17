#pragma once

#include "Module.h"
#include "Entity.h"
#include <list>
#include <memory>

class EntityManager : public Module
{
public:
	EntityManager();

	bool Awake() override;
	bool Start() override;
	bool Update(float dt) override;
	bool CleanUp() override;

	// Factory (L04): creates the right class for the type
	std::shared_ptr<Entity> CreateEntity(EntityType type);

	// Marks every entity of a type to be deleted (restart the level)
	void DestroyAll(EntityType type);

public:
	std::list<std::shared_ptr<Entity>> entities;
};
