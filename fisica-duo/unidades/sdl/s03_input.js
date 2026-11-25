(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-input", titulo: "Input: la máquina de estados de cada tecla", icono: "⌨",
    desc: "KEY_IDLE/DOWN/REPEAT/UP, SDL_GetKeyboardState, scancodes, el ratón y por qué no usar solo los eventos.",
    chuleta: [
      ["Estados", "`KEY_IDLE` suelta · `KEY_DOWN` justo pulsada (1 frame) · `KEY_REPEAT` mantenida · `KEY_UP` justo soltada (1 frame)."],
      ["Input::PreUpdate", "```const bool* keys = SDL_GetKeyboardState(NULL);\nfor (int i = 0; i < MAX_KEYS; ++i)\n{\n    if (keys[i])\n        keyboard[i] = (keyboard[i] == KEY_IDLE) ? KEY_DOWN : KEY_REPEAT;\n    else\n        keyboard[i] = (keyboard[i] == KEY_REPEAT || keyboard[i] == KEY_DOWN) ? KEY_UP : KEY_IDLE;\n}```"]
    ],
    preguntas: [
      test("Saltar debe ocurrir una vez por pulsación. ¿Qué estado compruebas?", ["KEY_REPEAT", "KEY_DOWN", "KEY_IDLE", "KEY_UP"], 1, "", { nuevo: true }),
      test("Moverse mientras mantienes D. ¿Qué compruebas?", ["Solo KEY_DOWN", "KEY_REPEAT (o DOWN o REPEAT)", "KEY_UP", "KEY_IDLE"], 1, "Si solo miras REPEAT pierdes el primer frame: no pasa nada en un juego, pero `== KEY_DOWN || == KEY_REPEAT` es lo más exacto."),
      huecos("Actualiza una tecla pulsada.", String.raw`if (keys[i])
    keyboard[i] = (keyboard[i] == ▢) ? ▢ : KEY_REPEAT;`, ["KEY_IDLE", "KEY_DOWN", "KEY_UP", "KEY_REPEAT"], ["KEY_IDLE", "KEY_DOWN"], "Si estaba suelta, acaba de pulsarse; si no, se mantiene."),
      huecos("Actualiza una tecla NO pulsada.", String.raw`else
    keyboard[i] = (keyboard[i] == KEY_REPEAT || keyboard[i] == ▢) ? ▢ : KEY_IDLE;`, ["KEY_DOWN", "KEY_UP", "KEY_IDLE", "KEY_REPEAT"], ["KEY_DOWN", "KEY_UP"], ""),
      test("Secuencia de una tecla pulsada 3 frames y soltada:", ["DOWN, DOWN, DOWN, UP", "DOWN, REPEAT, REPEAT, UP, IDLE", "REPEAT, REPEAT, REPEAT, IDLE", "IDLE, DOWN, UP"], 1, ""),
      test("¿Qué devuelve `SDL_GetKeyboardState(NULL)` en SDL3?", ["Un evento", "Un array de bool indexado por scancode: true si la tecla está pulsada ahora", "La última tecla", "Un string"], 1, ""),
      test("Scancode vs keycode: ¿por qué el motor usa SDL_SCANCODE_W?", ["Es más corto", "El scancode es la posición física: WASD funciona igual en un teclado francés (AZERTY)", "Es obligatorio", "Por velocidad"], 1, ""),
      escribe("Escribe la condición: la tecla A está pulsada o mantenida (usa `GetKey`).", [/^GetKey\(SDL_SCANCODE_A\)==KEY_REPEAT\|\|GetKey\(SDL_SCANCODE_A\)==KEY_DOWN$/, /^GetKey\(SDL_SCANCODE_A\)==KEY_DOWN\|\|GetKey\(SDL_SCANCODE_A\)==KEY_REPEAT$/, /^input->GetKey\(SDL_SCANCODE_A\)==KEY_REPEAT\|\|input->GetKey\(SDL_SCANCODE_A\)==KEY_DOWN$/, /^input->GetKey\(SDL_SCANCODE_A\)==KEY_DOWN\|\|input->GetKey\(SDL_SCANCODE_A\)==KEY_REPEAT$/], "", { ph: "GetKey(...) == ... || ..." }),
      bug("El jugador salta 5 veces seguidas con una pulsación.", [
        "if (input->GetKey(SDL_SCANCODE_SPACE) == KEY_REPEAT && onGround)",
        "    b2Body_ApplyLinearImpulseToCenter(body, { 0, -jumpForce }, true);"], 0, "Debe ser KEY_DOWN: REPEAT es cierto todos los frames que mantienes la tecla."),
      test("¿Por qué Input lee el teclado en PreUpdate?", ["Por costumbre", "Para que el estado esté actualizado ANTES de que Scene y las entidades lo consulten en Update", "Por obligación de SDL", "Da igual"], 1, ""),
      test("¿Dónde se procesan los eventos de SDL (cerrar ventana) en el motor?", ["En Scene", "En Input::PreUpdate, con el bucle de SDL_PollEvent; si llega SDL_EVENT_QUIT devuelve false", "En Render", "En ningún sitio"], 1, ""),
      huecos("Ratón en SDL3.", String.raw`float mx, my;
SDL_MouseButtonFlags buttons = SDL_GetMouseState(▢mx, ▢my);
if (buttons & SDL_BUTTON_LMASK) Disparar();`, ["&", "&", "*", "->"], ["&", "&"], "Pasas la dirección de tus variables y SDL las rellena. En SDL3 son float."),
      test("El ratón está en pantalla (300, 200) y la cámara del motor en (-500, 0). ¿Posición en el mundo?", ["(300, 200)", "(800, 200)", "(-200, 200)", "(500, 0)"], 1, "La cámara es negativa: mundo = pantalla − camera.x = 300 + 500."),
      test("¿Cómo detectas una combinación como Ctrl+S?", ["No se puede", "GetKey(SDL_SCANCODE_LCTRL) == KEY_REPEAT && GetKey(SDL_SCANCODE_S) == KEY_DOWN", "Con un evento especial", "Con SDL_Delay"], 1, ""),
      test("Teclas de debug del handout: F9 colliders, F10 god mode... ¿qué estado usas?", ["KEY_REPEAT", "KEY_DOWN (alternan un bool una vez por pulsación)", "KEY_IDLE", "KEY_UP"], 1, "`if (GetKey(SDL_SCANCODE_F9) == KEY_DOWN) debug = !debug;`")
    ]
  });
})();
