(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-entidades", titulo: "Entidades, EntityManager y shared_ptr", icono: "👾",
    desc: "La clase Entity, EntityType, la fábrica CreateEntity con std::make_shared, la lista de std::shared_ptr<Entity>, borrar con pendingToDelete, DestroyAll y GetEntity.",
    chuleta: [
      ["Entity", "```enum class EntityType { PLAYER, ITEM, ENEMY, UNKNOWN };\nclass Entity {\npublic:\n    Entity(EntityType type) : type(type), active(true) {}\n    virtual ~Entity() {}\n    virtual bool Awake() { return true; }\n    virtual bool Start() { return true; }\n    virtual bool Update(float dt) { return true; }\n    virtual bool CleanUp() { return true; }\n    virtual void OnCollision(PhysBody* a, PhysBody* b) {}\n    EntityType type; bool active; bool pendingToDelete = false;\n    Vector2D position; pugi::xml_node parameters;\n};```"],
      ["CreateEntity (como en el handout)", "```std::shared_ptr<Entity> EntityManager::CreateEntity(EntityType type)\n{\n    std::shared_ptr<Entity> entity = nullptr;\n    switch (type) {\n    case EntityType::PLAYER: entity = std::make_shared<Player>(); break;\n    case EntityType::ITEM:   entity = std::make_shared<Item>();   break;\n    case EntityType::ENEMY:  entity = std::make_shared<Enemy>();  break;\n    default: break;\n    }\n    if (entity) entities.push_back(entity);\n    return entity;\n}\n// Del Entity genérico al Player:\nplayer = std::dynamic_pointer_cast<Player>(entity);```"],
      ["shared_ptr en 3 frases", "Cuenta cuántos punteros apuntan al objeto. Cuando el último desaparece, el objeto se borra solo (no hay `delete`). Quitarlo de la lista basta… si nadie más guarda una copia."]
    ],
    preguntas: [
      test("¿Por qué Player, Item y Enemy heredan de Entity?", ["Por obligación", "El EntityManager los guarda en una sola lista de std::shared_ptr<Entity> y llama a Update de todos", "Para ahorrar memoria", "No heredan"], 1, "", { nuevo: true }),
      huecos("CreateEntity con punteros inteligentes.", String.raw`switch (type)
{
case EntityType::PLAYER: entity = std::▢<Player>(); ▢;
case EntityType::ITEM:   entity = std::make_shared<Item>(); break;
default: break;
}`, ["make_shared", "break", "make_unique", "return", "new"], ["make_shared", "break"], "make_shared crea el objeto y el contador de referencias de una vez."),
      test("¿Qué pasa si olvidas el `break` del case PLAYER?", ["Nada", "Sigue al case ITEM: entity acaba siendo un Item (el Player creado se destruye solo al perder su último shared_ptr)", "No compila", "Crash"], 1, "Fall-through: con shared_ptr no hay fuga, pero el tipo es el equivocado."),
      orden("EntityManager::Update.", [
        "for (const auto& entity : entities)",
        "{",
        "    if (!entity->active) continue;",
        "    entity->Update(dt);",
        "}"], "`const auto&` evita copiar cada shared_ptr (copiar uno sube y baja su contador)."),
      test("Un item recogido debe desaparecer. ¿Por qué no quitarlo de la lista dentro de su OnCollision?", ["Sí se puede", "Estás dentro de un recorrido (física/lista): modificar la lista ahí invalida iteradores. Se marca pendingToDelete y se borra al final del frame", "Box2D lo borra", "Por el sonido"], 1, ""),
      huecos("Borrado seguro al final del frame.", String.raw`for (auto it = entities.begin(); it != entities.end(); )
{
    if ((*it)->pendingToDelete)
    {
        (*it)->▢();
        it = entities.▢(it);
    }
    else ++it;
}`, ["CleanUp", "erase", "delete", "remove", "reset"], ["CleanUp", "erase"], "Con shared_ptr no hay delete: al quitarlo de la lista, si nadie más lo guarda, se destruye solo."),
      test("¿Qué hace el CleanUp del Item/Enemy antes de quitarlo de la lista?", ["Nada", "Pide a la física que destruya su cuerpo (DeletePhysBody) y libera su textura si es suya", "Guarda la partida", "Lo dibuja"], 1, "El handout de L15 añade justo esto al CleanUp del enemigo."),
      escribe("Escribe el cast de `std::shared_ptr<Entity> e` a puntero inteligente de Player (con comprobación de tipo).", ["std::dynamic_pointer_cast<Player>(e)"], "Devuelve nullptr si no es un Player. (dynamic_cast es para punteros normales).", { ph: "std::dynamic_pointer_cast<...>(e)" }),
      test("¿Para qué sirve `EntityType type` si ya hay herencia?", ["Para nada", "Para saber rápidamente qué es una entidad (colisiones, guardar partida, GetEntity(type)) sin casts", "Para el renderer", "Para el XML"], 1, ""),
      test("Vector2D: ¿por qué guardar la posición como float?", ["Por costumbre", "Los movimientos pequeños por frame (0,3 px) se acumulan; con int se perderían", "Ocupa menos", "Por SDL"], 1, ""),
      bug("El enemigo muerto sigue «vivo» en memoria y su cuerpo sigue chocando.", [
        "entities.remove(enemy);",
        "// la escena guardaba: std::shared_ptr<Enemy> boss = enemy;",
        "// y nadie llamó a enemy->CleanUp()"], 2, "Sin CleanUp el cuerpo físico no se destruye, y mientras la escena guarde otra copia del shared_ptr el objeto no se libera. Llama a CleanUp y suelta las copias (`boss = nullptr;`)."),
      test("¿Cuándo se llama al Start de una entidad creada a mitad de partida (por ejemplo al cargar con F6)?", ["Nunca", "Alguien tiene que llamar a su Awake/Start: el EntityManager ya hizo los suyos al principio", "En el destructor", "En Draw"], 1, "Si una entidad cargada no tiene textura o cuerpo, es esto."),
      test("¿Qué hace `EntityManager::DestroyAll()` (handout L15)?", ["Borra el mapa", "Llama a CleanUp de todas las entidades y vacía la lista", "Cierra el juego", "Guarda la partida"], 1, "LoadState lo usa antes de reconstruir el mundo desde savegame.xml."),
      escribe("Declara en Entity el método virtual de colisión que no hace nada por defecto (recibe `PhysBody* physA, PhysBody* physB`).", [/^virtualvoidOnCollision\(PhysBody\*physA,PhysBody\*physB\)\{\}$/], "Las entidades que lo necesitan lo sobrescriben.", { sol: "virtual void OnCollision(PhysBody* physA, PhysBody* physB) {}", ph: "virtual void OnCollision(...) {}" }),
      test("Un enemigo que además se pueda recoger: ¿qué problema muestra?", ["Ninguno", "La herencia se queda corta con combinaciones: se resuelve con tipos/flags o componentes (ECS)", "Que hay que usar unique_ptr", "Que falta virtual"], 1, ""),
      test("¿Por qué el motor usa std::shared_ptr y no std::unique_ptr para las entidades?", ["Es más rápido", "Varias partes guardan la misma entidad (la lista, la escena que guarda al player, el listener de la física)", "unique_ptr no existe", "Por la herencia"], 1, "unique_ptr = un único dueño; shared_ptr = varios."),
      escribe("Escribe la creación de un Item con make_shared en una variable `auto item`.", ["auto item = std::make_shared<Item>()"], "", { ph: "auto item = ..." }),
      test("¿Qué devuelve `GetEntity(EntityType::PLAYER)` (handout L15) si no hay jugador?", ["Crash", "nullptr: compruébalo antes de usarlo", "Un Player vacío", "El primero de la lista"], 1, "")
    ]
  });
})();
