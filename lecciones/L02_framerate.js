(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "l02", num: "02", grupo: "Bloque 1 · El motor", corto: "Framerate", pdf: "L02_Framerate",
    titulo: "Framerate: medir el tiempo del bucle",
    resumen: "Persistencia de la visión, el game loop, qué es un frame y cómo medirlo con Timer y PerfTimer.",
    intro: "Un juego es un bucle que dibuja imágenes fijas muy deprisa. Si no sabes cuánto tarda cada vuelta, no puedes controlar la sensación de movimiento. En esta lección aprendes a medir: frames, segundos, fps y dt.",
    objetivos: ["Explicar por qué vemos movimiento a partir de 12–16 fps", "Distinguir frame, frame time y fps", "Programar Timer (SDL_GetTicks) y PerfTimer (contador de alta precisión)", "Calcular frameCount, averageFps, dt y framesPerSecond"],
    html: () => `
<h2>¿Por qué vemos movimiento?</h2>
<p>El cerebro integra imágenes que le llegan con menos de 60–80 ms de diferencia (<strong>persistencia de la visión</strong>). Por eso, a partir de unas <strong>12–16 imágenes por segundo</strong> ya percibimos movimiento continuo. El cine usa 24 fps por razones históricas.</p>
<p>La diferencia con el cine es que un vídeo ya está grabado: solo hay que reproducirlo. Un videojuego tiene que <strong>generar cada imagen en tiempo real</strong>, teniendo en cuenta lo que pulsa el jugador. Si generar una imagen tarda demasiado, el movimiento se rompe y el control se nota lento (input lag).</p>

<h2>El game loop</h2>
<p>Un bucle que da vueltas mientras el juego está abierto. En cada vuelta, sin bloquearse esperando al jugador:</p>
<ol>
<li><strong>Input</strong>: leer teclado/ratón.</li>
<li><strong>Update</strong>: procesar acciones del jugador, IA, físicas.</li>
<li><strong>Render</strong>: descartar lo que no se ve, colocar lo visible y dibujarlo en el <em>back buffer</em>, luego presentarlo.</li>
</ol>
<p>Una vuelta = un <strong>frame</strong>. Lo que tarda una vuelta = <strong>frame time</strong>. Cuántas vueltas caben en un segundo = <strong>fps</strong>.</p>
${code(`fps        = 1000 / frameTime_ms
frameTime  = 1000 / fps

60 fps  ->  16.67 ms por frame
30 fps  ->  33.33 ms por frame
144 fps ->   6.94 ms por frame`, "txt", "Las dos fórmulas que debes saberte")}

${nota(`<p>Para mantener la ilusión de movimiento, cada frame tiene un <strong>presupuesto</strong>. A 60 fps tienes 16.67 ms para hacer input + update + render. Por eso: calcula lo mínimo, dibuja solo lo visible y crea las cosas caras (texturas, colliders) al principio, no en cada frame.</p>`)}

${demo("d-loop", "Simulador del bucle de juego", "El cuadrado se mueve +4 px por frame", `
<canvas id="loop-cv"></canvas>
<div class="controls">
  <label>Trabajo por frame <input type="range" id="work" min="1" max="70" value="8"> <span id="work-v"></span></label>
  <label><input type="checkbox" id="spikes"> Picos de lag aleatorios</label>
  <label><input type="checkbox" id="cap" checked> Limitar a 60 fps</label>
</div>
<div class="readout" id="loop-out"></div>`)}
<p>Fíjate: con el límite activado y poco trabajo, cada frame dura 16.7 ms aunque el ordenador podría ir más rápido. Si el trabajo pasa de 16.7 ms, el límite ya no sirve de nada y los fps caen. Y como el cuadrado avanza “4 px por frame”, cuando caen los fps <em>también va más lento</em>. Ese problema lo arregla la lección 03.</p>

<h2>Cómo medir: dos temporizadores</h2>
<p>“Si no lo puedes medir, no lo puedes mejorar.” SDL te da dos relojes:</p>
<div class="table-wrap"><table class="t"><thead><tr><th>Función SDL</th><th>Precisión</th><th>Úsalo para</th></tr></thead><tbody>
<tr><td><code>SDL_GetTicks()</code></td><td>milisegundos desde que arrancó SDL (1 ms)</td><td><strong>Timer</strong>: medir segundos de juego, cooldowns, cosas que no necesitan precisión</td></tr>
<tr><td><code>SDL_GetPerformanceCounter()</code><br><code>SDL_GetPerformanceFrequency()</code></td><td>“ticks” de un contador de hardware (microsegundos o mejor)</td><td><strong>PerfTimer</strong>: profiling, medir cuánto tarda una función</td></tr>
</tbody></table></div>
<p>El contador de rendimiento solo tiene sentido como <em>diferencia</em> entre dos lecturas. Para pasar ticks a segundos divides por la frecuencia (ticks por segundo), que es constante durante la ejecución: por eso se guarda en una variable <code>static</code> compartida por todos los PerfTimer.</p>

${todo("TODO 1", "Timer.cpp", `<p>Rellena <code>Start()</code>, <code>ReadMSec()</code> y <code>ReadSec()</code>. Una línea cada una. Usa el atributo <code>startTime</code> y <code>SDL_GetTicks()</code>.</p>`,
      code(String.raw`
Timer::Timer()
{
    Start();
}

void Timer::Start()
{
    startTime = SDL_GetTicks();                     // apuntamos "la hora" actual
}

int Timer::ReadSec() const
{
    return (SDL_GetTicks() - startTime) / 1000;     // ms transcurridos -> segundos
}

float Timer::ReadMSec() const
{
    return (float)(SDL_GetTicks() - startTime);     // ms transcurridos
}`, "cpp", "Timer.cpp"))}

${todo("TODO 2", "PerfTimer.cpp", `<p>Rellena el constructor, <code>Start()</code>, <code>ReadMs()</code> y <code>ReadTicks()</code>. La frecuencia solo hay que pedirla una vez.</p>`,
      code(String.raw`
uint64_t PerfTimer::frequency = 0;                  // static: compartida por todos

PerfTimer::PerfTimer()
{
    if (frequency == 0)
        frequency = SDL_GetPerformanceFrequency();  // ticks por segundo
    Start();
}

void PerfTimer::Start()
{
    startTime = SDL_GetPerformanceCounter();
}

double PerfTimer::ReadMs() const
{
    // (ticks transcurridos / ticks por segundo) = segundos  ->  * 1000 = ms
    return 1000.0 * (double)(SDL_GetPerformanceCounter() - startTime) / (double)frequency;
}

uint64_t PerfTimer::ReadTicks() const
{
    return SDL_GetPerformanceCounter() - startTime;
}`, "cpp", "PerfTimer.cpp"))}

${nota(`<p>Fíjate en el <code>(double)</code>. Si divides dos enteros, C++ hace división entera y pierdes los decimales: 15 / 1000 = 0. Es el error más típico de esta lección.</p>`, "warn")}

${todo("TODO 3", "Engine.cpp", `<p>Mide cuántos ms tardan el constructor, <code>Awake()</code> y <code>Start()</code> del Engine y muéstralo con <code>LOG</code>. Antes de ejecutarlo, apuesta: ¿cuál será el más lento? (Pista: el que carga texturas y crea la ventana).</p>`,
      code(String.raw`
bool Engine::Awake()
{
    Timer timer;                    // se pone en marcha al construirse
    bool result = true;
    for (const auto& module : moduleList) {
        result = module->Awake();
        if (!result) break;
    }
    LOG("Timer App Awake(): %f", timer.ReadMSec());
    return result;
}`, "cpp", "Engine.cpp"))}

${todo("TODO 4", "Engine.cpp → PrepareUpdate() / FinishUpdate()", `<p>Calcula: <code>frameCount</code> (frames desde el inicio), <code>secondsSinceStartup</code>, <code>averageFps</code> (media de toda la partida), <code>dt</code> (lo que duró el último frame) y <code>framesPerSecond</code> (frames contados en el último segundo). Crea las variables que necesites en <code>Engine.h</code>.</p>`,
      code(String.raw`
// Engine.h  (atributos)
Timer     startupTime;          // desde que arrancó el juego
PerfTimer frameTime;            // dura un frame
Timer     lastSecFrameTime;     // ventana de 1 segundo
int       frameCount = 0;
int       framesPerSecond = 0;
int       lastSecFrameCount = 0;
float     averageFps = 0.0f;
float     secondsSinceStartup = 0.0f;
float     dt = 0.0f;

// Engine.cpp
void Engine::PrepareUpdate()
{
    frameTime.Start();                       // empieza a contar este frame
}

void Engine::FinishUpdate()
{
    frameCount++;
    secondsSinceStartup = startupTime.ReadSec();
    dt = frameTime.ReadMs();                 // ms que ha durado el frame
    lastSecFrameCount++;

    // ¿Ha pasado un segundo? -> cuántos frames cupieron en él
    if (lastSecFrameTime.ReadMSec() > 1000) {
        lastSecFrameTime.Start();
        framesPerSecond   = lastSecFrameCount;
        lastSecFrameCount = 0;
    }

    if (secondsSinceStartup > 0)
        averageFps = (float)frameCount / secondsSinceStartup;

    std::string title = "Av.FPS: " + std::to_string(averageFps) +
                        " Last sec frames: " + std::to_string(framesPerSecond) +
                        " Last dt: " + std::to_string(dt) +
                        " Frame count: " + std::to_string(frameCount);
    Engine::GetInstance().window->SetTitle(title.c_str());
}`, "cpp", "Engine.cpp"))}

${nota(`<p>Algunos handouts guardan <code>dt</code> en <strong>milisegundos</strong> y otros en <strong>segundos</strong>. Mira cómo lo usa luego Scene/Player. Si mueves algo con <code>speed * dt</code> y sale disparado, probablemente estás multiplicando px/s por milisegundos (1000 veces demasiado).</p>`, "warn", "Unidades de dt")}

${todo("TODO 5", "Audio, Render, Textures, Window, Scene", `<p>Mide el <code>Awake()</code> y el <code>Start()</code> de cada módulo por separado y muéstralo en el LOG. Así sabrás quién se come el tiempo de carga.</p>`,
      code(String.raw`
// Dentro del bucle de Engine::Start(), alrededor de cada módulo:
for (const auto& module : moduleList) {
    PerfTimer t;
    result = module->Start();
    LOG("  %s Start(): %.3f ms", module->name.c_str(), t.ReadMs());
    if (!result) break;
}`))}

${nota(`<p>En tu README pones que la ventana muestra “información del motor, rendimiento y FPS” y que <kbd>F11</kbd> activa un límite de 30 fps. Eso es justo esta lección (título de ventana con las medidas) más la siguiente (frame cap).</p>`, "game")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "A 60 fps, ¿cuánto dura como máximo un frame?", o: ["6.9 ms", "16.67 ms", "60 ms"], c: 1, e: "1000 ms / 60 = 16.67 ms." },
      { p: "¿Para qué sirve SDL_GetPerformanceFrequency()?", o: ["Para saber los fps", "Para convertir ticks del contador a tiempo real", "Para activar el VSYNC"], c: 1, e: "Ticks / frecuencia = segundos. La frecuencia es constante, por eso es static." },
      { p: "¿Qué diferencia hay entre averageFps y framesPerSecond?", o: ["Ninguna", "averageFps es la media de toda la partida; framesPerSecond son los frames del último segundo", "framesPerSecond es una media"], c: 1, e: "framesPerSecond reacciona rápido a los picos; averageFps es estable." },
      { p: "Tienes (SDL_GetPerformanceCounter() - start) / frequency y te da siempre 0. ¿Por qué?", o: ["El contador está roto", "División entera: hay que convertir a double", "Falta llamar a Start()"], c: 1, e: "Dos enteros dan división entera. Convierte a double antes de dividir." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#loop-cv"), ctx = Curso.canvas(cv, 640, 260);
      const work = root.querySelector("#work"), cap = root.querySelector("#cap"), spikes = root.querySelector("#spikes");
      const out = root.querySelector("#loop-out"), wv = root.querySelector("#work-v");
      let virt = 0, real = 0, x = 0, frames = 0, lastSecStart = 0, lastSecCount = 0, fpsLast = 0;
      const hist = [];
      Curso.bucle((dt) => {
        real += dt * 1000;
        wv.textContent = work.value + " ms";
        let n = 0;
        while (virt < real && n < 50) {
          let w = +work.value * (0.85 + Math.random() * 0.3);
          if (spikes.checked && Math.random() < 0.04) w += 25 + Math.random() * 30;
          let ft = w;
          if (cap.checked && ft < 1000 / 60) ft = 1000 / 60;
          virt += ft; frames++; lastSecCount++; x = (x + 4) % 680;
          hist.push({ w, ft }); if (hist.length > 150) hist.shift();
          if (virt - lastSecStart >= 1000) { fpsLast = lastSecCount; lastSecCount = 0; lastSecStart = virt; }
          n++;
        }
        const W = 640, H = 260;
        ctx.clearRect(0, 0, W, H);
        // pista superior
        ctx.fillStyle = Curso.color("surface"); ctx.fillRect(0, 0, W, 70);
        ctx.fillStyle = Curso.color("accent"); ctx.fillRect(x - 20, 20, 28, 28);
        // gráfica
        const gy = 90, gh = 150, scale = gh / 80;
        ctx.strokeStyle = Curso.color("line"); ctx.fillStyle = Curso.color("ink-3"); ctx.font = "11px JetBrains Mono, monospace";
        [0, 16.67, 33.33, 66.67].forEach((ms) => { const y = gy + gh - ms * scale; ctx.beginPath(); ctx.moveTo(40, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); ctx.fillText(ms.toFixed(ms ? 1 : 0), 2, y + 4); });
        const bw = (W - 44) / 150;
        hist.forEach((h, i) => {
          const bx = 42 + i * bw;
          ctx.fillStyle = Curso.color("amber"); ctx.fillRect(bx, gy + gh - Math.min(h.ft, 80) * scale, bw - 1, Math.min(h.ft, 80) * scale);
          ctx.fillStyle = Curso.color("accent"); ctx.fillRect(bx, gy + gh - Math.min(h.w, 80) * scale, bw - 1, Math.min(h.w, 80) * scale);
        });
        ctx.fillStyle = Curso.color("ink-2");
        ctx.fillText("ms por frame  ■ azul: trabajo   ■ ámbar: espera del límite", 44, gy - 6);
        const last = hist[hist.length - 1] || { ft: 0 };
        const avg = frames / (virt / 1000 || 1);
        out.innerHTML = `<span>frameCount <b>${frames}</b></span><span>dt <b>${last.ft.toFixed(2)} ms</b></span><span>framesPerSecond <b>${fpsLast}</b></span><span>averageFps <b>${avg.toFixed(1)}</b></span><span>secondsSinceStartup <b>${Math.floor(virt / 1000)}</b></span>`;
      });
    }
  });
})();
