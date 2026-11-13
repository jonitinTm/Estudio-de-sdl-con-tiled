Curso.practica({
  leccion: "l11",
  titulo: "Escribe PropagateBFS paso a paso",
  intro: "Construirás una iteración de BFS como en el handout: sacar el primero de la cola, generar sus 4 vecinos, añadir los nuevos, limitar a lo caminable y parar al llegar al jugador.",
  pasos: [
    {
      t: "Sacar el primero de la cola",
      exp: `<p><code>frontier</code> es una <code>std::queue&lt;Vector2D&gt;</code>. En una cola se <em>mira</em> el primero con un método y se <em>quita</em> con otro (pop no devuelve nada en C++).</p>`,
      code: String.raw`void Pathfinding::PropagateBFS()
{
    if (frontier.empty()) return;

    Vector2D frontierTile = frontier.§s1§;
    frontier.§s2§;`,
      slots: {
        s1: { ok: ["front()"], err: [[/^top\(\)$/, "top() es de std::stack y std::priority_queue. En std::queue es <code>front()</code>."], [/^pop\(\)$/, "En C++ pop() no devuelve el elemento: primero léelo con front()."]], w: 9 },
        s2: { ok: ["pop()"], err: [[/^pop_front\(\)$/, "Eso es de std::list/deque. std::queue usa <code>pop()</code>."]], w: 8 }
      },
      pistas: ["El primero de la cola está “delante”.", "Quitar de una cola: <code>pop()</code>."],
      bien: "<p>Cola = FIFO: sale primero lo que entró primero. Eso es lo que hace que BFS se expanda en anillos de distancia creciente.</p>"
    },
    {
      t: "Los 4 vecinos",
      exp: `<p>Crea una <code>std::list&lt;Vector2D&gt; neighbors</code> y añade los 4 vecinos de <code>frontierTile</code>: derecha (x+1), abajo (y+1), izquierda (x−1) y arriba (y−1).</p>`,
      escribe: {
        filas: 6,
        checks: [
          [/std::list<Vector2D>neighbors;|list<Vector2D>neighbors;|std::vector<Vector2D>neighbors;/, "Declara la lista: <code>std::list&lt;Vector2D&gt; neighbors;</code>"],
          [/Vector2D\(frontierTile\.getX\(\)\+1,frontierTile\.getY\(\)\)/, "Falta el vecino de la derecha: <code>Vector2D(frontierTile.getX() + 1, frontierTile.getY())</code>"],
          [/Vector2D\(frontierTile\.getX\(\),frontierTile\.getY\(\)\+1\)/, "Falta el de abajo (y + 1)."],
          [/Vector2D\(frontierTile\.getX\(\)-1,frontierTile\.getY\(\)\)/, "Falta el de la izquierda (x − 1)."],
          [/Vector2D\(frontierTile\.getX\(\),frontierTile\.getY\(\)-1\)/, "Falta el de arriba (y − 1)."],
          [/neighbors\.push_back\(/, "Añádelos con <code>neighbors.push_back(...)</code>."]
        ],
        sol: String.raw`    std::list<Vector2D> neighbors;
    neighbors.push_back(Vector2D(frontierTile.getX() + 1, frontierTile.getY()));
    neighbors.push_back(Vector2D(frontierTile.getX(),     frontierTile.getY() + 1));
    neighbors.push_back(Vector2D(frontierTile.getX() - 1, frontierTile.getY()));
    neighbors.push_back(Vector2D(frontierTile.getX(),     frontierTile.getY() - 1));`
      },
      pistas: ["Cada vecino cambia solo UNA coordenada en ±1.", "<code>neighbors.push_back(Vector2D(frontierTile.getX() + 1, frontierTile.getY()));</code> y tres más."],
      bien: "<p>Con 8 vecinos (diagonales) el enemigo podría ir en diagonal, pero también colarse entre dos muros que se tocan en una esquina.</p>"
    },
    {
      t: "Añadir los no visitados",
      exp: `<p>Para cada vecino: si <strong>no</strong> está en visited, mételo en la frontera y en visited. El handout tiene la función <code>IsVisited(Vector2D)</code> (si no, búscalo recorriendo <code>visited</code>).</p>`,
      escribe: {
        filas: 7,
        checks: [
          [/for\(constauto&neighbor:neighbors\)|for\(auto&neighbor:neighbors\)|for\(autoneighbor:neighbors\)|for\(constauto&\w+:neighbors\)/, "Recorre los vecinos: <code>for (const auto&amp; neighbor : neighbors)</code>"],
          [/if\(!IsVisited\(\w+\)\)|if\(!alreadyVisited\)|if\(!\w*[vV]isited\w*\)/, "Comprueba que NO esté visitado: <code>if (!IsVisited(neighbor))</code>"],
          [/frontier\.push\(\w+\);/, "Añádelo a la frontera: <code>frontier.push(neighbor);</code>"],
          [/visited\.push_back\(\w+\);/, "Y márcalo como visitado: <code>visited.push_back(neighbor);</code>"]
        ],
        prohibido: [[/frontier\.push_back/, "std::queue no tiene push_back: es <code>push</code>."]],
        sol: String.raw`    for (const auto& neighbor : neighbors)
    {
        if (!IsVisited(neighbor))
        {
            frontier.push(neighbor);
            visited.push_back(neighbor);
        }
    }
}`
      },
      pistas: ["for-each, if (!visitado), dos líneas dentro.", "Se marca como visitado al DESCUBRIRLO (al meterlo en la frontera), no al sacarlo."],
      bien: "<p>Si ejecutas ahora y pulsas J, verás una búsqueda que se expande para siempre, atravesando muros y saliendo del mapa. Es lo esperado: falta el siguiente paso.</p>"
    },
    {
      t: "IsWalkable: dentro del mapa",
      exp: `<p>Una casilla es caminable solo si está dentro del mapa. Tienes <code>Vector2D size = map-&gt;GetMapSizeInTiles();</code>. Completa la condición (x e y entre 0 y el tamaño, sin llegar).</p>`,
      code: String.raw`bool Pathfinding::IsWalkable(int x, int y)
{
    Vector2D size = map->GetMapSizeInTiles();
    if (x >= 0 && y >= 0 && x < §s1§ && y < §s2§)
    {
        int gid = layerNav->Get(x, y);
        if (gid §s3§ blockedGid) return true;
    }
    return false;
}`,
      slots: {
        s1: { ok: ["size.getX()", "(int)size.getX()"], err: [[/^size\.getY\(\)$/, "X se compara con el ANCHO: size.getX()."]], w: 12 },
        s2: { ok: ["size.getY()", "(int)size.getY()"], err: [[/^size\.getX\(\)$/, "Y se compara con el ALTO: size.getY()."]], w: 12 },
        s3: { ok: ["!="], err: [[/^==$/, "Así solo serían caminables las casillas BLOQUEADAS. Queremos las distintas."]], w: 3 }
      },
      pistas: ["Ancho = getX(), alto = getY().", "Caminable = “no es el gid bloqueado”."],
      bien: "<p>Comprobar los límites ANTES de <code>layerNav-&gt;Get(x, y)</code> es obligatorio: con x = −1 leerías fuera del vector.</p>"
    },
    {
      t: "Usar IsWalkable en BFS",
      exp: `<p>Vuelve al <code>if</code> del paso 3 y añade la condición de caminable. Completa el hueco.</p>`,
      code: String.raw`        if (§s1§ && !IsVisited(neighbor))`,
      slots: { s1: { ok: ["IsWalkable((int)neighbor.getX(),(int)neighbor.getY())", "IsWalkable(neighbor.getX(),neighbor.getY())"], err: [[/^IsWalkable\(neighbor\)$/, "IsWalkable recibe dos enteros (x, y), no un Vector2D."]], w: 46, sol: "IsWalkable((int)neighbor.getX(), (int)neighbor.getY())" } },
      pistas: ["<code>IsWalkable(x, y)</code> con las coordenadas del vecino."],
      bien: "<p>Ahora la búsqueda respeta los muros de tu capa de navegación y nunca sale del mapa.</p>"
    },
    {
      t: "Parar al encontrar al jugador",
      exp: `<p>Justo después de leer <code>frontierTile</code> (antes de expandir), comprueba si es el destino. Si lo es, no sigas expandiendo.</p>`,
      code: String.raw`    Vector2D frontierTile = frontier.front();
    if (frontierTile §s1§ destination) {
        foundDestination = true;
        §s2§;
    }
    frontier.pop();`,
      slots: { s1: { ok: ["=="], err: [[/^=$/, "<code>=</code> asigna; para comparar es <code>==</code>."]], w: 3 }, s2: { ok: ["return"], err: [[/^break$/, "No estamos en un bucle: para salir de la función se usa <code>return</code>."]], w: 7 } },
      pistas: ["Comparar dos Vector2D: <code>==</code>.", "Salir de la función."],
      bien: "<p>BFS ya sabe que el jugador es alcanzable… pero aún no sabe por dónde ir. Eso lo resuelves en la L12 con los breadcrumbs.</p>"
    }
  ]
});
