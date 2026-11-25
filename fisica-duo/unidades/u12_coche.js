(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "coche", titulo: "La física del coche", icono: "🏎",
    desc: "Vectores del coche, velocidad lateral, agarre con impulsos, derrape, motor, freno, dirección, freno de mano, nitro y superficies.",
    chuleta: [
      ["El modelo", "```b2Vec2 Car::GetForward() const { return body->body->GetWorldVector(b2Vec2(0.0f, -1.0f)); }\nb2Vec2 Car::GetRight() const   { return body->body->GetWorldVector(b2Vec2(1.0f, 0.0f)); }\nb2Vec2 Car::GetLateralVelocity() const { b2Vec2 r = GetRight(); return b2Dot(r, body->body->GetLinearVelocity()) * r; }\nfloat Car::GetForwardSpeed() const { return b2Dot(GetForward(), body->body->GetLinearVelocity()); }```"],
      ["Agarre y derrape", "```b2Vec2 impulse = b->GetMass() * -GetLateralVelocity();\nfloat max = b->GetMass() * max_lateral_dv;\nif (handbrake) max *= 0.25f;\nif (impulse.Length() > max) { impulse *= max / impulse.Length(); drifting = true; } else drifting = false;\nb->ApplyLinearImpulse(impulse, b->GetWorldCenter(), true);```"],
      ["Motor y dirección", "```// motor\nif (throttle > 0 && speed < max_speed) b->ApplyForceToCenter(engine_accel * b->GetMass() * GetForward(), true);\n// dirección: parado no gira; marcha atrás al revés\nfloat factor = fminf(fabsf(speed) / 2.5f, 1.0f);\nif (speed < 0) factor = -factor;\nif (steer != 0) b->SetAngularVelocity(steer * turn_speed * factor);```"]
    ],
    preguntas: [
      test("Una caja empujada hacia su morro y girada sigue deslizándose en la dirección vieja. ¿Qué falta?", ["Más motor", "Cancelar la velocidad lateral (agarre de los neumáticos)", "Gravedad", "Un joint"], 1, "Un neumático rueda fácil hacia delante y casi no se deja mover de lado.", { nuevo: true }),
      escribe("Escribe el vector forward del coche si su textura mira hacia arriba (cuerpo `b`).", ["b->GetWorldVector(b2Vec2(0.0f, -1.0f))", "b->GetWorldVector(b2Vec2(0,-1))", "b->GetWorldVector(b2Vec2(0.0f,-1))"], "En pantalla la Y crece hacia abajo: arriba es -1.", { ph: "b->GetWorldVector(..." }),
      huecos("Velocidad lateral del coche.", String.raw`b2Vec2 right = GetRight();
return ▢(right, body->body->GetLinearVelocity()) * ▢;`, ["b2Dot", "right", "b2Cross", "forward", "Length"], ["b2Dot", "right"], "Proyección: (right · v) · right."),
      test("v = (4, 3) y right = (0, 1). ¿Rapidez lateral?", ["4", "3", "5", "7"], 1, "b2Dot((0,1), (4,3)) = 3."),
      huecos("El impulso que anula la velocidad lateral.", String.raw`b2Vec2 impulse = b->▢() * -GetLateralVelocity();
b->ApplyLinearImpulse(impulse, b->▢(), true);`, ["GetMass", "GetWorldCenter", "GetInertia", "GetPosition", "GetLocalCenter"], ["GetMass", "GetWorldCenter"], "Impulso = masa × cambio de velocidad, aplicado en el centro de masas."),
      test("¿Qué produce el derrape en este modelo?", ["Bajar la masa", "Limitar el impulso lateral máximo: si hace falta más, queda velocidad lateral", "Subir la gravedad", "El damping"], 1, ""),
      orden("Ordena el agarre con derrape.", [
        "b2Vec2 impulse = b->GetMass() * -GetLateralVelocity();",
        "float max_impulse = b->GetMass() * max_lateral_dv;",
        "if (handbrake) max_impulse *= 0.25f;",
        "if (impulse.Length() > max_impulse) impulse *= max_impulse / impulse.Length();",
        "b->ApplyLinearImpulse(impulse, b->GetWorldCenter(), true);"], "Calcular, limitar (menos con freno de mano), aplicar."),
      test("¿Por qué se usa un impulso y no una fuerza para el agarre?", ["Es más barato", "Para cambiar la velocidad lateral ya, en este paso", "Box2D no deja fuerzas laterales", "Da igual"], 1, ""),
      huecos("El motor solo empuja hasta la velocidad máxima.", String.raw`float speed = GetForwardSpeed();
if (throttle > 0.0f ▢ speed ▢ max_speed)
    b->ApplyForceToCenter(engine_force * GetForward(), true);`, ["&&", "<", "||", ">", "=="], ["&&", "<"], ""),
      test("El jugador pulsa frenar yendo hacia delante a 6 m/s. ¿Qué debería pasar?", ["Marcha atrás suave", "Freno fuerte (fuerza hacia atrás grande) hasta casi pararse; después marcha atrás suave", "Nada", "Se para en seco"], 1, "`accel = (speed > 0.5f) ? -brake_accel : -reverse_accel;`"),
      bug("El coche gira estando parado. ¿Qué línea hay que cambiar?", [
        "void Car::Steer(float steer)",
        "{",
        "    if (steer != 0.0f)",
        "        b->SetAngularVelocity(steer * turn_speed);",
        "}"], 3, "Falta escalar por la velocidad: `steer * turn_speed * factor`, con factor = min(|speed| / 2.5, 1) y negativo marcha atrás."),
      escribe("Escribe el factor de giro (float) que vale 0 parado y 1 a partir de 2.5 m/s, usando `speed`, `fabsf` y `fminf`.", [/^fminf\(fabsf\(speed\)\/2\.5f?,1(\.0f?)?\)$/, /^fminf\(1(\.0f?)?,fabsf\(speed\)\/2\.5f?\)$/],
        "`fminf(fabsf(speed) / 2.5f, 1.0f)`. Luego, si speed < 0, se invierte.", { sol: "fminf(fabsf(speed) / 2.5f, 1.0f)", ph: "fminf(..." }),
      test("Marcha atrás, el volante debe…", ["funcionar igual", "funcionar al revés (como en un coche real)", "bloquearse", "girar el doble"], 1, "Por eso el factor se hace negativo si la velocidad frontal es negativa."),
      test("¿Cómo implementas el freno de mano (acción extra con espacio)?", ["Subiendo la masa", "Reduciendo mucho el impulso lateral máximo mientras se pulsa: el coche derrapa", "Parando el coche", "Con un joint"], 1, "`handbrake = IsKeyDown(KEY_SPACE);` y `if (handbrake) max_impulse *= 0.25f;`"),
      orden("Nitro: un segundo de turbo con 5 segundos de recarga.", [
        "if (!nitro_ready && nitro_timer.ReadSec() >= 5.0) nitro_ready = true;",
        "if (IsKeyPressed(KEY_SPACE) && nitro_ready)",
        "{",
        "    boost_time = 1.0f;",
        "    nitro_ready = false;",
        "    nitro_timer.Start();",
        "}"], "En Drive: `if (boost_time > 0) { boost_time -= PHYSICS_DT; accel += boost_accel; }`."),
      test("El coche pasa por una mancha de aceite. ¿Qué cambias mientras está dentro?", ["La masa", "Bajas mucho el impulso lateral máximo (patina)", "La gravedad", "Lo destruyes"], 1, "Con un contador in_oil (Begin +1, End -1) y `if (in_oil > 0) max_impulse *= 0.15f;`"),
      test("¿En qué orden se llaman en Car::Update?", ["Draw, Drive, Steer", "Control (input/IA) → UpdateFriction → Drive → Steer", "Steer, Draw, Control", "Da igual"], 1, "Decidir, quitar lo lateral, empujar y girar."),
      test("¿Por qué el motor multiplica por la masa (`engine_accel * mass`)?", ["Por obligación", "Así el valor es una aceleración y el coche se siente igual aunque cambies su tamaño", "Para que pese más", "No hace falta nunca"], 1, "F = m · a."),
      bug("El coche sale disparado a velocidad absurda a 144 fps y lento a 30. ¿Qué línea?", [
        "float accel = engine_accel;",
        "if (throttle > 0.0f)",
        "    b->ApplyForceToCenter(accel * b->GetMass() * GetForward() * GetFrameTime() * 60.0f, true);"], 2, "No mezcles el tiempo del frame con las fuerzas: Box2D integra con su paso fijo. La fuerza va sin dt. (Y la física debe ir a 60 Hz fijos: SetTargetFPS(60) o acumulador)."),
      test("¿Qué indica `drifting = true`?", ["Que el coche está parado", "Que el impulso lateral se ha recortado: el coche derrapa", "Que va marcha atrás", "Que está en el aire"], 1, "Úsalo para el sonido de derrape y las marcas de neumáticos.")
    ]
  });
})();
