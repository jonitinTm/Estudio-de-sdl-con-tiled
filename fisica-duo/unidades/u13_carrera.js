(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "carrera", titulo: "La carrera: checkpoints, vueltas y tiempos", icono: "🏁",
    desc: "Checkpoints en orden con %, vueltas, mejor vuelta, estados de carrera, reaparecer, zonas especiales y posiciones con std::sort.",
    chuleta: [
      ["Vuelta válida", "```if (index != car->next_checkpoint) return;          // fuera de orden: no cuenta\ncar->next_checkpoint = (index + 1) % CHECKPOINT_COUNT;\nif (index == 0) car->LapCompleted();                 // meta en orden```"],
      ["LapCompleted", "```double t = lap_timer.ReadSec();\nif (best_lap < 0.0 || t < best_lap) best_lap = t;   // -1 = aún no hay\nlap++;\nlap_timer.Start();\nif (lap >= LAPS_TO_WIN) finished = true;```"],
      ["Ordenar por posición", "```std::sort(order.begin(), order.end(), [this](Car* a, Car* b) { return Progress(a) > Progress(b); });```"]
    ],
    preguntas: [
      test("¿Por qué no basta con un sensor en la meta para contar vueltas?", ["Sí basta", "Se podría cruzar, dar la vuelta y volver a cruzar: hacen falta checkpoints en orden", "Los sensores no detectan coches", "Por rendimiento"], 1, "", { nuevo: true }),
      test("6 checkpoints (0 a 5). Un coche toca el 5, que era el suyo. ¿Nuevo next_checkpoint?", ["6", "0", "5", "1"], 1, "(5 + 1) % 6 = 0: la meta."),
      huecos("La regla de la vuelta en OnCollision.", String.raw`if (index ▢ car->next_checkpoint)
    return;
car->next_checkpoint = (index + 1) ▢ CHECKPOINT_COUNT;
if (index == ▢)
    car->LapCompleted();`, ["!=", "%", "0", "==", "/", "1"], ["!=", "%", "0"], ""),
      test("¿Con qué valor empieza next_checkpoint si el coche sale justo detrás de la meta?", ["0", "1", "-1", "CHECKPOINT_COUNT"], 0, "Si sale detrás de la meta, lo primero que cruza es la meta (0)... pero entonces contaría una vuelta nada más salir. Por eso lo habitual es salir *delante* de la meta con next = 1, o detrás con next = 0 y no contar la primera. Decide uno y sé coherente."),
      orden("LapCompleted con mejor vuelta.", [
        "double t = lap_timer.ReadSec();",
        "if (best_lap < 0.0 || t < best_lap) best_lap = t;",
        "lap++;",
        "lap_timer.Start();",
        "if (lap >= LAPS_TO_WIN) finished = true;"], "Leer el tiempo antes de reiniciar el timer."),
      bug("El mejor tiempo siempre es 0. ¿Qué línea falla?", [
        "lap_timer.Start();",
        "double t = lap_timer.ReadSec();",
        "if (best_lap < 0.0 || t < best_lap) best_lap = t;",
        "lap++;"], 0, "Se reinicia el timer antes de leerlo: t vale ~0. Primero ReadSec, luego Start."),
      test("¿Dónde guardas el “mejor tiempo de la sesión” para que no se borre al reiniciar la carrera?", ["En el coche (Reset lo borra)", "En ModuleGame, y StartRace no lo toca", "En un #define", "En Box2D"], 1, ""),
      test("¿Por qué el turbo no aplica el impulso directamente en OnCollision?", ["Porque no hay coche", "Durante el Step el mundo está bloqueado: se apunta boost_time y la fuerza se aplica en Update", "Porque es un sensor", "Por estética"], 1, ""),
      escribe("Escribe la línea que, al entrar en un sensor de aceite, incrementa el contador `in_oil` del coche `car`.", ["car->in_oil++", "++car->in_oil", "car->in_oil += 1"], "Y en OnCollisionEnd, `car->in_oil--`.", { ph: "car->..." }),
      test("¿Por qué un contador para el aceite y no un bool?", ["Ocupa menos", "Si hay sensores solapados, salir de uno no significa haber salido del aceite", "Box2D lo exige", "Por velocidad"], 1, ""),
      huecos("Formato del HUD.", String.raw`DrawText(TextFormat("Lap %d/%d", lap + 1, ▢), 20, 20, 30, WHITE);
DrawText(TextFormat("Time %▢", lap_timer.ReadSec()), 20, 55, 24, WHITE);`, ["LAPS_TO_WIN", ".2f", "d", "s", "lap"], ["LAPS_TO_WIN", ".2f"], "%.2f: decimal con 2 cifras."),
      test("¿Qué tipo de dato es ideal para el estado de la carrera?", ["Tres bools", "Un enum RaceState con un switch", "Un string", "Un vector"], 1, ""),
      orden("Reinicia la carrera.", [
        "for (int i = 0; i < (int)cars.size(); ++i)",
        "    cars[i]->Reset(grid[i].x, grid[i].y, grid[i].angle);",
        "state = RACE_COUNTDOWN;",
        "countdown.Start();"], "Cada coche a su puesto de parrilla, y vuelta a la cuenta atrás. El récord no se toca."),
      test("¿Qué hace esta lambda en std::sort?", ["Ordena por nombre", "Ordena los coches de más a menos progreso: el primero es el que va primero", "Ordena por velocidad", "Nada"], 1, "Una lambda es una función escrita en el sitio. `[this]` le deja usar Progress del módulo.", { code: String.raw`std::sort(order.begin(), order.end(),
    [this](Car* a, Car* b) { return Progress(a) > Progress(b); });`, nuevo: true }),
      escribe("Escribe una expresión de progreso: vueltas `lap` por `CHECKPOINT_COUNT` más los checkpoints pasados `done` (ignora la distancia).", ["lap * CHECKPOINT_COUNT + done", "done + lap * CHECKPOINT_COUNT", "CHECKPOINT_COUNT * lap + done"], "Para desempatar entre dos coches en el mismo tramo, se resta la distancia al siguiente checkpoint dividida por un número grande.", { ph: "lap * ..." }),
      test("Cuando un coche se sale y quieres devolverlo a la pista, ¿qué usas?", ["ApplyForce enorme", "SetTransform al último checkpoint + velocidades a cero", "Destruirlo y crearlo", "Nada"], 1, "Un teletransporte puntual está bien (fuera del callback)."),
      test("Los checkpoints son sensores atravesados en la pista. ¿Qué parámetro extra necesita CreateRectangleSensor para las curvas?", ["La masa", "El ángulo", "La fricción", "El color"], 1, "En Box2D 2.4: `def.angle = angle;` en la definición del cuerpo.")
    ]
  });
})();
