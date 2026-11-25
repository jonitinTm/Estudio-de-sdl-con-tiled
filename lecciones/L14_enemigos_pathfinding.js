(function () {
  const { code, nota, todo, quiz } = Curso;

  Curso.leccion({
    id: "pfenemigos", num: "14", grupo: "Bloque 6 · Inteligencia artificial", corto: "Enemigos con A*", pdf: "L14_Pathfinding_Enemies",
    titulo: "Pathfinding IV: enemigos que te persiguen",
    resumen: "Llevar A* de las teclas al juego: búsqueda automática, seguir el camino, patrulla/persecución/vuelta, enemigo volador y enemigo terrestre.",
    intro: "Hasta ahora el pathfinding avanzaba un paso cada vez que pulsabas una tecla, para que lo vieras trabajar. Tu juego no pulsa teclas. En esta sesión de proyecto conviertes esa herramienta en dos enemigos de verdad: uno que vuela hacia ti desde cualquier parte y otro que camina por las plataformas, con gravedad. El handout no trae código nuevo: aquí tienes un plan por etapas, las decisiones que tendrás que tomar y una solución de referencia para cada una.",
    objetivos: ["Calcular el camino completo sin teclas (bucle de expansiones con límite)", "Mover un enemigo por el camino casilla a casilla", "Hacer una máquina de estados PATROL → CHASE → RETURN", "Diferenciar el enemigo volador (sin gravedad, cualquier casilla) del terrestre (solo plataformas)", "Documentar cada decisión"],
    html: () => `
<h2>Lo que ya tienes (de la L13)</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Función</th><th>Qué hace</th></tr></thead><tbody>
<tr><td><code>PropagateAStar(h)</code></td><td><strong>Una</strong> expansión por llamada</td></tr>
<tr><td><code>ResetPath(tile)</code></td><td>Limpia la búsqueda y empieza desde <code>tile</code></td></tr>
<tr><td><code>ComputePath()</code></td><td>Rellena <code>pathTiles</code> con la ruta</td></tr>
<tr><td><code>DrawPath()</code></td><td>Dibuja visited, frontier y el camino (tu mejor herramienta de debug)</td></tr>
</tbody></table></div>
${nota(`<p>La sesión es de proyecto: no hay una única solución. Trabaja por etapas, prueba cada una antes de seguir y apunta cada decisión y su porqué (te lo pueden preguntar en la entrega). Lo de abajo es <em>una</em> forma de hacerlo que funciona.</p>`, "game")}

<h2>Etapa 1 · El camino sin teclas</h2>
<p>Una expansión por frame es demasiado lenta para perseguir a nadie. Haz una función que llame a <code>PropagateAStar</code> en bucle hasta que haya camino, la frontera se vacíe o se pase de un límite (para no congelar el juego si el jugador es inalcanzable).</p>
${todo("Paso 1", "Pathfinding.cpp → FindPath()", `<p>Búsqueda completa con límite de iteraciones.</p>`,
      code(String.raw`bool Pathfinding::FindPath(Vector2D from, Vector2D to, ASTAR_HEURISTICS h, int maxIterations)
{
    ResetPath(from);
    destination = to;
    for (int i = 0; i < maxIterations; ++i)
    {
        if (!pathTiles.empty()) return true;       // ComputePath ya lo rellenó
        if (frontierAStar.empty()) return false;    // no hay camino
        PropagateAStar(h);
    }
    return !pathTiles.empty();                     // se acabó el presupuesto
}`, "cpp", "Pathfinding"))}
${nota(`<p>¿Cuántas iteraciones? Un número fijo (p. ej. 500) o el área de búsqueda que permitas. Es una decisión de diseño: más = el enemigo encuentra caminos más largos; menos = más barato. Apúntala.</p>`)}

<h2>Etapa 2 · Seguir el camino</h2>
<p><code>pathTiles[0]</code> es la casilla donde ya está el enemigo (o la del destino si no le diste la vuelta: compruébalo en tu ComputePath). El objetivo inmediato es el <strong>centro</strong> de la siguiente casilla.</p>
${todo("Paso 2", "Enemy.cpp → seguir el camino (volador)", `<p>Velocidad hacia el centro de la siguiente casilla. El volador no tiene gravedad.</p>`,
      code(String.raw`// En Start del enemigo volador:
b2Body_SetGravityScale(pbody->body, 0.0f);

// En Update:
if (path.size() > 1)
{
    Vector2D next = map->MapToWorld((int)path[1].getX(), (int)path[1].getY());
    float tx = next.getX() + map->GetTileWidth() / 2.0f;
    float ty = next.getY() + map->GetTileHeight() / 2.0f;
    float dx = tx - position.getX(), dy = ty - position.getY();
    float len = sqrtf(dx * dx + dy * dy);
    b2Vec2 v = { 0.0f, 0.0f };
    if (len > 2.0f) { v.x = dx / len * flySpeed; v.y = dy / len * flySpeed; }   // dirección unitaria
    b2Body_SetLinearVelocity(pbody->body, v);
}`, "cpp", "Enemy (volador)"))}
${nota(`<p>Sin el margen <code>len &gt; 2.0f</code> el enemigo tiembla alrededor del centro. Y como recalculas el camino cada cierto tiempo, cuando llegue a <code>path[1]</code> el siguiente cálculo ya empezará desde esa casilla.</p>`, "warn")}

<h2>Etapa 3 · Patrullar, perseguir y volver</h2>
<p>Buscar el camino al jugador desde cualquier parte del nivel en cada frame es caro y poco creíble. Restringe la búsqueda con una máquina de estados:</p>
${code(String.raw`enum class EnemyState { PATROL, CHASE, RETURN };

void Enemy::Think()
{
    Vector2D me = map->WorldToMap((int)position.getX(), (int)position.getY());
    Vector2D target = map->WorldToMap((int)player->position.getX(), (int)player->position.getY());
    float distTiles = me.distanceManhattan(target);

    switch (state)
    {
    case EnemyState::PATROL:
        Patrol();
        if (distTiles <= sightTiles) state = EnemyState::CHASE;
        break;

    case EnemyState::CHASE:
        if (repathTimer.ReadSec() >= 0.4f)                        // no cada frame
        {
            repathTimer.Start();
            bool found = pathfinding->FindPath(me, target, MANHATTAN, 600);
            path = pathfinding->pathTiles;
            if (!found || distTiles > sightTiles * 1.5f)          // se ha escapado
            {
                state = EnemyState::RETURN;
                pathfinding->FindPath(me, homeTile, MANHATTAN, 600);
                path = pathfinding->pathTiles;
            }
        }
        FollowPath();
        break;

    case EnemyState::RETURN:
        FollowPath();
        if (me == homeTile) state = EnemyState::PATROL;
        else if (distTiles <= sightTiles) state = EnemyState::CHASE;
        break;
    }
}`, "cpp", "Enemy::Think")}
<ul>
<li><strong>Histéresis</strong>: empieza a perseguir a <code>sight</code> casillas pero no se rinde hasta <code>sight × 1,5</code>. Sin eso, en el borde cambiaría de estado cada frame.</li>
<li><strong>Recalcular cada 0,3–0,5 s</strong>: el jugador se mueve, pero no hace falta rehacer A* 60 veces por segundo (y menos con varios enemigos).</li>
<li><strong>homeTile</strong>: la casilla donde nació (guárdala en Start). Volver a casa es otro FindPath.</li>
</ul>

<h2>Etapa 4 · El enemigo terrestre</h2>
<p>Lo mismo, con dos restricciones: tiene gravedad y solo puede ir por donde hay suelo.</p>
${todo("Paso 4", "Pathfinding → casillas caminables para el terrestre", `<p>Una casilla es transitable para él si está vacía <strong>y</strong> tiene una casilla sólida justo debajo. Puedes hacerlo con una capa de navegación pintada en Tiled o con una regla en código.</p>`,
      code(String.raw`int Pathfinding::MovementCostWalker(int x, int y)
{
    if (!InsideMap(x, y)) return -1;
    if (IsSolid(x, y)) return -1;                 // dentro de una pared
    if (!IsSolid(x, y + 1)) return -1;            // no hay suelo debajo: se caería
    return 1;
}`, "cpp", "Pathfinding"))}
<p>Para moverse, solo controla la velocidad <strong>horizontal</strong> y deja la vertical a la gravedad:</p>
${code(String.raw`b2Vec2 v = b2Body_GetLinearVelocity(pbody->body);
float tx = next.getX() + map->GetTileWidth() / 2.0f;
float dx = tx - position.getX();
v.x = (dx > 2.0f) ? walkSpeed : (dx < -2.0f) ? -walkSpeed : 0.0f;
b2Body_SetLinearVelocity(pbody->body, v);           // v.y intacta: sigue cayendo`, "cpp", "Enemy (terrestre)")}
${nota(`<p>Decisiones que tendrás que tomar (y apuntar): ¿el terrestre puede caer de una plataforma a otra para alcanzarte? (añade vecinos “de caída”); ¿puede saltar? (vecinos de salto con más coste); ¿qué hace si estás en otra plataforma inalcanzable? (se queda en el borde mirando o vuelve a patrullar).</p>`, "game")}

<h2>Etapa 5 · Pulir y depurar</h2>
<ul>
<li>Con <kbd>F9</kbd>, dibuja el camino de cada enemigo y su radio de visión. Ver lo que “piensa” la IA ahorra horas.</li>
<li>Usa animaciones distintas para patrullar y perseguir (y voltea el sprite según <code>v.x</code>).</li>
<li>Prueba casos raros: el jugador justo encima, el jugador detrás de una pared, dos enemigos a la vez, el jugador muere mientras te persiguen.</li>
</ul>

<h2>Diario de decisiones (plantilla)</h2>
${code(`Decisión: el volador recalcula el camino cada 0,4 s
Por qué: cada frame costaba demasiado con 5 enemigos; 0,4 s no se nota al jugar
Alternativas: cada vez que el jugador cambia de casilla
-----
Decisión: el terrestre no salta
Por qué: ...`, "txt")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Por qué FindPath tiene un máximo de iteraciones?", o: ["Por estética", "Si el jugador es inalcanzable, la búsqueda no congela el juego", "Porque A* lo exige"], c: 1, e: "Presupuesto de CPU por búsqueda." },
      { p: "¿Qué hace la histéresis (sight y sight × 1,5)?", o: ["Acelera A*", "Evita que el enemigo cambie de estado cada frame en el borde de la visión", "Mejora la heurística"], c: 1, e: "" },
      { p: "Para el enemigo terrestre, ¿qué velocidad controlas?", o: ["Las dos", "Solo la horizontal; la vertical es de la gravedad", "Solo la vertical"], c: 1, e: "Si pones v.y = 0 flotará." },
      { p: "¿Qué casilla es transitable para el terrestre?", o: ["Cualquiera vacía", "Vacía y con suelo justo debajo", "Cualquiera"], c: 1, e: "" },
      { p: "¿Qué función del volador evita que caiga?", o: ["b2Body_SetGravityScale(body, 0)", "SetAwake", "SetFixedRotation"], c: 0, e: "" }
    ])}
`
  });
})();
