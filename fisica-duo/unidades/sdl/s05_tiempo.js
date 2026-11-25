(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-tiempo", titulo: "Framerate, frame cap y delta time", icono: "⏱",
    desc: "Timer y PerfTimer, calcular FPS, limitar a 60 con SDL_DelayPrecise, VSYNC, dt en ms o en s, moverse igual a cualquier fps y limitar dt.",
    chuleta: [
      ["Timers", "```// Timer: milisegundos (SDL_GetTicks)\nvoid Start() { startTime = SDL_GetTicks(); }\nUint64 ReadMSec() const { return SDL_GetTicks() - startTime; }\nfloat ReadSec() const { return (SDL_GetTicks() - startTime) / 1000.0f; }\n// PerfTimer: alta precisión\ndouble ReadMs() const { return 1000.0 * (SDL_GetPerformanceCounter() - startTime) / SDL_GetPerformanceFrequency(); }```"],
      ["FinishUpdate (frame cap)", "```double elapsed = frameTime.ReadMs();\nif (maxFrameDuration > 0 && elapsed < maxFrameDuration)\n    SDL_DelayPrecise((Uint64)((maxFrameDuration - elapsed) * 1000000.0));   // ns\ndt = (float)frameTime.ReadMs();      // DESPUÉS de esperar\nif (dt > 100.0f) dt = 100.0f;      // breakpoints\nframeTime.Start();```"],
      ["Mover con dt", "`pos += velocidad * dt` con la velocidad en unidades por la misma unidad que dt (px/ms o px/s)."]
    ],
    preguntas: [
      test("Un frame dura 20 ms. ¿FPS?", ["20", "50", "60", "200"], 1, "1000 / 20 = 50.", { nuevo: true }),
      escribe("Escribe la duración máxima de un frame en ms para `targetFps` (float).", [/^1000(\.0f?|f)?\/targetFps$/], "60 fps → 16,67 ms.", { sol: "1000.0f / targetFps", ph: "1000.0f / ..." }),
      huecos("Timer::ReadSec.", String.raw`float Timer::ReadSec() const
{
    return (SDL_GetTicks() - ▢) / ▢;
}`, ["startTime", "1000.0f", "1000", "60.0f", "SDL_GetTicks()"], ["startTime", "1000.0f"], "Con 1000 (entero) harías división entera y perderías los decimales."),
      test("¿Por qué PerfTimer usa SDL_GetPerformanceCounter y no SDL_GetTicks?", ["Es igual", "GetTicks tiene resolución de 1 ms: para medir un frame de 16,6 ms necesitas más precisión", "Es más fácil", "Para el audio"], 1, ""),
      orden("FinishUpdate con frame cap.", [
        "double elapsed = frameTime.ReadMs();",
        "if (elapsed < maxFrameDuration)",
        "    SDL_DelayPrecise((Uint64)((maxFrameDuration - elapsed) * 1000000.0));",
        "dt = (float)frameTime.ReadMs();",
        "frameTime.Start();"], "dt se mide DESPUÉS de esperar, para que incluya la espera."),
      test("SDL_DelayPrecise recibe…", ["milisegundos", "nanosegundos", "segundos", "frames"], 1, "Por eso se multiplica por 1.000.000 (ms → ns)."),
      test("Diferencia entre SDL_Delay y SDL_DelayPrecise:", ["Ninguna", "SDL_Delay duerme en ms y puede pasarse; SDL_DelayPrecise espera activamente al final y es más exacto (gasta algo de CPU)", "DelayPrecise es para audio", "SDL_Delay no existe en SDL3"], 1, ""),
      test("¿Qué hace el VSYNC (`SDL_SetRenderVSync(renderer, 1)`)?", ["Más fps", "RenderPresent espera al refresco del monitor: limita los fps a los Hz de la pantalla y evita el tearing", "Nada", "Baja la resolución"], 1, "Con VSYNC activo, un 144 Hz va a 144 fps: por eso necesitas dt igualmente."),
      test("El jugador se mueve 4 px por frame. A 30 fps y a 144 fps…", ["va igual", "va casi 5 veces más rápido a 144", "va más rápido a 30", "no se mueve"], 1, "Por eso se multiplica por dt."),
      escribe("Escribe cómo mueves `x` con `speed` (px/s) si `dt` está en milisegundos.", [/^x\+=speed\*dt\/1000(\.0f?|f)?$/, /^x\+=speed\*\(dt\/1000(\.0f?|f)?\)$/, /^x=x\+speed\*dt\/1000(\.0f?|f)?$/], "dt en ms: divide entre 1000 para pasar a segundos.", { sol: "x += speed * dt / 1000.0f;", ph: "x += ..." }),
      bug("El jugador sale disparado nada más empezar a moverse.", [
        "float speed = 200.0f;          // px/s",
        "position.x += speed * dt;      // dt = 16.6 (ms)"], 1, "Mezcla px/s con ms: va 1000 veces demasiado rápido. Usa `dt / 1000.0f` o una velocidad en px/ms (0.2)."),
      test("¿Para qué sirve `if (dt > 100) dt = 100;`?", ["Para ir más rápido", "Si paras en un breakpoint, el siguiente frame duraría segundos y todo se teletransportaría", "Para el VSYNC", "Para el audio"], 1, ""),
      test("¿Qué es el promedio de fps de los últimos segundos?", ["Lo mismo que el fps del último frame", "frames contados / segundos transcurridos: más estable para el título de la ventana", "Imposible de calcular", "dt × 60"], 1, ""),
      huecos("Título con datos de debug.", String.raw`char title[256];
SDL_snprintf(title, sizeof(title), "FPS: %▢ | dt: %.2f ms", averageFps, dt);
SDL_▢(window, title);`, [".2f", "SetWindowTitle", "d", "SetTitle", "s"], [".2f", "SetWindowTitle"], ""),
      test("¿Por qué Box2D prefiere un paso fijo (`b2World_Step(world, 1/60.0f, 4)`) aunque tú tengas dt variable?", ["No lo prefiere", "La simulación es estable y reproducible con pasos iguales; con dt variable los saltos cambian de altura", "Es más rápido", "Por el VSYNC"], 1, "Si el juego no va a 60 fijos, acumula dt y da los pasos fijos que toquen."),
      test("Tienes `int camera.x` y sumas `0.8f` cada frame. ¿Qué pasa?", ["Se mueve 0.8", "No se mueve nunca: se trunca a 0", "Se mueve 1", "Crash"], 1, "Usa float para posiciones y redondea solo al dibujar.")
    ]
  });
})();
