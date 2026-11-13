(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  // Vértices del handout (en píxeles, relativos al punto de creación)
  const LETRA = [-38, 80, -44, -54, -16, -60, -16, -17, 19, -19, 19, -79, 61, -77, 57, 73, 17, 78, 20, 16, -25, 13, -9, 72];
  const RICK = [14, 36, 42, 40, 40, 0, 75, 30, 88, 4, 94, 39, 111, 36, 104, 58, 107, 62, 117, 67, 109, 73, 110, 85, 106, 91, 109, 99, 103, 104, 100, 115, 106, 121, 103, 125, 98, 126, 95, 137, 83, 147, 67, 147, 53, 140, 46, 132, 34, 136, 38, 126, 23, 123, 30, 114, 10, 102, 29, 90, 0, 75, 30, 62];

  Curso.leccion({
    id: "b02", num: "02", grupo: "Bloque 1 · Las piezas de Box2D", corto: "Formas", pdf: "Lesson2_Shapes",
    titulo: "Formas: círculos, cajas, edges y cadenas",
    resumen: "Los cuatro tipos de shape, SetAsBox con medias medidas, cadenas para escenarios, la clase PhysBody y dibujar texturas rotadas.",
    intro: "La forma decide cómo choca un cuerpo. En esta lección creas cada tipo de shape, entiendes por qué los escenarios se hacen con cadenas, envuelves los cuerpos en una clase PhysBody para dibujarlos con textura y aprendes a destruir lo que creas.",
    objetivos: ["Crear círculos, cajas y cadenas en píxeles convertidos a metros", "Entender medias medidas, polígonos convexos y winding", "Dibujar una textura centrada y rotada sobre un cuerpo", "Destruir cuerpos sin fugas de memoria"],
    html: () => `
<h2>Los cuatro tipos de shape</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Shape</th><th>Clase</th><th>Tiene volumen</th><th>Úsala para</th></tr></thead><tbody>
<tr><td>Círculo</td><td><code>b2CircleShape</code></td><td>Sí</td><td>Ruedas, pelotas, monedas. El más barato de calcular.</td></tr>
<tr><td>Polígono convexo</td><td><code>b2PolygonShape</code></td><td>Sí</td><td>Cajas, coches, conos. Máximo 8 vértices.</td></tr>
<tr><td>Edge</td><td><code>b2EdgeShape</code></td><td>No (es una línea)</td><td>Un segmento suelto de escenario.</td></tr>
<tr><td>Cadena</td><td><code>b2ChainShape</code></td><td>No (son líneas)</td><td><strong>Los muros de tu circuito.</strong></td></tr>
</tbody></table></div>

<h3>Polígonos: convexos y antihorarios</h3>
<p>Un polígono <strong>convexo</strong> no tiene “entrantes” (ningún ángulo interior pasa de 180°). Box2D solo acepta convexos, con hasta 8 vértices (<code>b2_maxPolygonVertices</code>), declarados en sentido <strong>antihorario</strong>. Para una forma cóncava (una L, un coche con alerón) usas <em>varias fixtures</em> convexas en el mismo body.</p>
<p>Para cajas hay un atajo, y aquí está la trampa de la lección:</p>
${code(String.raw`
b2PolygonShape box;
box.SetAsBox(PIXEL_TO_METERS(half_width), PIXEL_TO_METERS(half_height));   // ¡MEDIAS medidas!`, "cpp")}
${nota(`<p><code>SetAsBox(hx, hy)</code> recibe la <strong>mitad</strong> del ancho y la mitad del alto. Para una caja de 100×50 px pasas 50 y 25. Si pasas 100 y 50, tu caja será el doble de grande que su textura. <code>CreateRectangle(x, y, half_width, half_height)</code> del handout también recibe medias medidas, para que no lo olvides.</p>`, "warn")}

<h3>Edges y el problema de las colisiones fantasma</h3>
<p>Si haces un suelo con varios edges seguidos, un objeto que se desliza por encima puede “engancharse” en la unión entre dos: Box2D ve la esquina del segundo edge y calcula un choque con una normal rara. Son las <strong>ghost collisions</strong>. Se pueden evitar declarando vértices fantasma, pero es tedioso. Para eso existen…</p>

<h3>Cadenas (chains)</h3>
<ul>
<li>Concatenan edges de forma eficiente y <strong>eliminan las colisiones fantasma</strong> porque cada segmento conoce a sus vecinos.</li>
<li><code>CreateLoop(vertices, count)</code> cierra la cadena (el último vértice se une al primero). <code>CreateChain</code> la deja abierta.</li>
<li>Son <strong>de una cara</strong>: el sentido en que declaras los vértices decide de qué lado se choca. En el handout: <strong>horario</strong> para chocar desde fuera.</li>
<li>No tienen volumen: no chocan entre sí y <code>TestPoint</code> siempre da false con ellas (lección 03).</li>
<li>Deben ser cuerpos <strong>estáticos</strong> (o kinematic): una cadena dinámica no tiene masa.</li>
</ul>
${nota(`<p>Tu circuito serán <strong>dos cadenas cerradas</strong>: el borde exterior y el interior (la isla del centro). Los vértices los sacas de la imagen del circuito con el <em>shape creator</em> de Ric (arrastras la imagen, haces clic alrededor en sentido horario y ESC copia los vértices).</p>`, "", "Para el proyecto")}

${demo("d-formas", "Las teclas del handout", "Clic en el lienzo y usa 1 2 3 4 · Retroceso: destruir · F: texturas/debug", `
<canvas id="fm-cv"></canvas>
<div class="controls">
  <button type="button" class="btn" data-k="1">1 · círculo</button>
  <button type="button" class="btn" data-k="2">2 · caja 100×50</button>
  <button type="button" class="btn" data-k="3">3 · cadena (letra)</button>
  <button type="button" class="btn" data-k="4">4 · cabeza de Rick</button>
  <button type="button" class="btn" data-k="Backspace">⌫ destruir</button>
</div>
<div class="controls">
  <label><input type="checkbox" id="fm-debug" checked> Debug draw (F1)</label>
  <label><input type="checkbox" id="fm-bug"> Bug: dibujar la textura desde la esquina</label>
</div>
<div class="readout" id="fm-out"></div>`)}
<p>Desactiva el debug para ver las “texturas”. Luego activa el bug: la textura se dibuja desplazada media medida abajo a la derecha. Es la pregunta de la diapositiva 15: <strong>“¿por qué hay un desfase entre la textura y el debug?”</strong> La respuesta, abajo.</p>

<h2>PhysBody: tu envoltorio del b2Body</h2>
<p>El resto del juego no debería saber nada de Box2D (metros, b2Vec2…). Por eso las funciones de creación devuelven un <code>PhysBody*</code>: una clase pequeña que guarda el <code>b2Body*</code> y te da la posición ya en píxeles.</p>
${code(String.raw`
class PhysBody
{
public:
    PhysBody() : body(NULL), listener(NULL) {}

    void GetPosition(int& x, int& y) const;
    float GetRotation() const;

public:
    b2Body* body;
    Module* listener;          // lección 03
};

void PhysBody::GetPosition(int& x, int& y) const
{
    b2Vec2 pos = body->GetPosition();      // metros, centro del cuerpo
    x = METERS_TO_PIXELS(pos.x);
    y = METERS_TO_PIXELS(pos.y);
}

float PhysBody::GetRotation() const
{
    return body->GetAngle();               // RADIANES
}`, "cpp", "ModulePhysics.h / .cpp")}

<h3>El desfase textura / debug</h3>
<p><code>GetPosition()</code> devuelve el <strong>centro</strong> del cuerpo. Pero <code>DrawTexture(tex, x, y)</code> pone ahí la <strong>esquina superior izquierda</strong> de la imagen. Solución: dibujar con <code>DrawTexturePro</code> y un <code>origin</code> en el centro de la textura, que además es el punto alrededor del cual rota.</p>
${code(String.raw`
void Update() override
{
    int x, y;
    body->GetPosition(x, y);                                   // centro, en píxeles

    Rectangle source = { 0.0f, 0.0f, (float)texture.width, (float)texture.height };
    Rectangle dest   = { (float)x, (float)y, (float)texture.width, (float)texture.height };
    Vector2   origin = { (float)texture.width / 2.0f, (float)texture.height / 2.0f };   // pivote = centro

    DrawTexturePro(texture, source, dest, origin, body->GetRotation() * RAD2DEG, WHITE);
}`, "cpp", "ModuleGame.cpp → class Box")}
<p>Box2D trabaja en <strong>radianes</strong> y Raylib en <strong>grados</strong>: multiplica por <code>RAD2DEG</code> (≈ 57,3). Si olvidas la conversión, tu coche girará casi nada.</p>

<h2>Cadenas desde un array de enteros</h2>
${code(String.raw`
// size es el número de ints, no de vértices: 24 ints = 12 vértices
PhysBody* ModulePhysics::CreateChain(int x, int y, const int* points, int size)
{
    PhysBody* pbody = new PhysBody();

    b2BodyDef body;                                   // sin type: static por defecto
    body.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));
    body.userData.pointer = reinterpret_cast<uintptr_t>(pbody);
    b2Body* b = world->CreateBody(&body);

    int count = size / 2;
    b2Vec2* vertices = new b2Vec2[count];
    for (int i = 0; i < count; ++i)
    {
        vertices[i].x = PIXEL_TO_METERS(points[i * 2 + 0]);
        vertices[i].y = PIXEL_TO_METERS(points[i * 2 + 1]);
    }

    b2ChainShape shape;
    shape.CreateLoop(vertices, count);
    delete[] vertices;                                // CreateLoop copia los vértices

    b2FixtureDef fixture;
    fixture.shape = &shape;
    b->CreateFixture(&fixture);

    pbody->body = b;
    return pbody;
}`, "cpp", "ModulePhysics.cpp")}
<p>Los vértices son <strong>relativos a la posición del body</strong>: por eso la misma letra aparece donde haces clic. En el circuito crearás la cadena en (0, 0) con vértices en coordenadas absolutas del mapa.</p>

<h2>Todo lo que creas, lo destruyes</h2>
${code(String.raw`
void ModulePhysics::DestroyBody(PhysBody* pbody)
{
    if (pbody == NULL) return;
    world->DestroyBody(pbody->body);   // Box2D libera el body y sus fixtures (y sus joints)
    delete pbody;                      // tú liberas tu envoltorio (lo creaste con new)
}

// En ModuleGame: al pulsar BACKSPACE y en CleanUp()
for (PhysicEntity* entity : entities)
{
    App->physics->DestroyBody(entity->body);
    delete entity;
}
entities.clear();`, "cpp", "Destruir")}
${nota(`<p>Dos niveles de memoria: Box2D es dueño del <code>b2Body</code> (lo liberas con <code>world-&gt;DestroyBody</code>), tú eres dueño del <code>PhysBody</code> y de la entidad (los liberas con <code>delete</code>). El proyecto puntúa “sin fugas de memoria”: revisa que cada <code>new</code> tenga su <code>delete</code>.</p>`, "warn")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "Quieres una caja de 80×40 px. ¿Qué pasas a CreateRectangle(x, y, ?, ?)?", o: ["80, 40", "40, 20", "160, 80"], c: 1, e: "Recibe medias medidas, como SetAsBox." },
      { p: "¿Por qué los muros de un circuito se hacen con cadenas y no con edges sueltos?", o: ["Son más bonitas", "Evitan las colisiones fantasma en las uniones", "Los edges no pueden ser estáticos"], c: 1, e: "Cada segmento de la cadena conoce a sus vecinos." },
      { p: "GetRotation() devuelve 1,57. ¿Qué ángulo le pasas a DrawTexturePro?", o: ["1,57", "≈ 90", "≈ 0,027"], c: 1, e: "1,57 rad × 57,3 ≈ 90°." },
      { p: "La textura aparece desplazada respecto al debug draw. ¿Causa?", o: ["PIXELS_PER_METER mal", "GetPosition da el centro y se dibuja desde la esquina", "La gravedad"], c: 1, e: "Usa origin = (w/2, h/2) en DrawTexturePro." },
      { p: "¿Qué libera world->DestroyBody(b)?", o: ["El body, sus fixtures y sus joints", "Solo el body", "El body y el PhysBody"], c: 0, e: "El PhysBody es tuyo: delete pbody." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#fm-cv"), dbg = root.querySelector("#fm-debug"), bug = root.querySelector("#fm-bug"), out = root.querySelector("#fm-out");
      const sim = B2.mundo(cv, { w: 720, h: 420, ppm: 50, gravedad: [0, 10] });
      sim.cadena(0, 0, [4, 4, 4, 416, 716, 416, 716, 4], { datos: { fijo: true } });
      const creados = [];
      const dibCentro = (w, h, pintar) => (ctx, s, b) => {
        const p = s.pos(b);
        ctx.save();
        if (bug.checked) ctx.translate(p.x + w / 2, p.y + h / 2); else ctx.translate(p.x, p.y);
        ctx.rotate(b.getAngle()); pintar(ctx, w, h); ctx.restore();
        if (bug.checked) { ctx.strokeStyle = Curso.color("bad"); ctx.setLineDash([3, 3]); ctx.strokeRect(p.x - w / 2, p.y - h / 2, w, h); ctx.setLineDash([]); }
      };
      const rueda = (ctx, w) => { const r = w / 2; ctx.fillStyle = "#3a3f58"; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.fillStyle = "#c2c8de"; ctx.beginPath(); ctx.arc(0, 0, r * .55, 0, 7); ctx.fill(); ctx.strokeStyle = "#3a3f58"; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * 1.256) * r * .55, Math.sin(i * 1.256) * r * .55); ctx.stroke(); } ctx.lineWidth = 1; };
      const caja = (ctx, w, h) => { ctx.fillStyle = "#b07a3c"; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = "#6e4a20"; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4); ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.stroke(); ctx.lineWidth = 1; };
      const poli = (pts, col) => (ctx, s, b) => { const p = s.pos(b); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < pts.length; i += 2) i ? ctx.lineTo(pts[i], pts[i + 1]) : ctx.moveTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill(); ctx.restore(); };
      function crear(k) {
        const m = sim.raton_px, x = Math.max(60, Math.min(660, m.x || 360)), y = Math.max(60, Math.min(340, m.y || 120));
        if (k === "1") creados.push(sim.circulo(x, y, 25, { datos: { dibujar: dibCentro(50, 50, rueda) } }));
        if (k === "2") creados.push(sim.caja(x, y, 50, 25, { datos: { dibujar: dibCentro(100, 50, caja) } }));
        if (k === "3") creados.push(sim.cadena(x, y, LETRA, { datos: { dibujar: poli(LETRA, "rgba(120,130,160,.35)") } }));
        if (k === "4") creados.push(sim.cadena(x - 58, y - 73, RICK, { datos: { dibujar: poli(RICK, "#9fd3c7") } }));
        if (k === "Backspace") { creados.forEach((b) => sim.destruir(b)); creados.length = 0; }
      }
      Curso.teclado(cv, (e) => {
        if (["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) crear(e.code.slice(-1));
        if (e.code === "Backspace") { e.preventDefault(); crear("Backspace"); }
        if (e.code === "KeyF" || e.code === "F1") { e.preventDefault(); dbg.checked = !dbg.checked; }
      });
      root.querySelectorAll("[data-k]").forEach((b) => Curso.on(b, "click", () => { if (!sim.raton_px.x) sim.raton_px = { x: 200 + Math.random() * 320, y: 100 }; crear(b.dataset.k); }));
      ["1", "2", "1", "2", "1"].forEach((k, i) => { sim.raton_px = { x: 140 + i * 110, y: 80 + (i % 2) * 50 }; crear(k); });
      sim.raton_px = { x: 0, y: 0 };
      sim.onDibujo((ctx) => {
        sim.debug = dbg.checked;
        const n = { circle: 0, polygon: 0, chain: 0 };
        creados.forEach((b) => n[b.getFixtureList().getType()]++);
        out.innerHTML = `<span>círculos <b>${n.circle}</b></span><span>cajas <b>${n.polygon}</b></span><span>cadenas <b>${n.chain}</b></span><span>cuerpos en el mundo <b>${sim.cuerpos().length}</b></span>`;
        if (document.activeElement !== cv) sim.texto("Haz clic aquí y pulsa 1, 2, 3 o 4 (se crean en el ratón)", 180, 30, Curso.color("ink-2"), 13);
      });
    }
  });
})();
