#pragma once

#include "Globals.h"
#include "Module.h"
#include "Timer.h"

#include <vector>

class PhysBody;
class Car;
class PlayerCar;

enum RaceState
{
	RACE_COUNTDOWN,
	RACE_RUNNING,
	RACE_FINISHED
};

class ModuleGame : public Module
{
public:
	ModuleGame(Application* app, bool start_enabled = true);
	~ModuleGame();

	bool Start();
	update_status Update();
	bool CleanUp();

	void OnCollision(PhysBody* bodyA, PhysBody* bodyB) override;
	void OnCollisionEnd(PhysBody* bodyA, PhysBody* bodyB) override;

private:
	// Everybody back to the grid. The best lap of the session is kept
	void StartRace();

	// NULL if pbody is not a car
	Car* FindCar(PhysBody* pbody) const;

	// -1 if pbody is not a checkpoint
	int FindCheckpoint(PhysBody* pbody) const;

	// How far a car is in the race: laps, checkpoints and distance to the next one
	float Progress(const Car* car) const;

	// 1 = first
	int Position(const Car* car) const;

	void DrawTrack() const;
	void DrawHUD() const;

private:
	std::vector<Car*> cars;      // cars[0] is the player
	PlayerCar* player;

	PhysBody* walls_outer;
	PhysBody* walls_inner;
	std::vector<PhysBody*> checkpoints;
	PhysBody* boost_pad;
	PhysBody* oil;

	RaceState state;
	Timer countdown;
	Timer race_timer;
	double race_time;            // total time of the player when the race ended
	int finished_count;
	double best_lap_session;     // seconds. -1 = none yet

	uint32 lap_fx;
	uint32 boost_fx;
	uint32 crash_fx;
	Timer crash_timer;           // do not play the crash sound every frame
};
