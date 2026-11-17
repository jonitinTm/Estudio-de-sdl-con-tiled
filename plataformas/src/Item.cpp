#include "Item.h"
#include "Engine.h"
#include "Textures.h"
#include "Render.h"
#include "Audio.h"
#include "Physics.h"
#include "Scene.h"

Item::Item() : Entity(EntityType::ITEM)
{
	name = "Coin";
}

bool Item::Start()
{
	Engine& engine = Engine::GetInstance();
	texture = engine.textures->Load(parameters.child("texture").attribute("path").as_string());
	anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), { { 0, "spin" } });

	// A sensor: it detects the player but does not stop him
	pbody = engine.physics->CreateRectangleSensor((int)position.getX(), (int)position.getY(), 14, 14, BodyType::STATIC);
	pbody->listener = this;
	pbody->ctype = ColliderType::ITEM;

	coinFx = engine.audio->LoadFx(engine.scene->configParameters.child("fx").attribute("coin").as_string());
	return true;
}

bool Item::Update(float dt)
{
	anims.Update(dt);
	const SDL_Rect& frame = anims.GetCurrentFrame();
	Engine::GetInstance().render->DrawTexture(texture, (int)position.getX() - 8, (int)position.getY() - 8, &frame);
	return true;
}

void Item::OnCollision(PhysBody* physA, PhysBody* physB)
{
	if (physB->ctype != ColliderType::PLAYER || pendingToDelete) return;

	Engine::GetInstance().scene->AddCoin();
	Engine::GetInstance().audio->PlayFx(coinFx);
	pendingToDelete = true;   // the EntityManager deletes it at the end of the frame
}

bool Item::CleanUp()
{
	Engine::GetInstance().textures->UnLoad(texture);
	Engine::GetInstance().physics->DeletePhysBody(pbody);
	return true;
}
