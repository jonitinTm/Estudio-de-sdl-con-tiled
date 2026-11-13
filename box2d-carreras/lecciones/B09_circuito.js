(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "b09", num: "09", grupo: "Bloque 3 · El juego de carreras", corto: "Circuito y vueltas",
    titulo: "El circuito: muros, checkpoints, vueltas y tiempos",
    resumen: "Muros con cadenas, checkpoints en orden con sensores, contar vueltas sin trampas, cronómetro, mejor vuelta, zonas de aceite y turbo, estados de la carrera.",
    intro: "Ya tienes un coche que se conduce bien. Ahora necesitas una carrera: un circuito del que no te puedas salir, una meta que solo cuente si has dado la vuelta entera, un cronómetro con tu mejor vuelta, un principio (cuenta atrás) y un final. Todo con lo que ya sabes: cadenas (lección 02), sensores y OnCollision (lección 03).",
    objetivos: ["Construir el circuito con dos cadenas cerradas", "Detectar vueltas válidas con checkpoints en orden", "Medir tiempo de vuelta, mejor vuelta y tiempo total", "Programar zonas especiales (turbo, aceite) y los estados de la carrera"],
    html: () => `
${demo("d-race", "Contrarreloj (3 vueltas)", "Clic en el lienzo · W/S/A/D o flechas · Espacio: freno de mano · R: reiniciar · F: debug", `
<canvas id="rc-cv"></canvas>
<div class="controls">
  <label><input type="checkbox" id="rc-dbg"> Debug: ver sensores y checkpoints (F1)</label>
</div>
<div class="readout" id="rc-out"></div>`)}
<p>Prueba a hacer trampa: da media vuelta en la meta y vuelve a cruzarla. No cuenta. Pisa el turbo amarillo y la mancha de aceite (pierdes el agarre). Activa el debug para ver los sensores (en discontinuo) y el número de cada checkpoint.</p>

<h2>1. Los muros: dos cadenas</h2>
<p>Un circuito cerrado son dos bordes: el <strong>exterior</strong> y el de la <strong>isla interior</strong>. Cada uno es una cadena cerrada (<code>CreateLoop</code>), estática. Sacas los vértices de la imagen del circuito con el shape creator (o los escribes a mano para un circuito sencillo), igual que la cabeza de Rick.</p>
${code(String.raw`
// Vértices en píxeles, absolutos sobre la imagen del circuito (la creas en 0, 0)
static constexpr int track_outer[] = { 64, 80,  1210, 70,  1230, 650,  60, 660 /* ... */ };
static constexpr int track_inner[] = { 300, 260,  980, 250,  990, 470,  290, 480 /* ... */ };

// ModuleGame::Start()
walls_outer = App->physics->CreateChain(0, 0, track_outer, sizeof(track_outer) / sizeof(int));
walls_inner = App->physics->CreateChain(0, 0, track_inner, sizeof(track_inner) / sizeof(int));`, "cpp", "ModuleGame.cpp")}
${nota(`<p><code>sizeof(array) / sizeof(int)</code> calcula cuántos ints tiene el array: así no te equivocas al contar a mano (recuerda que CreateChain recibe el número de <em>ints</em>, no de vértices). Si el circuito es más grande que la pantalla, necesitarás cámara: lee la nota de la sección 6.</p>`)}

<h2>2. Checkpoints: por qué no basta con una meta</h2>
<p>Si solo detectas “ha tocado la meta”, el jugador puede cruzarla, dar media vuelta y volver a cruzarla: vuelta gratis. La solución clásica: varios <strong>sensores</strong> atravesando la pista (0 = meta, 1, 2, …), y cada coche guarda <strong>cuál es el siguiente que debe tocar</strong>. Solo cuenta si toca justo ese.</p>
<div class="formula">next_checkpoint empieza en 1  (acabas de salir de la meta, el 0)
al tocar el checkpoint k:
    si k == next_checkpoint:
        next_checkpoint = (k + 1) % N
        si k == 0  →  ¡vuelta completa!</div>
${code(String.raw`
class Checkpoint : public PhysicEntity
{
public:
    Checkpoint(ModulePhysics* physics, int x, int y, int half_w, int half_h, int _index)
        : PhysicEntity(physics->CreateRectangleSensor(x, y, half_w, half_h)), index(_index) {}

    void Update() override {}            // invisible (en debug se ve con F1)

    int index;                           // 0 = meta
};

// ModuleGame::Start()
for (int i = 0; i < CHECKPOINT_COUNT; ++i)
{
    Checkpoint* cp = new Checkpoint(App->physics, cp_pos[i].x, cp_pos[i].y, cp_size[i].x, cp_size[i].y, i);
    cp->body->listener = this;           // quiero enterarme de quién lo cruza
    checkpoints.push_back(cp);
}`, "cpp", "Checkpoint")}
${code(String.raw`
void ModuleGame::OnCollision(PhysBody* bodyA, PhysBody* bodyB)
{
    Checkpoint* cp = FindCheckpoint(bodyA);     // bodyA es el que tiene a este módulo de listener
    Car* car = FindCar(bodyB);
    if (cp == NULL || car == NULL || state != RACE_RUNNING) return;

    if (cp->index != car->next_checkpoint) return;          // fuera de orden: no cuenta

    car->next_checkpoint = (cp->index + 1) % CHECKPOINT_COUNT;

    if (cp->index == 0)                                       // meta, en orden
    {
        car->LapCompleted();                                  // guarda el tiempo, suma vuelta
        App->audio->PlayFx(lap_fx);
    }
}`, "cpp", "ModuleGame.cpp")}
${nota(`<p>Aquí <strong>sí</strong> puedes tocar variables dentro de OnCollision (contadores, tiempos, estado): lo prohibido es crear o destruir cuerpos, o cambiar su movimiento a mitad del Step. Por eso el turbo de la demo no aplica el impulso en el callback: marca <code>car-&gt;boost_time = 0.6f</code> y la fuerza se aplica en el Update del coche.</p>`, "warn")}

<h2>3. El cronómetro</h2>
<p>El proyecto pide “tiempo actual y mejor tiempo en la misma sesión”. El <code>Timer</code> del handout (<code>Start()</code> y <code>ReadSec()</code>) es perfecto:</p>
${code(String.raw`
void Car::LapCompleted()
{
    double t = lap_timer.ReadSec();
    lap_times.push_back(t);
    if (best_lap < 0.0 || t < best_lap) best_lap = t;          // -1 = todavía no hay mejor
    lap++;
    lap_timer.Start();                                          // empieza la siguiente vuelta
    if (lap >= LAPS_TO_WIN) finished = true;
}

// HUD (ModuleGame::Update, al final)
DrawText(TextFormat("Lap %d/%d", player->lap + 1, LAPS_TO_WIN), 20, 20, 30, WHITE);
DrawText(TextFormat("Time %.2f", player->lap_timer.ReadSec()), 20, 55, 25, WHITE);
DrawText(best_lap < 0 ? "Best --" : TextFormat("Best %.2f", best_lap), 20, 85, 25, YELLOW);`, "cpp", "Car.cpp + ModuleGame.cpp")}
<p>Para que el récord dure “toda la sesión”, guárdalo en ModuleGame (no en el coche), y no lo borres al reiniciar la carrera.</p>

<h2>4. Principio y final: una máquina de estados</h2>
${code(String.raw`
enum RaceState { RACE_COUNTDOWN, RACE_RUNNING, RACE_FINISHED };

switch (state)
{
case RACE_COUNTDOWN:
    if (countdown.ReadSec() >= 3.0) { state = RACE_RUNNING; for (Car* c : cars) c->lap_timer.Start(); App->audio->PlayFx(go_fx); }
    break;                                       // los coches no reciben input
case RACE_RUNNING:
    for (Car* c : cars) c->Update();
    if (player->finished) { state = RACE_FINISHED; App->audio->PlayFx(win_fx); }
    break;
case RACE_FINISHED:
    if (IsKeyPressed(KEY_ENTER)) RestartRace();  // reset de posiciones, vueltas y timers (no del récord)
    break;
}`, "cpp", "ModuleGame.cpp")}
<p>Recolocar un coche en la parrilla: <code>body-&gt;SetTransform(pos, angle)</code> y velocidades a cero (<code>SetLinearVelocity(b2Vec2_zero)</code>, <code>SetAngularVelocity(0)</code>). <code>SetTransform</code> es legal aquí porque es un “teletransporte” puntual, no cada frame.</p>

<h2>5. Zonas especiales (la “mecánica especial” del proyecto)</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Zona</th><th>Cómo</th><th>Efecto</th></tr></thead><tbody>
<tr><td>Turbo (boost pad)</td><td>Sensor; en OnCollision marca <code>boost_time</code></td><td>Fuerza extra hacia el forward durante X s</td></tr>
<tr><td>Aceite / hielo</td><td>Sensor; contador de contactos (Begin +1, End −1)</td><td>Mientras &gt; 0, <code>surface_grip</code> bajo → derrapa</td></tr>
<tr><td>Hierba / arena</td><td>Igual que aceite</td><td><code>max_speed</code> y agarre menores, más drag</td></tr>
<tr><td>Nitro (Espacio)</td><td>Sin sensor: una carga con cooldown</td><td>Impulso <code>ApplyLinearImpulse(forward * k)</code></td></tr>
</tbody></table></div>
${nota(`<p>¿Por qué un <strong>contador</strong> para el aceite y no un bool? Si la mancha está hecha de dos sensores que se solapan, al salir de uno recibes EndContact aunque sigas en el otro. Con un contador (Begin +1, End −1) estás dentro mientras sea &gt; 0. Para EndContact necesitas sobrescribir también <code>void EndContact(b2Contact*)</code> en ModulePhysics, igual que BeginContact.</p>`)}

<h2>6. Circuitos más grandes que la pantalla</h2>
<p>Si tu circuito no cabe en 1280×720, la cámara debe seguir al coche. Con Raylib, lo más limpio es un <code>Camera2D</code>:</p>
${code(String.raw`
Camera2D camera = { 0 };
camera.offset = { SCREEN_WIDTH / 2.0f, SCREEN_HEIGHT / 2.0f };    // el coche en el centro
camera.zoom = 1.0f;

int x, y; player->body->GetPosition(x, y);
camera.target = { (float)x, (float)y };
// camera.rotation = -player->body->GetRotation() * RAD2DEG;       // opcional: la pista gira, no el coche

BeginMode2D(camera);
    // pista, coches, debug draw...
EndMode2D();
// HUD fuera de BeginMode2D: no se mueve con la cámara`, "cpp", "Raylib Camera2D")}
${nota(`<p>Si usas cámara, el debug draw de ModulePhysics y el mouse joint deben dibujarse dentro de <code>BeginMode2D</code>, y la posición del ratón hay que convertirla con <code>GetScreenToWorld2D(GetMousePosition(), camera)</code> antes de pasarla a metros. Si no, el mouse joint “agarra” en el sitio equivocado.</p>`, "warn")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "8 checkpoints; un coche tiene next_checkpoint = 7 y toca el 7. ¿Cuál es el siguiente?", o: ["8", "0 (la meta)", "1"], c: 1, e: "(7 + 1) % 8 = 0." },
      { p: "¿Por qué el récord se guarda en ModuleGame y no solo en el coche?", o: ["Por rendimiento", "Para que sobreviva al reiniciar la carrera durante la sesión", "Porque el coche no tiene Timer"], c: 1, e: "Al reiniciar se resetean los coches, no el récord." },
      { p: "¿Puedes cambiar car->lap dentro de OnCollision?", o: ["Sí: cambiar variables está bien; crear/destruir cuerpos no", "No, nunca", "Solo con un mutex"], c: 0, e: "El mundo bloqueado afecta a cuerpos y joints." },
      { p: "¿Por qué un contador para la zona de aceite?", o: ["Porque los sensores pueden solaparse y EndContact llegaría antes de salir de verdad", "Para contar puntos", "Box2D lo exige"], c: 0, e: "Begin +1, End −1, dentro mientras > 0." },
      { p: "¿Cómo recolocas un coche en la parrilla?", o: ["Destruirlo y crearlo", "SetTransform + velocidades a cero", "Aplicando una fuerza enorme"], c: 1, e: "Un teletransporte puntual está bien." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#rc-cv"), out = root.querySelector("#rc-out"), dbg = root.querySelector("#rc-dbg");
      const sim = B2.mundo(cv, { w: 760, h: 460, ppm: 25, gravedad: [0, 0], debug: false });
      const pista = B2.crearCircuito(sim, { ancho: 42, checkpoints: 8 });
      const g = B2.gestorCarrera(sim, pista, { vueltas: 3 });
      const zonaEn = (i, tipo, hw, hh) => { const p = pista.centro[i], q = pista.centro[(i + 1) % pista.N]; g.zona(tipo, p.x, p.y, hw, hh, Math.atan2(q.y - p.y, q.x - p.x) + (tipo === "turbo" ? Math.PI / 2 : 0)); };
      zonaEn(Math.round(pista.N * 0.06), "turbo", 12, 16);
      zonaEn(Math.round(pista.N * 0.55), "aceite", 26, 14);
      const car = g.registrar(B2.crearCoche(sim, 0, 0, 0, { hw: 8, hh: 15, color: "#e5533d" }));
      car.jugador = true;
      B2.parrilla(sim, pista, car, 2, 0);
      const keys = Curso.teclado(cv, (e) => {
        if (e.code === "KeyR") { g.reiniciar(); B2.parrilla(sim, pista, car, 2, 0); }
        if (e.code === "KeyF" || e.code === "F1") { e.preventDefault(); dbg.checked = !dbg.checked; }
      });
      sim.fondo = (ctx) => { B2.dibujarPista(ctx, pista); g.dibujarZonas(ctx); };
      sim.onPaso((dt) => {
        g.paso(dt);
        let th = 0, st = 0;
        if (g.estado !== "cuenta" && !car.finished) {
          if (keys.has("KeyW") || keys.has("ArrowUp")) th += 1;
          if (keys.has("KeyS") || keys.has("ArrowDown")) th -= 1;
          if (keys.has("KeyA") || keys.has("ArrowLeft")) st -= 1;
          if (keys.has("KeyD") || keys.has("ArrowRight")) st += 1;
        }
        car.handbrake = keys.has("Space");
        car.updateGrip(); car.drive(th); car.steer(st);
      });
      sim.onDibujo((ctx) => {
        sim.debug = dbg.checked;
        if (sim.debug) pista.cps.forEach((c, k) => sim.texto(String(k), c.p.x - 4, c.p.y + 4, k === car.next_cp ? "#facc15" : "#fff", 14));
        g.hud(ctx, car);
        if (document.activeElement !== cv) sim.texto("Haz clic aquí para conducir", 290, 240, "#fff", 14);
        out.innerHTML = `<span>estado <b>${g.estado}</b></span><span>siguiente checkpoint <b>${car.next_cp}</b></span><span>vueltas <b>${car.times.map((t) => t.toFixed(2)).join(" · ") || "—"}</b></span><span>${car.enAceite ? "<b>en aceite</b>" : car.boost > 0 ? "<b>TURBO</b>" : "asfalto"}</span>`;
      });
    }
  });
})();
