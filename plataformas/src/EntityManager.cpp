#include "EntityManager.h"
#include "Player.h"
#include "Item.h"
#include "Enemy.h"
#include "Log.h"

EntityManager::EntityManager()
{
	name = "entitymanager";
}

bool EntityManager::Awake()
{
	return true;
}

// The entities created in Scene::Awake() start here, after every module has its resources ready
bool EntityManager::Start()
{
	for (const auto& entity : entities)
	{
		if (!entity->Awake() || !entity->Start()) return false;
		entity->started = true;
	}
	return true;
}

std::shared_ptr<Entity> EntityManager::CreateEntity(EntityType type)
{
	std::shared_ptr<Entity> entity = nullptr;

	switch (type)
	{
	case EntityType::PLAYER: entity = std::make_shared<Player>(); break;
	case EntityType::ITEM:   entity = std::make_shared<Item>();   break;
	case EntityType::ENEMY:  entity = std::make_shared<Enemy>();  break;
	default:
		LOG("CreateEntity: unknown type");
		return nullptr;
	}

	entities.push_back(entity);
	return entity;
}

void EntityManager::DestroyAll(EntityType type)
{
	for (const auto& entity : entities)
		if (entity->type == type) entity->pendingToDelete = true;
}

bool EntityManager::Update(float dt)
{
	// Copy the list first: an Update may create new entities
	std::list<std::shared_ptr<Entity>> list = entities;
	for (const auto& entity : list)
	{
		if (!entity->active || entity->pendingToDelete) continue;

		// Entities created during the game (coins when the level restarts...) start now
		if (!entity->started)
		{
			if (!entity->Awake() || !entity->Start()) return false;
			entity->started = true;
		}

		if (!entity->Update(dt)) return false;
	}

	// Delete the entities marked during this frame (never while iterating the list above)
	for (auto it = entities.begin(); it != entities.end();)
	{
		if ((*it)->pendingToDelete)
		{
			(*it)->CleanUp();
			it = entities.erase(it);   // shared_ptr: the object is deleted here
		}
		else ++it;
	}
	return true;
}

bool EntityManager::CleanUp()
{
	for (const auto& entity : entities) entity->CleanUp();
	entities.clear();
	return true;
}
