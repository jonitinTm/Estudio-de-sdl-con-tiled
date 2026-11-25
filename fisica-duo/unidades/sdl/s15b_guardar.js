(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-guardar", titulo: "Guardar y cargar (handout L15)", icono: "💾",
    desc: "Entidades colocadas en una capa de objetos de Tiled, Scene::CreateEntity(clase, x, y), SaveState con F5, LoadState con F6, DestroyAll y por qué un muerto no se escribe.",
    chuleta: [
      ["El plan", "1. Tiled: Object Layer **Entities** con puntos (Name + Class).\n2. Map lee los objectgroup → `GetObjectGroup(\"Entities\")`.\n3. Scene: `CreateEntitiesFromMap()` → `CreateEntity(clase, x, y)`.\n4. **F5** → `SaveState()` escribe savegame.xml.\n5. **F6** → `LoadState()`: `DestroyAll()` + recrear desde el XML.\nLas dos en **PostUpdate**."],
      ["SaveState", "```pugi::xml_document doc;\npugi::xml_node list = doc.append_child(\"game_state\").append_child(\"entities\");\nfor (const auto& e : entityManager->entities) {\n    if (!e->active || e->pendingToDelete) continue;    // muerto: no se escribe\n    pugi::xml_node n = list.append_child(\"entity\");\n    n.append_attribute(\"class\") = ClassName(e->type);\n    n.append_attribute(\"x\") = e->position.getX();\n    n.append_attribute(\"y\") = e->position.getY();\n}\ndoc.save_file(\"savegame.xml\");```"]
    ],
    preguntas: [
      test("¿Qué se guarda según el handout?", ["Solo el nivel", "La clase y la posición de cada entidad viva (jugador, enemigos, items)", "Todo el mapa", "Las texturas"], 1, "", { nuevo: true }),
      test("¿Cómo sabe savegame.xml que un enemigo murió?", ["alive=\"false\"", "No aparece: al cargar no se crea", "Vida a 0", "Un id negativo"], 1, "La ausencia es el dato."),
      test("En Tiled, ¿qué tipo de objeto usas para colocar cada entidad?", ["Rectángulo", "Point (punto) con Name y Class", "Polígono", "Tile"], 1, ""),
      test("El punto de Tiled marca…", ["la esquina superior izquierda", "el centro de la entidad", "los pies", "la esquina del tile"], 1, "Por eso el handout quitó el “+ media textura” de los Awake."),
      huecos("Leer la clase del objeto (sirve con las dos versiones de Tiled).", String.raw`obj.className = o.attribute("▢").as_string(o.attribute("▢").as_string());`, ["type", "class", "name", "id"], ["type", "class"], "El parámetro de as_string es el valor por defecto."),
      orden("CreateEntitiesFromMap.", [
        "auto group = Engine::GetInstance().map->GetObjectGroup(\"Entities\");",
        "if (!group) return;",
        "for (const MapObject& o : group->objects)",
        "    CreateEntity(o.className, o.x, o.y);"], ""),
      huecos("La fábrica genérica de la escena.", String.raw`std::shared_ptr<Entity> Scene::CreateEntity(const std::string& className, float x, float y)
{
    std::shared_ptr<Entity> e = nullptr;
    if (className == "Enemy") e = entityManager->CreateEntity(EntityType::▢);
    ...
    e->position = ▢(x, y);
    return e;
}`, ["ENEMY", "Vector2D", "PLAYER", "b2Vec2", "SDL_FRect"], ["ENEMY", "Vector2D"], ""),
      bug("Los enemigos de Tiled no aparecen, pero el jugador sí.", [
        "if (className == \"Player\") e = em.CreateEntity(EntityType::PLAYER);",
        "else if (className == \"enemy\") e = em.CreateEntity(EntityType::ENEMY);",
        "else if (className == \"Item\") e = em.CreateEntity(EntityType::ITEM);"], 1, "En Tiled pusiste `Enemy`: los strings distinguen mayúsculas. Haz LOG de las clases desconocidas para verlo al momento."),
      escribe("Escribe la línea que crea un nodo hijo `entity` en el nodo `list` y lo guarda en `pugi::xml_node n`.", ["pugi::xml_node n = list.append_child(\"entity\")"], "", { ph: "pugi::xml_node n = ..." }),
      escribe("Escribe la línea que guarda la x de la entidad `e` como atributo del nodo `n`.", ["n.append_attribute(\"x\") = e->position.getX()"], "", { ph: "n.append_attribute(..." }),
      test("¿Qué entidades NO se escriben en SaveState?", ["El jugador", "Las inactivas o con pendingToDelete (muertas/recogidas)", "Los items", "Ninguna"], 1, ""),
      orden("LoadState.", [
        "pugi::xml_document doc;",
        "if (!doc.load_file(\"savegame.xml\")) return;",
        "Engine::GetInstance().entityManager->DestroyAll();",
        "for (pugi::xml_node n = doc.child(\"game_state\").child(\"entities\").child(\"entity\"); n; n = n.next_sibling(\"entity\"))",
        "    CreateEntity(n.attribute(\"class\").as_string(), n.attribute(\"x\").as_float(), n.attribute(\"y\").as_float());"], "Comprobar el archivo, limpiar, reconstruir."),
      bug("Al cargar aparecen el doble de enemigos.", [
        "pugi::xml_document doc;",
        "if (!doc.load_file(\"savegame.xml\")) return;",
        "for (pugi::xml_node n = doc.child(\"game_state\").child(\"entities\").child(\"entity\"); n; n = n.next_sibling(\"entity\"))",
        "    CreateEntity(n.attribute(\"class\").as_string(), n.attribute(\"x\").as_float(), n.attribute(\"y\").as_float());"], 2, "Falta `entityManager->DestroyAll();` antes del bucle: conviven las viejas y las cargadas."),
      test("¿Por qué Save/Load se llaman desde PostUpdate?", ["Por velocidad", "En Update otros recorren la lista de entidades: destruirla ahí invalida iteradores", "pugixml lo exige", "Para dibujar"], 1, ""),
      test("Las entidades cargadas con F6 aparecen sin textura ni cuerpo. ¿Causa típica?", ["El XML", "Se crearon después del Start del EntityManager y nadie llamó a su Awake/Start", "La cámara", "Box2D"], 1, ""),
      bug("Tras cargar, el jugador está desplazado unos píxeles respecto a donde guardó.", [
        "n.append_attribute(\"x\") = e->position.getX();",
        "CreateEntity(n.attribute(\"class\").as_string(), n.attribute(\"x\").as_int(), n.attribute(\"y\").as_int());"], 1, "Se guardó como float y se lee con as_int: pierdes los decimales. Usa as_float."),
      test("¿Por qué savegame.xml va en .gitignore?", ["Pesa mucho", "Es el estado de cada jugador, no parte del proyecto", "Git no admite XML", "Por la licencia"], 1, ""),
      test("¿Cómo usarías esto para checkpoints?", ["No se puede", "Un sensor en el mapa que, al tocarlo, pide un guardado (flag) que se hace en PostUpdate", "Guardando cada frame", "Con un hilo"], 1, ""),
      test("Para identificar cada enemigo de forma estable entre partidas, ¿qué usarías?", ["Su posición", "El id del objeto en Tiled", "Su índice en la lista", "Su textura"], 1, "El índice cambia en cuanto uno muere.")
    ]
  });
})();
