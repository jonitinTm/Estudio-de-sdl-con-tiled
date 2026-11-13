(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  const uml = `
<style>
.uml2{display:grid;gap:12px;justify-items:center;margin:18px 0}
.uml2 .row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.uml2 .box{background:var(--surface);border:1.5px solid var(--ink-3);border-radius:4px;font-family:var(--font-mono);font-size:.72rem;min-width:150px;line-height:1.45}
.uml2 .box>div{padding:4px 10px;border-top:1px solid var(--line)}
.uml2 .box>div:first-child{border-top:0;font-weight:600;text-align:center;background:var(--surface-2);font-family:var(--font-body);font-size:.84rem}
.uml2 .abs>div:first-child{font-style:italic}
.uml2 .base{border-color:var(--accent)}
.uml2 .arrow{font-size:.78rem;color:var(--ink-3)}
</style>
<div class="uml2">
  <div class="box base abs"><div>PhysicEntity <span style="font-weight:400">«abstracta»</span></div><div># PhysBody* body</div><div># PhysicEntity(PhysBody*)<br>+ virtual ~PhysicEntity()<br>+ virtual void Update() = 0</div></div>
  <span class="arrow">△ hereda (is-a)</span>
  <div class="row">
    <div class="box abs"><div>Car <span style="font-weight:400">«abstracta»</span></div><div># float max_speed, engine_force<br># float grip<br># int lap, next_checkpoint</div><div># Drive(throttle, steer)<br># UpdateFriction()<br>+ Update() override</div></div>
    <div class="box"><div>Checkpoint</div><div>- int index<br>- bool is_finish</div><div>+ Update() override</div></div>
    <div class="box"><div>BoostPad</div><div>- float impulse</div><div>+ Update() override</div></div>
  </div>
  <span class="arrow">△ hereda</span>
  <div class="row">
    <div class="box"><div>PlayerCar</div><div>- bool nitro_ready</div><div>+ Update() override<br>  (lee teclado)</div></div>
    <div class="box"><div>AICar</div><div>- int target_waypoint</div><div>+ Update() override<br>  (sigue waypoints)</div></div>
  </div>
  <span class="arrow">◆ ModuleGame tiene 1 → * PhysicEntity (std::vector&lt;PhysicEntity*&gt;)</span>
</div>`;

  Curso.leccion({
    id: "b07", num: "07", grupo: "Bloque 2 · Física a medida (vista cenital)", corto: "Entidades en C++", pdf: "Lesson 10 - Entities",
    titulo: "Entidades en C++: los cuatro pilares aplicados a tu juego",
    resumen: "Clases, encapsulación, abstracción, herencia y polimorfismo; PhysicEntity como base abstracta y el UML del juego de carreras.",
    intro: "El handout ya tiene una jerarquía: PhysicEntity con Circle, Box, Ball, Chain y Rick. En el proyecto tendrás coches del jugador, coches de la IA, checkpoints, turbos… Esta lección te da las herramientas de C++ para organizarlos sin repetir código y sin fugas de memoria.",
    objetivos: ["Explicar los cuatro pilares de la POO con ejemplos de juego", "Crear una clase base abstracta con funciones virtuales puras", "Saber por qué el destructor de la base debe ser virtual", "Diseñar el UML de tu juego de carreras"],
    html: () => `
<h2>De C a C++</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>En C</th><th>En C++</th><th>Por qué</th></tr></thead><tbody>
<tr><td><code>struct</code> + funciones sueltas</td><td><code>class</code> con datos y métodos</td><td>Los métodos “conocen” los datos de su objeto</td></tr>
<tr><td><code>malloc</code> / <code>free</code></td><td><code>new</code> / <code>delete</code></td><td>Llaman al constructor y al destructor</td></tr>
<tr><td>Arrays a mano</td><td>STL: <code>std::vector</code>, <code>std::find</code>…</td><td>Crecen solos y vienen probados</td></tr>
</tbody></table></div>

<h2>Una clase es un plano</h2>
<p>Una clase define <strong>propiedades</strong> (variables) y <strong>métodos</strong> (funciones). Cada objeto que creas con ese plano tiene <em>sus propios</em> valores: dos coches, dos <code>speed</code> distintas. Los métodos usan las propiedades del objeto sobre el que se llaman.</p>

<h2>Los cuatro pilares, con coches</h2>
<h3>1. Encapsulación</h3>
<p>Lo de dentro es privado; desde fuera solo se usa lo necesario. “Cuantas menos formas de liarla, mejor.”</p>
${code(String.raw`
class Car
{
public:
    float GetSpeed() const { return speed; }          // getter: leer sí
    void AddBoost(float amount);                      // cambiar, pero con reglas

private:
    float speed = 0.0f;                               // nadie puede poner speed = 9999 desde fuera
    float max_speed = 20.0f;
};`, "cpp")}
<p>Prefiere <code>private</code>; usa <code>protected</code> para lo que las clases hijas necesitan; <code>public</code> solo para la interfaz.</p>

<h3>2. Abstracción</h3>
<p>Algunas clases base no tienen sentido solas. Mario no lucha contra “un Enemy”, lucha contra Goombas y Koopas. En C++ una clase es <strong>abstracta</strong> si tiene al menos una función <strong>virtual pura</strong> (<code>= 0</code>): no se puede instanciar, solo heredar.</p>
${code(String.raw`
class PhysicEntity
{
protected:
    PhysicEntity(PhysBody* _body) : body(_body) {}      // protected: solo las hijas construyen

public:
    virtual ~PhysicEntity() = default;                  // ¡virtual!
    virtual void Update() = 0;                          // pura: cada hija DEBE implementarla

public:
    PhysBody* body;
};`, "cpp", "ModuleGame.cpp (handout)")}

<h3>3. Herencia</h3>
<p>Entidades parecidas comparten código. Todo lo que tiene cuerpo físico hereda de <code>PhysicEntity</code>; todo coche hereda de <code>Car</code>, que tiene la física de conducción (lección 08) una sola vez.</p>
${code(String.raw`
class Box : public PhysicEntity
{
public:
    Box(ModulePhysics* physics, int _x, int _y, Texture2D _texture)
        : PhysicEntity(physics->CreateRectangle(_x, _y, 50, 25))   // la base recibe su body
        , texture(_texture)
    {}

    void Update() override { /* dibujarse en la posición del body */ }

private:
    Texture2D texture;
};`, "cpp", "ModuleGame.cpp (handout)")}

<h3>4. Polimorfismo</h3>
<p><code>virtual</code> en la base + <code>override</code> en la hija: cada objeto responde a su manera, pero desde fuera se usan todos como la base.</p>
${code(String.raw`
std::vector<PhysicEntity*> entities;     // jugador, IA, checkpoints, turbos... todos juntos

for (PhysicEntity* entity : entities)
    entity->Update();                    // PlayerCar lee el teclado, AICar sigue waypoints...`, "cpp")}

${demo("d-ent", "Un vector, muchas clases", "Crea entidades y mira qué Update() se ejecuta", `
<div class="controls">
  <button type="button" class="btn" data-mk="Cone">new Cone</button>
  <button type="button" class="btn" data-mk="Barrel">new Barrel</button>
  <button type="button" class="btn" data-mk="BoostPad">new BoostPad</button>
  <button type="button" class="btn" id="en-del">DestroyAllEntities()</button>
</div>
<canvas id="en-cv"></canvas>
<pre class="log" id="en-log"></pre>`)}

<h2>El destructor virtual: la fuga silenciosa</h2>
<p>Si borras una hija a través de un puntero a la base (<code>delete entity</code> con <code>PhysicEntity* entity</code>) y el destructor de la base <strong>no</strong> es virtual, solo se ejecuta el destructor de la base. Lo que la hija liberaba en su destructor (texturas, sonidos, sub-cuerpos) se queda en memoria. Regla: <strong>si una clase tiene funciones virtuales, su destructor también debe ser virtual</strong>.</p>
${code(String.raw`
// Todo lo que creaste con new, lo borras con delete (y su body con DestroyBody)
void ModuleGame::DestroyAllEntities()
{
    for (PhysicEntity* entity : entities)
    {
        App->physics->DestroyBody(entity->body);
        delete entity;                   // llama a ~Hija() y luego a ~PhysicEntity() gracias a virtual
    }
    entities.clear();
}`, "cpp", "ModuleGame.cpp")}

<h2>UML: diseña antes de programar</h2>
<p>UML (<em>Unified Modeling Language</em>, nada que ver con modelado 3D) dibuja las clases y sus relaciones. Cada caja: nombre, atributos, métodos. Prefijos: <code>+</code> público, <code>-</code> privado, <code>#</code> protegido. Flechas:</p>
<ul>
<li><strong>△ triángulo hueco</strong>: herencia (“es un”).</li>
<li><strong>◆ rombo relleno</strong>: composición (“tiene un” y es su dueño: si muere el dueño, mueren ellos).</li>
<li><strong>◇ rombo hueco</strong>: agregación (“usa”, pero no es su dueño).</li>
<li><strong>Números</strong> en los extremos: multiplicidad. <code>1 → *</code> = uno tiene muchos.</li>
</ul>
<p>Una propuesta para tu Proyecto 02 (hazla en <a href="https://app.diagrams.net/" target="_blank" rel="noopener">diagrams.net</a> y ve ampliándola):</p>
${uml}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué hace que PhysicEntity sea abstracta?", o: ["El constructor protected", "virtual void Update() = 0", "Que tenga un puntero"], c: 1, e: "Una función virtual pura impide instanciarla." },
      { p: "¿Qué pasa con delete entity si ~PhysicEntity() no es virtual y entity es un PlayerCar?", o: ["Nada raro", "Solo se ejecuta el destructor de PhysicEntity: posible fuga", "No compila"], c: 1, e: "El destructor de la hija no se llama." },
      { p: "El triángulo hueco en UML significa…", o: ["composición", "herencia", "multiplicidad"], c: 1, e: "“es un”." },
      { p: "¿Qué pilar es “speed privado con un getter”?", o: ["Encapsulación", "Polimorfismo", "Abstracción"], c: 0, e: "Ocultar el estado y exponer una interfaz controlada." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#en-cv"), logEl = root.querySelector("#en-log");
      const sim = B2.mundo(cv, { w: 720, h: 260, ppm: 50, gravedad: [0, 0] });
      sim.cadena(0, 0, [4, 4, 4, 256, 716, 256, 716, 4], { datos: { fijo: true } });
      const lines = []; const log = (s) => { lines.push(s); if (lines.length > 20) lines.shift(); logEl.textContent = lines.join("\n"); logEl.scrollTop = logEl.scrollHeight; };
      class PhysicEntity { constructor(body) { this.body = body; } update() { } }
      class Cone extends PhysicEntity {
        constructor() { super(sim.circulo(60 + Math.random() * 600, 40 + Math.random() * 180, 12, { datos: { color: "rgba(255,140,0,.7)" } })); }
        update() { return "Cone::Update(): dibujar cono rotado"; }
      }
      class Barrel extends PhysicEntity {
        constructor() { super(sim.caja(60 + Math.random() * 600, 40 + Math.random() * 180, 14, 20, { densidad: 4, datos: { color: "rgba(80,90,120,.6)" } })); }
        update() { return "Barrel::Update(): dibujar barril (pesa 4×)"; }
      }
      class BoostPad extends PhysicEntity {
        constructor() { super(sim.sensor(60 + Math.random() * 600, 40 + Math.random() * 180, 30, 12)); }
        update() { return "BoostPad::Update(): flechas animadas"; }
      }
      const clases = { Cone, Barrel, BoostPad };
      const entities = [];
      root.querySelectorAll("[data-mk]").forEach((b) => Curso.on(b, "click", () => { entities.push(new clases[b.dataset.mk]()); log(`entities.push_back(new ${b.dataset.mk}(...))  -> ${entities.length} entidades`); }));
      Curso.on(root.querySelector("#en-del"), "click", () => { entities.forEach((e) => { sim.destruir(e.body); log(`DestroyBody + delete ${e.constructor.name}`); }); entities.length = 0; });
      let t = 0;
      sim.onDibujo(() => {
        t++;
        if (t % 120 === 0 && entities.length) log("--- frame: for (entity : entities) entity->Update(); ---\n" + [...new Set(entities.map((e) => "   " + e.update()))].join("\n"));
        if (!entities.length) sim.texto("Vector vacío: crea entidades con los botones", 220, 130, Curso.color("ink-3"), 13);
      });
    }
  });
})();
