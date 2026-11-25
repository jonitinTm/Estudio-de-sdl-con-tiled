(function () {
  const { code, nota, quiz } = Curso;
  Curso.leccion({
    id: "l15", num: "18", grupo: "Bloque 8 · Construye el plataformas paso a paso", corto: "Plataformas III: el juego",
    titulo: "Construye el plataformas III: el juego",
    resumen: "Fases 9–12: monedas, slimes con pathfinding BFS, estados de la partida, cámara, checkpoints, HUD, guardar/cargar y teclas de debug.",
    intro: "Conviertes la demo en un juego: cosas que coger, enemigos que te persiguen, pantalla de título, checkpoints, meta, game over, marcador, guardar partida y las teclas de debug que piden en las entregas.",
    objetivos: ["Crear entidades a partir de los objetos del mapa", "Usar el pathfinding en un enemigo real", "Organizar la partida con estados", "Guardar y cargar la partida en XML"],
    html: () => `

<p>Tienes un caballero que corre por un nivel. Ahora lo conviertes en un juego: cosas que coger, enemigos, un principio, un final, un marcador y las herramientas de depuración que piden en las entregas.</p>
<h2 id="pfase9">Fase 9 · Monedas</h2>

${code(String.raw`
#pragma once

#include "Entity.h"
#include "Animation.h"
#include <SDL3/SDL.h>

class PhysBody;

// A coin: a static sensor. Touch it and it is collected
class Item : public Entity
{
public:
    Item();

    bool Start() override;
    bool Update(float dt) override;
    bool CleanUp() override;

    void OnCollision(PhysBody* physA, PhysBody* physB) override;

private:
    SDL_Texture* texture = nullptr;
    AnimationSet anims;
    PhysBody* pbody = nullptr;
    int coinFx = 0;
};
`, "cpp", "Item.h")}${code(String.raw`
#include "Item.h"
#include "Engine.h"
#include "Textures.h"
#include "Render.h"
#include "Audio.h"
#include "Physics.h"
#include "Scene.h"

Item::Item() : Entity(EntityType::ITEM)
{
    name = "Coin";
}

bool Item::Start()
{
    Engine& engine = Engine::GetInstance();
    texture = engine.textures->Load(parameters.child("texture").attribute("path").as_string());
    anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), { { 0, "spin" } });

    // A sensor: it detects the player but does not stop him
    pbody = engine.physics->CreateRectangleSensor((int)position.getX(), (int)position.getY(), 14, 14, BodyType::STATIC);
    pbody->listener = this;
    pbody->ctype = ColliderType::ITEM;

    coinFx = engine.audio->LoadFx(engine.scene->configParameters.child("fx").attribute("coin").as_string());
    return true;
}

bool Item::Update(float dt)
{
    anims.Update(dt);
    const SDL_Rect& frame = anims.GetCurrentFrame();
    Engine::GetInstance().render->DrawTexture(texture, (int)position.getX() - 8, (int)position.getY() - 8, &frame);
    return true;
}

void Item::OnCollision(PhysBody* physA, PhysBody* physB)
{
    if (physB->ctype != ColliderType::PLAYER || pendingToDelete) return;

    Engine::GetInstance().scene->AddCoin();
    Engine::GetInstance().audio->PlayFx(coinFx);
    pendingToDelete = true;   // the EntityManager deletes it at the end of the frame
}

bool Item::CleanUp()
{
    Engine::GetInstance().textures->UnLoad(texture);
    Engine::GetInstance().physics->DeletePhysBody(pbody);
    return true;
}
`, "cpp", "Item.cpp")}
<ul>
<li>Un <strong>sensor estático</strong>: detecta al jugador sin frenarle.</li>
<li>En <code>OnCollision</code> no se destruye nada: suma la moneda, suena y marca <code>pendingToDelete</code>. El EntityManager la borra al final del frame y su <code>CleanUp</code> pide a la física que borre el cuerpo.</li>
<li><code>if (pendingToDelete) return;</code> evita contarla dos veces si llegan dos eventos en el mismo frame.</li>
</ul>

${nota(`<p>Con la Scene de la fase 11 (que crea una moneda por cada objeto <code>Coin</code> del mapa), las monedas giran y desaparecen al tocarlas, sumando en el marcador.</p>`, "game", "Compila y comprueba")}
<h2 id="pfase10">Fase 10 · Slimes con pathfinding</h2>

<h3>Pathfinding</h3>
<p>El BFS de las lecciones <a href="#l11">11</a> y <a href="#l12">12</a>, adaptado a un plataformas: el grafo son las casillas <strong>caminables</strong> (vacías y con suelo debajo) y los vecinos son izquierda y derecha. El slime no salta, así que solo puede perseguirte por su plataforma.</p>
${code(String.raw`
#pragma once

#include "Vector2D.h"
#include <vector>

class Map;

// BFS on the navigation of the map (L11, L12). Everything in TILE coordinates
class Pathfinding
{
public:
    // Shortest path from start to goal (both included). Empty if there is no path
    // maxNodes limits the search: enemies only care about the player when he is near
    std::vector<Vector2D> FindPath(const Map& map, Vector2D start, Vector2D goal, int maxNodes = 400);
};
`, "cpp", "Pathfinding.h")}${code(String.raw`
#include "Pathfinding.h"
#include "Map.h"

#include <queue>

std::vector<Vector2D> Pathfinding::FindPath(const Map& map, Vector2D start, Vector2D goal, int maxNodes)
{
    std::vector<Vector2D> path;
    int width = map.GetWidth(), height = map.GetHeight();
    int sx = (int)start.getX(), sy = (int)start.getY();
    int gx = (int)goal.getX(), gy = (int)goal.getY();
    if (!map.IsWalkable(sx, sy) || !map.IsWalkable(gx, gy)) return path;

    // visited and breadcrumbs as flat vectors: index = j * width + i (L07)
    std::vector<bool> visited(width * height, false);
    std::vector<int> breadcrumbs(width * height, -1);

    std::queue<int> frontier;
    int startIndex = sy * width + sx;
    frontier.push(startIndex);
    visited[startIndex] = true;
    breadcrumbs[startIndex] = startIndex;   // the start is its own breadcrumb: ComputePath stops there

    int goalIndex = gy * width + gx;
    int explored = 0;
    bool found = false;

    while (!frontier.empty() && explored < maxNodes)
    {
        int current = frontier.front();
        frontier.pop();
        explored++;

        if (current == goalIndex) { found = true; break; }

        int ci = current % width, cj = current / width;
        // Walking enemies: left and right along the floor
        const int neighbors[2][2] = { { ci + 1, cj }, { ci - 1, cj } };
        for (const auto& n : neighbors)
        {
            if (!map.IsWalkable(n[0], n[1])) continue;
            int index = n[1] * width + n[0];
            if (visited[index]) continue;
            visited[index] = true;
            breadcrumbs[index] = current;   // where we came from
            frontier.push(index);
        }
    }

    if (!found) return path;

    // Follow the breadcrumbs back from the goal, then reverse
    for (int index = goalIndex; ; index = breadcrumbs[index])
    {
        path.push_back(Vector2D((float)(index % width), (float)(index / width)));
        if (breadcrumbs[index] == index) break;
    }
    std::vector<Vector2D> ordered(path.rbegin(), path.rend());
    return ordered;
}
`, "cpp", "Pathfinding.cpp")}
<ul>
<li><code>visited</code> y <code>breadcrumbs</code> son vectores planos con índice <code>j * width + i</code> (la fórmula de <a href="#l07">la lección 07</a>): mucho más rápidos que buscar en una lista.</li>
<li><code>maxNodes</code>: límite de seguridad. Si el jugador está lejísimos, no se explora el mapa entero cada vez.</li>
<li>El camino se reconstruye siguiendo las miguitas desde la meta y se le da la vuelta.</li>
</ul>
<h3>Enemy</h3>
${code(String.raw`
#pragma once

#include "Entity.h"
#include "Animation.h"
#include "Pathfinding.h"
#include "Timer.h"
#include <SDL3/SDL.h>
#include <vector>

class PhysBody;

// Slime: patrols its platform and chases the player with BFS when it sees him (L11, L12)
class Enemy : public Entity
{
public:
    Enemy();

    bool Awake() override;
    bool Start() override;
    bool Update(float dt) override;
    bool CleanUp() override;

    void Kill();
    bool IsDying() const { return dying; }
    void GetBodyPosition(int& x, int& y) const;

private:
    void Think();          // decide where to go
    void Move();
    void Draw();

private:
    SDL_Texture* texture = nullptr;
    AnimationSet anims;
    PhysBody* pbody = nullptr;

    float patrolSpeed = 2.0f;   // m/s
    float chaseSpeed = 3.2f;    // m/s
    int sight = 10;             // tiles

    int direction = 1;          // patrol: +1 right, -1 left
    bool chasing = false;
    bool dying = false;

    Pathfinding pathfinding;
    std::vector<Vector2D> path; // tiles
    Timer thinkTimer;           // the path is not recomputed every frame
    int deadX = 0, deadY = 0;   // last position, to draw the death animation after the body is gone
};
`, "cpp", "Enemy.h")}${code(String.raw`
#include "Enemy.h"
#include "Engine.h"
#include "Textures.h"
#include "Render.h"
#include "Physics.h"
#include "Map.h"
#include "Scene.h"
#include "Player.h"

Enemy::Enemy() : Entity(EntityType::ENEMY)
{
    name = "Slime";
}

bool Enemy::Awake()
{
    patrolSpeed = parameters.child("movement").attribute("speed").as_float(2.0f);
    chaseSpeed = parameters.child("movement").attribute("chase").as_float(3.2f);
    sight = parameters.child("movement").attribute("sight").as_int(10);
    return true;
}

bool Enemy::Start()
{
    Engine& engine = Engine::GetInstance();
    texture = engine.textures->Load(parameters.child("texture").attribute("path").as_string());
    anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), { { 0, "idle" }, { 4, "move" }, { 8, "die" } });
    anims.SetLoop("die", false);
    anims.SetCurrent("move");

    pbody = engine.physics->CreateRectangle((int)position.getX(), (int)position.getY(), 16, 12, BodyType::DYNAMIC);
    pbody->listener = this;
    pbody->ctype = ColliderType::ENEMY;
    return true;
}

bool Enemy::Update(float dt)
{
    if (dying)
    {
        anims.Update(dt);
        if (anims.HasFinished()) pendingToDelete = true;
        Draw();
        return true;
    }

    if (thinkTimer.ReadSec() > 0.3f)
    {
        Think();
        thinkTimer.Start();
    }
    Move();

    anims.Update(dt);
    Draw();
    return true;
}

void Enemy::Think()
{
    Engine& engine = Engine::GetInstance();
    const Map& map = *engine.map;

    int x, y, px, py;
    pbody->GetPosition(x, y);
    engine.scene->GetPlayer()->GetBodyPosition(px, py);

    // Everything in tiles (WorldToMap). The slime stands on the cell of its center
    Vector2D me = map.WorldToMap(x, y);
    Vector2D target = map.WorldToMap(px, py + 8);   // the cell of the player's feet

    path.clear();
    chasing = false;
    float dx = target.getX() - me.getX();
    if (fabsf(dx) <= sight && target.getY() == me.getY())
    {
        path = pathfinding.FindPath(map, me, target);
        chasing = path.size() > 1;
    }
}

void Enemy::Move()
{
    Engine& engine = Engine::GetInstance();
    const Map& map = *engine.map;
    int x, y;
    pbody->GetPosition(x, y);
    Vector2D me = map.WorldToMap(x, y);

    float vx;
    if (chasing)
    {
        // Go to the center of the next cell of the path
        Vector2D next = path[1];
        int targetX = (int)map.MapToWorld((int)next.getX(), 0).getX() + map.GetTileWidth() / 2;
        direction = (targetX > x) ? 1 : -1;
        vx = direction * chaseSpeed;
    }
    else
    {
        // Patrol: turn around at the end of the platform or against a wall.
        // Look 10 px ahead of the center: if that cell is not walkable, turn
        int aheadCell = (x + direction * 10) / map.GetTileWidth();
        if (!map.IsWalkable(aheadCell, (int)me.getY())) direction = -direction;
        vx = direction * patrolSpeed;
    }

    b2Vec2 velocity = engine.physics->GetLinearVelocity(pbody);
    engine.physics->SetLinearVelocity(pbody, { vx, velocity.y });
}`, "cpp", "Enemy.cpp · arranque, Update, Think y Move")}
<ul>
<li><strong>Think</strong> (cada 0,3 s, no cada frame: buscar caminos es caro): si el jugador está a menos de <code>sight</code> tiles y en la misma fila, busca un camino. Si existe, persigue.</li>
<li><strong>Move</strong>: persiguiendo, va hacia el centro de la siguiente casilla del camino (más rápido). Patrullando, mira 10 px por delante: si esa casilla no es caminable (borde o pared), da media vuelta.</li>
</ul>
${code(String.raw`
void Enemy::GetBodyPosition(int& x, int& y) const
{
    pbody->GetPosition(x, y);
}

void Enemy::Kill()
{
    if (dying) return;
    dying = true;
    anims.SetCurrent("die");
    // No more collisions: the body is destroyed now (at the next PreUpdate); the animation still plays
    Engine::GetInstance().physics->DeletePhysBody(pbody);
}

void Enemy::Draw()
{
    if (!dying) pbody->GetPosition(deadX, deadY);
    const SDL_Rect& frame = anims.GetCurrentFrame();
    // Frame of 24x24 with the slime on the bottom row: align it with the bottom of the 12 px body
    Engine::GetInstance().render->DrawTexture(texture, deadX - 12, deadY + 6 - 24, &frame, 1.0f, 0.0, direction < 0);
}

bool Enemy::CleanUp()
{
    Engine::GetInstance().textures->UnLoad(texture);
    if (!dying) Engine::GetInstance().physics->DeletePhysBody(pbody);
    return true;
}`, "cpp", "Enemy.cpp · Kill, Draw y CleanUp")}
<p><code>Kill</code> borra el cuerpo enseguida (para que no haga más daño) pero la entidad sigue viva hasta que termina la animación de muerte; por eso guarda su última posición en <code>deadX</code>, <code>deadY</code>.</p>
<figure style="margin:16px 0"><img src="plataformas/docs/danio.jpg" alt="Un slime alcanzó al caballero: pierde una vida (cuadro vacío arriba a la izquierda)" style="width:100%;border-radius:6px;border:1px solid var(--line)"><figcaption style="font-size:.82rem;color:var(--ink-3);margin-top:4px">Un slime alcanzó al caballero: pierde una vida (cuadro vacío arriba a la izquierda) (captura real del juego compilado)</figcaption></figure>

${nota(`<p>Los slimes patrullan sus plataformas dando la vuelta en los bordes. Si te acercas por su misma altura, aceleran hacia ti. Si te tocan, pierdes una vida; si caes encima, mueren aplastados.</p>`, "game", "Compila y comprueba")}
<h2 id="pfase11">Fase 11 · La escena: estados, cámara, checkpoints y HUD</h2>

<p>Sustituye la Scene mínima por la definitiva.</p>
${code(String.raw`
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
`, "cpp", "Scene.h")}
<h3>Arranque: crear el mundo desde el mapa</h3>
${code(String.raw`
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
}`, "cpp", "Scene.cpp · Awake, Start, SpawnEntities y NewGame")}
<ul>
<li>El jugador se crea en <code>Awake</code>; las monedas y los slimes en <code>Start</code>, <strong>uno por cada objeto del mapa</strong>. Para añadir una moneda al nivel no tocas código: la pones en Tiled.</li>
<li><code>NewGame</code> reinicia la partida: borra monedas y slimes, los vuelve a crear desde el mapa y resetea al jugador.</li>
</ul>
<h3>Estados de la partida</h3>
${code(String.raw`
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
}`, "cpp", "Scene.cpp · Update, banderas, checkpoints y cámara")}
<div class="path"><span>TITLE</span><i>→ Enter →</i><span>PLAYING</span><i>→ meta →</i><span>WIN</span><i>· 0 vidas →</i><span>GAME_OVER</span><i>→ Enter →</i><span>PLAYING</span></div>
<ul>
<li><strong>Checkpoint</strong>: cuando el jugador pasa a la derecha de un objeto <code>Checkpoint</code>, se convierte en el punto de reaparición (la bandera se pone verde).</li>
<li><strong>Cámara</strong> (<a href="#l10">lección 10</a>): centra al jugador pero nunca enseña fuera del mapa. Va en negativo.</li>
</ul>
<figure style="margin:16px 0"><img src="plataformas/docs/titulo.jpg" alt="Pantalla de título (estado TITLE)" style="width:100%;border-radius:6px;border:1px solid var(--line)"><figcaption style="font-size:.82rem;color:var(--ink-3);margin-top:4px">Pantalla de título (estado TITLE) (captura real del juego compilado)</figcaption></figure>
<h3>HUD</h3>
${code(String.raw`
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
}`, "cpp", "Scene.cpp · PostUpdate y DrawHUD")}
<p>El HUD se dibuja en <code>PostUpdate</code>, después del mapa y de las entidades, y sin cámara (<code>useCamera = false</code>): siempre en el mismo sitio de la pantalla. <code>Esc</code> devuelve <code>false</code> y cierra el juego.</p>
<figure style="margin:16px 0"><img src="plataformas/docs/victoria.jpg" alt="Nivel completado (estado WIN)" style="width:100%;border-radius:6px;border:1px solid var(--line)"><figcaption style="font-size:.82rem;color:var(--ink-3);margin-top:4px">Nivel completado (estado WIN) (captura real del juego compilado)</figcaption></figure>

${nota(`<p>El juego completo: pantalla de título, Enter para jugar, la cámara te sigue, corazones y monedas arriba a la izquierda, bandera de checkpoint a mitad de nivel, bandera roja al final con “LEVEL COMPLETE!”, y “GAME OVER” al perder las 3 vidas.</p>`, "game", "Compila y comprueba")}
<h2 id="pfase12">Fase 12 · Guardar, cargar y teclas de debug</h2>

${code(String.raw`
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
}`, "cpp", "Scene.cpp · DebugKeys, SaveGame y LoadGame")}
<ul>
<li><strong>Guardar</strong> es serializar (<a href="#l05">lección 05</a>) al revés: en vez de leer un XML, se construye con <code>append_child</code> / <code>append_attribute</code> y se guarda con <code>save_file</code>.</li>
<li>Se guarda lo mínimo: posición, vidas, monedas y tiempo. Ampliación típica de las entregas: guardar también qué monedas se han cogido y qué slimes están muertos (por su <code>id</code> del mapa).</li>
<li>Las teclas de debug son las de tu SandKnight: F9 colliders, F10 modo dios, F11 límite de 30 fps. Más F1 reiniciar, F5/F6 guardar/cargar y F12 captura.</li>
</ul>
<figure style="margin:16px 0"><img src="plataformas/docs/modo_dios.jpg" alt="F10: modo dios, volando sobre el nivel" style="width:100%;border-radius:6px;border:1px solid var(--line)"><figcaption style="font-size:.82rem;color:var(--ink-3);margin-top:4px">F10: modo dios, volando sobre el nivel (captura real del juego compilado)</figcaption></figure>

${nota(`<p>Pulsa F5, muévete, pulsa F6: vuelves a donde guardaste. Aparece <code>savegame.xml</code> junto al ejecutable (ábrelo: es XML legible). F10 te deja volar sin morir; F11 baja a 30 fps y todo va a la misma velocidad.</p>`, "game", "Compila y comprueba")}

<h2>Y ahora, tu juego</h2>
<p>Ya tienes un plataformas completo y entiendes cada línea. Ideas para hacerlo tuyo (y para las entregas):</p>
<div class="table-wrap"><table class="t"><thead><tr><th>Idea</th><th>Por dónde empezar</th></tr></thead><tbody>
<tr><td>Tu nivel</td><td>Edita <code>Level1.tmx</code> en Tiled o haz uno nuevo con las mismas capas y tipos de objeto</td></tr>
<tr><td>Varios niveles</td><td>En <code>WIN</code>, <code>map-&gt;CleanUp()</code> + <code>Load</code> del siguiente + <code>NewGame</code></td></tr>
<tr><td>Enemigo volador</td><td>Otro tipo de entidad con gravedad 0 (<code>b2Body_SetGravityScale</code>) y BFS con 4 vecinos sobre casillas vacías</td></tr>
<tr><td>Pinchos</td><td>Objetos <code>Spikes</code> → sensores → <code>Hurt(false)</code></td></tr>
<tr><td>La voltereta de SandKnight</td><td>Animación 40 del knight.tsx + velocidad mayor durante 0,4 s + invulnerable</td></tr>
<tr><td>Música</td><td>Añade SDL3_mixer a vcpkg.json, o un WAV en bucle en Audio</td></tr>
<tr><td>Menú y pausa</td><td>Más estados en <code>GameState</code></td></tr>
</tbody></table></div>
<p>La prueba automática (<code>plataformas/tools/autoplay.cpp</code>) es un buen ejemplo de cómo comprobar tu juego sin jugarlo a mano: arranca el motor, pulsa teclas con <code>SetVirtualKey</code> y comprueba resultados.</p>
<figure style="margin:16px 0"><img src="plataformas/docs/game_over.jpg" alt="Game over tras perder las 3 vidas" style="width:100%;border-radius:6px;border:1px solid var(--line)"><figcaption style="font-size:.82rem;color:var(--ink-3);margin-top:4px">Game over tras perder las 3 vidas (captura real del juego compilado)</figcaption></figure><h2>Archivos de esta lección</h2><details class="reto"><summary><span>Archivo completo</span>Scene.cpp</summary>${code(String.raw`
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
`, "cpp", "Scene.cpp")}</details><details class="reto"><summary><span>Archivo completo</span>Enemy.cpp</summary>${code(String.raw`
#include "Enemy.h"
#include "Engine.h"
#include "Textures.h"
#include "Render.h"
#include "Physics.h"
#include "Map.h"
#include "Scene.h"
#include "Player.h"

Enemy::Enemy() : Entity(EntityType::ENEMY)
{
    name = "Slime";
}

bool Enemy::Awake()
{
    patrolSpeed = parameters.child("movement").attribute("speed").as_float(2.0f);
    chaseSpeed = parameters.child("movement").attribute("chase").as_float(3.2f);
    sight = parameters.child("movement").attribute("sight").as_int(10);
    return true;
}

bool Enemy::Start()
{
    Engine& engine = Engine::GetInstance();
    texture = engine.textures->Load(parameters.child("texture").attribute("path").as_string());
    anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), { { 0, "idle" }, { 4, "move" }, { 8, "die" } });
    anims.SetLoop("die", false);
    anims.SetCurrent("move");

    pbody = engine.physics->CreateRectangle((int)position.getX(), (int)position.getY(), 16, 12, BodyType::DYNAMIC);
    pbody->listener = this;
    pbody->ctype = ColliderType::ENEMY;
    return true;
}

bool Enemy::Update(float dt)
{
    if (dying)
    {
        anims.Update(dt);
        if (anims.HasFinished()) pendingToDelete = true;
        Draw();
        return true;
    }

    if (thinkTimer.ReadSec() > 0.3f)
    {
        Think();
        thinkTimer.Start();
    }
    Move();

    anims.Update(dt);
    Draw();
    return true;
}

void Enemy::Think()
{
    Engine& engine = Engine::GetInstance();
    const Map& map = *engine.map;

    int x, y, px, py;
    pbody->GetPosition(x, y);
    engine.scene->GetPlayer()->GetBodyPosition(px, py);

    // Everything in tiles (WorldToMap). The slime stands on the cell of its center
    Vector2D me = map.WorldToMap(x, y);
    Vector2D target = map.WorldToMap(px, py + 8);   // the cell of the player's feet

    path.clear();
    chasing = false;
    float dx = target.getX() - me.getX();
    if (fabsf(dx) <= sight && target.getY() == me.getY())
    {
        path = pathfinding.FindPath(map, me, target);
        chasing = path.size() > 1;
    }
}

void Enemy::Move()
{
    Engine& engine = Engine::GetInstance();
    const Map& map = *engine.map;
    int x, y;
    pbody->GetPosition(x, y);
    Vector2D me = map.WorldToMap(x, y);

    float vx;
    if (chasing)
    {
        // Go to the center of the next cell of the path
        Vector2D next = path[1];
        int targetX = (int)map.MapToWorld((int)next.getX(), 0).getX() + map.GetTileWidth() / 2;
        direction = (targetX > x) ? 1 : -1;
        vx = direction * chaseSpeed;
    }
    else
    {
        // Patrol: turn around at the end of the platform or against a wall.
        // Look 10 px ahead of the center: if that cell is not walkable, turn
        int aheadCell = (x + direction * 10) / map.GetTileWidth();
        if (!map.IsWalkable(aheadCell, (int)me.getY())) direction = -direction;
        vx = direction * patrolSpeed;
    }

    b2Vec2 velocity = engine.physics->GetLinearVelocity(pbody);
    engine.physics->SetLinearVelocity(pbody, { vx, velocity.y });
}

void Enemy::GetBodyPosition(int& x, int& y) const
{
    pbody->GetPosition(x, y);
}

void Enemy::Kill()
{
    if (dying) return;
    dying = true;
    anims.SetCurrent("die");
    // No more collisions: the body is destroyed now (at the next PreUpdate); the animation still plays
    Engine::GetInstance().physics->DeletePhysBody(pbody);
}

void Enemy::Draw()
{
    if (!dying) pbody->GetPosition(deadX, deadY);
    const SDL_Rect& frame = anims.GetCurrentFrame();
    // Frame of 24x24 with the slime on the bottom row: align it with the bottom of the 12 px body
    Engine::GetInstance().render->DrawTexture(texture, deadX - 12, deadY + 6 - 24, &frame, 1.0f, 0.0, direction < 0);
}

bool Enemy::CleanUp()
{
    Engine::GetInstance().textures->UnLoad(texture);
    if (!dying) Engine::GetInstance().physics->DeletePhysBody(pbody);
    return true;
}
`, "cpp", "Enemy.cpp")}</details><details class="reto"><summary><span>Archivo completo</span>Item.cpp</summary>${code(String.raw`
#include "Item.h"
#include "Engine.h"
#include "Textures.h"
#include "Render.h"
#include "Audio.h"
#include "Physics.h"
#include "Scene.h"

Item::Item() : Entity(EntityType::ITEM)
{
    name = "Coin";
}

bool Item::Start()
{
    Engine& engine = Engine::GetInstance();
    texture = engine.textures->Load(parameters.child("texture").attribute("path").as_string());
    anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), { { 0, "spin" } });

    // A sensor: it detects the player but does not stop him
    pbody = engine.physics->CreateRectangleSensor((int)position.getX(), (int)position.getY(), 14, 14, BodyType::STATIC);
    pbody->listener = this;
    pbody->ctype = ColliderType::ITEM;

    coinFx = engine.audio->LoadFx(engine.scene->configParameters.child("fx").attribute("coin").as_string());
    return true;
}

bool Item::Update(float dt)
{
    anims.Update(dt);
    const SDL_Rect& frame = anims.GetCurrentFrame();
    Engine::GetInstance().render->DrawTexture(texture, (int)position.getX() - 8, (int)position.getY() - 8, &frame);
    return true;
}

void Item::OnCollision(PhysBody* physA, PhysBody* physB)
{
    if (physB->ctype != ColliderType::PLAYER || pendingToDelete) return;

    Engine::GetInstance().scene->AddCoin();
    Engine::GetInstance().audio->PlayFx(coinFx);
    pendingToDelete = true;   // the EntityManager deletes it at the end of the frame
}

bool Item::CleanUp()
{
    Engine::GetInstance().textures->UnLoad(texture);
    Engine::GetInstance().physics->DeletePhysBody(pbody);
    return true;
}
`, "cpp", "Item.cpp")}</details>
<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Dónde se crean las monedas del nivel?", o: ["Escritas a mano en el código", "Una por cada objeto Coin de la capa de objetos del mapa", "En config.xml"], c: 1, e: "SpawnEntities recorre map->GetObjects(\"Coin\")." },
      { p: "¿Por qué el slime recalcula el camino cada 0,3 s y no cada frame?", o: ["Para que sea más tonto", "Porque buscar caminos es caro y no hace falta tanta precisión", "Porque Box2D lo exige"], c: 1, e: "Think con un temporizador." },
      { p: "En el BFS del slime, ¿qué casillas son nodos del grafo?", o: ["Todas", "Las vacías con suelo debajo", "Las del tile rojo"], c: 1, e: "Map::IsWalkable." },
      { p: "¿Por qué el HUD usa useCamera = false?", o: ["Para que vaya más rápido", "Para que se quede fijo en la pantalla aunque la cámara se mueva", "Para que no se vea"], c: 1, e: "Coordenadas de pantalla, no de mundo." },
      { p: "¿Con qué funciones de pugixml se escribe un XML nuevo?", o: ["load_file y child", "append_child, append_attribute y save_file", "parse y print"], c: 1, e: "Serializar al revés." }
    ])}
`
  });
})();
