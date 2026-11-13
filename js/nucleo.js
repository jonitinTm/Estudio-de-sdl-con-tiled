/* =====================================================================
   Núcleo del curso: registro de lecciones, router por #hash, progreso,
   resaltado de código, quizzes y utilidades para las demos en canvas.
   Para añadir una lección nueva: crea lecciones/LXX.js que llame a
   Curso.leccion({...}) y añade su <script> en index.html.
   ===================================================================== */
(function () {
  "use strict";

  const lecciones = [];
  const limpiezas = []; // funciones a ejecutar al salir de una lección (parar animaciones, listeners…)

  // ---------- Almacenamiento seguro ----------
  const store = {
    get(k, def) { try { const v = localStorage.getItem("sdlcurso." + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem("sdlcurso." + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  // ---------- Escapar HTML ----------
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // ---------- Resaltado de sintaxis mínimo (C++, XML, pseudo) ----------
  const KW = new Set("if else for while do switch case default break continue return class struct enum public private protected virtual override const static new delete this nullptr true false using namespace template typename typedef sizeof auto inline friend operator explicit noexcept final constexpr".split(" "));
  const TY = new Set("int float double bool void char unsigned long short uint8_t uint32_t int32_t uint64_t Uint32 Uint64 size_t std string vector list queue priority_queue shared_ptr unique_ptr weak_ptr make_shared map unordered_map pair Vector2D SDL_Texture SDL_Rect SDL_FRect SDL_Window SDL_Renderer SDL_Event Timer PerfTimer Engine Module Entity Player Item Enemy EntityManager EntityType Map MapData MapLayer TileSet Properties Property PhysBody Physics ColliderType bodyType Animation AnimationSet Pathfinding b2BodyId b2Vec2 b2WorldId pugi xml_document xml_node xml_attribute xml_parse_result Scene Render Textures Input Window Audio KeyState".split(" "));

  function hlCpp(src) {
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])')|(^[ \t]*#\w+[^\n]*)|(\b\d+(?:\.\d+)?f?\b)|([A-Za-z_]\w*)/gm;
    let out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      const t = m[0];
      if (m[1]) out += `<span class="t-com">${esc(t)}</span>`;
      else if (m[2]) out += `<span class="t-str">${esc(t)}</span>`;
      else if (m[3]) out += `<span class="t-pp">${esc(t)}</span>`;
      else if (m[4]) out += `<span class="t-num">${t}</span>`;
      else {
        const next = src.slice(re.lastIndex).match(/^\s*\(/);
        if (KW.has(t)) out += `<span class="t-kw">${t}</span>`;
        else if (TY.has(t) || /^SDL_[A-Z]/.test(t) && !next) out += `<span class="t-ty">${t}</span>`;
        else if (next) out += `<span class="t-fn">${t}</span>`;
        else out += t;
      }
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }
  function hlXml(src) {
    const re = /(<!--[\s\S]*?-->)|(<\/?)([\w:.-]+)|([\w:-]+)(=)("[^"]*")/g;
    let out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      if (m[1]) out += `<span class="t-com">${esc(m[1])}</span>`;
      else if (m[2]) out += `${esc(m[2])}<span class="t-tag">${esc(m[3])}</span>`;
      else out += `<span class="t-attr">${esc(m[4])}</span>=<span class="t-str">${esc(m[6])}</span>`;
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }
  function hlPseudo(src) {
    return esc(src).replace(/(#[^\n]*|\/\/[^\n]*)/g, '<span class="t-com">$1</span>')
      .replace(/\b(while|for|foreach|if|not|in|and|or|return|else)\b/g, '<span class="t-kw">$1</span>');
  }

  /** Bloque de código. lang: "cpp" | "xml" | "pseudo" | "txt". title opcional (nombre de archivo). */
  function code(src, lang = "cpp", title = "") {
    src = String(src).replace(/^\n/, "").replace(/\s+$/, "");
    const hl = lang === "cpp" ? hlCpp(src) : lang === "xml" ? hlXml(src) : lang === "pseudo" ? hlPseudo(src) : esc(src);
    const id = "c" + Math.random().toString(36).slice(2, 9);
    return `<div class="code"><div class="code-head"><span>${esc(title || lang.toUpperCase())}</span><button type="button" data-copy="${id}">Copiar</button></div><pre><code id="${id}">${hl}</code></pre></div>`;
  }

  /** Caja de nota. tipo: "" | "warn" | "game" */
  function nota(html, tipo = "", titulo = "") {
    const t = titulo || (tipo === "warn" ? "Cuidado" : tipo === "game" ? "En tu juego (SandKnight)" : "Idea clave");
    return `<div class="note ${tipo}"><span class="note-title">${t}</span>${html}</div>`;
  }

  /** Ejercicio estilo TODO del handout, con la solución escondida. */
  function todo(etiqueta, archivo, enunciadoHtml, solucionHtml) {
    return `<div class="todo"><div class="todo-head"><span class="todo-tag">${etiqueta}</span><span class="todo-file">${esc(archivo)}</span></div>${enunciadoHtml}${solucionHtml ? `<details class="sol"><summary>Ver solución</summary>${solucionHtml}</details>` : ""}</div>`;
  }

  /** Quiz: [{p, o:[...], c: índice correcto, e: explicación}] */
  function quiz(items) {
    return `<div class="quiz">${items.map((q, i) => `
      <div class="q" data-c="${q.c}">
        <p class="q-text">${i + 1}. ${q.p}</p>
        <div class="q-opts">${q.o.map((o, j) => `<button type="button" data-j="${j}">${o}</button>`).join("")}</div>
        <p class="q-exp" hidden>${q.e || ""}</p>
      </div>`).join("")}</div>`;
  }

  /** Marco de una demo interactiva. */
  function demo(id, titulo, pista, cuerpoHtml) {
    return `<section class="demo" id="${id}"><div class="demo-head"><span class="demo-title">${titulo}</span><span class="demo-hint">${pista || ""}</span></div><div class="demo-body">${cuerpoHtml}</div></section>`;
  }

  // ---------- Utilidades de canvas para las demos ----------
  function color(nombre) { return getComputedStyle(document.documentElement).getPropertyValue("--" + nombre).trim() || "#888"; }

  /** Prepara un canvas con resolución lógica w×h (escala con devicePixelRatio). Devuelve ctx. */
  function canvas(el, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = w * dpr; el.height = h * dpr;
    el.style.aspectRatio = w + " / " + h;
    const ctx = el.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.W = w; ctx.H = h;
    return ctx;
  }
  /** Convierte un evento de puntero a coordenadas lógicas del canvas. */
  function puntero(el, ev, w, h) {
    const r = el.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * w / r.width, y: (ev.clientY - r.top) * h / r.height };
  }
  /** Bucle requestAnimationFrame que se cancela al cambiar de lección. fn(dtSegundos, tiempoMs) */
  function bucle(fn) {
    let id, prev = performance.now(), vivo = true;
    const paso = (t) => { if (!vivo) return; const dt = Math.min((t - prev) / 1000, 0.1); prev = t; fn(dt, t); id = requestAnimationFrame(paso); };
    id = requestAnimationFrame(paso);
    const parar = () => { vivo = false; cancelAnimationFrame(id); };
    limpiezas.push(parar);
    return parar;
  }
  /** addEventListener que se limpia al salir de la lección. */
  function on(target, ev, fn, opts) { target.addEventListener(ev, fn, opts); limpiezas.push(() => target.removeEventListener(ev, fn, opts)); }
  /** Teclado mientras el elemento tiene el foco. Devuelve un Set de teclas pulsadas. */
  function teclado(el, onDown) {
    const keys = new Set();
    el.tabIndex = 0;
    on(el, "keydown", (e) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (!keys.has(e.code) && onDown) onDown(e);
      keys.add(e.code);
    });
    on(el, "keyup", (e) => keys.delete(e.code));
    on(el, "blur", () => keys.clear());
    return keys;
  }

  /**
   * Genera un tileset de ejemplo en un canvas fuera de pantalla, con las mismas medidas que
   * tmw_desert_spacing.png de Tiled: 8 columnas × 6 filas de 32×32, margin 1, spacing 1 (265×199).
   * opts.labels = true dibuja el índice local de cada tile.
   */
  function tilesetDemo(opts = {}) {
    const cols = 8, rows = 6, tw = 32, th = 32, margin = 1, spacing = 1;
    const W = margin * 2 + cols * tw + (cols - 1) * spacing, H = margin * 2 + rows * th + (rows - 1) * spacing;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#ff00ff"; g.fillRect(0, 0, W, H); // el "rosa" de separación típico de los tilesets
    const pal = [
      ["#e9c98f", "#d9b475", "#c79f5f"],   // fila 0: arena
      ["#b8573b", "#94432d", "#d77b55"],   // fila 1: ladrillo
      ["#9a9a9a", "#7b7b7b", "#bdbdbd"],   // fila 2: piedra
      ["#6aa84f", "#4f8a3a", "#93c47d"],   // fila 3: hierba / cactus
      ["#3d85c6", "#2b6aa3", "#6fa8dc"],   // fila 4: agua
      ["#8e7cc3", "#674ea7", "#b4a7d6"]    // fila 5: decoración
    ];
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x = margin + q * (tw + spacing), y = margin + r * (th + spacing), p = pal[r];
      g.fillStyle = p[0]; g.fillRect(x, y, tw, th);
      g.fillStyle = p[1];
      switch (r) {
        case 0: for (let i = 0; i < 6 + q; i++) g.fillRect(x + ((i * 13 + q * 7) % 30), y + ((i * 7 + q * 5) % 30), 2, 2); break;
        case 1: for (let yy = 0; yy < 4; yy++) { g.fillRect(x, y + yy * 8 + 7, tw, 1); const o = (yy % 2) * 8 + q; for (let xx = o % 16; xx < tw; xx += 16) g.fillRect(x + xx, y + yy * 8, 1, 8); } break;
        case 2: g.beginPath(); for (let i = 0; i < 4; i++) g.arc(x + 8 + (i % 2) * 16, y + 8 + Math.floor(i / 2) * 16, 5 + (q % 3), 0, 7); g.fill(); break;
        case 3: if (q < 4) { for (let i = 0; i < 8; i++) g.fillRect(x + i * 4 + 1, y + 20 - (i * q) % 6, 2, 12); } else { g.fillStyle = "#2f6b2a"; g.fillRect(x + 13, y + 6, 6, 24); g.fillRect(x + 6 + (q % 2) * 2, y + 12, 6, 4); g.fillRect(x + 20, y + 10 + (q % 3) * 2, 6, 4); } break;
        case 4: g.fillStyle = p[2]; for (let i = 0; i < 3; i++) g.fillRect(x + 4 + ((q * 5 + i * 9) % 18), y + 6 + i * 9, 10, 2); break;
        case 5: g.fillStyle = p[2]; g.fillRect(x + 6, y + 6, 20, 20); g.fillStyle = p[1]; g.fillRect(x + 10 + (q % 4) * 2, y + 10, 8, 8); break;
      }
      if (opts.labels) { g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(x, y, 14, 10); g.fillStyle = "#fff"; g.font = "8px monospace"; g.fillText(String(r * cols + q), x + 1, y + 8); }
    }
    return { canvas: c, cols, rows, tw, th, margin, spacing, W, H, count: cols * rows };
  }

  /** Registra algo a limpiar al salir de la lección (p.ej. clearInterval). */
  function alSalir(fn) { limpiezas.push(fn); }

  // ---------- Registro y navegación ----------
  function leccion(def) { lecciones.push(def); }

  const hechos = () => store.get("hechos", {});
  function marcar(id, valor) { const h = hechos(); if (valor) h[id] = true; else delete h[id]; store.set("hechos", h); pintarIndice(); }

  function pintarIndice() {
    const toc = document.getElementById("toc");
    const h = hechos();
    const actual = location.hash.slice(1) || "inicio";
    let html = `<li><a href="#inicio" class="${actual === "inicio" ? "active" : ""}"><span class="num">◆</span><span>Portada y mapa del curso</span><span></span></a></li>`;
    let grupo = "";
    for (const l of lecciones) {
      if (l.grupo !== grupo) { grupo = l.grupo; html += `<li class="toc-group">${grupo}</li>`; }
      html += `<li><a href="#${l.id}" class="${l.id === actual ? "active" : ""} ${h[l.id] ? "done" : ""}"><span class="num">${l.num}</span><span>${l.titulo}</span><span class="check" aria-label="${h[l.id] ? "completada" : "pendiente"}"></span></a></li>`;
    }
    toc.innerHTML = html;
    const n = lecciones.filter((l) => h[l.id]).length;
    document.getElementById("prog-txt").textContent = `${n} de ${lecciones.length} lecciones completadas`;
    document.getElementById("prog-bar").style.width = (lecciones.length ? (100 * n / lecciones.length) : 0) + "%";
  }

  function portada() {
    const h = hechos();
    const grupos = [...new Set(lecciones.map((l) => l.grupo))];
    return `
      <header class="lesson-head">
        <div class="eyebrow"><b>Curso personal</b><span>SDL3 · Tiled · C++</span><span>Desarrollo de Videojuegos</span></div>
        <h1>Del bucle de juego al enemigo que te persigue</h1>
        <p class="lead">Clases a tu medida para entender (y sobre todo programar) cada tema del temario: framerate, delta time, entidades, XML, mapas de Tiled, físicas, colisiones, animaciones y pathfinding. Cada lección sigue los TODOs de los handouts, con demos que puedes tocar y la solución escondida para cuando te atasques.</p>
      </header>

      <h2>Cómo usar este curso</h2>
      <ol>
        <li><strong>Lee el concepto</strong> y juega con la demo. Las demos están hechas en el navegador, pero imitan lo que hará tu motor en C++.</li>
        <li><strong>Haz los TODOs</strong> en el handout de Visual Studio. Intenta escribir el código tú antes de abrir “Ver solución”.</li>
        <li><strong>Responde el test</strong> del final. Si fallas una pregunta, vuelve a la sección que explica esa idea.</li>
        <li><strong>Marca la lección como hecha</strong> para ver tu progreso en la barra lateral (se guarda en este navegador).</li>
      </ol>
      ${nota(`<p>Cada lección se apoya en la anterior: el motor va creciendo de clase en clase (Timer → dt → entidades → config.xml → mapa → físicas → colisiones del mapa → animaciones → pathfinding). Si empiezas desde cero, ve en orden y no te saltes la <a href="#l01">lección 01</a>.</p>`, "", "Orden recomendado")}

      <div class="path">${lecciones.map((l, i) => `<span>${l.num} ${l.corto || l.titulo}</span>${i < lecciones.length - 1 ? "<i>→</i>" : ""}`).join("")}</div>

      ${grupos.map((g) => `<h2>${g}</h2><div class="cards">${lecciones.filter((l) => l.grupo === g).map((l) => `
        <a class="card ${h[l.id] ? "done" : ""}" href="#${l.id}"><span class="num">${l.num}</span><span class="ttl">${l.titulo}</span><span class="sum">${l.resumen}</span></a>`).join("")}</div>`).join("")}

      <h2>Próximas lecciones</h2>
      <p>El curso está pensado para crecer. Cuando tengas los PDFs de las siguientes clases (A*, enemigos que persiguen, UI, audio, escenas…), pásamelos y añadiré nuevas lecciones con el mismo formato sin tocar las que ya tienes.</p>
    `;
  }

  function render() {
    while (limpiezas.length) { try { limpiezas.pop()(); } catch (e) { /* nada */ } }
    const id = location.hash.slice(1) || "inicio";
    const page = document.getElementById("page");
    const idx = lecciones.findIndex((l) => l.id === id);
    document.getElementById("side").classList.remove("open");

    if (idx < 0) {
      page.innerHTML = portada();
      document.title = "Curso SDL + Tiled";
    } else {
      const l = lecciones[idx], prev = lecciones[idx - 1], next = lecciones[idx + 1];
      const hecho = !!hechos()[l.id];
      page.innerHTML = `
        <header class="lesson-head">
          <div class="eyebrow"><b>Lección ${l.num}</b><span>${l.grupo}</span>${l.pdf ? `<span>PDF: ${l.pdf}</span>` : ""}</div>
          <h1>${l.titulo}</h1>
          <p class="lead">${l.intro}</p>
          ${l.objetivos ? `<ul class="goals">${l.objetivos.map((o) => `<li>${o}</li>`).join("")}</ul>` : ""}
        </header>
        <article>${typeof l.html === "function" ? l.html() : l.html}</article>
        <div class="lesson-foot">
          ${prev ? `<a class="btn" href="#${prev.id}">← ${prev.num} ${prev.corto || prev.titulo}</a>` : `<a class="btn" href="#inicio">← Portada</a>`}
          <button type="button" class="btn done-toggle ${hecho ? "on" : ""}" id="done-btn">${hecho ? "✓ Lección completada" : "Marcar como completada"}</button>
          ${next ? `<a class="btn primary" href="#${next.id}">${next.num} ${next.corto || next.titulo} →</a>` : ""}
        </div>`;
      document.title = `${l.num} ${l.corto || l.titulo} · Curso SDL + Tiled`;
      document.getElementById("done-btn").onclick = (e) => { const v = !hechos()[l.id]; marcar(l.id, v); e.currentTarget.classList.toggle("on", v); e.currentTarget.textContent = v ? "✓ Lección completada" : "Marcar como completada"; };
      if (l.init) { try { l.init(page); } catch (err) { console.error("Error iniciando demo de " + l.id, err); } }
    }
    pintarIndice();
    window.scrollTo(0, 0);
  }

  // ---------- Eventos globales (copiar código, quiz, tema, menú móvil) ----------
  document.addEventListener("click", (e) => {
    const cp = e.target.closest("[data-copy]");
    if (cp) {
      const el = document.getElementById(cp.dataset.copy);
      const txt = el ? el.innerText : "";
      const ok = () => { cp.textContent = "Copiado"; setTimeout(() => (cp.textContent = "Copiar"), 1200); };
      try {
        navigator.clipboard.writeText(txt).then(ok, () => { selectText(el); cp.textContent = "Selecciona y Ctrl+C"; });
      } catch (err) { selectText(el); }
      return;
    }
    const b = e.target.closest(".q-opts button");
    if (b) {
      const q = b.closest(".q"), c = +q.dataset.c, j = +b.dataset.j;
      q.querySelectorAll("button").forEach((x) => { x.disabled = true; if (+x.dataset.j === c) x.classList.add("right"); });
      if (j !== c) b.classList.add("wrong");
      const exp = q.querySelector(".q-exp");
      exp.hidden = false;
      exp.innerHTML = (j === c ? "<strong>¡Correcto!</strong> " : "<strong>No exactamente.</strong> ") + exp.innerHTML;
    }
  });
  function selectText(el) { if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }

  function iniciarTema() {
    const t = store.get("tema", null);
    if (t) document.documentElement.setAttribute("data-theme", t);
    document.getElementById("theme-btn").onclick = () => {
      const oscuro = document.documentElement.getAttribute("data-theme") === "dark" ||
        (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
      const nuevo = oscuro ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nuevo);
      store.set("tema", nuevo);
      render();
    };
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", () => {
    iniciarTema();
    document.getElementById("menu-btn").onclick = () => document.getElementById("side").classList.toggle("open");
    document.getElementById("reset-btn").onclick = (e) => {
      const b = e.currentTarget;
      if (b.dataset.confirm) { store.set("hechos", {}); b.textContent = "Reiniciar progreso"; delete b.dataset.confirm; render(); }
      else { b.dataset.confirm = "1"; b.textContent = "¿Seguro? Pulsa otra vez"; setTimeout(() => { b.textContent = "Reiniciar progreso"; delete b.dataset.confirm; }, 3000); }
    };
    render();
  });

  window.Curso = { leccion, code, nota, todo, quiz, demo, color, canvas, puntero, bucle, on, teclado, alSalir, tilesetDemo, esc, store, hlXml };
})();
