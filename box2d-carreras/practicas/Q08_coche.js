Curso.practica({
  leccion: "b08",
  titulo: "Programa la clase Car",
  intro: "Escribirás la física completa del coche: direcciones, velocidad lateral, agarre con derrape, motor, dirección y el control del jugador.",
  pasos: [
    {
      t: "¿Hacia dónde mira el morro?",
      exp: `<p>La textura del coche apunta hacia arriba. Convierte esa dirección local a dirección del mundo.</p>`,
      code: String.raw`
b2Vec2 Car::GetForward() const
{
    return body->body->GetWorldVector(b2Vec2(§s1§, §s2§));
}`,
      slots: {
        s1: { ok: [/^0(\.0*)?f?$/], w: 6, sol: "0.0f" },
        s2: { ok: [/^-1(\.0*)?f?$/], err: [[/^1(\.0*)?f?$/, "En pantalla la Y crece hacia ABAJO: arriba es −1."]], w: 6, sol: "-1.0f" }
      },
      pistas: ["Arriba en pantalla = Y negativa."],
      bien: "<p>GetWorldVector rota la dirección según el ángulo del body (sin sumar la posición).</p>"
    },
    {
      t: "La velocidad lateral",
      exp: `<p>Escribe el cuerpo de <code>GetLateralVelocity()</code>: obtén el vector derecha (<code>GetWorldVector(b2Vec2(1.0f, 0.0f))</code>) y proyecta la velocidad sobre él con el producto escalar.</p>`,
      escribe: {
        antes: "b2Vec2 Car::GetLateralVelocity() const\n{",
        despues: "}",
        filas: 3,
        checks: [
          [/b2Vec2right=body->body->GetWorldVector\(b2Vec2\(1(\.0*f?)?,0(\.0*f?)?\)\);/, "Vector derecha: <code>b2Vec2 right = body-&gt;body-&gt;GetWorldVector(b2Vec2(1.0f, 0.0f));</code>"],
          [/returnb2Dot\(right,body->body->GetLinearVelocity\(\)\)\*right;/, "Proyección: <code>return b2Dot(right, body-&gt;body-&gt;GetLinearVelocity()) * right;</code>"]
        ],
        sol: String.raw`    b2Vec2 right = body->body->GetWorldVector(b2Vec2(1.0f, 0.0f));
    return b2Dot(right, body->body->GetLinearVelocity()) * right;`
      },
      pistas: ["(right · v) · right", "b2Dot devuelve un float; float * b2Vec2 da un b2Vec2."],
      bien: "<p>Si devolvieras solo el b2Dot tendrías la rapidez lateral (un número); multiplicando por right obtienes el vector.</p>"
    },
    {
      t: "El impulso de agarre",
      exp: `<p>Para anular la velocidad lateral de golpe: impulso = masa × (−velocidad lateral). Y se aplica en el centro de masas.</p>`,
      code: String.raw`
b2Vec2 impulse = §s1§ * -GetLateralVelocity();
...
b->§s2§(impulse, b->GetWorldCenter(), true);`,
      slots: {
        s1: { ok: ["b->GetMass()"], err: [[/^b->GetInertia\(\)$/, "La inercia es para giros. Para velocidad lineal: la masa."]], w: 14 },
        s2: { ok: ["ApplyLinearImpulse"], err: [[/^ApplyForceToCenter$/, "Una fuerza tardaría varios frames. Para cambiar la velocidad YA: un impulso."]], w: 20 }
      },
      pistas: ["Δv = impulso / masa → impulso = masa · Δv."],
      bien: ""
    },
    {
      t: "Derrapar: limitar el impulso",
      exp: `<p>Antes de aplicarlo: si <code>impulse.Length()</code> supera <code>max_impulse</code>, escálalo para que mida exactamente <code>max_impulse</code> y marca <code>drifting = true</code>; si no, <code>drifting = false</code>.</p>`,
      escribe: {
        filas: 7,
        checks: [
          [/if\(impulse\.Length\(\)>max_impulse\)/, "Condición: <code>if (impulse.Length() &gt; max_impulse)</code>"],
          [/impulse\*=max_impulse\/impulse\.Length\(\);/, "Escala: <code>impulse *= max_impulse / impulse.Length();</code>"],
          [/drifting=true;/, "Dentro: <code>drifting = true;</code>"],
          [/elsedrifting=false;|else\{drifting=false;\}/, "Si no: <code>else drifting = false;</code>"]
        ],
        sol: String.raw`if (impulse.Length() > max_impulse)
{
    impulse *= max_impulse / impulse.Length();
    drifting = true;
}
else drifting = false;`
      },
      pistas: ["Multiplicar un vector por (máx / longitud) lo deja con longitud máx sin cambiar su dirección."],
      bien: "<p>Con <code>drifting</code> puedes reproducir el sonido de derrape y dibujar marcas de neumático.</p>"
    },
    {
      t: "El motor",
      exp: `<p>Escribe la parte de acelerar de <code>Drive(throttle)</code>: si <code>throttle &gt; 0</code> y la velocidad frontal (<code>GetForwardSpeed()</code>) es menor que <code>max_speed</code>, aplica <code>engine_force</code> en la dirección del morro.</p>`,
      escribe: {
        antes: "void Car::Drive(float throttle)\n{\n    float speed = GetForwardSpeed();",
        despues: "    // (marcha atrás y freno: igual con el signo contrario)\n}",
        filas: 3,
        checks: [
          [/if\(throttle>0(\.0*f?)?&&speed<max_speed\)/, "Condición: <code>if (throttle &gt; 0.0f &amp;&amp; speed &lt; max_speed)</code>"],
          [/body->body->ApplyForceToCenter\(engine_force\*GetForward\(\),true\);/, "Empuje: <code>body-&gt;body-&gt;ApplyForceToCenter(engine_force * GetForward(), true);</code>"]
        ],
        prohibido: [[/\*dt|\*GetFrameTime/, "No multipliques la fuerza por dt: Box2D ya integra con su paso fijo."]],
        sol: String.raw`    if (throttle > 0.0f && speed < max_speed)
        body->body->ApplyForceToCenter(engine_force * GetForward(), true);`
      },
      pistas: ["Fuerza continua → ApplyForceToCenter, todos los frames."],
      bien: ""
    },
    {
      t: "La dirección",
      exp: `<p>Escala el giro por la velocidad (parado no gira) e inviértelo en marcha atrás.</p>`,
      code: String.raw`
float speed = GetForwardSpeed();
float factor = fminf(fabsf(speed) / 2.5f, 1.0f);
if (speed < 0.0f) factor = §s1§;
if (steer != 0.0f)
    body->body->§s2§(steer * turn_speed * factor);`,
      slots: { s1: { ok: ["-factor"], w: 8 }, s2: { ok: ["SetAngularVelocity"], err: [[/^SetLinearVelocity$/, "Lineal es desplazarse; para girar: velocidad ANGULAR."]], w: 20 } },
      pistas: ["Marcha atrás: el volante al revés.", "Velocidad de giro = angular."],
      bien: "<p>El angular damping (<code>SetAngularDamping(3.0f)</code>) endereza el coche cuando sueltas.</p>"
    },
    {
      t: "PlayerCar: el teclado",
      exp: `<p>Lee el giro con flechas o A/D (requisito del proyecto) y el freno de mano con Espacio (la acción extra). Escribe las tres líneas para <code>steer</code> (izquierda resta, derecha suma) y <code>handbrake</code>.</p>`,
      escribe: {
        antes: "void PlayerCar::Update()\n{\n    float throttle = 0.0f, steer = 0.0f;\n    if (IsKeyDown(KEY_UP) || IsKeyDown(KEY_W)) throttle += 1.0f;\n    if (IsKeyDown(KEY_DOWN) || IsKeyDown(KEY_S)) throttle -= 1.0f;",
        despues: "    UpdateFriction();\n    Drive(throttle);\n    Steer(steer);\n    Draw();\n}",
        filas: 4,
        checks: [
          [/if\(IsKeyDown\(KEY_LEFT\)\|\|IsKeyDown\(KEY_A\)\)steer-=1(\.0*f?)?;|if\(IsKeyDown\(KEY_A\)\|\|IsKeyDown\(KEY_LEFT\)\)steer-=1(\.0*f?)?;/, "Izquierda: <code>if (IsKeyDown(KEY_LEFT) || IsKeyDown(KEY_A)) steer -= 1.0f;</code>"],
          [/if\(IsKeyDown\(KEY_RIGHT\)\|\|IsKeyDown\(KEY_D\)\)steer\+=1(\.0*f?)?;|if\(IsKeyDown\(KEY_D\)\|\|IsKeyDown\(KEY_RIGHT\)\)steer\+=1(\.0*f?)?;/, "Derecha: <code>if (IsKeyDown(KEY_RIGHT) || IsKeyDown(KEY_D)) steer += 1.0f;</code>"],
          [/handbrake=IsKeyDown\(KEY_SPACE\);/, "Freno de mano: <code>handbrake = IsKeyDown(KEY_SPACE);</code>"]
        ],
        prohibido: [[/IsKeyPressed\(KEY_(LEFT|RIGHT|A|D)\)/, "IsKeyPressed solo es true un frame. Para girar mientras mantienes: IsKeyDown."]],
        sol: String.raw`    if (IsKeyDown(KEY_LEFT)  || IsKeyDown(KEY_A)) steer -= 1.0f;
    if (IsKeyDown(KEY_RIGHT) || IsKeyDown(KEY_D)) steer += 1.0f;
    handbrake = IsKeyDown(KEY_SPACE);`
      },
      pistas: ["Copia el patrón de throttle.", "En Raylib: IsKeyDown = mantenida."],
      bien: "<p>Ya tienes un coche jugable. Ajusta los números en el banco de pruebas de arriba hasta que te guste el tacto, y cópialos a tu clase.</p>"
    }
  ]
});
