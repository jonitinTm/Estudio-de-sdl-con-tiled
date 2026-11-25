(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "joints", titulo: "Joints y el mouse joint (F1)", icono: "⚙",
    desc: "Revolute, prismatic, distance, weld, friction y el mouse joint de depuración que pide el proyecto.",
    chuleta: [
      ["Mouse joint", "```b2MouseJointDef def;\ndef.bodyA = ground;                // estático vacío\ndef.bodyB = body_clicked;\ndef.target = mouse_position;       // metros\ndef.maxForce = 100.0f * body_clicked->GetMass();\nb2LinearStiffness(def.stiffness, def.damping, 5.0f, 0.7f, def.bodyA, def.bodyB);\nmouse_joint = (b2MouseJoint*)world->CreateJoint(&def);\n// cada frame: mouse_joint->SetTarget(mouse_position);\n// al soltar: world->DestroyJoint(mouse_joint); mouse_joint = nullptr;```"],
      ["Revolute (bisagra)", "```b2RevoluteJointDef jd;\njd.Initialize(bodyA, bodyB, anchor);\njd.enableLimit = true; jd.lowerAngle = -0.5f * b2_pi; jd.upperAngle = 0.25f * b2_pi;\njd.enableMotor = true; jd.maxMotorTorque = 10.0f; jd.motorSpeed = 2.0f;   // rad/s```"],
      ["Destruir", "Al destruir un body, Box2D destruye sus joints. Si guardabas un puntero a uno, ponlo a nullptr."]
    ],
    preguntas: [
      test("¿Qué es un joint?", ["Una forma", "Una restricción entre dos cuerpos (o uno y el mundo)", "Un sensor", "Un tipo de cuerpo"], 1, "Bisagras, muelles, pistones, ruedas…", { nuevo: true }),
      test("¿Qué joint para una barrera que gira sin parar en el circuito?", ["Distance", "Revolute con motor", "Prismatic", "Weld"], 1, "Revolute anclado a ground con enableMotor y motorSpeed."),
      test("¿Qué joint para una puerta que sube y baja por un carril?", ["Revolute", "Prismatic", "Pulley", "Friction"], 1, "Se desliza en un eje, con límites y motor."),
      test("¿Qué joint para frenar un objeto contra el “suelo” en vista cenital?", ["Weld", "Friction joint con ground", "Mouse", "Gear"], 1, "Reduce el movimiento relativo hasta una fuerza máxima: fricción cenital sin programarla a mano."),
      test("¿Qué es `bodyA` en el mouse joint del handout?", ["El cuerpo clicado", "`ground`: un cuerpo estático sin fixtures", "El ratón", "nullptr"], 1, ""),
      orden("Crea el mouse joint cuando has pinchado un cuerpo.", [
        "b2MouseJointDef def;",
        "def.bodyA = ground;",
        "def.bodyB = body_clicked;",
        "def.target = mouse_position;",
        "def.maxForce = 100.0f * body_clicked->GetMass();",
        "b2LinearStiffness(def.stiffness, def.damping, 5.0f, 0.7f, def.bodyA, def.bodyB);",
        "mouse_joint = (b2MouseJoint*)world->CreateJoint(&def);"], "Es el TODO 2 de la Lesson 4."),
      huecos("Mientras mantienes el ratón, el joint sigue al cursor; al soltar se destruye.", String.raw`if (mouse_joint != nullptr && IsMouseButtonDown(MOUSE_BUTTON_LEFT))
    mouse_joint->▢(mouse_position);

if (mouse_joint != nullptr && ▢(MOUSE_BUTTON_LEFT))
{
    world->▢(mouse_joint);
    mouse_joint = nullptr;
}`, ["SetTarget", "IsMouseButtonReleased", "DestroyJoint", "IsMouseButtonPressed", "DestroyBody", "SetPosition"], ["SetTarget", "IsMouseButtonReleased", "DestroyJoint"], ""),
      bug("Arrastras con F1 una moneda que se destruye al tocar el coche y el juego crashea. ¿Qué línea falta proteger?", [
        "void ModulePhysics::DestroyBody(PhysBody* pbody)",
        "{",
        "    world->DestroyBody(pbody->body);",
        "    delete pbody;",
        "}"], 2, "Antes de destruir: `if (mouse_joint && mouse_joint->GetBodyB() == pbody->body) mouse_joint = nullptr;` — Box2D destruye el joint con el cuerpo y tu puntero queda colgando."),
      test("¿Por qué `maxForce = 100 * masa`?", ["Por estética", "Para que se arrastre igual de bien un cuerpo ligero que uno pesado", "Obligatorio", "Para que no se mueva"], 1, ""),
      escribe("Escribe el límite superior de un revolute para 90 grados, usando b2_pi.", [/^0\.5f?\*b2_pi$/, /^b2_pi\*0\.5f?$/, /^b2_pi\/2(\.0f?)?$/],
        "Los ángulos de Box2D van en radianes: 90° = π/2.", { sol: "0.5f * b2_pi", ph: "... * b2_pi" }),
      huecos("Una barrera giratoria con motor.", String.raw`b2RevoluteJointDef jd;
jd.Initialize(ground, barrier, barrier->GetWorldCenter());
jd.▢ = true;
jd.maxMotorTorque = 500.0f;
jd.▢ = 1.5f;   // rad/s
world->CreateJoint(&jd);`, ["enableMotor", "motorSpeed", "enableLimit", "upperAngle", "maxForce"], ["enableMotor", "motorSpeed"], "La barrera debe ser dinámica para que el motor la mueva."),
      test("Un distance joint con `dampingRatio = 0`…", ["no oscila", "oscila para siempre (muelle sin freno)", "es rígido", "se rompe"], 1, "0 = sin amortiguar, 1 = no oscila."),
      test("¿Qué joint sustituye al Rope joint en Box2D 2.4?", ["Distance con maxLength", "Prismatic", "Weld", "Wheel"], 0, ""),
      test("Al destruir un body con joints, ¿qué pasa con los joints?", ["Siguen", "Box2D los destruye también", "Error", "Pasan al ground"], 1, "")
    ]
  });
})();
