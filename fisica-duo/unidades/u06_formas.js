(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "formas", titulo: "Formas: cajas, círculos y cadenas", icono: "▭○",
    desc: "SetAsBox con medias medidas, círculos, polígonos convexos, cadenas para el circuito y varias fixtures en un cuerpo.",
    chuleta: [
      ["Caja y círculo", "```b2PolygonShape box;\nbox.SetAsBox(hx, hy);                     // MEDIAS medidas, en metros\nbox.SetAsBox(hx, hy, b2Vec2(0, -1), 0);   // desplazada del centro y girada\n\nb2CircleShape circle;\ncircle.m_radius = PIXEL_TO_METERS(r);\ncircle.m_p.Set(0, 0);                     // centro local```"],
      ["Cadena (muros del circuito)", "```b2Vec2* v = new b2Vec2[count];\nfor (int i = 0; i < count; ++i)\n    v[i].Set(PIXEL_TO_METERS(points[i * 2]), PIXEL_TO_METERS(points[i * 2 + 1]));\nb2ChainShape chain;\nchain.CreateLoop(v, count);   // cerrada\ndelete[] v;```\nEn 2.4 las cadenas chocan por un lado: dentro del recinto → antihorario; isla → horario."],
      ["Varias fixtures", "Un body puede tener varias: un chasis y un alerón, cada uno con su forma. La masa total se suma."]
    ],
    preguntas: [
      test("Quieres una caja de 2 × 1 metros. ¿Qué escribes?", ["`SetAsBox(2, 1)`", "`SetAsBox(1, 0.5f)`", "`SetAsBox(4, 2)`", "`SetAsBox(0.5f, 0.25f)`"], 1, "SetAsBox recibe la mitad del ancho y la mitad del alto.", { nuevo: true }),
      escribe("Escribe la llamada a SetAsBox de `box` para un coche de 40 × 80 píxeles (usa PIXEL_TO_METERS).", ["box.SetAsBox(PIXEL_TO_METERS(20), PIXEL_TO_METERS(40))", "box.SetAsBox(PIXEL_TO_METERS(40/2), PIXEL_TO_METERS(80/2))", "box.SetAsBox(PIXEL_TO_METERS(40)/2, PIXEL_TO_METERS(80)/2)"],
        "Medias medidas: 20 y 40 píxeles, convertidos a metros.", { ph: "box.SetAsBox(..." }),
      huecos("Un círculo de radio `r` píxeles.", String.raw`b2CircleShape shape;
shape.▢ = ▢(r);`, ["m_radius", "PIXEL_TO_METERS", "radius", "METERS_TO_PIXELS", "m_p"], ["m_radius", "PIXEL_TO_METERS"], "El radio es un campo público, `m_radius`, en metros."),
      test("¿Qué condición debe cumplir un `b2PolygonShape`?", ["Tener 4 lados", "Ser convexo y tener como mucho 8 vértices", "Ser cuadrado", "Ninguna"], 1, "Para formas cóncavas (una L, un coche con alerón) se usan varias fixtures convexas en el mismo cuerpo."),
      test("¿Por qué los muros del circuito se hacen con `b2ChainShape` y no con muchos edges sueltos?", ["Porque son más bonitos", "Las cadenas evitan las colisiones fantasma en las uniones entre segmentos", "Los edges no chocan", "Son dinámicas"], 1, "Cada segmento de la cadena conoce a sus vecinos: los coches no se “enganchan” al rozar el muro."),
      test("Los coches corren por dentro del muro exterior. ¿En qué orden van sus vértices (en pantalla)?", ["Horario", "Antihorario", "Da igual", "De izquierda a derecha"], 1, "En Box2D 2.4 las cadenas chocan por un solo lado. Con el orden al revés, los coches atraviesan el muro."),
      huecos("Convierte el array de ints en vértices.", String.raw`for (int i = 0; i < count; ++i)
{
    vertices[i].x = PIXEL_TO_METERS(points[▢]);
    vertices[i].y = PIXEL_TO_METERS(points[▢]);
}`, ["i * 2", "i * 2 + 1", "i", "i + 1", "count"], ["i * 2", "i * 2 + 1"], "Cada vértice ocupa dos ints: x en la posición par, y en la impar."),
      test("¿Qué diferencia hay entre `CreateLoop` y `CreateChain`?", ["Ninguna", "CreateLoop une el último vértice con el primero (cerrada); CreateChain la deja abierta", "CreateChain es más rápida", "CreateLoop es dinámica"], 1, "Para los muros cerrados del circuito: CreateLoop."),
      escribe("`CreateChain(x, y, points, size)` recibe el número de ints. Escribe el último argumento para el array `track_outer` sin contar a mano.", ["sizeof(track_outer) / sizeof(int)", "sizeof(track_outer)/sizeof(int)", "sizeof(track_outer)/sizeof(track_outer[0])"],
        "sizeof del array da bytes; dividido por los bytes de un int, el número de elementos.", { ph: "sizeof(..." }),
      test("¿Qué tipo de cuerpo debe tener una cadena?", ["dynamic", "static (o kinematic)", "Da igual", "sensor"], 1, "Una cadena no tiene área: no tiene masa. Como dinámica no funcionaría."),
      orden("Crea una cadena cerrada a partir de `points` (píxeles).", [
        "int count = size / 2;",
        "b2Vec2* v = new b2Vec2[count];",
        "for (int i = 0; i < count; ++i) v[i].Set(PIXEL_TO_METERS(points[i * 2]), PIXEL_TO_METERS(points[i * 2 + 1]));",
        "b2ChainShape shape;",
        "shape.CreateLoop(v, count);",
        "delete[] v;"], "CreateLoop copia los vértices: el array se puede liberar después."),
      test("¿Qué devuelve `TestPoint` en una cadena?", ["true si el punto está dentro", "Siempre false: una cadena no tiene volumen", "La distancia", "Error"], 1, "Una cadena son líneas. Para saber si el coche está dentro de la pista, usa otra cosa (sensores o waypoints)."),
      test("Quieres un coche con un alerón detrás (forma en T). ¿Cómo?", ["Un solo polígono cóncavo", "Un body con dos fixtures: el chasis y el alerón", "Dos bodies sin unir", "Un círculo"], 1, "Usa la versión de SetAsBox con centro: `wing.SetAsBox(hx, hy, b2Vec2(0, 0.8f), 0)`."),
      huecos("Un alerón de 1 × 0,2 m desplazado 0,8 m hacia atrás del centro del coche (el morro apunta a -Y).", String.raw`b2PolygonShape wing;
wing.SetAsBox(0.5f, 0.1f, b2Vec2(0.0f, ▢), ▢);`, ["0.8f", "0.0f", "-0.8f", "1.0f", "90"], ["0.8f", "0.0f"],
        "Hacia atrás es +Y si el morro mira a -Y. Ángulo 0: sin girar."),
      bug("Esta caja sale el doble de grande que su textura de 100 × 50. ¿Qué línea falla?", [
        "PhysBody* pbody = App->physics->CreateRectangle(x, y, 100, 50);",
        "// CreateRectangle(int x, int y, int half_width, int half_height)"], 0, "CreateRectangle del handout recibe medias medidas: debe ser 50, 25."),
      test("¿Dónde está el origen de una forma creada con `SetAsBox(hx, hy)`?", ["En la esquina", "En el centro del cuerpo", "En (0, 0) del mundo", "Abajo"], 1, "Por eso GetPosition da el centro y hay que dibujar con origin centrado.")
    ]
  });
})();
