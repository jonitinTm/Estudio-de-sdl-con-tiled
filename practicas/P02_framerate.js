Curso.practica({
  leccion: "l02",
  titulo: "Programa Timer, PerfTimer y el contador de FPS",
  intro: "Escribirás las dos clases de tiempo del motor y luego las usarás para calcular los FPS del último segundo y la media de toda la partida.",
  pasos: [
    {
      t: "Timer::Start(): apuntar la hora",
      exp: `<p>Un temporizador es tan simple como: “apunto la hora al empezar y, cuando me preguntan, resto la hora actual menos la apuntada”. <code>SDL_GetTicks()</code> devuelve los milisegundos desde que arrancó SDL. Guarda ese valor en el atributo <code>startTime</code>.</p>`,
      code: String.raw`
void Timer::Start()
{
    startTime = §s1§;
}`,
      slots: { s1: { ok: ["SDL_GetTicks()"], err: [[/^SDL_GetTicks$/, "Es una función: le faltan los paréntesis <code>()</code> para llamarla."], [/^SDL_GetPerformanceCounter\(\)$/, "Ese es el reloj preciso, para PerfTimer. Timer usa el de milisegundos."]] } },
      pistas: ["Es una función de SDL que devuelve “ticks” en milisegundos.", "<code>SDL_Get…()</code>"],
      bien: "<p>Una sola línea. Fíjate en que <code>Start()</code> también sirve para <em>reiniciar</em> el temporizador: vuelve a apuntar la hora.</p>"
    },
    {
      t: "Timer::ReadMSec(): ¿cuánto ha pasado?",
      exp: `<p>Lo transcurrido es <em>ahora − inicio</em>. Devuélvelo como float.</p>`,
      code: String.raw`
float Timer::ReadMSec() const
{
    return (float)(§s1§ - §s2§);
}`,
      slots: {
        s1: { ok: ["SDL_GetTicks()"], err: [[/^startTime$/, "Al revés: es AHORA menos el inicio; si no, te sale negativo."]] },
        s2: { ok: ["startTime"], err: [[/^SDL_GetTicks\(\)$/, "Al revés: es AHORA menos el inicio."]] }
      },
      pistas: ["Ahora = <code>SDL_GetTicks()</code>. Inicio = el atributo que rellenaste en Start."],
      bien: "<p>El <code>const</code> del final indica que leer el tiempo no modifica el objeto. Es buena costumbre en todas las funciones “Get/Read”.</p>"
    },
    {
      t: "Timer::ReadSec(): en segundos",
      exp: `<p>Igual que antes, pero pasado a segundos (enteros).</p>`,
      code: String.raw`
int Timer::ReadSec() const
{
    return (SDL_GetTicks() - startTime) / §s1§;
}`,
      slots: { s1: { ok: ["1000", "1000u"], err: [[/^60$/, "60 serían minutos. ¿Cuántos ms tiene un segundo?"], [/^1000\.0*f?$/, "Con 1000.0 obtendrías decimales, pero la función devuelve int. Aquí queremos división entera: 1000."]], w: 6 } },
      pistas: ["¿Cuántos milisegundos hay en un segundo?"],
      bien: "<p>Aquí la división entera es justo lo que queremos: 2500 ms / 1000 = 2 segundos completos.</p>"
    },
    {
      t: "PerfTimer: la frecuencia, una sola vez",
      exp: `<p>El contador de alto rendimiento cuenta “ticks” de hardware. Para saber cuántos ticks son un segundo, SDL te da la <strong>frecuencia</strong>. Es constante, así que la guardamos en un atributo <code>static</code> (compartido por todos los PerfTimer) y solo la pedimos si aún vale 0.</p>`,
      code: String.raw`
uint64_t PerfTimer::frequency = 0;

PerfTimer::PerfTimer()
{
    if (frequency == 0)
        frequency = §s1§;
    Start();
}

void PerfTimer::Start()
{
    startTime = §s2§;
}`,
      slots: {
        s1: { ok: ["SDL_GetPerformanceFrequency()"], err: [[/^SDL_GetPerformanceCounter\(\)$/, "Counter es la lectura; aquí queremos la FRECUENCIA (ticks por segundo)."]] },
        s2: { ok: ["SDL_GetPerformanceCounter()"], err: [[/^SDL_GetTicks\(\)$/, "PerfTimer usa el contador de alta precisión, no los ticks en ms."], [/^SDL_GetPerformanceFrequency\(\)$/, "Para empezar a medir queremos la LECTURA actual del contador, no la frecuencia."]] }
      },
      pistas: ["Las dos funciones empiezan por <code>SDL_GetPerformance</code>.", "Una termina en <em>Frequency</em> y la otra en <em>Counter</em>."],
      bien: "<p><code>static</code> en un atributo significa que existe una sola copia para toda la clase. Por eso hay que definirlo fuera, en el .cpp: <code>uint64_t PerfTimer::frequency = 0;</code></p>"
    },
    {
      t: "PerfTimer::ReadMs(): ticks → milisegundos",
      exp: `<p>Escribe el cuerpo: (ticks transcurridos / ticks por segundo) da segundos; multiplica por 1000 para tener ms. <strong>Cuidado con la división entera</strong>: los dos son enteros, conviértelos a <code>double</code>.</p>`,
      escribe: {
        antes: String.raw`double PerfTimer::ReadMs() const
{`,
        despues: "}",
        filas: 3,
        checks: [
          [/^return/, "La función tiene que devolver el valor: empieza por <code>return</code>."],
          [/SDL_GetPerformanceCounter\(\)-startTime/, "Calcula los ticks transcurridos: <code>SDL_GetPerformanceCounter() - startTime</code>."],
          [/frequency/, "Divide entre <code>frequency</code> para pasar de ticks a segundos."],
          [/1000/, "Multiplica por 1000 para pasar de segundos a milisegundos."],
          [/\(double\)|static_cast<double>|1000\.0|\(float\)/, "Si divides dos enteros pierdes los decimales (15 / 1000 = 0). Convierte a double: <code>(double)</code> o usa <code>1000.0</code>."]
        ],
        sol: String.raw`    return 1000.0 * (double)(SDL_GetPerformanceCounter() - startTime) / (double)frequency;`
      },
      pistas: ["Fórmula: <code>1000.0 * transcurridos / frecuencia</code>.", "Empezar con <code>1000.0 *</code> ya convierte el resto de la operación a double."],
      bien: "<p>Con esto puedes medir funciones con precisión de microsegundos. Lo usarás para el TODO 5 (medir cada módulo) y para comprobar los delays de la L03.</p>"
    },
    {
      t: "Medir el Awake del Engine",
      exp: `<p>Para medir un trozo de código: creas un Timer al principio (su constructor llama a Start) y al final lees cuánto ha pasado. Completa el principio y el LOG.</p>`,
      code: String.raw`
bool Engine::Awake()
{
    §s1§ timer;
    bool result = true;
    for (const auto& module : moduleList) {
        result = module->Awake();
        if (!result) break;
    }
    LOG("Timer App Awake(): %f", timer.§s2§);
    return result;
}`,
      slots: {
        s1: { ok: ["Timer", "PerfTimer"], err: [[/^timer$/, "Primero el TIPO (la clase, con mayúscula) y luego el nombre de la variable."]] },
        s2: { ok: ["ReadMSec()", "ReadMs()"], err: [[/^ReadSec\(\)$/, "En segundos casi siempre saldría 0: usa los milisegundos."], [/^ReadMSec$/, "Faltan los paréntesis de la llamada."]] }
      },
      pistas: ["Declarar una variable: <code>Tipo nombre;</code>", "El método que devuelve milisegundos lo escribiste en el paso 2."],
      bien: "<p>Este patrón (crear, ejecutar, leer, LOG) es el profiling más básico. Apuesta antes de ejecutar: ¿Awake o Start será más lento? (Start carga texturas: suele ganar).</p>"
    },
    {
      t: "Los FPS del último segundo",
      exp: `<p>En <code>FinishUpdate()</code> (al final de cada frame) hay que contar frames. Usamos un <code>Timer lastSecFrameTime</code> como ventana de 1 segundo y un contador <code>lastSecFrameCount</code>. Escribe la lógica:</p><ol><li>Suma 1 al contador de frames de este segundo.</li><li>Si el timer pasa de 1000 ms: guarda el contador en <code>framesPerSecond</code>, ponlo a 0 y reinicia el timer.</li></ol>`,
      escribe: {
        antes: String.raw`void Engine::FinishUpdate()
{
    frameCount++;`,
        despues: String.raw`    // ... (siguiente paso: media)
}`,
        filas: 8,
        checks: [
          [/lastSecFrameCount\+\+|\+\+lastSecFrameCount|lastSecFrameCount\+=1/, "Primero suma 1 a <code>lastSecFrameCount</code>."],
          [/if\(lastSecFrameTime\.ReadMSec\(\)>=?1000(\.0*f?)?\)/, "Necesitas un <code>if (lastSecFrameTime.ReadMSec() &gt; 1000)</code>."],
          [/framesPerSecond=lastSecFrameCount;/, "Dentro del if, guarda el resultado: <code>framesPerSecond = lastSecFrameCount;</code>"],
          [/lastSecFrameCount=0;/, "Reinicia el contador: <code>lastSecFrameCount = 0;</code>"],
          [/lastSecFrameTime\.Start\(\);/, "Reinicia la ventana de un segundo: <code>lastSecFrameTime.Start();</code>"],
          [/framesPerSecond=lastSecFrameCount;.*lastSecFrameCount=0;/, "Orden: primero copia a framesPerSecond y DESPUÉS pon el contador a 0 (si no, siempre guardarías 0)."]
        ],
        sol: String.raw`    lastSecFrameCount++;
    if (lastSecFrameTime.ReadMSec() > 1000)
    {
        framesPerSecond = lastSecFrameCount;
        lastSecFrameCount = 0;
        lastSecFrameTime.Start();
    }`
      },
      pistas: ["Es un contador que se “vacía” cada segundo.", "Dentro del if van tres líneas: copiar, poner a cero, reiniciar timer."],
      bien: "<p>Este número responde rápido a los picos de lag; por eso es el que se suele mostrar en pantalla.</p>"
    },
    {
      t: "La media de toda la partida",
      exp: `<p><code>averageFps</code> = frames totales / segundos totales. Ojo: los dos son enteros y queremos decimales.</p>`,
      code: String.raw`    secondsSinceStartup = startupTime.ReadSec();
    if (secondsSinceStartup > 0)
        averageFps = §s1§ / §s2§;`,
      slots: {
        s1: { ok: ["(float)frameCount", "static_cast<float>(frameCount)", "(double)frameCount", "frameCount"], err: [[/^framesPerSecond$/, "Para la media de TODA la partida usa los frames totales (frameCount)."]], w: 20, sol: "(float)frameCount" },
        s2: { ok: ["secondsSinceStartup", "(float)secondsSinceStartup"], err: [[/^dt$/, "dt es lo que duró UN frame; aquí queremos el tiempo total."]], w: 20 }
      },
      pistas: ["Media = total de frames / total de segundos.", "<code>(float)frameCount</code> evita la división entera si secondsSinceStartup es int."],
      bien: "<p>¿Por qué el <code>if</code>? En el primer segundo secondsSinceStartup vale 0 y dividir entre 0 da infinito. Con esto tienes las cinco medidas del TODO 4.</p>"
    }
  ]
});
