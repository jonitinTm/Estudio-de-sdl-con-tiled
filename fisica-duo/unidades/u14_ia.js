(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "ia", titulo: "IA de los rivales", icono: "AI",
    desc: "Waypoints, GetLocalPoint + atan2f, control proporcional, frenar en curvas, rayos anti-muro y rubber banding.",
    chuleta: [
      ["El cerebro", "```b2Vec2 goal(PIXEL_TO_METERS(wp[target].x), PIXEL_TO_METERS(wp[target].y));\nif ((goal - b->GetPosition()).Length() < 2.2f) target = (target + 1) % WAYPOINT_COUNT;\nb2Vec2 local = b->GetLocalPoint(goal);\nfloat angle = atan2f(local.x, -local.y);   // 0 = recto, + = derecha\nsteer = angle * 2.0f;                      // control proporcional\nif (steer > 1) steer = 1; if (steer < -1) steer = -1;\nthrottle = (fabsf(angle) > 0.6f) ? 0.4f : 1.0f;```"],
      ["Rubber banding", "```max_speed = base * (Progress(this) > Progress(player) ? 0.92f : 1.08f);```"]
    ],
    preguntas: [
      test("¿Qué es un waypoint?", ["Un tipo de joint", "Un punto de la trazada que la IA sigue en orden", "Un sensor", "Un checkpoint"], 1, "", { nuevo: true }),
      huecos("Pasar al siguiente waypoint al llegar.", String.raw`if ((goal - b->GetPosition()).▢() < 2.2f)
    target = (target + 1) ▢ WAYPOINT_COUNT;`, ["Length", "%", "Normalize", "/", "+"], ["Length", "%"], ""),
      test("¿Qué devuelve `b->GetLocalPoint(goal)`?", ["La distancia", "El objetivo visto desde el coche: x a su derecha, y hacia su cola (−y = delante)", "La posición del coche", "Un ángulo"], 1, ""),
      test("local = (−3, −4). El objetivo está…", ["delante a la izquierda", "delante a la derecha", "detrás", "justo delante"], 0, "x < 0 izquierda; y < 0 delante."),
      escribe("Escribe el ángulo hacia el objetivo con atan2f usando `local` (0 = recto, positivo = derecha; el morro es −y).", ["atan2f(local.x, -local.y)"], "atan2(lateral, frontal).", { ph: "atan2f(..." }),
      test("atan2f(1, 1) en grados vale…", ["0°", "45°", "90°", "135°"], 1, ""),
      orden("Ordena el Control de AICar.", [
        "b2Vec2 local = b->GetLocalPoint(goal);",
        "float angle = atan2f(local.x, -local.y);",
        "steer = angle * 2.0f;",
        "if (steer > 1.0f) steer = 1.0f;",
        "if (steer < -1.0f) steer = -1.0f;",
        "throttle = (fabsf(angle) > 0.6f) ? 0.4f : 1.0f;"], "Objetivo en local → ángulo → volante proporcional limitado → menos gas en curvas cerradas."),
      test("El rival hace zigzag en las rectas. ¿Qué ajustas primero?", ["La masa", "Bajar la ganancia (el 2.0f) o apuntar a un waypoint más adelantado", "La gravedad", "El filtro"], 1, "Controlador proporcional demasiado agresivo."),
      test("El rival se queda orbitando un waypoint sin “llegar” nunca. ¿Causa?", ["El radio de llegada es demasiado pequeño para su velocidad y giro", "Falta un joint", "El waypoint es estático", "La IA es demasiado lista"], 0, ""),
      huecos("Bigote (rayo) en diagonal izquierda desde el morro.", String.raw`b2Vec2 dir = b->GetWorldVector(b2Vec2(▢, -1.0f));
dir.Normalize();
int d = walls->RayCast(x, y, x + (int)(dir.x * 70), y + (int)(dir.y * 70), nx, ny);
if (d >= 0) steer ▢ 1.5f * (1.0f - d / 70.0f);`, ["-0.5f", "+=", "0.5f", "-=", "*="], ["-0.5f", "+="], "Muro a la izquierda y cerca → gira a la derecha (steer positivo)."),
      test("¿Qué es el rubber banding?", ["Un joint elástico", "Ajustar la velocidad de los rivales según vayan delante o detrás del jugador", "Un derrape", "Un tipo de sensor"], 1, ""),
      escribe("Escribe la velocidad máxima del rival: `base` multiplicado por 0.9f si va delante del jugador y por 1.05f si no (usa la condición `ahead`).", [/^base\*\(ahead\?0\.9f?:1\.05f?\)$/, /^\(ahead\?0\.9f?:1\.05f?\)\*base$/, /^max_speed=base\*\(ahead\?0\.9f?:1\.05f?\)$/],
        "Operador ternario: `condición ? a : b`.", { ph: "base * (..." }),
      test("¿Qué cambia entre PlayerCar y AICar?", ["Toda la física", "Solo de dónde salen throttle y steer (teclado o IA)", "El tipo de cuerpo", "El filtro"], 1, ""),
      test("¿Cómo pruebas que la IA se recupera si choca?", ["No se puede", "Con F1, arrastrando el rival con el mouse joint a otro sitio", "Recompilando", "Cambiando el mapa"], 1, "")
    ]
  });
})();
