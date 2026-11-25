(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-entidades", titulo: "Entidades y EntityManager", icono: "👾",
    desc: "La clase Entity, EntityType, CreateEntity con switch, la lista de entidades, borrar de forma segura con pendingToDelete y Vector2D.",
    chuleta: [
      ["Entity", "```enum class EntityType { PLAYER, ITEM, ENEMY, UNKNOWN };\nclass Entity {\npublic:\n    Entity(EntityType type) : type(type), active(true) {}\n    virtual ~Entity() {}\n    virtual bool Start() { return true; }\n    virtual bool Update(float dt) { return true; }\n    virtual bool CleanUp() { return true; }\n    virtual void OnCollision(PhysBody* a, PhysBody* b) {}\n    EntityType type; bool active; bool pendingToDelete = false;\n    Vector2D position; pugi::xml_node parameters;\n};```"],
      ["CreateEntity", "```Entity* EntityManager::CreateEntity(EntityType type)\n{\n    Entity* e = nullptr;\n    switch (type) {\n    case EntityType::PLAYER: e = new Player(); break;\n    case EntityType::ITEM:   e = new Item();   break;\n    default: break;\n    }\n    if (e) entities.push_back(e);\n    return e;\n}```"]
    ],
    preguntas: [
      test("¿Por qué Player e Item heredan de Entity?", ["Por obligación", "El EntityManager puede guardarlos en una sola lista de Entity* y llamar a Update de todos", "Para ahorrar memoria", "No heredan"], 1, "", { nuevo: true }),
      huecos("CreateEntity.", String.raw`switch (type)
{
case EntityType::PLAYER: entity = ▢ Player(); ▢;
case EntityType::ITEM:   entity = new Item();   break;
default: break;
}`, ["new", "break", "delete", "return", "continue"], ["new", "break"], ""),
      test("¿Qué pasa si olvidas el `break` del case PLAYER?", ["Nada", "Sigue al case ITEM: crea un Player, lo pierde (fuga) y devuelve un Item", "No compila", "Crash"], 1, "Fall-through."),
      orden("EntityManager::Update.", [
        "for (Entity* entity : entities)",
        "{",
        "    if (!entity->active) continue;",
        "    entity->Update(dt);",
        "}"], ""),
      test("Un item recogido debe desaparecer. ¿Por qué no hacer delete en su OnCollision?", ["Sí se puede", "Estás dentro del recorrido de la física/lista: borrarlo ahí deja punteros colgando. Se marca pendingToDelete y se borra al final del frame", "Box2D lo borra", "Por el sonido"], 1, ""),
      huecos("Borrado seguro al final del frame.", String.raw`for (auto it = entities.begin(); it != entities.end(); )
{
    if ((*it)->pendingToDelete)
    {
        (*it)->CleanUp();
        ▢ *it;
        it = entities.▢(it);
    }
    else ++it;
}`, ["delete", "erase", "remove", "free", "pop"], ["delete", "erase"], ""),
      test("¿Qué hace el CleanUp del Item antes del delete?", ["Nada", "Pide a la física que destruya su cuerpo y libera su textura si es suya", "Guarda la partida", "Lo dibuja"], 1, ""),
      escribe("Escribe el cast para usar como Player la entidad devuelta (`Entity* e`), al estilo C++ con comprobación.", ["dynamic_cast<Player*>(e)"], "Devuelve nullptr si no es un Player. (Muchos handouts usan `(Player*)` directamente porque saben el tipo).", { ph: "dynamic_cast<...>(e)" }),
      test("¿Para qué sirve `EntityType type` si ya hay herencia?", ["Para nada", "Para saber rápidamente qué es una entidad (en colisiones, guardar partida, debug) sin casts", "Para el renderer", "Para el XML"], 1, ""),
      test("Vector2D: ¿por qué guardar la posición como float?", ["Por costumbre", "Los movimientos pequeños por frame (0.3 px) se acumulan; con int se perderían", "Ocupa menos", "Por SDL"], 1, ""),
      bug("Fuga de memoria al cerrar.", [
        "bool EntityManager::CleanUp()",
        "{",
        "    for (Entity* e : entities) e->CleanUp();",
        "    entities.clear();",
        "    return true;",
        "}"], 3, "Falta `delete e;` antes del clear (o dentro del for)."),
      test("¿Cuándo se llama al Start de una entidad creada al cargar el nivel?", ["Nunca", "En EntityManager::Start (o justo al crearla si el nivel se carga en mitad del juego)", "En el destructor", "En Draw"], 1, "Si creas entidades después del Start del manager, alguien tiene que llamar a su Start."),
      test("El jugador debe estar por encima de los items al dibujar. ¿Qué haces?", ["Nada", "Dibujar los items primero y el jugador después (o ordenar la lista por capa)", "Cambiar el z del sprite", "Usar dos renderers"], 1, ""),
      escribe("Declara en Entity el método virtual de colisión que no hace nada por defecto (recibe `PhysBody* physA, PhysBody* physB`).", [/^virtualvoidOnCollision\(PhysBody\*physA,PhysBody\*physB\)\{\}$/], "Las entidades que lo necesitan lo sobrescriben.", { ph: "virtual void OnCollision(...) {}" }),
      test("¿Qué es un enemigo que hereda de Entity y además quiere ser recogible?", ["Imposible", "Un caso donde la herencia se queda corta: se resuelve con tipos/flags o componentes (ECS)", "Un Item", "Un Player"], 1, "")
    ]
  });
})();
