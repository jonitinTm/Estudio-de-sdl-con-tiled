(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "friccion", titulo: "Fricción a medida (vista cenital)", icono: "μ",
    desc: "Por qué Box2D no frena tu coche desde arriba, fuerza normal, fricción estática y dinámica, y ApplyFriction.",
    chuleta: [
      ["Fórmulas", "Normal: `N = m · g` (g = GRAVITY_Z = 9,8).\nEstática (parado): aguanta mientras `|F| ≤ μs · N`.\nDinámica (deslizando): `f = μk · N` en contra de la velocidad.\nArrastre (aire/rodadura): `f = -k · v`."],
      ["ApplyFriction (resumen)", "```float N = b->GetMass() * GRAVITY_Z;\nb2Vec2 v = b->GetLinearVelocity();\nif (v.Length() < 0.01f && applied.Length() <= us * N) { b->ApplyForceToCenter(-applied, true); return; }\nb2Vec2 dir = (v.Length() < 0.01f) ? applied : v;\ndir.Normalize();\nb2Vec2 f = -uk * N * dir;\nb2Vec2 next = v + (PHYSICS_DT / b->GetMass()) * (applied + f);\nif (b2Dot(next, dir) <= 0) { b->SetLinearVelocity(b2Vec2_zero); b->ApplyForceToCenter(-applied, true); return; }\nb->ApplyForceToCenter(f, true);```"]
    ],
    preguntas: [
      test("¿Por qué la `friction` de las fixtures no frena a tu coche contra el asfalto en vista cenital?", ["Porque vale 0", "Porque solo actúa entre dos fixtures que se tocan, y el suelo no es un cuerpo", "Por la gravedad", "Sí lo frena"], 1, "Hay que aplicar la fricción a mano como una fuerza.", { nuevo: true }),
      escribe("Escribe la fuerza normal `N` de un cuerpo `b` con la macro `GRAVITY_Z`.", ["b->GetMass() * GRAVITY_Z", "GRAVITY_Z * b->GetMass()"], "N = m · g.", { ph: "b->GetMass() ..." }),
      test("Empujas con 50 N. μs = 0,5 y g = 10. ¿Desde qué masa la bola no se mueve?", ["5 kg", "10 kg", "25 kg", "100 kg"], 1, "50 ≤ 0,5 · m · 10 → m ≥ 10 kg."),
      test("¿Hacia dónde apunta la fricción dinámica?", ["Hacia la fuerza aplicada", "En contra de la velocidad", "Hacia abajo", "Hacia el centro"], 1, ""),
      huecos("La fricción dinámica.", String.raw`b2Vec2 dir = velocity;
dir.▢();
b2Vec2 friction = ▢ * normal * dir;
b->ApplyForceToCenter(friction, true);`, ["Normalize", "-dynamic_friction", "dynamic_friction", "Length", "static_friction"], ["Normalize", "-dynamic_friction"], "Dirección unitaria del movimiento, con el signo menos para ir en contra."),
      test("¿Qué evita la comprobación `b2Dot(next_velocity, direction) <= 0`?", ["La división por cero", "Que la fricción haga que el cuerpo tiemble alrededor de cero (empujándolo hacia atrás)", "El tunneling", "Nada"], 1, "La fricción frena, nunca empuja hacia atrás: si el próximo paso invertiría el sentido, se para en seco."),
      test("Un coche de 2 kg con motor de 30 N y arrastre `-3·v`. ¿Velocidad punta?", ["5 m/s", "10 m/s", "15 m/s", "30 m/s"], 1, "Se equilibra cuando 30 = 3 · v → v = 10 m/s.", { nuevo: true }),
      huecos("Arrastre proporcional a la velocidad hacia delante.", String.raw`float speed = b2Dot(forward, b->GetLinearVelocity());
b->ApplyForceToCenter(▢ * drag * speed * forward, true);`, ["-1.0f", "1.0f", "0.0f", "speed"], ["-1.0f"], "En contra de la marcha. Hace que el coche frene suave al soltar y nunca vibre."),
      test("Quieres que el coche frene más en la hierba. ¿Qué cambias?", ["La masa", "El coeficiente de fricción/arrastre de ese coche mientras está en un sensor de hierba", "La gravedad", "El Step"], 1, "Guarda los coeficientes por coche, no globales."),
      orden("Bucle del juego para una bola empujada con fricción (Handout 05).", [
        "for (Ball* ball : balls)",
        "{",
        "    b2Vec2 force(Ball::push_force, 0.0f);",
        "    ball->body->body->ApplyForceToCenter(force, true);",
        "    App->physics->ApplyFriction(ball->body, force);",
        "}"], "Primero la fuerza, luego la fricción (que necesita saber la fuerza aplicada para el caso estático)."),
      test("Un coche que gira sigue girando para siempre en vista cenital. ¿Solución sencilla?", ["Más masa", "SetAngularDamping (fricción angular)", "Más fricción lineal", "Un sensor"], 1, ""),
      bug("La bola tiembla en vez de pararse. ¿Qué línea causa el problema?", [
        "b2Vec2 friction = -dynamic_friction * normal * direction;",
        "b->ApplyForceToCenter(friction, true);",
        "// (no hay más código)"], 1, "Se aplica la fricción sin comprobar si invertiría el sentido. Falta la comprobación con `b2Dot(next_velocity, direction) <= 0` antes."),
      test("¿Qué es `mass = density × area` útil para?", ["Calcular la densidad necesaria para que una bola pese lo que tú quieres", "Calcular la velocidad", "El rozamiento", "Nada"], 0, "Box2D no deja fijar la masa directamente: despejas la densidad. `density = mass / (b2_pi * r * r)`.")
    ]
  });
})();
