Curso.practica({
  leccion: "b10",
  titulo: "El cerebro de AICar",
  intro: "Escribirás el seguimiento de waypoints: llegar y pasar al siguiente, pasar el objetivo a local, calcular el ángulo, decidir volante y acelerador, y el rubber banding.",
  pasos: [
    {
      t: "Llegar y pasar al siguiente",
      exp: `<p>Si estás a menos de 2,5 m del waypoint, apunta al siguiente (volviendo al 0 tras el último).</p>`,
      code: String.raw`
if ((goal - b->GetPosition()).Length() < 2.5f)
    target = §s1§;`,
      slots: { s1: { ok: ["(target+1)%WAYPOINT_COUNT"], err: [[/^target\+1$/, "Tras el último te saldrías del array. Usa % WAYPOINT_COUNT."]], w: 28, sol: "(target + 1) % WAYPOINT_COUNT" } },
      pistas: ["Igual que next_checkpoint."],
      bien: "<p>Radio demasiado pequeño → el coche orbita el waypoint sin “llegar” nunca. Demasiado grande → recorta las curvas.</p>"
    },
    {
      t: "El objetivo, visto desde el coche",
      exp: `<p>Convierte el punto objetivo (mundo) a coordenadas locales del coche.</p>`,
      code: String.raw`
b2Vec2 local = b->§s1§(goal);`,
      slots: { s1: { ok: ["GetLocalPoint"], err: [[/^GetWorldPoint$/, "Al revés: GetWorldPoint pasa de local a mundo. Queremos de mundo a local."], [/^GetLocalVector$/, "Vector ignora la posición del coche; goal es un PUNTO."]], w: 15 } },
      pistas: ["La inversa de GetWorldPoint."],
      bien: "<p>En local el coche está en (0, 0) mirando hacia (0, −1): x &gt; 0 es su derecha.</p>"
    },
    {
      t: "¿Cuánto girar?",
      exp: `<p>El ángulo entre el morro (0, −1) y el objetivo: 0 si está delante, positivo a la derecha.</p>`,
      code: String.raw`
float angle = atan2f(§s1§, §s2§);`,
      slots: {
        s1: { ok: ["local.x"], err: [[/^local\.y$/, "atan2(lado, delante): el primer argumento es la componente lateral, x."]], w: 9 },
        s2: { ok: ["-local.y"], err: [[/^local\.y$/, "Delante es Y negativa: usa -local.y para que delante dé ángulo 0."]], w: 9 }
      },
      pistas: ["atan2(lateral, frontal).", "Frontal = −y en local."],
      bien: ""
    },
    {
      t: "Volante y acelerador",
      exp: `<p>Escribe: <code>steer = angle * 2.0f</code> limitado a [−1, 1], y <code>throttle</code> = 0.4f si <code>fabsf(angle) &gt; 0.6f</code> (curva cerrada) o 1.0f si no.</p>`,
      escribe: {
        filas: 5,
        checks: [
          [/floatsteer=angle\*2(\.0*f?)?;/, "<code>float steer = angle * 2.0f;</code>"],
          [/if\(steer>1(\.0*f?)?\)steer=1(\.0*f?)?;/, "Límite superior: <code>if (steer &gt; 1.0f) steer = 1.0f;</code>"],
          [/if\(steer<-1(\.0*f?)?\)steer=-1(\.0*f?)?;/, "Límite inferior: <code>if (steer &lt; -1.0f) steer = -1.0f;</code>"],
          [/floatthrottle=\(?fabsf\(angle\)>0\.6f?\)?\?0\.4f?:1(\.0*f?)?;/, "<code>float throttle = (fabsf(angle) &gt; 0.6f) ? 0.4f : 1.0f;</code>"]
        ],
        sol: String.raw`float steer = angle * 2.0f;
if (steer >  1.0f) steer =  1.0f;
if (steer < -1.0f) steer = -1.0f;
float throttle = (fabsf(angle) > 0.6f) ? 0.4f : 1.0f;`
      },
      pistas: ["Recortar: dos if.", "El operador ternario: <code>condición ? a : b</code>."],
      bien: "<p>Y luego, igual que el jugador: <code>UpdateFriction(); Drive(throttle); Steer(steer);</code>. La física es la misma clase Car.</p>"
    },
    {
      t: "Rubber banding",
      exp: `<p>Si la IA va por delante del jugador (gap &gt; 0), un poco más lenta; si va por detrás, un poco más rápida.</p>`,
      code: String.raw`
float gap = Progress(this) - Progress(player);
max_speed = base_max_speed * (gap > 0.0f ? §s1§ : §s2§);`,
      slots: {
        s1: { ok: [/^0\.[5-9]\d*f?$/], err: [[/^1\.\d+f?$/, "Si va DELANTE, hay que frenarla: un factor menor que 1."]], w: 6, sol: "0.92f" },
        s2: { ok: [/^1\.[0-5]\d*f?$/], err: [[/^0\.\d+f?$/, "Si va DETRÁS, hay que ayudarla: un factor mayor que 1."]], w: 6, sol: "1.08f" }
      },
      pistas: ["Delante → menos de 1. Detrás → más de 1."],
      bien: "<p>Valores suaves (±5–10 %) para que no se note. Con esto ya tienes rivales que completan vueltas y pelean la carrera.</p>"
    }
  ]
});
