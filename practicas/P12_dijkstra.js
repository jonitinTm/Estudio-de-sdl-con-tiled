Curso.practica({
  leccion: "l12",
  titulo: "Reconstruye el camino y pasa a Dijkstra",
  intro: "Primero dejarás miguitas de pan durante BFS y escribirás ComputePath. Después convertirás BFS en Dijkstra con costes y una cola de prioridad.",
  pasos: [
    {
      t: "Dejar la miguita",
      exp: `<p>Cuando descubres un vecino nuevo, apunta en <code>breadcrumbs[nx][ny]</code> desde qué casilla llegaste a él.</p>`,
      code: String.raw`        if (IsWalkable(nx, ny) && !IsVisited(neighbor))
        {
            frontier.push(neighbor);
            visited.push_back(neighbor);
            breadcrumbs[nx][ny] = §s1§;
        }`,
      slots: { s1: { ok: ["frontierTile"], err: [[/^neighbor$/, "Así cada casilla apuntaría a sí misma. Guarda DE DÓNDE vienes: la casilla que acabas de sacar."], [/^start$/, "Todas apuntarían al inicio y no podrías reconstruir el camino."]], w: 14 } },
      pistas: ["¿Qué casilla estabas expandiendo cuando encontraste este vecino?"],
      bien: "<p>Cada casilla descubierta apunta a su “padre”. Juntas forman un árbol que sale del enemigo.</p>"
    },
    {
      t: "El inicio es su propia miguita",
      exp: `<p>En <code>ResetPath(start)</code>, para que la reconstrucción sepa dónde parar, el breadcrumb del inicio debe apuntar a sí mismo.</p>`,
      code: String.raw`    breadcrumbs[(int)start.getX()][(int)start.getY()] = §s1§;`,
      slots: { s1: { ok: ["start"], err: [[/^Vector2D\(0,0\)$|^\{0,0\}$/, "(0,0) es una casilla real del mapa: la reconstrucción no sabría parar. Debe ser el propio start."]], w: 8 } },
      pistas: ["“Su propia miguita”."],
      bien: "<p>Si se te olvida, ComputePath puede quedarse en un bucle infinito y congelar el juego.</p>"
    },
    {
      t: "ComputePath: seguir las miguitas",
      exp: `<p>Empieza en el destino, añádelo a <code>pathTiles</code> y, <strong>mientras</strong> su miguita no apunte a sí mismo, salta a la miguita y añádela. Ya tienes <code>Vector2D current(x, y);</code>.</p>`,
      escribe: {
        antes: String.raw`void Pathfinding::ComputePath(int x, int y)
{
    pathTiles.clear();
    Vector2D current(x, y);
    pathTiles.push_back(current);`,
        despues: "    // (siguiente paso: dar la vuelta)\n}",
        filas: 6,
        checks: [
          [/while\(breadcrumbs\[\(int\)current\.getX\(\)\]\[\(int\)current\.getY\(\)\]!=current\)|while\(!\(breadcrumbs\[\(int\)current\.getX\(\)\]\[\(int\)current\.getY\(\)\]==current\)\)/, "La condición: <code>while (breadcrumbs[(int)current.getX()][(int)current.getY()] != current)</code>"],
          [/current=breadcrumbs\[\(int\)current\.getX\(\)\]\[\(int\)current\.getY\(\)\];/, "Dentro, salta a la miguita: <code>current = breadcrumbs[(int)current.getX()][(int)current.getY()];</code>"],
          [/current=breadcrumbs[^;]*;pathTiles\.push_back\(current\);/, "Después de saltar, añade la nueva casilla: <code>pathTiles.push_back(current);</code>"]
        ],
        sol: String.raw`    while (breadcrumbs[(int)current.getX()][(int)current.getY()] != current)
    {
        current = breadcrumbs[(int)current.getX()][(int)current.getY()];
        pathTiles.push_back(current);
    }`
      },
      pistas: ["Bucle while con dos líneas dentro: saltar y añadir.", "Si Vector2D no tiene <code>!=</code>, usa <code>!(a == b)</code>."],
      bien: "<p>Al acabar, pathTiles va del jugador al enemigo: está al revés.</p>"
    },
    {
      t: "Darle la vuelta",
      exp: `<p>Invierte el vector para que vaya del enemigo al jugador. Hay una función de <code>&lt;algorithm&gt;</code> que lo hace.</p>`,
      code: String.raw`    std::§s1§(pathTiles.begin(), pathTiles.end());`,
      slots: { s1: { ok: ["reverse"], err: [[/^sort$/, "Ordenar no es invertir: las casillas no tienen un orden “natural”."]], w: 9 } },
      pistas: ["“Invertir” en inglés."],
      bien: "<p>Y en PropagateBFS, al encontrar el destino, llama a <code>ComputePath(destino.x, destino.y)</code>. Ya tienes un camino que el enemigo puede seguir.</p>"
    },
    {
      t: "Dijkstra: la cola de prioridad",
      exp: `<p>Dijkstra saca siempre el nodo de <strong>menor coste</strong>. <code>std::priority_queue</code> por defecto saca el <em>mayor</em>; para invertirlo se le pasa un comparador.</p>`,
      code: String.raw`std::priority_queue<std::pair<int, Vector2D>,
                    std::vector<std::pair<int, Vector2D>>,
                    std::§s1§<std::pair<int, Vector2D>>> frontierDijkstra;`,
      slots: { s1: { ok: ["greater"], err: [[/^less$/, "less es el valor por defecto: sacaría el de MAYOR coste y el enemigo elegiría el peor camino."]], w: 9 } },
      pistas: ["Lo contrario de <code>std::less</code>."],
      bien: "<p>El par es (coste, casilla): la cola ordena por el primer elemento, el coste.</p>"
    },
    {
      t: "Coste nuevo de un vecino",
      exp: `<p>Para cada vecino caminable: coste para llegar a él = coste acumulado hasta la casilla actual + lo que cuesta pisar el vecino.</p>`,
      code: String.raw`        int moveCost = MovementCost(nx, ny);
        if (moveCost < 0) continue;
        int newCost = §s1§ + moveCost;`,
      slots: { s1: { ok: ["costSoFar[fx][fy]"], err: [[/^costSoFar\[nx\]\[ny\]$/, "Ese es el coste (viejo) del VECINO. Lo que sumas es el coste de la casilla ACTUAL (fx, fy)."], [/^frontierCost$/, "Funciona casi siempre, pero el valor fiable es <code>costSoFar[fx][fy]</code>."]], w: 18 } },
      pistas: ["La casilla actual es (fx, fy).", "<code>costSoFar[fx][fy]</code>"],
      bien: "<p>Aquí está la errata de la diapositiva: pone <code>cost_so_far[frontier]</code>, pero es el coste de <em>current</em>.</p>"
    },
    {
      t: "¿Mejora el camino?",
      exp: `<p>Escribe el <code>if</code> clave de Dijkstra: si el vecino <strong>no</strong> está visitado <strong>o</strong> el nuevo coste es menor que el que tenía, actualiza <code>costSoFar[nx][ny]</code>, mételo en la frontera con su coste (<code>std::make_pair(newCost, neighbor)</code>), márcalo visitado si no lo estaba y deja la miguita.</p>`,
      escribe: {
        filas: 9,
        checks: [
          [/if\(!IsVisited\(neighbor\)\|\|newCost<costSoFar\[nx\]\[ny\]\)/, "Condición: <code>if (!IsVisited(neighbor) || newCost &lt; costSoFar[nx][ny])</code>"],
          [/costSoFar\[nx\]\[ny\]=newCost;/, "Actualiza el coste: <code>costSoFar[nx][ny] = newCost;</code>"],
          [/frontierDijkstra\.push\((std::)?make_pair\(newCost,neighbor\)\);|frontierDijkstra\.push\(\{newCost,neighbor\}\);/, "Añade a la frontera con prioridad: <code>frontierDijkstra.push(std::make_pair(newCost, neighbor));</code>"],
          [/breadcrumbs\[nx\]\[ny\]=frontierTile;/, "Deja la miguita: <code>breadcrumbs[nx][ny] = frontierTile;</code>"],
          [/visited\.push_back\(neighbor\)/, "Márcalo como visitado: <code>if (!IsVisited(neighbor)) visited.push_back(neighbor);</code>"]
        ],
        prohibido: [[/&&newCost</, "Con <code>&amp;&amp;</code> nunca podrías mejorar un nodo ya visitado (y nunca entrarías con uno nuevo). La condición es con <code>||</code>."]],
        sol: String.raw`        if (!IsVisited(neighbor) || newCost < costSoFar[nx][ny])
        {
            costSoFar[nx][ny] = newCost;
            frontierDijkstra.push(std::make_pair(newCost, neighbor));
            if (!IsVisited(neighbor)) visited.push_back(neighbor);
            breadcrumbs[nx][ny] = frontierTile;
        }`
      },
      pistas: ["Es el pseudocódigo de la diapositiva traducido a C++.", "Cuatro acciones dentro del if: coste, push, visited, breadcrumb."],
      bien: "<p>¡Dijkstra completo! Pruébalo en la demo de arriba pintando agua: el camino la rodea si es más barato. El siguiente paso del curso será A*, que es esto mismo con una heurística que “apunta” hacia el jugador.</p>"
    }
  ]
});
