(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "b05", num: "05", grupo: "Bloque 2 · Física a medida (vista cenital)", corto: "Fricción a medida", pdf: "Handout 05 Custom Friction",
    titulo: "Fricción a medida: el suelo que Box2D no ve",
    resumen: "Vista cenital sin gravedad, fuerzas propias cada frame, fuerza normal, fricción estática y dinámica sin vibraciones.",
    intro: "Box2D está pensado para juegos vistos de lado: la gravedad tira hacia abajo y la fricción actúa entre dos cuerpos que se tocan. En un juego de carreras visto desde arriba, el suelo no es un cuerpo: nada frena a tu coche. Esta lección te enseña a calcular tú la fricción con el suelo, que es exactamente lo que necesitarás para el coche.",
    objetivos: ["Entender por qué la gravedad y la fricción de Box2D no sirven en vista cenital", "Aplicar fuerzas propias cada frame con ApplyForceToCenter", "Calcular fricción estática y dinámica con la fuerza normal", "Evitar que la fricción haga vibrar o empuje hacia atrás"],
    html: () => `
<h2>El problema de la vista cenital</h2>
<p>Mira tu juego desde arriba: la gravedad apunta <strong>hacia dentro de la pantalla</strong>, hacia el suelo. Box2D es 2D: no tiene eje Z, así que esa gravedad no existe para él. Por eso:</p>
<ul>
<li>La gravedad del mundo se pone a <strong>0</strong> (<code>GRAVITY_X = GRAVITY_Y = 0</code>): si no, todo “caería” hacia abajo de la pantalla.</li>
<li>La <code>friction</code> de las fixtures solo actúa entre <strong>dos fixtures que se tocan</strong>. El suelo no es una fixture: nada roza con nada. Un coche al que dejas de acelerar seguiría para siempre.</li>
</ul>
<p>La solución: <strong>calcular nosotros la fricción con el suelo</strong> y aplicarla como una fuerza más.</p>

<h2>Fuerzas propias</h2>
${code(String.raw`
body->ApplyForceToCenter(force, true);   // force en newtons (b2Vec2), true = despertar el cuerpo`, "cpp")}
<p>Una <strong>fuerza</strong> se acumula hasta el siguiente <code>Step()</code>, que la usa (<code>a = F / m</code>) y la <strong>borra</strong>. Por eso hay que aplicarla <strong>cada frame</strong>. Si la aplicas una sola vez, apenas mueve nada (un empujón de 1/60 s). Para un golpe instantáneo se usa un <strong>impulso</strong> (<code>ApplyLinearImpulse</code>), que cambia la velocidad de golpe.</p>
<div class="formula">v_nueva = v + (F / m) · dt        ← lo que hace Box2D en cada Step</div>
<p>Misma fuerza, más masa → menos aceleración. En el handout todas las bolas reciben 100 N: las ligeras salen disparadas, las pesadas apenas se mueven.</p>

<h3>Masa = densidad × área</h3>
<p>Box2D no te deja poner la masa directamente: la calcula. Si quieres una bola de <em>m</em> kg con radio <em>r</em> (en metros), despejas la densidad:</p>
${code(String.raw`
// Mismo material: el área crece con la masa, así que el radio crece con la raíz de la masa
static int Radius(float mass) { return (int)(10.0f * sqrtf(mass)); }   // 1 kg -> 10 px, 100 kg -> 100 px

static float Density(float mass)
{
    float radius = PIXEL_TO_METERS(Radius(mass));
    return mass / (b2_pi * radius * radius);      // densidad = masa / área del círculo
}`, "cpp", "ModuleGame.cpp → class Ball")}

<h2>La física de la fricción</h2>
<h3>Fuerza normal</h3>
<p>El suelo empuja hacia arriba lo mismo que el objeto pesa: <code>N = m · g</code> (con <code>g = GRAVITY_Z = 9,8</code>). Cuanto más pesa, más se “agarra”.</p>
<h3>Fricción estática (en reposo)</h3>
<p>Mientras el objeto está quieto, la fricción <strong>cancela</strong> la fuerza que lo empuja… hasta un límite: <code>f ≤ μs · N</code>. Si empujas más fuerte que eso, empieza a deslizar.</p>
<h3>Fricción dinámica (deslizando)</h3>
<p>Una vez se mueve, la fricción es constante y va <strong>en contra de la velocidad</strong>: <code>f = μk · N</code>. Normalmente <code>μk &lt; μs</code>: cuesta más arrancar que mantenerlo en marcha.</p>
<div class="table-wrap"><table class="t"><thead><tr><th>Superficie</th><th>μs</th><th>μk</th><th>En tu juego</th></tr></thead><tbody>
<tr><td>Goma sobre asfalto</td><td>≈ 1,0</td><td>≈ 0,8</td><td>Pista normal</td></tr>
<tr><td>Goma sobre hierba</td><td>≈ 0,5</td><td>≈ 0,35</td><td>Salirse de la pista</td></tr>
<tr><td>Hielo sobre hielo</td><td>≈ 0,1</td><td>≈ 0,03</td><td>Charco de aceite / hielo</td></tr>
</tbody></table></div>

${demo("d-fric", "El experimento del handout", "Clic en el lienzo · S y D suben los coeficientes", `
<canvas id="fr-cv"></canvas>
<div class="controls">
  <label>μs estática <input type="range" id="fr-s" min="0" max="1" step="0.1" value="0"> <b id="fr-sv"></b></label>
  <label>μk dinámica <input type="range" id="fr-d" min="0" max="1" step="0.1" value="0.1"> <b id="fr-dv"></b></label>
  <label><input type="checkbox" id="fr-fix" checked> Protección “nunca empuja hacia atrás”</label>
</div>
<div class="readout" id="fr-out"></div>`)}
<p>Cada segundo sale una bola de 1 a 100 kg y todas reciben la misma fuerza de 100 N hacia la derecha. <strong>Prueba las preguntas de la diapositiva:</strong> con μs = 0,5, ¿qué bolas no se mueven nunca? Las que cumplen <code>100 ≤ 0,5 · m · 9,8</code>, es decir <code>m ≥ 20,4 kg</code>. Con μk = 0,3, ¿cuáles frenan? Una bola de 1 kg casi no nota la fricción porque <code>N</code> es pequeña. Quita la protección y verás bolas temblando en vez de pararse.</p>

<h2>ApplyFriction, línea a línea</h2>
${code(String.raw`
void ModulePhysics::ApplyFriction(PhysBody* pbody, b2Vec2 applied_force)
{
    b2Body* b = pbody->body;

    float mass = b->GetMass();
    float normal = mass * GRAVITY_Z;                // N = m · g

    b2Vec2 velocity = b->GetLinearVelocity();
    b2Vec2 direction;                               // hacia dónde se mueve (o quiere moverse)

    // 1) EN REPOSO: fricción estática
    if (velocity.Length() < 0.01f)
    {
        if (applied_force.Length() <= static_friction * normal)
        {
            b->ApplyForceToCenter(-applied_force, true);   // anula exactamente el empuje
            return;                                         // y sigue quieto
        }
        direction = applied_force;                  // el empuje gana: empieza a deslizar
    }
    else
    {
        direction = velocity;
    }
    direction.Normalize();                          // solo nos interesa la dirección (longitud 1)

    // 2) DESLIZANDO: fricción dinámica, opuesta al movimiento
    b2Vec2 friction = -dynamic_friction * normal * direction;

    // 3) La fricción frena, nunca empuja hacia atrás
    b2Vec2 next_velocity = velocity + (PHYSICS_DT / mass) * (applied_force + friction);
    if (b2Dot(next_velocity, direction) <= 0.0f)    // ¿el próximo Step invertiría el sentido?
    {
        b->SetLinearVelocity(b2Vec2_zero);          // entonces se para exactamente
        b->ApplyForceToCenter(-applied_force, true);
        return;
    }

    b->ApplyForceToCenter(friction, true);
}`, "cpp", "ModulePhysics.cpp")}

<h3>¿Por qué el paso 3?</h3>
<p>Imagina una bola casi parada, a 0,01 m/s. La fricción es constante (no depende de la velocidad) y en un paso le quita, por ejemplo, 0,05 m/s. Resultado: −0,04 m/s, ¡va hacia atrás! Al paso siguiente la fricción se gira y la empuja hacia delante… y así para siempre: la bola <strong>tiembla alrededor de cero</strong>. La protección predice la velocidad del próximo paso con la misma fórmula que usa Box2D; si cambiaría de sentido (producto escalar ≤ 0), la para en seco.</p>
${nota(`<p><strong>Producto escalar</strong> <code>b2Dot(a, b) = a.x·b.x + a.y·b.y</code>: es positivo si los dos vectores apuntan “hacia el mismo lado”, negativo si apuntan en sentidos opuestos, cero si son perpendiculares. Lo usarás muchísimo en el coche (lección 08).</p>`)}

<h2>Del experimento a tu coche</h2>
<ul>
<li>Cada frame: <code>ApplyForceToCenter(motor)</code> + <code>ApplyFriction(coche, motor)</code>. Sin la segunda línea, el coche nunca se para al soltar el acelerador.</li>
<li>Zonas del circuito (sensores): al entrar en hierba, sube <code>dynamic_friction</code> <em>de ese coche</em>; en aceite, bájala. Te conviene guardar los coeficientes por coche, no globales en ModulePhysics.</li>
<li>El homework de la diapositiva, <strong>fricción angular</strong>, es lo que impide que un coche que gira siga girando para siempre: <code>body-&gt;SetAngularDamping()</code> o un torque opuesto a la velocidad angular.</li>
</ul>

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Por qué en vista cenital la gravedad del mundo es 0?", o: ["Para que vaya más rápido", "Porque la gravedad real apunta hacia la pantalla y Box2D no tiene eje Z", "Porque Raylib no la soporta"], c: 1, e: "Si no fuese 0, todo caería hacia abajo de la pantalla." },
      { p: "Aplicas ApplyForceToCenter una sola vez y apenas se mueve. ¿Por qué?", o: ["La fuerza se borra tras cada Step: hay que aplicarla cada frame", "Falta SetAwake", "La masa es 0"], c: 0, e: "Para un golpe único, usa un impulso." },
      { p: "100 N de empuje, μs = 0,5, g = 9,8. ¿Desde qué masa la bola no se mueve?", o: ["≈ 10 kg", "≈ 20,4 kg", "≈ 50 kg"], c: 1, e: "100 ≤ 0,5 · m · 9,8 → m ≥ 20,4 kg." },
      { p: "¿Hacia dónde apunta la fricción dinámica?", o: ["Hacia la fuerza aplicada", "En contra de la velocidad", "Hacia abajo"], c: 1, e: "friction = −μk · N · dirección_del_movimiento." },
      { p: "¿Qué evita la comprobación con b2Dot(next_velocity, direction)?", o: ["Que la bola tiemble alrededor de cero", "Que la bola salga de la pantalla", "La división por cero"], c: 0, e: "La fricción frena, nunca empuja hacia atrás." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#fr-cv"), out = root.querySelector("#fr-out");
      const sIn = root.querySelector("#fr-s"), dIn = root.querySelector("#fr-d"), fix = root.querySelector("#fr-fix");
      const sim = B2.mundo(cv, { w: 720, h: 400, ppm: 50, gravedad: [0, 0] });
      const V = B2.Vec2, G = 9.8, DT = 1 / 60;
      const R = (m) => 5 * Math.sqrt(m);       // en la demo, la mitad que en el handout para que quepan
      const balls = [];
      let spawn = 0;
      function applyFriction(b, F) {
        const mass = b.getMass(), N = mass * G, v = b.getLinearVelocity();
        let dir;
        if (v.length() < 0.01) {
          if (F.length() <= +sIn.value * N) { b.applyForceToCenter(V(-F.x, -F.y), true); return "estática"; }
          dir = V(F.x, F.y);
        } else dir = V(v.x, v.y);
        dir.normalize();
        const fr = V(-(+dIn.value) * N * dir.x, -(+dIn.value) * N * dir.y);
        if (fix.checked) {
          const nv = V(v.x + DT / mass * (F.x + fr.x), v.y + DT / mass * (F.y + fr.y));
          if (nv.x * dir.x + nv.y * dir.y <= 0) { b.setLinearVelocity(V(0, 0)); b.applyForceToCenter(V(-F.x, -F.y), true); return "parada"; }
        }
        b.applyForceToCenter(fr, true); return "dinámica";
      }
      sim.onPaso((dt) => {
        spawn += dt;
        if (spawn >= 1) {
          spawn = 0;
          const m = 1 + Math.floor(Math.random() * 100), r = R(m);
          const y = r + Math.random() * (400 - 2 * r);
          const area = Math.PI * Math.pow(r / 50, 2);
          const b = sim.circulo(r + 2, y, r, { densidad: m / area, friccion: 0, datos: { masa: m, vida: 0, color: `hsla(${20 + m * 2.2}, 70%, 55%, .55)` } });
          balls.push(b);
        }
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i], ud = b.getUserData();
          ud.vida += dt;
          if (ud.vida > 10 || b.getPosition().x * 50 > 760) { sim.destruir(b); balls.splice(i, 1); continue; }
          const F = V(100, 0);
          b.applyForceToCenter(F, true);
          ud.estado = applyFriction(b, F);
        }
      });
      Curso.teclado(cv, (e) => {
        const sube = (inp) => { let v = +inp.value + 0.1; if (v > 1.05) v = 0; inp.value = v.toFixed(1); };
        if (e.code === "KeyS") sube(sIn); if (e.code === "KeyD") sube(dIn);
      });
      sim.onDibujo((ctx) => {
        root.querySelector("#fr-sv").textContent = (+sIn.value).toFixed(1); root.querySelector("#fr-dv").textContent = (+dIn.value).toFixed(1);
        ctx.textAlign = "center";
        balls.forEach((b) => { const p = sim.pos(b), ud = b.getUserData(); sim.texto(ud.masa + " kg", p.x, p.y + 4, Curso.color("ink"), 11); });
        ctx.textAlign = "left";
        const lim = +sIn.value > 0 ? (100 / (+sIn.value * G)).toFixed(1) + " kg" : "ninguna";
        sim.texto(`Static (S): ${(+sIn.value).toFixed(1)}   Dynamic (D): ${(+dIn.value).toFixed(1)}`, 10, 390, Curso.color("ink"), 13);
        out.innerHTML = `<span>empuje <b>100 N →</b></span><span>no se mueven las de masa ≥ <b>${lim}</b></span><span>bolas <b>${balls.length}</b></span><span>paradas ahora <b>${balls.filter((b) => b.getLinearVelocity().length() < 0.01).length}</b></span>`;
      });
    }
  });
})();
