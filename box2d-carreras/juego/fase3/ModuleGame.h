#pragma once

#include "Globals.h"
#include "Module.h"

class PhysBody;
class PlayerCar;

// Fase 3: solo el coche del jugador en una pista vacia
class ModuleGame : public Module
{
public:
	ModuleGame(Application* app, bool start_enabled = true);
	~ModuleGame();

	bool Start();
	update_status Update();
	bool CleanUp();

private:
	PlayerCar* player;
	PhysBody* walls;
};
