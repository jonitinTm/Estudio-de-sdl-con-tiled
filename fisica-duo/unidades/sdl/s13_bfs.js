(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-bfs", titulo: "Pathfinding I: BFS", icono: "⊞",
    desc: "El mapa como grafo, la frontera con std::queue, visited, vecinos, IsWalkable, breadcrumbs y reconstruir el camino.",
    chuleta: [
      ["BFS", "```std::queue<Vector2D> frontier;  std::vector<Vector2D> visited;  std::vector<Vector2D> breadcrumbs;\nfrontier.push(start); visited.push_back(start); breadcrumbs.push_back(start);\nwhile (!frontier.empty()) {\n    Vector2D current = frontier.front(); frontier.pop();\n    if (current == goal) break;                       // salida temprana\n    for (Vector2D n : Neighbors(current))            // arriba, abajo, izquierda, derecha\n        if (IsWalkable(n) && !Contains(visited, n)) {\n            frontier.push(n); visited.push_back(n);\n            breadcrumbs.push_back(current);           // de dónde vengo para llegar a n\n        }\n}```"],
      ["Reconstruir", "Desde la meta, sigue las migas (padre de cada casilla) hasta el inicio y luego **invierte** la lista: `std::reverse(path.begin(), path.end())`."]
    ],
    preguntas: [
      test("¿Qué estructura usa BFS para la frontera?", ["Una pila (stack)", "Una cola (queue): primero en entrar, primero en salir", "Un map", "Una cola de prioridad"], 1, "Con una pila sería DFS: encuentra un camino, pero no el más corto.", { nuevo: true }),
      test("¿Qué garantiza BFS en una rejilla donde todos los pasos cuestan lo mismo?", ["Nada", "El camino con menos pasos", "El camino más bonito", "El más rápido de calcular siempre"], 1, ""),
      huecos("Saca el siguiente de la frontera.", String.raw`Vector2D current = frontier.▢();
frontier.▢();`, ["front", "pop", "top", "back", "push"], ["front", "pop"], "En std::queue, pop no devuelve nada: primero lees con front."),
      orden("Bucle principal de BFS.", [
        "while (!frontier.empty())",
        "{",
        "    Vector2D current = frontier.front();",
        "    frontier.pop();",
        "    for (Vector2D n : Neighbors(current))",
        "        if (IsWalkable(n) && !Visited(n)) { frontier.push(n); visited.push_back(n); }",
        "}"], ""),
      test("¿Por qué se marca como visitada al METERLA en la frontera y no al sacarla?", ["Da igual", "Para no meter la misma casilla varias veces en la cola (trabajo repetido y caminos raros)", "Por memoria", "Por la cámara"], 1, ""),
      escribe("Escribe el vecino de arriba de `current` (Vector2D con getX/getY; la Y crece hacia abajo).", [/^Vector2D\(current\.getX\(\),current\.getY\(\)-1\)$/, /^Vector2D\{current\.getX\(\),current\.getY\(\)-1\}$/], "", { sol: "Vector2D(current.getX(), current.getY() - 1)", ph: "Vector2D(current.getX(), ...)" }),
      huecos("IsWalkable.", String.raw`bool Pathfinding::IsWalkable(int x, int y)
{
    if (x < 0 || y < 0 || x >= map->width || y ▢ map->height) return ▢;
    int gid = navLayer->Get(x, y);
    return gid != blockedGid;
}`, [">=", "false", ">", "true", "=="], [">=", "false"], "Primero los límites: si no, lees fuera del array."),
      test("¿Qué son las breadcrumbs (migas)?", ["Las casillas bloqueadas", "Para cada casilla visitada, desde cuál se llegó: permiten reconstruir el camino", "La frontera", "El coste"], 1, ""),
      orden("Reconstruye el camino.", [
        "Vector2D current = goal;",
        "while (current != start)",
        "{",
        "    path.push_back(current);",
        "    current = CameFrom(current);",
        "}",
        "path.push_back(start);",
        "std::reverse(path.begin(), path.end());"], "Se recorre al revés (meta → inicio) y luego se invierte."),
      bug("El enemigo camina hacia atrás por el camino.", [
        "while (current != start) { path.push_back(current); current = CameFrom(current); }",
        "path.push_back(start);",
        "return path;"], 2, "Falta `std::reverse(path.begin(), path.end());` antes de devolverlo."),
      test("¿Qué ventaja tiene salir del bucle cuando `current == goal`?", ["Ninguna", "No exploras el resto del mapa: mucho más rápido", "El camino es más corto", "Evita crashes"], 1, ""),
      test("Para un enemigo de plataformas (no vuela), ¿qué casilla es caminable?", ["Cualquiera vacía", "Vacía y con suelo justo debajo", "Cualquiera", "Las sólidas"], 1, "Por eso hay una capa de navegación propia o una regla en IsWalkable."),
      test("Buscar en un std::vector si ya está visitada es O(n). ¿Mejora?", ["Ninguna", "Un array de bool del tamaño del mapa indexado por y * width + x (O(1))", "Ordenar el vector", "Usar una pila"], 1, ""),
      test("¿Cada cuánto recalculas el camino al jugador?", ["Cada frame (siempre)", "Cada cierto tiempo (p. ej. 0,5 s) o cuando el jugador cambia de casilla", "Nunca", "Solo al cargar"], 1, "BFS en un mapa grande cada frame y por cada enemigo es caro."),
      escribe("Escribe la condición para que un BFS se pare: frontera vacía (usa `frontier`).", ["frontier.empty()"], "", { ph: "frontier..." }),
      test("En el handout, breadcrumbs es…", ["Una lista de casillas", "Una matriz breadcrumbs[x][y] paralela a visited: en cada casilla, desde cuál se llegó", "Un número", "Una cola"], 1, "Ya viene creada en el constructor y se reinicia en ResetPath."),
      huecos("TODO 1 (L12): deja la miguita al descubrir un vecino.", String.raw`if (IsWalkable(nx, ny) && !IsVisited(neighbor))
{
    frontier.push(neighbor);
    visited.push_back(neighbor);
    breadcrumbs[nx][ny] = ▢;
}`, ["frontierTile", "neighbor", "start", "destination"], ["frontierTile"], "La casilla que estabas expandiendo es el “padre” del vecino."),
      escribe("En ResetPath, escribe la línea que hace que el inicio sea su propia miguita (usa `start` y getX/getY con cast a int).", ["breadcrumbs[(int)start.getX()][(int)start.getY()] = start"], "Así ComputePath sabe dónde parar.", { ph: "breadcrumbs[...][...] = ..." }),
      huecos("ComputePath: seguir las miguitas.", String.raw`Vector2D current(x, y);
pathTiles.push_back(current);
while (breadcrumbs[(int)current.getX()][(int)current.getY()] ▢ current)
{
    current = breadcrumbs[(int)current.getX()][(int)current.getY()];
    pathTiles.push_back(current);
}
std::▢(pathTiles.begin(), pathTiles.end());`, ["!=", "reverse", "==", "sort", "<"], ["!=", "reverse"], "Se para cuando la miguita apunta a sí misma (el inicio)."),
      bug("El juego se congela al encontrar el camino.", [
        "void Pathfinding::ResetPath(Vector2D start)",
        "{",
        "    frontier.push(start); visited.push_back(start);",
        "    // breadcrumbs sin tocar",
        "}"], 3, "Si breadcrumbs[start] no es start, el while de ComputePath no termina nunca. Añade `breadcrumbs[(int)start.getX()][(int)start.getY()] = start;`."),
      test("Ejemplo de la clase: A vino de B, B de C, C de G, G de START. ¿Camino final?", ["A > B > C > G > START", "START > G > C > B > A", "START > A", "G > C > B"], 1, "Se reconstruye al revés y luego se invierte."),
      test("¿Cuándo se llama a ComputePath en el handout?", ["Al principio", "Cuando la casilla sacada de la frontera es el destino (TODO 2)", "Cada frame", "Al pulsar R"], 1, ""),
      test("Las teclas de prueba de BFS en el handout:", ["J paso a paso; Shift + J continuo", "B y N", "K y Shift + K", "F5 y F6"], 0, "K es Dijkstra; B/N/M, A*.")
    ]
  });
})();
