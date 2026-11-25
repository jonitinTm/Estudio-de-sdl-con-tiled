(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "pulido", titulo: "Pulido: sonido, partículas y game feel", icono: "✨",
    desc: "Audio con Raylib (Sound y Music), volumen según la velocidad, marcas de derrape, partículas, screen shake y menús.",
    chuleta: [
      ["Audio", "```InitAudioDevice();\nSound crash = LoadSound(\"Assets/crash.wav\");     // corto: efectos\nMusic music = LoadMusicStream(\"Assets/race.ogg\"); // largo: se lee a trozos\nPlayMusicStream(music);\n// cada frame:\nUpdateMusicStream(music);\n// al salir:\nUnloadSound(crash); UnloadMusicStream(music); CloseAudioDevice();```"],
      ["Screen shake", "```if (shake > 0) { cam.offset.x = base.x + GetRandomValue(-4, 4) * shake; shake -= dt * 3.0f; }\nelse cam.offset = base;```"]
    ],
    preguntas: [
      test("¿Cuál es la diferencia entre Sound y Music en Raylib?", ["Ninguna", "Sound se carga entero en memoria (efectos cortos); Music se va leyendo a trozos (canciones largas)", "Music no tiene volumen", "Sound es solo .ogg"], 1, "", { nuevo: true }),
      bug("La música suena a trozos o se para.", [
        "PlayMusicStream(music);",
        "// Update:",
        "DrawRace();"], 2, "Falta `UpdateMusicStream(music);` cada frame: rellena el buffer de audio."),
      huecos("Volumen del motor según la velocidad.", String.raw`float t = fminf(fabsf(GetForwardSpeed()) / max_speed, 1.0f);
SetSoundVolume(engine_fx, 0.2f + 0.8f * ▢);
SetSoundPitch(engine_fx, 0.8f + 0.7f * t);
if (!▢(engine_fx)) PlaySound(engine_fx);`, ["t", "IsSoundPlaying", "max_speed", "IsSoundReady", "speed"], ["t", "IsSoundPlaying"], "Pitch más agudo cuanto más rápido: suena a motor de verdad."),
      test("El sonido de choque suena 20 veces superpuesto en un golpe. ¿Solución?", ["Bajar el volumen", "Solo reproducirlo si el impulso del choque supera un umbral y no ha sonado en los últimos 0,2 s", "Quitarlo", "Más fps"], 1, ""),
      test("¿Cómo dibujas marcas de derrape?", ["Con física", "Guardas posiciones de las ruedas traseras mientras drifting es true y dibujas líneas/círculos semitransparentes debajo de los coches", "Con una textura gigante", "No se puede"], 1, "Limita la lista (p. ej. 500 puntos) borrando los más viejos."),
      orden("Un sistema de partículas sencillo (humo).", [
        "struct Particle { Vector2 pos, vel; float life; };",
        "particles.push_back({ exhaust, { rnd(-20, 20), rnd(-20, 20) }, 0.6f });",
        "for (auto& p : particles) { p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt; p.life -= dt; }",
        "particles.erase(std::remove_if(particles.begin(), particles.end(), [](const Particle& p) { return p.life <= 0; }), particles.end());",
        "for (auto& p : particles) DrawCircleV(p.pos, 4, Fade(GRAY, p.life));"], "Crear, mover, borrar las muertas, dibujar."),
      test("¿Qué hace `Fade(GRAY, 0.3f)`?", ["Nada", "Devuelve el color con alfa al 30 %", "Oscurece", "Mezcla con negro"], 1, ""),
      escribe("Escribe un número aleatorio entero entre -4 y 4 con Raylib.", ["GetRandomValue(-4, 4)"], "", { ph: "GetRandomValue(..." }),
      test("¿Qué es el game feel?", ["Los gráficos", "La sensación al jugar: respuesta inmediata, sonido, vibración, partículas, cámara que reacciona", "El framerate", "El menú"], 1, ""),
      test("Al chocar fuerte, ¿qué pequeño efecto ayuda mucho?", ["Pausar el juego 1 s", "Un screen shake corto + sonido + partículas", "Cambiar de nivel", "Nada"], 1, ""),
      huecos("Menú con selección por teclado.", String.raw`if (IsKeyPressed(KEY_DOWN)) selected = (selected + 1) ▢ OPTION_COUNT;
if (IsKeyPressed(KEY_UP))   selected = (selected - 1 + OPTION_COUNT) % OPTION_COUNT;
if (IsKeyPressed(▢)) ChooseOption(selected);`, ["%", "KEY_ENTER", "/", "KEY_SPACE_BAR", "+"], ["%", "KEY_ENTER"], "El + OPTION_COUNT evita que el módulo de un negativo dé negativo."),
      test("¿Por qué `(selected - 1 + COUNT) % COUNT` y no `(selected - 1) % COUNT`?", ["Es igual", "En C++, -1 % 3 vale -1 (no 2): sumando COUNT antes evitas el negativo", "Es más rápido", "Por estilo"], 1, ""),
      bug("Al volver al menú y empezar otra carrera, el juego se queda sin memoria poco a poco.", [
        "void StartRace() { music = LoadMusicStream(\"race.ogg\"); PlayMusicStream(music); }",
        "void BackToMenu() { StopMusicStream(music); }"], 1, "Se carga la música en cada carrera y nunca se descarga: `UnloadMusicStream(music)` al salir (o cárgala una vez en Start)."),
      test("¿Dónde se llama InitAudioDevice?", ["En cada sonido", "Una vez al inicio (módulo de audio, en Init/Start)", "En Draw", "Nunca"], 1, "")
    ]
  });
})();
