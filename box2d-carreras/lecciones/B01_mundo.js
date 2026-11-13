(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "b01", num: "01", grupo: "Bloque 1 · Las piezas de Box2D", corto: "Mundo y cuerpos",
    titulo: "El mundo, los cuerpos y las fixtures",
    resumen: "Qué hace un motor de físicas, las cuatro piezas de Box2D, metros vs píxeles y el paso de simulación.",
    intro: "Antes de formas, joints o coches necesitas entender cómo piensa Box2D: un mundo que avanza a pasos fijos, cuerpos invisibles que tienen posición y velocidad, y formas con material pegadas a esos cuerpos. Todo lo demás del curso se construye sobre esto.",
    objetivos: ["Explicar qué hace Box2D en cada paso", "Distinguir World, Body, Shape y Fixture", "Usar el patrón “def + Create”", "Convertir metros ↔ píxeles sin errores"],
    html: () => `
<h2>¿Qué hace un motor de físicas?</h2>
<p>En cada paso de simulación, Box2D hace tres cosas por cada cuerpo:</p>
<ol>
<li><strong>Integra</strong>: aplica las fuerzas (gravedad, empujes) a la velocidad, y la velocidad a la posición.</li>
<li><strong>Detecta colisiones</strong>: qué formas se tocan o se solapan.</li>
<li><strong>Resuelve los contactos</strong>: empuja los cuerpos para que no se atraviesen, aplica fricción y rebote.</li>
</ol>
<p>Tú no mueves los objetos “a mano” cambiando su x e y (como en la L04 del curso de SDL). Les das <strong>fuerzas, impulsos o velocidades</strong>, y Box2D calcula dónde acaban. Luego tú lees esa posición y dibujas la textura ahí.</p>

${nota(`<p>La regla de oro de todo el curso: <strong>Box2D manda sobre la posición; tu código solo la lee para dibujar.</strong> Si cambias la posición a la fuerza cada frame (con <code>SetTransform</code>), rompes la simulación: los choques y la fricción dejan de funcionar.</p>`)}

<h2>Las cuatro piezas</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Pieza</th><th>Qué es</th><th>Analogía</th></tr></thead><tbody>
<tr><td><code>b2World</code></td><td>Contiene todo: gravedad, cuerpos, joints. Avanza con <code>Step()</code>.</td><td>El universo</td></tr>
<tr><td><code>b2Body</code></td><td>Un objeto con posición, ángulo, velocidad y masa. <strong>No tiene forma</strong>.</td><td>El esqueleto invisible</td></tr>
<tr><td><code>b2Shape</code></td><td>Una forma geométrica: círculo, polígono, edge, cadena. Solo geometría.</td><td>Un molde</td></tr>
<tr><td><code>b2Fixture</code></td><td>Pega una shape a un body y le da <strong>material</strong>: densidad, fricción, restitución, si es sensor, filtros.</td><td>La carne pegada al esqueleto</td></tr>
</tbody></table></div>
<p>Un body puede tener <strong>varias</strong> fixtures (un coche con chasis y alerón, por ejemplo). La masa del body se calcula sumando las de sus fixtures: <code>masa = densidad × área</code>.</p>

<h3>Tres tipos de cuerpo</h3>
<div class="table-wrap"><table class="t"><thead><tr><th>Tipo</th><th>Se mueve</th><th>Le afectan fuerzas y choques</th><th>En tu juego de carreras</th></tr></thead><tbody>
<tr><td><code>b2_staticBody</code></td><td>No</td><td>No (masa infinita)</td><td>Muros del circuito, checkpoints</td></tr>
<tr><td><code>b2_kinematicBody</code></td><td>Sí, con la velocidad que tú le pones</td><td>No: empuja pero no le empujan</td><td>Una barrera móvil, un puente que gira</td></tr>
<tr><td><code>b2_dynamicBody</code></td><td>Sí</td><td>Sí</td><td>Los coches, conos, cajas</td></tr>
</tbody></table></div>

<h2>El patrón “definición + fábrica”</h2>
<p>En Box2D nunca haces <code>new b2Body</code>. Rellenas una <strong>definición</strong> (un struct normal, en la pila) y se la pasas al mundo, que crea el objeto y es su dueño. Lo mismo para fixtures y joints:</p>
${code(String.raw`
b2BodyDef body;                                       // 1. definición del cuerpo
body.type = b2_dynamicBody;
body.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));
b2Body* b = world->CreateBody(&body);                 // 2. el mundo lo crea

b2CircleShape shape;                                  // 3. la forma (geometría)
shape.m_radius = PIXEL_TO_METERS(radius);

b2FixtureDef fixture;                                 // 4. definición de la fixture
fixture.shape = &shape;                               //    qué forma
fixture.density = 1.0f;                               //    con qué material
b->CreateFixture(&fixture);                           // 5. el body la crea y la guarda`, "cpp", "ModulePhysics::CreateCircle (núcleo)")}
<p>La definición se puede tirar después: Box2D <em>copia</em> lo que necesita. Por eso el handout puede hacer <code>delete[] vertices</code> justo después de <code>CreateLoop</code>.</p>

<h3>Material de la fixture</h3>
<ul>
<li><code>density</code> (kg/m²): con el área da la masa. Densidad 0 en un cuerpo dinámico = masa 0 → Box2D le pone 1 kg y se comporta raro. Pon siempre densidad &gt; 0.</li>
<li><code>friction</code> (0–1 normalmente): rozamiento entre <em>dos fixtures que se tocan</em>. Ojo: en vista cenital el suelo no es una fixture, así que esto no frena tu coche contra el asfalto (lección 05).</li>
<li><code>restitution</code> (0–1): rebote. 0 = no rebota, 1 = rebote perfecto.</li>
<li><code>isSensor</code>: detecta pero no choca (lección 03).</li>
</ul>

<h2>Metros, no píxeles</h2>
<p>Box2D está afinado para objetos de entre 0,1 y 10 metros. Si le pasas píxeles, un coche de 100 px sería un coche de 100 metros: cae a cámara lenta y todo se siente “flotante”. Por eso tu handout define:</p>
${code(String.raw`
#define PIXELS_PER_METER 50.0f   // 50 px en pantalla = 1 metro en Box2D
#define METER_PER_PIXEL 0.02f    // 1 / 50

#define METERS_TO_PIXELS(m) ((int) floor(PIXELS_PER_METER * (m)))
#define PIXEL_TO_METERS(p)  ((float) METER_PER_PIXEL * (p))`, "cpp", "ModulePhysics.h")}
<p>Regla: <strong>todo lo que entra a Box2D se convierte a metros</strong> (posiciones, radios, medidas) y <strong>todo lo que sale se convierte a píxeles</strong> para dibujar. Las <em>velocidades</em> van en m/s y las <em>fuerzas</em> en newtons: esas no se convierten, pero piensa en metros al elegir valores.</p>

${demo("d-conv", "Conversor metros ↔ píxeles", "Con PIXELS_PER_METER = 50", `
<div class="controls">
  <label>píxeles <input type="number" id="cv-px" value="100" style="width:90px"></label>
  <label>metros <input type="number" id="cv-m" value="2" step="0.1" style="width:90px"></label>
</div>
<div class="readout" id="cv-out"></div>`)}

<h3>¿Por qué <code>-GRAVITY_Y</code>?</h3>
<p>En Raylib la Y crece hacia <strong>abajo</strong>. El handout convierte metros ↔ píxeles <strong>sin invertir la Y</strong>, así que en Box2D también “abajo” es +Y. Para que las cosas caigan hacia abajo en pantalla, la gravedad del mundo debe ser <strong>positiva</strong> en Y. En handouts anteriores <code>GRAVITY_Y</code> valía -10 y el mundo recibía <code>-GRAVITY_Y</code> = +10. En el juego de carreras (vista cenital) la gravedad es <strong>0</strong>: no hay “abajo”.</p>

<h2>El paso de simulación</h2>
${code(String.raw`
#define PHYSICS_DT (1.0f / 60.0f)

update_status ModulePhysics::PreUpdate()
{
    world->Step(PHYSICS_DT, 8, 3);    // tiempo, iteraciones de velocidad, iteraciones de posición
    return UPDATE_CONTINUE;
}`, "cpp", "ModulePhysics.cpp")}
<ul>
<li><strong>Tiempo fijo</strong>: siempre 1/60 s. Con un dt variable, la simulación daría resultados distintos según los fps (la misma idea de la L03 del curso de SDL).</li>
<li><strong>8 y 3</strong>: cuántas veces el solver refina velocidades y posiciones por paso. Más = más preciso y más lento. 8/3 es lo recomendado por Box2D.</li>
<li><strong>En PreUpdate</strong>: así, cuando ModuleGame hace su Update, las posiciones ya están calculadas para este frame. Por eso en <code>Application</code> el módulo de física va antes que la escena.</li>
</ul>
${nota(`<p>Con <code>VSYNC true</code> y un monitor de 60 Hz, un Step por frame es exacto. En un monitor de 144 Hz la física iría 2,4 veces más rápida. Para el proyecto (“sin bullet-time descontrolado”), lo robusto es acumular el tiempo real y hacer tantos Step fijos como quepan: es lo que hace esta web en todas sus demos.</p>`, "warn", "Si tu monitor no va a 60 Hz")}

${demo("d-sandbox", "Caja de arena con Box2D real", "Clic en vacío: crear · arrastra un cuerpo: mouse joint", `
<canvas id="sb-cv"></canvas>
<div class="controls">
  <label>Crear <select id="sb-forma"><option value="c">círculo</option><option value="b">caja</option></select></label>
  <label>Tipo <select id="sb-tipo"><option value="dynamic">dynamic</option><option value="kinematic">kinematic</option><option value="static">static</option></select></label>
  <label>Gravedad Y <input type="range" id="sb-g" min="-10" max="20" step="1" value="10"> <span id="sb-gv"></span></label>
</div>
<div class="controls">
  <label>density <input type="range" id="sb-d" min="0.1" max="5" step="0.1" value="1"></label>
  <label>friction <input type="range" id="sb-f" min="0" max="1" step="0.05" value="0.3"></label>
  <label>restitution <input type="range" id="sb-r" min="0" max="1" step="0.05" value="0.2"></label>
  <button type="button" class="btn" id="sb-clear">Destruir todo</button>
</div>
<div class="readout" id="sb-out"></div>`)}
<p>Prueba: pon gravedad 0 (vista cenital) y lanza cuerpos con el ratón; nunca se paran porque no hay nada que los frene. Crea un <em>kinematic</em>: no cae, y si lo empujas no se inmuta. Sube la restitución a 1: rebote eterno.</p>

<h2>Cómo encaja en tu motor</h2>
<p>El motor del handout es un <code>Application</code> con módulos (igual que el Engine del curso de SDL, pero con Raylib): <code>Init</code> → <code>Start</code> → cada frame <code>PreUpdate</code> / <code>Update</code> / <code>PostUpdate</code> → <code>CleanUp</code>. Cada fase devuelve <code>update_status</code>: <code>UPDATE_CONTINUE</code>, <code>UPDATE_STOP</code> o <code>UPDATE_ERROR</code>.</p>
${code(String.raw`
// Application.cpp: el orden importa
AddModule(window);
AddModule(physics);      // PreUpdate: Step()   -> PostUpdate: debug draw (F1)
AddModule(audio);
AddModule(scene_intro);  // ModuleGame: lógica y dibujo de las entidades
AddModule(renderer);     // el último: termina el frame`, "cpp", "Application.cpp")}
${code(String.raw`
bool ModulePhysics::Start()
{
    world = new b2World(b2Vec2(GRAVITY_X, -GRAVITY_Y));  // ¡asigna el miembro, no declares otro!
    world->SetContactListener(this);                      // lección 03
    b2BodyDef bd;
    ground = world->CreateBody(&bd);                      // cuerpo vacío para joints (lección 04)
    return true;
}

bool ModulePhysics::CleanUp()
{
    delete world;            // libera TODOS los cuerpos, fixtures y joints
    world = NULL;
    return true;
}`, "cpp", "ModulePhysics.cpp")}
${nota(`<p>El comentario del handout avisa de un bug clásico: escribir <code>b2World* world = new b2World(...)</code> dentro de Start crea una variable <em>local</em> que tapa al miembro. El miembro <code>world</code> sigue siendo NULL y el primer <code>CreateBody</code> revienta.</p>`, "warn")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué pieza de Box2D tiene la densidad y la fricción?", o: ["b2Body", "b2Shape", "b2Fixture"], c: 2, e: "La fixture une forma + material al cuerpo." },
      { p: "Un coche de 100×50 px con PIXELS_PER_METER = 50 mide en Box2D…", o: ["100×50 m", "2×1 m", "0,5×0,25 m"], c: 1, e: "100/50 = 2, 50/50 = 1." },
      { p: "¿Qué tipo de cuerpo usarías para los muros del circuito?", o: ["dynamic", "kinematic", "static"], c: 2, e: "No se mueven nunca." },
      { p: "¿Por qué Step usa un tiempo fijo (1/60)?", o: ["Porque es más rápido", "Para que la simulación dé el mismo resultado en cualquier PC", "Porque Raylib lo exige"], c: 1, e: "Con dt variable, la física cambia con los fps." },
      { p: "Un cuerpo dinámico con densidad 0…", o: ["no tiene masa y flota", "Box2D le asigna 1 kg y se comporta de forma rara", "no se puede crear"], c: 1, e: "Pon siempre densidad mayor que 0 en los dinámicos." }
    ])}
`,
    init(root) {
      // conversor
      const px = root.querySelector("#cv-px"), m = root.querySelector("#cv-m"), out = root.querySelector("#cv-out");
      const pinta = () => out.innerHTML = `<span>PIXEL_TO_METERS(${px.value}) = <b>${(0.02 * px.value).toFixed(3)} m</b></span><span>METERS_TO_PIXELS(${m.value}) = <b>${Math.floor(50 * m.value)} px</b></span>`;
      Curso.on(px, "input", pinta); Curso.on(m, "input", pinta); pinta();

      // sandbox
      const cv = root.querySelector("#sb-cv");
      const sel = (id) => root.querySelector(id);
      let sim;
      sim = B2.mundo(cv, {
        w: 720, h: 400, ppm: 50, gravedad: [0, 10],
        alClicar(p, cuerpo) {
          if (cuerpo) return;
          const o = { tipo: sel("#sb-tipo").value, densidad: +sel("#sb-d").value, friccion: +sel("#sb-f").value, rebote: +sel("#sb-r").value };
          const b = sel("#sb-forma").value === "c" ? sim.circulo(p.x, p.y, 15 + Math.random() * 20, o) : sim.caja(p.x, p.y, 20 + Math.random() * 30, 12 + Math.random() * 18, o);
          if (o.tipo === "kinematic") b.setLinearVelocity(B2.Vec2(1, 0));
          ultimo = b;
        }
      });
      let ultimo = null;
      // suelo y paredes: una cadena cerrada
      sim.cadena(0, 0, [6, 6, 714, 6, 714, 394, 6, 394], { datos: { fijo: true } });
      for (let i = 0; i < 6; i++) ultimo = sim.circulo(120 + i * 90, 60 + (i % 2) * 40, 18, { rebote: .2 });
      sim.caja(360, 300, 90, 10, { tipo: "static", datos: { fijo: true }, angulo: -0.2 });
      const g = sel("#sb-g");
      Curso.on(g, "input", () => { sim.world.setGravity(B2.Vec2(0, +g.value)); sim.dinamicos().forEach((b) => b.setAwake(true)); });
      Curso.on(sel("#sb-clear"), "click", () => { sim.limpiar(); ultimo = null; });
      sim.onDibujo((ctx) => {
        sel("#sb-gv").textContent = g.value + " m/s²";
        const b = sim.mouseJoint ? sim.mouseJoint.getBodyB() : (ultimo && ultimo.getWorld ? ultimo : null);
        if (b && sim.cuerpos().includes(b)) {
          const p = b.getPosition(), v = b.getLinearVelocity();
          out2.innerHTML = `<span>${sim.mouseJoint ? "arrastrando" : "último creado"} · tipo <b>${b.getType()}</b></span><span>pos <b>(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) m</b> = (${Math.floor(p.x * 50)}, ${Math.floor(p.y * 50)}) px</span><span>vel <b>(${v.x.toFixed(1)}, ${v.y.toFixed(1)}) m/s</b></span><span>masa <b>${b.getMass().toFixed(2)} kg</b></span><span>ángulo <b>${(b.getAngle() * 57.3 % 360).toFixed(0)}°</b></span>`;
        }
        sim.texto(`cuerpos: ${sim.cuerpos().length}`, 14, 26);
      });
      const out2 = sel("#sb-out");
    }
  });
})();
