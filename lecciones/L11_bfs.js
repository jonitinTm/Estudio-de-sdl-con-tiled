(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "l11", num: "11", grupo: "Bloque 6 · Inteligencia artificial", corto: "Pathfinding BFS", pdf: "L11_Pathfinding_BFS",
    titulo: "Pathfinding I: grafos y búsqueda en anchura (BFS)",
    resumen: "El mapa como grafo de tiles, DFS vs BFS, la frontera que se expande y cómo limitarla a lo caminable.",
    intro: "Para que un enemigo te persiga no basta con “ir hacia el jugador”: hay muros. El pathfinding encuentra una ruta válida entre dos puntos esquivando obstáculos. Empezamos por el algoritmo más simple, BFS, ejecutándolo paso a paso como en el handout.",
    objetivos: ["Ver un mapa de tiles como un grafo de nodos y vecinos", "Distinguir búsqueda en profundidad (DFS) y en anchura (BFS)", "Implementar PropagateBFS con frontier (cola) y visited", "Limitar la búsqueda con IsWalkable y parar al llegar al destino"],
    html: () => `
<h2>¿Qué es el pathfinding?</h2>
<p>Encontrar una ruta válida entre dos puntos en un espacio con obstáculos. Lo usan los GPS, los robots y, en juegos, los point-and-click, los NPC que van hacia ti o los enemigos que patrullan plataformas.</p>

<h2>El mapa como grafo</h2>
<p>Un <strong>grafo</strong> son <strong>nodos</strong> (puntos) y <strong>aristas</strong> (conexiones). En un juego 2D de tiles es natural: cada tile es un nodo, y se conecta con sus vecinos. Cada nodo puede ser <strong>caminable</strong> (suelo) o <strong>bloqueado</strong> (muro, vacío). Con <strong>4 direcciones</strong> (arriba, abajo, izquierda, derecha) el movimiento es más simple; con 8 se permiten diagonales.</p>
<p>¿De dónde salen los tiles bloqueados? De una nueva capa del mapa: la <strong>capa de navegación</strong>, que pintas en Tiled igual que la de colisiones (L09).</p>

<h2>Recorrer un árbol: DFS vs BFS</h2>
${code(`        A
      / | \\
     B  C  D
    / \\  \\
   G   F  E
   |
   H

DFS (profundidad): A, B, G, H, F, C, E, D   -> baja hasta el fondo antes de probar el hermano
BFS (anchura):     A, B, C, D, G, F, E, H   -> primero todos los de distancia 1, luego 2, luego 3…`, "txt", "Mismo árbol, dos órdenes")}
<p><strong>BFS</strong> (Breadth First Search) explora todos los vecinos antes de avanzar. Expande una especie de anillo, la <strong>frontera</strong>. Como explora por distancias, el primer camino que encuentra a un nodo es el más corto en número de pasos (si todos los pasos cuestan lo mismo).</p>

${code(`frontier = Queue()
frontier.push(start)
visited = {start}

while not frontier.empty():
    current = frontier.pop()
    # (TODO 4) si current es el destino -> parar
    for neighbour in neighbours(current):        # 4 direcciones
        # (TODO 3) solo si es caminable y está dentro del mapa
        if neighbour not in visited:
            frontier.push(neighbour)
            visited.add(neighbour)`, "pseudo", "BFS iterativo")}

${nota(`<p>La clave es la <strong>cola</strong> (FIFO: el primero que entra es el primero que sale). Si usaras una pila (LIFO) tendrías DFS. Cambiar una sola estructura de datos cambia el algoritmo.</p>`)}

${demo("d-bfs", "BFS paso a paso", "Clic en el lienzo para usar J / Shift+J / R · arrastra E y P · pinta muros", `<div id="bfs-root" style="display:grid;gap:12px"></div>`)}
<p>Leyenda: <span style="background:rgba(230,150,20,.55);padding:0 6px;border-radius:3px">frontier</span> <span style="background:rgba(53,82,200,.22);padding:0 6px;border-radius:3px">visited</span>, recuadro azul = nodo actual (el último <code>pop</code>). <strong>E</strong> es el enemigo (start) y <strong>P</strong> el jugador (destino). Desmarca “Parar al llegar” y verás que BFS explora <em>todo</em> el mapa alcanzable.</p>

<h2>Lo que trae el handout</h2>
<ul>
<li>Una entidad <code>Enemy</code> (misma estructura que Player), creada por el EntityManager y colocada desde <code>Scene::Start()</code>.</li>
<li>En Map: <code>WorldToMap(x, y)</code>, <code>GetMapSizeInTiles()</code>, <code>GetTileWidth()</code>, <code>GetTileHeight()</code> y <code>GetNavigationLayer()</code>.</li>
<li>Una clase <code>Pathfinding</code> con <code>frontier</code> (std::queue), <code>visited</code> (std::list) y una función para dibujar la búsqueda. El Enemy la crea y hace <strong>una iteración</strong> cada vez que pulsas <kbd>J</kbd> (o muchas mientras mantienes <kbd>Shift</kbd>+<kbd>J</kbd>); <kbd>R</kbd> resetea.</li>
</ul>
${code(String.raw`
// Map.cpp: de píxeles del mundo a casilla
Vector2D Map::WorldToMap(int x, int y)
{
    return Vector2D((float)(x / mapData.tileWidth), (float)(y / mapData.tileHeight));
}`, "cpp", "La inversa de MapToWorld")}
${nota(`<p>Todo el pathfinding trabaja en <strong>coordenadas de tile</strong>, no en píxeles. Convierte la posición del enemigo y del jugador con <code>WorldToMap</code> antes de buscar, y el camino resultante con <code>MapToWorld</code> para moverte.</p>`, "warn")}

<h2>Los TODOs del handout</h2>
${todo("TODO 0", "Tiled", `<p>Añade al mapa una capa <strong>Navigation</strong> y pinta las zonas bloqueadas (o las caminables, según el criterio del handout: mira qué gid compara <code>IsWalkable</code>).</p>`, "")}

${todo("TODO 1 y 2", "Pathfinding.cpp → PropagateBFS()", `<p>Si la frontera tiene elementos, saca uno y calcula sus 4 vecinos. Para cada vecino no visitado, añádelo a la frontera y a visited. Prueba ya: deberías ver una búsqueda que se expande para siempre (incluso fuera del mapa).</p>`,
      code(String.raw`
void Pathfinding::PropagateBFS()
{
    if (frontier.empty()) return;

    // TODO 1: sacar el primero de la cola
    Vector2D frontierTile = frontier.front();
    frontier.pop();

    // Sus 4 vecinos
    std::list<Vector2D> neighbors;
    neighbors.push_back(Vector2D(frontierTile.getX() + 1, frontierTile.getY()));
    neighbors.push_back(Vector2D(frontierTile.getX(),     frontierTile.getY() + 1));
    neighbors.push_back(Vector2D(frontierTile.getX() - 1, frontierTile.getY()));
    neighbors.push_back(Vector2D(frontierTile.getX(),     frontierTile.getY() - 1));

    // TODO 2: añadir los no visitados
    for (const auto& neighbor : neighbors)
    {
        bool alreadyVisited = false;
        for (const auto& v : visited) {
            if (v == neighbor) { alreadyVisited = true; break; }
        }
        if (!alreadyVisited) {
            frontier.push(neighbor);
            visited.push_back(neighbor);
        }
    }
}`, "cpp", "Pathfinding.cpp"))}

${todo("TODO 3", "Pathfinding.cpp → IsWalkable()", `<p>Devuelve true solo si la casilla está dentro del mapa y es caminable según la capa de navegación. Luego úsalo en PropagateBFS.</p>`,
      code(String.raw`
bool Pathfinding::IsWalkable(int x, int y)
{
    bool isWalkable = false;
    if (x >= 0 && y >= 0 && x < map->GetMapSizeInTiles().getX() && y < map->GetMapSizeInTiles().getY())
    {
        int gid = layerNav->Get(x, y);
        if (gid != blockedGid) isWalkable = true;     // blockedGid: el gid que pintaste como bloqueado
    }
    return isWalkable;
}

// En PropagateBFS(), dentro del bucle de vecinos:
if (IsWalkable((int)neighbor.getX(), (int)neighbor.getY()) && !alreadyVisited) { ... }`, "cpp", "Pathfinding.cpp"))}
${nota(`<p>El orden de la condición importa: comprueba los límites <strong>antes</strong> de llamar a <code>layerNav-&gt;Get(x, y)</code>. Con x = −1, <code>Get</code> leería fuera del vector y el programa podría crashear o devolver basura.</p>`, "warn")}

${todo("TODO 4", "Pathfinding.cpp", `<p>Antes de expandir, comprueba si has llegado al destino (la casilla del jugador). Si es así, detén la búsqueda.</p>`,
      code(String.raw`
void Pathfinding::PropagateBFS(Vector2D destination)
{
    if (frontier.empty()) return;

    Vector2D frontierTile = frontier.front();

    // TODO 4: ¿hemos llegado?
    if (frontierTile == destination) {
        foundDestination = true;
        return;                       // no hacemos pop: el destino queda como "actual"
    }

    frontier.pop();
    ...
}`, "cpp", "Pathfinding.cpp"))}

${nota(`<p>Buscar en una <code>std::list</code> si un nodo está en <code>visited</code> es lento (hay que recorrerla entera). Con un mapa grande se nota. Mejora típica: un <code>std::vector&lt;bool&gt;</code> o una matriz del tamaño del mapa, donde <code>visited[y * width + x]</code> se consulta al instante. Es la misma idea que usarás para los breadcrumbs en la L12.</p>`, "", "Para nota")}

${nota(`<p>Cuando metas los slimes (<code>slime_green.png</code>, <code>slime_purple.png</code> ya están en tus Assets) como <code>Enemy</code>, este es el sistema que les permitirá encontrar al caballero. En un plataformas, para enemigos que andan por el suelo, la capa de navegación debería marcar como caminables solo las casillas que tienen suelo debajo; para enemigos voladores, todo lo que no sea pared.</p>`, "game")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué estructura de datos convierte el algoritmo en BFS?", o: ["Pila (LIFO)", "Cola (FIFO)", "Cola de prioridad"], c: 1, e: "La cola hace que se expanda primero lo más cercano. Con pila sería DFS; con prioridad, Dijkstra." },
      { p: "¿Para qué sirve visited?", o: ["Para dibujar más bonito", "Para no volver a meter en la frontera un nodo ya descubierto", "Para guardar el camino"], c: 1, e: "Sin visited, BFS volvería atrás infinitamente." },
      { p: "Sin IsWalkable, ¿qué pasa?", o: ["Atraviesa muros y sale del mapa", "No encuentra nada", "Funciona igual"], c: 0, e: "Por eso al probar el TODO 2 ves una búsqueda infinita." },
      { p: "BFS con 4 direcciones encuentra el camino…", o: ["más barato aunque haya agua", "con menos pasos", "más recto"], c: 1, e: "Si todos los pasos cuestan igual, mínimo número de pasos. Para costes distintos: Dijkstra." }
    ])}
`,
    init(root) { Curso.pathDemo(root.querySelector("#bfs-root"), { algo: "bfs", terrain: false, breadcrumbs: false }); }
  });
})();
