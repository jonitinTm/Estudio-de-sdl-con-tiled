#include "Globals.h"
#include "Application.h"
#include "ModuleRender.h"
#include "ModuleGame.h"
#include "ModuleAudio.h"
#include "ModulePhysics.h"
#include "Car.h"
#include "Track.h"

#include <math.h>

ModuleGame::ModuleGame(Application* app, bool start_enabled) : Module(app, start_enabled)
{
	player = NULL;
	walls_outer = walls_inner = NULL;
	boost_pad = oil = NULL;
	state = RACE_COUNTDOWN;
	race_time = 0.0;
	finished_count = 0;
	best_lap_session = -1.0;
	lap_fx = boost_fx = crash_fx = 0;
}

ModuleGame::~ModuleGame()
{}

bool ModuleGame::Start()
{
	LOG("Loading race");

	App->renderer->background = Color{ 70, 120, 60, 255 }; // grass

	lap_fx = App->audio->LoadFx("Assets/bonus.wav");
	boost_fx = App->audio->LoadFx("Assets/bonus.wav");
	crash_fx = App->audio->LoadFx("Assets/bonus.wav");

	// Walls: two closed chains. The module listens to them to play the crash sound
	walls_outer = App->physics->CreateChain(0, 0, track_outer, sizeof(track_outer) / sizeof(int));
	walls_inner = App->physics->CreateChain(0, 0, track_inner, sizeof(track_inner) / sizeof(int));
	walls_outer->listener = this;
	walls_inner->listener = this;

	// Checkpoints: sensors across the track. 0 is the finish line
	for (int i = 0; i < CHECKPOINT_COUNT; ++i)
	{
		const CheckpointDef& def = track_checkpoints[i];
		PhysBody* cp = App->physics->CreateRectangleSensor(def.x, def.y, TRACK_HALF_WIDTH, 4, def.angle);
		cp->listener = this;
		checkpoints.push_back(cp);
	}

	// Special zones
	boost_pad = App->physics->CreateRectangleSensor(track_boost.x, track_boost.y, 16, 22, track_boost.angle);
	boost_pad->listener = this;

	oil = App->physics->CreateRectangleSensor(track_oil.x, track_oil.y, 30, 18, track_oil.angle);
	oil->listener = this;

	// Cars: the player and three rivals
	player = new PlayerCar(App->physics, track_grid[0].x, track_grid[0].y, track_grid[0].angle, RED);
	cars.push_back(player);

	const Color rival_colors[3] = { BLUE, GOLD, PURPLE };
	for (int i = 0; i < 3; ++i)
	{
		const GridSlot& slot = track_grid[i + 1];
		cars.push_back(new AICar(App->physics, slot.x, slot.y, slot.angle, rival_colors[i], track_waypoints, WAYPOINT_COUNT, walls_outer, walls_inner));
	}

	StartRace();

	return true;
}

bool ModuleGame::CleanUp()
{
	LOG("Unloading race");

	// Everything we created with new is deleted here, and its body destroyed
	for (Car* car : cars)
	{
		App->physics->DestroyBody(car->body);
		delete car;
	}
	cars.clear();
	player = NULL;

	for (PhysBody* cp : checkpoints)
		App->physics->DestroyBody(cp);
	checkpoints.clear();

	App->physics->DestroyBody(boost_pad);
	App->physics->DestroyBody(oil);
	App->physics->DestroyBody(walls_outer);
	App->physics->DestroyBody(walls_inner);
	boost_pad = oil = walls_outer = walls_inner = NULL;

	return true;
}

void ModuleGame::StartRace()
{
	for (int i = 0; i < (int)cars.size(); ++i)
		cars[i]->Reset(track_grid[i].x, track_grid[i].y, track_grid[i].angle);

	state = RACE_COUNTDOWN;
	finished_count = 0;
	race_time = 0.0;
	countdown.Start();
}

update_status ModuleGame::Update()
{
	// Race logic ------------------------------------------------------------
	switch (state)
	{
	case RACE_COUNTDOWN:
		if (countdown.ReadSec() >= 3.0)
		{
			state = RACE_RUNNING;
			race_timer.Start();
			for (Car* car : cars)
				car->lap_timer.Start();
			App->audio->PlayFx(lap_fx);
		}
		break;

	case RACE_RUNNING:
		// Rubber banding: rivals ahead of the player slow down a bit, rivals behind speed up
		for (int i = 1; i < (int)cars.size(); ++i)
			cars[i]->speed_factor = (Progress(cars[i]) > Progress(player)) ? 0.90f : 1.05f;

		for (Car* car : cars)
			car->Update();

		if (player->nitro_fired)
			App->audio->PlayFx(boost_fx);

		if (player->finished)
		{
			state = RACE_FINISHED;
			race_time = race_timer.ReadSec();
		}
		break;

	case RACE_FINISHED:
		// The rivals keep going until they finish too
		for (Car* car : cars)
			car->Update();
		break;
	}

	if (IsKeyPressed(KEY_R) || (state == RACE_FINISHED && IsKeyPressed(KEY_ENTER)))
		StartRace();

	// Draw ------------------------------------------------------------------
	DrawTrack();

	for (Car* car : cars)
		car->Draw();

	DrawHUD();

	return UPDATE_CONTINUE;
}

// bodyA is always the body that has this module as listener: a wall, a checkpoint or a zone
void ModuleGame::OnCollision(PhysBody* bodyA, PhysBody* bodyB)
{
	Car* car = FindCar(bodyB);
	if (car == NULL)
		return;

	// Walls: crash sound, if the car was going fast and not too often
	if (bodyA == walls_outer || bodyA == walls_inner)
	{
		if (fabsf(car->GetForwardSpeed()) > 3.0f && crash_timer.ReadSec() > 0.3)
		{
			App->audio->PlayFx(crash_fx);
			crash_timer.Start();
		}
		return;
	}

	// The world is locked here: we only write down what happened.
	// The boost force is applied later, in Car::Drive()
	if (bodyA == boost_pad)
	{
		car->boost_time = 0.6f;
		App->audio->PlayFx(boost_fx);
		return;
	}

	if (bodyA == oil)
	{
		car->in_oil++;
		return;
	}

	// Checkpoints only count in order: no shortcuts and no driving backwards over the line
	int index = FindCheckpoint(bodyA);
	if (index < 0 || state == RACE_COUNTDOWN || car->finished)
		return;

	if (index != car->next_checkpoint)
		return;

	car->next_checkpoint = (index + 1) % CHECKPOINT_COUNT;

	if (index == 0) // finish line
	{
		car->LapCompleted();

		if (car == player)
		{
			App->audio->PlayFx(lap_fx);
			if (best_lap_session < 0.0 || car->last_lap < best_lap_session)
				best_lap_session = car->last_lap;
		}

		if (car->lap >= LAPS_TO_WIN)
		{
			car->finished = true;
			car->place = ++finished_count;
		}
	}
}

void ModuleGame::OnCollisionEnd(PhysBody* bodyA, PhysBody* bodyB)
{
	if (bodyA != oil)
		return;

	Car* car = FindCar(bodyB);
	if (car != NULL && car->in_oil > 0)
		car->in_oil--;
}

Car* ModuleGame::FindCar(PhysBody* pbody) const
{
	for (Car* car : cars)
	{
		if (car->body == pbody)
			return car;
	}
	return NULL;
}

int ModuleGame::FindCheckpoint(PhysBody* pbody) const
{
	for (int i = 0; i < (int)checkpoints.size(); ++i)
	{
		if (checkpoints[i] == pbody)
			return i;
	}
	return -1;
}

float ModuleGame::Progress(const Car* car) const
{
	// Checkpoints done in this lap
	int done = (car->next_checkpoint - 1 + CHECKPOINT_COUNT) % CHECKPOINT_COUNT;

	// Closer to the next checkpoint = further in the race
	int x, y;
	car->body->GetPosition(x, y);
	const CheckpointDef& next = track_checkpoints[car->next_checkpoint];
	float dx = (float)(next.x - x);
	float dy = (float)(next.y - y);
	float distance = sqrtf(dx * dx + dy * dy);

	return (float)(car->lap * CHECKPOINT_COUNT + done) - distance / 10000.0f;
}

int ModuleGame::Position(const Car* car) const
{
	if (car->place > 0)
		return car->place;

	// Cars that already finished are ahead. Then, the ones with more progress
	int position = 1 + finished_count;
	for (const Car* other : cars)
	{
		if (other != car && other->place == 0 && Progress(other) > Progress(car))
			position++;
	}
	return position;
}

void ModuleGame::DrawTrack() const
{
	const Color asphalt = { 75, 78, 88, 255 };

	// Asphalt: a thick line along the waypoints, with a circle on every joint
	for (int i = 0; i < WAYPOINT_COUNT; ++i)
	{
		int j = (i + 1) % WAYPOINT_COUNT;
		Vector2 a = { (float)track_waypoints[i * 2], (float)track_waypoints[i * 2 + 1] };
		Vector2 b = { (float)track_waypoints[j * 2], (float)track_waypoints[j * 2 + 1] };
		DrawLineEx(a, b, TRACK_HALF_WIDTH * 2.0f, asphalt);
		DrawCircleV(a, (float)TRACK_HALF_WIDTH, asphalt);
	}

	// Kerbs: the same vertices as the chains
	const int outer_count = sizeof(track_outer) / sizeof(int) / 2;
	for (int i = 0; i < outer_count; ++i)
	{
		int j = (i + 1) % outer_count;
		DrawLineEx(Vector2{ (float)track_outer[i * 2], (float)track_outer[i * 2 + 1] }, Vector2{ (float)track_outer[j * 2], (float)track_outer[j * 2 + 1] }, 4.0f, RAYWHITE);
	}

	const int inner_count = sizeof(track_inner) / sizeof(int) / 2;
	for (int i = 0; i < inner_count; ++i)
	{
		int j = (i + 1) % inner_count;
		DrawLineEx(Vector2{ (float)track_inner[i * 2], (float)track_inner[i * 2 + 1] }, Vector2{ (float)track_inner[j * 2], (float)track_inner[j * 2 + 1] }, 4.0f, RAYWHITE);
	}

	// Finish line
	const CheckpointDef& finish = track_checkpoints[0];
	Rectangle line = { (float)finish.x, (float)finish.y, TRACK_HALF_WIDTH * 2.0f, 8.0f };
	DrawRectanglePro(line, Vector2{ (float)TRACK_HALF_WIDTH, 4.0f }, finish.angle * RAD2DEG, RAYWHITE);

	// Zones
	Rectangle pad = { (float)track_boost.x, (float)track_boost.y, 32.0f, 44.0f };
	DrawRectanglePro(pad, Vector2{ 16.0f, 22.0f }, track_boost.angle * RAD2DEG, GOLD);

	Rectangle spill = { (float)track_oil.x, (float)track_oil.y, 60.0f, 36.0f };
	DrawRectanglePro(spill, Vector2{ 30.0f, 18.0f }, track_oil.angle * RAD2DEG, Color{ 15, 15, 25, 230 });
}

void ModuleGame::DrawHUD() const
{
	int lap = (player->lap < LAPS_TO_WIN) ? player->lap + 1 : LAPS_TO_WIN;
	DrawText(TextFormat("Lap %d/%d", lap, LAPS_TO_WIN), 250, 215, 30, RAYWHITE);
	DrawText(TextFormat("Pos %d/%d", Position(player), (int)cars.size()), 250, 250, 30, RAYWHITE);

	// Current lap time and best of the session
	double current = (state == RACE_RUNNING) ? player->lap_timer.ReadSec() : 0.0;
	DrawText(TextFormat("Time %.2f", current), 250, 290, 24, RAYWHITE);

	if (player->last_lap >= 0.0)
		DrawText(TextFormat("Last %.2f", player->last_lap), 250, 318, 24, RAYWHITE);

	if (best_lap_session >= 0.0)
		DrawText(TextFormat("Best %.2f", best_lap_session), 250, 346, 24, GOLD);
	else
		DrawText("Best --", 250, 346, 24, GOLD);

	// Nitro
	float cooldown = player->NitroCooldown();
	if (cooldown > 0.0f)
		DrawText(TextFormat("Nitro %.1f", cooldown), 250, 380, 24, GRAY);
	else
		DrawText("Nitro READY (space)", 250, 380, 24, SKYBLUE);

	if (state == RACE_COUNTDOWN)
	{
		int seconds = 3 - (int)countdown.ReadSec();
		DrawText(TextFormat("%d", seconds), SCREEN_WIDTH / 2 - 20, 280, 120, RAYWHITE);
	}

	if (state == RACE_FINISHED)
	{
		const char* result = (player->place == 1) ? "YOU WIN!" : "YOU LOSE";
		DrawText(result, 700, 260, 60, (player->place == 1) ? GOLD : RAYWHITE);
		DrawText(TextFormat("Place %d  -  %.2f s", player->place, race_time), 700, 330, 26, RAYWHITE);
		DrawText("ENTER to race again", 700, 365, 22, RAYWHITE);
	}
}
