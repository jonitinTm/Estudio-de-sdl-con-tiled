Curso.practica({
  leccion: "b04",
  titulo: "El mouse joint de la F1, TODO a TODO",
  intro: "Programarás el arrastre con ratón que exige el proyecto: elegir el cuerpo clicado, crear el joint, moverlo, soltarlo y protegerte del crash. Al final, un revolute con límites.",
  pasos: [
    {
      t: "TODO 1: ¿qué cuerpo he pinchado?",
      exp: `<p>Dentro del bucle que recorre bodies y fixtures, si se acaba de pulsar el botón, no hay joint, aún no has elegido cuerpo, el cuerpo es <strong>dinámico</strong> y la fixture contiene el ratón, guárdalo.</p>`,
      code: String.raw`
if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT) && mouse_joint == NULL && body_clicked == NULL
    && b->GetType() == §s1§ && f->§s2§(mouse_position))
{
    body_clicked = b;
}`,
      slots: {
        s1: { ok: ["b2_dynamicBody"], err: [[/^b2_staticBody$/, "Un estático no se puede arrastrar (masa infinita)."], [/^DYNAMIC$/, "En Box2D 2.4 el tipo es <code>b2_dynamicBody</code>."]], w: 15 },
        s2: { ok: ["TestPoint"] }
      },
      pistas: ["El tipo dinámico de Box2D empieza por <code>b2_</code>.", "La función de la lección 03 para “¿contiene este punto?”."],
      bien: "<p><code>mouse_position</code> está en metros: <code>b2Vec2 mouse_position(PIXEL_TO_METERS(GetMouseX()), PIXEL_TO_METERS(GetMouseY()));</code></p>"
    },
    {
      t: "TODO 2: crear el mouse joint",
      exp: `<p>Si hay <code>body_clicked</code>, rellena un <code>b2MouseJointDef def</code>: bodyA = <code>ground</code>, bodyB = el clicado, target = el ratón, maxForce = 100 × su masa. El muelle ya está: <code>b2LinearStiffness(def.stiffness, def.damping, 5.0f, 0.7f, def.bodyA, def.bodyB);</code>. Créalo y guárdalo (con cast) en <code>mouse_joint</code>.</p>`,
      escribe: {
        antes: "if (body_clicked != NULL)\n{",
        despues: "    body_clicked->SetAwake(true);\n}",
        filas: 9,
        checks: [
          [/b2MouseJointDefdef;/, "Declara: <code>b2MouseJointDef def;</code>"],
          [/def\.bodyA=ground;/, "<code>def.bodyA = ground;</code> (el cuerpo estático vacío)."],
          [/def\.bodyB=body_clicked;/, "<code>def.bodyB = body_clicked;</code>"],
          [/def\.target=mouse_position;/, "<code>def.target = mouse_position;</code>"],
          [/def\.maxForce=100(\.0*f?)?\*body_clicked->GetMass\(\);/, "<code>def.maxForce = 100.0f * body_clicked-&gt;GetMass();</code>"],
          [/b2LinearStiffness\(def\.stiffness,def\.damping/, "No olvides el muelle con <code>b2LinearStiffness(...)</code>."],
          [/mouse_joint=\(b2MouseJoint\*\)world->CreateJoint\(&def\);/, "Créalo: <code>mouse_joint = (b2MouseJoint*)world-&gt;CreateJoint(&amp;def);</code>"]
        ],
        sol: String.raw`    b2MouseJointDef def;
    def.bodyA = ground;
    def.bodyB = body_clicked;
    def.target = mouse_position;
    def.maxForce = 100.0f * body_clicked->GetMass();
    b2LinearStiffness(def.stiffness, def.damping, 5.0f, 0.7f, def.bodyA, def.bodyB);

    mouse_joint = (b2MouseJoint*)world->CreateJoint(&def);`
      },
      pistas: ["Es el código de la diapositiva 20.", "CreateJoint devuelve <code>b2Joint*</code>: hay que convertirlo a <code>b2MouseJoint*</code>."],
      bien: "<p>maxForce proporcional a la masa: así un cuerpo pesado se arrastra igual de bien que uno ligero.</p>"
    },
    {
      t: "TODO 3: seguir al ratón",
      exp: `<p>Mientras se mantiene el botón, actualiza el objetivo del joint.</p>`,
      code: String.raw`
if (mouse_joint != NULL && IsMouseButtonDown(MOUSE_BUTTON_LEFT))
{
    mouse_joint->§s1§(mouse_position);
    b2Vec2 anchor_a = mouse_joint->GetAnchorA();
    b2Vec2 anchor_b = mouse_joint->GetAnchorB();
    DrawLine(§s2§(anchor_a.x), METERS_TO_PIXELS(anchor_a.y),
             METERS_TO_PIXELS(anchor_b.x), METERS_TO_PIXELS(anchor_b.y), RED);
}`,
      slots: { s1: { ok: ["SetTarget"] }, s2: { ok: ["METERS_TO_PIXELS"], err: [[/^PIXEL_TO_METERS$/, "Los anclajes vienen en metros y DrawLine quiere píxeles."]], w: 18 } },
      pistas: ["Set + Target.", "Los anclajes están en metros."],
      bien: ""
    },
    {
      t: "TODO 4: soltar",
      exp: `<p>Al soltar el botón, destruye el joint y olvídalo.</p>`,
      escribe: {
        filas: 5,
        checks: [
          [/if\(mouse_joint!=NULL&&IsMouseButtonReleased\(MOUSE_BUTTON_LEFT\)\)|if\(mouse_joint&&IsMouseButtonReleased\(MOUSE_BUTTON_LEFT\)\)/, "Condición: <code>if (mouse_joint != NULL &amp;&amp; IsMouseButtonReleased(MOUSE_BUTTON_LEFT))</code>"],
          [/world->DestroyJoint\(mouse_joint\);/, "Destruye: <code>world-&gt;DestroyJoint(mouse_joint);</code>"],
          [/mouse_joint=(NULL|nullptr);/, "Y pon el puntero a NULL."]
        ],
        sol: String.raw`if (mouse_joint != NULL && IsMouseButtonReleased(MOUSE_BUTTON_LEFT))
{
    world->DestroyJoint(mouse_joint);
    mouse_joint = NULL;
}`
      },
      pistas: ["Released, no Down ni Pressed."],
      bien: "<p>Sin el NULL, el siguiente clic vería <code>mouse_joint != NULL</code> y usaría memoria liberada.</p>"
    },
    {
      t: "La protección del DestroyBody",
      exp: `<p>Si destruyes el cuerpo que estás arrastrando, Box2D destruye también el mouse joint. Olvídalo antes.</p>`,
      code: String.raw`
if (mouse_joint != NULL && mouse_joint->§s1§ == pbody->body)
    mouse_joint = NULL;
world->DestroyBody(pbody->body);`,
      slots: { s1: { ok: ["GetBodyB()"], err: [[/^GetBodyA\(\)$/, "bodyA es ground. El cuerpo arrastrado es el B."]], w: 12 } },
      pistas: ["¿Qué cuerpo pusiste en def.bodyB?"],
      bien: "<p>Es exactamente el crash de la diapositiva 25: arrastrar una pelota hasta el sensor que la destruye.</p>"
    },
    {
      t: "Revolute con límites",
      exp: `<p>Un flipper que gira entre −90° y +45°. Los ángulos de Box2D van en radianes: usa <code>b2_pi</code>.</p>`,
      code: String.raw`
b2RevoluteJointDef jointDef;
jointDef.Initialize(ground, flipper, pivot);
jointDef.enableLimit = true;
jointDef.lowerAngle = §s1§ * b2_pi;     // -90 grados
jointDef.upperAngle = §s2§ * b2_pi;     //  45 grados
jointDef.enableMotor = true;
jointDef.maxMotorTorque = 10.0f;`,
      slots: {
        s1: { ok: [/^-0?\.5f?$/, /^-0\.50*f?$/], err: [[/^-90/, "¡Eso son grados! En radianes, 90° es π/2: −0.5 × π."]], w: 7, sol: "-0.5f" },
        s2: { ok: [/^0?\.25f?$/, /^0\.250*f?$/], err: [[/^45/, "En radianes 45° es π/4: 0.25 × π."]], w: 7, sol: "0.25f" }
      },
      pistas: ["180° = π rad.", "90° = 0,5π; 45° = 0,25π."],
      bien: "<p>Con el motor: <code>joint-&gt;SetMotorSpeed(IsKeyDown(KEY_SPACE) ? -15.0f : 8.0f);</code> en Update. Pruébalo en la galería de arriba.</p>"
    }
  ]
});
