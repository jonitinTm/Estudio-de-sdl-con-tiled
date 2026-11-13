(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  const uml = `
<style>
.uml{display:grid;gap:14px;justify-items:center;margin:18px 0}
.uml-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.uml-box{background:var(--surface);border:1.5px solid var(--ink-3);border-radius:4px;font-family:var(--font-mono);font-size:.74rem;min-width:150px;line-height:1.45}
.uml-box>div{padding:4px 10px;border-top:1px solid var(--line)}
.uml-box>div:first-child{border-top:0;font-weight:600;text-align:center;background:var(--surface-2);font-family:var(--font-body);font-size:.85rem}
.uml-box.base{border-color:var(--accent)}
.uml-arrow{font-size:.8rem;color:var(--ink-3)}
</style>
<div class="uml">
  <div class="uml-box base"><div>Entity <span style="font-weight:400;color:var(--ink-3)">(virtual)</span></div><div>EntityType type<br>Vector2D position<br>bool active</div><div>virtual Awake() / Start()<br>virtual Update(float dt)<br>virtual CleanUp()</div></div>
  <span class="uml-arrow">▲ heredan (is-a) ▲</span>
  <div class="uml-row">
    <div class="uml-box"><div>Player</div><div>SDL_Texture* texture<br>float speed<br>int lives</div><div>Update(): WASD<br>Draw</div></div>
    <div class="uml-box"><div>Item</div><div>SDL_Texture* texture<br>bool isPicked</div><div>Update(): dibujarse</div></div>
    <div class="uml-box"><div>Enemy</div><div>SDL_Texture* texture<br>Pathfinding* path</div><div>Update(): IA</div></div>
  </div>
</div>`;

  Curso.leccion({
    id: "l04", num: "04", grupo: "Bloque 2 · Datos y entidades", corto: "Entidades", pdf: "L04_Entity_Systems",
    titulo: "Sistemas de entidades",
    resumen: "Herencia y polimorfismo para jugador, items y enemigos; EntityManager como fábrica.",
    intro: "Jugador, enemigos, monedas… todos son “cosas del juego” con posición, que se actualizan y se dibujan, pero cada una a su manera. Un sistema de entidades te deja tratarlas a todas igual desde fuera y distintas por dentro.",
    objetivos: ["Identificar entidades en un juego y dibujar su UML", "Usar herencia y funciones virtual", "Entender el patrón Factory del EntityManager", "Añadir Player e Item al motor"],
    html: () => `
<h2>El problema que resolvemos</h2>
<p>Queremos representar objetos con comportamiento propio. En Bomberman: el jugador, enemigos, bombas, items. Sin un sistema, Scene acabaría con decenas de variables sueltas (<code>playerX</code>, <code>enemy1X</code>, <code>enemy2X</code>…) y bucles copiados.</p>

<h2>Entidad = objeto identificable del juego</h2>
<p>También se llama <em>actor</em> o <em>GameObject</em>. Con programación orientada a objetos (OOP), cada entidad es una clase que junta sus <strong>datos</strong> (atributos) y su <strong>comportamiento</strong> (métodos). Lo común va en una clase base <code>Entity</code>; lo específico, en clases hijas.</p>
${uml}
<p>Dos conceptos de OOP que lo hacen funcionar:</p>
<ul>
<li><strong>Herencia</strong>: <code>class Player : public Entity</code>. Player recibe gratis todo lo de Entity (position, active, type…).</li>
<li><strong>Polimorfismo</strong>: distintos objetos responden distinto al mismo método. El EntityManager llama <code>entity->Update(dt)</code> y se ejecuta el Update del Player, del Item o del Enemy según lo que sea en realidad.</li>
</ul>

${nota(`<p><strong>Ejercicio mental</strong>: haz el UML de Mario. Entidades: Mario (vidas, monedas, montado en Yoshi, power-up), Yoshi (boca llena, animación), Enemy (estado, dirección, comestible), Item (tipo de power-up, recogible). El fondo <em>no</em> es una entidad: es el mapa.</p>`, "", "Practica")}

<h2>Alternativa: ECS</h2>
<p>Los <strong>Entity Component Systems</strong> (Unity DOTS, Bevy…) separan datos (componentes) y comportamiento (sistemas). Escalan mejor con miles de entidades y muchas combinaciones, pero son más complejos. Para un plataformas de clase, la jerarquía OOP es más que suficiente. Lo que sí debes saber explicar: la herencia tiende a volverse rígida cuando hay muchos tipos (“¿un enemigo que también es item?”).</p>

<h2>Cómo encaja en el motor</h2>
${demo("d-ent", "EntityManager en vivo", "Crea entidades · haz clic en el lienzo y usa WASD", `
<div class="controls">
  <button type="button" class="btn" data-mk="PLAYER">CreateEntity(PLAYER)</button>
  <button type="button" class="btn" data-mk="ITEM">CreateEntity(ITEM)</button>
  <button type="button" class="btn" data-mk="ENEMY">CreateEntity(ENEMY)</button>
  <button type="button" class="btn" id="ent-clear">CleanUp()</button>
</div>
<canvas id="ent-cv"></canvas>
<div class="split"><pre class="log" id="ent-list"></pre><pre class="log" id="ent-log"></pre></div>`)}
<p>Observa la lista <code>pending</code>: las entidades nuevas no entran en la lista principal en mitad de un recorrido, sino al empezar el siguiente frame. Así evitas modificar una lista mientras la estás iterando (lo que puede hacer petar el programa).</p>

<h3>Entity: la clase base</h3>
${code(String.raw`
enum class EntityType { PLAYER, ITEM, ENEMY, UNKNOWN };

class Entity : public std::enable_shared_from_this<Entity>
{
public:
    Entity(EntityType type) : type(type), active(true) {}
    virtual ~Entity() {}

    virtual bool Awake()             { return true; }
    virtual bool Start()             { return true; }
    virtual bool Update(float dt)    { return true; }
    virtual bool CleanUp()           { return true; }

    void Enable()  { if (!active) { active = true;  Start(); } }
    void Disable() { if (active)  { active = false; CleanUp(); } }

public:
    std::string name;
    EntityType  type;
    bool        active = true;
    Vector2D    position;
};`, "cpp", "Entity.h")}

<h3>EntityManager: un módulo con patrón Factory</h3>
<p>Una <strong>fábrica</strong> es una función que decide qué clase instanciar a partir de un parámetro. Scene no hace <code>new Player()</code>: le pide al manager “dame una entidad de tipo PLAYER”. El manager es un <code>Module</code>, así que el Engine llama sus Awake/Start/Update y él, a su vez, llama a los de todas sus entidades.</p>

${todo("TODO 0", "Visual Studio", `<p>Añade al proyecto los archivos existentes: <code>Player.cpp/.h</code> en Game y <code>EntityManager.cpp/.h</code>, <code>Entity.h</code> en Engine (clic derecho → Agregar → Elemento existente).</p>`, "")}

${todo("TODO 1", "Engine.h / Engine.cpp", `<p>Declara el módulo y añádelo a la lista. Piensa en el orden: las entidades deben actualizarse después de la escena y antes del render.</p>`,
      code(String.raw`
// Engine.h
class EntityManager;                              // forward declaration
...
std::shared_ptr<EntityManager> entityManager;

// Engine.cpp
#include "EntityManager.h"

Engine::Engine() {
    ...
    entityManager = std::make_shared<EntityManager>();

    AddModule(std::static_pointer_cast<Module>(window));
    AddModule(std::static_pointer_cast<Module>(input));
    AddModule(std::static_pointer_cast<Module>(textures));
    AddModule(std::static_pointer_cast<Module>(audio));
    AddModule(std::static_pointer_cast<Module>(scene));
    AddModule(std::static_pointer_cast<Module>(entityManager));  // aquí
    AddModule(std::static_pointer_cast<Module>(render));         // render SIEMPRE el último
}`, "cpp", "Engine"))}

${nota(`<p>La <em>forward declaration</em> (<code>class EntityManager;</code>) le dice al compilador “existe una clase con este nombre” sin incluir su .h. Basta para declarar punteros y evita que los .h se incluyan en círculo.</p>`)}

${todo("TODO 2", "Player.h / Player.cpp", `<p>Declara la textura (la posición ya viene de Entity), inicializa valores en <code>Awake()</code> y carga la textura en <code>Start()</code> (en Awake el módulo de texturas aún no está listo).</p>`,
      code(String.raw`
// Player.h
class Player : public Entity {
public:
    Player();
    bool Awake() override;
    bool Start() override;
    bool Update(float dt) override;
    bool CleanUp() override;
private:
    SDL_Texture* texture = nullptr;
    float speed = 0.2f;              // px por ms (o 200 px/s si dt va en segundos)
    int texW = 32, texH = 32;
};

// Player.cpp
Player::Player() : Entity(EntityType::PLAYER) { name = "Player"; }

bool Player::Awake() {
    position = Vector2D(96, 96);
    return true;
}

bool Player::Start() {
    texture = Engine::GetInstance().textures->Load("Assets/Textures/player1.png");
    return true;
}`, "cpp", "Player"))}

${todo("TODO 3a/3b", "Scene.cpp / EntityManager.cpp", `<p>Guarda un puntero al jugador en Scene y créalo con el manager en <code>Scene::Awake()</code>. Completa <code>CreateEntity</code> para que instancie según el tipo.</p>`,
      code(String.raw`
// Scene.h
#include <memory>
class Player;
...
std::shared_ptr<Player> player;

// Scene.cpp
#include "Entity.h"
#include "EntityManager.h"
#include "Player.h"

bool Scene::Awake() {
    // CreateEntity devuelve shared_ptr<Entity>: lo "bajamos" a Player
    player = std::dynamic_pointer_cast<Player>(
        Engine::GetInstance().entityManager->CreateEntity(EntityType::PLAYER));
    return true;
}

// EntityManager.cpp
std::shared_ptr<Entity> EntityManager::CreateEntity(EntityType type)
{
    std::shared_ptr<Entity> entity = nullptr;
    switch (type)
    {
    case EntityType::PLAYER: entity = std::make_shared<Player>(); break;
    case EntityType::ITEM:   entity = std::make_shared<Item>();   break;
    default:
        LOG("Error en CreateEntity: tipo desconocido");
        return nullptr;
    }
    pending.push_back(entity);       // entra en la lista en el próximo Update
    return entity;
}`, "cpp", "Scene + EntityManager"))}

${nota(`<p><code>dynamic_pointer_cast&lt;Player&gt;</code> comprueba en tiempo de ejecución que la Entity es de verdad un Player. Si no lo es, devuelve <code>nullptr</code>. Por eso las funciones base deben ser <code>virtual</code>: sin al menos una función virtual, el cast no funciona.</p>`)}

${todo("TODO 4 y 5", "Player.cpp → Update(dt)", `<p>Dibuja la textura del jugador y muévelo con WASD.</p>`,
      code(String.raw`
bool Player::Update(float dt)
{
    auto& input = Engine::GetInstance().input;
    float move = speed * dt;

    if (input->GetKey(SDL_SCANCODE_W) == KEY_REPEAT) position.setY(position.getY() - move);
    if (input->GetKey(SDL_SCANCODE_S) == KEY_REPEAT) position.setY(position.getY() + move);
    if (input->GetKey(SDL_SCANCODE_A) == KEY_REPEAT) position.setX(position.getX() - move);
    if (input->GetKey(SDL_SCANCODE_D) == KEY_REPEAT) position.setX(position.getX() + move);

    Engine::GetInstance().render->DrawTexture(texture, (int)position.getX(), (int)position.getY());
    return true;
}`, "cpp", "Player.cpp"))}

${todo("TODO 6–8 (extra)", "Item.h / Item.cpp / Scene.cpp", `<p>Crea una entidad <code>Item</code> copiando la estructura de Player (sin input), añade <code>ITEM</code> al enum y a la fábrica, y crea varios items desde <code>Scene::Awake()</code>.</p>`,
      code(String.raw`
// Scene::Awake()
for (int i = 0; i < 5; ++i) {
    auto item = std::dynamic_pointer_cast<Item>(
        Engine::GetInstance().entityManager->CreateEntity(EntityType::ITEM));
    item->position = Vector2D(200 + i * 64, 300);
}`, "cpp", "Scene.cpp"))}

${nota(`<p>Cuidado: si creas los .cpp nuevos desde Visual Studio, por defecto se guardan fuera de la carpeta <code>src</code>. Muévelos a mano o tendrás errores raros de include.</p>`, "warn")}

${nota(`<p>En SandKnight tu <code>Player</code> tiene vidas, invulnerabilidad de 0.5 s, voltereta y respawn. Todo eso son atributos y métodos que viven <em>solo</em> en Player. Las monedas son <code>Item</code>. Cuando añadas los slimes como enemigos, serán <code>Enemy : public Entity</code> y el manager los actualizará sin que tengas que tocar Scene más que para crearlos.</p>`, "game")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué patrón usa EntityManager::CreateEntity?", o: ["Singleton", "Factory", "Observer"], c: 1, e: "Recibe un tipo y decide qué clase concreta instanciar." },
      { p: "¿Por qué Update debe ser virtual en Entity?", o: ["Para que sea más rápido", "Para que se ejecute la versión de la clase hija al llamarlo desde un puntero a Entity", "Porque lo exige shared_ptr"], c: 1, e: "Eso es polimorfismo: el manager no sabe qué tipo concreto tiene cada entidad." },
      { p: "¿Dónde cargas la textura del jugador?", o: ["En el constructor", "En Awake()", "En Start()"], c: 2, e: "En Awake el módulo textures aún no ha hecho su propio Start." },
      { p: "¿Por qué las entidades nuevas van primero a una lista pending?", o: ["Para ahorrar memoria", "Para no modificar la lista principal mientras se recorre", "Para que se dibujen antes"], c: 1, e: "Añadir a una lista mientras la iteras puede invalidar el iterador." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#ent-cv"), ctx = Curso.canvas(cv, 640, 240);
      const keys = Curso.teclado(cv);
      const listEl = root.querySelector("#ent-list"), logEl = root.querySelector("#ent-log");
      let entities = [], pending = [], nextId = 1, logLines = [];
      const log = (s) => { logLines.push(s); if (logLines.length > 40) logLines.shift(); logEl.textContent = logLines.join("\n"); logEl.scrollTop = logEl.scrollHeight; };
      class Entity { constructor(type) { this.type = type; this.id = nextId++; this.x = 40 + Math.random() * 540; this.y = 40 + Math.random() * 160; } update() { } draw() { } }
      class Player extends Entity {
        constructor() { super("PLAYER"); }
        update(dt) {
          const s = 160 * dt;
          if (keys.has("KeyW")) this.y -= s; if (keys.has("KeyS")) this.y += s;
          if (keys.has("KeyA")) this.x -= s; if (keys.has("KeyD")) this.x += s;
          this.x = Math.max(0, Math.min(616, this.x)); this.y = Math.max(0, Math.min(216, this.y));
        }
        draw() { ctx.fillStyle = Curso.color("accent"); ctx.fillRect(this.x, this.y, 24, 24); ctx.fillStyle = Curso.color("accent-ink"); ctx.fillRect(this.x + 14, this.y + 6, 4, 4); }
      }
      class Item extends Entity {
        constructor() { super("ITEM"); this.t = Math.random() * 6; }
        update(dt) { this.t += dt * 4; }
        draw() { const y = this.y + Math.sin(this.t) * 4; ctx.fillStyle = Curso.color("amber"); ctx.beginPath(); ctx.arc(this.x + 10, y + 10, 9, 0, 7); ctx.fill(); }
      }
      class Enemy extends Entity {
        constructor() { super("ENEMY"); this.dir = 1; this.x0 = this.x; }
        update(dt) { this.x += this.dir * 70 * dt; if (Math.abs(this.x - this.x0) > 70) this.dir *= -1; }
        draw() { ctx.fillStyle = Curso.color("bad"); ctx.beginPath(); ctx.moveTo(this.x, this.y + 22); ctx.lineTo(this.x + 12, this.y); ctx.lineTo(this.x + 24, this.y + 22); ctx.fill(); }
      }
      const factory = (type) => { switch (type) { case "PLAYER": return new Player(); case "ITEM": return new Item(); case "ENEMY": return new Enemy(); default: return null; } };
      root.querySelectorAll("[data-mk]").forEach((b) => Curso.on(b, "click", () => {
        const e = factory(b.dataset.mk); pending.push(e);
        log(`CreateEntity(${e.type}) -> make_shared<${e.type[0] + e.type.slice(1).toLowerCase()}>() id=${e.id} -> pending`);
        if (e.type === "PLAYER") cv.focus();
      }));
      Curso.on(root.querySelector("#ent-clear"), "click", () => { entities.forEach((e) => log(`${e.type}#${e.id}->CleanUp()`)); entities = []; pending = []; });
      let tick = 0;
      Curso.bucle((dt) => {
        if (pending.length) { pending.forEach((e) => { log(`[EntityManager::Update] ${e.type}#${e.id}: Start() y pasa a entities`); entities.push(e); }); pending = []; }
        entities.forEach((e) => e.update(dt));
        ctx.clearRect(0, 0, 640, 240);
        entities.forEach((e) => e.draw());
        if (!entities.length) { ctx.fillStyle = Curso.color("ink-3"); ctx.font = "14px Inter, sans-serif"; ctx.fillText("Lista vacía: pulsa un botón CreateEntity(...)", 180, 124); }
        if ((tick++ % 10) === 0) listEl.textContent = "std::list<shared_ptr<Entity>> entities\n" + (entities.map((e) => `  [${e.id}] ${e.type.padEnd(6)} -> ${e.constructor.name}::Update(dt)`).join("\n") || "  (vacía)") + `\npending: ${pending.length}`;
      });
    }
  });
})();
