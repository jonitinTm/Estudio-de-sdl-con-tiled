Curso.practica({
  leccion: "guardarcargar",
  titulo: "Entidades desde Tiled, F5 para guardar y F6 para cargar",
  intro: "Escribirás la lectura de la capa Entities, la fábrica Scene::CreateEntity, el SaveState con pugixml y el LoadState que reconstruye el mundo.",
  pasos: [
    {
      t: "La clase del objeto (dos versiones de Tiled)",
      exp: `<p>Lee la clase del objeto del atributo <code>type</code>; si no existe, usa el de <code>class</code> como valor por defecto.</p>`,
      code: String.raw`obj.className = o.attribute("§s1§").as_string(o.attribute("class").§s2§());`,
      slots: { s1: { ok: ["type"], err: [], w: 6 }, s2: { ok: ["as_string"], err: [[/^value$/, "Funciona en pugixml, pero para ser coherente usa as_string()."]], w: 10 } },
      pistas: ["El parámetro de <code>as_string(def)</code> es el valor por defecto."],
      bien: "<p>Así funciona tanto con Tiled 1.8 como con las versiones que guardan <code>class</code>.</p>"
    },
    {
      t: "Recorrer la capa Entities",
      exp: `<p>Pide el grupo <code>"Entities"</code> al mapa y, para cada objeto, llama a <code>CreateEntity(o.className, o.x, o.y)</code>. Si no existe el grupo, sal.</p>`,
      escribe: {
        antes: "void Scene::CreateEntitiesFromMap()\n{",
        despues: "}",
        filas: 5,
        checks: [
          [/auto\w*group=Engine::GetInstance\(\)\.map->GetObjectGroup\("Entities"\);|(std::shared_ptr<ObjectGroup>)group=Engine::GetInstance\(\)\.map->GetObjectGroup\("Entities"\);/, "Pide el grupo: <code>auto group = Engine::GetInstance().map-&gt;GetObjectGroup(\"Entities\");</code>"],
          [/if\(!group\)return;|if\(group==nullptr\)return;|if\(!group\)\{[^}]*return;\}/, "Si no existe: <code>if (!group) return;</code>"],
          [/for\(const(MapObject|auto)&o:group->objects\)/, "Recorre: <code>for (const MapObject&amp; o : group-&gt;objects)</code>"],
          [/CreateEntity\(o\.className,o\.x,o\.y\);/, "Crea: <code>CreateEntity(o.className, o.x, o.y);</code>"]
        ],
        sol: String.raw`    auto group = Engine::GetInstance().map->GetObjectGroup("Entities");
    if (!group) return;
    for (const MapObject& o : group->objects)
        CreateEntity(o.className, o.x, o.y);`
      },
      pistas: ["Cuatro líneas: pedir, comprobar, recorrer, crear."],
      bien: "<p>Ya no hay entidades creadas a mano en Awake/Start: todo sale del mapa.</p>"
    },
    {
      t: "La fábrica",
      exp: `<p>Completa la cadena de <code>if</code> que traduce el nombre de la clase al tipo de entidad.</p>`,
      code: String.raw`if (className == "Player")     e = em.CreateEntity(EntityType::PLAYER);
else if (className == §s1§) e = em.CreateEntity(EntityType::ENEMY);
else if (className == "Item")  e = em.CreateEntity(EntityType::§s2§);
else return §s3§;
e->position = Vector2D(x, y);`,
      slots: { s1: { ok: ["\"Enemy\""], err: [[/^Enemy$/, "Es un texto: entre comillas."]], w: 8 }, s2: { ok: ["ITEM"], err: [], w: 6 }, s3: { ok: ["nullptr"], err: [[/^NULL$|^0$/, "Funciona, pero en C++ moderno con shared_ptr usa nullptr."]], w: 8 } },
      pistas: ["El string debe coincidir exactamente con la Class que pusiste en Tiled (mayúsculas incluidas)."],
      bien: "<p>Si escribes <code>\"enemy\"</code> en Tiled y <code>\"Enemy\"</code> aquí, no se crea nada. Haz LOG de las clases desconocidas.</p>"
    },
    {
      t: "SaveState: un nodo por entidad viva",
      exp: `<p>Dentro del <code>for</code> sobre las entidades: sáltate las inactivas o pendientes de borrar, añade un hijo <code>entity</code> a <code>list</code> y escribe los atributos <code>class</code>, <code>x</code> e <code>y</code>.</p>`,
      escribe: {
        antes: "for (const auto& e : Engine::GetInstance().entityManager->entities)\n{",
        despues: "}\ndoc.save_file(\"savegame.xml\");",
        filas: 6,
        checks: [
          [/if\(!e->active\|\|e->pendingToDelete\)continue;/, "Salta las muertas: <code>if (!e-&gt;active || e-&gt;pendingToDelete) continue;</code>"],
          [/pugi::xml_noden=list\.append_child\("entity"\);/, "El nodo: <code>pugi::xml_node n = list.append_child(\"entity\");</code>"],
          [/n\.append_attribute\("class"\)=ClassName\(e->type\);/, "La clase: <code>n.append_attribute(\"class\") = ClassName(e-&gt;type);</code>"],
          [/n\.append_attribute\("x"\)=e->position\.getX\(\);/, "La x: <code>n.append_attribute(\"x\") = e-&gt;position.getX();</code>"],
          [/n\.append_attribute\("y"\)=e->position\.getY\(\);/, "La y: <code>n.append_attribute(\"y\") = e-&gt;position.getY();</code>"]
        ],
        sol: String.raw`    if (!e->active || e->pendingToDelete) continue;
    pugi::xml_node n = list.append_child("entity");
    n.append_attribute("class") = ClassName(e->type);
    n.append_attribute("x") = e->position.getX();
    n.append_attribute("y") = e->position.getY();`
      },
      pistas: ["Lo muerto no se escribe: esa ausencia es el dato."],
      bien: "<p>Abre savegame.xml después de pulsar F5 y comprueba que aparece lo que esperas.</p>"
    },
    {
      t: "LoadState: limpiar y reconstruir",
      exp: `<p>Tras cargar el archivo, destruye todas las entidades y recórrelas desde el XML.</p>`,
      code: String.raw`Engine::GetInstance().entityManager->§s1§();
for (pugi::xml_node n = doc.child("game_state").child("entities").child("entity"); n; n = n.§s2§("entity"))
    CreateEntity(n.attribute("class").as_string(), n.attribute("x").§s3§(), n.attribute("y").as_float());`,
      slots: { s1: { ok: ["DestroyAll"], err: [], w: 11 }, s2: { ok: ["next_sibling"], err: [[/^next$/, "En pugixml el siguiente hermano es next_sibling."]], w: 13 }, s3: { ok: ["as_float"], err: [[/^as_int$/, "Las posiciones se guardaron como float: si lees int pierdes los decimales (el jugador se mueve un poco al cargar)."]], w: 9 } },
      pistas: ["Sin DestroyAll tendrías las entidades viejas y las cargadas a la vez."],
      bien: "<p>Y las dos llamadas van en PostUpdate, con F5 y F6. Prueba: guarda, coge una moneda, carga: vuelve a estar.</p>"
    }
  ]
});
