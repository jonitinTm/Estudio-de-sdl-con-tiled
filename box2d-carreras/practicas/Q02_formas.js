Curso.practica({
  leccion: "b02",
  titulo: "Cajas, cadenas, PhysBody y texturas rotadas",
  intro: "Los TODOs de Lesson 2: la caja con medias medidas, la cadena desde un array, la clase PhysBody, dibujar la textura bien colocada y destruir lo creado.",
  pasos: [
    {
      t: "Una caja de 100×50",
      exp: `<p>Al pulsar 2 se crea una caja de 100×50 px en el ratón. <code>CreateRectangle</code> recibe <strong>medias medidas</strong>, como <code>SetAsBox</code>.</p>`,
      code: String.raw`
if (IsKeyPressed(KEY_TWO))
    boxes.push_back(App->physics->CreateRectangle(GetMouseX(), GetMouseY(), §s1§, §s2§));`,
      slots: {
        s1: { ok: ["50"], err: [[/^100$/, "Esa es la medida entera: la caja saldría de 200 px. Pasa la MITAD."]], w: 5 },
        s2: { ok: ["25"], err: [[/^50$/, "Mitad del alto: 25."]], w: 5 }
      },
      pistas: ["Medias medidas: 100/2 y 50/2."],
      bien: "<p>Dentro: <code>box.SetAsBox(PIXEL_TO_METERS(half_width), PIXEL_TO_METERS(half_height));</code></p>"
    },
    {
      t: "De ints en píxeles a b2Vec2 en metros",
      exp: `<p>En <code>CreateChain</code> recibes <code>points</code>, un array de ints [x0, y0, x1, y1…] con <code>size</code> ints. Reserva un array de <code>b2Vec2</code> con <code>count = size / 2</code> vértices y rellénalo convirtiendo a metros.</p>`,
      escribe: {
        filas: 7,
        checks: [
          [/intcount=size\/2;/, "Número de vértices: <code>int count = size / 2;</code>"],
          [/b2Vec2\*vertices=newb2Vec2\[count\];/, "Reserva: <code>b2Vec2* vertices = new b2Vec2[count];</code>"],
          [/for\(inti=0;i<count;\+\+i\)|for\(inti=0;i<count;i\+\+\)/, "Recorre los vértices: <code>for (int i = 0; i &lt; count; ++i)</code>"],
          [/vertices\[i\]\.x=PIXEL_TO_METERS\(points\[i\*2(\+0)?\]\);/, "La x del vértice i está en <code>points[i * 2]</code>: <code>vertices[i].x = PIXEL_TO_METERS(points[i * 2]);</code>"],
          [/vertices\[i\]\.y=PIXEL_TO_METERS\(points\[i\*2\+1\]\);/, "La y está justo después: <code>points[i * 2 + 1]</code>."]
        ],
        prohibido: [[/i<size/, "Si recorres hasta size (número de ints) te sales del array de vértices, que tiene size/2."]],
        sol: String.raw`    int count = size / 2;
    b2Vec2* vertices = new b2Vec2[count];
    for (int i = 0; i < count; ++i)
    {
        vertices[i].x = PIXEL_TO_METERS(points[i * 2 + 0]);
        vertices[i].y = PIXEL_TO_METERS(points[i * 2 + 1]);
    }`
      },
      pistas: ["Cada vértice ocupa dos ints.", "x en la posición par, y en la impar."],
      bien: "<p>Es la conversión más típica de toda la asignatura: la usarás para los muros del circuito.</p>"
    },
    {
      t: "Cerrar la cadena y liberar",
      exp: `<p>Crea la cadena cerrada con los vértices y libera el array (Box2D se queda una copia). Ojo: un array creado con <code>new[]</code> se libera de una forma concreta.</p>`,
      code: String.raw`
    b2ChainShape shape;
    shape.§s1§(vertices, count);
    §s2§ vertices;`,
      slots: {
        s1: { ok: ["CreateLoop"], err: [[/^CreateChain$/, "CreateChain la deja ABIERTA. Para cerrarla: CreateLoop."]] },
        s2: { ok: ["delete[]"], err: [[/^delete$/, "Un array creado con <code>new b2Vec2[count]</code> se libera con <code>delete[]</code>."]], w: 9 }
      },
      pistas: ["“Bucle” en inglés.", "new[] ↔ delete[]"],
      bien: "<p>¿Qué letra sale con los vértices del handout (tecla 3)? Pruébalo en la demo de arriba.</p>"
    },
    {
      t: "PhysBody::GetPosition",
      exp: `<p>Escribe el cuerpo: lee la posición del <code>body</code> (metros, centro) y devuélvela en x, y en píxeles.</p>`,
      escribe: {
        antes: "void PhysBody::GetPosition(int& x, int& y) const\n{",
        despues: "}",
        filas: 4,
        checks: [
          [/b2Vec2pos=body->GetPosition\(\);/, "Lee la posición: <code>b2Vec2 pos = body-&gt;GetPosition();</code>"],
          [/x=METERS_TO_PIXELS\(pos\.x\);/, "Convierte x: <code>x = METERS_TO_PIXELS(pos.x);</code>"],
          [/y=METERS_TO_PIXELS\(pos\.y\);/, "Convierte y: <code>y = METERS_TO_PIXELS(pos.y);</code>"]
        ],
        sol: String.raw`    b2Vec2 pos = body->GetPosition();
    x = METERS_TO_PIXELS(pos.x);
    y = METERS_TO_PIXELS(pos.y);`
      },
      pistas: ["x e y son referencias (<code>int&amp;</code>): asignarles un valor lo cambia en quien llamó."],
      bien: "<p>Con esto, el resto del juego ya no ve metros nunca.</p>"
    },
    {
      t: "Textura centrada y rotada",
      exp: `<p>Completa el pivote (centro de la textura) y la rotación en grados.</p>`,
      code: String.raw`
Rectangle source = { 0.0f, 0.0f, (float)texture.width, (float)texture.height };
Rectangle dest   = { (float)x, (float)y, (float)texture.width, (float)texture.height };
Vector2   origin = { §s1§, (float)texture.height / 2.0f };
DrawTexturePro(texture, source, dest, origin, body->GetRotation() * §s2§, WHITE);`,
      slots: {
        s1: { ok: ["(float)texture.width/2.0f", "texture.width/2.0f", "(float)texture.width/2", "texture.width*0.5f"], err: [[/^0(\.0*f?)?$/, "Con origen (0, 0) la textura se dibuja desde la esquina: ese es el desfase de la diapositiva 15."], [/^texture\.width\/2$/, "Ojo: entre enteros, 25/2 = 12. Usa 2.0f."]], w: 26, sol: "(float)texture.width / 2.0f" },
        s2: { ok: ["RAD2DEG", "RADTODEG", "57.2958f", "(180.0f/PI)"], err: [[/^DEG2RAD$|^DEGTORAD$/, "Al revés: GetRotation da RADIANES y Raylib quiere GRADOS."]], w: 9 }
      },
      pistas: ["Copia la idea de la componente y.", "Radianes → grados."],
      bien: "<p><code>origin</code> hace dos cosas: centra la textura sobre el cuerpo y es el punto alrededor del cual rota.</p>"
    },
    {
      t: "DestroyBody",
      exp: `<p>Libera los dos niveles: el cuerpo de Box2D (con el mundo) y tu PhysBody (con delete).</p>`,
      escribe: {
        antes: "void ModulePhysics::DestroyBody(PhysBody* pbody)\n{\n    if (pbody == NULL) return;",
        despues: "}",
        filas: 3,
        checks: [
          [/world->DestroyBody\(pbody->body\);/, "Primero el body de Box2D: <code>world-&gt;DestroyBody(pbody-&gt;body);</code>"],
          [/deletepbody;/, "Luego tu envoltorio: <code>delete pbody;</code>"],
          [/world->DestroyBody\(pbody->body\);.*deletepbody;/, "El orden importa: si haces delete pbody primero, <code>pbody-&gt;body</code> ya no existe."]
        ],
        sol: String.raw`    world->DestroyBody(pbody->body);
    delete pbody;`
      },
      pistas: ["Dos líneas.", "Primero lo de dentro, luego el envoltorio."],
      bien: "<p>Al pulsar BACKSPACE recorres tus listas llamando a DestroyBody y luego <code>clear()</code>. Lo mismo en CleanUp.</p>"
    }
  ]
});
