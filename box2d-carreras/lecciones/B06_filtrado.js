(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "b06", num: "06", grupo: "Bloque 2 · Física a medida (vista cenital)", corto: "Colisiones a medida y filtrado", pdf: "Handout 06 Custom Collisions and Filtering",
    titulo: "Colisiones a medida y filtrado de colisiones",
    resumen: "Fusionar cuerpos conservando el momento lineal, y decidir quién choca con quién con categorías, máscaras y grupos.",
    intro: "OnCollision te dice que dos cuerpos se han tocado; lo que pase después lo decides tú. En este handout las bolas del mismo color se fusionan respetando la física (conservación del momento), y aprendes a filtrar colisiones: que unos cuerpos se atraviesen y otros no.",
    objetivos: ["Programar una reacción a un choque fuera del Step", "Calcular centro de masas y velocidad final con conservación del momento", "Usar categoryBits, maskBits y groupIndex", "Cambiar filtros en tiempo de ejecución"],
    html: () => `
<h2>Reacciones a medida</h2>
<p><code>OnCollision()</code> solo avisa. Tú decides: un sonido, quitar vida, destruir… o fusionar. Recuerda las dos trampas de la lección 03:</p>
<ul>
<li>Durante <code>Step()</code> el mundo está bloqueado: nada de <code>CreateBody</code>/<code>DestroyBody</code> en OnCollision. Apunta lo que necesites y hazlo en <code>Update()</code>.</li>
<li>Cada contacto llega <strong>dos veces</strong>: (A, B) y (B, A). Si apuntas la pareja sin comprobar, la fusionarás dos veces.</li>
</ul>

<h2>Choque perfectamente inelástico</h2>
<p>Los dos cuerpos acaban pegados y moviéndose juntos. Se conserva el <strong>momento lineal</strong> (masa × velocidad):</p>
<div class="formula">m1 · v1 + m2 · v2 = (m1 + m2) · v      →      v = (m1·v1 + m2·v2) / (m1 + m2)</div>
<p>La energía cinética <strong>no</strong> se conserva: parte se convierte en calor y deformación. La nueva bola aparece en el <strong>centro de masas</strong>, que es la misma fórmula con posiciones:</p>
<div class="formula">p = (m1·p1 + m2·p2) / (m1 + m2)</div>
${nota(`<p>Pregunta de la diapositiva: una bola de 1 kg a 10 m/s choca con una de 99 kg parada. Velocidad final: (1·10 + 99·0) / 100 = <strong>0,1 m/s</strong>. Energía antes: ½·1·10² = 50 J. Después: ½·100·0,1² = 0,5 J. Se pierde el <strong>99 %</strong>.</p>`, "", "Calculado")}

<h2>Filtrado de colisiones</h2>
<p>Cada fixture tiene un <code>b2Filter</code> con tres campos:</p>
<div class="table-wrap"><table class="t"><thead><tr><th>Campo</th><th>Tipo</th><th>Significa</th><th>Por defecto</th></tr></thead><tbody>
<tr><td><code>categoryBits</code></td><td>uint16</td><td><strong>Qué soy</strong> (un bit)</td><td>0x0001</td></tr>
<tr><td><code>maskBits</code></td><td>uint16</td><td><strong>Con qué choco</strong> (varios bits)</td><td>0xFFFF (con todo)</td></tr>
<tr><td><code>groupIndex</code></td><td>int16</td><td>Atajo que manda sobre los otros dos</td><td>0</td></tr>
</tbody></table></div>
<p>Dos fixtures chocan solo si <strong>las dos están de acuerdo</strong>:</p>
<div class="formula">(catA & maskB) != 0  &&  (catB & maskA) != 0</div>
<p>Las categorías se definen con <strong>flags</strong>: un bit cada una, desplazando un 1:</p>
${code(String.raw`
enum PhysicCategory
{
    CATEGORY_DEFAULT = 1 << 0,   // 0x0001: el resto de la escena (paredes, cajas...)
    CATEGORY_RED     = 1 << 1,   // 0x0002
    CATEGORY_BLUE    = 1 << 2,   // 0x0004
    CATEGORY_GHOST   = 1 << 3    // 0x0008
};

uint16 mask = CATEGORY_DEFAULT | CATEGORY_RED;   // "choco con la escena y con los rojos"`, "cpp", "ModuleGame.cpp")}
<h3>groupIndex</h3>
<ul>
<li>0, o grupos distintos → deciden categoría y máscara.</li>
<li>Mismo grupo <strong>positivo</strong> → siempre chocan.</li>
<li>Mismo grupo <strong>negativo</strong> → <strong>nunca</strong> chocan, digan lo que digan las máscaras.</li>
</ul>

${demo("d-filt", "Rojas, azules y fantasmas", "Activa los TODOs y observa · arrastra con el ratón", `
<canvas id="fl-cv"></canvas>
<div class="controls">
  <label><input type="checkbox" id="fl-merge" checked> TODO 2–4: fusionar mismo color</label>
  <label><input type="checkbox" id="fl-mask"> TODO 7: rojas y azules se atraviesan</label>
  <label><input type="checkbox" id="fl-group"> TODO 8: fantasmas en grupo negativo</label>
  <label><input type="checkbox" id="fl-nodef"> Quitar DEFAULT de las máscaras</label>
</div>
<div class="readout" id="fl-out"></div>`)}
<p>Sin TODO 7, rojas y azules rebotan entre sí. Con él, se atraviesan pero siguen chocando con las de su color y con los fantasmas. Sin TODO 8, dos fantasmas se tocan (y se fusionan); con él, se atraviesan aunque su máscara diga “choco con fantasmas”: <strong>el grupo gana</strong>. Si quitas DEFAULT de las máscaras, las bolas atraviesan las cajas grises.</p>

<h2>El código del handout, explicado</h2>
${code(String.raw`
// TODO 6: CreateCircle recibe el filtro con valores por defecto (las llamadas viejas siguen funcionando)
PhysBody* CreateCircle(int x, int y, int radius, float density = 1.0f,
                       uint16 category = 0x0001, uint16 mask = 0xFFFF, int16 group = 0);

// Dentro, antes de CreateFixture:
fixture.filter.categoryBits = category;
fixture.filter.maskBits = mask;
fixture.filter.groupIndex = group;`, "cpp", "ModulePhysics")}
${code(String.raw`
// TODO 7 y 8: cada color con su filtro
static uint16 Category(BallColor c)
{
    switch (c) {
    case BALL_RED:  return CATEGORY_RED;
    case BALL_BLUE: return CATEGORY_BLUE;
    default:        return CATEGORY_GHOST;
    }
}

static uint16 Mask(BallColor c)
{
    switch (c) {
    case BALL_RED:  return CATEGORY_DEFAULT | CATEGORY_RED  | CATEGORY_GHOST;
    case BALL_BLUE: return CATEGORY_DEFAULT | CATEGORY_BLUE | CATEGORY_GHOST;
    default:        return 0xFFFF;                     // los fantasmas chocan con todo...
    }
}

static int16 Group(BallColor c)
{
    return (c == BALL_GHOST) ? GROUP_GHOST : 0;        // ...menos entre ellos: GROUP_GHOST = -1
}`, "cpp", "ModuleGame.cpp → class Ball")}
${code(String.raw`
// TODO 2: apuntar la pareja (en OnCollision)
Ball* a = FindBall(bodyA);
Ball* b = FindBall(bodyB);
if (a != NULL && b != NULL && a->color == b->color)
{
    bool repetida = false;
    for (auto& p : balls_to_merge)
        if ((p.first == a && p.second == b) || (p.first == b && p.second == a)) repetida = true;
    if (!repetida) balls_to_merge.push_back({ a, b });
}

// TODO 3 y 4: fusionar (en Update)
for (auto& p : balls_to_merge)
{
    Ball* a = p.first; Ball* b = p.second;
    float m1 = a->mass, m2 = b->mass, m = m1 + m2;

    b2Vec2 p1 = a->body->body->GetPosition(), p2 = b->body->body->GetPosition();
    b2Vec2 v1 = a->body->body->GetLinearVelocity(), v2 = b->body->body->GetLinearVelocity();

    b2Vec2 pos = (m1 * p1 + m2 * p2); pos *= 1.0f / m;           // centro de masas (metros)
    b2Vec2 vel = (m1 * v1 + m2 * v2); vel *= 1.0f / m;           // conservación del momento

    BallColor color = a->color;
    DestroyBall(a);
    DestroyBall(b);

    Ball* merged = new Ball(App->physics, METERS_TO_PIXELS(pos.x), METERS_TO_PIXELS(pos.y), m, color, circle);
    merged->body->body->SetLinearVelocity(vel);                  // TODO 1: que siga moviéndose
    merged->body->listener = this;
    balls.push_back(merged);
}
balls_to_merge.clear();`, "cpp", "ModuleGame.cpp")}
${nota(`<p>Cuidado con un caso: una bola que toca a otras dos en el mismo frame aparece en dos parejas. Al fusionar la primera pareja la destruyes, y en la segunda usarías un puntero liberado. Solución robusta: al procesar cada pareja, comprueba que las dos bolas siguen en <code>balls</code> (o descarta parejas con bolas ya usadas).</p>`, "warn")}

<h3>Cambiar el filtro en pleno juego</h3>
${code(String.raw`
b2Fixture* f = body->GetFixtureList();
b2Filter filter = f->GetFilterData();
filter.maskBits = CATEGORY_DEFAULT;            // por ejemplo: un fantasma que se vuelve sólido
f->SetFilterData(filter);`, "cpp")}
<p>Y si necesitas reglas que no caben en bits, heredas de <code>b2ContactFilter</code>, sobrescribes <code>ShouldCollide(fixtureA, fixtureB)</code> y llamas a <code>world-&gt;SetContactFilter(...)</code>: la misma idea que OnCollision, pero antes del choque.</p>

<h2>Para el juego de carreras</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Cuerpo</th><th>Categoría</th><th>Máscara</th></tr></thead><tbody>
<tr><td>Muros (cadenas)</td><td>WALL</td><td>CAR</td></tr>
<tr><td>Coches</td><td>CAR</td><td>WALL | CAR | SENSOR | ITEM</td></tr>
<tr><td>Checkpoints, meta, turbos (sensores)</td><td>SENSOR</td><td>CAR</td></tr>
<tr><td>Coche “fantasma” al reaparecer (sin chocar con rivales unos segundos)</td><td>CAR</td><td>WALL | SENSOR → luego vuelves a poner CAR con SetFilterData</td></tr>
</tbody></table></div>

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "Bola de 1 kg a 10 m/s choca y se fusiona con una de 99 kg parada. ¿Velocidad final?", o: ["10 m/s", "1 m/s", "0,1 m/s"], c: 2, e: "(1·10 + 99·0) / 100." },
      { p: "Fixture A: cat 0x0002, mask 0x0001. Fixture B: cat 0x0002, mask 0xFFFF. ¿Chocan?", o: ["Sí", "No: A no acepta la categoría de B", "Depende del grupo 0"], c: 1, e: "catB & maskA = 0x0002 & 0x0001 = 0." },
      { p: "Dos fantasmas con groupIndex −1 y máscaras 0xFFFF…", o: ["chocan", "nunca chocan", "chocan solo con DEFAULT"], c: 1, e: "Mismo grupo negativo gana a las máscaras." },
      { p: "¿Por qué hay que comprobar que la pareja no esté ya en balls_to_merge?", o: ["Por rendimiento", "Porque cada contacto llega dos veces, (A,B) y (B,A)", "Porque Box2D lo exige"], c: 1, e: "Si no, intentarías fusionar dos veces la misma pareja." },
      { p: "¿Qué valor tiene CATEGORY_GHOST = 1 << 3?", o: ["3", "8", "0x0003"], c: 1, e: "Desplazar 1 tres posiciones: 0b1000 = 8." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#fl-cv"), out = root.querySelector("#fl-out");
      const mergeCb = root.querySelector("#fl-merge"), maskCb = root.querySelector("#fl-mask"), groupCb = root.querySelector("#fl-group"), nodefCb = root.querySelector("#fl-nodef");
      const sim = B2.mundo(cv, { w: 720, h: 400, ppm: 50, gravedad: [0, 0] });
      const V = B2.Vec2, G = 9.8, DT = 1 / 60;
      const DEF = 1, RED = 2, BLUE = 4, GHOST = 8;
      const R = (m) => 5 * Math.sqrt(m);
      sim.cadena(0, 0, [0, 4, 760, 4], { abierta: true, datos: { fijo: true } });
      sim.cadena(0, 0, [0, 396, 760, 396], { abierta: true, datos: { fijo: true } });
      const cajas = [sim.caja(420, 120, 14, 40, { tipo: "static" }), sim.caja(560, 280, 14, 40, { tipo: "static" })];
      const balls = [];
      const filtro = (col) => {
        const d = nodefCb.checked ? 0 : DEF;
        const cat = col === "r" ? RED : col === "b" ? BLUE : GHOST;
        let mask = 0xffff;
        if (maskCb.checked) mask = col === "r" ? d | RED | GHOST : col === "b" ? d | BLUE | GHOST : 0xffff;
        if (nodefCb.checked) mask &= ~DEF;
        return { categoryBits: cat, maskBits: mask, groupIndex: groupCb.checked && col === "g" ? -1 : 0 };
      };
      const refiltrar = () => balls.forEach((b) => b.getFixtureList().setFilterData(filtro(b.getUserData().col)));
      [maskCb, groupCb, nodefCb].forEach((c) => Curso.on(c, "change", refiltrar));
      const colores = { r: "rgba(229, 83, 83, .6)", b: "rgba(83, 120, 229, .6)", g: "rgba(160, 160, 170, .3)" };
      function crearBola(x, y, m, col, vel) {
        const r = R(m), area = Math.PI * Math.pow(r / 50, 2), f = filtro(col);
        const b = sim.circulo(x, y, r, { densidad: m / area, friccion: 0, categoria: f.categoryBits, mascara: f.maskBits, grupo: f.groupIndex, datos: { masa: m, col, vida: 0, color: colores[col] } });
        if (vel) b.setLinearVelocity(vel);
        balls.push(b); return b;
      }
      const pares = [];
      sim.world.on("begin-contact", (c) => {
        if (!mergeCb.checked) return;
        const a = c.getFixtureA().getBody(), b = c.getFixtureB().getBody();
        if (!balls.includes(a) || !balls.includes(b)) return;
        if (a.getUserData().col !== b.getUserData().col) return;
        if (!pares.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) pares.push([a, b]);
      });
      let ultima = null, spawn = 0;
      sim.onPaso((dt) => {
        const usadas = new Set();
        pares.forEach(([a, b]) => {
          if (usadas.has(a) || usadas.has(b) || !balls.includes(a) || !balls.includes(b)) return;
          usadas.add(a); usadas.add(b);
          const m1 = a.getUserData().masa, m2 = b.getUserData().masa, m = m1 + m2;
          const p1 = a.getPosition(), p2 = b.getPosition(), v1 = a.getLinearVelocity(), v2 = b.getLinearVelocity();
          const pos = V((m1 * p1.x + m2 * p2.x) / m, (m1 * p1.y + m2 * p2.y) / m);
          const vel = V((m1 * v1.x + m2 * v2.x) / m, (m1 * v1.y + m2 * v2.y) / m);
          const ke = (mm, v) => 0.5 * mm * (v.x * v.x + v.y * v.y);
          ultima = { antes: m1 * v1.x + m2 * v2.x, despues: m * vel.x, keA: ke(m1, v1) + ke(m2, v2), keD: ke(m, vel), m1, m2 };
          const col = a.getUserData().col;
          [a, b].forEach((x) => { sim.destruir(x); balls.splice(balls.indexOf(x), 1); });
          crearBola(pos.x * 50, pos.y * 50, Math.min(m, 400), col, vel);
        });
        pares.length = 0;
        spawn += dt;
        if (spawn >= 0.8) {
          spawn = 0;
          const m = 1 + Math.floor(Math.random() * 60), r = R(m);
          crearBola(r + 2, r + 8 + Math.random() * (380 - 2 * r), m, ["r", "b", "g"][Math.floor(Math.random() * 3)]);
        }
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i], ud = b.getUserData(); ud.vida += dt;
          if (ud.vida > 14 || b.getPosition().x * 50 > 780) { sim.destruir(b); balls.splice(i, 1); continue; }
          const F = V(100, 0); b.applyForceToCenter(F, true);
          // fricción dinámica μk = 0.1 (como el handout)
          const mass = b.getMass(), N = mass * G, v = b.getLinearVelocity();
          if (v.length() > 0.01) { const d = V(v.x, v.y); d.normalize(); b.applyForceToCenter(V(-0.1 * N * d.x, -0.1 * N * d.y), true); }
        }
      });
      sim.onDibujo((ctx) => {
        ctx.textAlign = "center";
        balls.forEach((b) => { const p = sim.pos(b); sim.texto(b.getUserData().masa + "", p.x, p.y + 4, Curso.color("ink"), 11); });
        ctx.textAlign = "left";
        const f = (c) => { const x = filtro(c); return `cat 0x${x.categoryBits.toString(16).padStart(4, "0")} mask 0x${x.maskBits.toString(16).padStart(4, "0")} group ${x.groupIndex}`; };
        out.innerHTML = `<span>roja: <b>${f("r")}</b></span><span>azul: <b>${f("b")}</b></span><span>fantasma: <b>${f("g")}</b></span>` +
          (ultima ? `<span>última fusión ${ultima.m1}+${ultima.m2} kg · momento X antes <b>${ultima.antes.toFixed(2)}</b> después <b>${ultima.despues.toFixed(2)}</b> · energía perdida <b>${ultima.keA > 0 ? Math.round(100 * (1 - ultima.keD / ultima.keA)) : 0}%</b></span>` : "");
      });
    }
  });
})();
