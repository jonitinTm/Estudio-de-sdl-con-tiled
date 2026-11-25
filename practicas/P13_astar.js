Curso.practica({
  leccion: "astar",
  titulo: "Programa A* con las tres heurísticas",
  intro: "Primero escribirás las tres distancias de Vector2D. Después convertirás tu Dijkstra en A* cambiando la prioridad, y terminarás con las teclas de prueba y el clic que mueve al enemigo.",
  pasos: [
    {
      t: "Distancia Manhattan",
      exp: `<p>Suma de las diferencias absolutas en x y en y. Usa <code>std::fabs</code> y los getters.</p>`,
      code: String.raw`float Vector2D::distanceManhattan(const Vector2D& other) const
{
    return §s1§;
}`,
      slots: { s1: { ok: [/^std::fabs\(getX\(\)-other\.getX\(\)\)\+std::fabs\(getY\(\)-other\.getY\(\)\)$/, /^fabs\(getX\(\)-other\.getX\(\)\)\+fabs\(getY\(\)-other\.getY\(\)\)$/, /^std::fabs\(x-other\.x\)\+std::fabs\(y-other\.y\)$/, /^fabsf\(getX\(\)-other\.getX\(\)\)\+fabsf\(getY\(\)-other\.getY\(\)\)$/], sol: "std::fabs(getX() - other.getX()) + std::fabs(getY() - other.getY())",
        err: [[/^\(?getX\(\)-other\.getX\(\)\)?\+\(?getY\(\)-other\.getY\(\)\)?$/, "Sin valor absoluto, si el destino está a la izquierda las diferencias se restan entre sí. Envuelve cada una con <code>std::fabs</code>."], [/sqrt/, "Esa es la euclídea. Manhattan no lleva raíz: |dx| + |dy|."]], w: 52 } },
      pistas: ["|dx| + |dy|", "<code>std::fabs(getX() - other.getX()) + std::fabs(getY() - other.getY())</code>"],
      bien: "<p>Con movimiento en 4 direcciones y sin obstáculos, es exactamente el número de pasos: nunca sobreestima.</p>"
    },
    {
      t: "Distancia euclídea",
      exp: `<p>La línea recta: raíz de dx² + dy². Ya tienes <code>dx</code> y <code>dy</code> calculados.</p>`,
      code: String.raw`float Vector2D::distanceEuclidean(const Vector2D& other) const
{
    float dx = getX() - other.getX();
    float dy = getY() - other.getY();
    return §s1§;
}`,
      slots: { s1: { ok: ["std::sqrt(dx * dx + dy * dy)", "sqrt(dx * dx + dy * dy)", "sqrtf(dx * dx + dy * dy)", "std::sqrtf(dx * dx + dy * dy)"], err: [[/^dx\*dx\+dy\*dy$/, "Esa es la al cuadrado (sin raíz)."], [/\^/, "En C++ <code>^</code> es XOR, no potencia. Multiplica: <code>dx * dx</code>."], [/pow/, "Funciona, pero <code>dx * dx</code> es más simple y rápido."]], w: 30 } },
      pistas: ["<code>std::sqrt(...)</code>"],
      bien: "<p>Ojo: en C++ <code>dx^2</code> no es “al cuadrado”, es un XOR de bits. Error clásico.</p>"
    },
    {
      t: "Distancia al cuadrado",
      exp: `<p>Igual que la euclídea pero sin la raíz. Más barata… y no admisible.</p>`,
      code: String.raw`    return §s1§;`,
      slots: { s1: { ok: ["dx * dx + dy * dy", "dy * dy + dx * dx"], err: [[/sqrt/, "Sin raíz: esa es justo la diferencia."]], w: 20 } },
      pistas: ["dx² + dy² escrito con multiplicaciones."],
      bien: "<p>A 10 casillas estima 100: A* se lanza hacia el destino y puede elegir un camino que no es el más barato.</p>"
    },
    {
      t: "G: el coste real",
      exp: `<p>Dentro del bucle de vecinos de <code>PropagateAStar</code>, calcula G igual que en Dijkstra.</p>`,
      code: String.raw`        int moveCost = MovementCost(nx, ny);
        if (moveCost < 0) continue;
        int g = §s1§;`,
      slots: { s1: { ok: ["costSoFar[fx][fy] + moveCost", "moveCost + costSoFar[fx][fy]"], err: [[/costSoFar\[nx\]\[ny\]/, "Ese es el coste del VECINO. Suma el de la casilla actual (fx, fy)."], [/distance/, "La distancia al destino es H, no G. G es solo lo ya recorrido."]], w: 30 } },
      pistas: ["Lo mismo que <code>newCost</code> en Dijkstra."],
      bien: "<p>G no sabe nada del destino. Eso lo pone H.</p>"
    },
    {
      t: "H según la heurística",
      exp: `<p>Escribe el <code>switch</code> que calcula <code>h</code> (float, ya declarado a 0) según <code>heuristic</code>: <code>MANHATTAN</code>, <code>EUCLIDEAN</code> o <code>SQUARED</code>, llamando al método de <code>neighbor</code> con <code>destination</code>.</p>`,
      escribe: {
        antes: "        float h = 0.0f;",
        filas: 7,
        checks: [
          [/switch\(heuristic\)/, "Empieza con <code>switch (heuristic)</code>."],
          [/caseMANHATTAN:h=neighbor\.distanceManhattan\(destination\);break;/, "Caso Manhattan: <code>case MANHATTAN: h = neighbor.distanceManhattan(destination); break;</code>"],
          [/caseEUCLIDEAN:h=neighbor\.distanceEuclidean\(destination\);break;/, "Caso euclídea: <code>case EUCLIDEAN: h = neighbor.distanceEuclidean(destination); break;</code>"],
          [/caseSQUARED:h=neighbor\.distanceSquared\(destination\);(break;)?/, "Caso al cuadrado: <code>case SQUARED: h = neighbor.distanceSquared(destination); break;</code>"]
        ],
        prohibido: [[/caseMANHATTAN:h=neighbor\.distanceManhattan\(destination\);caseEUCLIDEAN/, "Te falta el <code>break</code> después de Manhattan: caería al caso siguiente y siempre usarías otra heurística."]],
        sol: String.raw`        switch (heuristic)
        {
        case MANHATTAN: h = neighbor.distanceManhattan(destination); break;
        case EUCLIDEAN: h = neighbor.distanceEuclidean(destination); break;
        case SQUARED:   h = neighbor.distanceSquared(destination);   break;
        }`
      },
      pistas: ["Tres <code>case</code>, cada uno con su <code>break</code>.", "Repasa el fall-through en la app de ejercicios (unidad de enums)."],
      bien: "<p>H se calcula desde el VECINO (la casilla que vas a meter en la cola), no desde la actual.</p>"
    },
    {
      t: "F a la cola, G a costSoFar",
      exp: `<p>Si el vecino no está visitado o <code>g</code> mejora su coste: guarda <strong>G</strong> en <code>costSoFar</code>, mete el vecino en <code>frontierAStar</code> con prioridad <strong>F = g + (int)h</strong>, márcalo visitado si no lo estaba y deja la miguita.</p>`,
      escribe: {
        filas: 9,
        checks: [
          [/if\(!IsVisited\(neighbor\)\|\|g<costSoFar\[nx\]\[ny\]\)/, "Condición: <code>if (!IsVisited(neighbor) || g &lt; costSoFar[nx][ny])</code>"],
          [/costSoFar\[nx\]\[ny\]=g;/, "costSoFar guarda G: <code>costSoFar[nx][ny] = g;</code>"],
          [/frontierAStar\.push\((std::)?make_pair\(g\+\(int\)h,neighbor\)\)|frontierAStar\.push\(\{g\+\(int\)h,neighbor\}\)|intf=g\+\(int\)h;[\s\S]*frontierAStar\.push\(((std::)?make_pair\(f,neighbor\)|\{f,neighbor\})\)/, "La prioridad es F: <code>frontierAStar.push(std::make_pair(g + (int)h, neighbor));</code>"],
          [/breadcrumbs\[nx\]\[ny\]=frontierTile;/, "La miguita: <code>breadcrumbs[nx][ny] = frontierTile;</code>"],
          [/visited\.push_back\(neighbor\)/, "Márcalo visitado: <code>if (!IsVisited(neighbor)) visited.push_back(neighbor);</code>"]
        ],
        prohibido: [[/costSoFar\[nx\]\[ny\]=g\+/, "¡No! costSoFar guarda solo G. Si le sumas H, la heurística se acumula en cada paso."], [/frontierAStar\.push\((std::)?make_pair\(g,neighbor\)\)/, "Con solo G en la cola, esto es Dijkstra otra vez. La prioridad es g + h."]],
        sol: String.raw`        if (!IsVisited(neighbor) || g < costSoFar[nx][ny])
        {
            costSoFar[nx][ny] = g;
            frontierAStar.push(std::make_pair(g + (int)h, neighbor));
            if (!IsVisited(neighbor)) visited.push_back(neighbor);
            breadcrumbs[nx][ny] = frontierTile;
        }`
      },
      pistas: ["Es tu bloque de Dijkstra con UN cambio en el push.", "costSoFar ← g · cola ← g + h"],
      bien: "<p>Esa es toda la diferencia entre Dijkstra y A*. Pruébalo en la demo de la lección comparando cuántas casillas visita cada uno.</p>"
    },
    {
      t: "Del clic a la casilla",
      exp: `<p>El ratón está en píxeles de pantalla. Pasa a mundo restando la cámara (que es negativa) y luego a casilla con <code>WorldToMap</code>.</p>`,
      code: String.raw`Vector2D mouse = input.GetMousePosition();
int wx = (int)mouse.getX() §s1§ render.camera.x;
int wy = (int)mouse.getY() - render.camera.y;
Vector2D tile = map->§s2§(wx, wy);
pathfinding->§s3§(tile);`,
      slots: {
        s1: { ok: ["-"], err: [[/^\+$/, "La cámara es negativa: para pasar de pantalla a mundo se RESTA (pantalla = mundo + cámara)."]], w: 3 },
        s2: { ok: ["WorldToMap"], err: [[/^MapToWorld$/, "Al revés: MapToWorld pasa de casilla a píxeles."]], w: 12 },
        s3: { ok: ["ResetPath"], err: [[/^ComputePath$/, "ComputePath reconstruye un camino ya encontrado. Para empezar una búsqueda nueva desde aquí: ResetPath."]], w: 12 }
      },
      pistas: ["DrawTexture hace pantalla = mundo + camera. Despeja mundo.", "Píxeles → casilla: WorldToMap."],
      bien: "<p>No olvides mover también al enemigo (su cuerpo físico) a <code>MapToWorld(tile)</code>.</p>"
    }
  ]
});
