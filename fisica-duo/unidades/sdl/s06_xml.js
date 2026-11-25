(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-xml", titulo: "pugixml: config.xml, guardar y cargar", icono: "</>",
    desc: "Leer config.xml, pasar a cada módulo su nodo, valores por defecto, recorrer hijos, guardar y cargar partida.",
    chuleta: [
      ["Leer", "```pugi::xml_document doc;\npugi::xml_parse_result result = doc.load_file(\"config.xml\");\nif (!result) { LOG(\"Error: %s\", result.description()); return false; }\npugi::xml_node win = doc.child(\"config\").child(\"window\");\nint w = win.child(\"resolution\").attribute(\"width\").as_int(1280);   // 1280 = por defecto```"],
      ["Recorrer", "```for (pugi::xml_node n = node.child(\"enemy\"); n; n = n.next_sibling(\"enemy\"))\n    CreateEnemy(n.attribute(\"x\").as_int(), n.attribute(\"y\").as_int());```"],
      ["Guardar", "```pugi::xml_node p = doc.child(\"game_state\").child(\"player\");\np.attribute(\"x\").set_value(position.getX());\ndoc.save_file(\"savegame.xml\");```"]
    ],
    preguntas: [
      test("¿Qué ventaja tiene leer los valores de config.xml en vez de escribirlos en el código?", ["Ninguna", "Cambias velocidad, resolución o rutas sin recompilar", "Va más rápido", "Ocupa menos"], 1, "", { nuevo: true }),
      huecos("Carga el XML y comprueba errores.", String.raw`pugi::xml_document doc;
pugi::xml_parse_result result = doc.▢("config.xml");
if (▢result) LOG("%s", result.description());`, ["load_file", "!", "open", "&", "save_file"], ["load_file", "!"], ""),
      escribe("Escribe la lectura del atributo `jump` (float) del nodo `movement` hijo de `parameters`.", ["parameters.child(\"movement\").attribute(\"jump\").as_float()"], "", { ph: "parameters.child(..." }),
      test("¿Qué devuelve `attribute(\"widht\").as_int()` si te equivocas al escribir el nombre?", ["Lanza un error", "0 (sin avisar)", "-1", "Crash"], 1, "pugixml no peta: devuelve nodos/atributos vacíos. Por eso conviene hacer LOG de lo que lees o poner un valor por defecto."),
      test("¿Qué significa el 1280 en `as_int(1280)`?", ["El máximo", "El valor por defecto si el atributo no existe", "El mínimo", "El tamaño del archivo"], 1, ""),
      test("¿Cómo recibe cada módulo su parte del config?", ["Lee el archivo entero él mismo", "El Engine le pasa `configFile.child(\"config\").child(module->name)` antes de Awake", "Con variables globales", "No lo recibe"], 1, "Por eso el name del módulo debe coincidir con el nodo del XML."),
      orden("Recorre todos los items del XML.", [
        "for (pugi::xml_node itemNode = parameters.child(\"item\");",
        "     itemNode;",
        "     itemNode = itemNode.next_sibling(\"item\"))",
        "{",
        "    Item* item = (Item*)entityManager->CreateEntity(EntityType::ITEM);",
        "    item->parameters = itemNode;",
        "}"], "Un nodo vacío se evalúa como false: así termina el bucle."),
      bug("Solo aparece el primer enemigo.", [
        "pugi::xml_node e = node.child(\"enemy\");",
        "CreateEnemy(e.attribute(\"x\").as_int(), e.attribute(\"y\").as_int());",
        "e = e.next_sibling(\"enemy\");"], 1, "Falta el bucle: `for (pugi::xml_node e = node.child(\"enemy\"); e; e = e.next_sibling(\"enemy\"))`."),
      test("¿Qué diferencia hay entre `child` y `attribute`?", ["Ninguna", "child busca un nodo hijo (<movement>); attribute un valor dentro de la etiqueta (speed=\"4\")", "attribute es para números", "child es para guardar"], 1, ""),
      escribe("Escribe cómo lees un atributo `texture` como texto del nodo `parameters`.", ["parameters.attribute(\"texture\").as_string()"], "as_string() devuelve const char*.", { ph: "parameters.attribute(..." }),
      huecos("Guarda la posición del jugador.", String.raw`pugi::xml_node player = doc.child("game_state").child("player");
player.attribute("x").▢(position.getX());
player.attribute("y").set_value(position.getY());
doc.▢("savegame.xml");`, ["set_value", "save_file", "as_int", "load_file", "write"], ["set_value", "save_file"], ""),
      test("Al cargar partida, el jugador aparece donde debía pero cae a través del suelo/queda congelado. ¿Qué te falta?", ["Nada", "Mover también el cuerpo físico (SetTransform) y despertarlo (b2Body_SetAwake), no solo `position`", "Guardar más", "Recompilar"], 1, ""),
      test("¿Qué guardarías como mínimo en una partida?", ["Toda la memoria", "Posición, vidas, monedas, nivel y qué items/enemigos ya no existen (por su id del mapa)", "Solo el nivel", "Las texturas"], 1, ""),
      escribe("Escribe cómo añades un nodo hijo `player` a `root`.", ["root.append_child(\"player\")"], "Y luego `.append_attribute(\"x\")` para crear atributos.", { ph: "root.append_child(..." }),
      test("¿Por qué se cargan/guardan las partidas al FINAL del frame (en el Engine) y no en mitad del Update?", ["Por estética", "Para no cambiar el estado del mundo mientras otros módulos lo están recorriendo", "Es más rápido", "No importa"], 1, "Se pide con un flag (saveRequested) y se ejecuta cuando todos han terminado.")
    ]
  });
})();
