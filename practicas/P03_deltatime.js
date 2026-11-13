Curso.practica({
  leccion: "l03",
  titulo: "Limita los FPS y mueve la cámara con dt",
  intro: "Primero programarás el frame cap (esperar lo que sobra de cada frame) y después harás que la cámara vaya a la misma velocidad a 15 o a 240 fps.",
  pasos: [
    {
      t: "¿Cuánto debe durar un frame?",
      exp: `<p>Si quieres <code>targetFrameRate</code> frames por segundo, cada frame tiene un presupuesto de 1000 / targetFrameRate milisegundos. Usa decimales para que 1000/60 no se quede en 16.</p>`,
      code: String.raw`
void Engine::FinishUpdate()
{
    double maxFrameDuration = §s1§ / targetFrameRate;`,
      slots: { s1: { ok: [/^1000\.0*f?$/, /^1000\.$/], err: [[/^1000$/, "Si targetFrameRate es int, 1000 / 60 da 16 (división entera). Escribe <code>1000.0</code>."], [/^1$/, "1 / fps te da SEGUNDOS. Aquí trabajamos en milisegundos."]], w: 8, sol: "1000.0" } },
      pistas: ["1 segundo = 1000 ms.", "Pon un <code>.0</code> para que sea división con decimales."],
      bien: "<p>A 60 fps: 16.67 ms. A 30 fps: 33.33 ms.</p>"
    },
    {
      t: "¿Cuánto llevamos?",
      exp: `<p><code>frameTime</code> es el PerfTimer que se arrancó en <code>PrepareUpdate()</code>, al empezar el frame. Lee cuántos ms lleva.</p>`,
      code: String.raw`    double elapsed = §s1§;`,
      slots: { s1: { ok: ["frameTime.ReadMs()"], err: [[/^frameTime\.ReadMs$/, "Faltan los paréntesis."], [/^dt$/, "dt es lo que duró el frame ANTERIOR. Lee el timer de este frame."]], w: 20 } },
      pistas: ["Es un método del PerfTimer que programaste en la L02."],
      bien: ""
    },
    {
      t: "Esperar lo que sobra",
      exp: `<p>Si el frame ha ido más rápido que el presupuesto, hay que esperar la diferencia. Escribe el <code>if</code> y la espera con <code>SDL_DelayPrecise</code>, que recibe <strong>nanosegundos</strong> (1 ms = 1.000.000 ns).</p>`,
      escribe: {
        filas: 6,
        checks: [
          [/if\(elapsed<maxFrameDuration\)|if\(maxFrameDuration>elapsed\)/, "Solo hay que esperar si <code>elapsed &lt; maxFrameDuration</code>."],
          [/SDL_Delay(Precise|NS)?\(/, "Llama a una función de espera: <code>SDL_DelayPrecise(...)</code>."],
          [/maxFrameDuration-elapsed/, "Lo que hay que esperar es <code>maxFrameDuration - elapsed</code>."],
          [/SDL_Delay\(|1000000|1e6|1'000'000/, "SDL_DelayPrecise / SDL_DelayNS reciben NANOsegundos: multiplica los ms por 1000000."]
        ],
        prohibido: [[/elapsed-maxFrameDuration/, "Al revés: lo que sobra es presupuesto − gastado (<code>maxFrameDuration - elapsed</code>); si no, sale negativo."]],
        sol: String.raw`    if (elapsed < maxFrameDuration)
    {
        double waitMs = maxFrameDuration - elapsed;
        SDL_DelayPrecise((Uint64)(waitMs * 1000000.0));
    }`
      },
      pistas: ["Primero calcula <code>double waitMs = maxFrameDuration - elapsed;</code>", "Luego <code>SDL_DelayPrecise((Uint64)(waitMs * 1000000.0));</code>"],
      bien: "<p>Si el frame ya se ha pasado del presupuesto no se espera nada (no se puede recuperar el tiempo). Con <code>SDL_Delay(ms)</code> también funcionaría, pero es menos preciso (prueba a medirlo con un PerfTimer: es el TODO 2).</p>"
    },
    {
      t: "dt, después de esperar",
      exp: `<p>Ahora sí: calcula dt leyendo el timer del frame <strong>después</strong> del delay, para que incluya la espera.</p>`,
      code: String.raw`    }   // fin del if

    dt = §s1§;`,
      slots: { s1: { ok: ["frameTime.ReadMs()", "(float)frameTime.ReadMs()"], err: [[/^elapsed$/, "elapsed se leyó ANTES de esperar; no incluye la espera. Vuelve a leer el timer."], [/^maxFrameDuration$/, "Eso es lo que DEBERÍA durar; dt es lo que ha durado de verdad."]], w: 22 } },
      pistas: ["Es la misma lectura del paso 2."],
      bien: "<p>Si usaras <code>elapsed</code>, dt sería más pequeño de lo real y todo lo que multipliques por dt iría lento.</p>"
    },
    {
      t: "Velocidad × dt",
      exp: `<p>En Scene, <code>camSpeed</code> está en píxeles por <strong>segundo</strong>. Calcula cuánto se mueve la cámara este frame. En este motor <code>dt</code> llega en <strong>milisegundos</strong>.</p>`,
      code: String.raw`
bool Scene::Update(float dt)
{
    float camSpeed = 200.0f;          // px por segundo
    float move = camSpeed * §s1§;`,
      slots: { s1: { ok: [/^dt\/1000(\.0*)?f?$/, /^\(dt\/1000(\.0*)?f?\)$/, /^\(?dt\*0\.001f?\)?$/], err: [[/^dt$/, "dt está en ms: 200 × 16 = 3200 px por frame. ¡Saldría disparada! Pásalo a segundos dividiendo entre 1000."], [/^1\/dt$/, "Eso sería “por frame” al revés. Multiplica por el tiempo, no por su inverso."]], w: 14, sol: "dt / 1000.0f" } },
      pistas: ["px/s × s = px. Tienes ms: conviértelos a segundos.", "<code>dt / 1000.0f</code>"],
      bien: "<p>Si en tu handout dt ya viene en segundos, aquí sería solo <code>dt</code>. Compruébalo siempre: es la causa número uno de “mi personaje sale volando”.</p>"
    },
    {
      t: "Mover la cámara con las flechas",
      exp: `<p>Escribe los cuatro <code>if</code> para las flechas. Usa <code>input-&gt;GetKey(SDL_SCANCODE_LEFT) == KEY_REPEAT</code> (tecla mantenida) y suma o resta <code>move</code> a <code>camera.x</code> / <code>camera.y</code>. En este motor la cámara va “al revés”: flecha izquierda → <code>camera.x += move</code>.</p>`,
      escribe: {
        antes: String.raw`    auto& input  = Engine::GetInstance().input;
    auto& camera = Engine::GetInstance().render->camera;`,
        despues: String.raw`    return true;
}`,
        filas: 6,
        checks: [
          [/GetKey\(SDL_SCANCODE_LEFT\)==KEY_REPEAT/, "Falta la flecha izquierda: <code>input-&gt;GetKey(SDL_SCANCODE_LEFT) == KEY_REPEAT</code>."],
          [/GetKey\(SDL_SCANCODE_RIGHT\)==KEY_REPEAT/, "Falta la flecha derecha (SDL_SCANCODE_RIGHT)."],
          [/GetKey\(SDL_SCANCODE_UP\)==KEY_REPEAT/, "Falta la flecha arriba (SDL_SCANCODE_UP)."],
          [/GetKey\(SDL_SCANCODE_DOWN\)==KEY_REPEAT/, "Falta la flecha abajo (SDL_SCANCODE_DOWN)."],
          [/camera\.x\+=move/, "Alguna flecha debe hacer <code>camera.x += move;</code>"],
          [/camera\.x-=move/, "Alguna flecha debe hacer <code>camera.x -= move;</code>"],
          [/camera\.y(\+|-)=move/, "Las flechas arriba/abajo cambian <code>camera.y</code>."]
        ],
        prohibido: [[/KEY_DOWN/, "KEY_DOWN solo es true el frame en que se PULSA. Para mover mientras mantienes, usa KEY_REPEAT."]],
        sol: String.raw`    if (input->GetKey(SDL_SCANCODE_UP)    == KEY_REPEAT) camera.y += move;
    if (input->GetKey(SDL_SCANCODE_DOWN)  == KEY_REPEAT) camera.y -= move;
    if (input->GetKey(SDL_SCANCODE_LEFT)  == KEY_REPEAT) camera.x += move;
    if (input->GetKey(SDL_SCANCODE_RIGHT) == KEY_REPEAT) camera.x -= move;`
      },
      pistas: ["Cada línea: <code>if (input-&gt;GetKey(TECLA) == KEY_REPEAT) camera.x += move;</code>", "Usa <code>-&gt;</code> porque input es un puntero (shared_ptr)."],
      bien: "<p>Ahora cambia targetFrameRate a 15, 60 y 240: la cámara debe moverse exactamente igual de rápido. Si <code>camera.x</code> fuese <code>int</code>, a 240 fps move ≈ 0.8 se truncaría a 0: usa float.</p>"
    }
  ]
});
