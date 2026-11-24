(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "enums", titulo: "Enums y máquinas de estados", icono: "FSM",
    desc: "enum, enum class, switch y cómo organizar la carrera (cuenta atrás, carrera, final) y los estados del coche.",
    chuleta: [
      ["enum y enum class", "```enum RaceState { RACE_COUNTDOWN, RACE_RUNNING, RACE_FINISHED };   // valores 0, 1, 2\n\nenum class ColliderType { CAR, WALL, CHECKPOINT, BOOST };      // se usan con ColliderType::CAR```\n`enum class` no se convierte solo a int y sus nombres no chocan con otros: es la opción recomendada."],
      ["Máquina de estados", "Una variable dice en qué estado estás, y un `switch` decide qué hacer en cada uno. Las transiciones son asignaciones a esa variable.\n```switch (state)\n{\ncase RACE_COUNTDOWN:\n    if (countdown.ReadSec() >= 3.0) { state = RACE_RUNNING; race_timer.Start(); }\n    break;\ncase RACE_RUNNING:\n    for (Car* c : cars) c->Update();\n    if (player->finished) state = RACE_FINISHED;\n    break;\ncase RACE_FINISHED:\n    if (IsKeyPressed(KEY_ENTER)) StartRace();\n    break;\n}```"],
      ["Entrar en un estado", "Haz una función que cambie el estado y prepare lo necesario (reiniciar un timer, poner una animación). Así no se te olvida en ningún sitio:\n```void ChangeState(RaceState next)\n{\n    state = next;\n    state_timer.Start();\n    if (next == RACE_RUNNING) PlayFx(go_fx);\n}```"],
      ["Flags de bits", "```enum Category : uint16 { CAT_WALL = 1 << 0, CAT_CAR = 1 << 1, CAT_SENSOR = 1 << 2 };\nuint16 mask = CAT_WALL | CAT_CAR;   // varios a la vez\nif (mask & CAT_CAR) { ... }         // ¿contiene CAR?```"]
    ],
    preguntas: [
      test("¿Qué valor tiene `RACE_RUNNING`?", ["0", "1", "2", "Ninguno"], 1, "Un enum numera desde 0 si no dices otra cosa.", { code: String.raw`enum RaceState { RACE_COUNTDOWN, RACE_RUNNING, RACE_FINISHED };`, nuevo: true }),
      test("¿Qué ventaja tiene `enum class` sobre `enum`?", ["Ocupa menos", "Sus valores no se mezclan con otros nombres ni se convierten solos a int: menos errores", "Es más rápido", "Permite decimales"], 1,
        "Con `enum class ColliderType { CAR, WALL }` escribes `ColliderType::CAR`. Un `WALL` de otro enum no chocará con este."),
      huecos("Declara los tipos de collider del juego.", String.raw`▢ ▢ ColliderType
{
    CAR, WALL, CHECKPOINT, BOOST, OIL
};`, ["enum", "class", "struct", "int", "const", "virtual"], ["enum", "class"],
        "`enum class` + nombre + lista de valores."),
      escribe("Escribe la comparación que comprueba si el `ctype` del cuerpo `other` es un muro (`WALL` del enum class `ColliderType`).", ["other->ctype == ColliderType::WALL", "other->ctype==ColliderType::WALL", "ColliderType::WALL == other->ctype"],
        "Con `enum class` siempre se escribe el nombre del enum delante: `ColliderType::WALL`.", { ph: "other->ctype ..." }),
      test("¿Qué es una máquina de estados?", ["Una clase de Box2D", "Una variable que dice en qué situación está algo, y reglas para pasar de una situación a otra", "Un tipo de bucle", "Un joint"], 1,
        "Ejemplos del proyecto: la carrera (cuenta atrás → corriendo → terminada) o el coche (normal → turbo → trompo).", { nuevo: true }),
      orden("Ordena la máquina de estados de la carrera.", [
        "switch (state)",
        "{",
        "case RACE_COUNTDOWN:",
        "    if (countdown.ReadSec() >= 3.0) state = RACE_RUNNING;",
        "    break;",
        "case RACE_RUNNING:",
        "    if (player->finished) state = RACE_FINISHED;",
        "    break;",
        "}"], "Cada `case` hace lo de su estado y, si se cumple una condición, cambia de estado. Cada uno termina en `break`."),
      bug("La cuenta atrás termina y en el mismo frame los coches ya se actualizan como si la carrera hubiera acabado. ¿Qué línea falla?", [
        "switch (state)",
        "{",
        "case RACE_COUNTDOWN:",
        "    if (countdown.ReadSec() >= 3.0) state = RACE_RUNNING;",
        "case RACE_RUNNING:",
        "    for (Car* c : cars) c->Update();",
        "    break;",
        "}"], 3,
        "Falta el `break;` después del caso RACE_COUNTDOWN: la ejecución “cae” al siguiente case. Un clásico."),
      test("¿Qué pasa al llegar a un `case` sin `break`?", ["Error de compilación", "Se sigue ejecutando el código del siguiente case", "Se sale del switch", "Se repite"], 1,
        "Se llama *fall-through*. A veces se usa a propósito para agrupar casos, pero casi siempre es un bug."),
      huecos("Los coches no se mueven durante la cuenta atrás: completa.", String.raw`case ▢:
    if (countdown.ReadSec() >= 3.0)
    {
        state = ▢;
        race_timer.Start();
    }
    ▢;`, ["RACE_COUNTDOWN", "RACE_RUNNING", "break", "RACE_FINISHED", "continue", "return"], ["RACE_COUNTDOWN", "RACE_RUNNING", "break"],
        "En la cuenta atrás no se llama a `car->Update()`; al pasar a RACE_RUNNING arranca el cronómetro."),
      test("¿Por qué conviene una función `ChangeState(next)` en vez de hacer `state = X;` en muchos sitios?", ["Es más rápido", "Para hacer siempre lo que toca al entrar en un estado (reiniciar timers, sonidos…) en un solo sitio", "Porque switch lo exige", "No conviene"], 1,
        "Si el turbo debe arrancar un timer al empezar, ponlo en ChangeState: no se te olvidará en ninguna transición."),
      test("Un coche puede estar NORMAL, BOOST (2 s) o SPIN (trompo tras chocar con aceite, 1 s). ¿Qué necesitas?", ["Tres bools", "Un enum class CarState, una variable state y un Timer state_timer", "Un vector", "Un joint"], 1,
        "Con tres bools podrías estar en BOOST y SPIN a la vez sin querer. Con un enum solo hay un estado activo."),
      orden("Ordena el Update del coche con estados.", [
        "switch (car_state)",
        "{",
        "case CarState::BOOST:",
        "    max_speed = base_speed * 1.5f;",
        "    if (state_timer.ReadSec() > 2.0) ChangeState(CarState::NORMAL);",
        "    break;",
        "case CarState::NORMAL:",
        "    max_speed = base_speed;",
        "    break;",
        "}"], "Cada estado decide sus parámetros y cuándo salir. El timer se reinicia dentro de ChangeState."),
      escribe("Escribe la condición: ha pasado más de 1.5 segundos desde que arrancó el `Timer` llamado `state_timer` (tiene `ReadSec()`).", [/^state_timer\.ReadSec\(\)>1\.5f?$/, /^state_timer\.ReadSec\(\)>=1\.5f?$/, /^1\.5f?<state_timer\.ReadSec\(\)$/],
        "`state_timer.ReadSec() > 1.5`.", { ph: "state_timer..." }),
      test("¿Cuánto vale `1 << 3`?", ["3", "4", "8", "13"], 2, "Desplazar 1 tres posiciones: binario 1000 = 8. Así se crean flags de un solo bit.", { nuevo: true }),
      test("`mask = CAT_WALL | CAT_CAR;` con `CAT_WALL = 1` y `CAT_CAR = 2`. ¿Cuánto vale `mask`?", ["1", "2", "3", "0"], 2, "OR de bits: 01 | 10 = 11 = 3. La máscara “contiene” las dos categorías."),
      escribe("Escribe la condición que comprueba si `mask` contiene el bit `CAT_CAR`.", ["(mask & CAT_CAR) != 0", "mask & CAT_CAR", "(mask&CAT_CAR)", "(mask & CAT_CAR) == CAT_CAR"],
        "Con `&` (AND de bits): si el resultado no es 0, el bit está.", { ph: "(mask ..." }),
      test("¿Para qué sirve `switch` con un `default:`?", ["Para el primer caso", "Para cualquier valor que no tenga su propio case", "Para salir del bucle", "Es obligatorio"], 1, "Útil para detectar estados no previstos: `default: LOG(\"estado desconocido\"); break;`"),
      bug("El juego muestra “YOU LOSE” aunque ganes. ¿Qué línea tiene el error?", [
        "if (player->place = 1)",
        "    DrawText(\"YOU WIN!\", 700, 260, 60, GOLD);",
        "else",
        "    DrawText(\"YOU LOSE\", 700, 260, 60, WHITE);"], 0,
        "`=` asigna (pone place a 1 y siempre es verdadero), `==` compara. Debe ser `player->place == 1`. Muchos compiladores avisan: no ignores los warnings."),
      test("En la pantalla de título del juego, ¿qué es más limpio?", ["Un bool title y otro bool playing", "Añadir RACE_TITLE al enum de estados de la carrera", "Otro módulo entero", "Un joint"], 1,
        "Un estado más en la misma máquina: `RACE_TITLE → RACE_COUNTDOWN → RACE_RUNNING → RACE_FINISHED`.")
    ]
  });
})();
