#include "Player.h"
#include "Engine.h"
#include "Textures.h"
#include "Render.h"
#include "Input.h"
#include "Audio.h"
#include "Physics.h"
#include "Scene.h"
#include "Enemy.h"
#include "Log.h"

Player::Player() : Entity(EntityType::PLAYER)
{
	name = "Player";
}

bool Player::Awake()
{
	// Parameters from config.xml: <scene><entities><player> (L05, L10)
	speed = parameters.child("movement").attribute("speed").as_float(6.0f);
	jumpSpeed = parameters.child("movement").attribute("jump").as_float(12.5f);
	bodyW = parameters.child("body").attribute("width").as_int(20);
	bodyH = parameters.child("body").attribute("height").as_int(36);
	maxLives = lives = parameters.child("lives").attribute("value").as_int(3);
	return true;
}

bool Player::Start()
{
	Engine& engine = Engine::GetInstance();

	texture = engine.textures->Load(parameters.child("texture").attribute("path").as_string());
	std::map<int, std::string> aliases = { { 0, "idle" }, { 16, "run" }, { 20, "jump" }, { 48, "hurt" }, { 56, "death" } };
	anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), aliases);
	anims.SetLoop("hurt", false);
	anims.SetLoop("death", false);
	anims.SetCurrent("idle");

	// position = center of the body, in pixels
	pbody = engine.physics->CreateRectangle((int)position.getX(), (int)position.getY(), bodyW, bodyH, BodyType::DYNAMIC);
	pbody->listener = this;            // tell me about my collisions
	pbody->ctype = ColliderType::PLAYER;

	pugi::xml_node fx = engine.scene->configParameters.child("fx");
	jumpFx = engine.audio->LoadFx(fx.attribute("jump").as_string());
	hurtFx = engine.audio->LoadFx(fx.attribute("hurt").as_string());
	stompFx = engine.audio->LoadFx(fx.attribute("stomp").as_string());
	return true;
}

bool Player::Update(float dt)
{
	Physics& physics = *Engine::GetInstance().physics;

	if (pendingRespawn)
	{
		// Collisions only write down what happened; we act here (L08)
		pendingRespawn = false;
		Vector2D spawn = Engine::GetInstance().scene->GetCheckpoint();
		Respawn((int)spawn.getX(), (int)spawn.getY());
	}

	if (invulnerable && hurtTimer.ReadSec() >= invulnerableSec) invulnerable = false;

	if (!dead)
	{
		grounded = physics.IsOnGround(pbody);
		if (grounded) airTimer.Start();

		if (!Engine::GetInstance().scene->IsPlaying())
			physics.SetLinearVelocity(pbody, { 0.0f, physics.GetLinearVelocity(pbody).y });   // title screen: no control
		else if (godMode) GodMove();
		else
		{
			Move();
			Jump();
		}
	}
	else
	{
		physics.SetLinearVelocity(pbody, { 0.0f, physics.GetLinearVelocity(pbody).y });
	}

	UpdateAnimation(dt);
	Draw();
	return true;
}

void Player::Move()
{
	Physics& physics = *Engine::GetInstance().physics;
	Input& input = *Engine::GetInstance().input;

	// Keep the vertical speed (gravity, jump) and decide the horizontal one
	b2Vec2 velocity = physics.GetLinearVelocity(pbody);
	velocity.x = 0.0f;
	if (input.GetKey(SDL_SCANCODE_A) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_LEFT) == KEY_REPEAT) { velocity.x = -speed; facingLeft = true; }
	if (input.GetKey(SDL_SCANCODE_D) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_RIGHT) == KEY_REPEAT) { velocity.x = speed; facingLeft = false; }

	// Knocked back after a hit: let the impulse act for a moment
	if (invulnerable && hurtTimer.ReadSec() < 0.25f) velocity.x = physics.GetLinearVelocity(pbody).x;

	physics.SetLinearVelocity(pbody, velocity);
}

void Player::Jump()
{
	Physics& physics = *Engine::GetInstance().physics;
	Input& input = *Engine::GetInstance().input;
	b2Vec2 velocity = physics.GetLinearVelocity(pbody);

	// Coyote time: 0.1 s after leaving a platform you can still jump
	bool canJump = grounded || airTimer.ReadSec() < 0.1f;
	if (input.GetKey(SDL_SCANCODE_SPACE) == KEY_DOWN && canJump && velocity.y > -1.0f)
	{
		velocity.y = -jumpSpeed;            // up is negative Y
		physics.SetLinearVelocity(pbody, velocity);
		Engine::GetInstance().audio->PlayFx(jumpFx);
		// velocity.y > -1 in the condition: the coyote time cannot give a second jump
	}

	// Variable jump: release space early and the jump is shorter
	if (input.GetKey(SDL_SCANCODE_SPACE) == KEY_UP && velocity.y < 0.0f)
	{
		velocity.y *= 0.5f;
		physics.SetLinearVelocity(pbody, velocity);
	}
}

void Player::GodMove()
{
	Input& input = *Engine::GetInstance().input;
	b2Vec2 velocity = { 0.0f, 0.0f };
	float s = speed * 1.5f;
	if (input.GetKey(SDL_SCANCODE_A) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_LEFT) == KEY_REPEAT) { velocity.x = -s; facingLeft = true; }
	if (input.GetKey(SDL_SCANCODE_D) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_RIGHT) == KEY_REPEAT) { velocity.x = s; facingLeft = false; }
	if (input.GetKey(SDL_SCANCODE_W) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_UP) == KEY_REPEAT) velocity.y = -s;
	if (input.GetKey(SDL_SCANCODE_S) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_DOWN) == KEY_REPEAT) velocity.y = s;
	Engine::GetInstance().physics->SetLinearVelocity(pbody, velocity);
}

void Player::ToggleGodMode()
{
	godMode = !godMode;
	// God mode: fly through the level ignoring gravity
	b2Body_SetGravityScale(pbody->body, godMode ? 0.0f : 1.0f);
	LOG("God mode %s", godMode ? "ON" : "OFF");
}

void Player::OnCollision(PhysBody* physA, PhysBody* physB)
{
	if (dead) return;

	switch (physB->ctype)
	{
	case ColliderType::DEATH:
		if (!godMode) Hurt(true);
		break;

	case ColliderType::GOAL:
		reachedGoal = true;
		break;

	case ColliderType::ENEMY:
	{
		Enemy* enemy = dynamic_cast<Enemy*>(physB->listener);
		if (enemy == nullptr || enemy->IsDying()) break;

		// Stomp: our feet are at the height of the top of the enemy (a few pixels of margin).
		// Do not use the vertical speed: when this event arrives, Box2D has already solved
		// the collision and our speed is ~0
		int px, py, ex, ey;
		pbody->GetPosition(px, py);
		physB->GetPosition(ex, ey);
		int feet = py + bodyH / 2;
		int enemyTop = ey - physB->height / 2;
		if (feet <= enemyTop + 4)
		{
			enemy->Kill();
			Engine::GetInstance().audio->PlayFx(stompFx);
			b2Vec2 v = Engine::GetInstance().physics->GetLinearVelocity(pbody);
			v.y = -jumpSpeed * 0.6f;   // bounce
			Engine::GetInstance().physics->SetLinearVelocity(pbody, v);
		}
		else if (!godMode)
		{
			Hurt(false);
			// knock back away from the enemy
			float dir = (px < ex) ? -1.0f : 1.0f;
			Engine::GetInstance().physics->SetLinearVelocity(pbody, { dir * 7.0f, -6.0f });
		}
		break;
	}

	default:
		break;
	}
}

void Player::Hurt(bool instantDeath)
{
	// Invulnerable for a while after a hit (falling into a pit always counts)
	if (!instantDeath && invulnerable) return;

	lives--;
	invulnerable = true;
	hurtTimer.Start();
	Engine::GetInstance().audio->PlayFx(hurtFx);

	if (lives <= 0)
	{
		lives = 0;
		dead = true;
		anims.SetCurrent("death");
	}
	else if (instantDeath)
	{
		pendingRespawn = true;   // never teleport a body inside a collision callback
	}
}

void Player::Respawn(int x, int y)
{
	Engine::GetInstance().physics->SetPosition(pbody, x, y);
	anims.SetCurrent("idle");
}

void Player::ResetForNewGame(int x, int y)
{
	lives = maxLives;
	dead = false;
	invulnerable = false;
	reachedGoal = false;
	pendingRespawn = false;
	facingLeft = false;
	Respawn(x, y);
}

void Player::UpdateAnimation(float dt)
{
	if (dead) anims.SetCurrent("death");
	else if (invulnerable && hurtTimer.ReadSec() < 0.3f) anims.SetCurrent("hurt");
	else if (!grounded && !godMode) anims.SetCurrent("jump");
	else if (Engine::GetInstance().physics->GetLinearVelocity(pbody).x != 0.0f) anims.SetCurrent("run");
	else anims.SetCurrent("idle");

	anims.Update(dt);
}

void Player::Draw()
{
	int x, y;
	pbody->GetPosition(x, y);
	position = Vector2D((float)x, (float)y);

	// Blink while invulnerable (not drawn every other 100 ms)
	if (invulnerable && !dead && ((int)(hurtTimer.ReadMSec() / 100.0f) % 2 == 1)) return;

	// The frame is 40x44 and the knight stands on the pixel row 40: align it with the bottom of the body
	const SDL_Rect& frame = anims.GetCurrentFrame();
	Engine::GetInstance().render->DrawTexture(texture, x - 21, y + bodyH / 2 - 40, &frame, 1.0f, 0.0, facingLeft);
}

void Player::GetBodyPosition(int& x, int& y) const
{
	pbody->GetPosition(x, y);
}

bool Player::CleanUp()
{
	Engine::GetInstance().textures->UnLoad(texture);
	Engine::GetInstance().physics->DeletePhysBody(pbody);
	return true;
}
