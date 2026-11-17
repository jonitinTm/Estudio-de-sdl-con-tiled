(function () {
  const { code, nota, quiz } = Curso;
  Curso.leccion({
    id: "l14", num: "14", grupo: "Bloque 7 · Construye el plataformas paso a paso", corto: "Plataformas II: el mundo",
    titulo: "Construye el plataformas II: el mundo",
    resumen: "Fases 5–8: el nivel de Tiled (capas, propiedades, objetos, colliders fusionados), Box2D 3 con eventos, entidades, animaciones TSX y el jugador completo.",
    intro: "Le das un mundo a tu motor: cargas el nivel de Tiled, montas la física con Box2D 3 y programas al caballero con todo lo que hace bueno a un plataformas: tiempo de coyote, salto variable, daño, invulnerabilidad y pisotón.",
    objetivos: ["Cargar un nivel TMX completo con objetos", "Usar Box2D 3: ids, paso fijo y eventos", "Gestionar entidades y animaciones desde TSX", "Programar un jugador de plataformas con buen tacto"],
    html: () => `

<p>Tu motor ya abre una ventana. En esta lección le das un mundo: el nivel de Tiled, la física de Box2D y el caballero corriendo y saltando.</p>
<h2 id="pfase5">Fase 5 · El mapa: Tiled y TMX</h2>

<h3>El nivel</h3>
<p>Puedes dibujar tu propio nivel en Tiled (<a href="#l06">lección 06</a>) o usar el de ejemplo: <code>plataformas/Assets/Maps/Level1.tmx</code> (100×22 tiles de 32 px). Ábrelo en Tiled para ver cómo está hecho:</p>
<div class="table-wrap"><table class="t"><thead><tr><th>Capa</th><th>Tipo</th><th>Propiedades</th><th>Para qué</th></tr></thead><tbody>
<tr><td>Decor</td><td>tiles</td><td>Draw = true</td><td>Árboles, setas, agua (no chocan)</td></tr>
<tr><td>Map</td><td>tiles</td><td>Draw = true</td><td>Suelo y plataformas (se ven)</td></tr>
<tr><td>Collisions</td><td>tiles (tile rojo de MapMetadata)</td><td>Collision = true, Draw = false</td><td>Dónde se choca (no se ve)</td></tr>
<tr><td>Objects</td><td>objetos</td><td>—</td><td>Player, Coin, Enemy, Death, Checkpoint, Goal (en el campo <em>Class</em>/<em>Type</em>)</td></tr>
</tbody></table></div>
${nota(`<p><strong>Si haces tu propio mapa:</strong> formato de capa <strong>XML</strong> (Mapa → Propiedades del mapa → Tile Layer Format), tilesets <strong>incrustados</strong> en el mapa, y escribe el tipo de cada objeto (<code>Player</code>, <code>Coin</code>…) en el campo <em>Class</em> del objeto. Son los tres errores típicos.</p>`, "warn")}
<h3>Map.h</h3>
${code(String.raw`
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
`, "cpp", "Map.h")}
<p>Los structs son los de las lecciones <a href="#l06">06</a>, <a href="#l07">07</a> y <a href="#l09">09</a>, más uno nuevo: <code>MapObject</code>, para los objetos (dónde aparece el jugador, las monedas, los slimes…).</p>
<h3>Map.cpp · cargar</h3>
${code(String.raw`
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
}`, "cpp", "Map.cpp · Load, tilesets, capas, propiedades y objetos")}
<ul>
<li><code>Load</code> sigue el orden del TMX: atributos de <code>&lt;map&gt;</code> → tilesets → capas → objetos → colliders.</li>
<li>La capa que tiene <code>Collision = true</code> se guarda en <code>collisionLayer</code>: la usan los colliders y la navegación de los slimes.</li>
<li>Los objetos de Tiled guardan la <strong>esquina superior izquierda</strong>; en el juego casi siempre queremos el centro (<code>x + width / 2</code>).</li>
</ul>
<h3>Map.cpp · colliders</h3>
${code(String.raw`
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
}`, "cpp", "Map.cpp · CreateColliders")}
<p>En vez de una caja por tile (<a href="#l09">lección 09</a>), <strong>una caja por cada tramo horizontal</strong> de tiles sólidos seguidos: recorre cada fila, apunta dónde empieza el tramo (<code>start</code>) y, cuando se acaba, crea una caja que lo cubre entero. Menos cuerpos y, sobre todo, <strong>el jugador no se engancha</strong> al correr sobre la unión de dos cajas.</p>
<h3>Map.cpp · dibujar y consultar</h3>
${code(String.raw`
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
}`, "cpp", "Map.cpp · dibujo con culling, CleanUp y consultas")}
<ul>
<li><strong>Culling</strong>: solo se dibujan las casillas que caen dentro de la cámara. El nivel tiene 2200 casillas por capa; en pantalla caben unas 950.</li>
<li><code>IsWalkable</code>: “casilla vacía con suelo debajo”. Es el grafo de navegación de los slimes (lección 15).</li>
</ul>
<p>En la Scene mínima, carga el mapa en <code>Start</code>: <code>Engine::GetInstance().map-&gt;Load("Assets/Maps/", "Level1.tmx");</code> (y descomenta Map en Engine.cpp; los colliders necesitan la física, así que comenta de momento <code>CreateColliders()</code> o haz la fase 6 a la vez).</p>

${nota(`<p>Se ve el nivel: césped, árboles, agua, plataformas de piedra y bloques. La consola dice “Map Level1.tmx: 100x22 tiles of 32x32, 2 tilesets, 3 layers, 44 objects”. La capa roja de colisiones no se ve (Draw = false). Prueba a mover la cámara a mano cambiando <code>render-&gt;camera.x</code>.</p>`, "game", "Compila y comprueba")}
${nota(`<p><strong>“Layer … has 0 tiles: is the layer format XML?”</strong>: cambia el formato a XML en Tiled y guarda. <strong>No se ve nada</strong>: revisa que <code>image source</code> sea relativo a la carpeta del mapa y que los PNG estén en <code>Assets/Maps</code>.</p>`, "warn", "Si no funciona")}
<h2 id="pfase6">Fase 6 · La física con Box2D 3</h2>

<p>Box2D 3 (el que usa tu SandKnight) no usa punteros: cada cuerpo es un <strong>id</strong> (<code>b2BodyId</code>) y todas las funciones son <code>b2Body_XXX(id, …)</code>. Y no te llama durante el cálculo: después de cada <code>Step</code>, tú <strong>pides la lista de eventos</strong>. Repasa la <a href="#l08">lección 08</a>.</p>
<h3>Physics.h</h3>
${code(String.raw`
#pragma once

#include "Module.h"
#include <box2d/box2d.h>
#include <list>

// Box2D works in meters, the game in pixels (L08)
#define PIXELS_PER_METER 32.0f
#define METERS_TO_PIXELS(m) ((int)floorf(PIXELS_PER_METER * (m)))
#define PIXEL_TO_METERS(p)  ((float)(p) / PIXELS_PER_METER)
#define GRAVITY_Y 25.0f        // m/s^2, positive = down on screen. Platformers use more than 9.8
#define PHYSICS_DT (1.0f / 60.0f)

class Entity;

enum class ColliderType { PLAYER, ITEM, ENEMY, PLATFORM, DEATH, GOAL, UNKNOWN };
enum class BodyType { DYNAMIC, STATIC, KINEMATIC };

// Our wrapper of a Box2D body: what the rest of the game sees
class PhysBody
{
public:
    void GetPosition(int& x, int& y) const;   // center, in pixels
    float GetRotation() const;               // radians

public:
    b2BodyId body = b2_nullBodyId;
    int width = 0, height = 0;               // pixels (circles: width = height = diameter)
    Entity* listener = nullptr;              // who is told about the collisions of this body
    ColliderType ctype = ColliderType::UNKNOWN;
    bool pendingToDelete = false;
};

class Physics : public Module
{
public:
    Physics();

    bool Start() override;
    bool PreUpdate() override;
    bool PostUpdate() override;
    bool CleanUp() override;

    // x, y = CENTER in pixels. width, height = full size in pixels
    PhysBody* CreateRectangle(int x, int y, int width, int height, BodyType type);
    PhysBody* CreateCircle(int x, int y, int radius, BodyType type);
    PhysBody* CreateRectangleSensor(int x, int y, int width, int height, BodyType type);

    // Marks the body: it is destroyed at the beginning of the next PreUpdate (never during the Step)
    void DeletePhysBody(PhysBody* pbody);

    // Is this body touching something below it? (normal of the contact pointing up)
    bool IsOnGround(const PhysBody* pbody) const;

    b2Vec2 GetLinearVelocity(const PhysBody* pbody) const;
    void SetLinearVelocity(PhysBody* pbody, b2Vec2 velocity);
    void ApplyLinearImpulse(PhysBody* pbody, b2Vec2 impulse);
    void SetPosition(PhysBody* pbody, int x, int y);   // teleport (respawn), in pixels

    void ToggleDebug() { debug = !debug; }

private:
    PhysBody* AddBody(b2BodyId body, int width, int height);
    void ProcessContactEvents();
    void DestroyPendingBodies();

private:
    b2WorldId world = b2_nullWorldId;
    std::list<PhysBody*> bodies;
    bool debug = false;
    float accumulator = 0.0f;   // fixed time step
};
`, "cpp", "Physics.h")}
<ul>
<li><strong>32 píxeles = 1 metro</strong>: un tile mide 1 m y el caballero (20×36 px) unos 0,6 × 1,1 m. Proporciones realistas, así la física se comporta bien.</li>
<li><code>GRAVITY_Y = 25</code>: más que la real (9,8). Los plataformas usan gravedad alta para que los saltos sean rápidos y no “floten”.</li>
<li><code>PhysBody</code> envuelve el id de Box2D con lo que el juego necesita: su tamaño, su tipo (<code>ctype</code>) y a quién avisar (<code>listener</code>).</li>
</ul>
<h3>Physics.cpp · el paso y los eventos</h3>
${code(String.raw`
// Physics ----------------------------------------------------------------

Physics::Physics()
{
    name = "physics";
}

bool Physics::Start()
{
    b2WorldDef worldDef = b2DefaultWorldDef();
    worldDef.gravity = { 0.0f, GRAVITY_Y };
    world = b2CreateWorld(&worldDef);
    return true;
}

bool Physics::PreUpdate()
{
    DestroyPendingBodies();

    // Fixed time step (L03 / L08): as many steps of 1/60 s as fit in the time of the last frame
    accumulator += Engine::GetInstance().GetDt() / 1000.0f;
    int steps = 0;
    while (accumulator >= PHYSICS_DT && steps < 5)
    {
        b2World_Step(world, PHYSICS_DT, 4);
        ProcessContactEvents();
        accumulator -= PHYSICS_DT;
        steps++;
    }
    if (steps == 5) accumulator = 0.0f;   // too slow: do not try to catch up forever
    return true;
}

// Box2D 3 does not call us during the step: after it, we ask for the list of events
void Physics::ProcessContactEvents()
{
    // Solid contacts (player <-> platform, player <-> enemy...)
    b2ContactEvents contacts = b2World_GetContactEvents(world);
    for (int i = 0; i < contacts.beginCount; ++i)
    {
        const b2ContactBeginTouchEvent& e = contacts.beginEvents[i];
        if (!b2Shape_IsValid(e.shapeIdA) || !b2Shape_IsValid(e.shapeIdB)) continue;
        PhysBody* a = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdA));
        PhysBody* b = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdB));
        if (a == nullptr || b == nullptr || a->pendingToDelete || b->pendingToDelete) continue;
        if (a->listener) a->listener->OnCollision(a, b);
        if (b->listener) b->listener->OnCollision(b, a);
    }
    for (int i = 0; i < contacts.endCount; ++i)
    {
        const b2ContactEndTouchEvent& e = contacts.endEvents[i];
        if (!b2Shape_IsValid(e.shapeIdA) || !b2Shape_IsValid(e.shapeIdB)) continue;
        PhysBody* a = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdA));
        PhysBody* b = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdB));
        if (a == nullptr || b == nullptr) continue;
        if (a->listener) a->listener->OnCollisionEnd(a, b);
        if (b->listener) b->listener->OnCollisionEnd(b, a);
    }

    // Sensors (coins, death zones, goal): only tell the visitor and the sensor owner
    b2SensorEvents sensors = b2World_GetSensorEvents(world);
    for (int i = 0; i < sensors.beginCount; ++i)
    {
        const b2SensorBeginTouchEvent& e = sensors.beginEvents[i];
        if (!b2Shape_IsValid(e.sensorShapeId) || !b2Shape_IsValid(e.visitorShapeId)) continue;
        PhysBody* sensor = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.sensorShapeId));
        PhysBody* visitor = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.visitorShapeId));
        if (sensor == nullptr || visitor == nullptr || sensor->pendingToDelete || visitor->pendingToDelete) continue;
        if (sensor->listener) sensor->listener->OnCollision(sensor, visitor);
        if (visitor->listener) visitor->listener->OnCollision(visitor, sensor);
    }
}`, "cpp", "Physics.cpp · Start, PreUpdate y eventos")}
<ul>
<li><strong>Paso fijo con acumulador</strong> (<a href="#l03">lección 03</a>): suma el tiempo real del frame y da tantos pasos de 1/60 s como quepan. El juego va igual a 30, 60 o 144 fps (prueba F11).</li>
<li><strong>Dos tipos de eventos</strong>: <em>contact</em> (dos cuerpos sólidos se tocan: jugador–suelo, jugador–slime) y <em>sensor</em> (algo entra en un sensor: moneda, agua, meta).</li>
<li><code>b2Body_GetUserData</code> devuelve el <code>PhysBody*</code> que guardamos al crear el cuerpo: así pasamos de “un id de Box2D” a “el jugador”.</li>
<li><code>b2Shape_IsValid</code>: si un cuerpo se destruyó en este mismo paso, su evento puede seguir en la lista. Se comprueba antes de usarlo.</li>
</ul>
<h3>Physics.cpp · crear, borrar y consultar</h3>
${code(String.raw`
PhysBody* Physics::AddBody(b2BodyId body, int width, int height)
{
    PhysBody* pbody = new PhysBody();
    pbody->body = body;
    pbody->width = width;
    pbody->height = height;
    b2Body_SetUserData(body, pbody);   // from the Box2D body we can get back to our PhysBody
    bodies.push_back(pbody);
    return pbody;
}

static b2BodyType ToBox2D(BodyType type)
{
    switch (type)
    {
    case BodyType::STATIC: return b2_staticBody;
    case BodyType::KINEMATIC: return b2_kinematicBody;
    default: return b2_dynamicBody;
    }
}

PhysBody* Physics::CreateRectangle(int x, int y, int width, int height, BodyType type)
{
    b2BodyDef bodyDef = b2DefaultBodyDef();
    bodyDef.type = ToBox2D(type);
    bodyDef.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
    bodyDef.fixedRotation = true;                       // platformer bodies do not roll
    b2BodyId body = b2CreateBody(world, &bodyDef);

    b2Polygon box = b2MakeBox(PIXEL_TO_METERS(width) * 0.5f, PIXEL_TO_METERS(height) * 0.5f);   // half sizes!
    b2ShapeDef shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1.0f;
    shapeDef.material.friction = 0.0f;                  // no friction: the player does not stick to walls
    shapeDef.enableContactEvents = true;
    shapeDef.enableSensorEvents = true;                 // Box2D 3.1: needed to be detected by sensors
    b2CreatePolygonShape(body, &shapeDef, &box);

    return AddBody(body, width, height);
}

PhysBody* Physics::CreateCircle(int x, int y, int radius, BodyType type)
{
    b2BodyDef bodyDef = b2DefaultBodyDef();
    bodyDef.type = ToBox2D(type);
    bodyDef.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
    bodyDef.fixedRotation = true;
    b2BodyId body = b2CreateBody(world, &bodyDef);

    b2Circle circle = { { 0.0f, 0.0f }, PIXEL_TO_METERS(radius) };
    b2ShapeDef shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1.0f;
    shapeDef.enableContactEvents = true;
    shapeDef.enableSensorEvents = true;
    b2CreateCircleShape(body, &shapeDef, &circle);

    return AddBody(body, radius * 2, radius * 2);
}

PhysBody* Physics::CreateRectangleSensor(int x, int y, int width, int height, BodyType type)
{
    b2BodyDef bodyDef = b2DefaultBodyDef();
    bodyDef.type = ToBox2D(type);
    bodyDef.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
    b2BodyId body = b2CreateBody(world, &bodyDef);

    b2Polygon box = b2MakeBox(PIXEL_TO_METERS(width) * 0.5f, PIXEL_TO_METERS(height) * 0.5f);
    b2ShapeDef shapeDef = b2DefaultShapeDef();
    shapeDef.isSensor = true;                           // detects, does not push
    shapeDef.enableSensorEvents = true;
    b2CreatePolygonShape(body, &shapeDef, &box);

    return AddBody(body, width, height);
}

void Physics::DeletePhysBody(PhysBody* pbody)
{
    if (pbody != nullptr) pbody->pendingToDelete = true;
}

void Physics::DestroyPendingBodies()
{
    for (auto it = bodies.begin(); it != bodies.end();)
    {
        PhysBody* pbody = *it;
        if (pbody->pendingToDelete)
        {
            b2DestroyBody(pbody->body);   // Box2D frees its body and shapes
            delete pbody;                 // we free our wrapper
            it = bodies.erase(it);
        }
        else ++it;
    }
}

bool Physics::IsOnGround(const PhysBody* pbody) const
{
    b2ContactData contacts[8];
    int count = b2Body_GetContactData(pbody->body, contacts, 8);
    for (int i = 0; i < count; ++i)
    {
        if (contacts[i].manifold.pointCount == 0) continue;
        // The normal goes from shape A to shape B. If we are B, turn it around
        b2Vec2 normal = contacts[i].manifold.normal;
        if (B2_ID_EQUALS(b2Shape_GetBody(contacts[i].shapeIdB), pbody->body)) normal = b2Neg(normal);
        if (normal.y > 0.5f) return true;   // the other body is below us (Y grows downwards)
    }
    return false;
}

b2Vec2 Physics::GetLinearVelocity(const PhysBody* pbody) const
{
    return b2Body_GetLinearVelocity(pbody->body);
}

void Physics::SetLinearVelocity(PhysBody* pbody, b2Vec2 velocity)
{
    b2Body_SetLinearVelocity(pbody->body, velocity);
}

void Physics::ApplyLinearImpulse(PhysBody* pbody, b2Vec2 impulse)
{
    b2Body_ApplyLinearImpulseToCenter(pbody->body, impulse, true);
}

void Physics::SetPosition(PhysBody* pbody, int x, int y)
{
    b2Body_SetTransform(pbody->body, { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) }, b2Rot_identity);
    b2Body_SetLinearVelocity(pbody->body, { 0.0f, 0.0f });
    b2Body_SetAwake(pbody->body, true);   // a sleeping body would stay floating where we put it
}`, "cpp", "Physics.cpp · creación de cuerpos y utilidades")}
<ul>
<li><strong><code>enableSensorEvents = true</code> en todas las formas</strong>: en Box2D 3.1 un sensor solo detecta formas que lo tengan activado. Si se te olvida en el jugador, las monedas no se recogen.</li>
<li><code>friction = 0</code>: si no, el jugador se queda pegado a las paredes al saltar contra ellas.</li>
<li><code>fixedRotation = true</code>: el caballero no rueda.</li>
<li><code>DeletePhysBody</code> solo marca; el borrado real es al principio del siguiente <code>PreUpdate</code>. Nunca se destruye un cuerpo mientras se procesan sus eventos.</li>
<li><code>IsOnGround</code>: recorre los contactos del cuerpo y mira la <strong>normal</strong>. Si apunta hacia abajo (del jugador hacia el otro cuerpo), hay suelo debajo.</li>
<li><code>SetPosition</code> termina con <code>b2Body_SetAwake(…, true)</code>. Sin esa línea, un cuerpo “dormido” teletransportado se queda flotando: este bug lo encontró la prueba automática.</li>
</ul>
<figure style="margin:16px 0"><img src="plataformas/docs/colliders_f9.jpg" alt="F9: colliders de Box2D. Verde: sólidos (fíjate en que el suelo es una sola caja por fila). Amarillo: sensores (monedas, agua)" style="width:100%;border-radius:6px;border:1px solid var(--line)"><figcaption style="font-size:.82rem;color:var(--ink-3);margin-top:4px">F9: colliders de Box2D. Verde: sólidos (fíjate en que el suelo es una sola caja por fila). Amarillo: sensores (monedas, agua) (captura real del juego compilado)</figcaption></figure>

${nota(`<p>Con la física activada, al pulsar <kbd>F9</kbd> (cuando tengas la Scene completa) verás las cajas verdes sobre el suelo y las plataformas, como en la captura. De momento basta con que compile y que el mapa siga viéndose.</p>`, "game", "Compila y comprueba")}
<h2 id="pfase7">Fase 7 · Entidades, gestor y animaciones</h2>

${code(String.raw`
#pragma once

#include <string>
#include "Vector2D.h"
#include "pugixml.hpp"

class PhysBody;

enum class EntityType { PLAYER, ITEM, ENEMY, UNKNOWN };

// Base class of everything that lives in the level: player, coins, enemies (L04)
class Entity
{
public:
    Entity(EntityType type) : type(type) {}
    virtual ~Entity() {}

    virtual bool Awake() { return true; }
    virtual bool Start() { return true; }
    virtual bool Update(float dt) { return true; }
    virtual bool CleanUp() { return true; }

    // Called by Physics when our body touches / stops touching another one (L08)
    virtual void OnCollision(PhysBody* physA, PhysBody* physB) {}
    virtual void OnCollisionEnd(PhysBody* physA, PhysBody* physB) {}

    // Its node of config.xml (L10)
    virtual void SetParameters(pugi::xml_node p) { parameters = p; }

public:
    std::string name;
    EntityType type;
    bool active = true;
    bool pendingToDelete = false;   // the EntityManager deletes it at the end of the frame
    bool started = false;           // Awake() and Start() already called
    Vector2D position;              // pixels
    pugi::xml_node parameters;
};
`, "cpp", "Entity.h")}
<p>La base de todo lo que vive en el nivel (<a href="#l04">lección 04</a>). Dos novedades: <code>pendingToDelete</code> (la entidad pide que la borren al final del frame) y <code>started</code> (para las entidades que se crean durante la partida).</p>
${code(String.raw`
#pragma once

#include "Module.h"
#include "Entity.h"
#include <list>
#include <memory>

class EntityManager : public Module
{
public:
    EntityManager();

    bool Awake() override;
    bool Start() override;
    bool Update(float dt) override;
    bool CleanUp() override;

    // Factory (L04): creates the right class for the type
    std::shared_ptr<Entity> CreateEntity(EntityType type);

    // Marks every entity of a type to be deleted (restart the level)
    void DestroyAll(EntityType type);

public:
    std::list<std::shared_ptr<Entity>> entities;
};
`, "cpp", "EntityManager.h")}${code(String.raw`
#include "EntityManager.h"
#include "Player.h"
#include "Item.h"
#include "Enemy.h"
#include "Log.h"

EntityManager::EntityManager()
{
    name = "entitymanager";
}

bool EntityManager::Awake()
{
    return true;
}

// The entities created in Scene::Awake() start here, after every module has its resources ready
bool EntityManager::Start()
{
    for (const auto& entity : entities)
    {
        if (!entity->Awake() || !entity->Start()) return false;
        entity->started = true;
    }
    return true;
}

std::shared_ptr<Entity> EntityManager::CreateEntity(EntityType type)
{
    std::shared_ptr<Entity> entity = nullptr;

    switch (type)
    {
    case EntityType::PLAYER: entity = std::make_shared<Player>(); break;
    case EntityType::ITEM:   entity = std::make_shared<Item>();   break;
    case EntityType::ENEMY:  entity = std::make_shared<Enemy>();  break;
    default:
        LOG("CreateEntity: unknown type");
        return nullptr;
    }

    entities.push_back(entity);
    return entity;
}

void EntityManager::DestroyAll(EntityType type)
{
    for (const auto& entity : entities)
        if (entity->type == type) entity->pendingToDelete = true;
}

bool EntityManager::Update(float dt)
{
    // Copy the list first: an Update may create new entities
    std::list<std::shared_ptr<Entity>> list = entities;
    for (const auto& entity : list)
    {
        if (!entity->active || entity->pendingToDelete) continue;

        // Entities created during the game (coins when the level restarts...) start now
        if (!entity->started)
        {
            if (!entity->Awake() || !entity->Start()) return false;
            entity->started = true;
        }

        if (!entity->Update(dt)) return false;
    }

    // Delete the entities marked during this frame (never while iterating the list above)
    for (auto it = entities.begin(); it != entities.end();)
    {
        if ((*it)->pendingToDelete)
        {
            (*it)->CleanUp();
            it = entities.erase(it);   // shared_ptr: the object is deleted here
        }
        else ++it;
    }
    return true;
}

bool EntityManager::CleanUp()
{
    for (const auto& entity : entities) entity->CleanUp();
    entities.clear();
    return true;
}
`, "cpp", "EntityManager.cpp")}
<ul>
<li><code>CreateEntity</code> es la fábrica de la lección 04.</li>
<li>En <code>Update</code> se recorre una <strong>copia</strong> de la lista: así una entidad puede crear otras sin romper el bucle.</li>
<li>El borrado va en un segundo bucle, después de actualizar a todas. Borrar mientras se recorre una lista es un crash clásico.</li>
</ul>
<h3>Animaciones desde Tiled</h3>
${code(String.raw`
#pragma once

#include <SDL3/SDL.h>
#include <map>
#include <string>
#include <vector>

// A sequence of frames (rectangles of a spritesheet) with a duration each (L10)
class Animation
{
public:
    void AddFrame(const SDL_Rect& rect, int durationMs) { frames.push_back({ rect, durationMs }); }
    void SetLoop(bool l) { loop = l; }
    void Reset() { currentFrame = 0; timer = 0.0f; finished = false; }
    void Update(float dtMs);

    const SDL_Rect& GetCurrentFrame() const { return frames[currentFrame].rect; }
    bool HasFinished() const { return finished; }
    bool IsEmpty() const { return frames.empty(); }

private:
    struct Frame { SDL_Rect rect; int durationMs; };
    std::vector<Frame> frames;
    int currentFrame = 0;
    float timer = 0.0f;
    bool loop = true;
    bool finished = false;
};

// All the animations of a character, loaded from a Tiled .tsx
class AnimationSet
{
public:
    // aliases: id of the first tile of each animation -> name ("idle", "run"...)
    bool LoadFromTSX(const char* path, const std::map<int, std::string>& aliases);

    void SetCurrent(const std::string& name);
    void SetLoop(const std::string& name, bool loop);
    const std::string& GetCurrentName() const { return current; }
    void Update(float dtMs);
    const SDL_Rect& GetCurrentFrame() const;
    bool HasFinished() const;

private:
    std::map<std::string, Animation> animations;
    std::string current;
};
`, "cpp", "Animation.h")}${code(String.raw`
#include "Animation.h"
#include "Log.h"
#include "pugixml.hpp"

void Animation::Update(float dtMs)
{
    if (frames.empty() || finished) return;

    timer += dtMs;
    // while, not if: with a big dt we may have to skip several frames
    while (timer >= frames[currentFrame].durationMs)
    {
        timer -= frames[currentFrame].durationMs;
        currentFrame++;
        if (currentFrame >= (int)frames.size())
        {
            if (loop) currentFrame = 0;
            else { currentFrame = (int)frames.size() - 1; finished = true; break; }
        }
    }
}

bool AnimationSet::LoadFromTSX(const char* path, const std::map<int, std::string>& aliases)
{
    pugi::xml_document doc;
    pugi::xml_parse_result result = doc.load_file(path);
    if (!result)
    {
        LOG("Could not load %s: %s", path, result.description());
        return false;
    }

    pugi::xml_node tileset = doc.child("tileset");
    int tw = tileset.attribute("tilewidth").as_int();
    int th = tileset.attribute("tileheight").as_int();
    int columns = tileset.attribute("columns").as_int();

    for (pugi::xml_node tile = tileset.child("tile"); tile; tile = tile.next_sibling("tile"))
    {
        pugi::xml_node animNode = tile.child("animation");
        if (!animNode) continue;

        int id = tile.attribute("id").as_int();
        auto alias = aliases.find(id);
        std::string name = (alias != aliases.end()) ? alias->second : "tile" + std::to_string(id);

        Animation anim;
        for (pugi::xml_node f = animNode.child("frame"); f; f = f.next_sibling("frame"))
        {
            int tileId = f.attribute("tileid").as_int();
            // The same formula as the map (L07), without firstgid, margin or spacing
            SDL_Rect r = { (tileId % columns) * tw, (tileId / columns) * th, tw, th };
            anim.AddFrame(r, f.attribute("duration").as_int(100));
        }
        animations[name] = anim;
    }

    if (animations.empty())
    {
        LOG("%s has no animations", path);
        return false;
    }
    current = animations.begin()->first;
    return true;
}

void AnimationSet::SetCurrent(const std::string& name)
{
    if (name == current) return;                  // if not, it would restart every frame
    if (animations.find(name) == animations.end()) return;
    current = name;
    animations[current].Reset();
}

void AnimationSet::SetLoop(const std::string& name, bool loop)
{
    auto it = animations.find(name);
    if (it != animations.end()) it->second.SetLoop(loop);
}

void AnimationSet::Update(float dtMs)
{
    animations[current].Update(dtMs);
}

const SDL_Rect& AnimationSet::GetCurrentFrame() const
{
    return animations.at(current).GetCurrentFrame();
}

bool AnimationSet::HasFinished() const
{
    return animations.at(current).HasFinished();
}
`, "cpp", "Animation.cpp")}
<p>Es el código de la <a href="#l10">lección 10</a>. Las animaciones del caballero están en <code>Assets/Textures/knight.tsx</code> (hecho con el editor de animaciones de Tiled):</p>
${code(String.raw`
<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.0" name="knight" tilewidth="40" tileheight="44" tilecount="64" columns="8">
 <image source="knight.png" width="320" height="352"/>
 <tile id="0">
  <animation>
   <frame tileid="0" duration="200"/>
   <frame tileid="1" duration="200"/>
   <frame tileid="2" duration="200"/>
   <frame tileid="3" duration="200"/>
  </animation>
 </tile>
 <tile id="16">
  <animation>
   <frame tileid="16" duration="70"/>
   <frame tileid="17" duration="70"/>
   <frame tileid="18" duration="70"/>
   <frame tileid="19" duration="70"/>
   <frame tileid="20" duration="70"/>
   <frame tileid="21" duration="70"/>
   <frame tileid="22" duration="70"/>
   <frame tileid="23" duration="70"/>
   <frame tileid="24" duration="70"/>
   <frame tileid="25" duration="70"/>
   <frame tileid="26" duration="70"/>
   <frame tileid="27" duration="70"/>
   <frame tileid="28" duration="70"/>
   <frame tileid="29" duration="70"/>
   <frame tileid="30" duration="70"/>
   <frame tileid="31" duration="70"/>
  </animation>
 </tile>
 <tile id="20">
  <animation>
   <frame tileid="20" duration="1000"/>
  </animation>
 </tile>
 <tile id="48">
  <animation>
   <frame tileid="48" duration="100"/>
   <frame tileid="49" duration="100"/>
   <frame tileid="50" duration="100"/>
   <frame tileid="51" duration="100"/>
  </animation>
 </tile>
 <tile id="56">
  <animation>
   <frame tileid="56" duration="200"/>
   <frame tileid="57" duration="200"/>
   <frame tileid="58" duration="200"/>
   <frame tileid="59" duration="600"/>
  </animation>
 </tile>
</tileset>
`, "xml", "knight.tsx")}
<p>Cada <code>&lt;tile id="…"&gt;</code> con <code>&lt;animation&gt;</code> es una animación. El código le pone nombre con los <em>alias</em>: <code>{ 0, "idle" }, { 16, "run" }, { 20, "jump" }, { 48, "hurt" }, { 56, "death" }</code>. Haz también <code>slime.tsx</code> y <code>coin.tsx</code> (están en el repositorio).</p>

${nota(`<p>Compila. Todavía no hay entidades creadas, así que no verás nada nuevo: el jugador llega en la fase 8.</p>`, "game", "Compila y comprueba")}
<h2 id="pfase8">Fase 8 · El jugador</h2>

${code(String.raw`
#pragma once

#include "Entity.h"
#include "Animation.h"
#include "Timer.h"
#include <SDL3/SDL.h>

class PhysBody;

class Player : public Entity
{
public:
    Player();

    bool Awake() override;
    bool Start() override;
    bool Update(float dt) override;
    bool CleanUp() override;

    void OnCollision(PhysBody* physA, PhysBody* physB) override;

    // Back to a point of the level (spawn, load game). Keeps lives and coins
    void Respawn(int x, int y);
    // New game: full lives, alive
    void ResetForNewGame(int x, int y);

    void ToggleGodMode();
    bool IsDead() const { return dead && anims.HasFinished(); }
    void GetBodyPosition(int& x, int& y) const;

public:
    int lives = 3;
    int maxLives = 3;
    bool reachedGoal = false;
    bool godMode = false;

private:
    void Move();
    void Jump();
    void GodMove();
    void Hurt(bool instantDeath);
    void UpdateAnimation(float dt);
    void Draw();

private:
    SDL_Texture* texture = nullptr;
    AnimationSet anims;
    PhysBody* pbody = nullptr;

    float speed = 6.0f;       // m/s
    float jumpSpeed = 12.5f;  // m/s
    int bodyW = 20, bodyH = 36;

    bool grounded = false;
    bool facingLeft = false;
    bool dead = false;
    bool pendingRespawn = false;
    Timer airTimer;           // coyote time: you can still jump right after leaving a platform
    Timer hurtTimer;          // invulnerability after being hit
    bool invulnerable = false;
    float invulnerableSec = 1.5f;

    int jumpFx = 0, hurtFx = 0, stompFx = 0;
};
`, "cpp", "Player.h")}
<h3>Arranque</h3>
${code(String.raw`
bool Player::Awake()
{
    // Parameters from config.xml: <scene><entities><player> (L05, L10)
    speed = parameters.child("movement").attribute("speed").as_float(6.0f);
    jumpSpeed = parameters.child("movement").attribute("jump").as_float(12.5f);
    bodyW = parameters.child("body").attribute("width").as_int(20);
    bodyH = parameters.child("body").attribute("height").as_int(36);
    maxLives = lives = parameters.child("lives").attribute("value").as_int(3);
    return true;
}

bool Player::Start()
{
    Engine& engine = Engine::GetInstance();

    texture = engine.textures->Load(parameters.child("texture").attribute("path").as_string());
    std::map<int, std::string> aliases = { { 0, "idle" }, { 16, "run" }, { 20, "jump" }, { 48, "hurt" }, { 56, "death" } };
    anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), aliases);
    anims.SetLoop("hurt", false);
    anims.SetLoop("death", false);
    anims.SetCurrent("idle");

    // position = center of the body, in pixels
    pbody = engine.physics->CreateRectangle((int)position.getX(), (int)position.getY(), bodyW, bodyH, BodyType::DYNAMIC);
    pbody->listener = this;            // tell me about my collisions
    pbody->ctype = ColliderType::PLAYER;

    pugi::xml_node fx = engine.scene->configParameters.child("fx");
    jumpFx = engine.audio->LoadFx(fx.attribute("jump").as_string());
    hurtFx = engine.audio->LoadFx(fx.attribute("hurt").as_string());
    stompFx = engine.audio->LoadFx(fx.attribute("stomp").as_string());
    return true;
}`, "cpp", "Player.cpp · Awake y Start")}
<p><code>Awake</code> lee números de <code>config.xml</code>; <code>Start</code> carga recursos y crea el cuerpo (en Awake el módulo de texturas aún no está listo). <code>pbody-&gt;listener = this</code>: “avísame a mí de mis choques”.</p>
<h3>Update, moverse y saltar</h3>
${code(String.raw`
bool Player::Update(float dt)
{
    Physics& physics = *Engine::GetInstance().physics;

    if (pendingRespawn)
    {
        // Collisions only write down what happened; we act here (L08)
        pendingRespawn = false;
        Vector2D spawn = Engine::GetInstance().scene->GetCheckpoint();
        Respawn((int)spawn.getX(), (int)spawn.getY());
    }

    if (invulnerable && hurtTimer.ReadSec() >= invulnerableSec) invulnerable = false;

    if (!dead)
    {
        grounded = physics.IsOnGround(pbody);
        if (grounded) airTimer.Start();

        if (!Engine::GetInstance().scene->IsPlaying())
            physics.SetLinearVelocity(pbody, { 0.0f, physics.GetLinearVelocity(pbody).y });   // title screen: no control
        else if (godMode) GodMove();
        else
        {
            Move();
            Jump();
        }
    }
    else
    {
        physics.SetLinearVelocity(pbody, { 0.0f, physics.GetLinearVelocity(pbody).y });
    }

    UpdateAnimation(dt);
    Draw();
    return true;
}

void Player::Move()
{
    Physics& physics = *Engine::GetInstance().physics;
    Input& input = *Engine::GetInstance().input;

    // Keep the vertical speed (gravity, jump) and decide the horizontal one
    b2Vec2 velocity = physics.GetLinearVelocity(pbody);
    velocity.x = 0.0f;
    if (input.GetKey(SDL_SCANCODE_A) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_LEFT) == KEY_REPEAT) { velocity.x = -speed; facingLeft = true; }
    if (input.GetKey(SDL_SCANCODE_D) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_RIGHT) == KEY_REPEAT) { velocity.x = speed; facingLeft = false; }

    // Knocked back after a hit: let the impulse act for a moment
    if (invulnerable && hurtTimer.ReadSec() < 0.25f) velocity.x = physics.GetLinearVelocity(pbody).x;

    physics.SetLinearVelocity(pbody, velocity);
}

void Player::Jump()
{
    Physics& physics = *Engine::GetInstance().physics;
    Input& input = *Engine::GetInstance().input;
    b2Vec2 velocity = physics.GetLinearVelocity(pbody);

    // Coyote time: 0.1 s after leaving a platform you can still jump
    bool canJump = grounded || airTimer.ReadSec() < 0.1f;
    if (input.GetKey(SDL_SCANCODE_SPACE) == KEY_DOWN && canJump && velocity.y > -1.0f)
    {
        velocity.y = -jumpSpeed;            // up is negative Y
        physics.SetLinearVelocity(pbody, velocity);
        Engine::GetInstance().audio->PlayFx(jumpFx);
        // velocity.y > -1 in the condition: the coyote time cannot give a second jump
    }

    // Variable jump: release space early and the jump is shorter
    if (input.GetKey(SDL_SCANCODE_SPACE) == KEY_UP && velocity.y < 0.0f)
    {
        velocity.y *= 0.5f;
        physics.SetLinearVelocity(pbody, velocity);
    }
}`, "cpp", "Player.cpp · Update, Move y Jump")}
<ul>
<li><strong>Moverse</strong>: se lee la velocidad actual, se cambia solo la X y se aplica. La Y (gravedad, salto) se conserva (<a href="#l08">lección 08</a>).</li>
<li><strong>Saltar</strong>: se fija la velocidad vertical hacia arriba (Y negativa). Solo si estás en el suelo…</li>
<li>…o en el <strong>tiempo de coyote</strong>: 0,1 s después de dejar una plataforma aún puedes saltar. Es un truco que usan casi todos los plataformas: sin él, los saltos al borde fallan y el juego parece injusto.</li>
<li><strong>Salto variable</strong>: si sueltas Espacio (<code>KEY_UP</code>) mientras subes, la velocidad se reduce a la mitad. Toque corto = salto bajo; mantener = salto alto.</li>
</ul>
<figure style="margin:16px 0"><img src="plataformas/docs/salto.jpg" alt="El caballero saltando" style="width:100%;border-radius:6px;border:1px solid var(--line)"><figcaption style="font-size:.82rem;color:var(--ink-3);margin-top:4px">El caballero saltando (captura real del juego compilado)</figcaption></figure>
<h3>Choques: agua, meta y slimes</h3>
${code(String.raw`
void Player::GodMove()
{
    Input& input = *Engine::GetInstance().input;
    b2Vec2 velocity = { 0.0f, 0.0f };
    float s = speed * 1.5f;
    if (input.GetKey(SDL_SCANCODE_A) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_LEFT) == KEY_REPEAT) { velocity.x = -s; facingLeft = true; }
    if (input.GetKey(SDL_SCANCODE_D) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_RIGHT) == KEY_REPEAT) { velocity.x = s; facingLeft = false; }
    if (input.GetKey(SDL_SCANCODE_W) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_UP) == KEY_REPEAT) velocity.y = -s;
    if (input.GetKey(SDL_SCANCODE_S) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_DOWN) == KEY_REPEAT) velocity.y = s;
    Engine::GetInstance().physics->SetLinearVelocity(pbody, velocity);
}

void Player::ToggleGodMode()
{
    godMode = !godMode;
    // God mode: fly through the level ignoring gravity
    b2Body_SetGravityScale(pbody->body, godMode ? 0.0f : 1.0f);
    LOG("God mode %s", godMode ? "ON" : "OFF");
}

void Player::OnCollision(PhysBody* physA, PhysBody* physB)
{
    if (dead) return;

    switch (physB->ctype)
    {
    case ColliderType::DEATH:
        if (!godMode) Hurt(true);
        break;

    case ColliderType::GOAL:
        reachedGoal = true;
        break;

    case ColliderType::ENEMY:
    {
        Enemy* enemy = dynamic_cast<Enemy*>(physB->listener);
        if (enemy == nullptr || enemy->IsDying()) break;

        // Stomp: our feet are at the height of the top of the enemy (a few pixels of margin).
        // Do not use the vertical speed: when this event arrives, Box2D has already solved
        // the collision and our speed is ~0
        int px, py, ex, ey;
        pbody->GetPosition(px, py);
        physB->GetPosition(ex, ey);
        int feet = py + bodyH / 2;
        int enemyTop = ey - physB->height / 2;
        if (feet <= enemyTop + 4)
        {
            enemy->Kill();
            Engine::GetInstance().audio->PlayFx(stompFx);
            b2Vec2 v = Engine::GetInstance().physics->GetLinearVelocity(pbody);
            v.y = -jumpSpeed * 0.6f;   // bounce
            Engine::GetInstance().physics->SetLinearVelocity(pbody, v);
        }
        else if (!godMode)
        {
            Hurt(false);
            // knock back away from the enemy
            float dir = (px < ex) ? -1.0f : 1.0f;
            Engine::GetInstance().physics->SetLinearVelocity(pbody, { dir * 7.0f, -6.0f });
        }
        break;
    }

    default:
        break;
    }
}

void Player::Hurt(bool instantDeath)
{
    // Invulnerable for a while after a hit (falling into a pit always counts)
    if (!instantDeath && invulnerable) return;

    lives--;
    invulnerable = true;
    hurtTimer.Start();
    Engine::GetInstance().audio->PlayFx(hurtFx);

    if (lives <= 0)
    {
        lives = 0;
        dead = true;
        anims.SetCurrent("death");
    }
    else if (instantDeath)
    {
        pendingRespawn = true;   // never teleport a body inside a collision callback
    }
}`, "cpp", "Player.cpp · modo dios, OnCollision y Hurt")}
<ul>
<li><strong>Pisotón</strong>: si mis pies están a la altura de la parte de arriba del slime, lo mato y reboto. Si no, me hace daño y me empuja hacia atrás.</li>
${nota(`<p><strong>Un error sutil que encontró la prueba automática:</strong> la primera versión comprobaba también “estoy cayendo” (<code>velocidad.y &gt; 0</code>). Nunca funcionaba: cuando llega el evento de contacto, Box2D <strong>ya ha resuelto el choque</strong> y la velocidad vertical vale ~0. Por eso se decide solo por posición.</p>`, "warn")}
<li><strong>Invulnerabilidad</strong>: tras un golpe, 1,5 s en los que no te pueden volver a dañar (y el caballero parpadea). Caer al agua sí cuenta siempre.</li>
<li>Caer al agua no te teletransporta dentro del callback: marca <code>pendingRespawn</code> y es <code>Update</code> quien lo hace.</li>
</ul>
<h3>Reaparecer, animar y dibujar</h3>
${code(String.raw`
void Player::Respawn(int x, int y)
{
    Engine::GetInstance().physics->SetPosition(pbody, x, y);
    anims.SetCurrent("idle");
}

void Player::ResetForNewGame(int x, int y)
{
    lives = maxLives;
    dead = false;
    invulnerable = false;
    reachedGoal = false;
    pendingRespawn = false;
    facingLeft = false;
    Respawn(x, y);
}

void Player::UpdateAnimation(float dt)
{
    if (dead) anims.SetCurrent("death");
    else if (invulnerable && hurtTimer.ReadSec() < 0.3f) anims.SetCurrent("hurt");
    else if (!grounded && !godMode) anims.SetCurrent("jump");
    else if (Engine::GetInstance().physics->GetLinearVelocity(pbody).x != 0.0f) anims.SetCurrent("run");
    else anims.SetCurrent("idle");

    anims.Update(dt);
}

void Player::Draw()
{
    int x, y;
    pbody->GetPosition(x, y);
    position = Vector2D((float)x, (float)y);

    // Blink while invulnerable (not drawn every other 100 ms)
    if (invulnerable && !dead && ((int)(hurtTimer.ReadMSec() / 100.0f) % 2 == 1)) return;

    // The frame is 40x44 and the knight stands on the pixel row 40: align it with the bottom of the body
    const SDL_Rect& frame = anims.GetCurrentFrame();
    Engine::GetInstance().render->DrawTexture(texture, x - 21, y + bodyH / 2 - 40, &frame, 1.0f, 0.0, facingLeft);
}

void Player::GetBodyPosition(int& x, int& y) const
{
    pbody->GetPosition(x, y);
}

bool Player::CleanUp()
{
    Engine::GetInstance().textures->UnLoad(texture);
    Engine::GetInstance().physics->DeletePhysBody(pbody);
    return true;
}`, "cpp", "Player.cpp · Respawn, animación, Draw y CleanUp")}
<ul>
<li><code>UpdateAnimation</code> es una pequeña máquina de estados: la primera condición que se cumple gana (muerto &gt; dañado &gt; en el aire &gt; corriendo &gt; quieto).</li>
<li><code>Draw</code>: el frame mide 40×44 y el caballero apoya los pies en la fila 40 del frame. Por eso se dibuja en <code>y + bodyH/2 - 40</code>: los pies del dibujo coinciden con la base del cuerpo físico. Y <code>facingLeft</code> voltea el sprite en vez de tener animaciones duplicadas.</li>
</ul>
<p>Para verlo ya, en la Scene mínima crea el jugador en <code>Awake</code> y colócalo en <code>Start</code> (tras cargar el mapa) con el código de la fase 11, o simplemente con <code>player-&gt;position = Vector2D(100, 500);</code>. Necesitarás también los métodos <code>IsPlaying()</code> (que devuelva true) y <code>GetCheckpoint()</code> de la Scene.</p>

${nota(`<p><strong>¡Ya juegas!</strong> El caballero cae sobre el césped, corre con <kbd>A</kbd>/<kbd>D</kbd> o las flechas (girándose), salta con <kbd>Espacio</kbd> (más alto si mantienes) y puede subir a las plataformas. Si cae al agua, vuelve al inicio con una vida menos. La cámara aún no le sigue: llega en la lección 15.</p>`, "game", "Compila y comprueba")}
${nota(`<p><strong>Cae a través del suelo</strong>: falta <code>CreateColliders()</code> o la capa no tiene la propiedad <code>Collision</code>. <strong>No salta nunca</strong>: <code>IsOnGround</code> siempre false; revisa el signo de la normal. <strong>Se queda pegado a las paredes</strong>: falta <code>friction = 0</code>. <strong>El dibujo va desplazado respecto a F9</strong>: revisa los números de <code>Draw</code>.</p>`, "warn", "Si no funciona")}
<h2>Archivos de esta lección</h2><details class="reto"><summary><span>Archivo completo</span>Map.cpp</summary>${code(String.raw`
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
`, "cpp", "Map.cpp")}</details><details class="reto"><summary><span>Archivo completo</span>Physics.cpp</summary>${code(String.raw`
#include "Physics.h"
#include "Engine.h"
#include "Render.h"
#include "Entity.h"
#include "Log.h"

// PhysBody ---------------------------------------------------------------

void PhysBody::GetPosition(int& x, int& y) const
{
    b2Vec2 pos = b2Body_GetPosition(body);
    x = METERS_TO_PIXELS(pos.x);
    y = METERS_TO_PIXELS(pos.y);
}

float PhysBody::GetRotation() const
{
    return b2Rot_GetAngle(b2Body_GetRotation(body));
}

// Physics ----------------------------------------------------------------

Physics::Physics()
{
    name = "physics";
}

bool Physics::Start()
{
    b2WorldDef worldDef = b2DefaultWorldDef();
    worldDef.gravity = { 0.0f, GRAVITY_Y };
    world = b2CreateWorld(&worldDef);
    return true;
}

bool Physics::PreUpdate()
{
    DestroyPendingBodies();

    // Fixed time step (L03 / L08): as many steps of 1/60 s as fit in the time of the last frame
    accumulator += Engine::GetInstance().GetDt() / 1000.0f;
    int steps = 0;
    while (accumulator >= PHYSICS_DT && steps < 5)
    {
        b2World_Step(world, PHYSICS_DT, 4);
        ProcessContactEvents();
        accumulator -= PHYSICS_DT;
        steps++;
    }
    if (steps == 5) accumulator = 0.0f;   // too slow: do not try to catch up forever
    return true;
}

// Box2D 3 does not call us during the step: after it, we ask for the list of events
void Physics::ProcessContactEvents()
{
    // Solid contacts (player <-> platform, player <-> enemy...)
    b2ContactEvents contacts = b2World_GetContactEvents(world);
    for (int i = 0; i < contacts.beginCount; ++i)
    {
        const b2ContactBeginTouchEvent& e = contacts.beginEvents[i];
        if (!b2Shape_IsValid(e.shapeIdA) || !b2Shape_IsValid(e.shapeIdB)) continue;
        PhysBody* a = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdA));
        PhysBody* b = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdB));
        if (a == nullptr || b == nullptr || a->pendingToDelete || b->pendingToDelete) continue;
        if (a->listener) a->listener->OnCollision(a, b);
        if (b->listener) b->listener->OnCollision(b, a);
    }
    for (int i = 0; i < contacts.endCount; ++i)
    {
        const b2ContactEndTouchEvent& e = contacts.endEvents[i];
        if (!b2Shape_IsValid(e.shapeIdA) || !b2Shape_IsValid(e.shapeIdB)) continue;
        PhysBody* a = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdA));
        PhysBody* b = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdB));
        if (a == nullptr || b == nullptr) continue;
        if (a->listener) a->listener->OnCollisionEnd(a, b);
        if (b->listener) b->listener->OnCollisionEnd(b, a);
    }

    // Sensors (coins, death zones, goal): only tell the visitor and the sensor owner
    b2SensorEvents sensors = b2World_GetSensorEvents(world);
    for (int i = 0; i < sensors.beginCount; ++i)
    {
        const b2SensorBeginTouchEvent& e = sensors.beginEvents[i];
        if (!b2Shape_IsValid(e.sensorShapeId) || !b2Shape_IsValid(e.visitorShapeId)) continue;
        PhysBody* sensor = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.sensorShapeId));
        PhysBody* visitor = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.visitorShapeId));
        if (sensor == nullptr || visitor == nullptr || sensor->pendingToDelete || visitor->pendingToDelete) continue;
        if (sensor->listener) sensor->listener->OnCollision(sensor, visitor);
        if (visitor->listener) visitor->listener->OnCollision(visitor, sensor);
    }
}

bool Physics::PostUpdate()
{
    if (!debug) return true;

    // F9: draw every collider. Green = solid, yellow = sensor
    const Render& render = *Engine::GetInstance().render;
    for (PhysBody* pbody : bodies)
    {
        if (pbody->pendingToDelete) continue;
        int x, y;
        pbody->GetPosition(x, y);

        b2ShapeId shape;
        b2Body_GetShapes(pbody->body, &shape, 1);
        bool sensor = b2Shape_IsSensor(shape);
        Uint8 r = sensor ? 255 : 0, g = 255, b = 0;

        if (b2Shape_GetType(shape) == b2_circleShape)
        {
            // a circle as a 16-sided polygon
            float radius = (float)pbody->width / 2.0f;
            for (int i = 0; i < 16; ++i)
            {
                float a1 = i * 2.0f * B2_PI / 16, a2 = (i + 1) * 2.0f * B2_PI / 16;
                render.DrawLine(x + (int)(radius * cosf(a1)), y + (int)(radius * sinf(a1)),
                                x + (int)(radius * cosf(a2)), y + (int)(radius * sinf(a2)), r, g, b);
            }
        }
        else
        {
            SDL_Rect rect = { x - pbody->width / 2, y - pbody->height / 2, pbody->width, pbody->height };
            render.DrawRectangle(rect, r, g, b, 255, false);
        }
    }
    return true;
}

bool Physics::CleanUp()
{
    for (PhysBody* pbody : bodies) delete pbody;
    bodies.clear();
    if (B2_IS_NON_NULL(world)) b2DestroyWorld(world);   // destroys every Box2D body at once
    world = b2_nullWorldId;
    return true;
}

PhysBody* Physics::AddBody(b2BodyId body, int width, int height)
{
    PhysBody* pbody = new PhysBody();
    pbody->body = body;
    pbody->width = width;
    pbody->height = height;
    b2Body_SetUserData(body, pbody);   // from the Box2D body we can get back to our PhysBody
    bodies.push_back(pbody);
    return pbody;
}

static b2BodyType ToBox2D(BodyType type)
{
    switch (type)
    {
    case BodyType::STATIC: return b2_staticBody;
    case BodyType::KINEMATIC: return b2_kinematicBody;
    default: return b2_dynamicBody;
    }
}

PhysBody* Physics::CreateRectangle(int x, int y, int width, int height, BodyType type)
{
    b2BodyDef bodyDef = b2DefaultBodyDef();
    bodyDef.type = ToBox2D(type);
    bodyDef.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
    bodyDef.fixedRotation = true;                       // platformer bodies do not roll
    b2BodyId body = b2CreateBody(world, &bodyDef);

    b2Polygon box = b2MakeBox(PIXEL_TO_METERS(width) * 0.5f, PIXEL_TO_METERS(height) * 0.5f);   // half sizes!
    b2ShapeDef shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1.0f;
    shapeDef.material.friction = 0.0f;                  // no friction: the player does not stick to walls
    shapeDef.enableContactEvents = true;
    shapeDef.enableSensorEvents = true;                 // Box2D 3.1: needed to be detected by sensors
    b2CreatePolygonShape(body, &shapeDef, &box);

    return AddBody(body, width, height);
}

PhysBody* Physics::CreateCircle(int x, int y, int radius, BodyType type)
{
    b2BodyDef bodyDef = b2DefaultBodyDef();
    bodyDef.type = ToBox2D(type);
    bodyDef.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
    bodyDef.fixedRotation = true;
    b2BodyId body = b2CreateBody(world, &bodyDef);

    b2Circle circle = { { 0.0f, 0.0f }, PIXEL_TO_METERS(radius) };
    b2ShapeDef shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1.0f;
    shapeDef.enableContactEvents = true;
    shapeDef.enableSensorEvents = true;
    b2CreateCircleShape(body, &shapeDef, &circle);

    return AddBody(body, radius * 2, radius * 2);
}

PhysBody* Physics::CreateRectangleSensor(int x, int y, int width, int height, BodyType type)
{
    b2BodyDef bodyDef = b2DefaultBodyDef();
    bodyDef.type = ToBox2D(type);
    bodyDef.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
    b2BodyId body = b2CreateBody(world, &bodyDef);

    b2Polygon box = b2MakeBox(PIXEL_TO_METERS(width) * 0.5f, PIXEL_TO_METERS(height) * 0.5f);
    b2ShapeDef shapeDef = b2DefaultShapeDef();
    shapeDef.isSensor = true;                           // detects, does not push
    shapeDef.enableSensorEvents = true;
    b2CreatePolygonShape(body, &shapeDef, &box);

    return AddBody(body, width, height);
}

void Physics::DeletePhysBody(PhysBody* pbody)
{
    if (pbody != nullptr) pbody->pendingToDelete = true;
}

void Physics::DestroyPendingBodies()
{
    for (auto it = bodies.begin(); it != bodies.end();)
    {
        PhysBody* pbody = *it;
        if (pbody->pendingToDelete)
        {
            b2DestroyBody(pbody->body);   // Box2D frees its body and shapes
            delete pbody;                 // we free our wrapper
            it = bodies.erase(it);
        }
        else ++it;
    }
}

bool Physics::IsOnGround(const PhysBody* pbody) const
{
    b2ContactData contacts[8];
    int count = b2Body_GetContactData(pbody->body, contacts, 8);
    for (int i = 0; i < count; ++i)
    {
        if (contacts[i].manifold.pointCount == 0) continue;
        // The normal goes from shape A to shape B. If we are B, turn it around
        b2Vec2 normal = contacts[i].manifold.normal;
        if (B2_ID_EQUALS(b2Shape_GetBody(contacts[i].shapeIdB), pbody->body)) normal = b2Neg(normal);
        if (normal.y > 0.5f) return true;   // the other body is below us (Y grows downwards)
    }
    return false;
}

b2Vec2 Physics::GetLinearVelocity(const PhysBody* pbody) const
{
    return b2Body_GetLinearVelocity(pbody->body);
}

void Physics::SetLinearVelocity(PhysBody* pbody, b2Vec2 velocity)
{
    b2Body_SetLinearVelocity(pbody->body, velocity);
}

void Physics::ApplyLinearImpulse(PhysBody* pbody, b2Vec2 impulse)
{
    b2Body_ApplyLinearImpulseToCenter(pbody->body, impulse, true);
}

void Physics::SetPosition(PhysBody* pbody, int x, int y)
{
    b2Body_SetTransform(pbody->body, { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) }, b2Rot_identity);
    b2Body_SetLinearVelocity(pbody->body, { 0.0f, 0.0f });
    b2Body_SetAwake(pbody->body, true);   // a sleeping body would stay floating where we put it
}
`, "cpp", "Physics.cpp")}</details><details class="reto"><summary><span>Archivo completo</span>Player.cpp</summary>${code(String.raw`
#include "Player.h"
#include "Engine.h"
#include "Textures.h"
#include "Render.h"
#include "Input.h"
#include "Audio.h"
#include "Physics.h"
#include "Scene.h"
#include "Enemy.h"
#include "Log.h"

Player::Player() : Entity(EntityType::PLAYER)
{
    name = "Player";
}

bool Player::Awake()
{
    // Parameters from config.xml: <scene><entities><player> (L05, L10)
    speed = parameters.child("movement").attribute("speed").as_float(6.0f);
    jumpSpeed = parameters.child("movement").attribute("jump").as_float(12.5f);
    bodyW = parameters.child("body").attribute("width").as_int(20);
    bodyH = parameters.child("body").attribute("height").as_int(36);
    maxLives = lives = parameters.child("lives").attribute("value").as_int(3);
    return true;
}

bool Player::Start()
{
    Engine& engine = Engine::GetInstance();

    texture = engine.textures->Load(parameters.child("texture").attribute("path").as_string());
    std::map<int, std::string> aliases = { { 0, "idle" }, { 16, "run" }, { 20, "jump" }, { 48, "hurt" }, { 56, "death" } };
    anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), aliases);
    anims.SetLoop("hurt", false);
    anims.SetLoop("death", false);
    anims.SetCurrent("idle");

    // position = center of the body, in pixels
    pbody = engine.physics->CreateRectangle((int)position.getX(), (int)position.getY(), bodyW, bodyH, BodyType::DYNAMIC);
    pbody->listener = this;            // tell me about my collisions
    pbody->ctype = ColliderType::PLAYER;

    pugi::xml_node fx = engine.scene->configParameters.child("fx");
    jumpFx = engine.audio->LoadFx(fx.attribute("jump").as_string());
    hurtFx = engine.audio->LoadFx(fx.attribute("hurt").as_string());
    stompFx = engine.audio->LoadFx(fx.attribute("stomp").as_string());
    return true;
}

bool Player::Update(float dt)
{
    Physics& physics = *Engine::GetInstance().physics;

    if (pendingRespawn)
    {
        // Collisions only write down what happened; we act here (L08)
        pendingRespawn = false;
        Vector2D spawn = Engine::GetInstance().scene->GetCheckpoint();
        Respawn((int)spawn.getX(), (int)spawn.getY());
    }

    if (invulnerable && hurtTimer.ReadSec() >= invulnerableSec) invulnerable = false;

    if (!dead)
    {
        grounded = physics.IsOnGround(pbody);
        if (grounded) airTimer.Start();

        if (!Engine::GetInstance().scene->IsPlaying())
            physics.SetLinearVelocity(pbody, { 0.0f, physics.GetLinearVelocity(pbody).y });   // title screen: no control
        else if (godMode) GodMove();
        else
        {
            Move();
            Jump();
        }
    }
    else
    {
        physics.SetLinearVelocity(pbody, { 0.0f, physics.GetLinearVelocity(pbody).y });
    }

    UpdateAnimation(dt);
    Draw();
    return true;
}

void Player::Move()
{
    Physics& physics = *Engine::GetInstance().physics;
    Input& input = *Engine::GetInstance().input;

    // Keep the vertical speed (gravity, jump) and decide the horizontal one
    b2Vec2 velocity = physics.GetLinearVelocity(pbody);
    velocity.x = 0.0f;
    if (input.GetKey(SDL_SCANCODE_A) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_LEFT) == KEY_REPEAT) { velocity.x = -speed; facingLeft = true; }
    if (input.GetKey(SDL_SCANCODE_D) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_RIGHT) == KEY_REPEAT) { velocity.x = speed; facingLeft = false; }

    // Knocked back after a hit: let the impulse act for a moment
    if (invulnerable && hurtTimer.ReadSec() < 0.25f) velocity.x = physics.GetLinearVelocity(pbody).x;

    physics.SetLinearVelocity(pbody, velocity);
}

void Player::Jump()
{
    Physics& physics = *Engine::GetInstance().physics;
    Input& input = *Engine::GetInstance().input;
    b2Vec2 velocity = physics.GetLinearVelocity(pbody);

    // Coyote time: 0.1 s after leaving a platform you can still jump
    bool canJump = grounded || airTimer.ReadSec() < 0.1f;
    if (input.GetKey(SDL_SCANCODE_SPACE) == KEY_DOWN && canJump && velocity.y > -1.0f)
    {
        velocity.y = -jumpSpeed;            // up is negative Y
        physics.SetLinearVelocity(pbody, velocity);
        Engine::GetInstance().audio->PlayFx(jumpFx);
        // velocity.y > -1 in the condition: the coyote time cannot give a second jump
    }

    // Variable jump: release space early and the jump is shorter
    if (input.GetKey(SDL_SCANCODE_SPACE) == KEY_UP && velocity.y < 0.0f)
    {
        velocity.y *= 0.5f;
        physics.SetLinearVelocity(pbody, velocity);
    }
}

void Player::GodMove()
{
    Input& input = *Engine::GetInstance().input;
    b2Vec2 velocity = { 0.0f, 0.0f };
    float s = speed * 1.5f;
    if (input.GetKey(SDL_SCANCODE_A) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_LEFT) == KEY_REPEAT) { velocity.x = -s; facingLeft = true; }
    if (input.GetKey(SDL_SCANCODE_D) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_RIGHT) == KEY_REPEAT) { velocity.x = s; facingLeft = false; }
    if (input.GetKey(SDL_SCANCODE_W) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_UP) == KEY_REPEAT) velocity.y = -s;
    if (input.GetKey(SDL_SCANCODE_S) == KEY_REPEAT || input.GetKey(SDL_SCANCODE_DOWN) == KEY_REPEAT) velocity.y = s;
    Engine::GetInstance().physics->SetLinearVelocity(pbody, velocity);
}

void Player::ToggleGodMode()
{
    godMode = !godMode;
    // God mode: fly through the level ignoring gravity
    b2Body_SetGravityScale(pbody->body, godMode ? 0.0f : 1.0f);
    LOG("God mode %s", godMode ? "ON" : "OFF");
}

void Player::OnCollision(PhysBody* physA, PhysBody* physB)
{
    if (dead) return;

    switch (physB->ctype)
    {
    case ColliderType::DEATH:
        if (!godMode) Hurt(true);
        break;

    case ColliderType::GOAL:
        reachedGoal = true;
        break;

    case ColliderType::ENEMY:
    {
        Enemy* enemy = dynamic_cast<Enemy*>(physB->listener);
        if (enemy == nullptr || enemy->IsDying()) break;

        // Stomp: our feet are at the height of the top of the enemy (a few pixels of margin).
        // Do not use the vertical speed: when this event arrives, Box2D has already solved
        // the collision and our speed is ~0
        int px, py, ex, ey;
        pbody->GetPosition(px, py);
        physB->GetPosition(ex, ey);
        int feet = py + bodyH / 2;
        int enemyTop = ey - physB->height / 2;
        if (feet <= enemyTop + 4)
        {
            enemy->Kill();
            Engine::GetInstance().audio->PlayFx(stompFx);
            b2Vec2 v = Engine::GetInstance().physics->GetLinearVelocity(pbody);
            v.y = -jumpSpeed * 0.6f;   // bounce
            Engine::GetInstance().physics->SetLinearVelocity(pbody, v);
        }
        else if (!godMode)
        {
            Hurt(false);
            // knock back away from the enemy
            float dir = (px < ex) ? -1.0f : 1.0f;
            Engine::GetInstance().physics->SetLinearVelocity(pbody, { dir * 7.0f, -6.0f });
        }
        break;
    }

    default:
        break;
    }
}

void Player::Hurt(bool instantDeath)
{
    // Invulnerable for a while after a hit (falling into a pit always counts)
    if (!instantDeath && invulnerable) return;

    lives--;
    invulnerable = true;
    hurtTimer.Start();
    Engine::GetInstance().audio->PlayFx(hurtFx);

    if (lives <= 0)
    {
        lives = 0;
        dead = true;
        anims.SetCurrent("death");
    }
    else if (instantDeath)
    {
        pendingRespawn = true;   // never teleport a body inside a collision callback
    }
}

void Player::Respawn(int x, int y)
{
    Engine::GetInstance().physics->SetPosition(pbody, x, y);
    anims.SetCurrent("idle");
}

void Player::ResetForNewGame(int x, int y)
{
    lives = maxLives;
    dead = false;
    invulnerable = false;
    reachedGoal = false;
    pendingRespawn = false;
    facingLeft = false;
    Respawn(x, y);
}

void Player::UpdateAnimation(float dt)
{
    if (dead) anims.SetCurrent("death");
    else if (invulnerable && hurtTimer.ReadSec() < 0.3f) anims.SetCurrent("hurt");
    else if (!grounded && !godMode) anims.SetCurrent("jump");
    else if (Engine::GetInstance().physics->GetLinearVelocity(pbody).x != 0.0f) anims.SetCurrent("run");
    else anims.SetCurrent("idle");

    anims.Update(dt);
}

void Player::Draw()
{
    int x, y;
    pbody->GetPosition(x, y);
    position = Vector2D((float)x, (float)y);

    // Blink while invulnerable (not drawn every other 100 ms)
    if (invulnerable && !dead && ((int)(hurtTimer.ReadMSec() / 100.0f) % 2 == 1)) return;

    // The frame is 40x44 and the knight stands on the pixel row 40: align it with the bottom of the body
    const SDL_Rect& frame = anims.GetCurrentFrame();
    Engine::GetInstance().render->DrawTexture(texture, x - 21, y + bodyH / 2 - 40, &frame, 1.0f, 0.0, facingLeft);
}

void Player::GetBodyPosition(int& x, int& y) const
{
    pbody->GetPosition(x, y);
}

bool Player::CleanUp()
{
    Engine::GetInstance().textures->UnLoad(texture);
    Engine::GetInstance().physics->DeletePhysBody(pbody);
    return true;
}
`, "cpp", "Player.cpp")}</details>
<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Por qué los colliders del suelo se crean por tramos horizontales y no uno por tile?", o: ["Por estética", "Menos cuerpos y el jugador no se engancha en las uniones entre cajas", "Box2D no admite cajas pequeñas"], c: 1, e: "Una caja por tramo de tiles sólidos seguidos." },
      { p: "Las monedas no se recogen nunca, aunque el jugador las atraviesa. ¿Qué falta en Box2D 3.1?", o: ["isSensor en el jugador", "enableSensorEvents = true en la forma del jugador", "Más densidad"], c: 1, e: "Un sensor solo detecta formas con enableSensorEvents." },
      { p: "¿Qué es el tiempo de coyote?", o: ["Un retardo del sonido", "Poder saltar unos instantes después de dejar una plataforma", "El tiempo de invulnerabilidad"], c: 1, e: "0,1 s en este juego." },
      { p: "¿Por qué el pisotón no usa la velocidad vertical del jugador?", o: ["Porque es negativa", "Porque al llegar el evento Box2D ya resolvió el choque y vale ~0", "Porque no existe"], c: 1, e: "Se decide por la posición de los pies respecto al enemigo." },
      { p: "Teletransportas el cuerpo con b2Body_SetTransform y se queda flotando. ¿Por qué?", o: ["La gravedad es 0", "El cuerpo estaba dormido: hay que despertarlo con b2Body_SetAwake", "Falta el Step"], c: 1, e: "Bug real encontrado por la prueba automática." }
    ])}
`
  });
})();
