(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "debug", titulo: "Depurar como un profesional", icono: "🔍",
    desc: "Breakpoints, watch, pila de llamadas, LOG útiles, asserts, debug draw de Box2D, leer errores de compilación y de enlazado.",
    chuleta: [
      ["Herramientas", "**F9** breakpoint · **F5** continuar · **F10** paso por encima · **F11** entrar en la función · **Shift+F11** salir · ventana **Inspección (watch)** · **Pila de llamadas**: quién llamó a quién antes del crash."],
      ["Assert", "```#include <cassert>\nassert(body != nullptr && \"CreateBody devolvió null\");   // en Debug para el programa si es falso```"],
      ["Errores", "**C2065** identificador no declarado (falta include o typo). **C2039** no es miembro de la clase. **LNK2019/2001** declarado pero sin definir (falta .cpp o el static). **Access violation reading 0x00000000** → puntero nulo."]
    ],
    preguntas: [
      test("El juego crashea con «Access violation reading location 0x00000000». ¿Qué significa?", ["Sin memoria", "Usaste un puntero nulo (por ejemplo un body que nunca se creó)", "División por cero", "Error de Box2D"], 1, "", { nuevo: true }),
      test("¿Qué ventana de Visual Studio te dice qué funciones se estaban ejecutando cuando crasheó?", ["Salida", "Pila de llamadas (Call Stack)", "Explorador de soluciones", "Lista de errores"], 1, ""),
      test("¿Qué tecla entra DENTRO de la función de la línea actual al depurar?", ["F10", "F11", "F5", "F9"], 1, "F10 la ejecuta entera sin entrar."),
      test("Error C2065: 'b2Vec2': identificador no declarado. ¿Causa más probable?", ["Box2D roto", "Falta `#include \"box2d/box2d.h\"` en ese archivo", "Error de enlazado", "Falta un ;"], 1, ""),
      test("Error LNK2019 al llamar a `Car::GetRight()`. ¿Causa más probable?", ["Typo en la llamada", "La declaraste en el .h pero no la implementaste en el .cpp (o el .cpp no está en el proyecto)", "Falta include", "Box2D"], 1, ""),
      escribe("Escribe un assert que compruebe que `car` no es nulo.", ["assert(car != nullptr)", "assert(car)", "assert(car != NULL)"], "", { ph: "assert(...)" }),
      test("Un breakpoint condicional sirve para…", ["parar siempre", "parar solo cuando una condición es cierta (p. ej. lap == 3)", "acelerar el juego", "nada"], 1, "Clic derecho en el punto rojo → Condiciones."),
      bug("El LOG no ayuda a encontrar por qué la vuelta no cuenta.", [
        "LOG(\"collision\");",
        "if (index != car->next_checkpoint) return;"], 0, "Un LOG útil dice QUÉ pasa: `LOG(\"cp %d, esperado %d\", index, car->next_checkpoint);`."),
      huecos("Un LOG útil.", String.raw`LOG("Coche %s en checkpoint %▢ (esperaba %d), t=%▢", name.c_str(), index, next_checkpoint, timer.ReadSec());`, ["d", ".2f", "s", "f2"], ["d", ".2f"], ""),
      test("¿Qué haces primero cuando algo de física «hace cosas raras»?", ["Cambiar valores al azar", "Activar el debug draw (F1/F9) para ver los colliders reales", "Reinstalar", "Subir los fps"], 1, ""),
      test("El juego funciona en Debug y no en Release. Sospechoso nº 1:", ["El compilador", "Variables sin inicializar", "Las texturas", "El audio"], 1, ""),
      orden("Método para cazar un bug.", ["Reprodúcelo de forma fiable", "Encuentra dónde empieza (LOG/breakpoints)", "Entiende la causa", "Arréglalo", "Comprueba que no rompiste otra cosa"], "Nunca arregles algo que no sabes reproducir."),
      test("¿Qué es la «depuración del patito de goma»?", ["Un plugin", "Explicar el código en voz alta línea a línea: al hacerlo sueles ver el error", "Un tipo de breakpoint", "Un test automático"], 1, ""),
      test("Quieres ver el valor de `body->GetLinearVelocity()` mientras el juego va. ¿Lo más rápido?", ["Breakpoint", "Dibujarlo en pantalla con DrawText/TextFormat en el modo debug", "Recompilar en Release", "Un assert"], 1, "Los breakpoints paran el tiempo; para valores que cambian, mejor verlos en vivo.")
    ]
  });
})();
