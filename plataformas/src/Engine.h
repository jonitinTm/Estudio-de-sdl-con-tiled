#pragma once

#include <list>
#include <memory>
#include <string>
#include "Timer.h"
#include "pugixml.hpp"

class Module;
class Window;
class Input;
class Render;
class Textures;
class Audio;
class Scene;
class Map;
class Physics;
class EntityManager;

// The engine: owns the modules and runs the game loop. There is only one (singleton)
class Engine
{
public:
	static Engine& GetInstance();

	bool Awake();
	bool Start();
	bool Update();
	bool CleanUp();

	float GetDt() const { return dt; }
	const char* GetTitle() const { return gameTitle.c_str(); }

	// F11 in the scene: switch between the config frame rate and 30 fps
	void ToggleFrameCap();

private:
	Engine();
	Engine(const Engine&) = delete;
	Engine& operator=(const Engine&) = delete;

	void AddModule(std::shared_ptr<Module> module);
	bool LoadConfig();

	void PrepareUpdate();
	void FinishUpdate();
	bool PreUpdate();
	bool DoUpdate();
	bool PostUpdate();

public:
	// Direct access to the modules: Engine::GetInstance().render->DrawTexture(...)
	std::shared_ptr<Window> window;
	std::shared_ptr<Input> input;
	std::shared_ptr<Render> render;
	std::shared_ptr<Textures> textures;
	std::shared_ptr<Audio> audio;
	std::shared_ptr<Scene> scene;
	std::shared_ptr<Map> map;
	std::shared_ptr<Physics> physics;
	std::shared_ptr<EntityManager> entityManager;

	pugi::xml_document configFile;

private:
	std::list<std::shared_ptr<Module>> moduleList;

	std::string gameTitle = "Platformer";
	int targetFrameRate = 60;
	int configFrameRate = 60;

	// Frame measurements (L02)
	PerfTimer frameTime;
	Timer startupTime;
	Timer lastSecFrameTime;
	int frameCount = 0;
	int lastSecFrameCount = 0;
	int framesPerSecond = 0;
	float dt = 16.0f;   // milliseconds of the last frame
};
