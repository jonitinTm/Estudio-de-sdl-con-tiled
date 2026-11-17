#include "Engine.h"
#include "Log.h"

#include "Window.h"
#include "Input.h"
#include "Render.h"
#include "Textures.h"
#include "Audio.h"
#include "Scene.h"
#include "Map.h"
#include "Physics.h"
#include "EntityManager.h"

Engine& Engine::GetInstance()
{
	static Engine instance;
	return instance;
}

Engine::Engine()
{
	window = std::make_shared<Window>();
	input = std::make_shared<Input>();
	render = std::make_shared<Render>();
	textures = std::make_shared<Textures>();
	audio = std::make_shared<Audio>();
	physics = std::make_shared<Physics>();
	scene = std::make_shared<Scene>();
	map = std::make_shared<Map>();
	entityManager = std::make_shared<EntityManager>();

	// The order matters: Awake, Start and Update follow it. CleanUp goes backwards
	AddModule(window);
	AddModule(input);
	AddModule(textures);
	AddModule(audio);
	AddModule(physics);       // Step() in PreUpdate: positions ready for the game
	AddModule(scene);
	AddModule(map);           // the map is drawn before the entities...
	AddModule(entityManager); // ...so the player is drawn on top
	AddModule(render);        // always last: presents the frame
}

void Engine::AddModule(std::shared_ptr<Module> module)
{
	module->Init();
	moduleList.push_back(module);
}

bool Engine::LoadConfig()
{
	pugi::xml_parse_result result = configFile.load_file("config.xml");
	if (!result)
	{
		LOG("Error loading config.xml: %s", result.description());
		return false;
	}
	return true;
}

bool Engine::Awake()
{
	if (!LoadConfig()) return false;

	pugi::xml_node engineNode = configFile.child("config").child("engine");
	gameTitle = engineNode.child("title").attribute("value").as_string();
	configFrameRate = targetFrameRate = engineNode.child("targetFrameRate").attribute("value").as_int(60);

	for (const auto& module : moduleList)
	{
		// Each module receives its own node: <window>, <render>, <scene>...
		module->LoadParameters(configFile.child("config").child(module->name.c_str()));
		if (!module->Awake()) return false;
	}
	return true;
}

bool Engine::Start()
{
	for (const auto& module : moduleList)
	{
		if (!module->Start())
		{
			LOG("Module %s failed to start", module->name.c_str());
			return false;
		}
	}
	return true;
}

bool Engine::Update()
{
	PrepareUpdate();

	bool ret = PreUpdate();
	if (ret) ret = DoUpdate();
	if (ret) ret = PostUpdate();

	FinishUpdate();
	return ret;
}

bool Engine::CleanUp()
{
	bool ret = true;
	for (auto it = moduleList.rbegin(); it != moduleList.rend(); ++it)
		ret = (*it)->CleanUp() && ret;
	moduleList.clear();
	return ret;
}

void Engine::ToggleFrameCap()
{
	targetFrameRate = (targetFrameRate == 30) ? configFrameRate : 30;
}

void Engine::PrepareUpdate()
{
	frameTime.Start();
}

void Engine::FinishUpdate()
{
	// Frame cap (L03): wait what is left of the frame budget
	double maxFrameDuration = 1000.0 / targetFrameRate;
	double elapsed = frameTime.ReadMs();
	if (elapsed < maxFrameDuration)
		SDL_DelayPrecise((Uint64)((maxFrameDuration - elapsed) * 1000000.0));

	// dt AFTER the wait, so it includes it
	dt = (float)frameTime.ReadMs();
	if (dt > 100.0f) dt = 100.0f; // a breakpoint or dragging the window: do not teleport

	// Frames per second (L02)
	frameCount++;
	lastSecFrameCount++;
	if (lastSecFrameTime.ReadMSec() >= 1000.0f)
	{
		framesPerSecond = lastSecFrameCount;
		lastSecFrameCount = 0;
		lastSecFrameTime.Start();
	}
}

bool Engine::PreUpdate()
{
	for (const auto& module : moduleList)
		if (module->active && !module->PreUpdate()) return false;
	return true;
}

bool Engine::DoUpdate()
{
	for (const auto& module : moduleList)
		if (module->active && !module->Update(dt)) return false;
	return true;
}

bool Engine::PostUpdate()
{
	for (const auto& module : moduleList)
		if (module->active && !module->PostUpdate()) return false;
	return true;
}
