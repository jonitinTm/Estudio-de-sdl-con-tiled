(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "stl", titulo: "STL: vector, map, iteradores y lambdas", icono: "{}",
    desc: "Recorrer y borrar sin romper nada, std::map, auto, referencias en el for, find_if, sort, remove_if y punteros inteligentes.",
    chuleta: [
      ["Borrar mientras recorres", "```for (auto it = coins.begin(); it != coins.end(); )\n{\n    if ((*it)->picked) { delete *it; it = coins.erase(it); }   // erase devuelve el siguiente\n    else ++it;\n}```"],
      ["Erase–remove con lambda", "```bullets.erase(std::remove_if(bullets.begin(), bullets.end(),\n    [](const Bullet& b) { return b.dead; }), bullets.end());```"],
      ["std::map", "```std::map<std::string, Texture2D> textures;\ntextures[\"car\"] = LoadTexture(\"car.png\");\nauto it = textures.find(\"car\");\nif (it != textures.end()) DrawTexture(it->second, 0, 0, WHITE);```"],
      ["Lambdas", "`[captura](parámetros) { cuerpo }`. `[]` nada, `[this]` el objeto, `[&]` todo por referencia, `[=]` todo por copia."]
    ],
    preguntas: [
      test("¿Qué pasa con este bucle?", ["Funciona", "Comportamiento indefinido: tras erase, `it` queda inválido y luego se hace ++it", "No compila", "Borra todo"], 1, "erase invalida el iterador borrado. Usa `it = v.erase(it);` y solo haz ++it cuando no borras.", { code: String.raw`for (auto it = v.begin(); it != v.end(); ++it)
    if (*it == 0) v.erase(it);`, nuevo: true }),
      huecos("Borra las monedas recogidas sin romper el iterador.", String.raw`for (auto it = coins.begin(); it != coins.end(); )
{
    if ((*it)->picked) { delete *it; it = coins.▢(it); }
    else ▢it;
}`, ["erase", "++", "remove", "--", "insert"], ["erase", "++"], "erase devuelve un iterador al siguiente elemento."),
      test("¿Qué hace `for (auto car : cars)` si `cars` es `std::vector<Car>` (objetos, no punteros)?", ["Recorre referencias", "Copia cada coche: los cambios no se guardan en el vector", "No compila", "Recorre al revés"], 1, "Usa `for (auto& car : cars)` para modificar, o `const auto&` para leer sin copiar."),
      escribe("Escribe la cabecera de un for por rango que recorra `cars` por referencia constante (nombre de variable `car`).", [/^for\(constauto&car:cars\)\{?$/, /^for\(autoconst&car:cars\)\{?$/, /^for\(constCar&car:cars\)\{?$/], "`for (const auto& car : cars)`: sin copias y sin poder modificar.", { ph: "for (..." }),
      test("Con `std::vector<Car*> cars;`, ¿qué hace `cars.clear()`?", ["Libera los coches", "Vacía el vector pero NO hace delete de los coches (fuga)", "Destruye los cuerpos de Box2D", "Nada"], 1, "El vector solo guarda punteros. Haz delete de cada uno antes."),
      huecos("Busca el primer coche que haya terminado.", String.raw`auto it = std::▢(cars.begin(), cars.end(),
    [](Car* c) { return c->finished; });
if (it ▢ cars.end()) winner = *it;`, ["find_if", "!=", "sort", "==", "count"], ["find_if", "!="], "find_if devuelve end() si no encuentra nada."),
      orden("Erase–remove: quita las balas muertas.", [
        "bullets.erase(",
        "    std::remove_if(bullets.begin(), bullets.end(),",
        "        [](const Bullet& b) { return b.dead; }),",
        "    bullets.end());"], "remove_if mueve las buenas al principio y devuelve dónde empieza la basura; erase la corta."),
      test("¿Qué captura `[this]` en una lambda dentro de un método?", ["Nada", "El puntero al objeto: la lambda puede usar sus miembros y métodos", "Una copia del objeto", "Las variables locales"], 1, ""),
      test("¿Y `[&]`?", ["Todas las variables locales usadas, por referencia", "Solo this", "Todo por copia", "Nada"], 0, "Cuidado: si la lambda se guarda y se usa después, esas referencias pueden quedar colgando."),
      escribe("Escribe la lambda (sin `;`) que compara dos `Car*` a y b por `best_lap` de menor a mayor.", [/^\[\]\(Car\*a,Car\*b\)\{returna->best_lap<b->best_lap;?\}$/, /^\[\]\(constCar\*a,constCar\*b\)\{returna->best_lap<b->best_lap;?\}$/], "`[](Car* a, Car* b) { return a->best_lap < b->best_lap; }`", { ph: "[](Car* a, Car* b) { ... }" }),
      test("¿Qué devuelve `textures[\"nitro\"]` en un std::map si la clave no existe?", ["Lanza un error", "Crea un elemento nuevo con valor por defecto y lo devuelve", "nullptr", "end()"], 1, "Para solo consultar sin crear, usa `find` o `count`."),
      huecos("Consulta segura en un map.", String.raw`auto it = sounds.▢("crash");
if (it != sounds.end())
    PlaySound(it->▢);`, ["find", "second", "first", "at", "value"], ["find", "second"], "first es la clave, second el valor."),
      test("¿Qué diferencia hay entre `push_back(Car(1,2))` y `emplace_back(1, 2)`?", ["Ninguna", "emplace_back construye el objeto directamente dentro del vector (sin copia temporal)", "push_back es más rápido", "emplace_back no existe"], 1, ""),
      bug("Crash al disparar mucho. ¿Qué línea es peligrosa?", [
        "Bullet* first = &bullets[0];",
        "bullets.push_back(Bullet());",
        "first->x += 1.0f;"], 2, "push_back puede realocar el vector: los punteros/referencias anteriores a sus elementos quedan colgando. Guarda índices o usa `std::vector<Bullet*>`."),
      test("¿Qué ventaja tiene `std::unique_ptr<Car>` frente a `Car*`?", ["Es más rápido", "Hace delete automáticamente cuando el puntero se destruye: no hay fugas", "Permite copias", "Ninguna"], 1, "`auto car = std::make_unique<Car>();` Ojo: no se puede copiar, solo mover."),
      escribe("Escribe cómo creas un `std::unique_ptr<Car>` llamado `car` con make_unique (sin argumentos).", ["auto car = std::make_unique<Car>()", "std::unique_ptr<Car> car = std::make_unique<Car>()"], "", { ph: "auto car = ..." }),
      test("`std::vector<int> v(5);` ¿Qué contiene?", ["Un 5", "Cinco ceros", "Nada", "Basura"], 1, "Con paréntesis: tamaño. Con llaves `v{5}`: un solo elemento con valor 5."),
      test("¿Por qué `for (int i = 0; i < v.size() - 1; ++i)` revienta con un vector vacío?", ["No revienta", "size() es unsigned: 0 - 1 da un número enorme", "Porque i empieza en 0", "Por el ++i"], 1, "Usa `i + 1 < v.size()` o castea a int.")
    ]
  });
})();
