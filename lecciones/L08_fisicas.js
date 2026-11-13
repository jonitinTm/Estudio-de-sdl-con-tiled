(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "l08", num: "08", grupo: "Bloque 4 · Físicas y colisiones", corto: "Físicas", pdf: "L08_Physics",
    titulo: "Físicas con Box2D",
    resumen: "Módulo Physics, cuerpos estáticos y dinámicos, mover al jugador con velocidad y detectar colisiones.",
    intro: "Programar gravedad, rebotes y colisiones a mano es largo y lleno de casos raros. Box2D lo hace por ti: tú creas cuerpos, el motor los simula en cada paso y te avisa cuando chocan. Tu trabajo es leer su posición para dibujar y reaccionar a las colisiones.",
    objetivos: ["Conocer mundo, cuerpos (static/dynamic/kinematic) y formas", "Convertir entre píxeles y metros", "Mover el jugador con SetLinearVelocity y saltar con impulsos", "Recibir colisiones con OnCollision y distinguir tipos"],
    html: () => `
<h2>Conceptos de Box2D</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Concepto</th><th>Qué es</th></tr></thead><tbody>
<tr><td><strong>World</strong></td><td>El “universo” de la simulación: tiene la gravedad y todos los cuerpos. Avanza con un <em>step</em> de tiempo fijo.</td></tr>
<tr><td><strong>Body</strong></td><td>Un objeto con posición, velocidad, rotación. Tipos: <code>static</code> (suelo, nunca se mueve), <code>dynamic</code> (jugador, cajas: le afectan gravedad y choques), <code>kinematic</code> (plataformas móviles: se mueve por velocidad pero no le empujan).</td></tr>
<tr><td><strong>Shape</strong></td><td>La forma de colisión pegada al cuerpo: círculo, caja, polígono, cápsula. Tiene densidad, fricción y restitución (rebote).</td></tr>
<tr><td><strong>Sensor</strong></td><td>Una forma que detecta contactos pero no choca (zonas de muerte, monedas, meta).</td></tr>
<tr><td><strong>Contacto</strong></td><td>Cuando dos formas se tocan, Box2D genera un evento. El módulo Physics lo convierte en una llamada a <code>OnCollision</code> de la entidad dueña.</td></tr>
</tbody></table></div>

${nota(`<p><strong>Box2D trabaja en metros, tu juego en píxeles.</strong> Box2D está afinado para objetos de 0.1 a 10 m. Si le pasas píxeles directamente, tu jugador mediría 32 metros y caería a cámara lenta. El módulo define una escala (p. ej. 50 px = 1 m) y macros como <code>PIXEL_TO_METERS(p)</code> y <code>METERS_TO_PIXELS(m)</code>. Toda posición que entra a Box2D se convierte, y toda la que sale, también.</p>`, "warn", "Píxeles vs metros")}

<h3>Por qué paso de tiempo fijo</h3>
<p>Como viste en la L03, con aceleración el resultado depende del dt. Box2D se avanza siempre con el mismo paso (normalmente 1/60 s). Si el frame ha durado más, se dan varios pasos; si ha durado menos, se acumula. Así el salto llega siempre a la misma altura.</p>

${demo("d-phys", "Mini-motor de físicas", "Clic en el lienzo · A/D mover · Espacio saltar · F9 colliders", `
<canvas id="ph-cv"></canvas>
<div class="controls">
  <label>Gravedad <input type="range" id="ph-g" min="200" max="2400" value="1400"></label>
  <label>Impulso de salto <input type="range" id="ph-j" min="200" max="900" value="560"></label>
  <label><input type="checkbox" id="ph-dbg" checked> Ver colliders (F9)</label>
  <button type="button" class="btn" id="ph-item">Soltar item dinámico</button>
</div>
<div class="readout" id="ph-out"></div>
<pre class="log" id="ph-log"></pre>`)}
<p>Esta demo no es Box2D (es una simulación sencilla de cajas), pero se comporta igual a nivel de ideas: las plataformas son <em>static</em>, el jugador y los items son <em>dynamic</em>, el jugador fija su velocidad horizontal pero conserva la vertical (la de la gravedad), el salto es un impulso, y cada contacto llama a <code>OnCollision</code> con el tipo del otro cuerpo.</p>

<h2>Arquitectura</h2>
<p>El módulo <code>Physics</code> contiene el mundo de Box2D. Cada entidad que necesita físicas tiene un <code>PhysBody*</code> (un envoltorio con el id del cuerpo de Box2D, su tipo de collider y un puntero a su <em>listener</em>, la entidad a la que avisar). Esto es el <strong>patrón Observer</strong>: la entidad se suscribe a los eventos de su cuerpo.</p>
${code(String.raw`
enum class ColliderType { PLAYER, ITEM, PLATFORM, SPIKES, DEATH, UNKNOWN };
enum bodyType { DYNAMIC, STATIC, KINEMATIC };

class PhysBody
{
public:
    void GetPosition(int& x, int& y) const;   // en PÍXELES (ya convertido)
    float GetRotation() const;

    b2BodyId body;                  // Box2D v3 usa ids, no punteros
    int width = 0, height = 0;
    Entity* listener = nullptr;     // a quién avisar en las colisiones
    ColliderType ctype = ColliderType::UNKNOWN;
};

class Physics : public Module
{
public:
    bool PreUpdate() override;      // aquí se hace b2World_Step y se leen los contactos
    PhysBody* CreateRectangle(int x, int y, int width, int height, bodyType type);
    PhysBody* CreateCircle(int x, int y, int radious, bodyType type);
    PhysBody* CreateRectangleSensor(int x, int y, int width, int height, bodyType type);
    ...
};`, "cpp", "Physics.h (resumen)")}

<h2>Los TODOs del handout</h2>
${todo("TODO 1", "Terminal", `<p>Añade Box2D con vcpkg.</p>${code("vcpkg add port box2d", "txt", "Terminal")}`, "")}

${todo("TODO 2", "Engine + Entity.h", `<p>Añade Physics.h/.cpp a la solución y el módulo al Engine. Compila: fallará porque Physics llama a <code>OnCollision</code> de las entidades. Añádelas como virtuales en Entity.</p>`,
      code(String.raw`
// Entity.h
class PhysBody;                               // forward declaration

class Entity : public std::enable_shared_from_this<Entity> {
public:
    ...
    virtual void OnCollision(PhysBody* physA, PhysBody* physB) {}
    virtual void OnCollisionEnd(PhysBody* physA, PhysBody* physB) {}
};`, "cpp", "Entity.h"))}

${todo("TODO 3", "Map.cpp → Load()", `<p>Crea a mano algunos colliders estáticos donde están los ladrillos del mapa (temporal: en la L09 se generan desde Tiled). Ojo: <code>CreateRectangle</code> suele recibir el <strong>centro</strong>, no la esquina.</p>`,
      code(String.raw`
#include "Physics.h"

// x, y = centro del rectángulo en píxeles
PhysBody* c1 = Engine::GetInstance().physics->CreateRectangle(224 + 128, 543 + 32, 256, 64, STATIC);
c1->ctype = ColliderType::PLATFORM;

PhysBody* c2 = Engine::GetInstance().physics->CreateRectangle(352 + 64, 384 + 32, 128, 64, STATIC);
c2->ctype = ColliderType::PLATFORM;`, "cpp", "Map.cpp"))}

${todo("TODO 4", "Scene.cpp / Item.h / Item.cpp", `<p>Crea un Item en (150, 200) desde Scene. Dale un <code>PhysBody* pbody</code> circular dinámico en Start y, en Update, lee su posición de la física para dibujarlo.</p>`,
      code(String.raw`
// Item.cpp
bool Item::Start()
{
    texture = Engine::GetInstance().textures->Load("Assets/Textures/goldCoin.png");
    texW = 32; texH = 32;
    pbody = Engine::GetInstance().physics->CreateCircle(
                (int)position.getX() + texH / 2, (int)position.getY() + texH / 2,
                texH / 2, bodyType::DYNAMIC);
    pbody->ctype = ColliderType::ITEM;
    return true;
}

bool Item::Update(float dt)
{
    // La física manda: copiamos su posición (centro) a la entidad (esquina)
    int x, y;
    pbody->GetPosition(x, y);
    position.setX((float)x - texW / 2);
    position.setY((float)y - texH / 2);

    Engine::GetInstance().render->DrawTexture(texture, (int)position.getX(), (int)position.getY());
    return true;
}`, "cpp", "Item.cpp"))}

${todo("TODO 5", "Player.h / Player.cpp", `<p>Igual para el jugador, pero el movimiento ya no toca <code>position</code>: se lo pides a Box2D con la velocidad. Usa A/D.</p>`,
      code(String.raw`
bool Player::Update(float dt)
{
    auto& input = Engine::GetInstance().input;

    // 1) Partimos de la velocidad actual (para conservar la Y: gravedad, salto)
    b2Vec2 velocity = b2Body_GetLinearVelocity(pbody->body);
    velocity.x = 0;

    // 2) Input horizontal (en m/s: speed ya está en unidades de Box2D)
    if (input->GetKey(SDL_SCANCODE_A) == KEY_REPEAT) velocity.x = -speed;
    if (input->GetKey(SDL_SCANCODE_D) == KEY_REPEAT) velocity.x =  speed;

    // 3) Salto: impulso hacia arriba (Y negativa en pantalla), solo si está en el suelo
    if (input->GetKey(SDL_SCANCODE_SPACE) == KEY_DOWN && !isJumping) {
        b2Body_ApplyLinearImpulseToCenter(pbody->body, b2Vec2{ 0, -jumpForce }, true);
        isJumping = true;
        velocity = b2Body_GetLinearVelocity(pbody->body);   // recoger el impulso
        velocity.x = 0;
        if (input->GetKey(SDL_SCANCODE_A) == KEY_REPEAT) velocity.x = -speed;
        if (input->GetKey(SDL_SCANCODE_D) == KEY_REPEAT) velocity.x =  speed;
    }

    // 4) Aplicar
    b2Body_SetLinearVelocity(pbody->body, velocity);

    // 5) Leer la posición resultante para dibujar
    int x, y;
    pbody->GetPosition(x, y);
    position.setX((float)x - texW / 2);
    position.setY((float)y - texH / 2);
    Engine::GetInstance().render->DrawTexture(texture, (int)position.getX(), (int)position.getY());
    return true;
}`, "cpp", "Player.cpp"))}

${nota(`<p>No multipliques por dt la velocidad que le pasas a Box2D: una velocidad ya es “por segundo”, y Box2D integra la posición con su propio paso fijo. dt solo lo usarías para cosas tuyas (temporizadores, animaciones).</p>`, "warn")}

<div class="table-wrap"><table class="t"><thead><tr><th>Función Box2D v3</th><th>Qué hace</th><th>Úsala para</th></tr></thead><tbody>
<tr><td><code>b2Body_SetLinearVelocity</code></td><td>Fija la velocidad directamente</td><td>Movimiento horizontal con control preciso</td></tr>
<tr><td><code>b2Body_ApplyForceToCenter</code></td><td>Fuerza continua (se nota a lo largo de varios frames)</td><td>Viento, propulsores, empujes suaves</td></tr>
<tr><td><code>b2Body_ApplyLinearImpulseToCenter</code></td><td>Cambio de velocidad instantáneo</td><td>Saltos, golpes, rebotes</td></tr>
<tr><td><code>b2Body_GetLinearVelocity</code></td><td>Lee la velocidad actual</td><td>Saber si cae, conservar la Y</td></tr>
</tbody></table></div>

${todo("TODO 6 y 7", "Player.h / Player.cpp", `<p>Suscribe al jugador a los eventos de su cuerpo, implementa <code>OnCollision</code> y distingue el tipo de lo que tocas. Asigna un <code>ctype</code> a todos los cuerpos (Map, Item, Player). Extra: sonido al tocar un item.</p>`,
      code(String.raw`
// Player::Start()
pbody->listener = this;                    // "avísame a mí"
pbody->ctype = ColliderType::PLAYER;
pickCoinFxId = Engine::GetInstance().audio->LoadFx("Assets/Audio/Fx/coin-collision-sound-342335.wav");

// Player.h
void OnCollision(PhysBody* physA, PhysBody* physB) override;
void OnCollisionEnd(PhysBody* physA, PhysBody* physB) override;

// Player.cpp
void Player::OnCollision(PhysBody* physA, PhysBody* physB)
{
    // physA es siempre MI cuerpo; physB es el otro
    switch (physB->ctype)
    {
    case ColliderType::PLATFORM:
        LOG("Collision PLATFORM");
        isJumping = false;                 // he aterrizado
        break;
    case ColliderType::ITEM:
        LOG("Collision ITEM");
        Engine::GetInstance().audio->PlayFx(pickCoinFxId);
        break;
    case ColliderType::UNKNOWN:
        LOG("Collision UNKNOWN");
        break;
    }
}

void Player::OnCollisionEnd(PhysBody* physA, PhysBody* physB)
{
    if (physB->ctype == ColliderType::PLATFORM) LOG("Dejo de tocar la plataforma");
}`, "cpp", "Player"))}

<h2>Siguientes pasos (y lo que ya tienes hecho)</h2>
<ul>
<li>Colliders que hacen daño y reset del jugador al morir.</li>
<li><code>OnCollisionEnd</code> en las entidades.</li>
<li>Salto bien hecho (solo desde el suelo, altura configurable).</li>
<li>Ordenar el Update del jugador en funciones (<code>GetPhysicsValues()</code>, <code>Move()</code>, <code>Jump()</code>, <code>ApplyPhysics()</code>, <code>Draw()</code>).</li>
<li><strong>Borrar cuerpos</strong>: nunca destruyas un cuerpo dentro de un callback de colisión (el mundo está a medio step). Márcalo como “pendiente de borrar” y destrúyelo después del step. Lee <a href="https://www.iforce2d.net/b2dtut/removing-bodies" target="_blank" rel="noopener">Removing bodies</a>.</li>
</ul>

${nota(`<p>Tu juego ya tiene casi todo esto: <kbd>F9</kbd> para ver colliders de Box2D, detección de suelo, pinchos que quitan una vida (un <code>ctype</code> tipo SPIKES), fosos con muerte instantánea (un sensor tipo DEATH), invulnerabilidad de 0.5 s y la voltereta (una velocidad horizontal mayor durante un tiempo). Repasa tu <code>OnCollision</code> con esta lección y comprueba que no destruyes cuerpos dentro del callback.</p>`, "game")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué tipo de cuerpo es una plataforma fija?", o: ["dynamic", "static", "kinematic"], c: 1, e: "No se mueve nunca y no le afecta la gravedad." },
      { p: "¿Qué tipo usarías para una plataforma que se mueve de lado a lado sin que el jugador la empuje?", o: ["dynamic", "static", "kinematic"], c: 2, e: "Kinematic: se mueve por su velocidad, pero las colisiones no la desplazan." },
      { p: "Para saltar, lo más adecuado es…", o: ["ApplyForceToCenter cada frame", "ApplyLinearImpulseToCenter una vez", "Cambiar position.y"], c: 1, e: "El impulso cambia la velocidad de golpe, una sola vez." },
      { p: "Al mover al jugador con SetLinearVelocity, ¿por qué leemos antes la velocidad actual?", o: ["Para conservar la componente Y (gravedad/salto)", "Porque Box2D lo exige", "Para calcular dt"], c: 0, e: "Si pusieras velocity = {vx, 0} anularías la caída en cada frame." },
      { p: "¿Qué hace pbody->listener = this?", o: ["Activa la gravedad", "Hace que Physics llame a OnCollision de esta entidad (Observer)", "Crea el cuerpo"], c: 1, e: "La entidad se registra para recibir los eventos de su cuerpo." }
    ])}
`,
    init(root) {
      const W = 640, H = 300, cv = root.querySelector("#ph-cv"), ctx = Curso.canvas(cv, W, H);
      const dbg = root.querySelector("#ph-dbg"), gIn = root.querySelector("#ph-g"), jIn = root.querySelector("#ph-j");
      const out = root.querySelector("#ph-out"), logEl = root.querySelector("#ph-log");
      const lines = []; const log = (s) => { if (lines[lines.length - 1] === s) return; lines.push(s); if (lines.length > 30) lines.shift(); logEl.textContent = lines.join("\n"); logEl.scrollTop = logEl.scrollHeight; };
      const statics = [
        { x: 0, y: 270, w: 640, h: 30, t: "PLATFORM" }, { x: 120, y: 200, w: 140, h: 16, t: "PLATFORM" },
        { x: 330, y: 150, w: 120, h: 16, t: "PLATFORM" }, { x: 500, y: 210, w: 100, h: 16, t: "PLATFORM" },
        { x: 280, y: 254, w: 60, h: 16, t: "SPIKES" }
      ];
      let player, items, fixedAcc = 0;
      const reset = () => { player = { x: 40, y: 200, w: 22, h: 30, vx: 0, vy: 0, ground: false, t: "PLAYER", hurt: 0 }; items = [{ x: 380, y: 40, w: 14, h: 14, vx: 0, vy: 0, t: "ITEM" }]; };
      reset();
      const keys = Curso.teclado(cv, (e) => {
        if (e.code === "Space" && player.ground) { player.vy = -(+jIn.value); player.ground = false; log("Space -> ApplyLinearImpulseToCenter({0, -jump})"); }
        if (e.code === "F9") { e.preventDefault(); dbg.checked = !dbg.checked; }
      });
      Curso.on(root.querySelector("#ph-item"), "click", () => { items.push({ x: 60 + Math.random() * 520, y: 0, w: 14, h: 14, vx: (Math.random() - .5) * 120, vy: 0, t: "ITEM" }); if (items.length > 12) items.shift(); });
      const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      function moveBody(b, dt, isPlayer) {
        b.vy += (+gIn.value) * dt;
        b.x += b.vx * dt;
        for (const s of statics) if (s.t !== "SPIKES" && overlap(b, s)) { if (b.vx > 0) b.x = s.x - b.w; else if (b.vx < 0) b.x = s.x + s.w; b.vx = isPlayer ? b.vx : -b.vx * .3; }
        b.y += b.vy * dt;
        let landed = false;
        for (const s of statics) if (overlap(b, s)) {
          if (s.t === "SPIKES" && isPlayer) { if (player.hurt <= 0) { log("OnCollision(PLAYER, SPIKES) -> pierde una vida"); player.hurt = 0.5; b.vy = -380; } continue; }
          if (s.t === "SPIKES") continue;
          if (b.vy > 0) { b.y = s.y - b.h; landed = true; if (isPlayer && !b.ground) log("OnCollision(PLAYER, PLATFORM) -> isJumping = false"); }
          else if (b.vy < 0) b.y = s.y + s.h;
          b.vy = isPlayer ? 0 : (Math.abs(b.vy) > 120 ? -b.vy * .4 : 0);
          if (!isPlayer) b.vx *= .9;
        }
        if (isPlayer) b.ground = landed;
        if (b.x < 0) { b.x = 0; if (!isPlayer) b.vx *= -1; } if (b.x + b.w > W) { b.x = W - b.w; if (!isPlayer) b.vx *= -1; }
        if (b.y > H + 50) { b.y = 0; b.vy = 0; }
      }
      const FIXED = 1 / 60;
      Curso.bucle((dt) => {
        fixedAcc += dt; let steps = 0;
        while (fixedAcc >= FIXED) {
          player.vx = 0; if (keys.has("KeyA")) player.vx = -200; if (keys.has("KeyD")) player.vx = 200;
          moveBody(player, FIXED, true);
          items.forEach((it) => moveBody(it, FIXED, false));
          items = items.filter((it) => { if (overlap(player, it)) { log("OnCollision(PLAYER, ITEM) -> PlayFx(coin)"); return false; } return true; });
          if (player.hurt > 0) player.hurt -= FIXED;
          fixedAcc -= FIXED; steps++;
        }
        ctx.clearRect(0, 0, W, H);
        statics.forEach((s) => {
          ctx.fillStyle = s.t === "SPIKES" ? Curso.color("bad") : Curso.color("ink-3");
          if (s.t === "SPIKES") { for (let x = s.x; x < s.x + s.w; x += 12) { ctx.beginPath(); ctx.moveTo(x, s.y + s.h); ctx.lineTo(x + 6, s.y); ctx.lineTo(x + 12, s.y + s.h); ctx.fill(); } }
          else ctx.fillRect(s.x, s.y, s.w, s.h);
        });
        items.forEach((it) => { ctx.fillStyle = Curso.color("amber"); ctx.beginPath(); ctx.arc(it.x + 7, it.y + 7, 7, 0, 7); ctx.fill(); });
        if (!(player.hurt > 0 && Math.floor(player.hurt * 20) % 2)) { ctx.fillStyle = Curso.color("accent"); ctx.fillRect(player.x, player.y, player.w, player.h); }
        if (dbg.checked) {
          ctx.lineWidth = 1.5;
          const box = (b, col) => { ctx.strokeStyle = col; ctx.strokeRect(b.x + .5, b.y + .5, b.w, b.h); };
          statics.forEach((s) => box(s, s.t === "SPIKES" ? Curso.color("bad") : Curso.color("ok")));
          items.forEach((it) => { ctx.strokeStyle = Curso.color("ok"); ctx.beginPath(); ctx.arc(it.x + 7, it.y + 7, 7, 0, 7); ctx.stroke(); });
          box(player, Curso.color("ok"));
          ctx.strokeStyle = Curso.color("bad"); ctx.beginPath(); ctx.moveTo(player.x + 11, player.y + 15); ctx.lineTo(player.x + 11 + player.vx * .12, player.y + 15 + player.vy * .12); ctx.stroke();
          ctx.lineWidth = 1;
        }
        if (document.activeElement !== cv) { ctx.fillStyle = Curso.color("ink-2"); ctx.font = "13px Inter, sans-serif"; ctx.fillText("Haz clic aquí para controlar al jugador", 210, 30); }
        out.innerHTML = `<span>velocity <b>(${player.vx.toFixed(0)}, ${player.vy.toFixed(0)})</b> px/s</span><span>en el suelo <b>${player.ground}</b></span><span>pasos de física este frame <b>${steps}</b></span>`;
      });
    }
  });
})();
