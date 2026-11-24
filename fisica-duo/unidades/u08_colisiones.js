(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "colisiones", titulo: "Colisiones, sensores y ray casts", icono: "⟷",
    desc: "b2ContactListener, userData, OnCollision, sensores, el mundo bloqueado, PreSolve/PostSolve, TestPoint y RayCast.",
    chuleta: [
      ["El camino de un choque", "1) ModulePhysics hereda de `b2ContactListener` y hace `world->SetContactListener(this)`.\n2) Al crear cada cuerpo: `def.userData.pointer = reinterpret_cast<uintptr_t>(pbody);` (antes de CreateBody).\n3) En BeginContact recuperas los PhysBody y llamas a `listener->OnCollision(a, b)`.\n```void ModulePhysics::BeginContact(b2Contact* contact)\n{\n    PhysBody* a = (PhysBody*)contact->GetFixtureA()->GetBody()->GetUserData().pointer;\n    PhysBody* b = (PhysBody*)contact->GetFixtureB()->GetBody()->GetUserData().pointer;\n    if (a && a->listener) a->listener->OnCollision(a, b);\n    if (b && b->listener) b->listener->OnCollision(b, a);\n}```"],
      ["Regla de oro", "Durante el Step el mundo está bloqueado: en OnCollision no crees ni destruyas cuerpos ni los teletransportes. Anótalo (en una lista o un bool) y hazlo en Update. Cambiar variables (vueltas, puntos) sí se puede."],
      ["Sensores", "`fixture.isSensor = true;`: detecta (BeginContact/EndContact) pero no empuja. Meta, checkpoints, turbos, aceite."],
      ["Otros callbacks", "`PreSolve`: antes de resolver (`contact->SetEnabled(false)` para atravesar). `PostSolve`: después, con la fuerza del golpe (`impulse->normalImpulses[0]`) → volumen del sonido de choque."]
    ],
    preguntas: [
      test("¿Qué hay que hacer para que Box2D te avise de los choques?", ["Nada, avisa solo", "Heredar de b2ContactListener y registrarlo con world->SetContactListener", "Llamar a TestPoint cada frame", "Usar un joint"], 1, "", { nuevo: true }),
      huecos("Haz que ModulePhysics sea el listener de contactos.", String.raw`class ModulePhysics : public Module, public ▢
{
    void ▢(b2Contact* contact) override;
};
// en Start:
world->SetContactListener(▢);`, ["b2ContactListener", "BeginContact", "this", "OnCollision", "world", "b2Contact"], ["b2ContactListener", "BeginContact", "this"],
        "Herencia múltiple: Module y el listener. Se registra pasando el propio módulo."),
      test("¿Para qué se guarda el PhysBody en `userData.pointer`?", ["Para dibujar", "Para pasar del b2Body (de Box2D) a tu PhysBody en BeginContact", "Para el filtro", "Por obligación"], 1, "Box2D solo te da sus fixtures y bodies; el userData es tu enlace de vuelta."),
      escribe("Escribe la línea que guarda `pbody` en el userData de la definición `def` (Box2D 2.4).", ["def.userData.pointer = reinterpret_cast<uintptr_t>(pbody)", "def.userData.pointer=(uintptr_t)pbody"],
        "Siempre antes de `CreateBody(&def)`.", { ph: "def.userData.pointer = ..." }),
      bug("En BeginContact el userData siempre es 0. ¿Qué línea está en mal sitio?", [
        "b2BodyDef def;",
        "def.type = b2_dynamicBody;",
        "b2Body* b = world->CreateBody(&def);",
        "def.userData.pointer = reinterpret_cast<uintptr_t>(pbody);"], 3, "Después de CreateBody, modificar la def ya no afecta al cuerpo. Va antes. (Alternativa: `b->GetUserData().pointer = ...`)."),
      orden("Ordena BeginContact.", [
        "void ModulePhysics::BeginContact(b2Contact* contact)",
        "{",
        "    PhysBody* a = (PhysBody*)contact->GetFixtureA()->GetBody()->GetUserData().pointer;",
        "    PhysBody* b = (PhysBody*)contact->GetFixtureB()->GetBody()->GetUserData().pointer;",
        "    if (a && a->listener) a->listener->OnCollision(a, b);",
        "    if (b && b->listener) b->listener->OnCollision(b, a);",
        "}"], "Cada cuerpo recibe primero a sí mismo: en OnCollision, `bodyA` es siempre “el mío”."),
      test("En OnCollision del jugador, ¿qué es `bodyB`?", ["El jugador", "El otro cuerpo con el que ha chocado", "El suelo siempre", "nullptr"], 1, "bodyA = el que tiene este listener; bodyB = el otro."),
      test("El coche toca una moneda y quieres eliminarla. ¿Dónde llamas a DestroyBody?", ["En OnCollision", "En BeginContact", "La apuntas en OnCollision y la destruyes en Update", "En el destructor del coche"], 2, "El mundo está bloqueado durante el Step.", { nuevo: true }),
      bug("Al tocar el turbo, el juego a veces crashea. ¿Qué línea es peligrosa?", [
        "void ModuleGame::OnCollision(PhysBody* a, PhysBody* b)",
        "{",
        "    if (a == boost_pad)",
        "    {",
        "        App->physics->DestroyBody(boost_pad);",
        "        boost_pad = nullptr;",
        "    }",
        "}"], 4, "Destruir un cuerpo dentro del callback, en mitad del Step. Apúntalo (`to_destroy.push_back(a)`) y destrúyelo en Update."),
      test("¿Cuántas veces llega cada contacto a tu OnCollision si los dos cuerpos tienen listener?", ["1", "2: (A, B) y (B, A)", "3", "Depende"], 1, "Por eso, al apuntar algo en una lista, comprueba que no esté ya."),
      huecos("Apunta el cuerpo para destruirlo sin repetirlo.", String.raw`if (std::find(to_destroy.begin(), to_destroy.end(), bodyB) ▢ to_destroy.end())
    to_destroy.▢(bodyB);`, ["==", "push_back", "!=", "erase", "insert"], ["==", "push_back"], "std::find devuelve end() si no lo encuentra."),
      test("¿Qué hace una fixture con `isSensor = true`?", ["Choca más fuerte", "Detecta solapes (Begin/EndContact) pero no empuja", "No detecta nada", "Es invisible en debug"], 1, "Meta, checkpoints, turbos, aceite, zonas de muerte."),
      test("¿Puedes cambiar `car->lap++` dentro de OnCollision?", ["No, nunca", "Sí: cambiar variables está bien; lo prohibido es crear/destruir/teletransportar cuerpos", "Solo con un mutex", "Solo en PostSolve"], 1, ""),
      test("¿Para qué sirve `PreSolve`?", ["Para dibujar", "Para decidir justo antes de resolver un contacto, por ejemplo desactivarlo con contact->SetEnabled(false)", "Para crear cuerpos", "Para el raycast"], 1, "Plataformas de un solo sentido, fantasmas temporales…", { nuevo: true }),
      test("Quieres que el sonido del choque suene más fuerte cuanto más fuerte es el golpe. ¿Qué callback?", ["BeginContact", "EndContact", "PreSolve", "PostSolve (lee impulse->normalImpulses[0])"], 3, "PostSolve recibe los impulsos que aplicó el solver."),
      huecos("¿El punto `p` (en metros) está dentro de alguna fixture del cuerpo?", String.raw`for (b2Fixture* f = body->GetFixtureList(); f; f = f->▢())
{
    if (f->GetShape()->TestPoint(body->▢(), p))
        return true;
}`, ["GetNext", "GetTransform", "GetPosition", "GetBody", "GetAngle"], ["GetNext", "GetTransform"], "La forma está en coordenadas locales: hay que pasarle la transformación (posición + ángulo) del cuerpo."),
      test("Un ray cast de 200 px devuelve `fraction = 0.3`. ¿A qué distancia está el impacto?", ["30 px", "60 px", "0,3 m", "200 px"], 1, "fracción × longitud del rayo."),
      test("¿Por qué el RayCast del handout recorre `GetChildCount()` de cada forma?", ["Por estilo", "Una cadena tiene un hijo por cada segmento y hay que probarlos todos", "Para los círculos", "No hace falta"], 1, "Sin ese bucle, el rayo solo vería el primer segmento del muro."),
      escribe("Escribe la condición de un if que comprueba que `a` no es nulo y tiene `listener`.", ["a != nullptr && a->listener != nullptr", "a && a->listener", "a != NULL && a->listener != NULL", "a!=nullptr&&a->listener"],
        "El orden importa: si `a` es nulo, `&&` no evalúa la segunda parte (no crashea).", { ph: "a ..." })
    ]
  });
})();
