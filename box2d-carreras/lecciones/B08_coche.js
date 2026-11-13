(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "b08", num: "08", grupo: "Bloque 3 · El juego de carreras", corto: "El coche top-down",
    titulo: "La física del coche top-down",
    resumen: "Velocidad frontal y lateral, agarre con impulsos, derrape, motor, frenos, dirección y freno de mano.",
    intro: "Una caja de Box2D empujada hacia delante no se conduce como un coche: al girar sigue deslizándose de lado, como si estuviera sobre hielo. Los neumáticos de verdad casi no dejan moverse de lado. En esta lección descompones la velocidad del coche en “hacia delante” y “de lado”, cancelas la lateral, y con tres funciones (agarre, motor, dirección) tienes un coche que se conduce bien y que derrapa cuando tú quieres.",
    objetivos: ["Obtener los vectores forward y right de un cuerpo", "Proyectar la velocidad con el producto escalar", "Cancelar la velocidad lateral con un impulso limitado (agarre y derrape)", "Programar motor, freno, marcha atrás, dirección y freno de mano"],
    html: () => `
<h2>El problema: un coche sobre hielo</h2>
<p>Si en una caja dinámica sin gravedad aplicas una fuerza hacia su morro y la haces girar, la velocidad vieja se conserva: el coche gira, pero sigue moviéndose en la dirección anterior. Desactiva “Agarre” en la demo de abajo y conduce: es imposible tomar una curva.</p>
<p>Un neumático real rueda fácil hacia delante y se resiste muchísimo a moverse de lado. Esa es toda la idea: <strong>dejar la velocidad frontal y eliminar la lateral</strong>.</p>

${demo("d-car", "Banco de pruebas del coche", "Clic en el lienzo · W/↑ acelera · S/↓ frena y marcha atrás · A/D o ←/→ gira · Espacio: freno de mano", `
<canvas id="car-cv"></canvas>
<div class="controls">
  <label><input type="checkbox" id="car-grip" checked> Agarre (cancelar lateral)</label>
  <label><input type="checkbox" id="car-vec" checked> Ver vectores</label>
  <label><input type="checkbox" id="car-dbg"> Debug draw (F1)</label>
</div>
<div class="controls">
  <label>motor <input type="range" id="car-eng" min="4" max="40" value="18"></label>
  <label>vel. máx <input type="range" id="car-max" min="3" max="20" value="9"></label>
  <label>impulso lateral máx <input type="range" id="car-lat" min="0.1" max="3" step="0.1" value="0.9"></label>
  <label>giro <input type="range" id="car-turn" min="1" max="6" step="0.1" value="3.2"></label>
</div>
<div class="readout" id="car-out"></div>`)}
<p>Vectores: <span style="color:#3b82f6">azul</span> = forward (hacia dónde mira el morro), <span style="color:#22c55e">verde</span> = velocidad real, <span style="color:#ef4444">rojo</span> = velocidad lateral (la que queremos matar). Baja el “impulso lateral máximo” y el coche derrapa en las curvas rápidas; súbelo y va sobre raíles.</p>

<h2>1. ¿Hacia dónde mira el coche?</h2>
<p>Un body tiene ángulo, pero trabajar con ángulos (senos y cosenos) es incómodo. Box2D te da <code>GetWorldVector(local)</code>: convierte una dirección escrita “desde el punto de vista del coche” a coordenadas del mundo, teniendo en cuenta su rotación.</p>
${code(String.raw`
// En pantalla la Y crece hacia abajo: el morro del coche (dibujado hacia arriba) es (0, -1)
b2Vec2 Car::GetForward() const { return body->body->GetWorldVector(b2Vec2(0.0f, -1.0f)); }
b2Vec2 Car::GetRight()   const { return body->body->GetWorldVector(b2Vec2(1.0f, 0.0f)); }`, "cpp", "Car.cpp")}
${nota(`<p>Ojo: <code>GetWorldVector</code> (dirección, ignora la posición) no es <code>GetWorldPoint</code> (punto, suma la posición). Si dibujas tu textura del coche mirando a la derecha, el forward local sería (1, 0). Decide uno y sé coherente con la textura.</p>`, "warn")}

<h2>2. Descomponer la velocidad</h2>
<p>El <strong>producto escalar</strong> de la velocidad con un vector unitario te dice “cuánta velocidad va en esa dirección”. Multiplicándolo otra vez por el vector, obtienes esa parte de la velocidad como vector:</p>
<div class="formula">velocidad_lateral = (right · v) · right
velocidad_frontal = (forward · v) · forward          v = frontal + lateral</div>
${code(String.raw`
b2Vec2 Car::GetLateralVelocity() const
{
    b2Vec2 right = GetRight();
    return b2Dot(right, body->body->GetLinearVelocity()) * right;
}

float Car::GetForwardSpeed() const               // con signo: + avanza, - marcha atrás
{
    return b2Dot(GetForward(), body->body->GetLinearVelocity());
}`, "cpp", "Car.cpp")}

<h2>3. Agarre: matar la velocidad lateral</h2>
<p>Un <strong>impulso</strong> cambia la velocidad al instante: <code>Δv = impulso / masa</code>. Para quitar exactamente la velocidad lateral, el impulso es <code>masa × (−v_lateral)</code>. Si lo hiciéramos completo siempre, el coche iría sobre raíles. Si lo <strong>limitamos</strong>, en curvas rápidas el impulso necesario supera el límite, no basta para pararla… y el coche <strong>derrapa</strong>.</p>
${code(String.raw`
void Car::UpdateFriction()
{
    b2Body* b = body->body;

    // a) Agarre lateral, con límite = derrape
    b2Vec2 impulse = b->GetMass() * -GetLateralVelocity();
    float max_impulse = max_lateral_impulse * surface_grip;     // menor en aceite o con freno de mano
    if (handbrake) max_impulse *= 0.25f;
    if (impulse.Length() > max_impulse)
    {
        impulse *= max_impulse / impulse.Length();              // recortar al máximo
        drifting = true;                                        // ¡humo y sonido de derrape!
    }
    else drifting = false;
    b->ApplyLinearImpulse(impulse, b->GetWorldCenter(), true);

    // b) Rozamiento en el sentido de la marcha (rodadura + aire): sin esto nunca se para
    b2Vec2 forward = GetForward();
    float speed = GetForwardSpeed();
    b->ApplyForceToCenter(-drag * speed * forward, true);

    // c) Que no siga girando como una peonza
    b->SetAngularDamping(3.0f);                                 // o hazlo una vez al crearlo
}`, "cpp", "Car.cpp")}
${nota(`<p>El rozamiento frontal aquí es proporcional a la velocidad (tipo “aire”), lo que hace que el coche frene suave y nunca vibre en cero. También puedes usar el <code>ApplyFriction()</code> de la lección 05 (fricción dinámica constante), o una mezcla. Prueba y elige el tacto que te guste.</p>`)}

<h2>4. Motor, freno y marcha atrás</h2>
${code(String.raw`
// throttle: +1 acelerar, -1 frenar / marcha atrás, 0 nada
void Car::Drive(float throttle)
{
    float speed = GetForwardSpeed();
    float force = 0.0f;

    if (throttle > 0.0f && speed < max_speed)
        force = engine_force;                                   // acelerar hasta la vel. máxima
    else if (throttle < 0.0f && speed > -max_back_speed)
        force = (speed > 0.5f) ? -brake_force : -reverse_force; // si va hacia delante, freno fuerte

    if (force != 0.0f)
        body->body->ApplyForceToCenter(force * GetForward(), true);
}`, "cpp", "Car.cpp")}
<p>Fuerza continua → <code>ApplyForceToCenter</code> cada frame (recuerda: se borra tras cada Step). El límite <code>speed &lt; max_speed</code> hace de “marcha más larga”: el motor deja de empujar al llegar.</p>

<h2>5. Dirección</h2>
<p>Un coche parado no gira, y en marcha atrás el volante funciona al revés. La forma más controlable: fijar la velocidad angular, escalada por la velocidad.</p>
${code(String.raw`
// steer: -1 izquierda, +1 derecha, 0 recto
void Car::Steer(float steer)
{
    float speed = GetForwardSpeed();
    float factor = fminf(fabsf(speed) / 2.5f, 1.0f);   // a baja velocidad gira poco
    if (speed < 0.0f) factor = -factor;                 // marcha atrás: al revés

    if (steer != 0.0f)
        body->body->SetAngularVelocity(steer * turn_speed * factor);
    // si steer == 0, el angular damping endereza el giro poco a poco
}`, "cpp", "Car.cpp")}
${nota(`<p>Alternativa más “física”: <code>ApplyTorque(steer * torque)</code>. Da un tacto más pesado y depende de la masa y la inercia. Para un arcade, <code>SetAngularVelocity</code> es más predecible. En un coche de verdad giran las ruedas delanteras (revolute joints entre ruedas y chasis): el modelo de iforce2d lo hace así, pero es bastante más complejo y no hace falta para el proyecto.</p>`)}

<h2>6. Todo junto en PlayerCar</h2>
${code(String.raw`
void PlayerCar::Update()
{
    float throttle = 0.0f, steer = 0.0f;
    if (IsKeyDown(KEY_UP)   || IsKeyDown(KEY_W)) throttle += 1.0f;
    if (IsKeyDown(KEY_DOWN) || IsKeyDown(KEY_S)) throttle -= 1.0f;
    if (IsKeyDown(KEY_LEFT) || IsKeyDown(KEY_A)) steer -= 1.0f;     // requisito: flechas y/o A D
    if (IsKeyDown(KEY_RIGHT)|| IsKeyDown(KEY_D)) steer += 1.0f;
    handbrake = IsKeyDown(KEY_SPACE);                               // requisito: acción extra con espacio

    UpdateFriction();   // primero el agarre
    Drive(throttle);
    Steer(steer);

    Draw();             // textura centrada y rotada (lección 02)
}`, "cpp", "PlayerCar.cpp")}
${nota(`<p>Estas fuerzas se aplican en <code>ModuleGame::Update()</code>, y el <code>Step()</code> se hace en <code>ModulePhysics::PreUpdate()</code> del frame <em>siguiente</em>. Va bien así: las fuerzas se acumulan hasta el próximo Step. Lo que <strong>no</strong> debes hacer es llamar a Update de los coches dos veces por frame (aplicarías doble fuerza).</p>`, "warn")}

<h2>Valores para empezar</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Parámetro</th><th>Coche 1 × 2 m (≈ 2 kg con densidad 1)</th><th>Efecto</th></tr></thead><tbody>
<tr><td>engine_force</td><td>≈ 30–40 N</td><td>Aceleración</td></tr>
<tr><td>max_speed</td><td>≈ 10–15 m/s</td><td>Velocidad punta (con PPM 50 → 500–750 px/s)</td></tr>
<tr><td>max_lateral_impulse</td><td>≈ 1,5–3 N·s</td><td>Bajo = derrapa mucho; alto = sobre raíles</td></tr>
<tr><td>turn_speed</td><td>≈ 3 rad/s</td><td>Rapidez del giro</td></tr>
<tr><td>drag</td><td>≈ 0,5–1</td><td>Cuánto frena al soltar</td></tr>
</tbody></table></div>
<p>En la demo los valores van “por kg” (se multiplican por la masa) para que no dependan del tamaño del coche. Ajusta los tuyos probando: el tacto del coche es el 50 % de la diversión del proyecto.</p>

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "Si el morro del coche (en la textura) apunta hacia arriba, el forward local es…", o: ["(1, 0)", "(0, -1)", "(0, 1)"], c: 1, e: "En pantalla la Y crece hacia abajo." },
      { p: "v = (3, 4) y right = (1, 0). ¿Velocidad lateral?", o: ["(3, 0)", "(0, 4)", "5"], c: 0, e: "(right·v)·right = 3 · (1, 0)." },
      { p: "¿Por qué se usa un impulso y no una fuerza para el agarre?", o: ["Es más barato", "Para cambiar la velocidad lateral de golpe en este paso", "Box2D no deja aplicar fuerzas laterales"], c: 1, e: "Δv = impulso / masa, inmediato." },
      { p: "¿Qué produce el derrape en este modelo?", o: ["Limitar el impulso lateral máximo", "Poner la masa a 0", "Aumentar la gravedad"], c: 0, e: "Si el impulso necesario supera el máximo, queda velocidad lateral." },
      { p: "El coche gira estando parado. ¿Qué falta?", o: ["Escalar la velocidad angular por la velocidad frontal", "Más fricción", "Un joint"], c: 0, e: "factor = min(|speed| / k, 1)." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#car-cv"), out = root.querySelector("#car-out");
      const q = (id) => root.querySelector(id);
      const sim = B2.mundo(cv, { w: 720, h: 440, ppm: 25, gravedad: [0, 0], debug: false, ratonSiempre: true });
      sim.cadena(0, 0, [4, 4, 4, 436, 716, 436, 716, 4], { datos: { fijo: true, trazo: Curso.color("ink-3") } });
      // conos
      for (let i = 0; i < 7; i++) sim.circulo(160 + i * 70, 140 + (i % 2) * 40, 7, { densidad: 0.3, datos: { dibujar: (ctx, s, b) => { const p = s.pos(b); ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill(); } } });
      for (let i = 0; i < 3; i++) sim.caja(200 + i * 160, 330, 14, 14, { densidad: 2, datos: { dibujar: (ctx, s, b) => { const p = s.pos(b); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.getAngle()); ctx.fillStyle = "#a16207"; ctx.fillRect(-14, -14, 28, 28); ctx.strokeStyle = "#713f12"; ctx.strokeRect(-12, -12, 24, 24); ctx.restore(); } } });
      const car = B2.crearCoche(sim, 90, 360, 0, { color: "#e5533d" });
      const keys = Curso.teclado(cv);
      const marcas = [];
      sim.fondo = (ctx) => {
        ctx.fillStyle = "#4a4d57"; ctx.fillRect(0, 0, 720, 440);
        ctx.strokeStyle = "rgba(255,255,255,.08)"; for (let x = 0; x < 720; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 440); ctx.stroke(); }
        ctx.fillStyle = "rgba(15,15,15,.35)"; marcas.forEach((m) => ctx.fillRect(m.x - 1.5, m.y - 1.5, 3, 3));
      };
      sim.onPaso(() => {
        car.engine_force = +q("#car-eng").value; car.max_speed = +q("#car-max").value;
        car.max_lateral_impulse = +q("#car-lat").value; car.turn_speed = +q("#car-turn").value;
        car.grip = q("#car-grip").checked ? 1 : 0;
        let th = 0, st = 0;
        if (keys.has("KeyW") || keys.has("ArrowUp")) th += 1;
        if (keys.has("KeyS") || keys.has("ArrowDown")) th -= 1;
        if (keys.has("KeyA") || keys.has("ArrowLeft")) st -= 1;
        if (keys.has("KeyD") || keys.has("ArrowRight")) st += 1;
        car.handbrake = keys.has("Space");
        car.updateGrip(); car.drive(th); car.steer(st);
        if (car.drifting || (!car.grip && car.lateralVel().length() > 1)) {
          const p = car.body.getPosition(), r = car.right(), f = car.forward();
          [-1, 1].forEach((s) => marcas.push({ x: (p.x + r.x * 0.35 * s - f.x * 0.45) * 25, y: (p.y + r.y * 0.35 * s - f.y * 0.45) * 25 }));
          if (marcas.length > 1500) marcas.splice(0, 200);
        }
      });
      sim.onDibujo((ctx) => {
        sim.debug = q("#car-dbg").checked;
        const p = sim.pos(car.body), f = car.forward(), v = car.body.getLinearVelocity(), lat = car.lateralVel();
        if (q("#car-vec").checked) {
          const flecha = (dx, dy, col, k) => { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dx * k, p.y + dy * k); ctx.stroke(); ctx.lineWidth = 1; };
          flecha(f.x, f.y, "#3b82f6", 40); flecha(v.x, v.y, "#22c55e", 8); flecha(lat.x, lat.y, "#ef4444", 8);
        }
        if (document.activeElement !== cv) sim.texto("Haz clic aquí para conducir", 270, 30, "#fff", 14);
        const s = car.forwardSpeed();
        out.innerHTML = `<span>velocidad frontal <b>${s.toFixed(1)} m/s</b> (${Math.round(Math.abs(s) * 3.6)} km/h)</span><span>lateral <b>${lat.length().toFixed(2)} m/s</b></span><span>${car.drifting ? "<b style='color:#ef4444'>DERRAPANDO</b>" : "agarre ok"}</span><span>freno de mano <b>${car.handbrake ? "sí" : "no"}</b></span><span>masa <b>${car.body.getMass().toFixed(2)} kg</b></span>`;
      });
      setTimeout(() => {}, 0);
    }
  });
})();
