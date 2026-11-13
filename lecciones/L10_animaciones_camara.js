(function () {
  const { code, nota, todo, quiz, demo, esc } = Curso;

  const TSX = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" name="Animaciones" tilewidth="32" tileheight="32" tilecount="33" columns="11">
 <image source="player2_spritesheet.png" width="352" height="96"/>
 <tile id="0" type="idle">
  <animation>
   <frame tileid="0" duration="150"/>
   <frame tileid="1" duration="150"/>
   <frame tileid="2" duration="150"/>
   <frame tileid="3" duration="150"/>
  </animation>
 </tile>
 <tile id="11" type="move">
  <animation>
   <frame tileid="11" duration="90"/>
   <frame tileid="12" duration="90"/>
   <frame tileid="13" duration="90"/>
   <frame tileid="14" duration="90"/>
   <frame tileid="15" duration="90"/>
   <frame tileid="16" duration="90"/>
  </animation>
 </tile>
 <tile id="22" type="jump">
  <animation>
   <frame tileid="22" duration="120"/>
   <frame tileid="23" duration="120"/>
   <frame tileid="24" duration="400"/>
  </animation>
 </tile>
</tileset>`;

  // Spritesheet procedural 11×3 de 32px: fila 0 idle, 1 walk, 2 jump
  function spritesheet() {
    const c = document.createElement("canvas"); c.width = 352; c.height = 96;
    const g = c.getContext("2d");
    for (let r = 0; r < 3; r++) for (let q = 0; q < 11; q++) {
      const x = q * 32, y = r * 32;
      let bob = 0, legA = 0, legB = 0, arm = 0;
      if (r === 0) { bob = [0, 1, 2, 1][q % 4]; }
      if (r === 1) { const ph = (q % 6) / 6 * Math.PI * 2; legA = Math.sin(ph) * 5; legB = -legA; arm = Math.cos(ph) * 3; bob = Math.abs(Math.sin(ph)) * 2; }
      if (r === 2) { bob = [-2, -4, -3][Math.min(q, 2)]; legA = -3; legB = 3; arm = -4; }
      g.fillStyle = "#3a3f58"; g.fillRect(x + 12 + legA, y + 23 + bob * 0, 4, 8); g.fillRect(x + 17 + legB, y + 23, 4, 8);
      g.fillStyle = "#c2c8de"; g.fillRect(x + 10, y + 11 + bob, 13, 13);
      g.fillStyle = "#e0a93a"; g.fillRect(x + 11, y + 3 + bob, 11, 9);
      g.fillStyle = "#1a1e2c"; g.fillRect(x + 18, y + 6 + bob, 2, 2);
      g.fillStyle = "#8e96b8"; g.fillRect(x + 22, y + 13 + bob + arm, 4, 7);
      g.fillStyle = "#b53a2b"; g.fillRect(x + 9, y + 11 + bob, 2, 9);
    }
    return c;
  }

  function parseTSX(txt) {
    const d = new DOMParser().parseFromString(txt, "application/xml");
    if (d.querySelector("parsererror")) return { error: "TSX mal formado" };
    const ts = d.documentElement;
    const cols = +ts.getAttribute("columns"), tw = +ts.getAttribute("tilewidth"), th = +ts.getAttribute("tileheight");
    const anims = {};
    for (const tile of ts.querySelectorAll("tile")) {
      const a = tile.querySelector("animation"); if (!a) continue;
      const name = tile.getAttribute("type") || tile.getAttribute("class") || ("tile" + tile.getAttribute("id"));
      anims[name] = [...a.querySelectorAll("frame")].map((f) => { const id = +f.getAttribute("tileid"); return { x: (id % cols) * tw, y: Math.floor(id / cols) * th, w: tw, h: th, ms: +f.getAttribute("duration"), id }; });
    }
    return { anims, tw, th };
  }

  Curso.leccion({
    id: "l10", num: "10", grupo: "Bloque 5 · Darle vida", corto: "Animaciones y cámara", pdf: "L10_Load Parameters and Animations",
    titulo: "Animaciones desde Tiled y cámara que sigue al jugador",
    resumen: "Spritesheets, animaciones definidas en un .tsx, parámetros de entidad en config.xml y cámara con límites.",
    intro: "Un personaje que se desliza como un cuadrado quieto no transmite nada. Hoy cargas animaciones (idle, andar, saltar) que defines visualmente en el editor de animaciones de Tiled, y haces que la cámara siga al jugador sin salirse del mapa.",
    objetivos: ["Preparar un spritesheet y crear animaciones en Tiled (.tsx)", "Entender Animation (frames + duración) y AnimationSet", "Cargar parámetros de la entidad desde config.xml", "Centrar la cámara en el jugador con límites del mapa"],
    html: () => `
<h2>Spritesheets</h2>
<p>Un <strong>spritesheet</strong> es una imagen con todos los fotogramas de un personaje en una rejilla. Lo típico: cada fila es una animación (idle, walk, jump). Dibujar un frame es exactamente lo mismo que dibujar un tile: eliges el rectángulo src del frame y lo pintas en la posición del jugador.</p>

<h2>Crear las animaciones en Tiled</h2>
<ol>
<li><strong>Nuevo tileset</strong> con el spritesheet (p. ej. <code>Assets/Textures/player2_spritesheet.png</code>). <em>No</em> lo incrustes en un mapa: guárdalo como <code>.tsx</code> en la misma carpeta que la imagen.</li>
<li>Abre el <strong>Tile Animation Editor</strong>. Selecciona el primer tile de la fila, arrastra los frames de esa fila a la lista de la izquierda y ajusta la duración de cada uno.</li>
<li>Repite con la segunda y tercera fila (clic derecho sobre el tile inicial de cada fila).</li>
<li>Dale un nombre a cada animación: en el campo <em>Class</em> (o <em>Type</em>) del tile inicial escribe <code>idle</code>, <code>move</code>, <code>jump</code>, o usa los alias que espere tu <code>AnimationSet</code>.</li>
<li>Guarda y abre el .tsx con un editor de texto para ver el XML.</li>
</ol>

${demo("d-anim", "Reproductor de animaciones TSX", "Edita las duraciones del XML", `
<div class="split">
  <textarea class="xml" id="tsx-src" spellcheck="false" aria-label="Animaciones.tsx">${esc(TSX)}</textarea>
  <div style="display:grid;gap:10px;align-content:start">
    <canvas id="anim-cv"></canvas>
    <div class="controls" id="anim-btns"></div>
    <label class="controls">Velocidad <input type="range" id="anim-speed" min="0.1" max="3" step="0.1" value="1"></label>
    <div class="readout" id="anim-out"></div>
  </div>
</div>`)}

<h3>Las dos clases del handout</h3>
<ul>
<li><strong>Animation</strong>: guarda una secuencia de frames (<code>SDL_Rect</code> + duración en ms), avanza el frame actual con el tiempo, sabe si hace bucle y si ha terminado, y te da el rectángulo actual.</li>
<li><strong>AnimationSet</strong>: carga varias animaciones de un TSX, asocia ids de tile a nombres mediante alias, gestiona cuál es la animación actual y la actualiza.</li>
</ul>
${code(String.raw`
class Animation
{
public:
    void AddFrame(const SDL_Rect& rect, int durationMs) { frames.push_back({ rect, durationMs }); }
    void SetLoop(bool l) { loop = l; }
    void Reset() { currentFrame = 0; timer = 0.0f; finished = false; }

    void Update(float dtMs)
    {
        if (frames.empty() || finished) return;
        timer += dtMs;
        // while, no if: con dt grande puede que haya que saltar varios frames
        while (timer >= frames[currentFrame].durationMs) {
            timer -= frames[currentFrame].durationMs;
            currentFrame++;
            if (currentFrame >= (int)frames.size()) {
                if (loop) currentFrame = 0;
                else { currentFrame = (int)frames.size() - 1; finished = true; break; }
            }
        }
    }

    const SDL_Rect& GetCurrentFrame() const { return frames[currentFrame].rect; }
    bool HasFinished() const { return finished; }

private:
    struct Frame { SDL_Rect rect; int durationMs; };
    std::vector<Frame> frames;
    int   currentFrame = 0;
    float timer = 0.0f;
    bool  loop = true, finished = false;
};`, "cpp", "Animation.h (idea)")}

${code(String.raw`
bool AnimationSet::LoadFromTSX(const char* path, const std::map<int, std::string>& aliases)
{
    pugi::xml_document doc;
    if (!doc.load_file(path)) return false;

    pugi::xml_node ts = doc.child("tileset");
    int tw = ts.attribute("tilewidth").as_int();
    int th = ts.attribute("tileheight").as_int();
    int columns = ts.attribute("columns").as_int();

    for (pugi::xml_node tile = ts.child("tile"); tile; tile = tile.next_sibling("tile"))
    {
        pugi::xml_node animNode = tile.child("animation");
        if (!animNode) continue;

        int id = tile.attribute("id").as_int();
        std::string name = aliases.count(id) ? aliases.at(id) : ("tile" + std::to_string(id));

        Animation anim;
        for (pugi::xml_node f = animNode.child("frame"); f; f = f.next_sibling("frame")) {
            int tileId = f.attribute("tileid").as_int();
            SDL_Rect r = { (tileId % columns) * tw, (tileId / columns) * th, tw, th };   // ¡GetRect otra vez!
            anim.AddFrame(r, f.attribute("duration").as_int());
        }
        animations[name] = anim;
    }
    return true;
}`, "cpp", "AnimationSet::LoadFromTSX (idea)")}

${nota(`<p>Fíjate que convertir <code>tileid</code> a rectángulo es la misma fórmula de la L07 (sin firstgid, porque en un TSX los ids son locales, y aquí sin margin/spacing).</p>`)}

<h2>Los TODOs del handout</h2>
${todo("TODO 4", "config.xml / Entity.h / Scene.cpp", `<p>Mueve los parámetros del jugador al config (textura, animaciones, velocidad, tamaño de frame). Añade a Entity un nodo de parámetros y pásaselo desde Scene.</p>`,
      code(String.raw`
<!-- config.xml -->
<scene>
  <entities>
    <player x="96" y="96">
      <texture path="Assets/Textures/player2_spritesheet.png"/>
      <animations tsx="Assets/Textures/Animaciones.tsx"/>
      <movement speed="4.0" jump="5"/>
      <frame width="32" height="32"/>
    </player>
  </entities>
</scene>`, "xml", "config.xml") + code(String.raw`
// Entity.h
virtual void SetParameters(pugi::xml_node p) { parameters = p; }
pugi::xml_node parameters;

// Scene.cpp -> Awake()
player = std::dynamic_pointer_cast<Player>(
    Engine::GetInstance().entityManager->CreateEntity(EntityType::PLAYER));
player->SetParameters(configParameters.child("entities").child("player"));`, "cpp", "Entity.h + Scene.cpp"))}
${nota(`<p>El nodo exacto depende de dónde pongas el bloque. En <strong>tu</strong> config.xml el jugador está bajo <code>&lt;entitymanager&gt;&lt;player&gt;</code>, así que es el EntityManager (cuyo <code>configParameters</code> ya es ese nodo) quien debe pasarle <code>configParameters.child("player")</code>.</p>`, "game")}

${todo("TODO 5 y 6", "Player.h / Player.cpp", `<p>Carga el spritesheet desde los parámetros, el tamaño de frame, las animaciones del TSX y elige la animación inicial. Actualízala cada frame y dibuja solo el frame actual.</p>`,
      code(String.raw`
// Player.h
#include "Animation.h"
AnimationSet anims;

// Player::Start()
texture = Engine::GetInstance().textures->Load(parameters.child("texture").attribute("path").as_string());
texW = parameters.child("frame").attribute("width").as_int();
texH = parameters.child("frame").attribute("height").as_int();
speed = parameters.child("movement").attribute("speed").as_float();

std::map<int, std::string> aliases = { {0, "idle"}, {11, "move"}, {22, "jump"} };
anims.LoadFromTSX(parameters.child("animations").attribute("tsx").as_string(), aliases);
anims.SetCurrent("idle");

// Player::Update(dt)
anims.Update(dt);

// Player::Draw()
const SDL_Rect& currentFrame = anims.GetCurrentFrame();
Engine::GetInstance().render->DrawTexture(texture, x - texW / 2, y - texH / 2, &currentFrame);`, "cpp", "Player"))}

${todo("TODO 7", "Player.cpp", `<p>Cambia de animación según el estado: quieto → idle, moviéndose → move, en el aire → jump.</p>`,
      code(String.raw`
if (isJumping)                  anims.SetCurrent("jump");
else if (velocity.x != 0.0f)    anims.SetCurrent("move");
else                            anims.SetCurrent("idle");

// Para mirar a la izquierda, no hagas otra animación: voltea el sprite al dibujar
SDL_FlipMode flip = facingLeft ? SDL_FLIP_HORIZONTAL : SDL_FLIP_NONE;`, "cpp", "Player.cpp"))}
${nota(`<p>Haz que <code>SetCurrent</code> no haga nada si ya es la animación actual. Si llamas a <code>SetCurrent("move")</code> cada frame y eso hace <code>Reset()</code>, la animación se quedará clavada en el frame 0.</p>`, "warn")}

<h2>La cámara</h2>
<p>La cámara es un desplazamiento que el render resta a todo lo que dibuja. Si el jugador está en x=2000 y la pantalla mide 1280, para tenerlo centrado la cámara debe estar en 2000 − 640. Pero cuando el jugador llega al borde del mapa, la cámara debe <strong>pararse</strong> para no enseñar el vacío.</p>
${demo("d-cam", "Cámara con límites", "Clic en el lienzo · A/D para mover", `
<canvas id="cam-cv"></canvas>
<div class="controls"><label><input type="checkbox" id="cam-clamp" checked> Limitar al mapa</label><label><input type="checkbox" id="cam-dead"> Zona muerta</label></div>
<div class="readout" id="cam-out"></div>`)}

${todo("TODO 8", "Map.h / Map.cpp / Player.cpp", `<p>Añade <code>GetMapSizeInPixels()</code> al mapa y, después de calcular la posición del jugador, actualiza la cámara centrada en él, con límites.</p>`,
      code(String.raw`
// Map.cpp
Vector2D Map::GetMapSizeInPixels()
{
    return Vector2D((float)(mapData.width * mapData.tileWidth),
                    (float)(mapData.height * mapData.tileHeight));
}

// Player.cpp (al final de Update, ya con position actualizada)
void Player::UpdateCamera()
{
    auto& render = Engine::GetInstance().render;
    int screenW = render->camera.w;                         // ancho de la ventana
    float mapW = Engine::GetInstance().map->GetMapSizeInPixels().getX();

    // Cámara que centra al jugador (en este motor la cámara es negativa: camera.x = -mundoX)
    float camX = position.getX() - screenW / 2.0f;

    // Límites: ni antes del 0 ni después del final del mapa
    if (camX < 0) camX = 0;
    if (camX > mapW - screenW) camX = mapW - screenW;

    render->camera.x = -(int)camX;
}`, "cpp", "Map + Player"))}
${nota(`<p>En muchos handouts de este motor, <code>DrawTexture</code> hace <code>x + camera.x</code>, así que la cámara se guarda <strong>en negativo</strong>. Si al moverte la cámara va al revés, es esto: cambia el signo.</p>`, "warn")}

${nota(`<p>Tu <code>caballero.tsx</code> usa frames de 40×44 en 8 columnas y tiene animaciones que empiezan en los tiles 0 (idle, 310 ms por frame), 16 (correr), 40… y tu config pone frame 40×43. Esa diferencia de 1 px puede hacer que el sprite “tiemble” o muestre una línea del frame de abajo: haz que coincidan.</p>`, "game")}

<h2>Siguientes pasos</h2>
<ul><li>Organiza el Update del jugador en funciones: <code>Move()</code>, <code>Jump()</code>, <code>UpdateAnimation()</code>, <code>UpdateCamera()</code>…</li><li>Completa la entrega 1.</li></ul>

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "Una animación tiene frames de 100 ms y dt = 250 ms. ¿Cuántos frames avanza?", o: ["1", "2", "3"], c: 1, e: "Con un while: 250 → 150 → 50, avanza 2 y sobran 50 ms." },
      { p: "Spritesheet de 11 columnas y 32 px. ¿Rect del tileid 13?", o: ["{64, 32, 32, 32}", "{416, 0, 32, 32}", "{32, 64, 32, 32}"], c: 0, e: "13 % 11 = 2 → x = 64; 13 / 11 = 1 → y = 32." },
      { p: "Mapa de 3200 px, pantalla de 1280, jugador en x = 3100. ¿Cámara (positiva) con límites?", o: ["2460", "1920", "3100"], c: 1, e: "3100 − 640 = 2460 > 3200 − 1280 = 1920 → se queda en 1920." },
      { p: "¿Por qué la animación se queda congelada en el primer frame?", o: ["Las duraciones son 0", "SetCurrent la reinicia cada frame", "Falta el loop"], c: 1, e: "SetCurrent debe ignorar la llamada si ya es la actual." }
    ])}
`,
    init(root) {
      // ---- reproductor ----
      const sheet = spritesheet();
      const cv = root.querySelector("#anim-cv"), ctx = Curso.canvas(cv, 360, 200);
      const src = root.querySelector("#tsx-src"), btns = root.querySelector("#anim-btns"), out = root.querySelector("#anim-out"), spd = root.querySelector("#anim-speed");
      let data = parseTSX(TSX), cur = "idle", frame = 0, timer = 0;
      function buildBtns() {
        if (data.error) { btns.innerHTML = `<span style="color:var(--bad)">${data.error}</span>`; return; }
        btns.innerHTML = Object.keys(data.anims).map((n) => `<button type="button" class="btn ${n === cur ? "on" : ""}" data-a="${n}">SetCurrent("${n}")</button>`).join("");
        btns.querySelectorAll("button").forEach((b) => Curso.on(b, "click", () => { if (cur !== b.dataset.a) { cur = b.dataset.a; frame = 0; timer = 0; } buildBtns(); }));
      }
      Curso.on(src, "input", () => { data = parseTSX(src.value); if (!data.error && !data.anims[cur]) cur = Object.keys(data.anims)[0]; frame = 0; timer = 0; buildBtns(); });
      buildBtns();
      // ---- cámara ----
      const cc = root.querySelector("#cam-cv"), cx = Curso.canvas(cc, 640, 200), keys = Curso.teclado(cc);
      const clamp = root.querySelector("#cam-clamp"), dead = root.querySelector("#cam-dead"), cOut = root.querySelector("#cam-out");
      const MAPW = 2400, ts = Curso.tilesetDemo();
      let px = 300, camX = 0, pf = 0, pt = 0, facing = 1;
      Curso.bucle((dt) => {
        // reproductor
        if (!data.error && data.anims[cur]) {
          const fr = data.anims[cur];
          timer += dt * 1000 * +spd.value;
          let guard = 0;
          while (fr.length && timer >= Math.max(fr[frame % fr.length].ms, 1) && guard++ < 50) { timer -= Math.max(fr[frame % fr.length].ms, 1); frame = (frame + 1) % fr.length; }
          const f = fr[frame % fr.length];
          ctx.clearRect(0, 0, 360, 200);
          ctx.drawImage(sheet, 0, 0, 352, 96, 4, 4, 352, 96);
          ctx.strokeStyle = Curso.color("amber"); ctx.lineWidth = 2; ctx.strokeRect(4 + f.x, 4 + f.y, f.w, f.h); ctx.lineWidth = 1;
          ctx.drawImage(sheet, f.x, f.y, f.w, f.h, 140, 104, 92, 92);
          out.innerHTML = `<span>anim <b>${cur}</b></span><span>frame <b>${frame % fr.length}/${fr.length}</b> (tileid ${f.id})</span><span>src <b>{${f.x},${f.y},${f.w},${f.h}}</b></span><span>${f.ms} ms</span>`;
        }
        // cámara
        let vx = 0; if (keys.has("KeyA")) vx = -260; if (keys.has("KeyD")) vx = 260;
        if (vx) facing = Math.sign(vx);
        px = Math.max(0, Math.min(MAPW - 24, px + vx * dt));
        let target = px - 320;
        if (dead.checked) { const left = camX + 220, right = camX + 420; target = camX; if (px < left) target = px - 220; if (px > right) target = px - 420; }
        camX = target;
        if (clamp.checked) camX = Math.max(0, Math.min(MAPW - 640, camX));
        pt += dt * 1000; const anim = vx ? data.anims.move : data.anims.idle;
        if (anim && anim.length) { let gd = 0; while (pt >= Math.max(anim[pf % anim.length].ms, 1) && gd++ < 50) { pt -= Math.max(anim[pf % anim.length].ms, 1); pf++; } }
        cx.clearRect(0, 0, 640, 200);
        cx.fillStyle = Curso.color("bad-soft"); cx.fillRect(0, 0, 640, 200);
        cx.save(); cx.translate(-Math.round(camX), 0);
        cx.fillStyle = Curso.color("surface"); cx.fillRect(0, 0, MAPW, 200);
        for (let x = 0; x < MAPW; x += 32) { cx.drawImage(ts.canvas, 1 + ((x / 32) % 3) * 33, 34, 32, 32, x, 168, 32, 32); if ((x / 32) % 7 === 3) cx.drawImage(ts.canvas, 1 + 5 * 33, 100, 32, 32, x, 136, 32, 32); }
        cx.fillStyle = Curso.color("ink-3"); cx.font = "12px JetBrains Mono, monospace";
        for (let x = 0; x <= MAPW; x += 400) cx.fillText("x=" + x, x + 4, 16);
        const f = anim && anim[pf % anim.length];
        if (f) { cx.save(); cx.translate(px + 12, 0); cx.scale(facing, 1); cx.drawImage(sheet, f.x, f.y, f.w, f.h, -24, 120, 48, 48); cx.restore(); }
        cx.restore();
        if (dead.checked) { cx.strokeStyle = Curso.color("accent"); cx.setLineDash([4, 4]); cx.strokeRect(220.5, 20.5, 200, 160); cx.setLineDash([]); }
        if (document.activeElement !== cc) { cx.fillStyle = Curso.color("ink-2"); cx.font = "13px Inter, sans-serif"; cx.fillText("Haz clic aquí y usa A / D", 240, 60); }
        cOut.innerHTML = `<span>jugador.x <b>${px.toFixed(0)}</b></span><span>camX <b>${camX.toFixed(0)}</b></span><span>render->camera.x <b>${(-camX).toFixed(0)}</b></span><span>límite <b>[0, ${MAPW - 640}]</b></span>`;
      });
    }
  });
})();
