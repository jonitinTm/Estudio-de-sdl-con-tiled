(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "motor", titulo: "El motor del handout (Raylib)", icono: "App",
    desc: "Application, módulos, update_status, Timer, teclado y dibujar texturas rotadas con Raylib.",
    chuleta: [
      ["Módulos", "```class ModuleGame : public Module\n{\npublic:\n    bool Start() override;          // cargar recursos\n    update_status Update() override; // cada frame\n    bool CleanUp() override;        // liberar\n    void OnCollision(PhysBody* a, PhysBody* b) override;\n};```\nDevolver `UPDATE_STOP` cierra el juego. Orden en Application: window, physics, audio, scene, renderer."],
      ["Teclado de Raylib", "`IsKeyDown(KEY_A)`: mientras está pulsada. `IsKeyPressed(KEY_SPACE)`: solo el frame en que se pulsa. `IsKeyReleased(...)`: el frame en que se suelta."],
      ["Dibujar centrado y rotado", "```int x, y;\nbody->GetPosition(x, y);   // centro en píxeles\nRectangle src = { 0, 0, (float)tex.width, (float)tex.height };\nRectangle dst = { (float)x, (float)y, (float)tex.width, (float)tex.height };\nVector2 origin = { tex.width / 2.0f, tex.height / 2.0f };\nDrawTexturePro(tex, src, dst, origin, body->GetRotation() * RAD2DEG, WHITE);```"],
      ["Timer", "```Timer t;           // empieza al crearse\nt.Start();         // reiniciar\ndouble s = t.ReadSec();```"]
    ],
    preguntas: [
      test("¿Qué devuelve `Update()` en un módulo del handout para que el juego siga?", ["`true`", "`UPDATE_CONTINUE`", "`0`", "`UPDATE_STOP`"], 1,
        "`update_status` puede ser UPDATE_CONTINUE, UPDATE_STOP (cerrar) o UPDATE_ERROR.", { nuevo: true }),
      test("¿En qué función de un módulo cargas texturas y sonidos?", ["Constructor", "Start", "Update", "PostUpdate"], 1, "Start se llama una vez, cuando la ventana y el audio ya están inicializados (Init)."),
      test("¿Por qué ModulePhysics va antes que ModuleGame en Application?", ["Por orden alfabético", "Para que el Step de este frame ya esté hecho cuando el juego lea las posiciones", "Porque Raylib lo exige", "Da igual"], 1,
        "ModulePhysics::PreUpdate hace el Step; luego ModuleGame::Update lee posiciones y dibuja."),
      test("Para acelerar mientras mantienes la tecla, usas…", ["`IsKeyPressed(KEY_UP)`", "`IsKeyDown(KEY_UP)`", "`IsKeyReleased(KEY_UP)`", "`GetKeyPressed()`"], 1, "IsKeyDown es verdadero todos los frames que la tecla esté pulsada."),
      test("Para disparar el nitro una sola vez por pulsación, usas…", ["`IsKeyDown(KEY_SPACE)`", "`IsKeyPressed(KEY_SPACE)`", "`IsKeyUp(KEY_SPACE)`", "un bucle while"], 1, "IsKeyPressed solo es verdadero el frame en que se pulsa."),
      huecos("Lee el giro con flechas o con A y D (requisito del proyecto).", String.raw`float steer = 0.0f;
if (IsKeyDown(KEY_LEFT) ▢ IsKeyDown(KEY_A)) steer -= 1.0f;
if (IsKeyDown(KEY_RIGHT) || ▢(KEY_D)) steer += 1.0f;`, ["||", "&&", "IsKeyDown", "IsKeyPressed", "|", "!"], ["||", "IsKeyDown"],
        "`||` es “o”: cualquiera de las dos teclas sirve. Con `&&` habría que pulsar las dos a la vez."),
      test("`GetPosition(x, y)` devuelve el centro del cuerpo. Si dibujas con `DrawTexture(tex, x, y, WHITE)`, ¿qué pasa?", ["Se ve perfecto", "La textura sale desplazada media medida abajo a la derecha", "No se ve", "Sale rotada"], 1,
        "DrawTexture pone en (x, y) la esquina superior izquierda. Hay que restar la mitad o usar DrawTexturePro con origin en el centro."),
      huecos("Dibuja el coche centrado y rotado.", String.raw`Vector2 origin = { tex.width / ▢, tex.height / 2.0f };
DrawTexturePro(tex, src, dst, origin, body->GetRotation() * ▢, WHITE);`, ["2.0f", "RAD2DEG", "DEG2RAD", "2", "PI", "0.5f"], ["2.0f", "RAD2DEG"],
        "El origin en el centro hace que la textura quede centrada y gire sobre su centro. Box2D da radianes y Raylib quiere grados: `* RAD2DEG`."),
      test("`GetRotation()` devuelve 1.5708. Si se lo pasas a DrawTexturePro sin convertir, ¿qué ves?", ["Gira 90°", "Gira solo 1,57° (casi nada)", "No compila", "Gira al revés"], 1, "1,5708 rad son 90°, pero Raylib lo interpreta como grados."),
      escribe("Escribe la expresión que pasa el ángulo de `body` (con `GetRotation()`, en radianes) a grados para Raylib.", ["body->GetRotation() * RAD2DEG", "body->GetRotation()*RAD2DEG", "RAD2DEG * body->GetRotation()", "body->GetRotation() * RADTODEG"],
        "`body->GetRotation() * RAD2DEG` (el handout también define RADTODEG).", { ph: "body->..." }),
      test("¿Qué hace `Timer::Start()`?", ["Pausa el timer", "Apunta la hora actual: ReadSec() cuenta desde aquí", "Devuelve los segundos", "Lo destruye"], 1, "Para medir una vuelta: `lap_timer.Start()` al cruzar la meta y `lap_timer.ReadSec()` para leer."),
      orden("Ordena el Start de ModuleGame.", [
        "bool ModuleGame::Start()",
        "{",
        "    car_tex = LoadTexture(\"Assets/car.png\");",
        "    lap_fx = App->audio->LoadFx(\"Assets/lap.wav\");",
        "    player = new PlayerCar(App->physics, 600, 100);",
        "    return true;",
        "}"], "Start carga recursos y crea los objetos iniciales. Devuelve true si todo fue bien."),
      bug("Falta una línea y la textura `car_tex` nunca se libera. ¿Delante de qué línea debería ir?", [
        "bool ModuleGame::CleanUp()",
        "{",
        "    App->physics->DestroyBody(player->body);",
        "    delete player;",
        "    return true;",
        "}"], 4,
        "No se libera la textura cargada en Start: falta `UnloadTexture(car_tex);` antes del return. Todo Load tiene su Unload."),
      test("¿Qué hace `TextFormat(\"Lap %d/%d\", lap, 3)`?", ["Dibuja texto", "Construye el texto \"Lap 1/3\" sustituyendo cada %d por un entero", "Lee un archivo", "Formatea el disco"], 1, "`%d` entero, `%.2f` decimal con 2 cifras, `%s` texto. Luego se pasa a DrawText."),
      escribe("Escribe la llamada que dibuja con DrawText el tiempo `t` (double) con 2 decimales, en (20, 50), tamaño 24, color WHITE. Usa TextFormat.", [/^DrawText\(TextFormat\("[^"]*%\.2f[^"]*",t\),20,50,24,WHITE\)$/],
        "`DrawText(TextFormat(\"Time %.2f\", t), 20, 50, 24, WHITE);`", { sol: "DrawText(TextFormat(\"Time %.2f\", t), 20, 50, 24, WHITE)", ph: "DrawText(TextFormat(..." }),
      test("¿Dónde dibujas el HUD para que no se mueva con la cámara (Camera2D)?", ["Dentro de BeginMode2D/EndMode2D", "Después de EndMode2D", "En Start", "En CleanUp"], 1, "Lo de dentro de BeginMode2D se mueve con la cámara; lo de fuera queda fijo en pantalla."),
      test("¿Qué pasa si una función de un módulo devuelve `UPDATE_STOP`?", ["Se pausa", "El juego termina limpiamente: se llama a CleanUp de todos los módulos", "Se reinicia la carrera", "Nada"], 1, "Por ejemplo, al pulsar ESC."),
      test("¿Qué hace `LOG(\"Speed %f\", s)` en el handout?", ["Dibuja en pantalla", "Escribe un mensaje de depuración con archivo y línea", "Cierra el juego", "Guarda en disco"], 1, "Úsalo para comprobar valores (velocidad, checkpoint siguiente…) sin poner breakpoints.")
    ]
  });
})();
