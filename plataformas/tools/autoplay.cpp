// Automatic test: runs the real game with simulated keys and takes screenshots.
// Not part of the game. Build it instead of Main.cpp (see tools/README.md)
#include "../src/Engine.h"
#include "../src/Input.h"
#include "../src/Render.h"
#include "../src/Scene.h"
#include "../src/Player.h"
#include "../src/EntityManager.h"
#include "../src/Physics.h"
#include "../src/Enemy.h"
#include "../src/Log.h"

#include <SDL3/SDL.h>
#include <stdio.h>
#include <string>

static Engine& E() { return Engine::GetInstance(); }
static int failures = 0;

static void Check(bool ok, const char* what)
{
	printf("[%s] %s\n", ok ? " OK " : "FAIL", what);
	if (!ok) failures++;
}

static void Frames(int n)
{
	for (int i = 0; i < n; ++i) E().Update();
}

static void Press(SDL_Scancode key, int frames = 2)
{
	E().input->SetVirtualKey(key, true);
	Frames(frames);
	E().input->SetVirtualKey(key, false);
	Frames(1);
}

static void Shot(const char* name)
{
	std::string path = std::string(SDL_getenv("SHOTS") ? SDL_getenv("SHOTS") : ".") + "/" + name + ".bmp";
	E().render->SaveScreenshot(path.c_str());
}

static int Count(EntityType type)
{
	int n = 0;
	for (auto& e : E().entityManager->entities) if (e->type == type && !e->pendingToDelete) n++;
	return n;
}

int main(int argc, char* argv[])
{
	if (!E().Awake() || !E().Start()) { printf("Engine failed to start\n"); return 1; }
	Scene& scene = *E().scene;
	auto player = scene.GetPlayer();
	int x0, y0, x, y;

	Frames(30);
	Shot("01_title");
	Check(!scene.IsPlaying(), "starts on the title screen");
	Check(Count(EntityType::ITEM) == 32 && Count(EntityType::ENEMY) == 6, "32 coins and 6 enemies spawned from the map");

	Press(SDL_SCANCODE_RETURN);
	Frames(40);
	Check(scene.IsPlaying(), "ENTER starts the game");
	player->GetBodyPosition(x0, y0);
	Check(y0 > 500 && y0 < 576, "player fell and stands on the ground");
	Shot("02_start");

	// Walk right
	E().input->SetVirtualKey(SDL_SCANCODE_D, true);
	Frames(40);
	E().input->SetVirtualKey(SDL_SCANCODE_D, false);
	Frames(5);
	player->GetBodyPosition(x, y);
	Check(x > x0 + 100, "D moves the player to the right");

	// Jump
	int yBefore = y;
	E().input->SetVirtualKey(SDL_SCANCODE_SPACE, true);
	Frames(10);
	player->GetBodyPosition(x, y);
	Check(y < yBefore - 40, "SPACE jumps");
	Shot("03_jump");
	E().input->SetVirtualKey(SDL_SCANCODE_SPACE, false);
	Frames(60);

	// Coins under the first platform: jump into them
	// Drop the player onto the first floating platform (row 14), through its row of coins (row 13)
	player->Respawn(9 * 32 + 16, 12 * 32);
	Frames(60);
	Check(Count(EntityType::ITEM) < 32, "touching a coin collects it");

	// Debug draw
	Press(SDL_SCANCODE_F9);
	Frames(5);
	Shot("04_colliders_F9");
	Press(SDL_SCANCODE_F9);

	// Fall into the first pit: lose a life and respawn
	int lives = player->lives;
	player->Respawn(24 * 32, 15 * 32);   // over the water, under the platform level
	E().input->SetVirtualKey(SDL_SCANCODE_D, true);
	Frames(8);
	E().input->SetVirtualKey(SDL_SCANCODE_D, false);
	Frames(90);
	Check(player->lives == lives - 1, "falling into the water costs a life");
	player->GetBodyPosition(x, y);
	Check(x < 22 * 32, "and the player comes back to the checkpoint");

	// Walk into a slime: lose a life (invulnerable for a moment)
	lives = player->lives;
	player->Respawn(30 * 32, 17 * 32);
	Frames(240);   // the slime of x = 34 sees us and comes
	Check(player->lives < lives, "a slime hurts the player when it touches him");
	Shot("05_hurt");

	// Stomp a slime from above
	Frames(120);
	int enemies = Count(EntityType::ENEMY);
	// Drop the player from above onto a slime
	for (int attempt = 0; attempt < 5 && Count(EntityType::ENEMY) == enemies; ++attempt)
	{
		for (auto& e : E().entityManager->entities)
		{
			auto enemy = std::dynamic_pointer_cast<Enemy>(e);
			if (enemy == nullptr || enemy->IsDying()) continue;
			int ex, ey;
			enemy->GetBodyPosition(ex, ey);
			player->Respawn(ex, ey - 40);   // just above it: it has no time to walk away
			break;
		}
		Frames(40);
	}
	Check(Count(EntityType::ENEMY) < enemies, "jumping on a slime kills it");

	// Save, move, load
	player->Respawn(70 * 32, 16 * 32);
	Frames(30);
	player->GetBodyPosition(x0, y0);
	Press(SDL_SCANCODE_F5);
	player->Respawn(10 * 32, 16 * 32);
	Frames(10);
	Press(SDL_SCANCODE_F6);
	Frames(5);
	player->GetBodyPosition(x, y);
	Check(abs(x - x0) < 40, "F5 saves and F6 loads the position");

	// God mode: fly to the goal
	Press(SDL_SCANCODE_F10);
	Check(player->godMode, "F10 enables god mode");
	player->Respawn(84 * 32, 12 * 32);   // after the last pit, high: nothing in the way
	E().input->SetVirtualKey(SDL_SCANCODE_D, true);
	Frames(30);
	Shot("06_god_mode");
	for (int i = 0; i < 600; ++i) { Frames(1); player->GetBodyPosition(x, y); if (x > 95 * 32 + 16) break; }
	E().input->SetVirtualKey(SDL_SCANCODE_D, false);
	E().input->SetVirtualKey(SDL_SCANCODE_S, true);
	for (int i = 0; i < 200 && scene.IsPlaying(); ++i) Frames(1);
	E().input->SetVirtualKey(SDL_SCANCODE_S, false);
	Frames(10);
	Shot("07_win");
	Check(!scene.IsPlaying() && player->reachedGoal, "reaching the flag wins the level");

	// New game and game over
	Press(SDL_SCANCODE_RETURN);
	Frames(20);
	Check(scene.IsPlaying() && player->lives == player->maxLives && Count(EntityType::ITEM) == 32, "ENTER restarts with full lives and all coins");
	Press(SDL_SCANCODE_F10);   // god mode off
	for (int i = 0; i < 3; ++i)
	{
		player->Respawn(24 * 32, 15 * 32);
		Frames(100);
	}
	Frames(120);
	Shot("08_game_over");
	Check(!scene.IsPlaying() && player->lives == 0, "three falls: game over");

	E().CleanUp();
	printf(failures == 0 ? "ALL TESTS PASSED\n" : "%d TESTS FAILED\n", failures);
	return failures;
}
