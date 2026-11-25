(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-box2d3", titulo: "Box2D 3 en tu motor", icono: "b2",
    desc: "La API en C de Box2D 3: ids en vez de punteros, defs por defecto, b2MakeBox, Step con subpasos, eventos de contacto y sensores después del Step, salto y suelo.",
    chuleta: [
      ["Crear", "```b2WorldDef wd = b2DefaultWorldDef();\nwd.gravity = { 0.0f, 10.0f };          // Y hacia abajo, como la pantalla\nb2WorldId world = b2CreateWorld(&wd);\n\nb2BodyDef bd = b2DefaultBodyDef();\nbd.type = b2_dynamicBody;\nbd.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };\nb2BodyId body = b2CreateBody(world, &bd);\nb2Polygon box = b2MakeBox(PIXEL_TO_METERS(w) * 0.5f, PIXEL_TO_METERS(h) * 0.5f);\nb2ShapeDef sd = b2DefaultShapeDef();\nb2CreatePolygonShape(body, &sd, &box);\nb2Body_SetUserData(body, pbody);```"],
      ["Eventos (después del Step)", "```b2World_Step(world, 1.0f / 60.0f, 4);\nb2ContactEvents ce = b2World_GetContactEvents(world);\nfor (int i = 0; i < ce.beginCount; ++i) {\n    b2ContactBeginTouchEvent& e = ce.beginEvents[i];\n    if (!b2Shape_IsValid(e.shapeIdA) || !b2Shape_IsValid(e.shapeIdB)) continue;\n    PhysBody* a = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdA));\n    PhysBody* b = (PhysBody*)b2Body_GetUserData(b2Shape_GetBody(e.shapeIdB));\n    if (a && a->listener) a->listener->OnCollision(a, b);\n    if (b && b->listener) b->listener->OnCollision(b, a);\n}```"]
    ],
    preguntas: [
      test("¿Qué es un `b2BodyId` en Box2D 3?", ["Un puntero", "Un pequeño struct identificador que se pasa por valor; las funciones son b2Body_XXX(id, …)", "Un int", "Una clase con métodos"], 1, "Box2D 3 es una API en C: no hay `body->GetPosition()` sino `b2Body_GetPosition(body)`.", { nuevo: true }),
      test("¿Por qué gravity = { 0, 10 } en este motor y no { 0, -10 }?", ["Error", "En pantalla la Y crece hacia abajo: así no hay que invertir nada al dibujar", "Por la Luna", "Es lo mismo"], 1, ""),
      huecos("Un cuerpo dinámico.", String.raw`b2BodyDef bd = ▢();
bd.type = ▢;
bd.position = { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) };
b2BodyId body = b2CreateBody(world, &bd);`, ["b2DefaultBodyDef", "b2_dynamicBody", "b2BodyDef", "b2_staticBody", "DYNAMIC"], ["b2DefaultBodyDef", "b2_dynamicBody"], "Empieza siempre por la def por defecto: rellena todos los campos con valores válidos."),
      escribe("Escribe la caja de 32×64 px con b2MakeBox (usa PIXEL_TO_METERS; recuerda que recibe medias medidas).", [/^b2MakeBox\(PIXEL_TO_METERS\(32\)\*0\.5f,PIXEL_TO_METERS\(64\)\*0\.5f\)$/, /^b2MakeBox\(PIXEL_TO_METERS\(16\),PIXEL_TO_METERS\(32\)\)$/, /^b2MakeBox\(PIXEL_TO_METERS\(32\)\/2,PIXEL_TO_METERS\(64\)\/2\)$/], "Igual que SetAsBox en Box2D 2: media anchura y media altura.", { ph: "b2MakeBox(..." }),
      test("PIXELS_PER_METER = 32. Un jugador de 32×48 px mide en Box2D…", ["32 × 48 m", "1 × 1,5 m", "0,5 × 0,75 m", "16 × 24 m"], 1, "Box2D está afinado para objetos de 0,1 a 10 m."),
      orden("Crear la forma y enlazar el cuerpo con tu PhysBody.", [
        "b2Polygon box = b2MakeBox(halfW, halfH);",
        "b2ShapeDef sd = b2DefaultShapeDef();",
        "sd.density = 1.0f;",
        "b2CreatePolygonShape(body, &sd, &box);",
        "b2Body_SetUserData(body, pbody);"], ""),
      test("¿Qué es el `4` en `b2World_Step(world, dt, 4)`?", ["Las iteraciones de velocidad", "Los subpasos (substeps): más = más estable y más caro", "Los fps", "La gravedad"], 1, "En Box2D 2 eran velocityIterations y positionIterations."),
      test("En Box2D 3, ¿cuándo te enteras de los contactos?", ["Durante el Step, con un listener", "Después del Step, leyendo b2World_GetContactEvents / GetSensorEvents", "Nunca", "En Draw"], 1, "Ventaja: el mundo no está bloqueado cuando procesas los eventos."),
      huecos("Recorre los contactos que empiezan.", String.raw`b2ContactEvents ce = b2World_GetContactEvents(world);
for (int i = 0; i < ce.▢; ++i)
{
    b2ContactBeginTouchEvent& e = ce.▢[i];
    ...
}`, ["beginCount", "beginEvents", "endCount", "endEvents", "size"], ["beginCount", "beginEvents"], ""),
      test("¿Por qué se comprueba `b2Shape_IsValid` antes de usar un evento?", ["Por estética", "La forma puede haberse destruido entre el Step y tu código: usar un id inválido es un error", "Para el sensor", "Por la gravedad"], 1, ""),
      test("¿Cómo recuperas tu PhysBody a partir de un shapeId?", ["No se puede", "(PhysBody*)b2Body_GetUserData(b2Shape_GetBody(shapeId))", "shapeId->body", "b2Shape_GetUserData"], 1, ""),
      huecos("Mover al jugador conservando la caída.", String.raw`b2Vec2 v = b2Body_GetLinearVelocity(pbody->body);
v.x = 0.0f;
if (right) v.x = speed;
if (left)  v.x = -speed;
b2Body_▢(pbody->body, v);`, ["SetLinearVelocity", "ApplyForce", "SetTransform", "GetLinearVelocity"], ["SetLinearVelocity"], "Si pusieras v.y = 0, el jugador flotaría."),
      escribe("Escribe el salto: impulso hacia arriba `jumpForce` al centro del cuerpo `pbody->body`.", [/^b2Body_ApplyLinearImpulseToCenter\(pbody->body,(b2Vec2)?\{0(\.0f?|f)?,-jumpForce\},true\)$/], "Arriba es Y negativa.", { ph: "b2Body_ApplyLinearImpulseToCenter(..." }),
      test("¿Cómo evitas el doble salto infinito?", ["No se puede", "Un bool onGround que se pone true al tocar una plataforma (contacto con normal hacia arriba) y false al saltar", "Bajando la gravedad", "Con KEY_REPEAT"], 1, ""),
      bug("Teletransportas al jugador al checkpoint y se queda flotando hasta que lo tocas.", [
        "b2Body_SetTransform(pbody->body, { PIXEL_TO_METERS(x), PIXEL_TO_METERS(y) }, b2Rot_identity);",
        "b2Body_SetLinearVelocity(pbody->body, { 0.0f, 0.0f });"], 1, "El cuerpo puede estar dormido: añade `b2Body_SetAwake(pbody->body, true);`."),
      test("¿Qué hace `b2Body_SetGravityScale(body, 0.0f)`?", ["Lo destruye", "Ese cuerpo deja de sentir la gravedad (god mode / volar)", "Lo hace estático", "Nada"], 1, ""),
      test("Para un sensor en Box2D 3.1 además de `isSensor = true`, ¿qué suele hacer falta?", ["Nada", "Que el sensor y el que lo atraviesa tengan enableSensorEvents = true", "Masa", "Un joint"], 1, "Si tu moneda no detecta al jugador, revisa este flag en las dos formas."),
      test("¿Qué evita `bd.fixedRotation = true` (o `b2Body_SetFixedRotation`) en el jugador de un plataformas?", ["Que se mueva", "Que vuelque al chocar con esquinas", "Que salte", "Que caiga"], 1, "")
    ]
  });
})();
