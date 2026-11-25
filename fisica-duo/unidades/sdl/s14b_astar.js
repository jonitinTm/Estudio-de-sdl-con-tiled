(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-astar", titulo: "A* a fondo (handout L13)", icono: "A*",
    desc: "F = G + H, PropagateAStar desde Dijkstra, las tres distancias de Vector2D, por qué la al cuadrado no es óptima, teclas B/N/M y el clic que mueve al enemigo.",
    chuleta: [
      ["F = G + H", "**G**: coste real desde el inicio (lo guarda `costSoFar`).\n**H**: estimación hasta el destino (heurística).\n**F**: prioridad en `frontierAStar`. Se saca siempre la menor."],
      ["El cambio respecto a Dijkstra", "```int g = costSoFar[fx][fy] + MovementCost(nx, ny);\nif (!IsVisited(neighbor) || g < costSoFar[nx][ny]) {\n    float h = neighbor.distanceManhattan(destination);   // o Euclidean / Squared\n    costSoFar[nx][ny] = g;                               // G\n    frontierAStar.push(std::make_pair(g + (int)h, neighbor));   // F\n    if (!IsVisited(neighbor)) visited.push_back(neighbor);\n    breadcrumbs[nx][ny] = frontierTile;\n}```"],
      ["Heurísticas", "Manhattan `|dx|+|dy|` → 4 direcciones, óptima.\nEuclídea `√(dx²+dy²)` → con diagonales, óptima.\nAl cuadrado `dx²+dy²` → rápida, **sobreestima**: puede no dar el camino más corto."]
    ],
    preguntas: [
      test("¿Qué diferencia a A* de Dijkstra?", ["Usa una pila", "La prioridad suma una estimación de lo que falta hasta el destino (H)", "No usa costes", "No necesita breadcrumbs"], 1, "", { nuevo: true }),
      test("En F = G + H, ¿qué es G?", ["La distancia al destino", "El coste real acumulado desde el inicio hasta la casilla", "El número de vecinos", "La heurística"], 1, ""),
      test("¿Qué guarda costSoFar en A*?", ["F", "G", "H", "G · H"], 1, "La cola usa F; costSoFar guarda G. Mezclarlas es el error nº 1."),
      bug("Los costes de las casillas se disparan y el camino sale raro.", [
        "int g = costSoFar[fx][fy] + MovementCost(nx, ny);",
        "float h = neighbor.distanceManhattan(destination);",
        "costSoFar[nx][ny] = g + (int)h;",
        "frontierAStar.push(std::make_pair(g + (int)h, neighbor));"], 2, "costSoFar debe guardar solo G: `costSoFar[nx][ny] = g;`. Si guardas F, la H se acumula en cada paso."),
      bug("A* explora exactamente igual que Dijkstra.", [
        "int g = costSoFar[fx][fy] + MovementCost(nx, ny);",
        "float h = neighbor.distanceManhattan(destination);",
        "costSoFar[nx][ny] = g;",
        "frontierAStar.push(std::make_pair(g, neighbor));"], 3, "La prioridad debe ser F = g + h. Con solo g es Dijkstra."),
      escribe("Escribe el cuerpo de `distanceManhattan` (devuelve |dx| + |dy| con std::fabs, getX/getY y `other`).", [/^returnstd::fabs\(getX\(\)-other\.getX\(\)\)\+std::fabs\(getY\(\)-other\.getY\(\)\)$/, /^returnfabs\(getX\(\)-other\.getX\(\)\)\+fabs\(getY\(\)-other\.getY\(\)\)$/, /^returnfabsf\(getX\(\)-other\.getX\(\)\)\+fabsf\(getY\(\)-other\.getY\(\)\)$/],
        "", { sol: "return std::fabs(getX() - other.getX()) + std::fabs(getY() - other.getY());", ph: "return std::fabs(...) + ..." }),
      huecos("distanceEuclidean.", String.raw`float dx = getX() - other.getX();
float dy = getY() - other.getY();
return std::▢(dx ▢ dx + dy * dy);`, ["sqrt", "*", "pow", "^", "abs"], ["sqrt", "*"], "En C++ `^` NO es potencia: es XOR de bits."),
      test("Del (2, 5) al (6, 8): Manhattan, euclídea y al cuadrado valen…", ["7, 5, 25", "5, 7, 25", "7, 25, 5", "12, 5, 49"], 0, "dx = 4, dy = 3."),
      test("¿Qué es una heurística admisible?", ["Una que es rápida", "Una que nunca sobreestima el coste real que falta: con ella A* da el camino óptimo", "Una que usa raíz", "Una que vale 0"], 1, ""),
      test("¿Por qué la euclídea al cuadrado puede dar caminos peores?", ["Porque es lenta", "Sobreestima (a 10 casillas dice 100): A* se fía demasiado de H y corre hacia el destino", "Porque no usa breadcrumbs", "No puede"], 1, "Expande muy poco (rápida), pero sin garantía de óptimo."),
      test("Juego de tiles con 4 direcciones. ¿Mejor heurística?", ["Manhattan", "Euclídea al cuadrado", "H = 0", "Aleatoria"], 0, ""),
      test("Si H vale 0 siempre, A* es…", ["BFS", "Dijkstra", "DFS", "Voraz"], 1, ""),
      huecos("H según la heurística elegida.", String.raw`switch (heuristic)
{
case MANHATTAN: h = neighbor.distanceManhattan(destination); ▢;
case EUCLIDEAN: h = neighbor.distanceEuclidean(destination); break;
case SQUARED:   h = neighbor.▢(destination); break;
}`, ["break", "distanceSquared", "return", "distanceEuclidean", "continue"], ["break", "distanceSquared"], "Sin el break, Manhattan caería a la euclídea."),
      test("Las teclas de prueba del handout para A* son…", ["J, K, L", "B (Manhattan), N (euclídea), M (al cuadrado); con Shift, continuo", "1, 2, 3", "F1–F3"], 1, "J era BFS y K Dijkstra."),
      orden("TODO 4: mover el enemigo con un clic.", [
        "Vector2D mouse = input->GetMousePosition();",
        "int wx = (int)mouse.getX() - render->camera.x;",
        "int wy = (int)mouse.getY() - render->camera.y;",
        "Vector2D tile = map->WorldToMap(wx, wy);",
        "SetPosition(map->MapToWorld((int)tile.getX(), (int)tile.getY()));",
        "pathfinding->ResetPath(tile);"], "Pantalla → mundo (quitar cámara) → casilla → colocar → reiniciar búsqueda."),
      test("Clic en (300, 200) con camera.x = −640. ¿x del mundo?", ["300", "940", "−340", "640"], 1, "mundo = pantalla − camera.x."),
      test("¿Qué hay que añadir en ResetPath para A*?", ["Nada", "Vaciar frontierAStar y meter el inicio (como hacías con frontierDijkstra)", "Borrar el mapa", "Poner H a 0"], 1, "Si no, tras el clic la búsqueda no empieza."),
      test("¿Qué ventaja práctica tiene A* para un enemigo que persigue?", ["Encuentra caminos más largos", "Visita muchas menos casillas: puedes recalcular más a menudo o tener más enemigos", "No necesita mapa", "Va en diagonal siempre"], 1, ""),
      escribe("Escribe la prioridad F con `g` (int) y `h` (float) como int, sumando.", ["g + (int)h", "(int)h + g", "g + static_cast<int>(h)"], "", { ph: "g + ..." }),
      test("Experimento del TODO 5: un muro en forma de U entre enemigo y jugador. ¿Qué verás con A*?", ["Nada especial", "Primero se mete en la U (H le dice que el jugador está ahí) y luego la rodea", "No encuentra camino", "Va en línea recta atravesando"], 1, "Es el caso que mejor enseña que H solo es una estimación.")
    ]
  });
})();
