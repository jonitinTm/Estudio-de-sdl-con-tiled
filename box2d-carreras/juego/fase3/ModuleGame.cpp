#include "Globals.h"
#include "Application.h"
#include "ModuleRender.h"
#include "ModuleGame.h"
#include "ModulePhysics.h"
#include "Car.h"

ModuleGame::ModuleGame(Application* app, bool start_enabled) : Module(app, start_enabled)
{
	player = NULL;
	walls = NULL;
}

ModuleGame::~ModuleGame()
{}

bool ModuleGame::Start()
{
	App->renderer->background = Color{ 75, 78, 88, 255 }; // asphalt

	// The cars are INSIDE this loop: vertices counter-clockwise on screen
	static const int box[] = {
		20, 20,
		20, 700,
		1260, 700,
		1260, 20
	};
	walls = App->physics->CreateChain(0, 0, box, sizeof(box) / sizeof(int));

	// Angle 0: the nose points up
	player = new PlayerCar(App->physics, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 0.0f, RED);

	return true;
}

bool ModuleGame::CleanUp()
{
	App->physics->DestroyBody(player->body);
	delete player;
	player = NULL;

	App->physics->DestroyBody(walls);
	walls = NULL;

	return true;
}

update_status ModuleGame::Update()
{
	player->Update();
	player->Draw();

	DrawText(TextFormat("Speed %.1f m/s", player->GetForwardSpeed()), 30, 40, 24, RAYWHITE);
	DrawText(player->drifting ? "DRIFT" : "", 30, 70, 24, GOLD);

	return UPDATE_CONTINUE;
}
