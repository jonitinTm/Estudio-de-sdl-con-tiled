#include "Map.h"
#include "Engine.h"
#include "Render.h"
#include "Textures.h"
#include "Physics.h"
#include "Log.h"

// Properties --------------------------------------------------------------

const Properties::Property* Properties::GetProperty(const char* name) const
{
	for (const Property& p : list)
		if (p.name == name) return &p;
	return nullptr;
}

bool Properties::GetBool(const char* name, bool defaultValue) const
{
	const Property* p = GetProperty(name);
	if (p == nullptr) return defaultValue;
	return p->value == "true" || p->value == "1";
}

// TileSet -----------------------------------------------------------------

SDL_Rect TileSet::GetRect(int gid) const
{
	int relativeIndex = gid - firstGid;
	SDL_Rect rect;
	rect.w = tileWidth;
	rect.h = tileHeight;
	rect.x = margin + (tileWidth + spacing) * (relativeIndex % columns);
	rect.y = margin + (tileHeight + spacing) * (relativeIndex / columns);
	return rect;
}

// Map ---------------------------------------------------------------------

Map::Map()
{
	name = "map";
}

bool Map::Load(const std::string& path, const std::string& fileName)
{
	mapPath = path;
	std::string fullPath = path + fileName;

	pugi::xml_document mapFile;
	pugi::xml_parse_result result = mapFile.load_file(fullPath.c_str());
	if (!result)
	{
		LOG("Could not load map %s: %s", fullPath.c_str(), result.description());
		return false;
	}

	pugi::xml_node mapNode = mapFile.child("map");
	mapData.width = mapNode.attribute("width").as_int();
	mapData.height = mapNode.attribute("height").as_int();
	mapData.tileWidth = mapNode.attribute("tilewidth").as_int();
	mapData.tileHeight = mapNode.attribute("tileheight").as_int();

	if (!LoadTileSets(mapNode)) return false;

	for (pugi::xml_node layerNode = mapNode.child("layer"); layerNode; layerNode = layerNode.next_sibling("layer"))
	{
		MapLayer* layer = new MapLayer();
		LoadLayer(layerNode, layer);
		mapData.layers.push_back(layer);
		if (layer->properties.GetBool("Collision")) collisionLayer = layer;
	}

	LoadObjects(mapNode);
	CreateColliders();

	LOG("Map %s: %dx%d tiles of %dx%d, %d tilesets, %d layers, %d objects", fileName.c_str(),
	    mapData.width, mapData.height, mapData.tileWidth, mapData.tileHeight,
	    (int)mapData.tilesets.size(), (int)mapData.layers.size(), (int)mapData.objects.size());

	mapLoaded = true;
	return true;
}

bool Map::LoadTileSets(pugi::xml_node mapNode)
{
	for (pugi::xml_node node = mapNode.child("tileset"); node; node = node.next_sibling("tileset"))
	{
		TileSet* tileSet = new TileSet();
		tileSet->firstGid = node.attribute("firstgid").as_int();
		tileSet->name = node.attribute("name").as_string();
		tileSet->tileWidth = node.attribute("tilewidth").as_int();
		tileSet->tileHeight = node.attribute("tileheight").as_int();
		tileSet->spacing = node.attribute("spacing").as_int();
		tileSet->margin = node.attribute("margin").as_int();
		tileSet->tileCount = node.attribute("tilecount").as_int();
		tileSet->columns = node.attribute("columns").as_int();

		std::string imagePath = mapPath + node.child("image").attribute("source").as_string();
		tileSet->texture = Engine::GetInstance().textures->Load(imagePath.c_str());
		if (tileSet->texture == nullptr) { delete tileSet; return false; }

		mapData.tilesets.push_back(tileSet);
	}
	return true;
}

bool Map::LoadLayer(pugi::xml_node& node, MapLayer* layer)
{
	layer->id = node.attribute("id").as_int();
	layer->name = node.attribute("name").as_string();
	layer->width = node.attribute("width").as_int();
	layer->height = node.attribute("height").as_int();

	LoadProperties(node, layer->properties);

	// Layer format XML: <data><tile gid="5"/>... (choose XML in Tiled: Map > Map Properties)
	for (pugi::xml_node tile = node.child("data").child("tile"); tile; tile = tile.next_sibling("tile"))
		layer->tiles.push_back(tile.attribute("gid").as_int());

	if ((int)layer->tiles.size() != layer->width * layer->height)
		LOG("Layer %s has %d tiles: is the layer format XML?", layer->name.c_str(), (int)layer->tiles.size());
	return true;
}

void Map::LoadProperties(pugi::xml_node& node, Properties& properties)
{
	for (pugi::xml_node p = node.child("properties").child("property"); p; p = p.next_sibling("property"))
		properties.list.push_back({ p.attribute("name").as_string(), p.attribute("value").as_string() });
}

void Map::LoadObjects(pugi::xml_node mapNode)
{
	for (pugi::xml_node group = mapNode.child("objectgroup"); group; group = group.next_sibling("objectgroup"))
	{
		for (pugi::xml_node o = group.child("object"); o; o = o.next_sibling("object"))
		{
			MapObject obj;
			obj.id = o.attribute("id").as_int();
			obj.name = o.attribute("name").as_string();
			// Tiled < 1.9 saves "type"; Tiled 1.9+ calls it "class" in the editor (and also "type" in some versions)
			obj.type = o.attribute("type").as_string();
			if (obj.type.empty()) obj.type = o.attribute("class").as_string();
			obj.x = o.attribute("x").as_float();
			obj.y = o.attribute("y").as_float();
			obj.width = o.attribute("width").as_float();
			obj.height = o.attribute("height").as_float();
			mapData.objects.push_back(obj);
		}
	}
}

// One Box2D box per horizontal run of solid tiles (not one per tile: fewer bodies and no snagging, L09)
void Map::CreateColliders()
{
	Physics& physics = *Engine::GetInstance().physics;
	int tw = mapData.tileWidth, th = mapData.tileHeight;

	if (collisionLayer != nullptr)
	{
		for (int j = 0; j < mapData.height; ++j)
		{
			int start = -1;
			for (int i = 0; i <= mapData.width; ++i)
			{
				bool solid = (i < mapData.width) && collisionLayer->Get(i, j) != 0;
				if (solid && start < 0) start = i;
				if (!solid && start >= 0)
				{
					int count = i - start;
					PhysBody* c = physics.CreateRectangle(start * tw + count * tw / 2, j * th + th / 2, count * tw, th, BodyType::STATIC);
					c->ctype = ColliderType::PLATFORM;
					colliders.push_back(c);
					start = -1;
				}
			}
		}
	}

	// Sensors from the object layers: death zones and the goal
	for (const MapObject& o : mapData.objects)
	{
		ColliderType type = ColliderType::UNKNOWN;
		if (o.type == "Death") type = ColliderType::DEATH;
		else if (o.type == "Goal") type = ColliderType::GOAL;
		else continue;

		// Tiled gives the top-left corner; Box2D wants the center
		PhysBody* s = physics.CreateRectangleSensor((int)(o.x + o.width / 2), (int)(o.y + o.height / 2), (int)o.width, (int)o.height, BodyType::STATIC);
		s->ctype = type;
		colliders.push_back(s);
	}
}

TileSet* Map::GetTilesetFromTileId(int gid) const
{
	for (TileSet* tileset : mapData.tilesets)
		if (gid >= tileset->firstGid && gid < tileset->firstGid + tileset->tileCount) return tileset;
	return nullptr;
}

bool Map::Update(float dt)
{
	if (!mapLoaded) return true;

	// Only the tiles inside the camera (culling): a 100x22 map has 2200 tiles per layer
	const SDL_Rect& camera = Engine::GetInstance().render->camera;
	int firstI = SDL_max(0, -camera.x / mapData.tileWidth);
	int firstJ = SDL_max(0, -camera.y / mapData.tileHeight);
	int lastI = SDL_min(mapData.width - 1, (-camera.x + camera.w) / mapData.tileWidth + 1);
	int lastJ = SDL_min(mapData.height - 1, (-camera.y + camera.h) / mapData.tileHeight + 1);

	for (MapLayer* layer : mapData.layers)
	{
		if (!layer->properties.GetBool("Draw", true)) continue;   // Collision layer: Draw = false

		for (int j = firstJ; j <= lastJ; ++j)
		{
			for (int i = firstI; i <= lastI; ++i)
			{
				int gid = layer->Get(i, j);
				if (gid == 0) continue;

				TileSet* tileset = GetTilesetFromTileId(gid);
				if (tileset == nullptr) continue;

				SDL_Rect rect = tileset->GetRect(gid);
				Vector2D pos = MapToWorld(i, j);
				Engine::GetInstance().render->DrawTexture(tileset->texture, (int)pos.getX(), (int)pos.getY(), &rect);
			}
		}
	}
	return true;
}

bool Map::CleanUp()
{
	for (TileSet* tileset : mapData.tilesets)
	{
		Engine::GetInstance().textures->UnLoad(tileset->texture);
		delete tileset;
	}
	mapData.tilesets.clear();

	for (MapLayer* layer : mapData.layers) delete layer;
	mapData.layers.clear();
	mapData.objects.clear();

	for (PhysBody* c : colliders) Engine::GetInstance().physics->DeletePhysBody(c);
	colliders.clear();

	collisionLayer = nullptr;
	mapLoaded = false;
	return true;
}

Vector2D Map::MapToWorld(int i, int j) const
{
	return Vector2D((float)(i * mapData.tileWidth), (float)(j * mapData.tileHeight));
}

Vector2D Map::WorldToMap(int x, int y) const
{
	return Vector2D((float)(x / mapData.tileWidth), (float)(y / mapData.tileHeight));
}

Vector2D Map::GetMapSizeInPixels() const
{
	return Vector2D((float)(mapData.width * mapData.tileWidth), (float)(mapData.height * mapData.tileHeight));
}

std::vector<MapObject> Map::GetObjects(const std::string& type) const
{
	std::vector<MapObject> result;
	for (const MapObject& o : mapData.objects)
		if (o.type == type) result.push_back(o);
	return result;
}

bool Map::IsSolid(int i, int j) const
{
	if (i < 0 || i >= mapData.width) return true;
	if (j < 0 || j >= mapData.height || collisionLayer == nullptr) return false;
	return collisionLayer->Get(i, j) != 0;
}

bool Map::IsWalkable(int i, int j) const
{
	if (i < 0 || i >= mapData.width || j < 0 || j >= mapData.height - 1) return false;
	return !IsSolid(i, j) && IsSolid(i, j + 1);
}
