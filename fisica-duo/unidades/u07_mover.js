(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "mover", titulo: "Mover cuerpos: fuerzas, impulsos y vectores", icono: "F→",
    desc: "SetLinearVelocity, ApplyForce, ApplyLinearImpulse, torque, damping, b2Vec2, b2Dot y GetWorldVector.",
    chuleta: [
      ["Tres formas de mover", "```b->SetLinearVelocity(b2Vec2(3, 0));                 // fija la velocidad YA\nb->ApplyForceToCenter(b2Vec2(10, 0), true);         // empuje continuo: aplícalo CADA frame\nb->ApplyLinearImpulse(b2Vec2(5, 0), b->GetWorldCenter(), true);   // golpe instantáneo (Δv = I / m)```"],
      ["Girar", "```b->SetAngularVelocity(2.0f);          // rad/s\nb->ApplyTorque(5.0f, true);            // fuerza de giro continua\nb->SetAngularDamping(3.0f);            // rozamiento al giro```"],
      ["Vectores", "```b2Vec2 v(3, 4);\nv.Length();                 // 5\nv.Normalize();              // ahora mide 1 (misma dirección)\nb2Dot(a, b);                // cuánto de b va en la dirección de a\nb2Vec2 f = b->GetWorldVector(b2Vec2(0, -1));   // el 'arriba' del cuerpo, girado con él\nb2Vec2 local = b->GetLocalPoint(punto);        // un punto visto desde el cuerpo```"],
      ["Teletransportar", "```b->SetTransform(b2Vec2(x, y), angle);\nb->SetLinearVelocity(b2Vec2_zero);\nb->SetAngularVelocity(0);\nb->SetAwake(true);```"]
    ],
    preguntas: [
      test("Aplicas `ApplyForceToCenter` una sola vez y el coche apenas se mueve. ¿Por qué?", ["La fuerza es pequeña", "Las fuerzas se borran tras cada Step: hay que aplicarlas cada frame", "Falta SetAwake", "Es estático"], 1, "Una fuerza dura un paso. Para un empujón único se usa un impulso.", { nuevo: true }),
      test("¿Cuál usarías para el salto o el nitro instantáneo?", ["ApplyForceToCenter", "ApplyLinearImpulse", "SetTransform", "ApplyTorque"], 1, "Un impulso cambia la velocidad al instante: Δv = impulso / masa."),
      test("¿Cuál usarías para el motor del coche (empuje mientras aceleras)?", ["ApplyLinearImpulse una vez", "ApplyForceToCenter cada frame mientras se pulsa", "SetTransform", "SetAngularVelocity"], 1, "Fuerza continua aplicada en cada Update."),
      huecos("Empuja el coche hacia delante con la fuerza del motor.", String.raw`b2Vec2 forward = b->▢(b2Vec2(0.0f, -1.0f));
b->▢(engine_force * forward, true);`, ["GetWorldVector", "ApplyForceToCenter", "GetWorldPoint", "SetTransform", "ApplyTorque"], ["GetWorldVector", "ApplyForceToCenter"],
        "GetWorldVector gira la dirección local del morro con el coche; luego se empuja en esa dirección.", { nuevo: true }),
      test("¿Qué diferencia hay entre `GetWorldVector` y `GetWorldPoint`?", ["Ninguna", "Vector solo gira una dirección; Point gira y además suma la posición del cuerpo", "Point es más rápido", "Vector da píxeles"], 1, "Dirección del morro → GetWorldVector. Posición de una rueda en el mundo → GetWorldPoint."),
      test("¿Cuánto vale `b2Vec2(3, 4).Length()`?", ["7", "5", "12", "25"], 1, "√(3² + 4²) = 5."),
      test("¿Qué hace `Normalize()` sobre un vector?", ["Lo pone a cero", "Lo deja con longitud 1 manteniendo la dirección", "Lo invierte", "Lo redondea"], 1, "Útil para tener solo la dirección y multiplicarla luego por la fuerza que quieras."),
      test("`b2Dot(a, b)` con a = (1, 0) y b = (3, 4) vale…", ["3", "4", "5", "7"], 0, "1·3 + 0·4 = 3: la parte de b que va en la dirección de a.", { nuevo: true }),
      escribe("Escribe la velocidad hacia delante (float): el producto escalar del vector `forward` con la velocidad lineal del cuerpo `b`.", ["b2Dot(forward, b->GetLinearVelocity())", "b2Dot(b->GetLinearVelocity(), forward)"],
        "Positivo: avanza. Negativo: marcha atrás.", { ph: "b2Dot(..." }),
      test("Quieres que el coche deje de girar como una peonza tras un choque. ¿Qué usas?", ["SetLinearDamping", "SetAngularDamping", "ApplyTorque", "SetBullet"], 1, "El damping angular frena el giro poco a poco."),
      huecos("Lleva el coche a la parrilla sin velocidad.", String.raw`b->▢(b2Vec2(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y)), angle);
b->SetLinearVelocity(▢);
b->SetAngularVelocity(0.0f);
b->▢(true);`, ["SetTransform", "b2Vec2_zero", "SetAwake", "SetPosition", "ApplyForce", "nullptr"], ["SetTransform", "b2Vec2_zero", "SetAwake"],
        "SetAwake: un cuerpo dormido teletransportado podría quedarse quieto. SetTransform es para teletransportes puntuales, no cada frame."),
      bug("El coche atraviesa los muros. ¿Qué línea es la culpable?", [
        "void Car::Update()",
        "{",
        "    b2Vec2 p = body->body->GetPosition();",
        "    p += speed * PHYSICS_DT * GetForward();",
        "    body->body->SetTransform(p, body->body->GetAngle());",
        "}"], 4, "Mover con SetTransform cada frame es teletransportar: Box2D no resuelve los choques. Mueve con fuerzas, impulsos o SetLinearVelocity."),
      test("¿Debes multiplicar por `dt` la velocidad que le pasas a `SetLinearVelocity`?", ["Sí, siempre", "No: ya está en m/s y Box2D integra con su paso fijo", "Solo a 30 fps", "Solo en vista cenital"], 1, "dt solo para lo tuyo (timers, animaciones)."),
      test("Quieres que el coche gire a 3 rad/s. ¿Qué es más directo y predecible para un arcade?", ["ApplyTorque(3)", "SetAngularVelocity(3.0f)", "SetTransform con el ángulo + 3", "ApplyForce lateral"], 1, "SetAngularVelocity fija el giro; ApplyTorque da un tacto más “pesado” que depende de la inercia."),
      escribe("Escribe el impulso (b2Vec2) que hace que un cuerpo de masa `m` gane 4 m/s hacia la derecha.", ["b2Vec2(4 * m, 0)", "b2Vec2(m * 4, 0)", "b2Vec2(4.0f * m, 0.0f)", "b2Vec2(m*4.0f,0.0f)", "m * b2Vec2(4, 0)", "m*b2Vec2(4.0f,0.0f)"],
        "Impulso = masa × cambio de velocidad.", { ph: "b2Vec2(..." }),
      orden("Mueve en horizontal conservando la velocidad vertical (side-view, A/D).", [
        "b2Vec2 v = b->GetLinearVelocity();",
        "v.x = 0.0f;",
        "if (IsKeyDown(KEY_A)) v.x = -speed;",
        "if (IsKeyDown(KEY_D)) v.x = speed;",
        "b->SetLinearVelocity(v);"], "Se lee primero para no pisar la Y (gravedad, salto)."),
      test("¿Para qué sirve `SetBullet(true)` (o `bodyDef.bullet = true`)?", ["Para disparar", "Detección continua de colisiones entre cuerpos dinámicos rápidos (evita que se atraviesen)", "Para que no rote", "Para hacerlo sensor"], 1, "Para coches muy rápidos chocando entre sí."),
      test("`b->GetLocalPoint(goal)` devuelve (2, -5). Si el morro es (0, -1), el objetivo está…", ["detrás a la izquierda", "delante a la derecha", "justo detrás", "a la izquierda"], 1, "x > 0: a la derecha; y < 0: delante. Es la base de la IA.")
    ]
  });
})();
