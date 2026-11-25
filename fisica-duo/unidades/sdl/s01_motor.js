(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-motor", titulo: "La arquitectura del motor", icono: "⚙",
    desc: "Engine singleton, módulos con Awake/Start/PreUpdate/Update/PostUpdate/CleanUp, el orden de los módulos y cómo se cierra el juego.",
    chuleta: [
      ["Module", "```class Module {\npublic:\n    virtual ~Module() {}\n    virtual bool Awake() { return true; }      // leer config\n    virtual bool Start() { return true; }      // cargar recursos\n    virtual bool PreUpdate() { return true; }  // input, limpiar pantalla\n    virtual bool Update(float dt) { return true; }\n    virtual bool PostUpdate() { return true; } // presentar el frame\n    virtual bool CleanUp() { return true; }    // liberar\n    std::string name;\n    bool active = true;\n};```"],
      ["Singleton", "```static Engine& GetInstance() { static Engine instance; return instance; }\n// Uso desde cualquier sitio:\nEngine::GetInstance().render->DrawTexture(tex, x, y);```"],
      ["Bucle", "Awake de todos → Start de todos → mientras todo devuelva true: PreUpdate, Update, PostUpdate de todos → CleanUp de todos en orden INVERSO."]
    ],
    preguntas: [
      test("¿Qué es un singleton?", ["Una clase con un solo método", "Una clase de la que solo existe una instancia, accesible desde cualquier sitio", "Un puntero nulo", "Un módulo vacío"], 1, "El Engine es uno: `Engine::GetInstance()`.", { nuevo: true }),
      huecos("El singleton del motor.", String.raw`static Engine& GetInstance()
{
    ▢ Engine instance;
    return ▢;
}`, ["static", "instance", "new", "this", "const"], ["static", "instance"], "Una variable local static se crea la primera vez y vive hasta el final del programa."),
      orden("Ordena las fases de la vida de un módulo.", ["Awake", "Start", "PreUpdate", "Update", "PostUpdate", "CleanUp"], "Awake lee la configuración; Start carga recursos (cuando ya existen todos los módulos)."),
      test("¿Dónde cargas la textura del jugador?", ["Awake", "Start", "PreUpdate", "PostUpdate"], 1, "En Awake aún puede no existir el renderer: Start va después de que todos hayan hecho Awake."),
      test("¿Por qué CleanUp se llama en orden inverso?", ["Por estética", "Porque los últimos módulos dependen de los primeros: hay que liberar a los que usan antes que a los usados (Scene antes que Render)", "Es más rápido", "No se llama en orden inverso"], 1, ""),
      test("¿Qué pasa si Update de la escena devuelve false?", ["Nada", "El Engine sale del bucle y empieza a cerrar (CleanUp)", "Se reinicia la escena", "Crash"], 1, ""),
      escribe("Escribe la condición de Scene::Update para salir con ESC (usa `Engine::GetInstance().input->GetKey` y `KEY_DOWN`).", [/^if\(Engine::GetInstance\(\)\.input->GetKey\(SDL_SCANCODE_ESCAPE\)==KEY_DOWN\)(returnfalse)?$/],
        "`if (Engine::GetInstance().input->GetKey(SDL_SCANCODE_ESCAPE) == KEY_DOWN) return false;`", { ph: "if (Engine::GetInstance()..." }),
      test("¿Por qué el orden en que se añaden los módulos importa?", ["No importa", "Se actualizan en ese orden: Input debe ir antes que Scene, y Render el último (presenta el frame)", "Solo importa el primero", "Por la memoria"], 1, ""),
      orden("Orden típico de AddModule.", ["AddModule(window);", "AddModule(input);", "AddModule(textures);", "AddModule(audio);", "AddModule(physics);", "AddModule(scene);", "AddModule(map);", "AddModule(entityManager);", "AddModule(render);"], "Render el último para que su PostUpdate presente lo que han dibujado todos. (Map y EntityManager pueden variar según el handout)."),
      bug("El juego no cierra nunca con ESC.", [
        "bool Scene::Update(float dt)",
        "{",
        "    if (input->GetKey(SDL_SCANCODE_ESCAPE) == KEY_DOWN) return true;",
        "    return true;",
        "}"], 2, "Devolver true sigue el bucle. Para salir, `return false`."),
      test("¿Qué hace la palabra `virtual` en los métodos de Module?", ["Nada", "Permite que Engine llame a `module->Update(dt)` y se ejecute la versión de cada hijo (Scene, Render…)", "Los hace estáticos", "Los oculta"], 1, ""),
      test("Un módulo tiene `active = false`. ¿Qué hace el Engine?", ["Lo borra", "Se salta sus Update (útil para desactivar una escena)", "Crash", "Lo reinicia"], 1, ""),
      huecos("El bucle de una fase en el Engine.", String.raw`bool Engine::DoUpdate()
{
    for (const auto& module : moduleList)
    {
        if (module->▢ == false) continue;
        if (module->Update(dt) == false) return ▢;
    }
    return true;
}`, ["active", "false", "name", "true", "dt"], ["active", "false"], ""),
      test("¿Qué ventaja tiene que Render dibuje con una función `DrawTexture` del módulo en vez de llamar a SDL directamente desde el Player?", ["Ninguna", "Un solo sitio aplica la cámara, la escala y el debug: el jugador no sabe nada de SDL_Renderer", "Más velocidad", "Menos memoria"], 1, ""),
      escribe("Escribe la cabecera (declaración en el .h) del Update de Scene que sobrescribe el de Module.", [/^boolUpdate\(floatdt\)override$/, /^virtualboolUpdate\(floatdt\)override$/], "`bool Update(float dt) override;`", { ph: "bool Update(..." }),
      test("¿Por qué el destructor de Module es virtual?", ["No hace falta", "Porque los módulos se borran a través de un puntero a Module", "Para que sea más rápido", "Para que no se pueda heredar"], 1, "")
    ]
  });
})();
