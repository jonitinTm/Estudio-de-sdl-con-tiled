#include "Globals.h"
#include "Car.h"

#include <math.h>

// Car ---------------------------------------------------------------------

Car::Car(ModulePhysics* physics, int x, int y, float angle, Color _color)
	: PhysicEntity(physics->CreateRectangle(x, y, half_width, half_height))
	, color(_color)
{
	b2Body* b = body->body;
	b->SetTransform(b->GetPosition(), angle);

	// Top view: nothing stops a spinning body. This is our angular friction
	b->SetAngularDamping(3.0f);
}

void Car::Reset(int x, int y, float angle)
{
	b2Body* b = body->body;
	b->SetTransform(b2Vec2(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y)), angle);
	b->SetLinearVelocity(b2Vec2_zero);
	b->SetAngularVelocity(0.0f);
	b->SetAwake(true);

	lap = 0;
	next_checkpoint = 1;
	finished = false;
	place = 0;
	last_lap = -1.0;
	best_lap = -1.0;
	in_oil = 0;
	boost_time = 0.0f;
	handbrake = false;
	drifting = false;
	speed_factor = 1.0f;
}

void Car::LapCompleted()
{
	double t = lap_timer.ReadSec();
	last_lap = t;
	if (best_lap < 0.0 || t < best_lap)
		best_lap = t;

	lap++;
	lap_timer.Start();
}

// The texture of the car points up, and screen Y grows downwards: the nose is (0, -1)
b2Vec2 Car::GetForward() const
{
	return body->body->GetWorldVector(b2Vec2(0.0f, -1.0f));
}

b2Vec2 Car::GetRight() const
{
	return body->body->GetWorldVector(b2Vec2(1.0f, 0.0f));
}

// The part of the velocity that goes sideways: (right . v) * right
b2Vec2 Car::GetLateralVelocity() const
{
	b2Vec2 right = GetRight();
	return b2Dot(right, body->body->GetLinearVelocity()) * right;
}

float Car::GetForwardSpeed() const
{
	return b2Dot(GetForward(), body->body->GetLinearVelocity());
}

void Car::UpdateFriction()
{
	b2Body* b = body->body;
	float mass = b->GetMass();

	// Tyres: kill the lateral velocity with an impulse. impulse = mass * change of velocity
	b2Vec2 impulse = mass * -GetLateralVelocity();

	// ...but only up to a limit. Past it the car drifts
	float max_impulse = mass * max_lateral_dv;
	if (in_oil > 0) max_impulse *= 0.15f;
	if (handbrake) max_impulse *= 0.25f;

	float length = impulse.Length();
	if (length > max_impulse)
	{
		impulse *= max_impulse / length;
		drifting = true;
	}
	else
	{
		drifting = false;
	}
	b->ApplyLinearImpulse(impulse, b->GetWorldCenter(), true);

	// Rolling resistance and air: without it the car never stops
	b->ApplyForceToCenter(-drag * mass * GetForwardSpeed() * GetForward(), true);
}

void Car::Drive(float throttle)
{
	b2Body* b = body->body;
	float speed = GetForwardSpeed();
	float accel = 0.0f;

	if (throttle > 0.0f && speed < max_speed * speed_factor)
		accel = engine_accel;
	else if (throttle < 0.0f && speed > -max_back_speed)
		accel = (speed > 0.5f) ? -brake_accel : -reverse_accel;

	// Boost pads and nitro push even over the top speed
	if (boost_time > 0.0f)
	{
		boost_time -= PHYSICS_DT;
		accel += boost_accel;
	}

	// F = m * a. Forces are cleared after every Step(): apply it every frame
	if (accel != 0.0f)
		b->ApplyForceToCenter(accel * b->GetMass() * GetForward(), true);
}

void Car::Steer(float steer)
{
	if (steer == 0.0f)
		return; // the angular damping straightens the car

	// A car that does not move does not turn. Backwards, the wheel works the other way round
	float speed = GetForwardSpeed();
	float factor = fminf(fabsf(speed) / 2.5f, 1.0f);
	if (speed < 0.0f) factor = -factor;

	body->body->SetAngularVelocity(steer * turn_speed * factor);
}

void Car::Update()
{
	float throttle = 0.0f;
	float steer = 0.0f;

	if (!finished)
		Control(throttle, steer);

	UpdateFriction();
	Drive(throttle);
	Steer(steer);
}

void Car::Draw() const
{
	int x, y;
	body->GetPosition(x, y);
	float degrees = body->GetRotation() * RAD2DEG;

	// Box2D gives the center of the body: origin = center of the rectangle
	Rectangle chassis = { (float)x, (float)y, half_width * 2.0f, half_height * 2.0f };
	DrawRectanglePro(chassis, Vector2{ (float)half_width, (float)half_height }, degrees, color);

	// Windscreen, towards the nose
	Rectangle glass = { (float)x, (float)y, half_width * 2.0f - 6.0f, 9.0f };
	DrawRectanglePro(glass, Vector2{ half_width - 3.0f, half_height - 8.0f }, degrees, Color{ 20, 30, 50, 220 });
}

// PlayerCar ---------------------------------------------------------------

PlayerCar::PlayerCar(ModulePhysics* physics, int x, int y, float angle, Color _color)
	: Car(physics, x, y, angle, _color)
{
}

void PlayerCar::Reset(int x, int y, float angle)
{
	Car::Reset(x, y, angle);
	nitro_ready = true;
	nitro_fired = false;
}

float PlayerCar::NitroCooldown() const
{
	if (nitro_ready)
		return 0.0f;

	float left = 5.0f - (float)nitro_timer.ReadSec();
	return (left > 0.0f) ? left : 0.0f;
}

void PlayerCar::Control(float& throttle, float& steer)
{
	if (IsKeyDown(KEY_UP) || IsKeyDown(KEY_W)) throttle += 1.0f;
	if (IsKeyDown(KEY_DOWN) || IsKeyDown(KEY_S)) throttle -= 1.0f;
	if (IsKeyDown(KEY_LEFT) || IsKeyDown(KEY_A)) steer -= 1.0f;
	if (IsKeyDown(KEY_RIGHT) || IsKeyDown(KEY_D)) steer += 1.0f;

	handbrake = IsKeyDown(KEY_LEFT_SHIFT);

	// Nitro: one second of boost, then 5 seconds to recharge
	if (!nitro_ready && nitro_timer.ReadSec() >= 5.0)
		nitro_ready = true;

	nitro_fired = false;
	if (IsKeyPressed(KEY_SPACE) && nitro_ready)
	{
		boost_time = 1.0f;
		nitro_ready = false;
		nitro_fired = true;
		nitro_timer.Start();
	}
}

// AICar -------------------------------------------------------------------

AICar::AICar(ModulePhysics* physics, int x, int y, float angle, Color _color, const int* points, int count, PhysBody* wall_a, PhysBody* wall_b)
	: Car(physics, x, y, angle, _color)
	, waypoints(points)
	, waypoint_count(count)
{
	walls[0] = wall_a;
	walls[1] = wall_b;
}

void AICar::Reset(int x, int y, float angle)
{
	Car::Reset(x, y, angle);
	target = 0;
}

int AICar::Whisker(float local_x, float local_y, int length) const
{
	int x, y;
	body->GetPosition(x, y);

	b2Vec2 direction = body->body->GetWorldVector(b2Vec2(local_x, local_y));
	direction.Normalize();

	int end_x = x + (int)(direction.x * length);
	int end_y = y + (int)(direction.y * length);

	int closest = -1;
	for (int i = 0; i < 2; ++i)
	{
		float normal_x, normal_y;
		int hit = walls[i]->RayCast(x, y, end_x, end_y, normal_x, normal_y);
		if (hit >= 0 && (closest < 0 || hit < closest))
			closest = hit;
	}
	return closest;
}

void AICar::Control(float& throttle, float& steer)
{
	b2Body* b = body->body;

	b2Vec2 goal(PIXEL_TO_METERS(waypoints[target * 2]), PIXEL_TO_METERS(waypoints[target * 2 + 1]));

	// Close enough: go for the next one
	if ((goal - b->GetPosition()).Length() < 2.2f)
	{
		target = (target + 1) % waypoint_count;
		goal.Set(PIXEL_TO_METERS(waypoints[target * 2]), PIXEL_TO_METERS(waypoints[target * 2 + 1]));
	}

	// The goal seen from the car: x > 0 is to the right, y < 0 is ahead
	b2Vec2 local = b->GetLocalPoint(goal);
	float angle = atan2f(local.x, -local.y); // 0 = straight ahead

	steer = angle * 2.0f;
	throttle = (fabsf(angle) > 0.6f) ? 0.4f : 1.0f;

	// Whiskers: a wall close on one side pushes the steering to the other side
	const int reach = 70;
	int left = Whisker(-0.5f, -1.0f, reach);
	int right = Whisker(0.5f, -1.0f, reach);
	if (left >= 0) steer += 1.5f * (1.0f - (float)left / reach);
	if (right >= 0) steer -= 1.5f * (1.0f - (float)right / reach);

	if (steer > 1.0f) steer = 1.0f;
	if (steer < -1.0f) steer = -1.0f;
}
