(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "l03", num: "03", grupo: "Bloque 1 · El motor", corto: "Delta time", pdf: "L03_DeltaTime",
    titulo: "Delta time, frame cap y VSYNC",
    resumen: "Movimiento independiente del framerate con dt, limitar fps con SDL_Delay y evitar tearing con VSYNC.",
    intro: "Si mueves al jugador “1 píxel por frame”, en un PC rápido corre más que en uno lento. La solución es pensar en unidades por segundo y multiplicar por el tiempo que ha durado el frame: el delta time.",
    objetivos: ["Detectar código dependiente del framerate", "Usar x = x + velocidad · dt", "Limitar el framerate con SDL_Delay / DelayNS / DelayPrecise", "Saber qué es tearing, stutter y VSYNC"],
    html: () => `
<h2>El problema</h2>
${code(`void Update() {
    x = x + 1;      // 1 píxel por FRAME
}`, "cpp")}
<p>Si empieza en X=0, ¿dónde estará en 1 segundo? <strong>Depende de los fps</strong>: a 30 fps estará en 30, a 60 fps en 60. Si los fps varían (otro programa abierto, una explosión con muchas partículas), el objeto acelera y frena. Tu juego se comportaría distinto en cada ordenador.</p>

<h2>La solución: delta time</h2>
<p><strong>Delta</strong> significa diferencia. <code>dt</code> es el tiempo entre el frame anterior y el actual. Si expresas la velocidad en <strong>píxeles por segundo</strong> y la multiplicas por dt (en segundos), obtienes cuánto moverte <em>en este frame</em>:</p>
${code(`x = x + velocidad * dt;     // velocidad en px/s, dt en segundos

30 fps -> dt = 0.033 s ->  30 frames · (v · 0.033)  = v
60 fps -> dt = 0.0167 s -> 60 frames · (v · 0.0167) = v
// en 1 segundo ambos recorren exactamente v píxeles`, "cpp")}

${demo("d-dt", "Dos ordenadores, la misma partida", "Compara las dos formas de mover", `
<canvas id="dt-cv"></canvas>
<div class="controls">
  <label>PC lento <select id="fpsA"><option>15</option><option selected>30</option><option>60</option></select> fps</label>
  <label>PC rápido <select id="fpsB"><option>60</option><option selected>144</option><option>240</option></select> fps</label>
  <button type="button" class="btn" id="dt-reset">Reiniciar carrera</button>
</div>
<div class="readout" id="dt-out"></div>`)}
<p>Las dos barras de arriba usan <code>x += 2</code> por frame: el PC rápido gana siempre. Las dos de abajo usan <code>x += 120 * dt</code>: llegan juntas (el PC lento se mueve a saltos más grandes, pero al mismo ritmo).</p>

${nota(`<p>Regla práctica: cualquier cosa que cambie <em>de forma continua</em> (posición, rotación, temporizadores, fades, animaciones) se multiplica por dt. Los eventos puntuales (“al pulsar espacio, salta”) no.</p>`)}

<h2>Por qué además limitamos los fps</h2>
<p>El bucle, por defecto, va tan rápido como pueda el PC. Eso gasta CPU para nada y hace que cada frame dure distinto. Si lo limitamos (por ejemplo a 60):</p>
<ul>
<li>Cada frame tiene el mismo presupuesto de tiempo.</li>
<li>Mientras esperamos, la CPU vuelve al sistema operativo (menos consumo, menos calor).</li>
<li>Los picos de código lento se esconden si caben en el presupuesto.</li>
<li>El juego es más predecible.</li>
</ul>

<h3>Tearing y stutter</h3>
<p>El monitor se refresca a su ritmo (60 Hz, 144 Hz…). Si la GPU entrega un frame nuevo <em>mientras</em> el monitor está pintando, la pantalla muestra arriba un frame y abajo otro: <strong>tearing</strong> (imagen “rasgada”). Si los frames llegan a destiempo y uno se repite, el movimiento da tirones: <strong>stutter</strong>.</p>
${demo("d-tear", "Tearing", "Activa y desactiva VSYNC", `
<canvas id="tear-cv"></canvas>
<div class="controls"><label><input type="checkbox" id="vsync"> VSYNC activado</label></div>`)}

<h3>VSYNC vs frame cap</h3>
<div class="table-wrap"><table class="t"><thead><tr><th></th><th>VSYNC</th><th>Frame cap (tu código)</th></tr></thead><tbody>
<tr><td>Limita los fps</td><td>Sí, a la frecuencia del monitor</td><td>Sí, al valor que elijas</td></tr>
<tr><td>Evita tearing</td><td>Sí</td><td>No</td></tr>
<tr><td>Dónde ocurre</td><td>Driver de la tarjeta gráfica</td><td>En tu bucle, con SDL_Delay</td></tr>
<tr><td>En SDL3</td><td><code>SDL_SetRenderVSync(renderer, 1)</code></td><td><code>SDL_Delay / SDL_DelayNS / SDL_DelayPrecise</code></td></tr>
</tbody></table></div>

<h2>Los TODOs del handout</h2>
${todo("TODO 1", "Engine.cpp → FinishUpdate()", `<p>Limita el framerate usando <code>targetFrameRate</code> (definido en Engine.h). Calcula cuánto debería durar un frame, mira cuánto ha durado ya y, si sobra tiempo, espera la diferencia.</p>`,
      code(String.raw`
void Engine::FinishUpdate()
{
    // Duración ideal de un frame en ms (60 fps -> 16.67 ms)
    double maxFrameDuration = 1000.0 / targetFrameRate;

    // Lo que llevamos gastado en este frame
    double elapsed = frameTime.ReadMs();

    if (elapsed < maxFrameDuration) {
        double waitMs = maxFrameDuration - elapsed;

        PerfTimer delayTimer;                                   // TODO 2: medir la espera
        SDL_DelayPrecise((Uint64)(waitMs * 1000000.0));         // en nanosegundos
        // SDL_Delay((Uint32)waitMs);                           // ms, poco preciso
        // SDL_DelayNS((Uint64)(waitMs * 1000000.0));           // ns, se pasa un poco
        LOG("Pedí %.3f ms y esperé %.3f ms", waitMs, delayTimer.ReadMs());
    }

    // IMPORTANTE: dt se calcula DESPUÉS de esperar, para incluir la espera
    dt = frameTime.ReadMs();
    // ... resto de cálculos de la L02 (frameCount, fps, título)
}`, "cpp", "Engine.cpp"))}

${todo("TODO 2", "Engine.cpp", `<p>Mide con un <code>PerfTimer</code> cuánto espera <em>de verdad</em> cada función de delay y compáralo con lo que pediste.</p>`,
      `<p>Ya está en la solución del TODO 1 (<code>delayTimer</code>). Lo que deberías observar:</p>
      <ul><li><code>SDL_Delay()</code>: trabaja en ms enteros y el sistema operativo te despierta tarde (1–2 ms de más).</li>
      <li><code>SDL_DelayNS()</code>: devuelve la CPU al SO y pide que le despierten; se pasa por una cantidad variable.</li>
      <li><code>SDL_DelayPrecise()</code>: hace lo mismo y los últimos instantes espera “activamente” (busy-wait). Es la más exacta, pero gasta algo de CPU.</li>
      <li>Ninguna espera <em>menos</em> de lo pedido.</li></ul>`)}

${todo("TODO 3", "Scene.cpp → Update(float dt)", `<p>Haz que la cámara se mueva igual de rápido a 240, 144, 60, 30 y 15 fps. <code>camSpeed</code> ahora es px/s (prueba 200).</p>`,
      code(String.raw`
bool Scene::Update(float dt)
{
    float camSpeed = 200.0f;              // píxeles por SEGUNDO
    float move = camSpeed * dt / 1000.0f; // si tu dt está en ms; quita /1000 si está en s

    auto& input  = Engine::GetInstance().input;
    auto& camera = Engine::GetInstance().render->camera;

    if (input->GetKey(SDL_SCANCODE_UP)    == KEY_REPEAT) camera.y += move;
    if (input->GetKey(SDL_SCANCODE_DOWN)  == KEY_REPEAT) camera.y -= move;
    if (input->GetKey(SDL_SCANCODE_LEFT)  == KEY_REPEAT) camera.x += move;
    if (input->GetKey(SDL_SCANCODE_RIGHT) == KEY_REPEAT) camera.x -= move;
    return true;
}`, "cpp", "Scene.cpp"))}

${nota(`<p>Si <code>camera.x</code> es un <code>int</code> y <code>move</code> vale 0.8, al sumar se trunca a 0 y la cámara <strong>no se mueve</strong> a fps altos. Usa <code>float</code> para posiciones y redondea solo al dibujar.</p>`, "warn")}

<h2>Donde dt ya no basta</h2>
<p>Multiplicar por dt es exacto para velocidad constante. Pero con <strong>aceleración</strong> (gravedad, saltos) el resultado cambia un poco con el framerate, porque la velocidad cambia <em>durante</em> el frame y tú solo la actualizas al final. Un salto a 15 fps no llega a la misma altura que a 144 fps.</p>
${code(String.raw`
// Integración "semi-implícita de Euler": casi bien, pero depende del dt
vy += gravity * dt;
y  += vy * dt;

// Solución de los motores de física: paso de tiempo FIJO (lo verás en L08 con Box2D)
accumulator += dt;
while (accumulator >= FIXED_DT) {     // p. ej. FIXED_DT = 1/60 s
    PhysicsStep(FIXED_DT);            // siempre el mismo paso -> resultado idéntico
    accumulator -= FIXED_DT;
}`, "cpp", "Vista previa de la L08")}

${nota(`<p>Tus teclas <kbd>F11</kbd> (límite a 30 fps) y <kbd>F8</kbd> (VSYNC) sirven exactamente para probar esta lección: si al pulsar F11 el caballero corre o salta distinto, hay algo que no está multiplicado por dt (o la física no usa paso fijo).</p>`, "game")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "Un enemigo hace x += 3 cada frame. ¿Qué pasa en un PC que va al doble de fps?", o: ["Nada", "Va el doble de rápido", "Va la mitad de rápido"], c: 1, e: "Al doble de frames por segundo, se suma 3 el doble de veces." },
      { p: "velocidad = 150 px/s, dt = 0.02 s. ¿Cuánto se mueve en este frame?", o: ["150 px", "3 px", "7.5 px"], c: 1, e: "150 · 0.02 = 3 píxeles." },
      { p: "¿Qué evita el VSYNC que no evita el frame cap?", o: ["El consumo de CPU", "El tearing", "El input lag"], c: 1, e: "El frame cap limita fps pero no sincroniza con el refresco del monitor." },
      { p: "¿Dónde debes calcular dt en FinishUpdate()?", o: ["Antes del delay", "Después del delay", "Da igual"], c: 1, e: "dt debe incluir el tiempo de espera; si no, todo irá más lento de lo que debería." },
      { p: "¿Cuál de estas funciones es la más precisa esperando?", o: ["SDL_Delay", "SDL_DelayNS", "SDL_DelayPrecise"], c: 2, e: "Duerme y luego hace busy-wait el último tramo." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#dt-cv"), ctx = Curso.canvas(cv, 640, 250);
      const fa = root.querySelector("#fpsA"), fb = root.querySelector("#fpsB"), out = root.querySelector("#dt-out");
      let t, lanes;
      const reset = () => { t = 0; lanes = [0, 0, 0, 0].map(() => ({ x: 0, acc: 0 })); };
      reset();
      Curso.on(root.querySelector("#dt-reset"), "click", reset);
      [fa, fb].forEach((s) => Curso.on(s, "change", reset));
      const conf = () => [
        { fps: +fa.value, modo: "frame", label: "PC lento · x += 2" },
        { fps: +fb.value, modo: "frame", label: "PC rápido · x += 2" },
        { fps: +fa.value, modo: "dt", label: "PC lento · x += 120·dt" },
        { fps: +fb.value, modo: "dt", label: "PC rápido · x += 120·dt" }];
      Curso.bucle((dt) => {
        t += dt;
        const c = conf();
        lanes.forEach((ln, i) => {
          ln.acc += dt;
          const fdt = 1 / c[i].fps;
          while (ln.acc >= fdt) { ln.acc -= fdt; ln.x += c[i].modo === "frame" ? 2 : 120 * fdt; }
        });
        if (lanes.some((l) => l.x > 560)) reset();
        ctx.clearRect(0, 0, 640, 250);
        ctx.font = "12px JetBrains Mono, monospace";
        lanes.forEach((ln, i) => {
          const y = 14 + i * 58 + (i >= 2 ? 10 : 0);
          ctx.fillStyle = Curso.color("surface"); ctx.fillRect(0, y, 640, 44);
          ctx.fillStyle = Curso.color("ink-2"); ctx.fillText(c[i].label + `  (${c[i].fps} fps)`, 8, y + 14);
          ctx.fillStyle = i < 2 ? Curso.color("amber") : Curso.color("accent");
          ctx.fillRect(40 + ln.x, y + 20, 20, 20);
        });
        ctx.strokeStyle = Curso.color("line"); ctx.beginPath(); ctx.moveTo(0, 129.5); ctx.lineTo(640, 129.5); ctx.stroke();
        out.innerHTML = `<span>tiempo <b>${t.toFixed(2)} s</b></span>` + lanes.map((l, i) => `<span>${["lento/frame", "rápido/frame", "lento/dt", "rápido/dt"][i]} x=<b>${l.x.toFixed(0)}</b></span>`).join("");
      });

      // --- tearing ---
      const tv = root.querySelector("#tear-cv"), tx = Curso.canvas(tv, 640, 160), vs = root.querySelector("#vsync");
      let p = 0, cut = 60;
      Curso.bucle((dt) => {
        p = (p + dt * 700) % 700;
        if (Math.random() < 0.15) cut = 20 + Math.random() * 120;
        tx.clearRect(0, 0, 640, 160);
        const drawBar = (x, y0, y1) => { tx.fillStyle = Curso.color("accent"); tx.fillRect(x - 30, y0, 60, y1 - y0); tx.fillStyle = Curso.color("amber"); tx.fillRect(x - 6, y0, 12, y1 - y0); };
        if (vs.checked) drawBar(p - 30, 0, 160);
        else { drawBar(p - 30, 0, cut); drawBar(p - 30 - 38, cut, 160); tx.strokeStyle = Curso.color("bad"); tx.setLineDash([5, 4]); tx.beginPath(); tx.moveTo(0, cut); tx.lineTo(640, cut); tx.stroke(); tx.setLineDash([]); }
        tx.fillStyle = Curso.color("ink-2"); tx.font = "12px JetBrains Mono, monospace";
        tx.fillText(vs.checked ? "Un único frame por refresco" : "Arriba frame N, abajo frame N+1 (línea roja = corte)", 8, 152);
      });
    }
  });
})();
