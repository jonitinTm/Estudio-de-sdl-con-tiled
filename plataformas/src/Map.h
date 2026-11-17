#pragma once

#include "Module.h"
#include "Vector2D.h"
#include <SDL3/SDL.h>
#include <list>
#include <string>
#include <vector>

class PhysBody;

// Custom properties of Tiled: <properties><property name="Draw" type="bool" value="true"/> (L09)
struct Properties
{
	struct Property
	{
		std::string name;
		std::string value;
	};

	std::list<Property> list;

	const Property* GetProperty(const char* name) const;
	bool GetBool(const char* name, bool defaultValue = false) const;
};

struct TileSet
{
	int firstGid = 1;
	std::string name;
	int tileWidth = 32, tileHeight = 32;
	int spacing = 0, margin = 0;
	int tileCount = 0, columns = 1;
	SDL_Texture* texture = nullptr;

	// Rectangle of the tileset image for a gid (L07)
	SDL_Rect GetRect(int gid) const;
};

struct MapLayer
{
	int id = 0;
	std::string name;
	int width = 0, height = 0;
	std::vector<int> tiles;
	Properties properties;

	// gid of the cell (column i, row j)
	int Get(int i, int j) const { return tiles[(j * width) + i]; }
};

// An object of an object layer: spawn points, coins, enemies, death zones, goal...
struct MapObject
{
	int id = 0;
	std::string name;
	std::string type;          // "Player", "Coin", "Enemy", "Death", "Goal"
	float x = 0, y = 0;        // top-left corner in pixels (as Tiled saves it)
	float width = 0, height = 0;
};

struct MapData
{
	int width = 0, height = 0;           // tiles
	int tileWidth = 32, tileHeight = 32; // pixels
	std::list<TileSet*> tilesets;
	std::list<MapLayer*> layers;
	std::list<MapObject> objects;
};

class Map : public Module
{
public:
	Map();

	bool Update(float dt) override;
	bool CleanUp() override;

	bool Load(const std::string& path, const std::string& fileName);

	Vector2D MapToWorld(int i, int j) const;
	Vector2D WorldToMap(int x, int y) const;
	Vector2D GetMapSizeInPixels() const;
	int GetTileWidth() const { return mapData.tileWidth; }
	int GetTileHeight() const { return mapData.tileHeight; }
	int GetWidth() const { return mapData.width; }
	int GetHeight() const { return mapData.height; }

	// Every object of a type ("Coin", "Enemy"...)
	std::vector<MapObject> GetObjects(const std::string& type) const;

	// Collision layer: is this cell solid? (outside the map counts as solid on the sides)
	bool IsSolid(int i, int j) const;
	// Navigation for walking enemies: an empty cell with solid ground below
	bool IsWalkable(int i, int j) const;

private:
	bool LoadTileSets(pugi::xml_node mapNode);
	bool LoadLayer(pugi::xml_node& node, MapLayer* layer);
	void LoadProperties(pugi::xml_node& node, Properties& properties);
	void LoadObjects(pugi::xml_node mapNode);
	void CreateColliders();
	TileSet* GetTilesetFromTileId(int gid) const;

private:
	MapData mapData;
	std::string mapPath;
	bool mapLoaded = false;
	MapLayer* collisionLayer = nullptr;
	std::list<PhysBody*> colliders;
};
