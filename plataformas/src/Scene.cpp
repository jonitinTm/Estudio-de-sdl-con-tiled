#include "Scene.h"
#include "Engine.h"
#include "Input.h"
#include "Render.h"
#include "Window.h"
#include "Audio.h"
#include "Map.h"
#include "Physics.h"
#include "EntityManager.h"
#include "Player.h"
#include "Item.h"
#include "Enemy.h"
#include "Log.h"

#include <string>

Scene::Scene()
{
	name = "scene";
}

bool Scene::Awake()
{
	// The player is created here; the EntityManager calls its Awake/Start later (L04)
	player = std::dynamic_pointer_cast<Player>(Engine::GetInstance().entityManager->CreateEntity(EntityType::PLAYER));
	player->SetParameters(configParameters.child("entities").child("player"));
	return true;
}

bool Scene::Start()
{
	Engine& engine = Engine::GetInstance();
	engine.render->SetBackgroundColor({ 132, 196, 230, 255 });   // sky

	pugi::xml_node mapNode = configParameters.child("map");
	if (!engine.map->Load(mapNode.attribute("path").as_string(), mapNode.attribute("name").as_string()))
		return false;

	// Spawn point: object of type "Player" in Tiled (top-left corner -> center of the body)
	std::vector<MapObject> starts = engine.map->GetObjects("Player");
	if (!starts.empty()) spawn = Vector2D(starts[0].x + starts[0].width / 2, starts[0].y + starts[0].height / 2);
	checkpoint = spawn;
	player->position = spawn;

	SpawnEntities();

	pugi::xml_node fx = configParameters.child("fx");
	selectFx = engine.audio->LoadFx(fx.attribute("select").as_string());
	winFx = engine.audio->LoadFx(fx.attribute("win").as_string());
	return true;
}

void Scene::SpawnEntities()
{
	Engine& engine = Engine::GetInstance();
	pugi::xml_node entities = configParameters.child("entities");

	std::vector<MapObject> coinObjects = engine.map->GetObjects("Coin");
	totalCoins = (int)coinObjects.size();
	for (const MapObject& o : coinObjects)
	{
		auto item = engine.entityManager->CreateEntity(EntityType::ITEM);
		item->SetParameters(entities.child("coin"));
		item->position = Vector2D(o.x + o.width / 2, o.y + o.height / 2);
	}

	for (const MapObject& o : engine.map->GetObjects("Enemy"))
	{
		auto enemy = engine.entityManager->CreateEntity(EntityType::ENEMY);
		enemy->SetParameters(entities.child("enemy"));
		enemy->position = Vector2D(o.x + o.width / 2, o.y + o.height / 2);
	}
}

void Scene::NewGame()
{
	Engine& engine = Engine::GetInstance();
	engine.entityManager->DestroyAll(EntityType::ITEM);
	engine.entityManager->DestroyAll(EntityType::ENEMY);
	SpawnEntities();   // created now, started by the EntityManager in its next Update

	coins = 0;
	checkpoint = spawn;
	player->ResetForNewGame((int)spawn.getX(), (int)spawn.getY());
	levelTimer.Start();
	state = GameState::PLAYING;
}

bool Scene::Update(float dt)
{
	Engine& engine = Engine::GetInstance();
	Input& input = *engine.input;

	switch (state)
	{
	case GameState::TITLE:
		if (input.GetKey(SDL_SCANCODE_RETURN) == KEY_DOWN)
		{
			engine.audio->PlayFx(selectFx);
			NewGame();
		}
		break;

	case GameState::PLAYING:
		UpdateCheckpoints();
		if (player->IsDead())
		{
			state = GameState::GAME_OVER;
		}
		else if (player->reachedGoal)
		{
			finalTime = levelTimer.ReadSec();
			engine.audio->PlayFx(winFx);
			state = GameState::WIN;
		}
		break;

	case GameState::GAME_OVER:
	case GameState::WIN:
		if (input.GetKey(SDL_SCANCODE_RETURN) == KEY_DOWN)
		{
			engine.audio->PlayFx(selectFx);
			NewGame();
		}
		break;
	}

	DebugKeys();
	UpdateCamera();
	DrawFlags();
	return true;
}

// The goal and the checkpoints are objects of the map: we draw them as a pole with a flag
void Scene::DrawFlags()
{
	Render& render = *Engine::GetInstance().render;
	const Map& map = *Engine::GetInstance().map;

	for (const MapObject& o : map.GetObjects("Checkpoint"))
	{
		int x = (int)(o.x + o.width / 2), bottom = (int)(o.y + o.height);
		bool active = checkpoint.getX() == x;
		render.DrawRectangle({ x - 2, bottom - 56, 4, 56 }, 90, 60, 40);
		if (active) render.DrawRectangle({ x + 2, bottom - 56, 22, 14 }, 60, 200, 80);
		else render.DrawRectangle({ x + 2, bottom - 56, 22, 14 }, 160, 160, 160);
	}

	for (const MapObject& o : map.GetObjects("Goal"))
	{
		int x = (int)(o.x + o.width / 2), bottom = (int)(o.y + o.height);
		render.DrawRectangle({ x - 3, bottom - 96, 6, 96 }, 230, 230, 230);
		render.DrawRectangle({ x + 3, bottom - 96, 34, 22 }, 230, 50, 60);
		render.DrawRectangle({ x - 6, bottom - 100, 12, 8 }, 250, 210, 60);
	}
}

void Scene::UpdateCheckpoints()
{
	int px, py;
	player->GetBodyPosition(px, py);
	// A checkpoint is active once the player has walked past it
	for (const MapObject& o : Engine::GetInstance().map->GetObjects("Checkpoint"))
	{
		Vector2D point(o.x + o.width / 2, o.y + o.height / 2);
		if (px > point.getX() && point.getX() > checkpoint.getX()) checkpoint = point;
	}
}

void Scene::UpdateCamera()
{
	Engine& engine = Engine::GetInstance();
	SDL_Rect& camera = engine.render->camera;
	Vector2D mapSize = engine.map->GetMapSizeInPixels();

	int px, py;
	player->GetBodyPosition(px, py);

	// Center the player, but never show outside the map (L10). The camera is negative
	float camX = px - camera.w / 2.0f;
	float camY = py - camera.h / 2.0f;
	if (camX < 0) camX = 0;
	if (camY < 0) camY = 0;
	if (camX > mapSize.getX() - camera.w) camX = mapSize.getX() - camera.w;
	if (camY > mapSize.getY() - camera.h) camY = mapSize.getY() - camera.h;
	camera.x = -(int)camX;
	camera.y = -(int)camY;
}

void Scene::DebugKeys()
{
	Engine& engine = Engine::GetInstance();
	Input& input = *engine.input;

	if (input.GetKey(SDL_SCANCODE_H) == KEY_DOWN) showHelp = !showHelp;
	if (input.GetKey(SDL_SCANCODE_F9) == KEY_DOWN) engine.physics->ToggleDebug();
	if (input.GetKey(SDL_SCANCODE_F10) == KEY_DOWN) player->ToggleGodMode();
	if (input.GetKey(SDL_SCANCODE_F11) == KEY_DOWN) engine.ToggleFrameCap();
	if (input.GetKey(SDL_SCANCODE_F5) == KEY_DOWN && state == GameState::PLAYING) SaveGame();
	if (input.GetKey(SDL_SCANCODE_F6) == KEY_DOWN && state == GameState::PLAYING) LoadGame();
	if (input.GetKey(SDL_SCANCODE_F1) == KEY_DOWN) NewGame();
	if (input.GetKey(SDL_SCANCODE_F12) == KEY_DOWN)
	{
		std::string file = "screenshot_" + std::to_string(screenshotCount++) + ".bmp";
		engine.render->SaveScreenshot(file.c_str());
	}
}

// Serialization (L05): the state of the game in an XML file
bool Scene::SaveGame()
{
	pugi::xml_document doc;
	pugi::xml_node game = doc.append_child("game");

	int px, py;
	player->GetBodyPosition(px, py);
	pugi::xml_node p = game.append_child("player");
	p.append_attribute("x") = px;
	p.append_attribute("y") = py;
	p.append_attribute("lives") = player->lives;
	game.append_child("coins").append_attribute("value") = coins;
	game.append_child("time").append_attribute("value") = levelTimer.ReadSec();

	bool ok = doc.save_file("savegame.xml");
	LOG("Game %s", ok ? "saved" : "could not be saved");
	return ok;
}

bool Scene::LoadGame()
{
	pugi::xml_document doc;
	if (!doc.load_file("savegame.xml"))
	{
		LOG("No savegame.xml yet: press F5 first");
		return false;
	}

	pugi::xml_node p = doc.child("game").child("player");
	player->lives = p.attribute("lives").as_int(player->lives);
	player->Respawn(p.attribute("x").as_int(), p.attribute("y").as_int());
	coins = doc.child("game").child("coins").attribute("value").as_int();
	LOG("Game loaded");
	return true;
}

bool Scene::PostUpdate()
{
	DrawHUD();
	// ESC closes the game: returning false stops the engine loop
	if (Engine::GetInstance().input->GetKey(SDL_SCANCODE_ESCAPE) == KEY_DOWN) return false;
	if (Engine::GetInstance().input->GetWindowClose()) return false;
	return true;
}

void Scene::DrawHUD()
{
	Render& render = *Engine::GetInstance().render;
	int w = render.camera.w, h = render.camera.h;

	if (state == GameState::TITLE)
	{
		render.DrawRectangle({ 0, 0, w, h }, 0, 0, 0, 140, true, false);
		render.DrawText("KNIGHT PLATFORMER", w / 2 - 17 * 8 * 5 / 2, 200, 5.0f, 255, 220, 120);
		render.DrawText("Collect the coins, stomp the slimes, reach the flag", w / 2 - 51 * 8 * 2 / 2, 300, 2.0f, 255, 255, 255);
		render.DrawText("A/D or arrows: move    SPACE: jump    H: help", w / 2 - 45 * 8 * 2 / 2, 360, 2.0f, 220, 220, 220);
		render.DrawText("Press ENTER to start", w / 2 - 20 * 8 * 3 / 2, 460, 3.0f, 255, 255, 255);
		return;
	}

	// Lives (hearts as squares), coins and time
	for (int i = 0; i < player->maxLives; ++i)
	{
		SDL_Rect heart = { 20 + i * 34, 20, 26, 26 };
		if (i < player->lives) render.DrawRectangle(heart, 220, 40, 60, 255, true, false);
		render.DrawRectangle(heart, 255, 255, 255, 255, false, false);
	}
	std::string text = "COINS " + std::to_string(coins) + "/" + std::to_string(totalCoins);
	render.DrawText(text.c_str(), 20, 60, 2.0f, 255, 220, 80);

	float t = (state == GameState::PLAYING) ? levelTimer.ReadSec() : finalTime;
	char time[32];
	SDL_snprintf(time, sizeof(time), "TIME %.1f", t);
	render.DrawText(time, 20, 85, 2.0f, 255, 255, 255);

	if (player->godMode) render.DrawText("GOD MODE", w - 150, 20, 2.0f, 255, 120, 120);

	if (showHelp)
	{
		const char* lines[] = { "A/D, arrows: move", "SPACE: jump (hold for higher)", "F1: restart", "F5/F6: save/load",
		                        "F9: colliders", "F10: god mode", "F11: 30 fps cap", "F12: screenshot", "ESC: quit" };
		render.DrawRectangle({ w - 330, 50, 310, 20 + 9 * 22 }, 0, 0, 0, 160, true, false);
		for (int i = 0; i < 9; ++i) render.DrawText(lines[i], w - 320, 60 + i * 22, 2.0f, 255, 255, 255);
	}

	if (state == GameState::GAME_OVER)
	{
		render.DrawRectangle({ 0, 0, w, h }, 0, 0, 0, 150, true, false);
		render.DrawText("GAME OVER", w / 2 - 9 * 8 * 6 / 2, 250, 6.0f, 255, 80, 80);
		render.DrawText("Press ENTER to try again", w / 2 - 24 * 8 * 2 / 2, 380, 2.0f, 255, 255, 255);
	}
	else if (state == GameState::WIN)
	{
		render.DrawRectangle({ 0, 0, w, h }, 0, 0, 0, 150, true, false);
		render.DrawText("LEVEL COMPLETE!", w / 2 - 15 * 8 * 5 / 2, 230, 5.0f, 255, 220, 120);
		char result[64];
		SDL_snprintf(result, sizeof(result), "Coins %d/%d   Time %.1f s", coins, totalCoins, finalTime);
		render.DrawText(result, w / 2 - (int)SDL_strlen(result) * 8 * 2 / 2, 330, 2.0f, 255, 255, 255);
		render.DrawText("Press ENTER to play again", w / 2 - 25 * 8 * 2 / 2, 400, 2.0f, 255, 255, 255);
	}
}

bool Scene::CleanUp()
{
	player = nullptr;
	return true;
}
