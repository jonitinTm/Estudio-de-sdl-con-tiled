(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "cpp", titulo: "C++ que vas a usar", icono: "C++",
    desc: "Punteros, referencias, new/delete, const y std::vector: lo que aparece en cada línea del motor.",
    chuleta: [
      ["Punteros y referencias", "Un puntero guarda una dirección: `PhysBody* p`. Se usa con `->`: `p->body`. Puede ser `nullptr`.\nUna referencia es otro nombre para una variable ya existente: `int& x`. Se usa con `.` y nunca es nula.\n```int vida = 3;\nint* p = &vida;   // & delante de una variable: su dirección\n*p = 2;           // * delante de un puntero: lo apuntado\nint& r = vida;    // referencia\nr = 1;            // vida vale 1```"],
      ["new / delete", "Lo que creas con `new` lo borras con `delete`. Un array creado con `new T[n]` se borra con `delete[]`.\n```Car* car = new Car();\n...\ndelete car;\ncar = nullptr;```"],
      ["Parámetros por referencia", "Para que una función devuelva varios valores, se pasan por referencia:\n```void GetPosition(int& x, int& y) const\n{\n    x = 10; y = 20;   // cambia las variables de quien llama\n}```"],
      ["std::vector", "```std::vector<Car*> cars;\ncars.push_back(car);          // añadir al final\ncars.size();                  // cuántos\nfor (Car* c : cars) c->Update();\ncars.erase(cars.begin() + i); // quitar el i\ncars.clear();                 // vaciar (no hace delete)```"]
    ],
    preguntas: [
      test("¿Qué guarda la variable `p`?", ["El valor 3", "La dirección de memoria de `vida`", "Una copia de `vida`", "Nada, es un error"], 1,
        "`&vida` es la dirección de `vida`. Un puntero guarda direcciones.", { code: String.raw`int vida = 3;
int* p = &vida;`, nuevo: true }),
      test("Después de este código, ¿cuánto vale `vida`?", ["3", "1", "Es un error de compilación", "Una dirección"], 1,
        "`*p` accede a lo apuntado: escribir en `*p` es escribir en `vida`.", { code: String.raw`int vida = 3;
int* p = &vida;
*p = 1;` }),
      test("`body` es un `b2Body*`. ¿Cómo llamas a su función `GetMass()`?", ["`body.GetMass()`", "`body->GetMass()`", "`*body->GetMass()`", "`body::GetMass()`"], 1,
        "Con un puntero se usa la flecha `->`. Con un objeto o una referencia, el punto `.`."),
      test("`pbody` es un `PhysBody*` y dentro tiene `b2Body* body`. ¿Cómo obtienes la velocidad?", ["`pbody.body.GetLinearVelocity()`", "`pbody->body->GetLinearVelocity()`", "`pbody->body.GetLinearVelocity()`", "`pbody.body->GetLinearVelocity()`"], 1,
        "Los dos son punteros: flecha en los dos saltos. Lo verás constantemente en el handout: `ball->body->body->ApplyForceToCenter(...)`."),
      huecos("Completa: crea un coche con `new` y bórralo al final.", String.raw`Car* car = ▢ Car();
car->Update();
▢ car;
car = ▢;`, ["new", "delete", "nullptr", "free", "malloc", "0.0f"], ["new", "delete", "nullptr"],
        "Cada `new` tiene su `delete`. Poner el puntero a `nullptr` después evita usar memoria ya liberada.", { nuevo: true }),
      test("¿Qué es una referencia (`int& r = vida;`)?", ["Una copia", "Otro nombre para la misma variable", "Un puntero que puede ser nulo", "Una constante"], 1,
        "Cambiar `r` cambia `vida`. A diferencia de un puntero, no puede ser nula ni cambiar a qué apunta."),
      test("¿Qué valores tienen `a` y `b` al acabar?", ["a = 0, b = 0", "a = 10, b = 20", "Error de compilación", "a y b sin inicializar"], 1,
        "Los parámetros son referencias (`int&`): la función escribe en las variables de quien llama. Así funciona `PhysBody::GetPosition(int& x, int& y)`.",
        { code: String.raw`void Get(int& x, int& y) { x = 10; y = 20; }

int a = 0, b = 0;
Get(a, b);` }),
      bug("Esta función debería devolver la posición, pero quien la llama siempre recibe 0, 0. ¿Qué línea falla?", [
        "void GetPosition(int x, int y) const",
        "{",
        "    b2Vec2 pos = body->GetPosition();",
        "    x = METERS_TO_PIXELS(pos.x);",
        "    y = METERS_TO_PIXELS(pos.y);",
        "}"], 0,
        "Sin `&`, `x` e `y` son copias: la función cambia sus copias y quien llama no se entera. Debe ser `int& x, int& y`."),
      test("¿Qué significa el `const` del final?", ["Que devuelve una constante", "Que la función no modifica el objeto", "Que es estática", "Que no se puede llamar"], 1,
        "Las funciones que solo leen (`Get…`, `Read…`) se marcan `const`. Así el compilador te avisa si cambias algo sin querer.", { code: String.raw`float GetSpeed() const;` }),
      test("¿Qué hace `std::vector::push_back`?", ["Añade al principio", "Añade al final", "Borra el último", "Ordena"], 1, "`cars.push_back(car)` mete el coche al final de la lista."),
      huecos("Recorre todos los coches y actualízalos.", String.raw`for (Car* ▢ : ▢)
    car->▢();`, ["car", "cars", "Update", "size", "push_back", "Car"], ["car", "cars", "Update"],
        "Bucle *range-for*: “para cada `car` de `cars`”. Es la forma más cómoda de recorrer un vector."),
      escribe("Escribe la línea que añade el puntero `coin` al final del vector `items`.", ["items.push_back(coin)"],
        "`push_back` añade al final.", { ph: "items..." }),
      test("¿Qué hace `cars.clear()` con los `Car*` que había dentro?", ["Los borra con delete", "Solo vacía el vector: los objetos siguen en memoria (fuga si no los borraste)", "Los pone a nullptr", "Llama a su destructor"], 1,
        "Un vector de punteros solo guarda direcciones. Hay que hacer `delete` de cada uno antes del `clear()`.", { nuevo: true }),
      orden("Ordena el código para borrar todos los coches sin fugas de memoria.", [
        "for (Car* car : cars)",
        "{",
        "    App->physics->DestroyBody(car->body);",
        "    delete car;",
        "}",
        "cars.clear();"], "Primero el cuerpo de Box2D, después el objeto, y al final se vacía la lista. Si haces `clear()` antes, pierdes los punteros y ya no puedes borrarlos."),
      test("¿Cuánto vale `r`?", ["2.5", "2", "3", "0"], 1,
        "Dos enteros dan una división entera: se pierden los decimales. Para 2.5 escribe `5.0f / 2` o `(float)a / b`.", { code: String.raw`int a = 5, b = 2;
float r = a / b;`, nuevo: true }),
      escribe("Escribe la división de `frames` entre `seconds` (los dos `int`) para que el resultado tenga decimales.", [/^\(float\)frames\/seconds$/, /^\(float\)frames\/\(float\)seconds$/, /^frames\/\(float\)seconds$/, /^static_cast<float>\(frames\)\/seconds$/, /^\(double\)frames\/seconds$/],
        "Basta con convertir uno de los dos a `float` (o `double`) antes de dividir: `(float)frames / seconds`.", { sol: "(float)frames / seconds", ph: "(float)..." }),
      test("¿Para qué sirve `#pragma once` al principio de un `.h`?", ["Para compilar más rápido", "Para que el archivo no se incluya dos veces en el mismo .cpp", "Para que sea público", "Para Windows"], 1, "Sin él, incluir el mismo .h por dos caminos da errores de “redefinición”."),
      test("¿Para qué sirve escribir `class PhysBody;` en un `.h` en lugar de `#include \"ModulePhysics.h\"`?", ["Para crear la clase", "Forward declaration: basta para declarar punteros `PhysBody*` y evita includes circulares", "Para hacerla abstracta", "Para nada"], 1,
        "Si solo usas punteros o referencias a una clase, no necesitas su definición completa en el `.h`. El `#include` va en el `.cpp`.", { nuevo: true }),
      test("¿Qué tiene de especial una variable `static` dentro de una clase?", ["Es constante", "Hay una sola copia compartida por todos los objetos de la clase", "No se puede leer", "Es privada"], 1,
        "Ejemplo: `static constexpr float push_force = 100.0f;` en la clase Ball del handout: todas las bolas usan el mismo valor."),
      bug("¿Qué línea provoca una fuga de memoria?", [
        "void ModuleGame::CleanUp()",
        "{",
        "    cars.clear();",
        "    for (Car* car : cars)",
        "        delete car;",
        "}"], 2, "Al hacer `clear()` primero, el bucle ya no recorre nada: los coches nunca se borran. El `clear()` va después del bucle."),
      test("¿Qué es `0.5f`?", ["Un `double`", "Un `float`", "Un `int`", "Un error"], 1, "La `f` final indica `float`. Sin ella, `0.5` es `double`. El estilo del handout pide siempre `x.xf`."),
      huecos("Un array dinámico de vértices: créalo y libéralo.", String.raw`b2Vec2* vertices = new b2Vec2[▢];
...
▢ vertices;`, ["count", "delete[]", "delete", "free", "size()"], ["count", "delete[]"],
        "Un array creado con `new T[n]` se libera con `delete[]` (con corchetes). Es lo que hace `CreateChain` del handout.")
    ]
  });
})();
