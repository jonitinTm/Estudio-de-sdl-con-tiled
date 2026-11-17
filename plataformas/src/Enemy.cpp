#include "Enemy.h"
#include "Engine.h"
#include "Textures.h"
#include "Render.h"
#include "Physics.h"
#include "Map.h"
#include "Scene.h"
#include "Player.h"

Enemy::Enemy() : Entity(EntityType::ENEMY)
{
	name = "Slime";
}

bool Enemy::Awake()
{
	patrolSpeed = parameters.child("movement").attribute("speed").as_float(2.0f);
	chaseSpeed = parameters.child("movement").attribute("chase").as_float(3.2f);
	sight = parameters.child("movement").attribute("sight").as_int(10);
	return true;
}

bool Enemy::Start()
{
	Engine& engine = Engine::GetInstance();
	texture = engine.textures->Load(parameters.child("texture").attribute("path").as_string());
	anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), { { 0, "idle" }, { 4, "move" }, { 8, "die" } });
	anims.SetLoop("die", false);
	anims.SetCurrent("move");

	pbody = engine.physics->CreateRectangle((int)position.getX(), (int)position.getY(), 16, 12, BodyType::DYNAMIC);
	pbody->listener = this;
	pbody->ctype = ColliderType::ENEMY;
	return true;
}

bool Enemy::Update(float dt)
{
	if (dying)
	{
		anims.Update(dt);
		if (anims.HasFinished()) pendingToDelete = true;
		Draw();
		return true;
	}

	if (thinkTimer.ReadSec() > 0.3f)
	{
		Think();
		thinkTimer.Start();
	}
	Move();

	anims.Update(dt);
	Draw();
	return true;
}

void Enemy::Think()
{
	Engine& engine = Engine::GetInstance();
	const Map& map = *engine.map;

	int x, y, px, py;
	pbody->GetPosition(x, y);
	engine.scene->GetPlayer()->GetBodyPosition(px, py);

	// Everything in tiles (WorldToMap). The slime stands on the cell of its center
	Vector2D me = map.WorldToMap(x, y);
	Vector2D target = map.WorldToMap(px, py + 8);   // the cell of the player's feet

	path.clear();
	chasing = false;
	float dx = target.getX() - me.getX();
	if (fabsf(dx) <= sight && target.getY() == me.getY())
	{
		path = pathfinding.FindPath(map, me, target);
		chasing = path.size() > 1;
	}
}

void Enemy::Move()
{
	Engine& engine = Engine::GetInstance();
	const Map& map = *engine.map;
	int x, y;
	pbody->GetPosition(x, y);
	Vector2D me = map.WorldToMap(x, y);

	float vx;
	if (chasing)
	{
		// Go to the center of the next cell of the path
		Vector2D next = path[1];
		int targetX = (int)map.MapToWorld((int)next.getX(), 0).getX() + map.GetTileWidth() / 2;
		direction = (targetX > x) ? 1 : -1;
		vx = direction * chaseSpeed;
	}
	else
	{
		// Patrol: turn around at the end of the platform or against a wall.
		// Look 10 px ahead of the center: if that cell is not walkable, turn
		int aheadCell = (x + direction * 10) / map.GetTileWidth();
		if (!map.IsWalkable(aheadCell, (int)me.getY())) direction = -direction;
		vx = direction * patrolSpeed;
	}

	b2Vec2 velocity = engine.physics->GetLinearVelocity(pbody);
	engine.physics->SetLinearVelocity(pbody, { vx, velocity.y });
}

void Enemy::GetBodyPosition(int& x, int& y) const
{
	pbody->GetPosition(x, y);
}

void Enemy::Kill()
{
	if (dying) return;
	dying = true;
	anims.SetCurrent("die");
	// No more collisions: the body is destroyed now (at the next PreUpdate); the animation still plays
	Engine::GetInstance().physics->DeletePhysBody(pbody);
}

void Enemy::Draw()
{
	if (!dying) pbody->GetPosition(deadX, deadY);
	const SDL_Rect& frame = anims.GetCurrentFrame();
	// Frame of 24x24 with the slime on the bottom row: align it with the bottom of the 12 px body
	Engine::GetInstance().render->DrawTexture(texture, deadX - 12, deadY + 6 - 24, &frame, 1.0f, 0.0, direction < 0);
}

bool Enemy::CleanUp()
{
	Engine::GetInstance().textures->UnLoad(texture);
	if (!dying) Engine::GetInstance().physics->DeletePhysBody(pbody);
	return true;
}
