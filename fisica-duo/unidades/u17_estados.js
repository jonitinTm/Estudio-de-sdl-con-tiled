(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "estados2", titulo: "Máquinas de estados de verdad", icono: "⇄",
    desc: "Transiciones con Enter/Exit, temporizadores por estado, estados de jugador y de pantalla, el patrón State con clases y una pila para la pausa.",
    chuleta: [
      ["Enum + ChangeState", "```enum class GameState { TITLE, COUNTDOWN, RACING, PAUSED, RESULTS };\n\nvoid ChangeState(GameState next)\n{\n    OnExit(state);          // limpia el estado viejo\n    state = next;\n    state_timer.Start();    // cada estado cuenta su tiempo\n    OnEnter(state);         // prepara el nuevo\n}```"],
      ["Patrón State", "```class State {\npublic:\n    virtual ~State() {}\n    virtual void Enter() {}\n    virtual State* Update(float dt) = 0;   // devuelve el siguiente (o this)\n    virtual void Exit() {}\n};```"],
      ["Reglas", "Una sola variable de estado (no cinco bools).\nCambia de estado SOLO con ChangeState.\nLo que se hace una vez → Enter. Lo de cada frame → Update.\nEl input se lee según el estado."]
    ],
    preguntas: [
      test("Tienes `bool racing, paused, finished, countdown;`. ¿Qué problema tiene?", ["Ninguno", "Pueden darse combinaciones imposibles (racing y finished a la vez)", "Ocupa mucha memoria", "No compila"], 1, "Un enum garantiza que solo hay un estado activo.", { nuevo: true }),
      huecos("La función que cambia de estado.", String.raw`void ModuleGame::ChangeState(GameState next)
{
    ▢(state);
    state = ▢;
    state_timer.Start();
    OnEnter(state);
}`, ["OnExit", "next", "OnEnter", "state", "Update"], ["OnExit", "next"], "Salir del viejo, cambiar, reiniciar el temporizador, entrar en el nuevo."),
      test("¿Dónde pones `PlayMusicStream(race_music)`?", ["En el Update de RACING (cada frame)", "En OnEnter de RACING", "En el constructor", "En Draw"], 1, "Lo que ocurre una vez al entrar va en Enter. Cada frame la reiniciaría."),
      orden("Update de la cuenta atrás: 3 segundos y a correr.", [
        "case GameState::COUNTDOWN:",
        "    if (state_timer.ReadSec() >= 3.0)",
        "        ChangeState(GameState::RACING);",
        "    break;"], ""),
      escribe("Escribe el número que se muestra en la cuenta atrás (3, 2, 1) como int, usando `state_timer.ReadSec()`.", [/^3-\(int\)state_timer\.ReadSec\(\)$/, /^3-static_cast<int>\(state_timer\.ReadSec\(\)\)$/], "`3 - (int)state_timer.ReadSec()` → 3, 2, 1 durante cada segundo.", { ph: "3 - ..." }),
      bug("Al pausar, el cronómetro de vuelta sigue contando. ¿Qué falta?", [
        "case GameState::RACING:",
        "    if (IsKeyPressed(KEY_P)) ChangeState(GameState::PAUSED);",
        "    break;",
        "case GameState::PAUSED:",
        "    if (IsKeyPressed(KEY_P)) ChangeState(GameState::RACING);",
        "    break;"], 1, "El Timer cuenta tiempo real. Al entrar en PAUSED guarda lo transcurrido (o para los timers) y al volver réstalo. Además: no hagas world->Step mientras estás en PAUSED."),
      test("¿Qué no debe ocurrir en PAUSED?", ["Dibujar", "world->Step y el input de conducción", "Leer la tecla P", "Mostrar el menú"], 1, ""),
      huecos("Estado del jugador en un plataformas.", String.raw`enum class PlayerState { IDLE, RUN, JUMP, FALL };
...
if (!on_ground)
    state = (vel.y < 0) ? PlayerState::▢ : PlayerState::▢;
else
    state = (fabsf(vel.x) > 0.1f) ? PlayerState::RUN : PlayerState::IDLE;`, ["JUMP", "FALL", "RUN", "IDLE"], ["JUMP", "FALL"], "En pantalla la Y crece hacia abajo: subir es vel.y negativa."),
      test("¿Para qué sirve el estado del jugador además de la lógica?", ["Para nada", "Para elegir la animación (cada estado tiene la suya)", "Para la gravedad", "Para el filtrado"], 1, ""),
      test("Patrón State: ¿qué devuelve `Update` en este diseño?", ["void", "Un puntero al siguiente estado (this si no cambia)", "Un bool", "Un int"], 1, "", { code: String.raw`class State {
public:
    virtual ~State() {}
    virtual void Enter() {}
    virtual State* Update(float dt) = 0;
    virtual void Exit() {}
};` }),
      orden("El bucle que usa el patrón State.", [
        "State* next = current->Update(dt);",
        "if (next != current)",
        "{",
        "    current->Exit();",
        "    delete current;",
        "    current = next;",
        "    current->Enter();",
        "}"], "Ojo: borras el viejo DESPUÉS de llamar a Exit."),
      test("¿Por qué State necesita destructor virtual?", ["Por estilo", "Porque se borra con `delete current;` a través de un `State*`: sin virtual no se llama al destructor de la clase hija", "Para que compile", "No lo necesita"], 1, ""),
      test("Quieres que el menú de pausa se dibuje ENCIMA de la carrera congelada. ¿Qué estructura ayuda?", ["Un bool", "Una pila de estados: solo se actualiza el de arriba, pero se dibujan todos", "Un map", "Un switch más grande"], 1, "push(Pause) al pausar, pop() al volver."),
      escribe("Con `std::vector<State*> stack;`, escribe la línea que actualiza SOLO el estado de arriba (llama a `Update(dt)`).", ["stack.back()->Update(dt)", "stack[stack.size()-1]->Update(dt)"], "back() es el último elemento: la cima de la pila.", { ph: "stack..." }),
      bug("El sonido de victoria suena sin parar en la pantalla de resultados.", [
        "case GameState::RESULTS:",
        "    PlaySound(win_fx);",
        "    if (IsKeyPressed(KEY_ENTER)) ChangeState(GameState::TITLE);",
        "    break;"], 1, "Se llama cada frame. Va en OnEnter(RESULTS)."),
      test("Un enemigo: PATROL → CHASE si ve al jugador; CHASE → PATROL si lo pierde 2 s. ¿Qué necesitas?", ["Solo un bool", "Un enum, un temporizador del estado y una comprobación de visión (raycast)", "Un joint", "Nada"], 1, ""),
      test("¿Qué es una transición inválida y cómo la evitas?", ["No existen", "Pasar a un estado que no tiene sentido desde el actual (RESULTS → PAUSED); se comprueba en ChangeState o con una tabla", "Un error de compilación", "Un crash de Box2D"], 1, "`if (state == RESULTS && next == PAUSED) return;`"),
      huecos("Convierte el estado en texto para depurar.", String.raw`const char* ToString(GameState s)
{
    ▢ (s)
    {
    case GameState::RACING: return "RACING";
    case GameState::PAUSED: return "PAUSED";
    ▢: return "?";
    }
}`, ["switch", "default", "if", "else", "break"], ["switch", "default"], "Muy útil en el HUD de debug.")
    ]
  });
})();
