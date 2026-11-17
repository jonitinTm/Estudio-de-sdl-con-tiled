#include "Engine.h"
#include "Log.h"

#define SDL_MAIN_HANDLED
#include <SDL3/SDL_main.h>

int main(int argc, char* argv[])
{
	LOG("Engine starting ...");

	Engine& engine = Engine::GetInstance();

	int result = 1;
	if (engine.Awake() && engine.Start())
	{
		while (engine.Update()) {}
		result = 0;
	}

	engine.CleanUp();
	LOG("Bye :)");
	return result;
}
