Curso.practica({
  leccion: "b05",
  titulo: "Programa ApplyFriction",
  intro: "Escribirás los TODOs del Handout 05: quitar la gravedad, empujar las bolas cada frame y la fricción estática y dinámica con el suelo, sin vibraciones.",
  pasos: [
    {
      t: "Vista cenital: sin gravedad",
      exp: `<p>Desde arriba no hay “abajo” en la pantalla.</p>`,
      code: String.raw`
#define GRAVITY_X §s1§
#define GRAVITY_Y §s2§
#define GRAVITY_Z 9.8f     // la que apunta al suelo: solo para la fuerza normal`,
      slots: { s1: { ok: [/^0(\.0*)?f?$/], w: 6, sol: "0.0f" }, s2: { ok: [/^-?0(\.0*)?f?$/], err: [[/10/, "Con gravedad en Y todo “caería” hacia abajo de la pantalla."]], w: 6, sol: "0.0f" } },
      pistas: ["Las dos componentes que ve Box2D valen lo mismo."],
      bien: "<p>Box2D nunca ve GRAVITY_Z: la usamos nosotros para calcular N = m·g.</p>"
    },
    {
      t: "Empujar y rozar, cada frame",
      exp: `<p>En el bucle de las bolas (ModuleGame::Update), aplica la fuerza constante <code>force</code> al centro y luego la fricción con <code>App-&gt;physics-&gt;ApplyFriction(ball-&gt;body, force)</code>.</p>`,
      escribe: {
        antes: "for (Ball* ball : balls)\n{\n    b2Vec2 force(Ball::push_force, 0.0f);",
        despues: "}",
        filas: 3,
        checks: [
          [/ball->body->body->ApplyForceToCenter\(force,true\);/, "Empuja: <code>ball-&gt;body-&gt;body-&gt;ApplyForceToCenter(force, true);</code> (ball → PhysBody → b2Body)."],
          [/App->physics->ApplyFriction\(ball->body,force\);/, "Luego: <code>App-&gt;physics-&gt;ApplyFriction(ball-&gt;body, force);</code>"]
        ],
        sol: String.raw`    ball->body->body->ApplyForceToCenter(force, true);
    App->physics->ApplyFriction(ball->body, force);`
      },
      pistas: ["Las fuerzas se borran tras cada Step: por eso va en el Update, todos los frames.", "ApplyFriction necesita saber la fuerza aplicada para el caso estático."],
      bien: "<p>Dos “body”: <code>ball-&gt;body</code> es tu PhysBody, <code>ball-&gt;body-&gt;body</code> es el b2Body de dentro.</p>"
    },
    {
      t: "La fuerza normal",
      exp: `<p>Dentro de ApplyFriction: N = m · g, con la masa del cuerpo y la gravedad “hacia el suelo”.</p>`,
      code: String.raw`
float mass = b->GetMass();
float normal = §s1§;`,
      slots: { s1: { ok: ["mass*GRAVITY_Z", "GRAVITY_Z*mass"], err: [[/GRAVITY_Y/, "GRAVITY_Y vale 0 en vista cenital. La que apunta al suelo es GRAVITY_Z."]], w: 18, sol: "mass * GRAVITY_Z" } },
      pistas: ["N = m · g"],
      bien: ""
    },
    {
      t: "Fricción estática",
      exp: `<p>En reposo (velocidad &lt; 0,01): si la fuerza aplicada no supera μs·N, la fricción la anula por completo y el cuerpo sigue quieto.</p>`,
      code: String.raw`
if (velocity.Length() < 0.01f)
{
    if (applied_force.Length() <= §s1§)
    {
        b->ApplyForceToCenter(§s2§, true);
        return;
    }
    direction = applied_force;
}`,
      slots: {
        s1: { ok: ["static_friction*normal", "normal*static_friction"], err: [[/dynamic_friction/, "En reposo manda la fricción ESTÁTICA."]], w: 24, sol: "static_friction * normal" },
        s2: { ok: ["-applied_force"], err: [[/^applied_force$/, "Así duplicarías el empuje. Para anularlo, la fuerza opuesta: <code>-applied_force</code>."]], w: 15 }
      },
      pistas: ["Límite = μs · N.", "Anular = aplicar lo mismo con signo contrario."],
      bien: "<p>Con μs = 0,5 y 100 N, las bolas de 20,4 kg o más no se mueven nunca.</p>"
    },
    {
      t: "Fricción dinámica",
      exp: `<p>Deslizando: fuerza constante μk·N, en contra del movimiento. <code>direction</code> ya está normalizada.</p>`,
      code: String.raw`
direction.Normalize();
b2Vec2 friction = §s1§ * normal * direction;`,
      slots: { s1: { ok: ["-dynamic_friction"], err: [[/^dynamic_friction$/, "Sin el signo menos, la fricción EMPUJARÍA en el sentido del movimiento."]], w: 18 } },
      pistas: ["En contra del movimiento → signo menos."],
      bien: ""
    },
    {
      t: "Que nunca empuje hacia atrás",
      exp: `<p>Predice la velocidad del próximo Step (<code>v + dt/m · (F + fricción)</code>). Si su producto escalar con <code>direction</code> es ≤ 0, la fricción la invertiría: para el cuerpo (velocidad cero), anula la fuerza aplicada y sal. Si no, aplica la fricción.</p>`,
      escribe: {
        filas: 9,
        checks: [
          [/b2Vec2next_velocity=velocity\+\(PHYSICS_DT\/mass\)\*\(applied_force\+friction\);/, "Predicción: <code>b2Vec2 next_velocity = velocity + (PHYSICS_DT / mass) * (applied_force + friction);</code>"],
          [/if\(b2Dot\(next_velocity,direction\)<=0(\.0*f?)?\)/, "Condición: <code>if (b2Dot(next_velocity, direction) &lt;= 0.0f)</code>"],
          [/SetLinearVelocity\(b2Vec2_zero\);|SetLinearVelocity\(b2Vec2\(0(\.0*f?)?,0(\.0*f?)?\)\);/, "Dentro: para el cuerpo con <code>b-&gt;SetLinearVelocity(b2Vec2_zero);</code>"],
          [/ApplyForceToCenter\(-applied_force,true\);/, "…y anula la fuerza aplicada: <code>b-&gt;ApplyForceToCenter(-applied_force, true);</code>"],
          [/return;.*b->ApplyForceToCenter\(friction,true\);/, "Tras el if (con su return), aplica la fricción: <code>b-&gt;ApplyForceToCenter(friction, true);</code>"]
        ],
        sol: String.raw`b2Vec2 next_velocity = velocity + (PHYSICS_DT / mass) * (applied_force + friction);
if (b2Dot(next_velocity, direction) <= 0.0f)
{
    b->SetLinearVelocity(b2Vec2_zero);
    b->ApplyForceToCenter(-applied_force, true);
    return;
}
b->ApplyForceToCenter(friction, true);`
      },
      pistas: ["Es la misma fórmula que usa Box2D: v += F/m · dt.", "Producto escalar ≤ 0 → cambiaría de sentido."],
      bien: "<p>Desactiva la protección en la demo para ver el temblor que evita. Este ApplyFriction es reutilizable tal cual para el rozamiento de tus coches.</p>"
    }
  ]
});
