Curso.practica({
  leccion: "l04",
  titulo: "Construye el Player y la fábrica de entidades",
  intro: "Vas a declarar la clase Player heredando de Entity, completar la fábrica del EntityManager, crear el jugador desde Scene y moverlo con WASD.",
  pasos: [
    {
      t: "Player hereda de Entity",
      exp: `<p>Para que Player reciba todo lo de Entity (posición, active, las funciones virtuales…), se declara así: <code>class Hija : public Padre</code>. Completa la cabecera.</p>`,
      code: String.raw`
#pragma once
#include "Entity.h"

class Player : §s1§ §s2§
{`,
      slots: {
        s1: { ok: ["public"], err: [[/^private$/, "Con herencia private, desde fuera nadie podría usar Player como Entity. Usa public."], [/^extends$/, "Eso es Java/JS. En C++ es <code>: public Padre</code>."]] },
        s2: { ok: ["Entity"] }
      },
      pistas: ["Palabra clave de visibilidad + nombre de la clase padre."],
      bien: "<p>Ahora Player <em>es una</em> Entity: puedes guardarlo en una lista de <code>shared_ptr&lt;Entity&gt;</code> y el manager lo tratará igual que a las demás.</p>"
    },
    {
      t: "Sobrescribir las funciones virtuales",
      exp: `<p>Entity declara <code>virtual bool Update(float dt)</code>. Para dar a Player su propia versión se declara igual y se marca con una palabra clave que hace que el compilador compruebe que de verdad existe en el padre.</p>`,
      code: String.raw`public:
    Player();
    bool Start() §s1§;
    bool Update(float dt) §s1§;

private:
    SDL_Texture* texture = §s2§;
    float speed = 0.2f;`,
      slots: {
        s1: { ok: ["override"], err: [[/^virtual$/, "virtual va en la clase BASE. En la hija se usa override."]] },
        s2: { ok: ["nullptr"], err: [[/^NULL$|^0$/, "Funciona, pero en C++ moderno se usa <code>nullptr</code>."]] }
      },
      pistas: ["En inglés, “sobrescribir” es <em>override</em>.", "Un puntero que todavía no apunta a nada: <code>nullptr</code>."],
      bien: "<p>Si te equivocas en la firma (por ejemplo <code>Update(int dt)</code>), <code>override</code> da error de compilación. Sin él, crearías una función nueva que nunca se llama y no entenderías por qué tu jugador no se mueve.</p>"
    },
    {
      t: "El constructor llama al del padre",
      exp: `<p>El constructor de Entity necesita saber el tipo. Desde el constructor de Player se le pasa en la <em>lista de inicialización</em> (lo que va después de los dos puntos).</p>`,
      code: String.raw`Player::Player() : §s1§(EntityType::§s2§)
{
    name = "Player";
}`,
      slots: { s1: { ok: ["Entity"] }, s2: { ok: ["PLAYER"], err: [[/^Player$/, "Los valores del enum están en MAYÚSCULAS: PLAYER."]] } },
      pistas: ["Se llama al constructor de la clase padre.", "El valor del enum <code>EntityType</code> para el jugador."],
      bien: "<p>El orden siempre es: primero se construye la parte de Entity, luego la de Player.</p>"
    },
    {
      t: "La fábrica: CreateEntity",
      exp: `<p>Completa el <code>switch</code>: según el tipo recibido, crea un Player o un Item con <code>std::make_shared</code>. No olvides el <code>break</code> de cada caso.</p>`,
      escribe: {
        antes: String.raw`std::shared_ptr<Entity> EntityManager::CreateEntity(EntityType type)
{
    std::shared_ptr<Entity> entity = nullptr;
    switch (type)
    {`,
        despues: String.raw`    default:
        LOG("Error en CreateEntity: tipo desconocido");
        return nullptr;
    }
    pending.push_back(entity);
    return entity;
}`,
        filas: 6,
        checks: [
          [/caseEntityType::PLAYER:/, "Falta el caso <code>case EntityType::PLAYER:</code>"],
          [/caseEntityType::PLAYER:entity=(std::)?make_shared<Player>\(\);/, "En el caso PLAYER: <code>entity = std::make_shared&lt;Player&gt;();</code>"],
          [/caseEntityType::ITEM:entity=(std::)?make_shared<Item>\(\);/, "Falta el caso ITEM con <code>entity = std::make_shared&lt;Item&gt;();</code>"],
          [/make_shared<Player>\(\);break;/, "Después de crear el Player pon <code>break;</code> o se ejecutará también el siguiente caso."],
          [/make_shared<Item>\(\);break;/, "Después de crear el Item pon <code>break;</code> o caerá al default y devolverá nullptr."]
        ],
        prohibido: [[/newPlayer|newItem/, "Con smart pointers no se usa <code>new</code> directamente: usa <code>std::make_shared&lt;T&gt;()</code>."]],
        sol: String.raw`    case EntityType::PLAYER:
        entity = std::make_shared<Player>();
        break;
    case EntityType::ITEM:
        entity = std::make_shared<Item>();
        break;`
      },
      pistas: ["Cada caso tiene tres partes: <code>case …:</code>, la creación y <code>break;</code>", "<code>std::make_shared&lt;Player&gt;()</code> crea un Player y devuelve su shared_ptr."],
      bien: "<p>Esto es el patrón <strong>Factory</strong>: quien pide la entidad no necesita saber qué clase concreta se instancia. Para añadir un Enemy solo tocarás este switch.</p>"
    },
    {
      t: "Crear el jugador desde Scene",
      exp: `<p><code>CreateEntity</code> devuelve un <code>shared_ptr&lt;Entity&gt;</code>, pero Scene quiere un <code>shared_ptr&lt;Player&gt;</code> para poder usar lo específico del jugador. Hay que hacer un “cast” seguro hacia abajo.</p>`,
      code: String.raw`bool Scene::Awake()
{
    player = std::§s1§<Player>(
        Engine::GetInstance().entityManager->CreateEntity(EntityType::PLAYER));
    return true;
}`,
      slots: { s1: { ok: ["dynamic_pointer_cast"], err: [[/^dynamic_cast$/, "dynamic_cast es para punteros normales. Para shared_ptr existe la versión <code>dynamic_pointer_cast</code>."], [/^static_pointer_cast$/, "Compilaría, pero no comprueba nada. El handout usa la versión que comprueba en tiempo de ejecución."]], w: 22 } },
      pistas: ["Es un cast <em>dinámico</em> para <em>punteros</em> inteligentes."],
      bien: "<p>Si la entidad no fuese un Player, <code>dynamic_pointer_cast</code> devolvería nullptr en vez de darte un objeto corrupto.</p>"
    },
    {
      t: "Mover con WASD",
      exp: `<p>En <code>Player::Update</code>, mueve al jugador con W, A, S, D. Ya tienes <code>input</code> y <code>move</code>. Recuerda: arriba es restar Y. Usa <code>position.setX(position.getX() + move)</code> y similares.</p>`,
      escribe: {
        antes: String.raw`bool Player::Update(float dt)
{
    auto& input = Engine::GetInstance().input;
    float move = speed * dt;`,
        despues: String.raw`    Engine::GetInstance().render->DrawTexture(texture, (int)position.getX(), (int)position.getY());
    return true;
}`,
        filas: 6,
        checks: [
          [/SDL_SCANCODE_W\)==KEY_REPEAT\)position\.setY\(position\.getY\(\)-move\)/, "W debe SUBIR: <code>position.setY(position.getY() - move)</code> (Y negativa es arriba)."],
          [/SDL_SCANCODE_S\)==KEY_REPEAT\)position\.setY\(position\.getY\(\)\+move\)/, "S debe BAJAR: <code>position.setY(position.getY() + move)</code>."],
          [/SDL_SCANCODE_A\)==KEY_REPEAT\)position\.setX\(position\.getX\(\)-move\)/, "A debe ir a la izquierda: <code>position.setX(position.getX() - move)</code>."],
          [/SDL_SCANCODE_D\)==KEY_REPEAT\)position\.setX\(position\.getX\(\)\+move\)/, "D debe ir a la derecha: <code>position.setX(position.getX() + move)</code>."]
        ],
        sol: String.raw`    if (input->GetKey(SDL_SCANCODE_W) == KEY_REPEAT) position.setY(position.getY() - move);
    if (input->GetKey(SDL_SCANCODE_S) == KEY_REPEAT) position.setY(position.getY() + move);
    if (input->GetKey(SDL_SCANCODE_A) == KEY_REPEAT) position.setX(position.getX() - move);
    if (input->GetKey(SDL_SCANCODE_D) == KEY_REPEAT) position.setX(position.getX() + move);`
      },
      pistas: ["Una línea por tecla: <code>if (input-&gt;GetKey(SDL_SCANCODE_W) == KEY_REPEAT) …;</code>", "W y S cambian Y; A y D cambian X."],
      bien: "<p>Fíjate en que <code>position</code> no está declarada en Player: viene heredada de Entity. Esta posición la sustituirá la física en la L08.</p>"
    }
  ]
});
