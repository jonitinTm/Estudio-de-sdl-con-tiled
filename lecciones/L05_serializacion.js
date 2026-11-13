(function () {
  const { code, nota, todo, quiz, demo, esc } = Curso;

  const CONFIG = `<!-- Config file for the engine -->
<config>
  <engine>
    <title value="Platformer Game"/>
    <targetFrameRate value="60"/>
  </engine>
  <render>
    <vsync value="false"/>
  </render>
  <window>
    <resolution width="1280" height="720" scale="1"/>
    <fullscreen value="false"/>
    <borderless value="false"/>
    <resizable value="false"/>
    <fullscreen_window value="false"/>
  </window>
  <entitymanager>
    <player>
      <texture path="Assets/sprites/knight.png"/>
      <animations tsx="Assets/sprites/caballero.tsx"/>
      <movement speed="4.0" jump="5"/>
      <frame width="40" height="43"/>
    </player>
  </entitymanager>
</config>`;

  Curso.leccion({
    id: "l05", num: "05", grupo: "Bloque 2 · Datos y entidades", corto: "Serialización", pdf: "L05_Serialization",
    titulo: "Serialización: config.xml con pugixml",
    resumen: "Guardar y cargar datos en XML; leer config.xml y pasar a cada módulo su nodo.",
    intro: "Recompilar para cambiar el título de la ventana o la velocidad del jugador es absurdo. Serializar es sacar esos datos a un archivo que el juego lee al arrancar. Usaremos XML porque los mapas de Tiled también son XML: una sola librería para todo.",
    objetivos: ["Definir serialización y deserialización", "Escribir XML válido (raíz única, etiquetas cerradas, atributos)", "Navegar un documento con pugixml: child, attribute, as_int…", "Repartir el config a cada módulo con LoadParameters"],
    html: () => `
<h2>¿Qué es serializar?</h2>
<p><strong>Serializar</strong> es convertir un objeto en memoria a un formato que se puede guardar o enviar (un archivo, la red). <strong>Deserializar</strong> es el camino inverso: leer el archivo y reconstruir el objeto.</p>
<p>En videojuegos se usa para: partidas guardadas, configuración, niveles, parámetros de entidades, animaciones, sincronizar por red y depurar (volcar el estado a un archivo legible).</p>

<div class="table-wrap"><table class="t"><thead><tr><th>Formato</th><th>Ventajas</th><th>Se usa para</th></tr></thead><tbody>
<tr><td>Binario propio</td><td>Compacto, rápido, opaco</td><td>Juegos comerciales, formatos de motor</td></tr>
<tr><td>JSON</td><td>Ligero y legible</td><td>Configuración, partidas guardadas, web</td></tr>
<tr><td>XML</td><td>Jerárquico, con atributos, muy soportado</td><td>Datos complejos, <strong>Tiled (TMX/TSX)</strong></td></tr>
<tr><td>YAML</td><td>Muy amigable para humanos</td><td>Unity guarda escenas en YAML</td></tr>
</tbody></table></div>

<h2>Reglas del XML</h2>
${code(`<Player>                          <!-- elemento (nodo) raíz de este bloque -->
    <Position x="120" y="300"/>   <!-- elemento vacío con 2 atributos -->
    <Animation>Idle</Animation>   <!-- elemento con texto dentro -->
</Player>`, "xml")}
<ul>
<li>Un único elemento raíz.</li>
<li>Toda etiqueta que se abre se cierra (<code>&lt;a&gt;…&lt;/a&gt;</code> o <code>&lt;a/&gt;</code>).</li>
<li>Distingue mayúsculas: <code>&lt;Window&gt;</code> ≠ <code>&lt;window&gt;</code>.</li>
<li>Los valores de atributos van entre comillas y siempre son texto: tú decides si los conviertes a int, float o bool.</li>
</ul>

<h2>pugixml en cuatro funciones</h2>
<p>pugixml usa un modelo <strong>DOM</strong>: carga el archivo entero en memoria como un árbol de nodos. Es fácil de usar (frente a SAX/Expat, más rápido pero más incómodo).</p>
${code(String.raw`
pugi::xml_document doc;
pugi::xml_parse_result result = doc.load_file("config.xml");
if (!result) LOG("Error: %s", result.description());

pugi::xml_node window = doc.child("config").child("window");     // bajar al hijo
int  w  = window.child("resolution").attribute("width").as_int(); // leer atributo
bool fs = window.child("fullscreen").attribute("value").as_bool();
const char* t = doc.child("config").child("engine").child("title").attribute("value").as_string();

// Recorrer todos los hermanos con el mismo nombre
for (pugi::xml_node n = doc.child("config").child("engine"); n; n = n.next_sibling()) { ... }`, "cpp", "Lo esencial de pugixml")}
${nota(`<p>Si pides un hijo que no existe, pugixml <strong>no peta</strong>: devuelve un nodo vacío, y <code>as_int()</code> sobre un atributo vacío devuelve 0. Ventaja: no crashea. Inconveniente: un error de escritura en el XML (<code>widht</code>) te da un 0 silencioso. Por eso los TODOs insisten en hacer LOG de todo lo que lees.</p>`, "warn")}

${demo("d-xml", "Laboratorio de pugixml", "Edita el XML o la consulta", `
<div class="split">
  <textarea class="xml" id="xml-src" spellcheck="false" aria-label="config.xml">${esc(CONFIG)}</textarea>
  <div style="display:grid;gap:10px;align-content:start">
    <label for="xml-q" style="font-size:.85rem;color:var(--ink-2)">Consulta (empieza en <code>doc</code>):</label>
    <input class="query" id="xml-q" value='doc.child("config").child("window").child("resolution").attribute("width").as_int()'>
    <div class="controls" id="xml-presets"></div>
    <div class="readout"><span>Resultado: <b id="xml-res"></b></span></div>
    <canvas id="win-cv"></canvas>
  </div>
</div>`)}
<p>El rectángulo de la derecha es una “ventana” que se configura leyendo el XML en vivo: cambia <code>width</code>, <code>height</code>, <code>title</code> o <code>fullscreen</code> y mira el efecto. Si rompes el XML (borra un <code>/&gt;</code>), verás el error como lo vería <code>result.description()</code>.</p>

<h2>Los TODOs del handout</h2>
${todo("TODO 0", "Terminal de Visual Studio", `<p>Añade la dependencia con vcpkg y compila para que se descargue:</p>${code("vcpkg add port pugixml", "txt", "Terminal")}`, "")}

${todo("TODO 1", "config.xml", `<p>Crea la estructura: raíz <code>config</code> con <code>engine</code> (title, targetFrameRate), <code>render</code> (vsync) y <code>window</code> (resolution, fullscreen, borderless, resizable, fullscreen_window). El nombre de cada nodo debe coincidir con el <code>name</code> que cada módulo se pone en su constructor/Awake.</p>`,
      code(CONFIG.split("<entitymanager>")[0].trimEnd() + "\n</config>", "xml", "config.xml"))}

${todo("TODO 2", "Engine.h / Engine.cpp", `<p>Declara un <code>pugi::xml_document configFile</code> e implementa <code>LoadConfig()</code>. Llámalo al principio de <code>Engine::Awake()</code>.</p>`,
      code(String.raw`
// Engine.h
#include "pugixml.hpp"
...
pugi::xml_document configFile;
bool LoadConfig();

// Engine.cpp
bool Engine::LoadConfig()
{
    pugi::xml_parse_result result = configFile.load_file("config.xml");
    if (result) {
        LOG("config.xml parsed without errors");
        return true;
    }
    LOG("Error loading config.xml: %s", result.description());
    return false;
}`, "cpp", "Engine"))}

${todo("TODO 3", "Engine.cpp → Awake()", `<p>Lee el título y el targetFrameRate del XML.</p>`,
      code(String.raw`
bool Engine::Awake()
{
    if (!LoadConfig()) return false;

    pugi::xml_node engineNode = configFile.child("config").child("engine");
    gameTitle       = engineNode.child("title").attribute("value").as_string();
    targetFrameRate = engineNode.child("targetFrameRate").attribute("value").as_int();
    ...
}`, "cpp", "Engine.cpp"))}

${todo("TODO 4a", "Module.h", `<p>Añade a la clase base un nodo con los parámetros del módulo y una función para recibirlo. Al estar en Module, todos los módulos lo heredan.</p>`,
      code(String.raw`
// Module.h
#include "pugixml.hpp"

class Module {
public:
    virtual bool LoadParameters(pugi::xml_node parameters)
    {
        configParameters = parameters;
        return true;
    }
    ...
    pugi::xml_node configParameters;
};`, "cpp", "Module.h"))}

${todo("TODO 4b", "Engine.cpp → Awake()", `<p>Al recorrer los módulos, pasa a cada uno <em>solo su nodo</em>. Es una línea.</p>`,
      code(String.raw`
for (const auto& module : moduleList) {
    module->LoadParameters(configFile.child("config").child(module->name.c_str()));
    result = module->Awake();
    if (!result) break;
}`, "cpp", "Engine.cpp"))}

${todo("TODO 5 y 6", "Render.cpp / Window.cpp", `<p>Lee vsync en Render y la configuración completa en Window usando <code>configParameters</code>.</p>`,
      code(String.raw`
// Render.cpp -> Awake()
if (configParameters.child("vsync").attribute("value").as_bool()) {
    SDL_SetRenderVSync(renderer, 1);
    LOG("Using vsync");
}

// Window.cpp -> Awake()
bool fullscreen        = configParameters.child("fullscreen").attribute("value").as_bool();
bool borderless        = configParameters.child("borderless").attribute("value").as_bool();
bool resizable         = configParameters.child("resizable").attribute("value").as_bool();
bool fullscreen_window = configParameters.child("fullscreen_window").attribute("value").as_bool();

width  = configParameters.child("resolution").attribute("width").as_int();
height = configParameters.child("resolution").attribute("height").as_int();
scale  = configParameters.child("resolution").attribute("scale").as_int();

Uint32 flags = 0;
if (fullscreen)        flags |= SDL_WINDOW_FULLSCREEN;
if (borderless)        flags |= SDL_WINDOW_BORDERLESS;
if (resizable)         flags |= SDL_WINDOW_RESIZABLE;
window = SDL_CreateWindow(Engine::GetInstance().GetTitle(), width, height, flags);`, "cpp", "Render + Window"))}

<h3>Extra: parámetros de entidades</h3>
<p>El paso natural (que harás en la L10) es mover al config la ruta de la textura del jugador, su posición inicial y su velocidad. Así puedes ajustar el “feeling” del salto sin recompilar.</p>

${nota(`<p>Tu <code>config.xml</code> ya hace esto: <code>&lt;entitymanager&gt;&lt;player&gt;</code> con <code>texture</code>, <code>animations tsx</code>, <code>movement speed jump</code>, <code>frame width height</code> y los sonidos. Prueba en la demo: <code>doc.child("config").child("entitymanager").child("player").child("movement").attribute("jump").as_float()</code>.</p>`, "game")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué devuelve attribute(\"widht\").as_int() si el atributo está mal escrito en el código?", o: ["Lanza una excepción", "0", "Crashea"], c: 1, e: "Nodo/atributo vacío → valor por defecto 0. Por eso hay que hacer LOG." },
      { p: "¿Por qué elegimos XML y no JSON en este curso?", o: ["Es más rápido", "Tiled guarda TMX/TSX en XML: un solo parser para config y mapas", "JSON no soporta números"], c: 1, e: "Una dependencia (pugixml) para todo." },
      { p: "En LoadParameters, ¿qué nodo recibe el módulo window?", o: ["El documento entero", "config/window", "config"], c: 1, e: "Cada módulo solo recibe su rama, buscada con su name." },
      { p: "¿Qué es deserializar?", o: ["Comprimir un archivo", "Reconstruir objetos a partir de datos guardados", "Borrar datos"], c: 1, e: "Leer el XML y asignar sus valores a variables del programa." }
    ])}
`,
    init(root) {
      const src = root.querySelector("#xml-src"), q = root.querySelector("#xml-q"), res = root.querySelector("#xml-res");
      const cv = root.querySelector("#win-cv"), ctx = Curso.canvas(cv, 360, 220);
      const presets = [
        ['título', 'doc.child("config").child("engine").child("title").attribute("value").as_string()'],
        ['fps', 'doc.child("config").child("engine").child("targetFrameRate").attribute("value").as_int()'],
        ['vsync', 'doc.child("config").child("render").child("vsync").attribute("value").as_bool()'],
        ['salto', 'doc.child("config").child("entitymanager").child("player").child("movement").attribute("jump").as_float()'],
        ['error típico', 'doc.child("config").child("Window").child("resolution").attribute("width").as_int()']
      ];
      const pre = root.querySelector("#xml-presets");
      pre.innerHTML = presets.map((p, i) => `<button type="button" class="btn" data-p="${i}">${p[0]}</button>`).join("");
      pre.querySelectorAll("button").forEach((b) => Curso.on(b, "click", () => { q.value = presets[+b.dataset.p][1]; run(); }));

      // Mini-pugi sobre DOMParser
      class Node {
        constructor(el) { this.el = el; }
        child(n) { if (!this.el) return new Node(null); for (const c of this.el.children) if (c.tagName === n) return new Node(c); return new Node(null); }
        first_child() { return new Node(this.el && this.el.firstElementChild); }
        next_sibling(n) { let s = this.el && this.el.nextElementSibling; while (s && n && s.tagName !== n) s = s.nextElementSibling; return new Node(s || null); }
        attribute(n) { return new Attr(this.el && this.el.hasAttribute(n) ? this.el.getAttribute(n) : null); }
        name() { return this.el ? this.el.tagName : ""; }
        child_value() { return this.el ? this.el.textContent.trim() : ""; }
        empty() { return !this.el; }
      }
      class Attr {
        constructor(v) { this.v = v; }
        as_int() { const n = parseInt(this.v, 10); return isNaN(n) ? 0 : n; }
        as_float() { const n = parseFloat(this.v); return isNaN(n) ? 0 : n; }
        as_bool() { return this.v != null && /^(1|true|t|y|yes)/i.test(this.v.trim()); }
        as_string() { return this.v == null ? "" : this.v; }
        value() { return this.as_string(); }
        empty() { return this.v == null; }
      }
      function parse() {
        const d = new DOMParser().parseFromString(src.value, "application/xml");
        const err = d.querySelector("parsererror");
        if (err) return { error: err.textContent.split("\n")[0].slice(0, 140) };
        const doc = new Node(d); doc.child = (n) => new Node(d.documentElement && d.documentElement.tagName === n ? d.documentElement : null);
        return { doc };
      }
      function evalQuery(doc, expr) {
        expr = expr.trim();
        if (!expr.startsWith("doc")) throw new Error("La consulta debe empezar por doc");
        let cur = doc, rest = expr.slice(3);
        const re = /^\.(\w+)\((?:"([^"]*)")?\)/;
        while (rest.length) {
          const m = rest.match(re);
          if (!m) throw new Error("No entiendo: " + rest.slice(0, 30));
          if (typeof cur[m[1]] !== "function") throw new Error(`"${m[1]}" no existe aquí`);
          cur = cur[m[1]](m[2]); rest = rest.slice(m[0].length);
        }
        if (cur instanceof Node) return cur.empty() ? "(nodo vacío)" : `<${cur.name()}> (xml_node)`;
        if (cur instanceof Attr) return cur.empty() ? "(atributo vacío)" : `"${cur.v}" (xml_attribute)`;
        return typeof cur === "string" ? `"${cur}"` : String(cur);
      }
      function run() {
        const p = parse();
        if (p.error) { res.textContent = "parse error: " + p.error; drawWin(null); return; }
        try { res.textContent = evalQuery(p.doc, q.value); } catch (e) { res.textContent = e.message; }
        drawWin(p.doc);
      }
      function drawWin(doc) {
        ctx.clearRect(0, 0, 360, 220);
        if (!doc) { ctx.fillStyle = Curso.color("bad"); ctx.font = "13px Inter, sans-serif"; ctx.fillText("config.xml no se pudo cargar", 20, 110); return; }
        const cfg = doc.child("config"), win = cfg.child("window");
        const w = win.child("resolution").attribute("width").as_int(), h = win.child("resolution").attribute("height").as_int();
        const fs = win.child("fullscreen").attribute("value").as_bool();
        const title = cfg.child("engine").child("title").attribute("value").as_string();
        const s = Math.min(340 / 1920, 180 / 1080);
        const ww = Math.min(fs ? 1920 : w, 1920) * s, hh = Math.min(fs ? 1080 : h, 1080) * s;
        ctx.fillStyle = Curso.color("ink-3"); ctx.font = "11px JetBrains Mono, monospace";
        ctx.fillText(`monitor 1920×1080  ·  ventana ${fs ? "pantalla completa" : w + "×" + h}`, 10, 212);
        ctx.strokeStyle = Curso.color("line"); ctx.strokeRect(10.5, 10.5, 1920 * s, 1080 * s);
        ctx.fillStyle = Curso.color("surface"); ctx.fillRect(10, 10, ww, hh);
        ctx.fillStyle = Curso.color("accent"); ctx.fillRect(10, 10, ww, 16);
        ctx.fillStyle = Curso.color("accent-ink"); ctx.fillText((title || "(sin título)").slice(0, 40), 14, 22);
        if (!w || !h) { ctx.fillStyle = Curso.color("bad"); ctx.fillText("width/height = 0 → ¡atributo mal escrito!", 14, 50); }
      }
      Curso.on(src, "input", run); Curso.on(q, "input", run); run();
    }
  });
})();
