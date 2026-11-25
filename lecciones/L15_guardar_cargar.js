(function () {
  const { code, nota, todo, quiz } = Curso;

  Curso.leccion({
    id: "guardarcargar", num: "15", grupo: "Bloque 7 · Guardar y cargar", corto: "Load / Save desde el mapa", pdf: "L15_Load_Save",
    titulo: "Guardar y cargar: entidades desde Tiled y savegame.xml",
    resumen: "Colocar entidades con una capa de objetos “Entities”, crearlas con Scene::CreateEntity, guardar su estado con F5 y reconstruir el mundo con F6.",
    intro: "Casi todos los juegos guardan el progreso. En esta lección dejas de crear las entidades a mano en el código: las colocas en Tiled, el mapa las lee y la escena las crea. Con eso, guardar y cargar es casi gratis: guardar es escribir la clase y la posición de cada entidad viva; cargar es borrarlas todas y volver a crearlas desde el archivo.",
    objetivos: ["Crear una capa de objetos “Entities” con puntos que tengan nombre y clase", "Leer las capas de objetos en Map y pedirlas con GetObjectGroup", "Centralizar la creación en Scene::CreateEntity(clase, x, y)", "Escribir savegame.xml con pugixml (SaveState) y reconstruir desde él (LoadState)", "Entender por qué un enemigo muerto simplemente no se guarda"],
    html: () => `
<h2>Qué queremos guardar</h2>
<ul>
<li>Posición del jugador.</li>
<li>Posición y estado de los enemigos (si siguen vivos).</li>
<li>Posición de los items que quedan.</li>
</ul>
<p>Y poder recuperarlo todo. La especificación del handout: <kbd>F5</kbd> escribe <code>savegame.xml</code> con la clase y la posición de cada entidad; <kbd>F6</kbd> destruye las entidades del mundo y lo reconstruye desde ese archivo. Ambos se llaman desde <strong>PostUpdate</strong>. Se puede reutilizar para checkpoints.</p>
${nota(`<p><strong>Un enemigo muerto no se escribe.</strong> No hace falta un campo <code>alive="false"</code>: si no está en el archivo, al cargar no se crea. La ausencia es lo que registra que murió. Lo mismo con las monedas recogidas.</p>`, "", "La idea clave")}

<h2>Qué trae nuevo el handout</h2>
<ul>
<li>Parámetros de los items en <code>config.xml</code>.</li>
<li>El CleanUp del enemigo destruye su PhysBody.</li>
<li>Player, Item y Enemy ya <strong>no suman media textura</strong> a la posición inicial en Awake: la posición es el <strong>centro</strong>, igual que el punto de Tiled.</li>
<li><code>EntityManager::DestroyAll()</code> y <code>GetEntity(type)</code>.</li>
<li>Map carga las capas de objetos y tiene <code>GetObjectGroup(name)</code>.</li>
<li><code>savegame.xml</code> está en el <code>.gitignore</code> (es un archivo de cada jugador, no del proyecto).</li>
</ul>

${todo("TODO 1", "Tiled", `<p>Crea una <strong>Object Layer</strong> llamada <code>Entities</code>. Añade un objeto <strong>Point</strong> para el jugador, uno para cada enemigo y uno para cada item. Pon a cada uno su <strong>Name</strong> y su <strong>Class</strong> (<code>Player</code>, <code>Enemy</code>, <code>Item</code>).</p>`,
      code(String.raw`<objectgroup id="5" name="Entities">
  <object id="12" name="Player" type="Player" x="192" y="1600"><point/></object>
  <object id="13" name="Slime1" type="Enemy"  x="820" y="1630"><point/></object>
  <object id="14" name="Coin1"  type="Item"   x="640" y="1500"><point/></object>
</objectgroup>`, "xml", "Level1.tmx"))}
${nota(`<p>El punto marca el <strong>centro</strong> de la entidad, no su esquina superior izquierda. Según la versión de Tiled, la clase se guarda como <code>type="…"</code> o como <code>class="…"</code>: lee las dos (abajo verás cómo).</p>`, "warn")}

<h2>Leer las capas de objetos (ya en el handout)</h2>
${code(String.raw`struct MapObject { int id; std::string name, className; float x, y, width, height; bool isPoint; };
struct ObjectGroup { std::string name; std::vector<MapObject> objects; };

for (pugi::xml_node og = mapFile.child("map").child("objectgroup"); og; og = og.next_sibling("objectgroup"))
{
    auto group = std::make_shared<ObjectGroup>();
    group->name = og.attribute("name").as_string();
    for (pugi::xml_node o = og.child("object"); o; o = o.next_sibling("object"))
    {
        MapObject obj;
        obj.id = o.attribute("id").as_int();
        obj.name = o.attribute("name").as_string();
        obj.className = o.attribute("type").as_string(o.attribute("class").as_string());   // las dos versiones
        obj.x = o.attribute("x").as_float();
        obj.y = o.attribute("y").as_float();
        obj.width = o.attribute("width").as_float(0.0f);
        obj.height = o.attribute("height").as_float(0.0f);
        obj.isPoint = (bool)o.child("point");
        group->objects.push_back(obj);
    }
    mapData.objectGroups.push_back(group);
}

std::shared_ptr<ObjectGroup> Map::GetObjectGroup(const std::string& name) const
{
    for (const auto& g : mapData.objectGroups) if (g->name == name) return g;
    return nullptr;
}`, "cpp", "Map")}

${todo("TODO 2", "Scene.cpp → CreateEntity y CreateEntitiesFromMap", `<p>Quita de Awake/Start el código que creaba entidades a mano y muévelo a una función genérica. Después, crea las entidades recorriendo la capa <code>Entities</code>.</p>`,
      code(String.raw`std::shared_ptr<Entity> Scene::CreateEntity(const std::string& className, float x, float y)
{
    EntityManager& em = *Engine::GetInstance().entityManager;
    std::shared_ptr<Entity> e = nullptr;

    if (className == "Player")     e = em.CreateEntity(EntityType::PLAYER);
    else if (className == "Enemy") e = em.CreateEntity(EntityType::ENEMY);
    else if (className == "Item")  e = em.CreateEntity(EntityType::ITEM);
    else { LOG("CreateEntity: clase desconocida '%s'", className.c_str()); return nullptr; }

    e->position = Vector2D(x, y);                                     // el CENTRO
    if (className == "Player") player = std::dynamic_pointer_cast<Player>(e);
    return e;
}

void Scene::CreateEntitiesFromMap()
{
    auto group = Engine::GetInstance().map->GetObjectGroup("Entities");
    if (!group) { LOG("El mapa no tiene capa Entities"); return; }
    for (const MapObject& o : group->objects)
        CreateEntity(o.className, o.x, o.y);
}`, "cpp", "Scene"))}
${nota(`<p>Cuidado con el orden: las entidades tienen que existir antes de que el EntityManager llame a su <code>Start</code>. Si las creas más tarde (como al cargar con F6), alguien tiene que llamar a su Awake/Start a mano (o que CreateEntity del manager lo haga si el juego ya ha arrancado). Si una entidad cargada aparece sin textura o sin cuerpo, es esto.</p>`, "warn")}

${todo("TODO 3", "Scene.cpp → SaveState()", `<p>Crea un <code>pugi::xml_document</code>, añade un nodo por entidad viva con su clase y posición, y guárdalo en disco. Llámalo desde <code>PostUpdate</code> al pulsar <kbd>F5</kbd>.</p>`,
      code(String.raw`static const char* ClassName(EntityType t)
{
    switch (t)
    {
    case EntityType::PLAYER: return "Player";
    case EntityType::ENEMY:  return "Enemy";
    case EntityType::ITEM:   return "Item";
    default:                 return "Unknown";
    }
}

void Scene::SaveState()
{
    pugi::xml_document doc;
    pugi::xml_node root = doc.append_child("game_state");
    pugi::xml_node list = root.append_child("entities");

    for (const auto& e : Engine::GetInstance().entityManager->entities)
    {
        if (!e->active || e->pendingToDelete) continue;    // muerto o recogido: no se escribe
        pugi::xml_node n = list.append_child("entity");
        n.append_attribute("class") = ClassName(e->type);
        n.append_attribute("x") = e->position.getX();
        n.append_attribute("y") = e->position.getY();
    }
    if (doc.save_file("savegame.xml")) LOG("Partida guardada");
}`, "cpp", "Scene"))}

${todo("TODO 4", "Scene.cpp → LoadState()", `<p>Carga el archivo, destruye todas las entidades con <code>DestroyAll()</code> y vuelve a crearlas con <code>CreateEntity</code>. Llámalo desde <code>PostUpdate</code> al pulsar <kbd>F6</kbd>.</p>`,
      code(String.raw`void Scene::LoadState()
{
    pugi::xml_document doc;
    pugi::xml_parse_result result = doc.load_file("savegame.xml");
    if (!result) { LOG("No hay savegame.xml (%s): pulsa F5 primero", result.description()); return; }

    Engine::GetInstance().entityManager->DestroyAll();      // también destruye sus cuerpos
    player = nullptr;

    for (pugi::xml_node n = doc.child("game_state").child("entities").child("entity"); n; n = n.next_sibling("entity"))
        CreateEntity(n.attribute("class").as_string(), n.attribute("x").as_float(), n.attribute("y").as_float());
}

bool Scene::PostUpdate()
{
    Input& input = *Engine::GetInstance().input;
    if (input.GetKey(SDL_SCANCODE_F5) == KEY_DOWN) SaveState();
    if (input.GetKey(SDL_SCANCODE_F6) == KEY_DOWN) LoadState();
    ...
}`, "cpp", "Scene"))}
${nota(`<p>¿Por qué en <strong>PostUpdate</strong>? Porque en Update otros módulos y entidades están recorriendo la lista de entidades: si la vacías en mitad de ese recorrido, los iteradores quedan inválidos y crashea. En PostUpdate todos han terminado su frame.</p>`, "warn", "El sitio importa")}
${nota(`<p>Si guardas la posición del jugador pero el cuerpo de Box2D se crea en otro sitio, el jugador “salta” al cargar. Asegúrate de que el cuerpo se crea en <code>position</code> (en Start) o haz <code>b2Body_SetTransform</code> + <code>b2Body_SetAwake</code> al cargar.</p>`)}

<h2>Prueba</h2>
<ol>
<li>Pulsa <kbd>F5</kbd> al empezar. Abre <code>savegame.xml</code> y mira qué hay.</li>
<li>Coge una moneda y mata un enemigo. Pulsa <kbd>F6</kbd>: vuelven (estabas cargando la partida de antes).</li>
<li>Ahora pulsa <kbd>F5</kbd>, muévete y pulsa <kbd>F6</kbd>: la moneda y el enemigo siguen sin estar.</li>
<li>Añade más enemigos e items en Tiled y prueba en distintos estados de la partida.</li>
</ol>
${code(`<?xml version="1.0"?>
<game_state>
  <entities>
    <entity class="Player" x="512.5" y="1588"/>
    <entity class="Enemy" x="820" y="1630"/>
    <entity class="Item" x="900" y="1500"/>
  </entities>
</game_state>`, "xml", "savegame.xml")}

<h2>Ampliaciones típicas de la entrega</h2>
<ul>
<li>Guardar también vidas, monedas, tiempo y nivel actual.</li>
<li>Guardar el <strong>estado</strong> de cada enemigo (PATROL/CHASE) y su <code>homeTile</code>.</li>
<li>Checkpoints: un sensor en el mapa que llama a SaveState al tocarlo (marcando el flag; se guarda en PostUpdate).</li>
<li>Identificar las entidades por el <code>id</code> del objeto de Tiled (estable aunque cambie el orden).</li>
</ul>

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Cómo registra savegame.xml que un enemigo ha muerto?", o: ["Con alive=\"false\"", "No se escribe: al cargar, no se crea", "Con un contador"], c: 1, e: "La ausencia es el dato." },
      { p: "¿Qué marca el punto de un objeto Point de Tiled en este handout?", o: ["La esquina superior izquierda", "El centro de la entidad", "Los pies"], c: 1, e: "Por eso ya no se suma media textura en Awake." },
      { p: "¿Por qué SaveState/LoadState se llaman desde PostUpdate?", o: ["Es más rápido", "Para no destruir entidades mientras otros las recorren en Update", "Lo exige pugixml"], c: 1, e: "" },
      { p: "¿Qué hace LoadState antes de crear las entidades del archivo?", o: ["Nada", "DestroyAll() de las entidades actuales", "Recargar el mapa"], c: 1, e: "Si no, tendrías las viejas y las nuevas a la vez." },
      { p: "¿Por qué savegame.xml va en .gitignore?", o: ["Pesa mucho", "Es estado de cada jugador, no parte del proyecto", "pugixml no lo deja subir"], c: 1, e: "" },
      { p: "¿Qué atributo de pugixml usas para escribir la clase?", o: ["n.append_attribute(\"class\") = \"Enemy\";", "n.child(\"class\") = \"Enemy\";", "n.set(\"class\", \"Enemy\");"], c: 0, e: "" }
    ])}
`
  });
})();
