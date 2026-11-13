(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "b04", num: "04", grupo: "Bloque 1 · Las piezas de Box2D", corto: "Joints", pdf: "Lesson4_Joints",
    titulo: "Joints: unir cuerpos (y el mouse joint de la F1)",
    resumen: "Los tipos de joint, cómo se crean y destruyen, y el mouse joint de depuración que exige el proyecto.",
    intro: "Un joint es una restricción: “estos dos cuerpos siempre a la misma distancia”, “este gira alrededor de ese punto”, “este solo se desliza por esta línea”. Con joints haces bisagras, muelles, suspensiones, pistones… y el arrastre con ratón que el proyecto pide con F1.",
    objetivos: ["Saber qué hace cada tipo de joint y cuándo usarlo", "Crear y destruir joints con el patrón def + Create", "Programar el mouse joint completo (TODOs 1–4)", "Evitar el crash de usar un joint ya destruido"],
    html: () => `
<h2>¿Qué es un joint?</h2>
<p>Restringe el movimiento de dos cuerpos entre sí (o de uno respecto al mundo, usando un cuerpo estático). Uno de los dos puede ser estático; si los dos lo son, el joint se ignora. Se crean igual que los bodies: <strong>definición + fábrica</strong>.</p>
${code(String.raw`
b2RevoluteJointDef jointDef;
jointDef.Initialize(bodyA, bodyB, anchor);          // rellenar la definición
b2Joint* joint = world->CreateJoint(&jointDef);     // el mundo lo crea
// ...
world->DestroyJoint(joint);                         // y lo destruye`, "cpp")}
${nota(`<p>Cuando destruyes un body, <strong>Box2D destruye también todos sus joints</strong>. Si tú guardabas un puntero a uno de esos joints, ahora apunta a memoria liberada. Es el “Careful!” del handout: si arrastras una pelota hasta el sensor que la destruye, <code>mouse_joint</code> queda colgando → crash. Por eso <code>DestroyBody()</code> comprueba si el body era el del mouse joint y pone el puntero a NULL.</p>`, "warn")}

<h2>El catálogo</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Joint</th><th>Restricción</th><th>Ejemplos</th></tr></thead><tbody>
<tr><td><strong>Distance</strong></td><td>Distancia constante entre dos puntos. Con <code>stiffness/damping</code> se vuelve un muelle. Con <code>minLength/maxLength</code>, una cuerda (el Rope joint se eliminó en 2.4).</td><td>Cuerdas, muelles, remolque</td></tr>
<tr><td><strong>Revolute</strong></td><td>Bisagra: giran alrededor de un punto común. Límites de ángulo y motor.</td><td>Flippers, puertas, ruedas que giran, molinos</td></tr>
<tr><td><strong>Prismatic</strong></td><td>Solo se desliza por un eje. Límites de recorrido y motor.</td><td>Pistones, el lanzador del pinball, ascensores</td></tr>
<tr><td><strong>Wheel</strong></td><td>Se desliza por un eje con muelle (suspensión) y gira libre con motor.</td><td>Ruedas de coche en vista lateral</td></tr>
<tr><td><strong>Weld</strong></td><td>Pega los dos cuerpos (opcionalmente “blando”).</td><td>Romper piezas, objetos que se sueltan</td></tr>
<tr><td><strong>Pulley</strong></td><td>Polea: si uno sube, el otro baja.</td><td>Puzzles, plataformas</td></tr>
<tr><td><strong>Gear</strong></td><td>Une dos revolute/prismatic con una relación.</td><td>Engranajes, cremalleras</td></tr>
<tr><td><strong>Friction</strong></td><td>Frena el movimiento relativo, hasta una fuerza máxima.</td><td><strong>Fricción en vista cenital</strong></td></tr>
<tr><td><strong>Motor</strong></td><td>Empuja un cuerpo hacia la posición/ángulo de otro.</td><td>Imanes, seguir a un objetivo</td></tr>
<tr><td><strong>Mouse</strong></td><td>Lleva un punto del cuerpo hacia un objetivo con un muelle.</td><td><strong>Solo depuración</strong>: arrastrar con el ratón</td></tr>
</tbody></table></div>

${demo("d-joints", "Galería de joints (Box2D real)", "Elige una escena · arrastra con el ratón · Espacio / A / D según la escena", `
<div class="controls" id="jt-btns"></div>
<canvas id="jt-cv"></canvas>
<div class="readout" id="jt-out"></div>`)}

<h3>Muelles: stiffness y damping</h3>
<p>En Box2D 2.4 los joints “blandos” se configuran con <code>stiffness</code> y <code>damping</code>, que se calculan con un ayudante a partir de dos números más intuitivos:</p>
${code(String.raw`
b2LinearStiffness(jointDef.stiffness, jointDef.damping,
                  frequencyHz,      // cuántas oscilaciones por segundo (menos de la mitad de los fps)
                  dampingRatio,     // 0 = oscila para siempre, 1 = no oscila
                  bodyA, bodyB);`, "cpp")}

<h3>Revolute con límites y motor</h3>
${code(String.raw`
b2RevoluteJointDef jointDef;
jointDef.Initialize(myBodyA, myBodyB, myBodyA->GetWorldCenter());
jointDef.enableLimit = true;
jointDef.lowerAngle = -0.5f * b2_pi;     // -90 grados (¡radianes!)
jointDef.upperAngle =  0.25f * b2_pi;    //  45 grados
jointDef.enableMotor = true;
jointDef.maxMotorTorque = 10.0f;         // fuerza máxima del motor
jointDef.motorSpeed = 0.0f;              // rad/s; cámbialo en juego con joint->SetMotorSpeed()`, "cpp")}

<h2>El mouse joint, paso a paso (TODOs 1–4)</h2>
<p>El proyecto exige: <em>“pressing F1 should draw all shapes and allow to use a mouse joint”</em>. El handout lo resuelve en <code>ModulePhysics::PostUpdate</code>, que ya recorre todos los bodies y fixtures para dibujarlos. Aprovecha ese mismo recorrido:</p>
${todo("TODO 1", "ModulePhysics::PostUpdate", `<p>Al pulsar el botón izquierdo, comprueba si la fixture contiene el ratón (en metros). Solo cuerpos dinámicos. En cuanto encuentres uno, deja de buscar.</p>`,
      code(String.raw`
b2Vec2 mouse_position(PIXEL_TO_METERS(GetMouseX()), PIXEL_TO_METERS(GetMouseY()));
b2Body* body_clicked = NULL;

for (b2Body* b = world->GetBodyList(); b; b = b->GetNext())
{
    for (b2Fixture* f = b->GetFixtureList(); f; f = f->GetNext())
    {
        // ... dibujar la fixture ...

        if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT) && mouse_joint == NULL && body_clicked == NULL
            && b->GetType() == b2_dynamicBody && f->TestPoint(mouse_position))
        {
            body_clicked = b;
        }
    }
}`, "cpp"))}
${todo("TODO 2", "ModulePhysics::PostUpdate", `<p>Si has pinchado un cuerpo, crea el mouse joint. <code>bodyA</code> es <code>ground</code>: un cuerpo estático sin fixtures que se creó en Start solo para esto.</p>`,
      code(String.raw`
if (body_clicked != NULL)
{
    b2MouseJointDef def;
    def.bodyA = ground;
    def.bodyB = body_clicked;
    def.target = mouse_position;
    def.maxForce = 100.0f * body_clicked->GetMass();      // fuerza proporcional a la masa
    b2LinearStiffness(def.stiffness, def.damping, 5.0f, 0.7f, def.bodyA, def.bodyB);

    mouse_joint = (b2MouseJoint*)world->CreateJoint(&def);
    body_clicked->SetAwake(true);                          // por si estaba dormido
}`, "cpp"))}
${todo("TODO 3", "ModulePhysics::PostUpdate", `<p>Mientras se mantiene el botón, mueve el objetivo y dibuja una línea roja entre los dos anclajes. Los anclajes vienen en metros; DrawLine quiere píxeles.</p>`,
      code(String.raw`
if (mouse_joint != NULL && IsMouseButtonDown(MOUSE_BUTTON_LEFT))
{
    mouse_joint->SetTarget(mouse_position);
    b2Vec2 anchor_a = mouse_joint->GetAnchorA();   // el objetivo (ratón)
    b2Vec2 anchor_b = mouse_joint->GetAnchorB();   // el punto del cuerpo
    DrawLine(METERS_TO_PIXELS(anchor_a.x), METERS_TO_PIXELS(anchor_a.y),
             METERS_TO_PIXELS(anchor_b.x), METERS_TO_PIXELS(anchor_b.y), RED);
}`, "cpp"))}
${todo("TODO 4", "ModulePhysics::PostUpdate", `<p>Al soltar, destruye el joint y pon el puntero a NULL.</p>`,
      code(String.raw`
if (mouse_joint != NULL && IsMouseButtonReleased(MOUSE_BUTTON_LEFT))
{
    world->DestroyJoint(mouse_joint);
    mouse_joint = NULL;                 // si no, el siguiente frame usarías memoria liberada
}`, "cpp"))}
${code(String.raw`
void ModulePhysics::DestroyBody(PhysBody* pbody)
{
    if (pbody == NULL) return;
    // Box2D también destruye los joints de este body: olvida el mouse joint
    if (mouse_joint != NULL && mouse_joint->GetBodyB() == pbody->body)
        mouse_joint = NULL;
    world->DestroyBody(pbody->body);
    delete pbody;
}`, "cpp", "La protección contra el crash")}

<h2>Joints en un juego de carreras top-down</h2>
<ul>
<li><strong>Friction joint</strong> entre el coche y <code>ground</code>: frena el coche contra el “suelo” sin programar fricción a mano (alternativa a la lección 05).</li>
<li><strong>Revolute</strong> con motor: barreras giratorias, molinos que empujan coches.</li>
<li><strong>Prismatic</strong> kinematic o con motor: puertas que suben y bajan, obstáculos que se deslizan.</li>
<li><strong>Distance</strong> o <strong>Weld</strong>: un remolque, un coche que arrastra algo.</li>
<li><strong>Mouse</strong>: depurar (F1) — mueve rivales para probar la IA o la detección de vueltas.</li>
</ul>

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué joint usarías para los flippers de un pinball?", o: ["Distance", "Revolute con límites y motor", "Weld"], c: 1, e: "Giran alrededor de un eje con un ángulo limitado; el motor los dispara." },
      { p: "¿Qué es bodyA en el mouse joint del handout?", o: ["El cuerpo clicado", "ground: un cuerpo estático sin fixtures", "NULL"], c: 1, e: "Se crea en Start solo para anclar joints al mundo." },
      { p: "Destruyes una pelota que estabas arrastrando. ¿Qué pasa con mouse_joint si no haces nada?", o: ["Se pone a NULL solo", "Apunta a memoria liberada: crash al usarlo", "Sigue funcionando"], c: 1, e: "Box2D destruyó el joint con el body; tu puntero no se entera." },
      { p: "Un muelle que oscila para siempre tiene dampingRatio…", o: ["0", "1", "100"], c: 0, e: "0 = sin amortiguación; 1 = no oscila." },
      { p: "¿Qué joint sustituye al Rope joint en Box2D 2.4?", o: ["Distance con maxLength", "Prismatic", "Pulley"], c: 0, e: "minLength/maxLength en el distance joint." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#jt-cv"), out = root.querySelector("#jt-out"), btns = root.querySelector("#jt-btns");
      const sim = B2.mundo(cv, { w: 720, h: 400, ppm: 50, gravedad: [0, 10] });
      const pl = sim.pl, V = B2.Vec2, M = sim.M;
      const keys = Curso.teclado(cv);
      let escena = null, actualizar = null, info = "";
      const borrar = () => sim.cuerpos().forEach((b) => sim.destruir(b));
      const marco = () => sim.cadena(0, 0, [4, 4, 4, 396, 716, 396, 716, 4], { datos: { fijo: true } });
      const J = (j) => sim.world.createJoint(j);
      const escenas = {
        "Distance / muelle": () => {
          sim.world.setGravity(V(0, 10)); marco();
          let prev = sim.ground, prevP = V(M(200), M(30));
          for (let i = 0; i < 4; i++) {
            const b = sim.circulo(200, 90 + i * 60, 14);
            J(new pl.DistanceJoint({ frequencyHz: 0, dampingRatio: 0 }, prev, b, prev === sim.ground ? prevP : prev.getPosition(), b.getPosition()));
            prev = b;
          }
          const caja = sim.caja(500, 200, 30, 20);
          J(new pl.DistanceJoint({ frequencyHz: 1.5, dampingRatio: 0.1 }, sim.ground, caja, V(M(500), M(30)), caja.getPosition()));
          const caja2 = sim.caja(620, 200, 30, 20);
          J(new pl.RopeJoint({ maxLength: M(220), localAnchorA: V(M(620), M(30)), localAnchorB: V(0, 0) }, sim.ground, caja2));
          info = "Izquierda: cadena rígida (distance). Centro: muelle (frequencyHz 1.5, damping 0.1). Derecha: cuerda (maxLength).";
          actualizar = (ctx) => { ctx.strokeStyle = Curso.color("ink-3"); ctx.setLineDash([4, 4]); [[500, caja], [620, caja2]].forEach(([x, b]) => { const p = sim.pos(b); ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(p.x, p.y); ctx.stroke(); }); ctx.setLineDash([]); };
        },
        "Revolute: motor y flipper": () => {
          sim.world.setGravity(V(0, 10)); marco();
          const rueda = sim.caja(220, 220, 110, 10);
          J(new pl.RevoluteJoint({ enableMotor: true, maxMotorTorque: 2000, motorSpeed: 1.2 }, sim.ground, rueda, rueda.getPosition()));
          const flip = sim.caja(520, 300, 60, 8);
          const pivote = V(M(470), M(300));
          const jf = J(new pl.RevoluteJoint({ enableLimit: true, lowerAngle: -0.5, upperAngle: 0.35, enableMotor: true, maxMotorTorque: 500, motorSpeed: 0 }, sim.ground, flip, pivote));
          for (let i = 0; i < 6; i++) sim.circulo(150 + i * 70, 40, 12, { rebote: .3 });
          info = "Molino: revolute con motor (homework de la lección). Flipper: revolute con límites; mantén Espacio para dispararlo.";
          actualizar = () => { jf.setMotorSpeed(keys.has("Space") ? -15 : 8); };
        },
        "Prismatic: lanzador": () => {
          sim.world.setGravity(V(0, 10)); marco();
          const piston = sim.caja(360, 330, 40, 12);
          const jp = J(new pl.PrismaticJoint({ enableLimit: true, lowerTranslation: -M(160), upperTranslation: 0, enableMotor: true, maxMotorForce: 400, motorSpeed: 0 }, sim.ground, piston, piston.getPosition(), V(0, 1)));
          sim.circulo(360, 290, 16, { rebote: .2 });
          info = "Prismatic vertical con límites. Mantén Espacio: el motor lo baja (carga); suéltalo: dispara hacia arriba.";
          actualizar = () => { jp.setMotorSpeed(keys.has("Space") ? 3 : -25); jp.setMaxMotorForce(keys.has("Space") ? 400 : 3000); };
        },
        "Wheel: coche lateral": () => {
          sim.world.setGravity(V(0, 10));
          const t = []; for (let x = 0; x <= 720; x += 40) t.push(x, 330 + Math.sin(x / 50) * 18 + (x > 400 ? 20 : 0));
          t.push(716, 396, 4, 396);
          sim.cadena(0, 0, t, { datos: { fijo: true } });
          const chasis = sim.caja(150, 250, 60, 14);
          const r1 = sim.circulo(110, 280, 16, { friccion: .9 }), r2 = sim.circulo(190, 280, 16, { friccion: .9 });
          const def = { enableMotor: true, maxMotorTorque: 40, motorSpeed: 0, frequencyHz: 4, dampingRatio: 0.7 };
          const w1 = J(new pl.WheelJoint(def, chasis, r1, r1.getPosition(), V(0, 1)));
          const w2 = J(new pl.WheelJoint(def, chasis, r2, r2.getPosition(), V(0, 1)));
          info = "Dos wheel joints con suspensión (frequencyHz 4) y motor. Clic en el lienzo y A / D para conducir.";
          actualizar = () => { const s = keys.has("KeyD") ? 25 : keys.has("KeyA") ? -25 : 0; w1.setMotorSpeed(s); w2.setMotorSpeed(s); };
        },
        "Weld blando": () => {
          sim.world.setGravity(V(0, 10)); marco();
          let prev = null;
          for (let i = 0; i < 7; i++) {
            const b = sim.caja(150 + i * 50, 120, 25, 8);
            if (prev) J(new pl.WeldJoint({ frequencyHz: 4, dampingRatio: 0.3 }, prev, b, V(M(150 + i * 50 - 25), M(120))));
            else J(new pl.RevoluteJoint({}, sim.ground, b, V(M(125), M(120))));
            prev = b;
          }
          info = "Tablas unidas con weld joints blandos (frequencyHz 4): una viga que se dobla. Arrástrala.";
          actualizar = null;
        },
        "Friction (vista cenital)": () => {
          sim.world.setGravity(V(0, 0)); marco();
          const a = sim.caja(220, 200, 30, 30, { datos: { color: "rgba(229,57,53,.25)" } });
          const b = sim.caja(500, 200, 30, 30, { datos: { color: "rgba(67,160,71,.25)" } });
          J(new pl.FrictionJoint({ maxForce: 30, maxTorque: 10 }, sim.ground, b, b.getWorldCenter()));
          a.setLinearVelocity(V(0, 3)); b.setLinearVelocity(V(0, 3));
          info = "Sin gravedad. Rojo: sin friction joint, se desliza para siempre. Verde: friction joint con ground, se frena. Lánzalas con el ratón.";
          actualizar = null;
        }
      };
      btns.innerHTML = Object.keys(escenas).map((k) => `<button type="button" class="btn" data-e="${k}">${k}</button>`).join("");
      const cargar = (k) => { borrar(); actualizar = null; escenas[k](); escena = k; btns.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.e === k)); out.innerHTML = `<span>${info}</span>`; };
      btns.querySelectorAll("button").forEach((b) => Curso.on(b, "click", () => cargar(b.dataset.e)));
      sim.onPaso(() => { if (actualizar && actualizar.length === 0) actualizar(); });
      sim.onDibujo((ctx) => {
        if (actualizar && actualizar.length === 1) actualizar(ctx);
        let n = 0; for (let j = sim.world.getJointList(); j; j = j.getNext()) n++;
        sim.texto(`joints: ${n}${sim.mouseJoint ? " (incluye el mouse joint)" : ""}`, 14, 24);
        if (document.activeElement !== cv) sim.texto("Clic en el lienzo para usar el teclado", 420, 24);
      });
      cargar("Revolute: motor y flipper");
    }
  });
})();
