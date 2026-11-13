Curso.practica({
  leccion: "b09",
  titulo: "Circuito, checkpoints y cronómetro",
  intro: "Escribirás los muros, los checkpoints en orden, el cierre de vuelta con la mejor marca, las zonas de aceite y turbo y la recolocación en la parrilla.",
  pasos: [
    {
      t: "Los muros sin contar a mano",
      exp: `<p><code>CreateChain</code> recibe el número de <strong>ints</strong> del array. Calcúlalo con <code>sizeof</code>.</p>`,
      code: String.raw`
walls_outer = App->physics->CreateChain(0, 0, track_outer, §s1§);`,
      slots: { s1: { ok: ["sizeof(track_outer)/sizeof(int)", "sizeof(track_outer)/sizeof(track_outer[0])"], err: [[/^sizeof\(track_outer\)$/, "sizeof da BYTES (4 por int). Divide entre sizeof(int)."], [/\/2$/, "CreateChain ya divide entre 2 por dentro: pásale el número de ints."]], w: 32, sol: "sizeof(track_outer) / sizeof(int)" } },
      pistas: ["Bytes del array / bytes de un int."],
      bien: ""
    },
    {
      t: "Checkpoints que avisan",
      exp: `<p>Cada checkpoint es un sensor; para enterarte de quién lo cruza, el módulo debe ser su listener.</p>`,
      code: String.raw`
Checkpoint* cp = new Checkpoint(App->physics, x, y, half_w, half_h, i);
cp->body->§s1§ = this;
checkpoints.push_back(cp);`,
      slots: { s1: { ok: ["listener"] } },
      pistas: ["Lección 03: el Module* del PhysBody."],
      bien: "<p>Dentro de Checkpoint, el body sale de <code>CreateRectangleSensor</code>.</p>"
    },
    {
      t: "Solo en orden",
      exp: `<p>En OnCollision ya tienes <code>cp</code> y <code>car</code> (no nulos). Si el índice del checkpoint no es el que el coche espera, sal. Si lo es, avanza <code>next_checkpoint</code> (dando la vuelta con <code>%</code>) y, si era la meta (índice 0), llama a <code>car-&gt;LapCompleted()</code>.</p>`,
      escribe: {
        filas: 6,
        checks: [
          [/if\(cp->index!=car->next_checkpoint\)return;/, "Primero: <code>if (cp-&gt;index != car-&gt;next_checkpoint) return;</code>"],
          [/car->next_checkpoint=\(cp->index\+1\)%CHECKPOINT_COUNT;/, "Avanza: <code>car-&gt;next_checkpoint = (cp-&gt;index + 1) % CHECKPOINT_COUNT;</code>"],
          [/if\(cp->index==0\)car->LapCompleted\(\);|if\(cp->index==0\)\{car->LapCompleted\(\);/, "Meta: <code>if (cp-&gt;index == 0) car-&gt;LapCompleted();</code>"]
        ],
        sol: String.raw`if (cp->index != car->next_checkpoint) return;

car->next_checkpoint = (cp->index + 1) % CHECKPOINT_COUNT;

if (cp->index == 0)
    car->LapCompleted();`
      },
      pistas: ["El % hace que tras el último vuelva a 0 (la meta)."],
      bien: "<p>Cruzar la meta hacia atrás o saltarse un checkpoint ya no cuenta. El coche empieza con <code>next_checkpoint = 1</code>.</p>"
    },
    {
      t: "Cerrar la vuelta y la mejor marca",
      exp: `<p>Escribe <code>LapCompleted()</code>: lee el tiempo de <code>lap_timer</code>, guárdalo en <code>lap_times</code>, actualiza <code>best_lap</code> si es la primera (vale −1) o es menor, suma una vuelta y reinicia el timer.</p>`,
      escribe: {
        antes: "void Car::LapCompleted()\n{",
        despues: "}",
        filas: 6,
        checks: [
          [/doublet=lap_timer\.ReadSec\(\);|floatt=\(float\)lap_timer\.ReadSec\(\);/, "Lee el tiempo: <code>double t = lap_timer.ReadSec();</code>"],
          [/lap_times\.push_back\(t\);/, "Guárdalo: <code>lap_times.push_back(t);</code>"],
          [/if\(best_lap<0(\.0*)?\|\|t<best_lap\)best_lap=t;/, "Récord: <code>if (best_lap &lt; 0.0 || t &lt; best_lap) best_lap = t;</code>"],
          [/lap\+\+;|\+\+lap;|lap\+=1;/, "Suma vuelta: <code>lap++;</code>"],
          [/lap_timer\.Start\(\);/, "Reinicia: <code>lap_timer.Start();</code>"]
        ],
        sol: String.raw`    double t = lap_timer.ReadSec();
    lap_times.push_back(t);
    if (best_lap < 0.0 || t < best_lap) best_lap = t;
    lap++;
    lap_timer.Start();`
      },
      pistas: ["−1 significa “todavía no hay récord”.", "El Timer del handout tiene Start() y ReadSec()."],
      bien: "<p>Para el “mejor de la sesión” guarda también una copia en ModuleGame que no se borre al reiniciar.</p>"
    },
    {
      t: "Aceite con contador",
      exp: `<p>Begin suma, End resta. El coche está en aceite mientras el contador sea mayor que 0.</p>`,
      code: String.raw`
// BeginContact (OnCollision) con una mancha de aceite:
car->in_oil§s1§;
// EndContact con una mancha de aceite:
car->in_oil§s2§;
// Car::UpdateFriction():
float surface_grip = (in_oil §s3§ 0) ? 0.15f : 1.0f;`,
      slots: { s1: { ok: ["++", "+=1"], w: 4 }, s2: { ok: ["--", "-=1"], w: 4 }, s3: { ok: [">", "!="], w: 3, sol: ">" } },
      pistas: ["Contador: ++ al entrar, -- al salir."],
      bien: "<p>Para EndContact hay que añadir <code>void EndContact(b2Contact*) override;</code> a ModulePhysics y un <code>OnCollisionEnd</code> a Module, igual que BeginContact.</p>"
    },
    {
      t: "Turbo sin tocar el Step",
      exp: `<p>En OnCollision con un turbo <strong>no</strong> apliques el impulso: marca el tiempo. En el Update del coche, mientras quede tiempo, aplica la fuerza.</p>`,
      code: String.raw`
// OnCollision:
car->boost_time = §s1§;
// Car::Update():
if (boost_time > 0.0f)
{
    boost_time -= PHYSICS_DT;
    body->body->ApplyForceToCenter(boost_force * §s2§, true);
}`,
      slots: { s1: { ok: [/^0?\.\d+f?$/, /^\d+(\.\d+)?f?$/], w: 6, sol: "0.6f" }, s2: { ok: ["GetForward()"], err: [[/^GetRight\(\)$/, "El turbo empuja hacia el morro, no de lado."]], w: 13 } },
      pistas: ["Cualquier duración razonable en segundos (0.5f, 0.6f…).", "Hacia el morro."],
      bien: "<p>Patrón general: en el callback, <em>apunta</em>; en Update, <em>actúa</em>.</p>"
    },
    {
      t: "Volver a la parrilla",
      exp: `<p>Al reiniciar la carrera, teletransporta el coche y quítale toda la velocidad.</p>`,
      code: String.raw`
b->§s1§(start_position, start_angle);
b->SetLinearVelocity(§s2§);
b->SetAngularVelocity(0.0f);`,
      slots: { s1: { ok: ["SetTransform"], w: 13 }, s2: { ok: ["b2Vec2_zero", "b2Vec2(0.0f,0.0f)", "b2Vec2(0,0)"], w: 18, sol: "b2Vec2_zero" } },
      pistas: ["Set + Transform (posición + ángulo).", "Hay una constante para el vector cero."],
      bien: "<p>Resetea también <code>lap</code>, <code>next_checkpoint = 1</code>, los tiempos y el estado a la cuenta atrás. El récord de la sesión, no.</p>"
    }
  ]
});
