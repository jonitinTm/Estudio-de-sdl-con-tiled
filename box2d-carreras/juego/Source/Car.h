#pragma once

#include "PhysicEntity.h"
#include "Timer.h"

// Top view car. The driving physics live here, once.
// PlayerCar and AICar only decide the throttle and the steering.
class Car : public PhysicEntity
{
public:
	Car(ModulePhysics* physics, int x, int y, float angle, Color _color);

	// Friction + Control() + engine + steering. Call it once per frame while racing
	void Update() override;
	void Draw() const;

	// Back to the grid: position, speed and race state
	virtual void Reset(int x, int y, float angle);

	// The car crossed the finish line with all the checkpoints done
	void LapCompleted();

	// m/s along the nose of the car. Negative when going backwards
	float GetForwardSpeed() const;

protected:
	// throttle: +1 gas, -1 brake/reverse. steer: -1 left, +1 right
	virtual void Control(float& throttle, float& steer) = 0;

	b2Vec2 GetForward() const;
	b2Vec2 GetRight() const;
	b2Vec2 GetLateralVelocity() const;

	void UpdateFriction();
	void Drive(float throttle);
	void Steer(float steer);

public:
	// Race state -------------------------
	int lap = 0;
	int next_checkpoint = 1;   // we start just after the finish line (checkpoint 0)
	bool finished = false;
	int place = 0;             // 1 = winner. 0 while racing
	Timer lap_timer;
	double last_lap = -1.0;    // seconds. -1 = none yet
	double best_lap = -1.0;

	// Zones ------------------------------
	int in_oil = 0;            // number of oil sensors touching the car
	float boost_time = 0.0f;   // seconds of boost left

	// Driving ----------------------------
	bool handbrake = false;
	bool drifting = false;
	float speed_factor = 1.0f; // rubber banding: scales max_speed

	// Tuning. Accelerations instead of forces: they do not depend on the mass of the car
	float engine_accel = 14.0f;      // m/s^2
	float brake_accel = 20.0f;       // m/s^2
	float reverse_accel = 6.0f;      // m/s^2
	float boost_accel = 25.0f;       // m/s^2
	float max_speed = 7.5f;          // m/s
	float max_back_speed = 2.0f;     // m/s
	float max_lateral_dv = 0.35f;    // m/s of lateral speed the tyres can kill in one step
	float turn_speed = 3.2f;         // rad/s
	float drag = 0.6f;               // 1/s

	Color color;

	static const int half_width = 10;   // pixels
	static const int half_height = 20;  // pixels
};

// Driven with the keyboard
class PlayerCar : public Car
{
public:
	PlayerCar(ModulePhysics* physics, int x, int y, float angle, Color _color);

	void Reset(int x, int y, float angle) override;

	// Seconds until the nitro can be used again
	float NitroCooldown() const;

	// True during the frame the nitro was fired: ModuleGame plays the sound
	bool nitro_fired = false;

protected:
	void Control(float& throttle, float& steer) override;

private:
	Timer nitro_timer;
	bool nitro_ready = true;
};

// Follows a list of waypoints
class AICar : public Car
{
public:
	// points: x0, y0, x1, y1... in pixels. count: number of waypoints
	AICar(ModulePhysics* physics, int x, int y, float angle, Color _color, const int* points, int count, PhysBody* wall_a, PhysBody* wall_b);

	void Reset(int x, int y, float angle) override;

protected:
	void Control(float& throttle, float& steer) override;

private:
	// Distance in pixels to the closest wall along a ray from the car, -1 if none
	int Whisker(float local_x, float local_y, int length) const;

	const int* waypoints;
	int waypoint_count;
	int target = 0;
	PhysBody* walls[2];
};
