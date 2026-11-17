#pragma once

#include <string>
#include "pugixml.hpp"

class PhysBody;

// Base class of every module of the engine (window, input, render, map, physics, scene...)
class Module
{
public:
	Module() : active(false) {}
	virtual ~Module() {}

	void Init() { active = true; }

	// The engine gives each module its own node of config.xml: <config><window>...</window></config>
	virtual bool LoadParameters(pugi::xml_node parameters)
	{
		configParameters = parameters;
		return true;
	}

	virtual bool Awake() { return true; }           // once: read the configuration
	virtual bool Start() { return true; }           // once: load resources
	virtual bool PreUpdate() { return true; }       // every frame
	virtual bool Update(float dt) { return true; }  // every frame. dt in milliseconds
	virtual bool PostUpdate() { return true; }      // every frame
	virtual bool CleanUp() { return true; }         // once: free everything

public:
	std::string name;
	bool active;
	pugi::xml_node configParameters;
};
