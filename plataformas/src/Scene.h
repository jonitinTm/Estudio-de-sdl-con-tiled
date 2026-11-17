#pragma once

#include "Module.h"
#include "Vector2D.h"
#include "Timer.h"
#include <memory>

class Player;

enum class GameState { TITLE, PLAYING, GAME_OVER, WIN };

class Scene : public Module
{
public:
	Scene();

	bool Awake() override;
	bool Start() override;
	bool Update(float dt) override;
	bool PostUpdate() override;
	bool CleanUp() override;

	void AddCoin() { coins++; }
	Vector2D GetCheckpoint() const { return checkpoint; }
	std::shared_ptr<Player> GetPlayer() const { return player; }
	bool IsPlaying() const { return state == GameState::PLAYING; }

private:
	void NewGame();
	void SpawnEntities();     // coins and enemies from the object layer of the map
	void UpdateCamera();
	void UpdateCheckpoints();
	void DrawFlags();
	void DrawHUD();
	void DebugKeys();
	bool SaveGame();
	bool LoadGame();

private:
	std::shared_ptr<Player> player;
	GameState state = GameState::TITLE;

	Vector2D spawn;           // start of the level (object "Player")
	Vector2D checkpoint;      // where the player comes back after falling
	int coins = 0;
	int totalCoins = 0;
	Timer levelTimer;
	float finalTime = 0.0f;
	bool showHelp = false;
	int screenshotCount = 0;
	int selectFx = 0, winFx = 0;
};
