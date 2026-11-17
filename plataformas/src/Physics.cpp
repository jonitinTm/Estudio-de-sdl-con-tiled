#include "Physics.h"
#include "Engine.h"
#include "Render.h"
#include "Entity.h"
#include "Log.h"

// PhysBody ---------------------------------------------------------------

void PhysBody::GetPosition(int& x, int& y) const
{
	b2Vec2 pos = b2Body_GetPosition(body);
	x = METERS_TO_PIXELS(pos.x);
	y = METERS_TO_PIXELS(pos.y);
}

float PhysBody::GetRotation() const
{
	return b2Rot_GetAngle(b2Body_GetRotation(body));
}

// Physics ----------------------------------------------------------------

Physics::Physics()
{
	name = "physics";
}

bool Physics::Start()
{
	b2WorldDef worldDef = b2DefaultWorldDef();
	worldDef.gravity = { 0.0f, GRAVITY_Y };
	world = b2CreateWorld(&worldDef);
	return true;
}

bool Physics::PreUpdate()
{
	DestroyPendingBodies();

	// Fixed time step (L03 / L08): as many steps of 1/60 s as fit in the time of the last frame
	accumulator += Engine::GetInstance().GetDt() / 1000.0f;
	int steps = 0;
	while (accumulator >= PHYSICS_DT && steps < 5)
	{
		b2World_Step(world, PHYSICS_DT, 4);
		ProcessContactEvents();
		accumulator -= PHYSICS_DT;
		steps++;
	}
	if (steps == 5) accumulator = 0.0f;   // too slow: do not try to catch up forever
	return true;
}

// Box2D 3 does not call us during the step: after it, we ask for the list of events
void Physics::ProcessContactEvents()
{
	// Solid contacts (player <-> platform, player <-> enemy...)
	b2ContactEvents contacts = b2World_GetContactEvents(world);
	for (int i = 0; i < contacts.beginCount; ++i)
	{
		const b2ContactBeginTouchEvent& e = contacts.beginEvents[i];
		if (!b2Shape_IsValid(e.shapeIdA) || !b2Shape_IsValid(e.shapeIdB)) continue;
		PhysBody* a = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdA));
		PhysBody* b = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdB));
		if (a == nullptr || b == nullptr || a->pendingToDelete || b->pendingToDelete) continue;
		if (a->listener) a->listener->OnCollision(a, b);
		if (b->listener) b->listener->OnCollision(b, a);
	}
	for (int i = 0; i < contacts.endCount; ++i)
	{
		const b2ContactEndTouchEvent& e = contacts.endEvents[i];
		if (!b2Shape_IsValid(e.shapeIdA) || !b2Shape_IsValid(e.shapeIdB)) continue;
		PhysBody* a = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdA));
		PhysBody* b = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdB));
		if (a == nullptr || b == nullptr) continue;
		if (a->listener) a->listener->OnCollisionEnd(a, b);
		if (b->listener) b->listener->OnCollisionEnd(b, a);
	}

	// Sensors (coins, death zones, goal): only tell the visitor and the sensor owner
	b2SensorEvents sensors = b2World_GetSensorEvents(world);
	for (int i = 0; i < sensors.beginCount; ++i)
	{
		const b2SensorBeginTouchEvent& e = sensors.beginEvents[i];
		if (!b2Shape_IsValid(e.sensorShapeId) || !b2Shape_IsValid(e.visitorShapeId)) continue;
		PhysBody* sensor = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.sensorShapeId));
		PhysBody* visitor = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.visitorShapeId));
		if (sensor == nullptr || visitor == nullptr || sensor->pendingToDelete || visitor->pendingToDelete) continue;
		if (sensor->listener) sensor->listener->OnCollision(sensor, visitor);
		if (visitor->listener) visitor->listener->OnCollision(visitor, sensor);
	}
}

bool Physics::PostUpdate()
{
	if (!debug) return true;

	// F9: draw every collider. Green = solid, yellow = sensor
	const Render& render = *Engine::GetInstance().render;
	for (PhysBody* pbody : bodies)
	{
		if (pbody->pendingToDelete) continue;
		int x, y;
		pbody->GetPosition(x, y);

		b2ShapeId shape;
		b2Body_GetShapes(pbody->body, &shape, 1);
		bool sensor = b2Shape_IsSensor(shape);
		Uint8 r = sensor ? 255 : 0, g = 255, b = 0;

		if (b2Shape_GetType(shape) == b2_circleShape)
		{
			// a circle as a 16-sided polygon
			float radius = (float)pbody->width / 2.0f;
			for (int i = 0; i < 16; ++i)
			{
				float a1 = i * 2.0f * B2_PI / 16, a2 = (i + 1) * 2.0f * B2_PI / 16;
				render.DrawLine(x + (int)(radius * cosf(a1)), y + (int)(radius * sinf(a1)),
				                x + (int)(radius * cosf(a2)), y + (int)(radius * sinf(a2)), r, g, b);
			}
		}
		else
		{
			SDL_Rect rect = { x - pbody->width / 2, y - pbody->height / 2, pbody->width, pbody->height };
			render.DrawRectangle(rect, r, g, b, 255, false);
		}
	}
	return true;
}

bool Physics::CleanUp()
{
	for (PhysBody* pbody : bodies) delete pbody;
	bodies.clear();
	if (B2_IS_NON_NULL(world)) b2DestroyWorld(world);   // destroys every Box2D body at once
	world = b2_nullWorldId;
	return true;
}

PhysBody* Physics::AddBody(b2BodyId body, int width, int height)
{
	PhysBody* pbody = new PhysBody();
	pbody->body = body;
	pbody->width = width;
	pbody->height = height;
	b2Body_SetUserData(body, pbody);   // from the Box2D body we can get back to our PhysBody
	bodies.push_back(pbody);
	return pbody;
}

static b2BodyType ToBox2D(BodyType type)
{
	switch (type)
	{
	case BodyType::STATIC: return b2_staticBody;
	case BodyType::KINEMATIC: return b2_kinematicBody;
	default: return b2_dynamicBody;
	}
}

PhysBody* Physics::CreateRectangle(int x, int y, int width, int height, BodyType type)
{
	b2BodyDef bodyDef = b2DefaultBodyDef();
	bodyDef.type = ToBox2D(type);
	bodyDef.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
	bodyDef.fixedRotation = true;                       // platformer bodies do not roll
	b2BodyId body = b2CreateBody(world, &bodyDef);

	b2Polygon box = b2MakeBox(PIXEL_TO_METERS(width) * 0.5f, PIXEL_TO_METERS(height) * 0.5f);   // half sizes!
	b2ShapeDef shapeDef = b2DefaultShapeDef();
	shapeDef.density = 1.0f;
	shapeDef.material.friction = 0.0f;                  // no friction: the player does not stick to walls
	shapeDef.enableContactEvents = true;
	shapeDef.enableSensorEvents = true;                 // Box2D 3.1: needed to be detected by sensors
	b2CreatePolygonShape(body, &shapeDef, &box);

	return AddBody(body, width, height);
}

PhysBody* Physics::CreateCircle(int x, int y, int radius, BodyType type)
{
	b2BodyDef bodyDef = b2DefaultBodyDef();
	bodyDef.type = ToBox2D(type);
	bodyDef.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
	bodyDef.fixedRotation = true;
	b2BodyId body = b2CreateBody(world, &bodyDef);

	b2Circle circle = { { 0.0f, 0.0f }, PIXEL_TO_METERS(radius) };
	b2ShapeDef shapeDef = b2DefaultShapeDef();
	shapeDef.density = 1.0f;
	shapeDef.enableContactEvents = true;
	shapeDef.enableSensorEvents = true;
	b2CreateCircleShape(body, &shapeDef, &circle);

	return AddBody(body, radius * 2, radius * 2);
}

PhysBody* Physics::CreateRectangleSensor(int x, int y, int width, int height, BodyType type)
{
	b2BodyDef bodyDef = b2DefaultBodyDef();
	bodyDef.type = ToBox2D(type);
	bodyDef.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
	b2BodyId body = b2CreateBody(world, &bodyDef);

	b2Polygon box = b2MakeBox(PIXEL_TO_METERS(width) * 0.5f, PIXEL_TO_METERS(height) * 0.5f);
	b2ShapeDef shapeDef = b2DefaultShapeDef();
	shapeDef.isSensor = true;                           // detects, does not push
	shapeDef.enableSensorEvents = true;
	b2CreatePolygonShape(body, &shapeDef, &box);

	return AddBody(body, width, height);
}

void Physics::DeletePhysBody(PhysBody* pbody)
{
	if (pbody != nullptr) pbody->pendingToDelete = true;
}

void Physics::DestroyPendingBodies()
{
	for (auto it = bodies.begin(); it != bodies.end();)
	{
		PhysBody* pbody = *it;
		if (pbody->pendingToDelete)
		{
			b2DestroyBody(pbody->body);   // Box2D frees its body and shapes
			delete pbody;                 // we free our wrapper
			it = bodies.erase(it);
		}
		else ++it;
	}
}

bool Physics::IsOnGround(const PhysBody* pbody) const
{
	b2ContactData contacts[8];
	int count = b2Body_GetContactData(pbody->body, contacts, 8);
	for (int i = 0; i < count; ++i)
	{
		if (contacts[i].manifold.pointCount == 0) continue;
		// The normal goes from shape A to shape B. If we are B, turn it around
		b2Vec2 normal = contacts[i].manifold.normal;
		if (B2_ID_EQUALS(b2Shape_GetBody(contacts[i].shapeIdB), pbody->body)) normal = b2Neg(normal);
		if (normal.y > 0.5f) return true;   // the other body is below us (Y grows downwards)
	}
	return false;
}

b2Vec2 Physics::GetLinearVelocity(const PhysBody* pbody) const
{
	return b2Body_GetLinearVelocity(pbody->body);
}

void Physics::SetLinearVelocity(PhysBody* pbody, b2Vec2 velocity)
{
	b2Body_SetLinearVelocity(pbody->body, velocity);
}

void Physics::ApplyLinearImpulse(PhysBody* pbody, b2Vec2 impulse)
{
	b2Body_ApplyLinearImpulseToCenter(pbody->body, impulse, true);
}

void Physics::SetPosition(PhysBody* pbody, int x, int y)
{
	b2Body_SetTransform(pbody->body, { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) }, b2Rot_identity);
	b2Body_SetLinearVelocity(pbody->body, { 0.0f, 0.0f });
	b2Body_SetAwake(pbody->body, true);   // a sleeping body would stay floating where we put it
}
