(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "cpppro", titulo: "C++ que te hace parecer senior", icono: "C++",
    desc: "const, static, constexpr, paso por referencia, casts, operadores de b2Vec2, comparar floats, struct vs class y errores de enlazado.",
    chuleta: [
      ["Parámetros", "`void F(Car c)` copia. `void F(Car& c)` puede modificarlo. `void F(const Car& c)` no copia y no lo toca. Punteros: `Car*` puede ser nullptr."],
      ["const", "```float GetSpeed() const;          // no modifica el objeto\nconst char* name;                 // no puedes cambiar los chars\nchar* const p;                    // no puedes cambiar el puntero\nconstexpr float PPM = 50.0f;      // constante en compilación```"],
      ["static", "```class Car { static int count; };   // una para TODOS los coches\nint Car::count = 0;                 // definición en el .cpp\nstatic int hits = 0;                // dentro de una función: conserva el valor entre llamadas```"]
    ],
    preguntas: [
      test("¿Cuál es la mejor firma para una función que solo lee un vector grande?", ["void F(std::vector<int> v)", "void F(const std::vector<int>& v)", "void F(std::vector<int>* v)", "void F(std::vector<int>& v)"], 1, "Sin copia y sin poder modificarlo por error.", { nuevo: true }),
      test("¿Qué indica el `const` final en `float GetForwardSpeed() const;`?", ["Que devuelve un const", "Que el método no modifica el objeto (se puede llamar sobre un const Car&)", "Que es estático", "Nada"], 1, ""),
      bug("No compila: «no se puede llamar a un método no const».", [
        "float Car::GetSpeed() { return speed; }",
        "void Draw(const Car& car) { DrawText(TextFormat(\"%.1f\", car.GetSpeed()), 0, 0, 20, WHITE); }"], 0, "GetSpeed no modifica nada: debe ser `float GetSpeed() const`."),
      test("¿Qué es un miembro `static` de una clase?", ["Uno por objeto", "Uno compartido por todos los objetos de esa clase", "Uno que no cambia", "Uno privado"], 1, "Ejemplo: `static int cars_created;`"),
      huecos("Contador de coches creados.", String.raw`// Car.h
class Car {
public:
    Car() { ▢++; }
    static int count;
};
// Car.cpp
int ▢ = 0;`, ["count", "Car::count", "this->count", "static count"], ["count", "Car::count"], "Sin la definición en el .cpp da error de enlazado (unresolved external)."),
      test("Error «LNK2001: unresolved external symbol». ¿Causa típica?", ["Error de sintaxis", "Declaraste algo (función o static) pero nunca lo definiste, o el .cpp no está en el proyecto", "Falta un ;", "Box2D roto"], 1, ""),
      test("¿Qué ventaja tiene `constexpr float PIXELS_PER_METER = 50.0f;` sobre `#define`?", ["Ninguna", "Tiene tipo, respeta los ámbitos y el depurador lo ve", "Es más lento", "Se puede cambiar en ejecución"], 1, ""),
      bug("El macro da un resultado raro: `METERS_TO_PIXELS(2 + 3)` da 152 en vez de 250. ¿Qué línea?", [
        "#define PPM 50",
        "#define METERS_TO_PIXELS(m) m * PPM",
        "int px = METERS_TO_PIXELS(2 + 3);"], 1, "Se expande a `2 + 3 * 50`. Los macros necesitan paréntesis: `((m) * PPM)`. O mejor, una función inline."),
      escribe("Escribe el cast moderno de `float speed` a int (`static_cast`).", ["static_cast<int>(speed)"], "Más fácil de buscar y más seguro que `(int)speed`.", { ph: "static_cast<...>(...)" }),
      test("¿Cuándo usas `dynamic_cast<AICar*>(car)`?", ["Siempre", "Para comprobar en ejecución si un Car* es en realidad un AICar (devuelve nullptr si no)", "Para convertir float a int", "Nunca"], 1, "Requiere al menos un método virtual en la base."),
      test("¿Por qué `if (speed == 0.3f)` casi nunca es true?", ["Por un bug del compilador", "Los floats tienen error de redondeo: compara con un margen `fabsf(speed - 0.3f) < 0.001f`", "0.3f no existe", "Siempre es true"], 1, ""),
      escribe("Escribe la condición: `a` y `b` (floats) son casi iguales con margen 0.001f.", [/^fabsf\(a-b\)<0\.001f$/, /^fabsf\(b-a\)<0\.001f$/, /^abs\(a-b\)<0\.001f$/, /^std::abs\(a-b\)<0\.001f$/], "", { ph: "fabsf(...) < ..." }),
      test("¿Qué operadores de b2Vec2 existen en Box2D 2.4?", ["Ninguno", "+, -, float * vec, +=, -=, *= (pero no vec * vec)", "Solo +", "Todos, incluido vec * vec"], 1, "Para producto escalar usa b2Dot; para el vectorial b2Cross."),
      bug("No compila.", [
        "b2Vec2 dir = GetForward();",
        "b2Vec2 f = dir * force;",
        "body->ApplyForceToCenter(f, true);"], 1, "En Box2D 2.4 existe `float * b2Vec2`, no `b2Vec2 * float`: escribe `force * dir`."),
      test("struct vs class en C++:", ["Son mundos distintos", "Lo mismo, pero en struct todo es public por defecto y en class private", "struct no tiene métodos", "class no puede heredar"], 1, ""),
      test("¿Qué es `nullptr` frente a `NULL`?", ["Lo mismo", "Un puntero nulo con tipo propio: evita ambigüedades con el entero 0", "Un objeto vacío", "Un error"], 1, ""),
      test("`unsigned int lives = 0; lives--;` ¿Cuánto vale?", ["-1", "4294967295 (da la vuelta)", "0", "Error"], 1, "Los unsigned no tienen negativos: cuidado con restar."),
      huecos("Inicialización uniforme con llaves.", String.raw`struct GridPos { int x, y; float angle; };
GridPos grid[2] = ▢ { 100, 200, 0.0f }, { 140, 200, 0.0f } ▢;`, ["{", "}", "(", ")"], ["{", "}"], ""),
      test("¿Qué hace `auto` en `auto it = textures.find(\"car\");`?", ["Es un tipo dinámico", "El compilador deduce el tipo (aquí, un iterador del map)", "Hace la variable global", "Nada"], 1, "Sigue siendo tipado estático: el tipo se fija al compilar.")
    ]
  });
})();
