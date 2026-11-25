(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-enemigos", titulo: "Enemigos: patrulla, persecución y estados", icono: "☠",
    desc: "Máquina de estados del enemigo, distancia de visión, seguir un camino casilla a casilla, pisotear y morir, y guardar quién murió.",
    chuleta: [
      ["Estados", "```enum class EnemyState { PATROL, CHASE, DEAD };\nswitch (state) {\ncase EnemyState::PATROL:\n    Patrol();\n    if (DistanceToPlayer() < sight) state = EnemyState::CHASE;\n    break;\ncase EnemyState::CHASE:\n    FollowPath();\n    if (DistanceToPlayer() > sight * 1.5f) state = EnemyState::PATROL;\n    break;\ncase EnemyState::DEAD: break;\n}```"],
      ["Seguir el camino", "```Vector2D next = MapToWorld(path[1].getX(), path[1].getY());   // path[0] es donde estoy\nfloat dx = next.getX() + tileW / 2 - position.getX();\nv.x = (dx > 2) ? speed : (dx < -2) ? -speed : 0.0f;```"]
    ],
    preguntas: [
      test("¿Por qué el enemigo vuelve a PATROL con `sight * 1.5f` y no con `sight`?", ["Error", "Histéresis: evita que cambie de estado cada frame cuando el jugador está justo en el límite", "Por velocidad", "Por la cámara"], 1, "", { nuevo: true }),
      huecos("Cambio de estado al ver al jugador.", String.raw`case EnemyState::PATROL:
    Patrol();
    if (DistanceToPlayer() ▢ sight) state = EnemyState::▢;
    break;`, ["<", "CHASE", ">", "DEAD", "PATROL"], ["<", "CHASE"], ""),
      test("¿Por qué se usa `path[1]` y no `path[0]` para moverse?", ["Por error", "path[0] es la casilla donde ya está el enemigo", "path[0] es la meta", "Da igual"], 1, ""),
      bug("El enemigo tiembla a izquierda y derecha al llegar a una casilla.", [
        "float dx = targetX - position.getX();",
        "v.x = (dx > 0) ? speed : -speed;"], 1, "Sin margen nunca está exactamente en 0: añade una zona muerta `(dx > 2) ? speed : (dx < -2) ? -speed : 0`."),
      escribe("Escribe la distancia entre el enemigo (`position`) y el jugador (`p`) con sqrtf (Vector2D con getX/getY).", [/^sqrtf\(\(p\.getX\(\)-position\.getX\(\)\)\*\(p\.getX\(\)-position\.getX\(\)\)\+\(p\.getY\(\)-position\.getY\(\)\)\*\(p\.getY\(\)-position\.getY\(\)\)\)$/, /^sqrtf\(\(position\.getX\(\)-p\.getX\(\)\)\*\(position\.getX\(\)-p\.getX\(\)\)\+\(position\.getY\(\)-p\.getY\(\)\)\*\(position\.getY\(\)-p\.getY\(\)\)\)$/], "Para comparar con un radio basta comparar distancias al cuadrado (sin sqrt), que es más barato.", { ph: "sqrtf(...)" }),
      test("¿Cómo detectas que el jugador ha pisado al enemigo (y no que le ha tocado de lado)?", ["Por la velocidad", "Los pies del jugador están por encima del centro del enemigo en el momento del contacto", "Con un raycast siempre", "No se puede"], 1, "Es más fiable que mirar la velocidad, que Box2D ya ha cambiado al resolver el choque."),
      orden("Pisotear a un enemigo.", [
        "case ColliderType::ENEMY:",
        "    if (feetY < enemyCenterY) {",
        "        enemy->state = EnemyState::DEAD;",
        "        b2Body_SetLinearVelocity(pbody->body, { v.x, -bounce });",
        "    }",
        "    else Hurt();",
        "    break;"], "Rebote al pisarlo, daño si es lateral."),
      test("Al morir el enemigo, ¿qué haces con su cuerpo?", ["Lo destruyes en el callback", "Pasas a DEAD, reproduces la animación de muerte y luego marcas pendingToDelete", "Nada", "Lo haces dinámico"], 1, ""),
      test("¿Cómo guardas en la partida qué enemigos están muertos?", ["Por su posición", "Por su id del objeto en Tiled (único y estable)", "Por su índice en la lista", "No se puede"], 1, "El índice puede cambiar si borras uno."),
      test("Un enemigo volador y uno terrestre: ¿cambia el pathfinding?", ["No", "Sí: el volador puede usar cualquier casilla vacía; el terrestre solo las que tienen suelo", "Solo cambia la velocidad", "Solo la animación"], 1, ""),
      huecos("Recalcula el camino cada medio segundo.", String.raw`if (pathTimer.▢() >= 0.5f)
{
    path = pathfinding->Find(myTile, playerTile);
    pathTimer.▢();
}`, ["ReadSec", "Start", "ReadMSec", "Stop", "Reset"], ["ReadSec", "Start"], ""),
      test("¿Qué es una patrulla entre dos puntos?", ["Persecución", "Moverse a un lado hasta llegar a un límite (o a un borde/pared) y dar la vuelta", "Quedarse quieto", "Saltar"], 1, ""),
      test("El enemigo cae por los bordes de las plataformas al patrullar. ¿Solución?", ["Más gravedad", "Comprobar si la casilla de delante y abajo es sólida; si no, dar la vuelta", "Hacerlo estático", "Ignorarlo"], 1, ""),
      escribe("Escribe la línea que invierte la dirección (`dir` vale 1 o -1).", ["dir = -dir", "dir *= -1", "dir = dir * -1"], "", { ph: "dir = ..." }),
      test("En debug (F9), ¿qué conviene dibujar del enemigo?", ["Nada", "Su camino (casillas del path) y su radio de visión", "Solo el sprite", "El HUD"], 1, "Ver lo que piensa la IA ahorra horas.")
    ]
  });
})();
