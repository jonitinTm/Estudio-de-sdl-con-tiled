Curso.practica({
  leccion: "b03",
  titulo: "Test point, ray cast y el contact listener",
  intro: "Los TODOs de Lesson 3: Contains, la distancia del ray cast, convertir ModulePhysics en listener, el userData, BeginContact y los sensores que destruyen sin crashear.",
  pasos: [
    {
      t: "TODO 1: ¿el punto está dentro?",
      exp: `<p>Para cada fixture del body, pregunta a su forma si contiene <code>p</code>. La forma está en coordenadas locales: pásale la <strong>transformación</strong> del cuerpo.</p>`,
      code: String.raw`
for (b2Fixture* fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext())
{
    if (fixture->GetShape()->TestPoint(§s1§, p))
        return true;
}
return false;`,
      slots: { s1: { ok: ["body->GetTransform()"], err: [[/^body->GetPosition\(\)$/, "La posición sola no basta: también hace falta la rotación. Usa GetTransform()."]], w: 22 } },
      pistas: ["Posición + rotación del body = su “transform”."],
      bien: "<p>Y <code>p</code> en metros: <code>b2Vec2 p(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));</code></p>"
    },
    {
      t: "TODO 2: de fracción a distancia",
      exp: `<p>El ray cast da <code>output.fraction</code> (0 = inicio, 1 = final del segmento). Convierte a distancia en píxeles.</p>`,
      code: String.raw`
float dx = (float)(x2 - x1), dy = (float)(y2 - y1);
ret = (int)(§s1§ * sqrtf(dx * dx + dy * dy));`,
      slots: { s1: { ok: ["output.fraction"], err: [[/^output\.normal/, "La normal es una dirección, no una distancia."]], w: 16 } },
      pistas: ["La raíz es la longitud del segmento."],
      bien: "<p>Recuerda recorrer <code>GetChildCount()</code>: una cadena tiene un hijo por segmento, y hay que quedarse con el impacto más cercano.</p>"
    },
    {
      t: "TODO 3: ModulePhysics escucha",
      exp: `<p>Haz que ModulePhysics herede también del listener de Box2D, y regístralo en el mundo.</p>`,
      code: String.raw`
class ModulePhysics : public Module, public §s1§
{
    void BeginContact(b2Contact* contact) override;
};

// En Start():
world->SetContactListener(§s2§);`,
      slots: { s1: { ok: ["b2ContactListener"], w: 18 }, s2: { ok: ["this"], err: [[/^ModulePhysics$/, "Hay que pasar el OBJETO (este módulo), no la clase: <code>this</code>."]] } },
      pistas: ["Herencia múltiple: Module y el listener de contactos.", "El objeto actual."],
      bien: "<p>Con <code>public</code>: si heredas como private, Box2D no podría usarlo como listener.</p>"
    },
    {
      t: "TODO 4: guardar el PhysBody en el body",
      exp: `<p>En cada función de creación, <strong>antes</strong> de CreateBody, guarda la dirección del PhysBody en el userData de la def. En Box2D 2.4 es un <code>uintptr_t</code>.</p>`,
      code: String.raw`
body.userData.pointer = §s1§<uintptr_t>(pbody);
b2Body* b = world->CreateBody(&body);`,
      slots: { s1: { ok: ["reinterpret_cast"], err: [[/^static_cast$/, "static_cast no convierte un puntero en un entero. Para eso: reinterpret_cast."]], w: 17 } },
      pistas: ["Es el cast “a lo bruto” entre punteros y enteros."],
      bien: "<p>Si lo pones después de CreateBody, la def ya se usó: el body no tendrá userData.</p>"
    },
    {
      t: "TODO 5–7: BeginContact",
      exp: `<p>Recupera los dos PhysBody del contacto (a partir de las fixtures A y B) y llama a <code>OnCollision</code> de sus listeners, si existen. Cada uno se recibe a sí mismo primero.</p>`,
      escribe: {
        antes: "void ModulePhysics::BeginContact(b2Contact* contact)\n{",
        despues: "}",
        filas: 9,
        checks: [
          [/PhysBody\*a=\(PhysBody\*\)contact->GetFixtureA\(\)->GetBody\(\)->GetUserData\(\)\.pointer;/, "Recupera a: <code>PhysBody* a = (PhysBody*)contact-&gt;GetFixtureA()-&gt;GetBody()-&gt;GetUserData().pointer;</code>"],
          [/PhysBody\*b=\(PhysBody\*\)contact->GetFixtureB\(\)->GetBody\(\)->GetUserData\(\)\.pointer;/, "Recupera b igual, con GetFixtureB()."],
          [/if\(a!=NULL&&a->listener!=NULL\)a->listener->OnCollision\(a,b\);|if\(a&&a->listener\)a->listener->OnCollision\(a,b\);|if\(a!=nullptr&&a->listener!=nullptr\)a->listener->OnCollision\(a,b\);/, "Para a: <code>if (a != NULL &amp;&amp; a-&gt;listener != NULL) a-&gt;listener-&gt;OnCollision(a, b);</code>"],
          [/b->listener->OnCollision\(b,a\);/, "Para b, con el orden al revés: <code>b-&gt;listener-&gt;OnCollision(b, a);</code>"]
        ],
        sol: String.raw`    PhysBody* a = (PhysBody*)contact->GetFixtureA()->GetBody()->GetUserData().pointer;
    PhysBody* b = (PhysBody*)contact->GetFixtureB()->GetBody()->GetUserData().pointer;

    if (a != NULL && a->listener != NULL)
        a->listener->OnCollision(a, b);

    if (b != NULL && b->listener != NULL)
        b->listener->OnCollision(b, a);`
      },
      pistas: ["Fixture → Body → UserData → pointer, y un cast a PhysBody*.", "Comprueba NULL antes de usar el listener (no todos los cuerpos lo tienen)."],
      bien: "<p>Así, en OnCollision, <code>bodyA</code> siempre es “el mío” y <code>bodyB</code> “el otro”.</p>"
    },
    {
      t: "Sensores que destruyen, sin crash",
      exp: `<p>En <code>ModuleGame::OnCollision</code>: si <code>bodyA</code> es el sensor, apunta <code>bodyB</code> en <code>bodies_to_destroy</code> (solo si no estaba ya) y sal. Nada de destruir aquí.</p>`,
      escribe: {
        antes: "void ModuleGame::OnCollision(PhysBody* bodyA, PhysBody* bodyB)\n{",
        despues: "    App->audio->PlayFx(bonus_fx);\n}",
        filas: 7,
        checks: [
          [/if\(bodyA==sensor\)/, "Comprueba: <code>if (bodyA == sensor)</code>"],
          [/std::find\(bodies_to_destroy\.begin\(\),bodies_to_destroy\.end\(\),bodyB\)==bodies_to_destroy\.end\(\)/, "Evita repetidos con <code>std::find(bodies_to_destroy.begin(), bodies_to_destroy.end(), bodyB) == bodies_to_destroy.end()</code>"],
          [/bodies_to_destroy\.push_back\(bodyB\);/, "Apúntalo: <code>bodies_to_destroy.push_back(bodyB);</code>"],
          [/return;/, "Sal con <code>return;</code> para no tocar el sonido."]
        ],
        prohibido: [[/DestroyBody|DestroyEntity|delete/, "¡Nada de destruir dentro del callback! El mundo está bloqueado en mitad de Step. Hazlo en Update."]],
        sol: String.raw`    if (bodyA == sensor)
    {
        if (std::find(bodies_to_destroy.begin(), bodies_to_destroy.end(), bodyB) == bodies_to_destroy.end())
            bodies_to_destroy.push_back(bodyB);
        return;
    }`
      },
      pistas: ["Un if, otro if con std::find, push_back, return.", "Cada contacto llega dos veces: por eso el find."],
      bien: "<p>En <code>Update()</code> recorres <code>bodies_to_destroy</code>, destruyes y haces <code>clear()</code>. Es el mismo patrón que usarás para las monedas o los items del juego de carreras.</p>"
    }
  ]
});
