(function () {
  const { code } = Curso;
  const T = (tema, p, o, c, e) => ({ tipo: "test", tema, p, o, c, e });
  const N = (tema, p, r, tol, unidad, e) => ({ tipo: "num", tema, p, r, tol, unidad, e });
  const K = (tema, p, src, slots, e) => ({ tipo: "codigo", tema, p, code: src, slots, e });

  const banco = [
    // ---------------- Mundo y unidades ----------------
    T("Mundo y unidades", "¿Qué pieza de Box2D guarda la densidad, la fricción y si es sensor?", ["b2Body", "b2Shape", "b2Fixture", "b2World"], 2, "La fixture pega una forma a un cuerpo y le da material."),
    N("Mundo y unidades", "Con <code>PIXELS_PER_METER = 50</code>, ¿cuántos metros son 175 píxeles?", 3.5, 0.01, "m", "175 × 0,02 = 3,5 m."),
    N("Mundo y unidades", "Un coche es una caja de 20 × 40 px (tamaño completo) con densidad 1 y <code>PIXELS_PER_METER = 50</code>. ¿Cuál es su masa?", 0.32, 0.01, "kg", "0,4 m × 0,8 m = 0,32 m²; masa = densidad × área = 0,32 kg."),
    T("Mundo y unidades", "El juego hace un <code>Step(1/60)</code> por frame. En un monitor de 144 Hz sin límite de fps…", ["va igual", "la física va 2,4 veces más rápida", "la física va más lenta", "crashea"], 1, "144 pasos de 1/60 s por segundo real. Por eso se pone SetTargetFPS(60)."),
    T("Mundo y unidades", "¿Cuál de estas líneas tiene un bug?" + code(String.raw`bool ModulePhysics::Start()
{
    b2World* world = new b2World(b2Vec2(GRAVITY_X, -GRAVITY_Y));   // A
    world->SetContactListener(this);                                // B
    b2BodyDef bd;                                                   // C
    ground = world->CreateBody(&bd);                                // D
    return true;
}`), ["A: declara una variable local que tapa al miembro world", "B: this no es un listener", "C: falta el tipo del body", "D: falta new"], 0, "El miembro world queda a NULL y el primer CreateBody fuera de Start revienta."),
    K("Mundo y unidades", "Crea el cuerpo dinámico de un círculo en (x, y) píxeles.", String.raw`b2BodyDef body;
body.type = §s1§;
body.position.Set(§s2§(x), PIXEL_TO_METERS(y));
b2Body* b = world->§s3§(&body);`, { s1: { ok: ["b2_dynamicBody"] }, s2: { ok: ["PIXEL_TO_METERS"] }, s3: { ok: ["CreateBody"] } }, "Def → tipo → posición en metros → el mundo crea el cuerpo."),

    // ---------------- Formas ----------------
    T("Formas", "Quieres una caja de 120 × 60 px. ¿Qué pasas a <code>CreateRectangle(x, y, ?, ?)</code>?", ["120, 60", "60, 30", "240, 120", "1.2, 0.6"], 1, "Medias medidas, como SetAsBox."),
    T("Formas", "Los coches corren POR DENTRO de un muro hecho con una cadena cerrada. Para que choquen con él, sus vértices deben ir (en pantalla)…", ["en sentido horario", "en sentido antihorario", "da igual", "de izquierda a derecha"], 1, "Las cadenas de Box2D 2.4 solo chocan por un lado. Dentro → antihorario; fuera (isla) → horario."),
    T("Formas", "La textura del coche se dibuja desplazada respecto a la caja roja del debug. ¿Causa más probable?", ["La gravedad", "Se dibuja desde la esquina y GetPosition da el centro", "PIXELS_PER_METER vale 50", "Falta el contact listener"], 1, "Usa DrawTexturePro / DrawRectanglePro con origin = centro."),
    N("Formas", "<code>GetRotation()</code> devuelve 3.1416 rad. ¿Qué ángulo, en grados, hay que pasar a DrawTexturePro?", 180, 1, "°", "Radianes × RAD2DEG (57,3)."),
    K("Formas", "Convierte el array de ints en vértices en metros y crea una cadena cerrada.", String.raw`int count = size / 2;
b2Vec2* vertices = new b2Vec2[count];
for (int i = 0; i < count; ++i)
{
    vertices[i].x = PIXEL_TO_METERS(points[§s1§]);
    vertices[i].y = PIXEL_TO_METERS(points[§s2§]);
}
b2ChainShape shape;
shape.§s3§(vertices, count);
§s4§ vertices;`, { s1: { ok: ["i*2", "i*2+0", "2*i"] }, s2: { ok: ["i*2+1", "2*i+1"] }, s3: { ok: ["CreateLoop"] }, s4: { ok: ["delete[]"], w: 9 } }, "x en la posición par, y en la impar; CreateLoop cierra; un array de new[] se libera con delete[]."),

    // ---------------- Colisiones ----------------
    T("Colisiones", "Quieres destruir una moneda cuando el coche la toca. ¿Dónde llamas a DestroyBody?", ["En OnCollision", "En BeginContact", "La apuntas en una lista en OnCollision y la destruyes en Update", "En el destructor del coche"], 2, "Durante el Step el mundo está bloqueado."),
    N("Colisiones", "Un ray cast sobre un segmento de 240 px devuelve <code>fraction = 0.25</code>. ¿A qué distancia está el impacto?", 60, 0.5, "px", "0,25 × 240."),
    T("Colisiones", "¿Qué hace <code>cp->listener = this;</code> sobre un checkpoint?", ["Lo convierte en sensor", "Hace que ModulePhysics llame a OnCollision de este módulo cuando algo lo toque", "Lo dibuja en debug", "Lo hace estático"], 1, "Es el Module* al que se avisa."),
    T("Colisiones", "¿Qué diferencia a un sensor de una fixture normal?", ["Detecta contactos pero no empuja", "No se puede rotar", "Solo funciona con círculos", "No llama a BeginContact"], 0, "isSensor = true: detecta sin chocar."),
    K("Colisiones", "Guarda el PhysBody en el cuerpo y recupéralo en el contacto.", String.raw`// Al crear:
body.userData.pointer = §s1§<uintptr_t>(pbody);
b2Body* b = world->CreateBody(&body);

// En BeginContact:
PhysBody* a = (PhysBody*)contact->GetFixtureA()->§s2§->GetUserData().pointer;
if (a != NULL && a->§s3§ != NULL)
    a->listener->OnCollision(a, b);`, { s1: { ok: ["reinterpret_cast"] }, s2: { ok: ["GetBody()"], w: 10 }, s3: { ok: ["listener"], w: 10 } }, "Fixture → Body → UserData. Y siempre comprobar que hay listener."),

    // ---------------- Joints ----------------
    T("Joints", "En el mouse joint del handout, ¿qué es <code>bodyA</code>?", ["El cuerpo clicado", "ground: un cuerpo estático sin fixtures", "El ratón", "NULL"], 1, "Se crea en Start para anclar joints al mundo."),
    T("Joints", "Arrastras con F1 un coche y el juego lo destruye. Crash. ¿Por qué?", ["Box2D destruyó también el mouse joint y tu puntero mouse_joint quedó colgando", "El coche era estático", "Faltaba SetAwake", "Demasiada fuerza"], 0, "DestroyBody debe poner mouse_joint = NULL si el joint era de ese cuerpo."),
    T("Joints", "¿Qué joint usarías para una barrera que gira sobre un eje con motor?", ["Distance", "Revolute", "Prismatic", "Weld"], 1, "Bisagra con enableMotor."),
    N("Joints", "Quieres <code>upperAngle</code> = 45°. ¿Qué número multiplicas por <code>b2_pi</code>?", 0.25, 0.001, "", "180° = π → 45° = 0,25π."),

    // ---------------- Fricción ----------------
    T("Fricción", "¿Por qué en vista cenital la fricción de las fixtures no frena al coche contra el suelo?", ["Porque vale 0 por defecto", "Porque solo actúa entre dos fixtures que se tocan, y el suelo no es un cuerpo", "Porque la gravedad es 0", "Porque el coche es dinámico"], 1, "Hay que aplicarla a mano como fuerza."),
    N("Fricción", "Empujas una bola con 49 N. Con μs = 0,5 y g = 9,8, ¿desde qué masa NO se mueve?", 10, 0.1, "kg", "49 ≤ 0,5 · m · 9,8 → m ≥ 10 kg."),
    T("Fricción", "Aplicas <code>ApplyForceToCenter</code> una sola vez y el cuerpo casi no se mueve. ¿Por qué?", ["Las fuerzas se borran tras cada Step: hay que aplicarlas cada frame", "Falta la masa", "La fuerza va en píxeles", "El cuerpo está dormido para siempre"], 0, "Para un empujón único se usa un impulso."),
    N("Fricción", "Un coche de 2 kg recibe 36 N de motor y un rozamiento <code>-k·v</code> con k = 3. ¿Cuál es su velocidad máxima?", 12, 0.1, "m/s", "Se equilibra cuando 36 = 3 · v → v = 12 m/s."),

    // ---------------- Filtrado ----------------
    T("Filtrado", "Fixture A: categoría 0x0002, máscara 0x0001. Fixture B: categoría 0x0002, máscara 0xFFFF. ¿Chocan?", ["Sí", "No: A no acepta la categoría de B", "Solo si el grupo es positivo", "Solo si son sensores"], 1, "catB & maskA = 0x0002 & 0x0001 = 0."),
    N("Filtrado", "¿Cuánto vale <code>(1 &lt;&lt; 0) | (1 &lt;&lt; 2)</code>?", 5, 0, "", "1 | 4 = 5."),
    T("Filtrado", "Dos fixtures con <code>groupIndex = -1</code> y máscaras 0xFFFF…", ["chocan siempre", "no chocan nunca", "chocan solo con sensores", "depende de la categoría"], 1, "Mismo grupo negativo gana a las máscaras."),
    N("Filtrado", "Una bola de 2 kg a 6 m/s choca y se fusiona con una de 4 kg parada. ¿Velocidad final?", 2, 0.01, "m/s", "(2·6 + 4·0) / 6 = 2 m/s."),

    // ---------------- C++ ----------------
    T("C++ y entidades", "¿Qué significa <code>virtual void Control(float&amp; throttle, float&amp; steer) = 0;</code> en Car?", ["Que Control no hace nada", "Que cada clase hija DEBE escribir su propio Control, y no se puede crear un Car a secas", "Que Control devuelve 0", "Que es privada"], 1, "Función virtual pura → clase abstracta."),
    T("C++ y entidades", "¿Por qué el destructor de PhysicEntity es <code>virtual</code>?", ["Para que vaya más rápido", "Para que delete de un puntero a la base ejecute también el destructor de la hija", "Porque lo exige Box2D", "Para poder heredar"], 1, "Sin virtual, posible fuga."),
    T("C++ y entidades", "<code>b2Body* b</code>. ¿Cómo obtienes su masa?", ["b.GetMass()", "b->GetMass()", "b::GetMass()", "GetMass(b)"], 1, "b es un puntero: flecha."),
    T("C++ y entidades", "Al compilar: “símbolo externo sin resolver … Car::Steer”. ¿Qué pasa?", ["Falta un punto y coma", "Steer está declarada en Car.h pero no escrita en ningún .cpp del proyecto", "Car.h no tiene #pragma once", "Falta memoria"], 1, "O Car.cpp no está añadido al proyecto."),
    K("C++ y entidades", "Borra todos los coches sin fugas.", String.raw`for (Car* car : cars)
{
    App->physics->§s1§(car->body);
    §s2§ car;
}
cars.§s3§();`, { s1: { ok: ["DestroyBody"], w: 13 }, s2: { ok: ["delete"], w: 8 }, s3: { ok: ["clear"], w: 7 } }, "Cuerpo de Box2D + envoltorio, luego la entidad, luego vaciar la lista."),

    // ---------------- Coche ----------------
    T("Coche", "La textura del coche mira hacia arriba. ¿Cuál es su vector forward local?", ["(1, 0)", "(0, 1)", "(0, -1)", "(-1, 0)"], 2, "En pantalla la Y crece hacia abajo."),
    N("Coche", "Velocidad v = (3, 4) m/s y vector derecha = (1, 0). ¿Cuánto vale la rapidez lateral?", 3, 0.01, "m/s", "b2Dot((1,0), (3,4)) = 3."),
    T("Coche", "¿Qué provoca el derrape en nuestro modelo?", ["Bajar la masa", "Que el impulso lateral necesario supere el máximo permitido", "La gravedad", "El angular damping"], 1, "Si se recorta el impulso, queda velocidad lateral."),
    T("Coche", "El coche patina como sobre hielo y no puede tomar curvas. ¿Qué falta?", ["Drive()", "UpdateFriction(): cancelar la velocidad lateral", "Draw()", "SetAngularDamping"], 1, "Sin agarre lateral, la velocidad antigua se conserva."),
    K("Coche", "Completa el agarre lateral.", String.raw`b2Vec2 right = body->body->GetWorldVector(b2Vec2(1.0f, 0.0f));
b2Vec2 lateral = §s1§(right, body->body->GetLinearVelocity()) * right;

b2Vec2 impulse = b->§s2§() * -lateral;
b->§s3§(impulse, b->GetWorldCenter(), true);`, { s1: { ok: ["b2Dot"], w: 8 }, s2: { ok: ["GetMass"], w: 9 }, s3: { ok: ["ApplyLinearImpulse"], w: 20 } }, "Proyección con b2Dot; impulso = masa × cambio de velocidad."),
    K("Coche", "Completa la dirección: no girar parado, y al revés marcha atrás.", String.raw`float speed = GetForwardSpeed();
float factor = fminf(fabsf(speed) / 2.5f, 1.0f);
if (speed §s1§ 0.0f) factor = -factor;
body->body->§s2§(steer * turn_speed * factor);`, { s1: { ok: ["<"], w: 3 }, s2: { ok: ["SetAngularVelocity"], w: 20 } }, "Velocidad angular escalada por la velocidad frontal."),
    T("Coche", "¿Qué tiene mal este código del jugador?" + code(String.raw`if (IsKeyPressed(KEY_LEFT))  steer -= 1.0f;
if (IsKeyPressed(KEY_RIGHT)) steer += 1.0f;`), ["Nada", "IsKeyPressed solo es verdadero un frame: el coche casi no gira. Debe ser IsKeyDown", "Los signos están al revés", "Falta multiplicar por dt"], 1, "IsKeyDown = mientras está pulsada."),

    // ---------------- Carrera ----------------
    N("Carrera", "Hay 6 checkpoints (0 a 5). Un coche toca el 5 y era el que le tocaba. ¿Cuál es su nuevo <code>next_checkpoint</code>?", 0, 0, "", "(5 + 1) % 6 = 0: la meta."),
    T("Carrera", "Un coche con <code>next_checkpoint = 3</code> cruza la meta (checkpoint 0). ¿Qué ocurre?", ["Cuenta una vuelta", "Nada", "Pierde una vuelta", "Se reinicia"], 1, "Solo cuenta el checkpoint que le toca."),
    T("Carrera", "¿Por qué la mancha de aceite usa un contador (<code>in_oil++</code> / <code>in_oil--</code>) y no un bool?", ["Ocupa menos", "Si hay sensores solapados, salir de uno no significa haber salido del aceite", "Box2D lo exige", "Para contar puntos"], 1, "Dentro mientras el contador sea > 0."),
    T("Carrera", "¿Qué tiene mal este OnCollision?" + code(String.raw`if (bodyA == boost_pad)
{
    car->body->body->ApplyLinearImpulse(b2Vec2(0.0f, -5.0f), car->body->body->GetWorldCenter(), true);
    return;
}`), ["Nada", "Empuja un cuerpo dentro del callback (y siempre hacia arriba): debe apuntar boost_time y aplicar la fuerza en Drive()", "Falta el delete", "El impulso es pequeño"], 1, "En los callbacks solo se anota; se actúa en el Update."),
    K("Carrera", "La regla de la vuelta, en OnCollision.", String.raw`if (index != car->§s1§)
    return;

car->next_checkpoint = (index + 1) §s2§ CHECKPOINT_COUNT;

if (index == §s3§)
    car->LapCompleted();`, { s1: { ok: ["next_checkpoint"], w: 16 }, s2: { ok: ["%"], w: 3 }, s3: { ok: ["0"], w: 3 } }, "Solo en orden; el % da la vuelta; el 0 es la meta."),
    T("Carrera", "¿Dónde debe guardarse el “mejor tiempo de la sesión”?", ["En el coche, y se borra en Reset", "En ModuleGame, y StartRace no lo toca", "En ModulePhysics", "En un archivo .h"], 1, "Debe sobrevivir a los reinicios de carrera."),

    // ---------------- IA ----------------
    T("IA", "<code>GetLocalPoint(goal)</code> devuelve (2, -5). El objetivo está…", ["delante y a la derecha", "delante y a la izquierda", "detrás y a la derecha", "justo delante"], 0, "x > 0 derecha; y < 0 delante."),
    N("IA", "local = (1, -1). ¿Cuánto vale <code>atan2f(local.x, -local.y)</code> en grados?", 45, 0.5, "°", "atan2(1, 1) = 45°."),
    T("IA", "Un rival hace zigzag en las rectas. ¿Qué ajustarías primero?", ["Subir su masa", "Bajar la ganancia del giro (el 2.0f) o mirar un waypoint más adelantado", "Quitar los checkpoints", "Subir el drag"], 1, "Controlador proporcional demasiado agresivo."),
    K("IA", "El seguimiento de waypoints.", String.raw`if ((goal - b->GetPosition()).Length() < 2.2f)
    target = (target + 1) % §s1§;

b2Vec2 local = b->§s2§(goal);
float angle = atan2f(local.x, §s3§);`, { s1: { ok: ["waypoint_count", "WAYPOINT_COUNT"], w: 16 }, s2: { ok: ["GetLocalPoint"], w: 14 }, s3: { ok: ["-local.y"], w: 9 } }, "Siguiente waypoint con %, objetivo en local, ángulo con atan2(lado, delante)."),
    T("IA", "¿Qué es el rubber banding?", ["Que los coches reboten", "Ajustar la velocidad de los rivales según vayan por delante o por detrás del jugador", "Un joint elástico", "Un tipo de derrape"], 1, "Mantiene la carrera igualada.")
  ];

  window.__banco = banco;   // para las pruebas automáticas
  Curso.examen({
    id: "examen", num: "EX", grupo: "Evaluación", corto: "Examen final",
    titulo: "Examen final: Box2D y el juego de carreras",
    resumen: "Preguntas al azar de teoría, cálculo, código y “encuentra el bug”, con nota y corrección explicada.",
    intro: "Comprueba si de verdad entiendes lo que has construido. El examen mezcla teoría, cálculos con números, huecos de código y fragmentos con errores que tienes que detectar. Sin pistas: como un examen de verdad.",
    banco
  });
})();
