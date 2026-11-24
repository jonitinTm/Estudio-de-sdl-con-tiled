(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "bugs", titulo: "Caza de bugs del proyecto", icono: "🐞",
    desc: "Los errores típicos de física y C++ que te harán perder horas: encuéntralos en segundos.",
    chuleta: [
      ["Síntoma → causa", "Todo cae hacia abajo → gravedad ≠ 0.\nPatina como en hielo → sin agarre lateral.\nNo se para nunca → sin arrastre/fricción.\nTextura desplazada → dibujas desde la esquina.\nGira casi nada → olvidaste RAD2DEG.\nCaja el doble de grande → SetAsBox con medidas enteras.\nCrash al tocar un sensor → DestroyBody en OnCollision.\nCrash con F1 → mouse_joint colgando.\nAtraviesa muros → SetTransform cada frame o cadena al revés.\nFísica más rápida en otro PC → Step por frame sin 60 fps fijos."]
    ],
    preguntas: [
      bug("Todo se va hacia abajo de la pantalla en el juego de carreras.", [
        "#define GRAVITY_X 0.0f",
        "#define GRAVITY_Y -10.0f",
        "world = new b2World(b2Vec2(GRAVITY_X, -GRAVITY_Y));"], 1, "Vista cenital: GRAVITY_Y debe ser 0."),
      bug("La textura del coche no coincide con su caja de debug.", [
        "int x, y;",
        "body->GetPosition(x, y);",
        "DrawTexture(tex, x, y, WHITE);"], 2, "GetPosition da el centro: dibuja en (x − w/2, y − h/2) o usa DrawTexturePro con origin centrado."),
      bug("El coche apenas rota en pantalla aunque físicamente gira.", [
        "Vector2 origin = { tex.width / 2.0f, tex.height / 2.0f };",
        "DrawTexturePro(tex, src, dst, origin, body->GetRotation(), WHITE);"], 1, "Falta `* RAD2DEG`."),
      bug("El nitro no hace nada.", [
        "if (IsKeyPressed(KEY_SPACE))",
        "    b->ApplyForceToCenter(b2Vec2(0, -50), true);"], 1, "Una fuerza aplicada un solo frame apenas mueve nada (y aquí va siempre hacia arriba de la pantalla, no hacia el morro). Usa un impulso en la dirección forward o un boost_time."),
      bug("Crash aleatorio al recoger monedas.", [
        "void ModuleGame::OnCollision(PhysBody* a, PhysBody* b)",
        "{",
        "    if (IsCoin(a)) { App->physics->DestroyBody(a); coins++; }",
        "}"], 2, "DestroyBody dentro del callback. Apunta y destruye en Update."),
      bug("Los coches atraviesan el muro interior de la pista.", [
        "walls_outer = App->physics->CreateChain(0, 0, outer, sizeof(outer) / sizeof(int));",
        "walls_inner = App->physics->CreateChain(0, 0, inner, 4);"], 1, "El tamaño debe ser el número de ints del array: `sizeof(inner) / sizeof(int)`. Con 4 solo hay 2 vértices. (La otra causa típica: vértices en el sentido equivocado)."),
      bug("La vuelta cuenta dos veces de golpe al cruzar la meta.", [
        "int index = FindCheckpoint(bodyA);",
        "if (index == 0) car->LapCompleted();",
        "car->next_checkpoint = (index + 1) % CHECKPOINT_COUNT;"], 1, "Falta comprobar el orden: `if (index != car->next_checkpoint) return;` antes. Además el contacto puede llegar más de una vez."),
      bug("El juego va a cámara rápida en un monitor de 144 Hz.", [
        "update_status ModulePhysics::PreUpdate()",
        "{",
        "    world->Step(1.0f / 60.0f, 8, 3);",
        "    return UPDATE_CONTINUE;",
        "}"], 2, "Un Step de 1/60 por frame: a 144 fps hay 144 pasos por segundo. Fija `SetTargetFPS(60)` o acumula el tiempo real y da pasos fijos."),
      bug("El coche gira al revés marcha atrás… pero también hacia delante gira al revés.", [
        "float factor = fminf(fabsf(speed) / 2.5f, 1.0f);",
        "if (speed > 0.0f) factor = -factor;",
        "b->SetAngularVelocity(steer * turn_speed * factor);"], 1, "La condición debe ser `speed < 0.0f`."),
      bug("Fuga de memoria al reiniciar la carrera varias veces.", [
        "void ModuleGame::RestartRace()",
        "{",
        "    cars.clear();",
        "    CreateCars();",
        "}"], 2, "Se pierden los coches anteriores sin borrarlos: antes, para cada uno, DestroyBody + delete."),
      bug("El segundo sonido cargado nunca suena (y el primero suena cuando pides el segundo).", [
        "unsigned int LoadFx(const char* path) { fx[fx_count++] = LoadSound(path); return fx_count; }",
        "bool PlayFx(unsigned int id) { if (id < fx_count) PlaySound(fx[id]); return true; }"], 1, "LoadFx devuelve 1, 2… pero el índice es id − 1: `PlaySound(fx[id - 1])` con `id > 0 && id <= fx_count`. (Fallo real del handout)."),
      bug("El rival nunca gira a la izquierda.", [
        "b2Vec2 local = b->GetLocalPoint(goal);",
        "float angle = atan2f(local.x, -local.y);",
        "float steer = fabsf(angle) * 2.0f;"], 2, "fabsf quita el signo: el volante siempre es positivo (derecha)."),
      bug("Tras hacer clic con F1 sobre un muro, el juego crashea.", [
        "if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT) && f->TestPoint(mouse_position))",
        "    body_clicked = b;"], 0, "Falta `b->GetType() == b2_dynamicBody`: un mouse joint sobre un cuerpo estático no tiene sentido (masa 0, maxForce 0)."),
      bug("El coche fantasma (groupIndex) choca igualmente con los demás.", [
        "b2Filter f = fixture->GetFilterData();",
        "f.groupIndex = 1;",
        "fixture->SetFilterData(f);"], 1, "Mismo grupo POSITIVO = siempre chocan. Para nunca chocar, negativo (-1) en todos los fantasmas."),
      test("¿Qué herramienta de Visual Studio te lista las fugas al cerrar el juego?", ["El depurador de gráficos", "_CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_LEAK_CHECK_DF) al inicio de main", "El profiler de CPU", "Ninguna"], 1, "En Debug, la ventana Salida muestra “Detected memory leaks!” con lo que no se liberó."),
      test("Cambias un valor en un .h y Visual Studio no parece aplicarlo. ¿Primer paso?", ["Reinstalar", "Recompilar todo (Recompilar solución)", "Borrar Box2D", "Cambiar el PIXELS_PER_METER"], 1, "")
    ]
  });
})();
