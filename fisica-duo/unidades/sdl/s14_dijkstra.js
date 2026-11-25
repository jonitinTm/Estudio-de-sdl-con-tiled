(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-dijkstra", titulo: "Pathfinding II: Dijkstra y A*", icono: "⋆",
    desc: "Costes por casilla, priority_queue con greater, costSoFar, relajar vecinos, la heurística Manhattan y A*.",
    chuleta: [
      ["Dijkstra", "```using Nodo = std::pair<int, Vector2D>;   // (coste, casilla)\nstd::priority_queue<Nodo, std::vector<Nodo>, std::greater<Nodo>> frontier;\nfrontier.push({ 0, start }); costSoFar[start] = 0;\nwhile (!frontier.empty()) {\n    Vector2D current = frontier.top().second; frontier.pop();\n    if (current == goal) break;\n    for (Vector2D n : Neighbors(current)) {\n        int newCost = costSoFar[current] + MovementCost(n);\n        if (!costSoFar.count(n) || newCost < costSoFar[n]) {\n            costSoFar[n] = newCost; cameFrom[n] = current;\n            frontier.push({ newCost, n });\n        }\n    }\n}```"],
      ["A*", "Igual, pero la prioridad es `newCost + Heuristic(n, goal)`. Manhattan: `|dx| + |dy|` (4 direcciones)."]
    ],
    preguntas: [
      test("¿Qué añade Dijkstra respecto a BFS?", ["Nada", "Cada casilla puede costar distinto (agua 5, camino 1) y encuentra el camino de menor COSTE", "Es más rápido siempre", "Va en diagonal"], 1, "", { nuevo: true }),
      test("std::priority_queue por defecto saca…", ["el menor", "el MAYOR", "el primero en entrar", "uno al azar"], 1, "Por eso se usa std::greater: así saca el de menor coste."),
      huecos("La frontera de Dijkstra.", String.raw`std::priority_queue<Nodo, std::vector<Nodo>, std::▢<Nodo>> frontier;
Vector2D current = frontier.▢().second;
frontier.pop();`, ["greater", "top", "less", "front", "back"], ["greater", "top"], "priority_queue usa top (no front)."),
      test("¿Qué guarda costSoFar[n]?", ["La heurística", "El menor coste conocido para llegar desde el inicio hasta n", "La distancia a la meta", "Si es caminable"], 1, ""),
      orden("Relajar un vecino.", [
        "int newCost = costSoFar[current] + MovementCost(n);",
        "if (!costSoFar.count(n) || newCost < costSoFar[n])",
        "{",
        "    costSoFar[n] = newCost;",
        "    cameFrom[n] = current;",
        "    frontier.push({ newCost, n });",
        "}"], ""),
      test("Camino A: 4 casillas de hierba (coste 1). Camino B: 2 casillas de agua (coste 5). ¿Cuál elige Dijkstra?", ["B (menos pasos)", "A (coste 4 frente a 10)", "Los dos", "Ninguno"], 1, ""),
      test("¿Qué es una heurística en A*?", ["El coste real", "Una estimación de lo que falta hasta la meta; guía la búsqueda hacia ella", "Una casilla bloqueada", "La cola"], 1, ""),
      escribe("Escribe la distancia Manhattan entre `a` y `b` (Vector2D, usa abs, getX, getY).", [/^abs\(a\.getX\(\)-b\.getX\(\)\)\+abs\(a\.getY\(\)-b\.getY\(\)\)$/, /^std::abs\(a\.getX\(\)-b\.getX\(\)\)\+std::abs\(a\.getY\(\)-b\.getY\(\)\)$/, /^fabs\(a\.getX\(\)-b\.getX\(\)\)\+fabs\(a\.getY\(\)-b\.getY\(\)\)$/, /^fabsf\(a\.getX\(\)-b\.getX\(\)\)\+fabsf\(a\.getY\(\)-b\.getY\(\)\)$/], "", { sol: "abs(a.getX() - b.getX()) + abs(a.getY() - b.getY())", ph: "abs(...) + abs(...)" }),
      huecos("Prioridad en A*.", String.raw`int newCost = costSoFar[current] + MovementCost(n);
int priority = newCost ▢ Heuristic(n, ▢);
frontier.push({ priority, n });`, ["+", "goal", "-", "start", "*"], ["+", "goal"], "f = g + h."),
      test("Si la heurística siempre vale 0, A* se comporta como…", ["BFS", "Dijkstra", "DFS", "No funciona"], 1, ""),
      test("¿Por qué Manhattan y no la distancia euclídea para 4 direcciones?", ["Es más bonita", "Es exacta cuando solo te mueves en horizontal y vertical, y nunca sobreestima", "Es más lenta", "No hay razón"], 1, "Una heurística que sobreestima puede dar caminos que no son los más cortos."),
      bug("Dijkstra devuelve caminos largos y absurdos.", [
        "std::priority_queue<Nodo> frontier;",
        "frontier.push({ 0, start });"], 0, "Sin std::greater, la cola saca el de MAYOR coste primero."),
      test("Para usar Vector2D como clave de std::map (costSoFar), ¿qué necesitas?", ["Nada", "Un operator< para Vector2D (o usar el índice y * width + x como clave)", "Un hash", "Herencia"], 1, "El índice entero suele ser lo más simple."),
      escribe("Escribe el índice entero único de la casilla (x, y) en un mapa de ancho `width`.", ["y * width + x", "x + y * width", "width * y + x"], "", { ph: "y * width + x" }),
      test("¿Qué algoritmo para un slime que te persigue en un nivel con zonas lentas?", ["BFS", "A* con costes por casilla (o Dijkstra)", "DFS", "Ninguno"], 1, "")
    ]
  });
})();
