(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "box2dpro", titulo: "Box2D avanzado", icono: "b2+",
    desc: "Consultas de área (QueryAABB), callbacks de raycast con fraction, recorrer cuerpos y contactos, sleep, fixedRotation, motores de joints y prismatic.",
    chuleta: [
      ["QueryAABB", "```class Query : public b2QueryCallback {\npublic:\n    std::vector<b2Body*> found;\n    bool ReportFixture(b2Fixture* f) override { found.push_back(f->GetBody()); return true; } // true = sigue\n};\nb2AABB box; box.lowerBound = p - b2Vec2(2,2); box.upperBound = p + b2Vec2(2,2);\nQuery q; world->QueryAABB(&q, box);```"],
      ["RayCast callback", "```float ReportFixture(b2Fixture* f, const b2Vec2& point, const b2Vec2& normal, float fraction) override\n{\n    hit = true; hit_point = point;\n    return fraction;   // recorta el rayo: al final queda el impacto más cercano\n}\n// return -1 ignora esta fixture, 0 para, 1 sigue sin recortar```"],
      ["Recorrer", "```for (b2Body* b = world->GetBodyList(); b; b = b->GetNext()) { ... }\nfor (b2ContactEdge* ce = body->GetContactList(); ce; ce = ce->next)\n    if (ce->contact->IsTouching()) { ... }```"]
    ],
    preguntas: [
      test("Una explosión debe empujar todo lo que hay en un radio. ¿Qué usas para encontrar los cuerpos?", ["Un sensor permanente", "world->QueryAABB con una caja alrededor (y luego filtras por distancia)", "Recorrer los píxeles", "RayCast"], 1, "", { nuevo: true }),
      huecos("El callback de la consulta.", String.raw`class Query : public b2▢ {
public:
    std::vector<b2Body*> found;
    bool ReportFixture(b2Fixture* f) ▢
    {
        found.push_back(f->GetBody());
        return true;
    }
};`, ["QueryCallback", "override", "ContactListener", "virtual", "RayCastCallback"], ["QueryCallback", "override"], "Devolver true = seguir buscando."),
      orden("Aplica la explosión.", [
        "for (b2Body* b : q.found)",
        "{",
        "    b2Vec2 d = b->GetPosition() - center;",
        "    float dist = d.Length();",
        "    if (dist < 0.01f || dist > radius) continue;",
        "    d *= 1.0f / dist;",
        "    b->ApplyLinearImpulseToCenter(power * (1.0f - dist / radius) * d, true);",
        "}"], "Dirección desde el centro, normalizada, y más fuerte cuanto más cerca."),
      test("QueryAABB devuelve fixtures cuya caja envolvente toca la tuya. ¿Qué implica?", ["Que siempre se tocan de verdad", "Que puede haber falsos positivos: hay que comprobar la distancia o TestPoint", "Nada", "Que solo devuelve estáticos"], 1, ""),
      test("En un b2RayCastCallback, ¿qué hace `return fraction;`?", ["Para el rayo", "Recorta el rayo a ese punto: al final te quedas con el impacto más cercano", "Ignora la fixture", "Sigue sin cambios"], 1, ""),
      test("¿Y `return -1.0f;`?", ["Para todo", "Ignora esta fixture (útil para saltarte sensores o al propio coche)", "Error", "Recorta"], 1, "0 = parar ya; 1 = seguir sin recortar."),
      huecos("Raycast que ignora sensores.", String.raw`float ReportFixture(b2Fixture* f, const b2Vec2& p, const b2Vec2& n, float fraction) override
{
    if (f->▢()) return ▢;
    hit = true; point = p;
    return fraction;
}`, ["IsSensor", "-1.0f", "0.0f", "1.0f", "GetBody"], ["IsSensor", "-1.0f"], ""),
      escribe("Escribe la cabecera del for que recorre todos los cuerpos del mundo `world` (variable `b`).", [/^for\(b2Body\*b=world->GetBodyList\(\);b;b=b->GetNext\(\)\)\{?$/, /^for\(b2Body\*b=world->GetBodyList\(\);b!=nullptr;b=b->GetNext\(\)\)\{?$/, /^for\(b2Body\*b=world->GetBodyList\(\);b!=NULL;b=b->GetNext\(\)\)\{?$/], "Lista enlazada: GetBodyList y GetNext.", { ph: "for (b2Body* b = ..." }),
      bug("Crash al destruir cuerpos recorriendo la lista.", [
        "for (b2Body* b = world->GetBodyList(); b; b = b->GetNext())",
        "    if (IsDead(b)) world->DestroyBody(b);"], 0, "Tras DestroyBody(b), b->GetNext() lee memoria liberada. Guarda `b2Body* next = b->GetNext();` antes de destruir."),
      test("¿Qué es `IsTouching()` en un contacto de `GetContactList()`?", ["Siempre true", "Indica si de verdad se tocan (la lista también tiene contactos cuyos AABB solo se solapan)", "Si es sensor", "Si está dormido"], 1, ""),
      test("¿Qué hace `SetFixedRotation(true)`?", ["Fija la posición", "El cuerpo no puede girar (ideal para el personaje de un plataformas)", "Lo duerme", "Lo hace estático"], 1, ""),
      test("¿Qué significa que un cuerpo esté dormido (sleep)?", ["Está destruido", "Box2D deja de simularlo porque está quieto; se despierta al tocarlo o con wake = true", "No colisiona nunca", "Es un sensor"], 1, "Si lo teletransportas con SetTransform, despiértalo con SetAwake(true)."),
      huecos("Un revolute con motor (una puerta giratoria).", String.raw`b2RevoluteJointDef jd;
jd.Initialize(ground, door, pivot);
jd.▢ = true;
jd.motorSpeed = 2.0f;        // rad/s
jd.▢ = 500.0f;     // N·m
world->CreateJoint(&jd);`, ["enableMotor", "maxMotorTorque", "enableLimit", "maxMotorForce", "lowerAngle"], ["enableMotor", "maxMotorTorque"], "En el prismatic es maxMotorForce (lineal)."),
      test("¿Qué joint usas para una plataforma que solo se mueve arriba y abajo?", ["Revolute", "Prismatic (desplazamiento sobre un eje)", "Weld", "Mouse"], 1, ""),
      test("¿Qué hace un weld joint?", ["Une dos cuerpos rígidamente (como si fueran uno)", "Los separa", "Hace de muelle", "Gira"], 0, ""),
      test("Al hacer DestroyBody de un cuerpo con joints, ¿qué pasa con los joints?", ["Se quedan", "Se destruyen también: tus punteros a ellos quedan colgando (ponlos a nullptr)", "Crash siempre", "Pasan al otro cuerpo"], 1, "Es justo el problema del mouse_joint con F1."),
      escribe("Escribe la línea que hace que el cuerpo `b` no se duerma nunca.", ["b->SetSleepingAllowed(false)"], "Útil para el coche del jugador.", { ph: "b->..." }),
      test("¿Cómo cambias la masa de un cuerpo después de crearlo sin tocar la densidad?", ["SetMass", "b2MassData md; b->GetMassData(&md); md.mass = 5; b->SetMassData(&md);", "No se puede", "SetDensity"], 1, "")
    ]
  });
})();
