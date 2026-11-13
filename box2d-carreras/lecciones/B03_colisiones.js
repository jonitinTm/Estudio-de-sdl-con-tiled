(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "b03", num: "03", grupo: "Bloque 1 · Las piezas de Box2D", corto: "Detección de colisiones", pdf: "Lesson3_Collision_Detection",
    titulo: "Detección de colisiones: puntos, rayos, contactos y sensores",
    resumen: "TestPoint, RayCast, el contact listener, userData para llegar a tu PhysBody, OnCollision y sensores.",
    intro: "Box2D ya resuelve los choques solo. Pero tu juego necesita enterarse: ¿el ratón está sobre este cuerpo?, ¿qué hay delante del coche?, ¿el coche ha cruzado la meta? Esta lección es el puente entre la física y la lógica del juego.",
    objetivos: ["Comprobar si un punto está dentro de un cuerpo", "Lanzar un rayo y obtener distancia y normal", "Recibir cada contacto con BeginContact y llegar a tu PhysBody", "Usar sensores y no destruir cuerpos durante el Step"],
    html: () => `
<h2>Las herramientas de colisión de Box2D</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Herramienta</th><th>Pregunta que responde</th><th>Para tu juego</th></tr></thead><tbody>
<tr><td><strong>Test point</strong></td><td>¿Este punto está dentro de esta forma?</td><td>Clic del ratón (mouse joint, menús)</td></tr>
<tr><td><strong>Ray cast</strong></td><td>Si trazo una línea de A a B, ¿qué toca primero y dónde?</td><td>“Sensores” de la IA para ver muros delante</td></tr>
<tr><td>Overlap</td><td>¿Se solapan estas dos formas?</td><td>Lo usa Box2D internamente</td></tr>
<tr><td>Contact manifold</td><td>¿En qué puntos se tocan y con qué normal?</td><td>Efectos de choque, chispas</td></tr>
<tr><td>Distance</td><td>¿Distancia mínima entre dos formas?</td><td>IA: distancia al rival</td></tr>
<tr><td>Time of impact</td><td>¿En qué instante exacto chocarían?</td><td>CCD: evitar el <em>tunneling</em></td></tr>
</tbody></table></div>

${nota(`<p><strong>Tunneling</strong>: un objeto muy rápido puede pasar de un lado de un muro fino al otro en un solo paso, sin “tocarlo” nunca. Box2D usa <em>Continuous Collision Detection</em> (time of impact) entre dinámicos y estáticos para evitarlo. Para coches muy rápidos que chocan entre sí, marca el body como <code>bullet = true</code>.</p>`)}

${demo("d-col", "Colisiones en vivo", "Mueve el ratón · Espacio: fija el origen del rayo · clic en vacío: soltar una pelota", `
<canvas id="col-cv"></canvas>
<div class="controls">
  <label><input type="checkbox" id="col-ray" checked> Ray cast hacia el ratón</label>
  <label><input type="checkbox" id="col-sensor" checked> Sensor abajo que destruye lo que toca</label>
</div>
<div class="readout" id="col-out"></div>
<pre class="log" id="col-log"></pre>`)}
<p>El cuerpo bajo el ratón se pone rojo (test point). Fíjate: la cadena verde nunca se pone roja, porque no tiene volumen. El rayo se detiene en el impacto <strong>más cercano</strong> y dibuja la normal en verde. Cada contacto aparece en el log; los que tocan el sensor se destruyen… pero un frame después.</p>

<h2>Test point: Contains()</h2>
<p>Un body puede tener varias fixtures, así que hay que preguntar a todas. Y la forma está guardada en coordenadas <em>locales</em> del cuerpo: hay que pasarle la transformación del body (su posición y rotación).</p>
${code(String.raw`
bool PhysBody::Contains(int x, int y) const
{
    b2Vec2 p(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));     // ¡a metros!

    for (b2Fixture* fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext())
    {
        if (fixture->GetShape()->TestPoint(body->GetTransform(), p))
            return true;                                   // basta con una
    }
    return false;
}`, "cpp", "ModulePhysics.cpp")}

<h2>Ray cast</h2>
<p>Box2D no te da la distancia: te da una <strong>fracción</strong> del segmento p1→p2. 0 = en p1, 1 = en p2, 0,5 = a mitad. <code>maxFraction</code> limita el rayo (1 = se para en p2). Distancia = fracción × longitud del segmento.</p>
${code(String.raw`
int PhysBody::RayCast(int x1, int y1, int x2, int y2, float& normal_x, float& normal_y) const
{
    int ret = -1;                                       // -1 = no ha tocado nada

    b2RayCastInput input;
    input.p1.Set(PIXEL_TO_METERS(x1), PIXEL_TO_METERS(y1));
    input.p2.Set(PIXEL_TO_METERS(x2), PIXEL_TO_METERS(y2));
    input.maxFraction = 1.0f;

    float closest = 1.0f;
    for (b2Fixture* fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext())
    {
        // Una cadena tiene un "hijo" por cada segmento: hay que probarlos todos
        for (int32 i = 0; i < fixture->GetShape()->GetChildCount(); ++i)
        {
            b2RayCastOutput output;
            if (fixture->GetShape()->RayCast(&output, input, body->GetTransform(), i) && output.fraction <= closest)
            {
                closest = output.fraction;                      // nos quedamos con el más cercano
                float dx = (float)(x2 - x1), dy = (float)(y2 - y1);
                ret = (int)(output.fraction * sqrtf(dx * dx + dy * dy));
                normal_x = output.normal.x;
                normal_y = output.normal.y;
            }
        }
    }
    return ret;
}`, "cpp", "ModulePhysics.cpp")}
${nota(`<p>La <strong>normal</strong> es un vector de longitud 1 perpendicular a la superficie tocada, apuntando hacia fuera. Para la IA del coche: lanzas 3 rayos (frente, frente-izquierda, frente-derecha); si el de la derecha toca un muro cerca, giras a la izquierda.</p>`, "", "Para el proyecto")}

<h2>Enterarse de los choques: el contact listener</h2>
<p>Durante <code>Step()</code>, Box2D llama a un objeto que herede de <code>b2ContactListener</code> cada vez que dos fixtures empiezan o dejan de tocarse:</p>
${code(String.raw`
void BeginContact(b2Contact* contact);                                 // empiezan a tocarse
void EndContact(b2Contact* contact);                                   // dejan de tocarse
void PreSolve(b2Contact* contact, const b2Manifold* oldManifold);      // antes de resolver (cambiar el choque)
void PostSolve(b2Contact* contact, const b2ContactImpulse* impulse);   // después (fuerza del golpe)`, "cpp", "b2ContactListener")}

<h3>La hoja de ruta del handout</h3>
<ol>
<li><strong>ModulePhysics es el listener</strong>: <code>class ModulePhysics : public Module, public b2ContactListener</code> y en Start <code>world-&gt;SetContactListener(this);</code></li>
<li>En <code>BeginContact</code> recibes <code>b2Contact</code> con dos <em>fixtures de Box2D</em>. Pero tú quieres <em>tus</em> <code>PhysBody</code>…</li>
<li>…así que al crear cada body guardas la dirección de su PhysBody en el <strong>userData</strong> del body (un hueco libre que Box2D te deja):
<code>body.userData.pointer = reinterpret_cast&lt;uintptr_t&gt;(pbody);</code> — <strong>en el b2BodyDef, antes de CreateBody</strong>.</li>
<li>Cada PhysBody tiene un <code>Module* listener</code>: el módulo al que avisar.</li>
<li>En BeginContact recuperas los dos PhysBody y llamas a <code>listener-&gt;OnCollision(a, b)</code> de cada uno que tenga listener.</li>
</ol>
${code(String.raw`
void ModulePhysics::BeginContact(b2Contact* contact)
{
    PhysBody* a = (PhysBody*)contact->GetFixtureA()->GetBody()->GetUserData().pointer;
    PhysBody* b = (PhysBody*)contact->GetFixtureB()->GetBody()->GetUserData().pointer;

    if (a != NULL && a->listener != NULL)
        a->listener->OnCollision(a, b);      // "a" siempre es el cuerpo del que me avisan

    if (b != NULL && b->listener != NULL)
        b->listener->OnCollision(b, a);
}`, "cpp", "ModulePhysics.cpp")}
${code(String.raw`
// Module.h: todos los módulos pueden escuchar
virtual void OnCollision(PhysBody* bodyA, PhysBody* bodyB) {}

// ModuleGame.cpp: al crear el círculo, me apunto como oyente
Circle* c = new Circle(App->physics, GetMouseX(), GetMouseY(), circle);
c->body->listener = this;

void ModuleGame::OnCollision(PhysBody* bodyA, PhysBody* bodyB)
{
    App->audio->PlayFx(bonus_fx);
}`, "cpp", "Module.h + ModuleGame.cpp")}
${nota(`<p>¿Por qué <code>reinterpret_cast&lt;uintptr_t&gt;</code>? En Box2D 2.4 el userData es un número entero del tamaño de un puntero (<code>uintptr_t</code>). Guardas la dirección como número y, al leerla, la conviertes de vuelta a <code>PhysBody*</code>. Si lo pones <em>después</em> de <code>CreateBody</code> en la def, no sirve de nada: la def ya se ha usado.</p>`)}

<h2>Cuidado: el mundo está bloqueado</h2>
<p>Los callbacks se ejecutan <strong>en mitad de Step()</strong>. Si dentro de <code>OnCollision</code> creas o destruyes cuerpos, Box2D está recorriendo listas internas que cambias bajo sus pies: crash o comportamiento imposible de depurar. La solución es siempre la misma: <strong>apúntalo en una lista y hazlo en Update()</strong>.</p>
${code(String.raw`
void ModuleGame::OnCollision(PhysBody* bodyA, PhysBody* bodyB)
{
    if (bodyA == sensor)
    {
        // Cada contacto llega dos veces: no lo apuntes dos veces
        if (std::find(bodies_to_destroy.begin(), bodies_to_destroy.end(), bodyB) == bodies_to_destroy.end())
            bodies_to_destroy.push_back(bodyB);
        return;
    }
    ...
}

update_status ModuleGame::Update()
{
    for (PhysBody* body : bodies_to_destroy)          // ahora sí: el mundo no está en Step
        for (PhysicEntity* entity : entities)
            if (entity->body == body) { DestroyEntity(entity); break; }
    bodies_to_destroy.clear();
    ...
}`, "cpp", "ModuleGame.cpp")}

<h2>Sensores</h2>
<p>Un sensor es una fixture con <code>isSensor = true</code>: Box2D detecta el solape y llama a BeginContact/EndContact, pero <strong>no empuja</strong> a nadie. Es el <em>trigger</em> de Unity. En tu juego de carreras: línea de meta, checkpoints, zonas de turbo, charcos de aceite, zonas de hierba.</p>
${code(String.raw`
PhysBody* ModulePhysics::CreateRectangleSensor(int x, int y, int half_width, int half_height)
{
    ...
    body.type = b2_staticBody;
    ...
    b2FixtureDef fixture;
    fixture.shape = &box;
    fixture.isSensor = true;          // detecta, no choca
    b->CreateFixture(&fixture);
    ...
}`, "cpp", "ModulePhysics.cpp")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "Un ray cast devuelve fraction = 0,25 en un segmento de 200 px. ¿A qué distancia está el impacto?", o: ["25 px", "50 px", "0,25 m"], c: 1, e: "0,25 × 200 = 50 px." },
      { p: "¿Por qué Contains() de una cadena siempre da false?", o: ["Las cadenas son estáticas", "No tienen volumen: son líneas", "Por un bug de Box2D"], c: 1, e: "Un punto no puede estar “dentro” de una línea." },
      { p: "¿Dónde se guarda la dirección del PhysBody para recuperarla en BeginContact?", o: ["En la fixture", "En body.userData.pointer, en la b2BodyDef antes de CreateBody", "En una variable global"], c: 1, e: "Después de CreateBody, modificar la def no sirve." },
      { p: "Tu coche toca un item y quieres destruir el item. ¿Dónde lo destruyes?", o: ["En OnCollision", "Lo apuntas en OnCollision y lo destruyes en Update", "En BeginContact"], c: 1, e: "Durante Step el mundo está bloqueado." },
      { p: "¿Qué hace un sensor?", o: ["Detecta solapes sin empujar", "Detecta solapes y rebota", "Solo funciona con estáticos"], c: 0, e: "Es un trigger." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#col-cv"), out = root.querySelector("#col-out"), logEl = root.querySelector("#col-log");
      const rayCb = root.querySelector("#col-ray"), sensCb = root.querySelector("#col-sensor");
      const lines = []; const log = (s) => { lines.push(s); if (lines.length > 30) lines.shift(); logEl.textContent = lines.join("\n"); logEl.scrollTop = logEl.scrollHeight; };
      let n = 0;
      const nombre = (b) => (b.getUserData() || {}).nombre || "?";
      const sim = B2.mundo(cv, {
        w: 720, h: 420, ppm: 50, gravedad: [0, 10],
        alClicar(p, cuerpo) { if (!cuerpo) sim.circulo(p.x, p.y, 14, { rebote: .3, datos: { nombre: "pelota#" + (++n), listener: true } }); }
      });
      sim.cadena(0, 0, [4, 4, 4, 360, 716, 360, 716, 4], { abierta: true, datos: { fijo: true, nombre: "paredes" } });
      sim.cadena(560, 150, [0, 0, 60, 30, 0, 60, -20, 30], { datos: { fijo: true, nombre: "cadena" } });
      sim.caja(250, 260, 80, 12, { tipo: "static", angulo: 0.25, datos: { fijo: true, nombre: "rampa" } });
      const sensor = sim.sensor(360, 400, 356, 18, { datos: { fijo: true, nombre: "SENSOR" } });
      for (let i = 0; i < 4; i++) sim.caja(120 + i * 140, 80, 30, 18, { datos: { nombre: "caja#" + i } });
      const destruir = [];
      sim.world.on("begin-contact", (c) => {
        const a = c.getFixtureA().getBody(), b = c.getFixtureB().getBody();
        if (a === sensor || b === sensor) {
          const otro = a === sensor ? b : a;
          if (sensCb.checked && !destruir.includes(otro)) { destruir.push(otro); log(`OnCollision(SENSOR, ${nombre(otro)}) -> bodies_to_destroy`); }
          return;
        }
        log(`BeginContact: ${nombre(a)} <-> ${nombre(b)}${(a.getUserData() || {}).listener || (b.getUserData() || {}).listener ? "  -> OnCollision() -> PlayFx(bonus)" : ""}`);
      });
      sim.onPaso(() => { if (destruir.length) { destruir.forEach((b) => { if (sim.cuerpos().includes(b)) { sim.destruir(b); log(`Update(): DestroyBody(${nombre(b)})`); } }); destruir.length = 0; } });
      let origen = { x: 40, y: 40 };
      Curso.teclado(cv, (e) => { if (e.code === "Space") origen = { ...sim.raton_px }; });
      sim.onDibujo((ctx) => {
        const mp = sim.raton_px, m = B2.Vec2(mp.x / 50, mp.y / 50);
        let sobre = "nada";
        sim.cuerpos().forEach((b) => {
          for (let f = b.getFixtureList(); f; f = f.getNext()) if (!f.isSensor() && f.testPoint(m)) {
            sobre = nombre(b);
            const p = sim.pos(b); ctx.fillStyle = "rgba(229, 57, 53, .45)";
            f.getType() === "circle" ? (ctx.beginPath(), ctx.arc(p.x, p.y, f.getShape().m_radius * 50, 0, 7), ctx.fill()) : (ctx.save(), ctx.beginPath(), f.getShape().m_vertices.forEach((v, i) => { const w = b.getWorldPoint(v); i ? ctx.lineTo(w.x * 50, w.y * 50) : ctx.moveTo(w.x * 50, w.y * 50); }), ctx.fill(), ctx.restore());
          }
        });
        let info = "";
        if (rayCb.checked && (mp.x || mp.y)) {
          let best = null;
          sim.world.rayCast(B2.Vec2(origen.x / 50, origen.y / 50), m, (f, point, normal, fr) => { if (f.isSensor()) return -1; best = { point, normal, fr, b: f.getBody() }; return fr; });
          const len = Math.hypot(mp.x - origen.x, mp.y - origen.y);
          const fin = best ? { x: best.point.x * 50, y: best.point.y * 50 } : mp;
          ctx.strokeStyle = "#e53935"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(origen.x, origen.y); ctx.lineTo(fin.x, fin.y); ctx.stroke();
          ctx.fillStyle = "#e53935"; ctx.beginPath(); ctx.arc(origen.x, origen.y, 4, 0, 7); ctx.fill();
          if (best) {
            ctx.strokeStyle = "#43a047"; ctx.beginPath(); ctx.moveTo(fin.x, fin.y); ctx.lineTo(fin.x + best.normal.x * 25, fin.y + best.normal.y * 25); ctx.stroke();
            info = `<span>rayo: fraction <b>${best.fr.toFixed(2)}</b> → distancia <b>${Math.round(best.fr * len)} px</b></span><span>toca <b>${nombre(best.b)}</b></span><span>normal <b>(${best.normal.x.toFixed(2)}, ${best.normal.y.toFixed(2)})</b></span>`;
          } else info = `<span>rayo: <b>-1</b> (no toca nada)</span>`;
          ctx.lineWidth = 1;
        }
        out.innerHTML = `<span>Contains(ratón): <b>${sobre}</b></span>` + info;
      });
    }
  });
})();
