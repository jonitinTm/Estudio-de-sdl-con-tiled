Curso.practica({
  leccion: "pfenemigos",
  titulo: "De las teclas al juego: un enemigo que te persigue",
  intro: "Vas a escribir las piezas clave del enemigo: la búsqueda automática con límite, seguir el camino volando, la máquina de estados con histéresis y el movimiento del enemigo terrestre.",
  pasos: [
    {
      t: "Búsqueda completa con presupuesto",
      exp: `<p>Escribe el <code>for</code> de <code>FindPath</code>: hasta <code>maxIterations</code> veces, devuelve <code>true</code> si <code>pathTiles</code> ya no está vacío, <code>false</code> si <code>frontierAStar</code> está vacía y, si no, llama a <code>PropagateAStar(h)</code>.</p>`,
      escribe: {
        antes: String.raw`bool Pathfinding::FindPath(Vector2D from, Vector2D to, ASTAR_HEURISTICS h, int maxIterations)
{
    ResetPath(from);
    destination = to;`,
        despues: "    return !pathTiles.empty();\n}",
        filas: 6,
        checks: [
          [/for\(inti=0;i<maxIterations;(\+\+i|i\+\+)\)/, "El bucle: <code>for (int i = 0; i &lt; maxIterations; ++i)</code>"],
          [/if\(!pathTiles\.empty\(\)\)returntrue;/, "Si ya hay camino: <code>if (!pathTiles.empty()) return true;</code>"],
          [/if\(frontierAStar\.empty\(\)\)returnfalse;/, "Si no queda frontera: <code>if (frontierAStar.empty()) return false;</code>"],
          [/PropagateAStar\(h\);/, "Una expansión: <code>PropagateAStar(h);</code>"]
        ],
        prohibido: [[/while\(true\)/, "Un while(true) congela el juego si el jugador es inalcanzable en un mapa enorme. Usa el límite."]],
        sol: String.raw`    for (int i = 0; i < maxIterations; ++i)
    {
        if (!pathTiles.empty()) return true;
        if (frontierAStar.empty()) return false;
        PropagateAStar(h);
    }`
      },
      pistas: ["Tres líneas dentro del for: ¿hay camino?, ¿se acabó?, expandir."],
      bien: "<p>Este límite es una decisión de diseño: apúntala en tu diario con el número que elijas y por qué.</p>"
    },
    {
      t: "Hacia el centro de la siguiente casilla",
      exp: `<p><code>path[0]</code> es donde está el enemigo. El objetivo es el centro de <code>path[1]</code>.</p>`,
      code: String.raw`Vector2D next = map->MapToWorld((int)path[§s1§].getX(), (int)path[1].getY());
float tx = next.getX() + map->GetTileWidth() §s2§;`,
      slots: { s1: { ok: ["1"], err: [[/^0$/, "path[0] es la casilla donde ya estás: el enemigo no se movería."]], w: 3 }, s2: { ok: ["/ 2.0f", "/ 2", "* 0.5f", "/2.0f", "/2"], err: [], w: 8 } },
      pistas: ["MapToWorld da la esquina superior izquierda: suma media casilla."],
      bien: "<p>Lo mismo en y para el volador.</p>"
    },
    {
      t: "Velocidad del volador",
      exp: `<p>Con <code>dx</code>, <code>dy</code> y <code>len</code> (la distancia), escribe la velocidad <code>v</code> (b2Vec2) que va hacia el objetivo a <code>flySpeed</code>, pero que se queda a 0 si <code>len</code> es menor o igual a 2 (para no temblar).</p>`,
      escribe: {
        antes: "float len = sqrtf(dx * dx + dy * dy);\nb2Vec2 v = { 0.0f, 0.0f };",
        despues: "b2Body_SetLinearVelocity(pbody->body, v);",
        filas: 3,
        checks: [
          [/if\(len>2(\.0f?|f)?\)/, "Primero la zona muerta: <code>if (len &gt; 2.0f)</code>"],
          [/v\.x=dx\/len\*flySpeed;|v\.x=flySpeed\*dx\/len;|v\.x=\(dx\/len\)\*flySpeed;/, "Normaliza y escala: <code>v.x = dx / len * flySpeed;</code>"],
          [/v\.y=dy\/len\*flySpeed;|v\.y=flySpeed\*dy\/len;|v\.y=\(dy\/len\)\*flySpeed;/, "Igual en y: <code>v.y = dy / len * flySpeed;</code>"]
        ],
        prohibido: [[/v\.x=dx\*flySpeed/, "Sin dividir entre len, la velocidad depende de lo lejos que esté: rapidísimo lejos y lento cerca."]],
        sol: "if (len > 2.0f) { v.x = dx / len * flySpeed; v.y = dy / len * flySpeed; }"
      },
      pistas: ["(dx, dy) / len es un vector de longitud 1: la dirección."],
      bien: "<p>Recuerda <code>b2Body_SetGravityScale(pbody->body, 0.0f)</code> en el Start del volador.</p>"
    },
    {
      t: "Empezar a perseguir",
      exp: `<p>En PATROL: si la distancia en casillas es menor o igual que <code>sightTiles</code>, pasa a CHASE.</p>`,
      code: String.raw`case EnemyState::PATROL:
    Patrol();
    if (distTiles §s1§ sightTiles) state = EnemyState::§s2§;
    break;`,
      slots: { s1: { ok: ["<=", "<"], err: [[/^>=?$/, "Al revés: persigue cuando está CERCA."]], w: 4 }, s2: { ok: ["CHASE"], err: [], w: 8 } },
      pistas: ["Cerca = distancia pequeña."],
      bien: ""
    },
    {
      t: "Histéresis al rendirse",
      exp: `<p>En CHASE, el enemigo se rinde (pasa a RETURN) si no encuentra camino o si el jugador está más lejos que <strong>1,5 veces</strong> la visión.</p>`,
      code: String.raw`if (!found || distTiles > sightTiles §s1§)
    state = EnemyState::§s2§;`,
      slots: { s1: { ok: ["* 1.5f", "*1.5f", "* 1.5", "*1.5"], err: [[/^$/, "Si te rindes en la misma distancia a la que empiezas, en el borde cambiará de estado cada frame."]], w: 8 }, s2: { ok: ["RETURN"], err: [[/^PATROL$/, "Funciona, pero se quedaría patrullando lejos de casa. RETURN lo devuelve a su homeTile."]], w: 8 } },
      pistas: ["Un margen mayor para dejar de perseguir que para empezar."],
      bien: "<p>Esto se llama histéresis. Sin ella, el enemigo “tiembla” entre dos estados.</p>"
    },
    {
      t: "El terrestre: solo la horizontal",
      exp: `<p>Lee la velocidad actual, cambia solo <code>v.x</code> según <code>dx</code> (con margen de 2 px) y vuelve a aplicarla. La <code>v.y</code> es de la gravedad.</p>`,
      code: String.raw`b2Vec2 v = b2Body_§s1§(pbody->body);
v.x = (dx > 2.0f) ? walkSpeed : (dx < -2.0f) ? §s2§ : 0.0f;
b2Body_SetLinearVelocity(pbody->body, v);`,
      slots: { s1: { ok: ["GetLinearVelocity"], err: [], w: 18 }, s2: { ok: ["-walkSpeed"], err: [[/^walkSpeed$/, "Si dx es negativo, el objetivo está a la izquierda: velocidad negativa."]], w: 11 } },
      pistas: ["Partir de la velocidad actual conserva la caída."],
      bien: "<p>Si escribieras <code>b2Vec2 v = { vx, 0 }</code>, el slime flotaría al salir de una plataforma.</p>"
    }
  ]
});
