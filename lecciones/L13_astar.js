(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "astar", num: "13", grupo: "Bloque 6 · Inteligencia artificial", corto: "A* y heurísticas", pdf: "L13_Pathfinding_AStar",
    titulo: "Pathfinding III: A* y las tres heurísticas",
    resumen: "F = G + H, PropagateAStar a partir de Dijkstra, distancias Manhattan, euclídea y al cuadrado, teclas B/N/M y mover el enemigo con el ratón.",
    intro: "Dijkstra encuentra el camino más barato, pero explora en todas direcciones como una mancha de aceite. A* hace lo mismo con un truco: a cada casilla le suma una estimación de lo que falta hasta el destino, así que se expande “apuntando” al jugador. Con una buena heurística visita muchas menos casillas y sigue dando el mejor camino.",
    objetivos: ["Entender F = G + H y qué es cada letra", "Implementar distanceManhattan, distanceEuclidean y distanceSquared en Vector2D", "Escribir PropagateAStar copiando Dijkstra y cambiando solo la prioridad", "Saber qué heurística usar y por qué la “al cuadrado” deja de garantizar el camino más corto", "Probarlo con las teclas y moviendo el enemigo con el ratón"],
    html: () => `
<h2>Los tres algoritmos, en una frase cada uno</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Algoritmo</th><th>Cómo se expande</th><th>Prioridad de la frontera</th></tr></thead><tbody>
<tr><td><strong>BFS</strong></td><td>Igual en todas direcciones</td><td>Orden de llegada (cola)</td></tr>
<tr><td><strong>Dijkstra</strong></td><td>Como BFS, pero prefiere lo barato</td><td><code>G</code>: coste acumulado desde el inicio</td></tr>
<tr><td><strong>A*</strong></td><td>Prefiere lo barato <em>y</em> lo que está cerca del destino</td><td><code>F = G + H</code></td></tr>
</tbody></table></div>

<h2>F = G + H</h2>
<ul>
<li><strong>G</strong>: lo que ya has pagado. El coste real desde el inicio hasta esta casilla (lo mismo que <code>costSoFar</code> en Dijkstra).</li>
<li><strong>H</strong>: lo que crees que te falta. Una <em>estimación</em> desde esta casilla hasta el destino. No es exacta: no sabe dónde hay muros.</li>
<li><strong>F</strong>: la suma. Es la <strong>prioridad</strong> con la que la casilla entra en la cola. Se saca siempre la de menor F.</li>
</ul>
${nota(`<p>La frase clave del handout: <strong>costSoFar guarda G; la cola usa F</strong>. Si guardas F en costSoFar, la H se acumula en cada paso y los costes se disparan. Es el error número 1 al pasar de Dijkstra a A*.</p>`, "warn", "No mezcles G y F")}

${demo("d-astar", "BFS vs Dijkstra vs A*", "J paso · Shift+J continuo · R reset · arrastra E y P · pinta muros, arena y agua", `<div id="astar-root" style="display:grid;gap:12px"></div>`)}
<p>Haz este experimento: deja el mapa igual, pulsa <strong>Reproducir</strong> con BFS, luego con Dijkstra y luego con A*. Mira el número de <strong>visited</strong> al encontrar el camino: A* visita muchas menos casillas. Después cambia la heurística a <strong>Euclídea al cuadrado</strong> y pon arena delante del jugador: verás que a veces el camino ya no es el más barato.</p>

<h2>Las tres heurísticas</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Heurística</th><th>Fórmula</th><th>Úsala cuando</th><th>¿Camino óptimo?</th></tr></thead><tbody>
<tr><td><strong>Manhattan</strong></td><td><code>|dx| + |dy|</code></td><td>Solo te mueves en 4 direcciones (tu juego de tiles)</td><td>Sí: nunca sobreestima con 4 direcciones</td></tr>
<tr><td><strong>Euclídea</strong></td><td><code>√(dx² + dy²)</code></td><td>Hay movimiento en diagonal</td><td>Sí: la línea recta nunca es más larga que el camino real</td></tr>
<tr><td><strong>Al cuadrado</strong></td><td><code>dx² + dy²</code></td><td>Prima el rendimiento (no hay raíz)</td><td><strong>No</strong>: sobreestima, y el error crece con el cuadrado de la distancia</td></tr>
</tbody></table></div>
<p>Una heurística que <strong>nunca sobreestima</strong> se llama <em>admisible</em>, y con ella A* garantiza el camino más corto. La al cuadrado no lo es: a 10 casillas estima 100. Por eso A* “corre” hacia el destino (expande poquísimo) pero puede elegir un camino peor. Es un intercambio: velocidad a cambio de precisión.</p>
${code(`Del enemigo (2, 5) al jugador (6, 8):  dx = 4, dy = 3
  Manhattan  = 4 + 3       = 7
  Euclídea   = √(16 + 9)   = 5
  Al cuadrado = 16 + 9     = 25   <- mucho más que los 7 pasos reales`, "txt")}

<h2>Los TODOs del handout</h2>
${todo("Antes de empezar", "Pathfinding.cpp", `<p>Repasa tu <code>PropagateDijkstra</code> de la L12 hasta entender cada línea. A* es Dijkstra con <strong>una línea distinta</strong> (la prioridad).</p>`, "")}

${todo("TODO 1", "Vector2D.h / Vector2D.cpp", `<p>Implementa las tres distancias entre dos vectores.</p>`,
      code(String.raw`// Vector2D.h
float distanceManhattan(const Vector2D& other) const;
float distanceEuclidean(const Vector2D& other) const;
float distanceSquared(const Vector2D& other) const;

// Vector2D.cpp
#include <cmath>

float Vector2D::distanceManhattan(const Vector2D& other) const
{
    return std::fabs(getX() - other.getX()) + std::fabs(getY() - other.getY());
}

float Vector2D::distanceEuclidean(const Vector2D& other) const
{
    float dx = getX() - other.getX();
    float dy = getY() - other.getY();
    return std::sqrt(dx * dx + dy * dy);
}

float Vector2D::distanceSquared(const Vector2D& other) const
{
    float dx = getX() - other.getX();
    float dy = getY() - other.getY();
    return dx * dx + dy * dy;          // sin raíz: más barato, pero sobreestima
}`, "cpp", "Vector2D"))}
${nota(`<p>Fíjate en el <code>const</code> del final: no modifican el vector, así que se pueden llamar sobre un <code>const Vector2D&amp;</code>. Y usa <code>std::fabs</code> (float), no <code>abs</code>, que con algunos includes trabaja con int y trunca.</p>`)}

${todo("TODO 2", "Pathfinding.cpp → PropagateAStar()", `<p>Copia <code>PropagateDijkstra</code>, cambia <code>frontierDijkstra</code> por <code>frontierAStar</code> y calcula la prioridad como <code>F = G + H</code>. <code>costSoFar</code> sigue guardando G.</p>`,
      code(String.raw`// Pathfinding.h
enum ASTAR_HEURISTICS { MANHATTAN = 0, EUCLIDEAN, SQUARED };
std::priority_queue<std::pair<int, Vector2D>,
                    std::vector<std::pair<int, Vector2D>>,
                    std::greater<std::pair<int, Vector2D>>> frontierAStar;
void PropagateAStar(ASTAR_HEURISTICS heuristic);

// Pathfinding.cpp
void Pathfinding::PropagateAStar(ASTAR_HEURISTICS heuristic)
{
    if (frontierAStar.empty()) return;

    Vector2D frontierTile = frontierAStar.top().second;
    frontierAStar.pop();
    int fx = (int)frontierTile.getX(), fy = (int)frontierTile.getY();

    if (frontierTile == destination) { ComputePath(fx, fy); return; }

    std::list<Vector2D> neighbors = {
        Vector2D(fx + 1, fy), Vector2D(fx, fy + 1), Vector2D(fx - 1, fy), Vector2D(fx, fy - 1) };

    for (const auto& neighbor : neighbors)
    {
        int nx = (int)neighbor.getX(), ny = (int)neighbor.getY();
        int moveCost = MovementCost(nx, ny);
        if (moveCost < 0) continue;                          // muro o fuera del mapa

        int g = costSoFar[fx][fy] + moveCost;                // G: coste real acumulado
        if (!IsVisited(neighbor) || g < costSoFar[nx][ny])
        {
            float h = 0.0f;                                  // H: estimación hasta el destino
            switch (heuristic)
            {
            case MANHATTAN: h = neighbor.distanceManhattan(destination); break;
            case EUCLIDEAN: h = neighbor.distanceEuclidean(destination); break;
            case SQUARED:   h = neighbor.distanceSquared(destination);   break;
            }
            int f = g + (int)h;                              // F: prioridad en la cola

            costSoFar[nx][ny] = g;                           // ¡G, no F!
            frontierAStar.push(std::make_pair(f, neighbor));
            if (!IsVisited(neighbor)) visited.push_back(neighbor);
            breadcrumbs[nx][ny] = frontierTile;
        }
    }
}`, "cpp", "Pathfinding"))}
${nota(`<p>En <code>ResetPath</code> también hay que vaciar <code>frontierAStar</code> y meter el inicio. Una forma sencilla de vaciar una priority_queue: <code>frontierAStar = decltype(frontierAStar)();</code> (o un <code>while (!q.empty()) q.pop();</code>).</p>`, "warn", "No olvides ResetPath")}
${nota(`<p>Si tu <code>destination</code> no es miembro de la clase, pásalo como parámetro igual que hacías en Dijkstra. Y el <code>(int)h</code> trunca la euclídea (5,9 → 5). Para un juego de tiles no importa; si quieres más precisión, usa <code>float</code> como prioridad.</p>`)}

${todo("TODO 3", "Enemy.cpp → teclas de prueba", `<p>Una tecla por heurística: <kbd>B</kbd> Manhattan, <kbd>N</kbd> euclídea, <kbd>M</kbd> al cuadrado. Pulsada = un paso; con <kbd>Shift</kbd> mantenido = continuo.</p>`,
      code(String.raw`Input& input = *Engine::GetInstance().input;
bool shift = input.GetKey(SDL_SCANCODE_LSHIFT) == KEY_REPEAT;

auto probar = [&](SDL_Scancode key, ASTAR_HEURISTICS h)
{
    KeyState k = input.GetKey(key);
    if (k == KEY_DOWN || (shift && k == KEY_REPEAT))
        pathfinding->PropagateAStar(h);
};
probar(SDL_SCANCODE_B, MANHATTAN);
probar(SDL_SCANCODE_N, EUCLIDEAN);
probar(SDL_SCANCODE_M, SQUARED);`, "cpp", "Enemy::Update"))}

${todo("TODO 4", "Enemy.cpp → mover el enemigo con un clic", `<p>Al hacer clic, coloca al enemigo en la casilla del ratón y reinicia la búsqueda desde allí.</p>`,
      code(String.raw`if (input.GetMouseButtonDown(SDL_BUTTON_LEFT) == KEY_DOWN)
{
    Vector2D mouse = input.GetMousePosition();                    // píxeles de PANTALLA
    Render& render = *Engine::GetInstance().render;
    // pantalla -> mundo: quita la cámara (que es negativa en este motor)
    Vector2D world(mouse.getX() - render.camera.x, mouse.getY() - render.camera.y);
    Vector2D tile = Engine::GetInstance().map->WorldToMap((int)world.getX(), (int)world.getY());

    Vector2D pos = Engine::GetInstance().map->MapToWorld((int)tile.getX(), (int)tile.getY());
    SetPosition(pos);                                             // mueve también el cuerpo físico
    pathfinding->ResetPath(tile);
}`, "cpp", "Enemy::Update"))}
${nota(`<p>Si la cámara está movida y te olvidas de restarla, el enemigo aparecerá desplazado exactamente lo que se ha movido la cámara. Si tu Render aplica una escala, divide también entre ella.</p>`, "warn")}

${todo("TODO 5", "Experimenta", `<ul>
<li>Compara cuánto expanden BFS (<kbd>J</kbd>), Dijkstra (<kbd>K</kbd>) y A* (<kbd>B</kbd>/<kbd>N</kbd>/<kbd>M</kbd>) desde el mismo sitio.</li>
<li>Cambia los costes de <code>MovementCost</code> y repite.</li>
<li>Haz clic en distintos sitios y mueve al jugador con WASD.</li>
<li>Cambia las zonas bloqueadas en Tiled: un muro en forma de U entre enemigo y jugador es el caso donde mejor se ve cómo A* “se equivoca” primero y luego rodea.</li>
</ul>`, "")}

<h2>Errores típicos</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Síntoma</th><th>Causa</th></tr></thead><tbody>
<tr><td>A* explora igual que Dijkstra</td><td>Calculas H pero metes G en la cola (o H siempre vale 0 porque destination no está inicializado)</td></tr>
<tr><td>Los costes de las casillas son enormes</td><td>Guardas F en costSoFar: la H se va sumando</td></tr>
<tr><td>Elige caminos que atraviesan el agua</td><td>Heurística al cuadrado (sobreestima) o MovementCost no se usa en G</td></tr>
<tr><td>El enemigo aparece lejos del clic</td><td>No restas la cámara al pasar de pantalla a mundo</td></tr>
<tr><td>La búsqueda no empieza tras el clic</td><td>ResetPath no mete el inicio en frontierAStar</td></tr>
</tbody></table></div>

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "En A*, ¿qué guarda costSoFar?", o: ["F", "G: el coste real acumulado desde el inicio", "H"], c: 1, e: "La cola usa F; costSoFar guarda G." },
      { p: "Del (0,0) al (3,4), ¿cuánto vale la heurística Manhattan?", o: ["5", "7", "25"], c: 1, e: "3 + 4. La euclídea daría 5 y la al cuadrado 25." },
      { p: "¿Por qué la euclídea al cuadrado puede dar un camino que no es el más corto?", o: ["Porque usa raíz", "Porque sobreestima lo que falta (no es admisible)", "Porque no usa G"], c: 1, e: "A 10 casillas dice 100. A* se fía demasiado de H." },
      { p: "Si H vale siempre 0, A* se comporta como…", o: ["BFS", "Dijkstra", "DFS"], c: 1, e: "F = G: es exactamente Dijkstra." },
      { p: "Juego de tiles con movimiento en 4 direcciones. ¿Mejor heurística?", o: ["Manhattan", "Euclídea al cuadrado", "Ninguna"], c: 0, e: "Es exacta sin obstáculos y nunca sobreestima." },
      { p: "Haces clic en (300, 200) de pantalla con camera.x = −640. ¿x del mundo?", o: ["300", "940", "−340"], c: 1, e: "mundo = pantalla − camera.x = 300 + 640." }
    ])}
`,
    init(root) { Curso.pathDemo(root.querySelector("#astar-root"), { algo: "astar", terrain: true, breadcrumbs: true, choose: true, heuristic: true }); }
  });
})();
