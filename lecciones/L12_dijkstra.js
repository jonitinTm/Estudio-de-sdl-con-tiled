(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "l12", num: "12", grupo: "Bloque 6 · Inteligencia artificial", corto: "Breadcrumbs y Dijkstra", pdf: "L12_Pathfinding_Dijkstra",
    titulo: "Pathfinding II: recuperar el camino y Dijkstra",
    resumen: "Breadcrumbs para reconstruir la ruta, ComputePath, y Dijkstra con costes de movimiento y cola de prioridad.",
    intro: "BFS sabe que el destino es alcanzable, pero no te dice por dónde ir. Hoy guardas de dónde vienes en cada casilla (breadcrumbs) para reconstruir la ruta, y luego das el salto a Dijkstra: el mismo algoritmo, pero prefiriendo los caminos baratos cuando el terreno cuesta distinto.",
    objetivos: ["Guardar breadcrumbs durante la expansión", "Reconstruir el camino al revés con ComputePath", "Entender Dijkstra = BFS + coste + cola de prioridad", "Usar costSoFar y MovementCost con terrenos de Tiled"],
    html: () => `
<h2>Breadcrumbs: miguitas de pan</h2>
<p>BFS explora el camino hacia <em>todos</em> los nodos. Para recuperar el que va del enemigo al jugador, basta con apuntar, cada vez que descubrimos un nodo, <strong>desde qué nodo llegamos</strong>. Es una matriz paralela a visited: <code>breadcrumbs[x][y] = nodo anterior</code>.</p>
<p>Cuando llegamos al destino, seguimos las miguitas hacia atrás: destino → de dónde vino → de dónde vino ese… hasta el inicio (que es su propia miguita). Le damos la vuelta y tenemos el camino.</p>
${code(`Ejemplo de la clase:
  Llegamos a A desde B
  Llegamos a B desde C
  Llegamos a C desde G
  Llegamos a G desde START
Camino (al revés): A <- B <- C <- G <- START
Camino final:      START -> G -> C -> B -> A`, "txt")}

${demo("d-dij", "BFS vs Dijkstra con breadcrumbs", "Clic en el lienzo: J paso, Shift+J continuo, R reset · pinta arena y agua", `<div id="dij-root" style="display:grid;gap:12px"></div>`)}
<p>Prueba esto: con el selector en <strong>BFS</strong>, el camino cruza el agua y la arena sin problema (para BFS todo cuesta 1). Cambia a <strong>Dijkstra</strong> y activa “Ver costSoFar”: el camino rodea el agua si eso sale más barato. Las líneas grises son los breadcrumbs: cada casilla apunta a la casilla de la que vino.</p>

<h2>Los TODOs del handout (parte 1: camino con BFS)</h2>
${todo("TODO 1", "Pathfinding.cpp → PropagateBFS()", `<p>Registra en los breadcrumbs, para cada vecino nuevo, la casilla desde la que llegaste. La matriz ya está creada en el constructor y se reinicia en <code>ResetPath()</code>.</p>`,
      code(String.raw`
for (const auto& neighbor : neighbors)
{
    int nx = (int)neighbor.getX(), ny = (int)neighbor.getY();
    if (IsWalkable(nx, ny) && !IsVisited(neighbor))
    {
        frontier.push(neighbor);
        visited.push_back(neighbor);
        breadcrumbs[nx][ny] = frontierTile;     // ¡de dónde vengo!
    }
}`, "cpp", "Pathfinding.cpp"))}

${todo("TODO 2", "Pathfinding.cpp → ComputePath()", `<p>Al alcanzar el destino, llama a <code>ComputePath</code>: sigue los breadcrumbs desde el destino hasta el origen. El origen es su propia miguita, ahí se para el bucle.</p>`,
      code(String.raw`
void Pathfinding::ComputePath(int x, int y)
{
    pathTiles.clear();

    Vector2D current(x, y);
    pathTiles.push_back(current);

    // Mientras la miguita no apunte a sí misma (eso solo pasa en el START)
    while (breadcrumbs[(int)current.getX()][(int)current.getY()] != current)
    {
        current = breadcrumbs[(int)current.getX()][(int)current.getY()];
        pathTiles.push_back(current);
    }

    std::reverse(pathTiles.begin(), pathTiles.end());   // #include <algorithm>
}

// En PropagateBFS(), al detectar el destino:
if (frontierTile == destination) {
    ComputePath((int)destination.getX(), (int)destination.getY());
    return;
}`, "cpp", "Pathfinding.cpp"))}
${nota(`<p>Para que el bucle termine, en <code>ResetPath()</code> el breadcrumb del START debe ser el propio START. Si lo dejas sin inicializar (o a (0,0)), el bucle puede no acabar nunca. Si tu camino “se cuelga”, mira esto primero.</p>`, "warn")}

<h2>Dijkstra</h2>
<p>En muchos mapas no todas las casillas cuestan lo mismo: andar por arena o agua es más lento. BFS no lo sabe. <strong>Dijkstra = BFS + coste de movimiento + cola de prioridad</strong>:</p>
<ul>
<li>Cada casilla guarda el <strong>coste acumulado</strong> desde el inicio (<code>costSoFar</code>).</li>
<li>La frontera es una <strong>cola de prioridad</strong>: siempre sale primero el nodo con <em>menor coste acumulado</em>, no el que entró antes.</li>
<li>Un nodo ya visitado puede <strong>volver a la frontera</strong> si encontramos una forma más barata de llegar a él.</li>
</ul>
${code(`frontier = PriorityQueue()
frontier.put(start, 0)
visited.put(start)
breadcrumbs[start] = start
cost_so_far[start] = 0

while not frontier.empty():
    current = frontier.pop()                     # el de MENOR coste
    if current == destination: ComputePath(); break
    for neighbour in walkable_neighbours(current):
        cost = cost_so_far[current] + MovementCost(neighbour)
        if neighbour not in visited or cost < cost_so_far[neighbour]:
            cost_so_far[neighbour] = cost
            frontier.put(neighbour, cost)
            visited.put(neighbour)
            breadcrumbs[neighbour] = current`, "pseudo", "Dijkstra")}
${nota(`<p>En el pseudocódigo de la diapositiva pone <code>cost_so_far[frontier]</code>; debe leerse <code>cost_so_far[current]</code>: el coste del nodo que acabamos de sacar más lo que cuesta pisar el vecino.</p>`, "warn", "Errata en la diapositiva")}

${todo("TODO 3", "Pathfinding.cpp → PropagateDijkstra()", `<p>Tomando BFS como referencia, implementa Dijkstra con <code>frontierDijkstra</code> (priority_queue) y <code>costSoFar</code>. Modifica el mapa en Tiled para tener casillas con costes distintos y entiende <code>MovementCost()</code>. Pruébalo con <kbd>K</kbd> y <kbd>Shift</kbd>+<kbd>K</kbd>.</p>`,
      code(String.raw`
// Pathfinding.h  (lo trae el handout)
// pair<coste, casilla>. std::greater -> el de MENOR coste arriba (min-heap)
std::priority_queue<std::pair<int, Vector2D>,
                    std::vector<std::pair<int, Vector2D>>,
                    std::greater<std::pair<int, Vector2D>>> frontierDijkstra;
std::vector<std::vector<int>> costSoFar;

// Pathfinding.cpp
int Pathfinding::MovementCost(int x, int y)
{
    int ret = -1;
    if (x >= 0 && y >= 0 && x < map->GetMapSizeInTiles().getX() && y < map->GetMapSizeInTiles().getY())
    {
        int gid = layerNav->Get(x, y);
        if (gid == blockedGid)     ret = -1;   // no se puede pasar
        else if (gid == highCostGid) ret = 5;  // p. ej. agua / arena
        else                        ret = 1;   // suelo normal
    }
    return ret;
}

void Pathfinding::PropagateDijkstra(Vector2D destination)
{
    if (frontierDijkstra.empty()) return;

    Vector2D frontierTile = frontierDijkstra.top().second;
    int frontierCost      = frontierDijkstra.top().first;
    frontierDijkstra.pop();

    int fx = (int)frontierTile.getX(), fy = (int)frontierTile.getY();

    // Entrada vieja: ya encontramos un camino más barato a esta casilla
    if (frontierCost > costSoFar[fx][fy]) return;

    if (frontierTile == destination) {
        ComputePath(fx, fy);
        return;
    }

    std::list<Vector2D> neighbors = {
        Vector2D(fx + 1, fy), Vector2D(fx, fy + 1), Vector2D(fx - 1, fy), Vector2D(fx, fy - 1) };

    for (const auto& neighbor : neighbors)
    {
        int nx = (int)neighbor.getX(), ny = (int)neighbor.getY();
        int moveCost = MovementCost(nx, ny);
        if (moveCost < 0) continue;                         // bloqueado o fuera del mapa

        int newCost = costSoFar[fx][fy] + moveCost;
        if (!IsVisited(neighbor) || newCost < costSoFar[nx][ny])
        {
            costSoFar[nx][ny] = newCost;
            frontierDijkstra.push(std::make_pair(newCost, neighbor));
            if (!IsVisited(neighbor)) visited.push_back(neighbor);
            breadcrumbs[nx][ny] = frontierTile;
        }
    }
}`, "cpp", "Pathfinding"))}

${nota(`<p><code>std::priority_queue</code> por defecto es un <strong>max-heap</strong>: saca el <em>mayor</em>. Para Dijkstra necesitas el menor, por eso se usa <code>std::greater</code>. Si olvidas esto, el enemigo elegirá siempre el camino más caro. Además, para comparar <code>pair&lt;int, Vector2D&gt;</code> con <code>greater</code>, Vector2D necesita <code>operator&lt;</code> (solo se usa para desempatar).</p>`, "warn")}

<h2>Resumen de los tres algoritmos</h2>
<div class="table-wrap"><table class="t"><thead><tr><th></th><th>Frontera</th><th>Encuentra</th><th>Coste</th></tr></thead><tbody>
<tr><td>DFS</td><td>Pila</td><td>Un camino cualquiera</td><td>Barato, pero el camino suele ser malo</td></tr>
<tr><td>BFS</td><td>Cola</td><td>El de menos pasos</td><td>Explora en todas direcciones</td></tr>
<tr><td>Dijkstra</td><td>Cola de prioridad por coste acumulado</td><td>El más barato con costes distintos</td><td>Explora en todas direcciones, prefiriendo lo barato</td></tr>
<tr><td>A* (próxima clase)</td><td>Prioridad = coste + heurística (distancia estimada al destino)</td><td>El más barato</td><td>Mucho menos nodos: “apunta” hacia el destino</td></tr>
</tbody></table></div>

${nota(`<p>Para que un slime persiga al caballero: cada cierto tiempo (no cada frame, es caro) calcula el camino desde <code>WorldToMap(enemigo)</code> hasta <code>WorldToMap(jugador)</code>; luego, en cada Update, mueve al enemigo hacia el centro del siguiente tile del camino (<code>MapToWorld</code>) con su velocidad. Cuando llegue a ese tile, pasa al siguiente.</p>`, "game")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué guarda breadcrumbs[x][y]?", o: ["El coste de la casilla", "La casilla desde la que se llegó a (x,y)", "Si la casilla es caminable"], c: 1, e: "Con eso se reconstruye el camino hacia atrás." },
      { p: "¿Cómo sabe ComputePath que ha llegado al inicio?", o: ["Cuando el camino mide 100", "Cuando la miguita apunta a sí misma", "Cuando la casilla es (0,0)"], c: 1, e: "Por eso ResetPath pone breadcrumbs[start] = start." },
      { p: "¿Qué cambia de BFS a Dijkstra?", o: ["Las 4 direcciones", "Se añade coste acumulado y la frontera pasa a ser cola de prioridad", "Ya no hay visited"], c: 1, e: "Dijkstra = BFS + coste + cola de prioridad." },
      { p: "En Dijkstra, ¿puede un nodo ya visitado volver a la frontera?", o: ["Nunca", "Sí, si se encuentra un camino más barato hasta él", "Solo si es el destino"], c: 1, e: "La condición es: no visitado O cost < costSoFar." },
      { p: "Si todos los tiles cuestan 1, Dijkstra y BFS…", o: ["encuentran caminos con la misma longitud", "Dijkstra encuentra uno más corto", "BFS falla"], c: 0, e: "Con costes iguales, Dijkstra se comporta como BFS (aunque es más lento por la cola de prioridad)." }
    ])}
`,
    init(root) { Curso.pathDemo(root.querySelector("#dij-root"), { algo: "dijkstra", terrain: true, breadcrumbs: true, choose: true }); }
  });
})();
