(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "mundo", titulo: "Box2D: mundo, cuerpos y fixtures", icono: "b2",
    desc: "b2World, Step, metros y píxeles, tipos de cuerpo, b2BodyDef, fixtures, densidad, fricción y rebote.",
    chuleta: [
      ["Las 4 piezas", "`b2World` (el universo) → `b2Body` (posición, velocidad, masa; sin forma) → `b2Shape` (geometría) → `b2Fixture` (pega la forma al cuerpo con material: densidad, fricción, rebote, sensor, filtro)."],
      ["Crear un cuerpo", "```b2BodyDef def;\ndef.type = b2_dynamicBody;\ndef.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));\nb2Body* b = world->CreateBody(&def);\n\nb2PolygonShape box;\nbox.SetAsBox(PIXEL_TO_METERS(half_w), PIXEL_TO_METERS(half_h));\n\nb2FixtureDef fix;\nfix.shape = &box;\nfix.density = 1.0f;\nfix.friction = 0.3f;\nfix.restitution = 0.1f;\nb->CreateFixture(&fix);```"],
      ["Unidades", "Box2D en metros, Raylib en píxeles. `PIXELS_PER_METER 50`. Todo lo que entra se convierte con `PIXEL_TO_METERS`, todo lo que sale con `METERS_TO_PIXELS`. Velocidades en m/s, fuerzas en N, ángulos en radianes."],
      ["Step", "`world->Step(1.0f / 60.0f, 8, 3);` en PreUpdate. Tiempo fijo + iteraciones de velocidad y posición."]
    ],
    preguntas: [
      test("¿Cuál de estas piezas tiene la densidad, la fricción y la restitución?", ["b2World", "b2Body", "b2Fixture", "b2Vec2"], 2, "La fixture pega la forma al cuerpo y le da el material.", { nuevo: true }),
      test("¿Cómo se crea un cuerpo en Box2D 2.4?", ["`new b2Body()`", "Se rellena una `b2BodyDef` y se llama a `world->CreateBody(&def)`", "`b2Body::Create()`", "`CreateBody(world)`"], 1, "Patrón *definición + fábrica*: el mundo crea el cuerpo y es su dueño."),
      orden("Ordena la creación de un cuerpo dinámico.", [
        "b2BodyDef def;",
        "def.type = b2_dynamicBody;",
        "def.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));",
        "b2Body* b = world->CreateBody(&def);"], "Definición → tipo → posición en metros → crear."),
      orden("Ordena la creación de la fixture del cuerpo `b` con una caja.", [
        "b2PolygonShape box;",
        "box.SetAsBox(PIXEL_TO_METERS(half_w), PIXEL_TO_METERS(half_h));",
        "b2FixtureDef fix;",
        "fix.shape = &box;",
        "fix.density = 1.0f;",
        "b->CreateFixture(&fix);"], "Forma → definición de fixture → forma + material → CreateFixture.", { extra: ["b->CreateBody(&fix);"] }),
      test("Con `PIXELS_PER_METER = 50`, un coche de 40 × 80 px mide en Box2D…", ["40 × 80 m", "0,8 × 1,6 m", "2 × 4 m", "0,4 × 0,8 m"], 1, "40 / 50 = 0,8 y 80 / 50 = 1,6. Box2D funciona bien con objetos de 0,1 a 10 m."),
      escribe("Escribe la expresión que convierte la posición x de un cuerpo (`pos.x`, en metros) a píxeles con la macro del handout.", ["METERS_TO_PIXELS(pos.x)"], "Lo que sale de Box2D se convierte con METERS_TO_PIXELS.", { ph: "METERS..." }),
      test("¿Qué tipo de cuerpo son los muros del circuito?", ["`b2_dynamicBody`", "`b2_staticBody`", "`b2_kinematicBody`", "Da igual"], 1, "No se mueven nunca: estáticos (masa infinita)."),
      test("¿Qué tipo usarías para una barrera que se mueve sola de lado a lado y empuja a los coches, pero a la que los coches no pueden mover?", ["dynamic", "static", "kinematic", "sensor"], 2, "Kinematic: se mueve con la velocidad que le das y no le afectan choques ni fuerzas."),
      test("¿Qué hace `world->Step(PHYSICS_DT, 8, 3)`?", ["Dibuja el mundo", "Avanza la simulación 1/60 s: integra velocidades y posiciones y resuelve choques", "Crea el mundo", "Borra los cuerpos"], 1, "8 y 3 son iteraciones del solver de velocidad y posición (más = más preciso y más lento).", { nuevo: true }),
      test("¿Por qué el Step usa un tiempo fijo (1/60) y no el tiempo real del frame?", ["Porque es más rápido", "Para que la simulación dé el mismo resultado en cualquier PC", "Por obligación de Raylib", "Para ahorrar memoria"], 1, "Con un dt variable, un salto o un derrape cambiarían según los fps."),
      test("Para un juego de carreras visto desde arriba, la gravedad del mundo debe ser…", ["(0, 10)", "(0, -10)", "(0, 0)", "(10, 0)"], 2, "La gravedad real apunta hacia la pantalla; Box2D no tiene eje Z. Si no es 0, todo “cae” hacia abajo de la pantalla."),
      huecos("Crea el mundo sin gravedad (vista cenital).", String.raw`world = new ▢(b2Vec2(▢, ▢));`, ["b2World", "0.0f", "0.0f", "-10.0f", "b2Body", "9.8f"], ["b2World", "0.0f", "0.0f"], "Gravedad (0, 0)."),
      test("Masa de un cuerpo con una fixture de densidad 2 y área 0,5 m²…", ["0,25 kg", "1 kg", "2,5 kg", "4 kg"], 1, "masa = densidad × área = 2 × 0,5 = 1 kg."),
      test("¿Qué hace `restitution = 1.0f`?", ["Sin rebote", "Rebote perfecto: rebota con la misma velocidad", "Fricción total", "Masa infinita"], 1, "0 = no rebota, 1 = rebote perfecto. Para coches algo bajo (0,1–0,3)."),
      test("¿Qué pasa con un cuerpo dinámico con densidad 0?", ["Flota", "Box2D le pone masa 1 kg y se comporta raro", "No se puede crear", "Es estático"], 1, "Pon siempre densidad > 0 en los cuerpos dinámicos."),
      bug("Este Start deja `world` a NULL y el juego revienta en el primer CreateBody. ¿Qué línea falla?", [
        "bool ModulePhysics::Start()",
        "{",
        "    b2World* world = new b2World(b2Vec2(0.0f, 0.0f));",
        "    world->SetContactListener(this);",
        "    return true;",
        "}"], 2, "Declara una variable local `world` que tapa al miembro. Debe ser `world = new b2World(...)` sin el tipo delante."),
      test("¿Qué libera `delete world;` en CleanUp?", ["Solo el mundo", "El mundo y todos sus cuerpos, fixtures y joints", "Nada", "Tus PhysBody"], 1, "Box2D es dueño de todo lo que creó. Pero tus PhysBody y entidades (creados con new) los borras tú."),
      escribe("Escribe la línea que avanza la simulación con el paso fijo `PHYSICS_DT` y 8 y 3 iteraciones.", ["world->Step(PHYSICS_DT, 8, 3)", "world->Step(PHYSICS_DT,8,3)"], "", { ph: "world->..." }),
      test("¿Qué representa `b->GetPosition()`?", ["La esquina superior izquierda, en píxeles", "El origen del cuerpo (su centro si la forma está centrada), en metros", "El centro de la pantalla", "La velocidad"], 1, "Metros, y el centro. Por eso hay que convertir y centrar la textura.")
    ]
  });
})();
