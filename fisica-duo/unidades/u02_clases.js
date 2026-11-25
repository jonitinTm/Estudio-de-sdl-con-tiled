(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "clases", titulo: "Clases, herencia y virtual", icono: "{ }",
    desc: "Cómo se organizan Car, PlayerCar y AICar: herencia, funciones virtuales, constructores y destructores.",
    chuleta: [
      ["Herencia y virtual", "```class Car : public PhysicEntity\n{\npublic:\n    Car(ModulePhysics* physics, int x, int y);\n    void Update() override;            // reescribe la de PhysicEntity\n\nprotected:\n    virtual void Control(float& throttle, float& steer) = 0;   // pura: la escriben las hijas\n\n    float max_speed = 7.5f;\n};\n\nclass PlayerCar : public Car\n{\nprotected:\n    void Control(float& throttle, float& steer) override;   // teclado\n};```"],
      ["Lista de inicialización", "El constructor de la hija llama al de la base después de `:`\n```Car::Car(ModulePhysics* physics, int x, int y)\n    : PhysicEntity(physics->CreateRectangle(x, y, 10, 20))\n{\n}```"],
      ["Destructor virtual", "Si borras una hija a través de un puntero a la base, el destructor de la base debe ser `virtual`:\n```virtual ~PhysicEntity() = default;```"],
      ["public / protected / private", "`public`: todo el mundo. `protected`: la clase y sus hijas. `private`: solo la clase."]
    ],
    preguntas: [
      test("¿Qué significa `class Car : public PhysicEntity`?", ["Car contiene un PhysicEntity", "Car hereda de PhysicEntity: un Car *es un* PhysicEntity", "PhysicEntity hereda de Car", "Car es amiga de PhysicEntity"], 1,
        "Car recibe todo lo de PhysicEntity (por ejemplo, su `body`) y se puede guardar en un `std::vector<PhysicEntity*>`.", { nuevo: true }),
      test("¿Qué hace `virtual` en una función de la clase base?", ["La hace más rápida", "Permite que cada clase hija tenga su propia versión, y se llama la correcta aunque tengas un puntero a la base", "La hace privada", "La convierte en estática"], 1,
        "Eso es polimorfismo: `for (PhysicEntity* e : entities) e->Update();` llama al Update de cada tipo real."),
      test("¿Qué significa `= 0` al final de una función virtual?", ["Que devuelve 0", "Que es virtual pura: las hijas están obligadas a escribirla y la clase base no se puede crear", "Que está vacía", "Que es const"], 1,
        "Una clase con una función virtual pura es abstracta. Por eso no puedes hacer `new Car()` si `Control` es `= 0`.", { code: String.raw`virtual void Control(float& throttle, float& steer) = 0;` }),
      huecos("Declara que AICar reescribe el Control de Car.", String.raw`class AICar : ▢ Car
{
protected:
    void Control(float& throttle, float& steer) ▢;
};`, ["public", "override", "virtual", "private", "const", "= 0"], ["public", "override"],
        "`override` hace que el compilador compruebe que de verdad existe esa función virtual en la base. Si te equivocas en la firma, te avisa."),
      bug("Este PlayerCar nunca usa el teclado: se ejecuta el Control de Car (que no hace nada). ¿Qué línea falla?", [
        "class Car : public PhysicEntity {",
        "protected:",
        "    void Control(float& throttle, float& steer) {}",
        "};",
        "class PlayerCar : public Car {",
        "protected:",
        "    void Control(float& throttle, float& steer);",
        "};"], 2,
        "Sin `virtual` en la base, la llamada desde Car usa siempre la versión de Car. Debe ser `virtual void Control(...) = 0;` (o `virtual ... {}`), y la hija con `override`."),
      test("¿Qué hace la línea después de los dos puntos?", ["Crea una variable", "Llama al constructor de la clase base pasándole el cuerpo recién creado", "Llama a Update", "Es un comentario"], 1,
        "Es la *lista de inicialización*. Primero se construye la parte de la base y después se ejecuta el cuerpo del constructor.",
        { code: String.raw`Car::Car(ModulePhysics* physics, int x, int y)
    : PhysicEntity(physics->CreateRectangle(x, y, 10, 20))
{
}`, nuevo: true }),
      huecos("Completa el constructor de PlayerCar para que llame al de Car.", String.raw`PlayerCar::PlayerCar(ModulePhysics* physics, int x, int y)
    ▢ ▢(physics, x, y)
{
}`, [":", "Car", "PhysicEntity", "->", "::", "new"], [":", "Car"],
        "La hija llama al constructor de su base directa (Car), que a su vez llama al de PhysicEntity."),
      test("¿Por qué el destructor de PhysicEntity debe ser `virtual`?", ["Para poder heredar", "Para que `delete entity` (con un `PhysicEntity*` que apunta a un Car) ejecute también el destructor de Car", "Para que vaya más rápido", "Es obligatorio en C++"], 1,
        "Sin `virtual`, solo se ejecuta el destructor de la base: lo que la hija liberaba en su destructor se queda en memoria."),
      test("¿Desde dónde se puede usar un miembro `protected`?", ["Desde cualquier sitio", "Desde la propia clase y sus clases hijas", "Solo desde la propia clase", "Solo desde main"], 1,
        "Ideal para los ajustes del coche: Car y sus hijas los usan, el resto del juego no."),
      test("Tienes `std::vector<PhysicEntity*> entities;` con coches, checkpoints y turbos. ¿Qué hace este bucle?", ["Llama al Update de PhysicEntity para todos", "Llama al Update de la clase real de cada objeto", "No compila", "Solo actualiza el primero"], 1,
        "Polimorfismo: es la razón de que todo herede de una base con `virtual void Update()`.", { code: String.raw`for (PhysicEntity* e : entities)
    e->Update();` }),
      escribe("Declara en la clase base una función virtual pura `Update` que no recibe nada y no devuelve nada.", [/^virtualvoidUpdate\(\)=0$/],
        "`virtual void Update() = 0;`", { sol: "virtual void Update() = 0", ph: "virtual ..." }),
      test("¿Qué hace `dynamic_cast<Car*>(entity)` si `entity` apunta a un Checkpoint?", ["Lo convierte igualmente", "Devuelve nullptr", "Crashea siempre", "Devuelve el Checkpoint"], 1,
        "dynamic_cast comprueba el tipo real en ejecución. Útil en OnCollision: `Car* car = dynamic_cast<Car*>(...)` y luego `if (car != nullptr)`. (La clase debe tener alguna función virtual)."),
      orden("Construye la clase base abstracta de todo lo que tiene cuerpo físico.", [
        "class PhysicEntity",
        "{",
        "public:",
        "    virtual ~PhysicEntity() = default;",
        "    virtual void Update() = 0;",
        "    PhysBody* body = nullptr;",
        "};"], "Destructor virtual, Update virtual pura y el cuerpo. Es la PhysicEntity del handout."),
      test("¿Qué diferencia hay entre `struct` y `class` en C++?", ["struct no puede tener funciones", "Solo la visibilidad por defecto: struct es public, class es private", "struct no puede heredar", "Ninguna"], 1,
        "Se suele usar `struct` para datos simples (como `GridSlot { int x, y; float angle; }`) y `class` para objetos con comportamiento."),
      bug("¿Qué línea no compila?", [
        "class Car : public PhysicEntity {",
        "protected:",
        "    virtual void Control(float& t, float& s) = 0;",
        "};",
        "",
        "Car* car = new Car(App->physics, 100, 100);"], 5,
        "Car es abstracta (tiene una virtual pura): no se puede crear con `new Car`. Hay que crear una hija concreta: `new PlayerCar(...)`."),
      test("¿Cuándo se ejecuta el constructor de una clase?", ["Al llamar a Start()", "Al crear el objeto (con new o en la pila)", "En el primer Update", "Al compilar"], 1,
        "Por eso el handout crea el cuerpo de Box2D en la lista de inicialización: en cuanto existe el coche, existe su cuerpo."),
      huecos("Un getter que no modifica el coche.", String.raw`▢ GetSpeed() ▢
{
    return speed;
}`, ["float", "const", "void", "virtual", "static", "int&"], ["float", "const"],
        "Getter: devuelve el valor y se marca `const` porque no cambia el objeto."),
      test("¿Por qué separar Car (física) de PlayerCar y AICar (control)?", ["Porque C++ lo obliga", "Para escribir la física de conducción una sola vez; las hijas solo deciden acelerador y volante", "Para que compile más rápido", "No hay motivo"], 1,
        "Es lo que valora el profesor como “código claro y bien estructurado, con el foco en la física”.")
    ]
  });
})();
