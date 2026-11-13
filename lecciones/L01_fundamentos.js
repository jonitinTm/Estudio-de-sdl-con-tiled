(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "l01", num: "01", grupo: "Bloque 1 · El motor", corto: "Fundamentos",
    titulo: "Fundamentos: C++, SDL3 y la arquitectura del motor",
    resumen: "Qué es SDL3, qué es Tiled, el C++ que vas a leer y cómo se organiza el motor en módulos.",
    intro: "Antes de medir frames o cargar mapas necesitas un mapa mental del proyecto: qué hace SDL por ti, qué piezas de C++ aparecen en cada archivo y cómo el Engine llama a sus módulos en cada vuelta del bucle.",
    objetivos: ["Saber qué hace SDL3 y qué hace Tiled", "Leer sin miedo clases, herencia, virtual y smart pointers", "Entender el ciclo Awake → Start → Update → CleanUp", "Dibujar un rectángulo y una textura con SDL3"],
    html: () => `
<h2>Las dos herramientas del curso</h2>
<p><strong>SDL3</strong> (Simple DirectMedia Layer) es una librería en C. No es un motor: no sabe lo que es un jugador ni un mapa. Lo que hace es darte acceso, igual en Windows, Linux o Mac, a lo básico: crear una ventana, dibujar en ella con la GPU, leer teclado y ratón, reproducir sonido y medir el tiempo. Con <strong>SDL3_image</strong> además puedes cargar PNG.</p>
<p><strong>Tiled</strong> es un editor de mapas. Tú pintas el nivel con tiles y guardas un archivo <code>.tmx</code> (el mapa) o <code>.tsx</code> (un tileset). Los dos son XML, o sea texto con etiquetas que tu motor leerá con <strong>pugixml</strong>.</p>
<p>El curso consiste en ir construyendo, encima de SDL, un pequeño motor en C++ que sabe leer lo que haces en Tiled y convertirlo en un juego.</p>

${nota(`<p>Tu motor = SDL (ventana, dibujo, input, tiempo) + pugixml (leer XML) + Box2D (físicas) + <em>tu código</em> (módulos, entidades, mapa, pathfinding).</p>`)}

<h2>El C++ que vas a ver en cada archivo</h2>
<h3>.h y .cpp</h3>
<p>Cada clase vive en dos archivos. El <code>.h</code> (cabecera) <em>declara</em> qué tiene la clase: sus variables y la firma de sus funciones. El <code>.cpp</code> <em>implementa</em> esas funciones. Otros archivos hacen <code>#include "Player.h"</code> para poder usar la clase.</p>
${code(String.raw`
// Player.h  -> la "ficha" de la clase
#pragma once            // evita que el .h se incluya dos veces
#include "Entity.h"

class Player : public Entity {      // Player HEREDA de Entity
public:
    Player();
    bool Start() override;          // override: reescribe una función virtual de Entity
    bool Update(float dt) override;
private:
    float speed = 200.0f;           // píxeles por segundo
    SDL_Texture* texture = nullptr; // puntero a una textura de SDL
};`, "cpp", "Player.h")}
${code(String.raw`
// Player.cpp -> el código de verdad
#include "Player.h"

Player::Player() : Entity(EntityType::PLAYER) {}   // llama al constructor del padre

bool Player::Update(float dt)
{
    position.setX(position.getX() + speed * dt);   // "position" la heredamos de Entity
    return true;
}`, "cpp", "Player.cpp")}

<h3>Herencia y virtual (polimorfismo)</h3>
<p>Si <code>Entity</code> declara <code>virtual bool Update(float dt)</code>, cada hija (Player, Item, Enemy) puede tener su propia versión. El motor guarda una lista de <code>Entity</code> y llama a <code>Update()</code> en todas sin saber de qué tipo es cada una: C++ decide en tiempo de ejecución qué versión ejecutar. Esto es la base de la lección 04.</p>

<h3>Punteros y smart pointers</h3>
<table class="t"><thead><tr><th>Lo que ves</th><th>Qué significa</th></tr></thead><tbody>
<tr><td><code>SDL_Texture* tex</code></td><td>Puntero “crudo”: una dirección de memoria. SDL te lo da y tú debes liberarlo (<code>SDL_DestroyTexture</code>).</td></tr>
<tr><td><code>std::shared_ptr&lt;Player&gt; player</code></td><td>Puntero inteligente: se borra solo cuando nadie lo usa ya. El motor lo usa para módulos y entidades.</td></tr>
<tr><td><code>std::make_shared&lt;Player&gt;()</code></td><td>Crea un objeto nuevo y te devuelve su shared_ptr.</td></tr>
<tr><td><code>a->b</code> vs <code>a.b</code></td><td>Flecha si <code>a</code> es puntero, punto si es un objeto o referencia.</td></tr>
<tr><td><code>const Vector2D&amp; v</code></td><td>Referencia constante: pasa el objeto sin copiarlo y sin poder modificarlo.</td></tr>
</tbody></table>

<h3>Contenedores que vas a usar</h3>
<ul>
<li><code>std::vector&lt;int&gt;</code>: array que crece. Lo usarás para guardar los tiles de una capa.</li>
<li><code>std::list&lt;std::shared_ptr&lt;Module&gt;&gt;</code>: lista de módulos del Engine.</li>
<li><code>std::queue</code> y <code>std::priority_queue</code>: colas para BFS y Dijkstra (lecciones 11 y 12).</li>
</ul>

<h2>Un programa SDL3 mínimo</h2>
<p>Así es SDL sin ningún motor encima. Todo lo que construirás después es una forma ordenada de repartir este código en módulos.</p>
${code(String.raw`
#include <SDL3/SDL.h>

int main(int argc, char* argv[])
{
    SDL_Init(SDL_INIT_VIDEO);
    SDL_Window*   window   = SDL_CreateWindow("Hola SDL3", 1280, 720, 0);
    SDL_Renderer* renderer = SDL_CreateRenderer(window, nullptr);

    bool running = true;
    while (running)                                  // <- EL BUCLE DE JUEGO
    {
        // 1) INPUT: vaciar la cola de eventos
        SDL_Event e;
        while (SDL_PollEvent(&e))
            if (e.type == SDL_EVENT_QUIT) running = false;

        // 2) UPDATE: aquí moverías cosas

        // 3) RENDER: borrar, dibujar, presentar
        SDL_SetRenderDrawColor(renderer, 30, 30, 40, 255);
        SDL_RenderClear(renderer);

        SDL_FRect rect = { 100.0f, 100.0f, 64.0f, 64.0f }; // x, y, w, h
        SDL_SetRenderDrawColor(renderer, 255, 200, 0, 255);
        SDL_RenderFillRect(renderer, &rect);

        SDL_RenderPresent(renderer);                 // mostrar el frame
    }

    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();
    return 0;
}`, "cpp", "main.cpp (SDL puro)")}

${nota(`<p>En SDL el origen <code>(0,0)</code> está <strong>arriba a la izquierda</strong> y la <strong>Y crece hacia abajo</strong>. Saltar es restar Y; caer es sumar Y. Esto confunde a todo el mundo la primera semana.</p>`, "warn")}

${demo("d-rect", "Coordenadas de pantalla y SDL_FRect", "Mueve los deslizadores", `
<canvas id="rect-cv"></canvas>
<div class="controls">
  <label>x <input type="range" id="rx" min="0" max="560" value="120"></label>
  <label>y <input type="range" id="ry" min="0" max="280" value="80"></label>
  <label>w <input type="range" id="rw" min="8" max="200" value="64"></label>
  <label>h <input type="range" id="rh" min="8" max="160" value="64"></label>
</div>
<div class="readout" id="rect-out"></div>`)}

<h3>Dibujar una textura (una imagen PNG)</h3>
<p>Una textura es una imagen ya subida a la GPU. Para dibujar un trozo de ella usas dos rectángulos: <strong>src</strong> (qué parte de la imagen) y <strong>dst</strong> (dónde y a qué tamaño en pantalla). Esta idea es exactamente la que usarás para dibujar tiles (lección 07) y frames de animación (lección 10).</p>
${code(String.raw`
#include <SDL3_image/SDL_image.h>

SDL_Texture* tex = IMG_LoadTexture(renderer, "Assets/Textures/player1.png");

SDL_FRect src = { 0, 0, 32, 32 };      // el primer cuadro de 32x32 de la imagen
SDL_FRect dst = { 200, 300, 64, 64 };  // en pantalla, a doble tamaño
SDL_RenderTexture(renderer, tex, &src, &dst);

// al terminar
SDL_DestroyTexture(tex);`, "cpp", "Textura con SDL3_image")}

<h2>La arquitectura del motor: Engine y módulos</h2>
<p>En el proyecto de clase no hay un <code>main</code> gigante. Hay una clase <strong>Engine</strong> (un <em>singleton</em>: solo existe una, y la obtienes con <code>Engine::GetInstance()</code>) que tiene una lista de <strong>módulos</strong>. Cada módulo se encarga de una cosa:</p>
<div class="table-wrap"><table class="t"><thead><tr><th>Módulo</th><th>Responsabilidad</th></tr></thead><tbody>
<tr><td><code>window</code></td><td>Crea la ventana SDL (tamaño, pantalla completa…)</td></tr>
<tr><td><code>input</code></td><td>Lee eventos y guarda el estado de cada tecla (KEY_DOWN, KEY_REPEAT, KEY_UP, KEY_IDLE)</td></tr>
<tr><td><code>render</code></td><td>Tiene el SDL_Renderer, la cámara y funciones como <code>DrawTexture</code></td></tr>
<tr><td><code>textures</code></td><td>Carga y libera texturas</td></tr>
<tr><td><code>audio</code></td><td>Música y efectos</td></tr>
<tr><td><code>scene</code></td><td>La lógica de tu nivel (crea jugador, carga mapa…)</td></tr>
<tr><td><code>map</code>, <code>entityManager</code>, <code>physics</code></td><td>Se añaden en las lecciones 06, 04 y 08</td></tr>
</tbody></table></div>

<p>Todos heredan de <code>Module</code>, que define el <strong>ciclo de vida</strong>:</p>
${code(String.raw`
class Module
{
public:
    virtual bool Awake()               { return true; } // 1 vez: leer configuración
    virtual bool Start()               { return true; } // 1 vez: cargar recursos (texturas...)
    virtual bool PreUpdate()           { return true; } // cada frame, antes
    virtual bool Update(float dt)      { return true; } // cada frame: lógica
    virtual bool PostUpdate()          { return true; } // cada frame, después (dibujar)
    virtual bool CleanUp()             { return true; } // 1 vez: liberar memoria

    std::string name;
    bool active = true;
};`, "cpp", "Module.h (simplificado)")}

<p>El Engine recorre la lista de módulos <strong>en orden</strong> en cada fase. Si alguna función devuelve <code>false</code>, el juego se cierra. Por eso el orden en que añades los módulos importa: el render debe ir el último para dibujar encima de todo y presentar el frame.</p>

${demo("d-life", "El ciclo de vida, paso a paso", "Pulsa “Siguiente paso”", `
<canvas id="life-cv"></canvas>
<div class="controls">
  <button type="button" class="btn primary" id="life-next">Siguiente paso</button>
  <button type="button" class="btn" id="life-auto">Reproducir</button>
  <button type="button" class="btn" id="life-reset">Reiniciar</button>
</div>
<pre class="log" id="life-log"></pre>`)}

${code(String.raw`
// Engine::Update() -> una vuelta del bucle (un FRAME)
bool Engine::Update()
{
    bool ret = true;
    PrepareUpdate();                       // empezar a medir el frame (L02)

    if (input->GetWindowEvent(WE_QUIT)) ret = false;

    if (ret) ret = PreUpdate();            // PreUpdate de todos los módulos
    if (ret) ret = DoUpdate();             // Update(dt) de todos los módulos
    if (ret) ret = PostUpdate();           // PostUpdate de todos los módulos

    FinishUpdate();                        // calcular fps, esperar (L02, L03)
    return ret;
}

bool Engine::DoUpdate()
{
    for (const auto& module : moduleList) {
        if (!module->active) continue;
        if (!module->Update(dt)) return false;
    }
    return true;
}`, "cpp", "Engine.cpp (idea general)")}

${nota(`<p>Tu juego tiene exactamente esta estructura. Cuando pulsas <kbd>ESC</kbd>, en algún módulo (normalmente Scene) hay un <code>if (input->GetKey(SDL_SCANCODE_ESCAPE) == KEY_DOWN) return false;</code>: devolver <code>false</code> hace que el Engine salga del bucle y llame a todos los <code>CleanUp()</code>.</p>`, "game")}

<h2>Acceder a otros módulos</h2>
<p>Desde cualquier sitio puedes pedir un módulo al Engine. Lo verás en casi todos los TODOs:</p>
${code(String.raw`
Engine::GetInstance().render->DrawTexture(texture, x, y);
Engine::GetInstance().textures->Load("Assets/Textures/player1.png");
if (Engine::GetInstance().input->GetKey(SDL_SCANCODE_D) == KEY_REPEAT) { /* derecha */ }`)}

${nota(`<p>Los nombres exactos (<code>DrawTexture</code>, <code>GetKey</code>, <code>KEY_REPEAT</code>…) pueden variar un poco según la versión del handout. Si algo no compila, abre el <code>.h</code> del módulo y mira cómo se llama allí. Leer los <code>.h</code> es la mejor costumbre que puedes coger.</p>`, "warn", "Sobre los nombres")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué hace SDL3 por ti?", o: ["Gestiona entidades y mapas", "Ventana, dibujo, input, audio y tiempo de forma multiplataforma", "Simula físicas"], c: 1, e: "SDL es una capa fina sobre el sistema operativo. Mapas, entidades y físicas los construyes tú (o usas pugixml/Box2D)." },
      { p: "En SDL, si un personaje salta, su coordenada Y…", o: ["aumenta", "disminuye", "no cambia"], c: 1, e: "La Y crece hacia abajo, así que subir significa restar." },
      { p: "¿En qué método de un módulo cargarías una textura?", o: ["Awake()", "Start()", "PostUpdate()"], c: 1, e: "En Awake se lee configuración; el módulo de texturas aún no está listo hasta Start. Es justo lo que avisa el TODO 2 de la L04." },
      { p: "¿Qué pasa si Update() de un módulo devuelve false?", o: ["Se salta ese módulo", "El juego se cierra limpiamente", "Se reinicia el nivel"], c: 1, e: "El Engine deja de iterar el bucle y llama a CleanUp() de todos los módulos." },
      { p: "Para dibujar solo un trozo de una imagen usas…", o: ["Un rectángulo src (qué parte) y uno dst (dónde)", "Dos texturas distintas", "SDL_RenderClear"], c: 0, e: "src recorta la imagen, dst la coloca en pantalla. Tiles y animaciones funcionan así." }
    ])}
`,
    init(root) {
      // ----- demo rectángulo -----
      const cv = root.querySelector("#rect-cv"), ctx = Curso.canvas(cv, 640, 360);
      const ids = ["rx", "ry", "rw", "rh"], el = {};
      ids.forEach((i) => (el[i] = root.querySelector("#" + i)));
      function draw() {
        const x = +el.rx.value, y = +el.ry.value, w = +el.rw.value, h = +el.rh.value;
        ctx.clearRect(0, 0, 640, 360);
        ctx.strokeStyle = Curso.color("line"); ctx.lineWidth = 1;
        for (let gx = 0; gx <= 640; gx += 32) { ctx.beginPath(); ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, 360); ctx.stroke(); }
        for (let gy = 0; gy <= 360; gy += 32) { ctx.beginPath(); ctx.moveTo(0, gy + .5); ctx.lineTo(640, gy + .5); ctx.stroke(); }
        ctx.fillStyle = Curso.color("ink-2"); ctx.font = "12px JetBrains Mono, monospace";
        ctx.fillText("(0,0)", 4, 14); ctx.fillText("x →", 590, 14); ctx.fillText("y ↓", 4, 350);
        ctx.setLineDash([4, 4]); ctx.strokeStyle = Curso.color("ink-3");
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(x, y); ctx.moveTo(x, 0); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = Curso.color("amber"); ctx.fillRect(x, y, w, h);
        ctx.fillStyle = Curso.color("ink"); ctx.fillText(`(${x},${y})`, x + 4, y - 6);
        root.querySelector("#rect-out").innerHTML = `<span>SDL_FRect rect = { <b>${x}</b>, <b>${y}</b>, <b>${w}</b>, <b>${h}</b> };</span><span>esquina inf. der. = (${x + w}, ${y + h})</span>`;
      }
      ids.forEach((i) => Curso.on(el[i], "input", draw)); draw();

      // ----- demo ciclo de vida -----
      const lc = root.querySelector("#life-cv"), lx = Curso.canvas(lc, 640, 230);
      const mods = ["window", "input", "textures", "audio", "scene", "render"];
      const fases = ["Awake", "Start", "PreUpdate", "Update", "PostUpdate"];
      const log = root.querySelector("#life-log");
      let st;
      const reset = () => { st = { fase: 0, mod: -1, frame: 0, lines: [] }; log.textContent = "Engine::Awake() → recorre los módulos en orden…"; drawL(); };
      function step() {
        st.mod++;
        if (st.mod >= mods.length) {
          st.mod = 0; st.fase++;
          if (st.fase > 4) { st.fase = 2; st.frame++; st.lines.push(`— fin del frame ${st.frame}: FinishUpdate() calcula fps y espera —`); }
        }
        const f = fases[st.fase];
        st.lines.push(`${st.fase >= 2 ? "[frame " + (st.frame + 1) + "] " : ""}${mods[st.mod]}->${f}${f === "Update" ? "(dt)" : "()"}`);
        if (st.lines.length > 60) st.lines.shift();
        log.textContent = st.lines.join("\n"); log.scrollTop = log.scrollHeight;
        drawL();
      }
      function drawL() {
        const W = 640, cw = W / mods.length;
        lx.clearRect(0, 0, W, 230);
        lx.font = "12px JetBrains Mono, monospace"; lx.textAlign = "center";
        fases.forEach((f, i) => {
          const y = 40 + i * 36;
          lx.fillStyle = Curso.color("ink-3"); lx.textAlign = "left"; lx.fillText(f + (i >= 2 ? " ↻" : ""), 6, y + 4); lx.textAlign = "center";
          mods.forEach((m, j) => {
            const x = 110 + j * (W - 120) / mods.length;
            const cur = st.fase === i && st.mod === j;
            const done = st.fase > i || (st.fase === i && st.mod > j);
            lx.fillStyle = cur ? Curso.color("accent") : done ? Curso.color("accent-soft") : Curso.color("surface");
            lx.strokeStyle = Curso.color("line");
            lx.fillRect(x, y - 13, (W - 140) / mods.length, 24); lx.strokeRect(x + .5, y - 12.5, (W - 140) / mods.length, 24);
            lx.fillStyle = cur ? Curso.color("accent-ink") : Curso.color("ink");
            lx.fillText(m, x + (W - 140) / mods.length / 2, y + 4);
          });
        });
        lx.textAlign = "left"; lx.fillStyle = Curso.color("ink-2");
        lx.fillText(`Frame: ${st.frame}   (Awake y Start solo 1 vez; las fases ↻ se repiten cada frame)`, 6, 222);
      }
      let auto = null;
      Curso.on(root.querySelector("#life-next"), "click", step);
      Curso.on(root.querySelector("#life-reset"), "click", reset);
      const ab = root.querySelector("#life-auto");
      Curso.on(ab, "click", () => { if (auto) { clearInterval(auto); auto = null; ab.textContent = "Reproducir"; } else { auto = setInterval(step, 350); ab.textContent = "Pausa"; } });
      Curso.alSalir(() => auto && clearInterval(auto));
      reset();
    }
  });
})();
