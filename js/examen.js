/* =====================================================================
   Motor de exámenes. Curso.examen({ id, num, titulo, intro, banco, modos })
   Tipos de pregunta del banco:
     { tipo: "test",   tema, p, o: [...], c: índice, e }            elección única
     { tipo: "num",    tema, p, r: número, tol, unidad, e }         cálculo (se acepta r ± tol)
     { tipo: "codigo", tema, p, code: "… §s1§ …", slots: { s1: { ok: [str | regex] } }, e }
   En p se puede meter código con Curso.code(...).
   El examen no da pistas: se corrige al entregar, con nota, desglose por tema y explicación.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.Curso;
  const norm = (s) => String(s).replace(/\/\/[^\n]*/g, "").replace(/\s+/g, "").replace(/;+$/, "");
  const baraja = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  C.examen = function (def) {
    const modos = def.modos || [{ nombre: "Examen completo", n: 24, min: 45 }, { nombre: "Repaso rápido", n: 10, min: 15 }];
    C.leccion({
      id: def.id, num: def.num || "✎", grupo: def.grupo || "Evaluación", corto: def.corto || "Examen", titulo: def.titulo,
      resumen: def.resumen || "Examen final con teoría, cálculo y código.", intro: def.intro || "",
      html: () => `<div id="ex-root"></div>`,
      init(root) {
        const el = root.querySelector("#ex-root");
        let preguntas = [], fin = 0, timer = null, entregado = false;

        function inicio() {
          const mejor = C.store.get("examen." + def.id, null);
          el.innerHTML = `
            <h2 style="margin-top:0">Antes de empezar</h2>
            <ul>
              <li>Las preguntas salen al azar de un banco de <strong>${def.banco.length}</strong>, repartidas entre todos los temas. Cada intento es distinto.</li>
              <li>Hay tres tipos: <strong>teoría</strong> (elegir una), <strong>cálculo</strong> (escribir un número) y <strong>código</strong> (rellenar los huecos; da igual cómo pongas los espacios).</li>
              <li>No hay pistas ni corrección hasta que entregues. Al final verás tu nota, en qué temas fallas y la explicación de cada pregunta.</li>
              <li>Aprobado: 5. Si sacas menos de 7 en un tema, repasa esa lección antes de repetir.</li>
            </ul>
            ${mejor ? `<p><strong>Tu mejor nota hasta ahora: ${mejor.nota.toFixed(1)}</strong> (${mejor.modo})</p>` : ""}
            <div class="controls">${modos.map((m, i) => `<button type="button" class="btn ${i ? "" : "primary"}" data-modo="${i}">${m.nombre}: ${Math.min(m.n, def.banco.length)} preguntas · ${m.min} min</button>`).join("")}</div>`;
          el.querySelectorAll("[data-modo]").forEach((b) => C.on(b, "click", () => empezar(modos[+b.dataset.modo])));
        }

        function elegir(n) {
          // reparto equilibrado por tema
          const porTema = {};
          baraja(def.banco).forEach((q) => (porTema[q.tema] = porTema[q.tema] || []).push(q));
          const temas = baraja(Object.keys(porTema)), sel = [];
          while (sel.length < n && temas.some((t) => porTema[t].length)) for (const t of temas) { if (sel.length < n && porTema[t].length) sel.push(porTema[t].pop()); }
          return baraja(sel);
        }

        function preguntaHTML(q, i) {
          let cuerpo = "";
          if (q.tipo === "test") {
            q._orden = baraja(q.o.map((_, k) => k));
            cuerpo = `<div class="ex-ops">${q._orden.map((k) => `<label><input type="radio" name="exq${i}" value="${k}"><span>${q.o[k]}</span></label>`).join("")}</div>`;
          } else if (q.tipo === "num") {
            cuerpo = `<label>Respuesta: <input class="ex-num" inputmode="decimal" autocomplete="off" aria-label="respuesta numérica"> ${q.unidad || ""}</label>`;
          } else if (q.tipo === "codigo") {
            let html = C.code(q.code, "cpp", "").replace(/<div class="code-head">[\s\S]*?<\/div>/, "");
            html = html.replace(/§(?:<span[^>]*>)?(\w+?)(?:<\/span>)?§/g, (m, id) => `<input class="slot" data-s="${id}" size="${(q.slots[id].w || 18)}" spellcheck="false" autocomplete="off" aria-label="hueco">`);
            cuerpo = html;
          }
          const tipo = { test: "Teoría", num: "Cálculo", codigo: "Código" }[q.tipo];
          return `<div class="ex-q" data-i="${i}" data-b="${def.banco.indexOf(q)}"><div class="ex-meta"><b>Pregunta ${i + 1}</b><span>${tipo}</span><span>${q.tema}</span></div><div class="ex-enun">${q.p}</div>${cuerpo}<div class="ex-fb" hidden></div></div>`;
        }

        function empezar(modo) {
          entregado = false;
          preguntas = elegir(Math.min(modo.n, def.banco.length));
          fin = Date.now() + modo.min * 60000;
          el.innerHTML = `
            <div class="ex-bar"><span class="ex-time" id="ex-time"></span><div class="bar"><span id="ex-prog"></span></div><span id="ex-cont"></span><button type="button" class="btn primary" id="ex-entregar">Entregar</button></div>
            <div id="ex-res"></div>
            ${preguntas.map(preguntaHTML).join("")}
            <div class="controls"><button type="button" class="btn primary" id="ex-entregar2">Entregar examen</button></div>`;
          const progreso = () => {
            const hechas = preguntas.filter((q, i) => respuesta(i) !== null).length;
            el.querySelector("#ex-cont").textContent = `${hechas}/${preguntas.length} respondidas`;
            el.querySelector("#ex-prog").style.width = (100 * hechas / preguntas.length) + "%";
          };
          C.on(el, "input", progreso); C.on(el, "change", progreso); progreso();
          const tick = () => {
            if (entregado) return;
            const s = Math.max(0, Math.round((fin - Date.now()) / 1000)), t = el.querySelector("#ex-time");
            if (!t) return;
            t.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
            t.classList.toggle("poco", s < 120);
            if (s <= 0) corregir(modo, true);
          };
          clearInterval(timer); timer = setInterval(tick, 500); tick();
          C.alSalir(() => clearInterval(timer));
          let confirma = 0;
          const entregar = (e) => {
            const sin = preguntas.filter((q, i) => respuesta(i) === null).length;
            if (sin && Date.now() - confirma > 4000) { confirma = Date.now(); e.currentTarget.textContent = `Faltan ${sin} sin responder. Pulsa otra vez para entregar`; return; }
            corregir(modo, false);
          };
          C.on(el.querySelector("#ex-entregar"), "click", entregar); C.on(el.querySelector("#ex-entregar2"), "click", entregar);
          window.scrollTo(0, 0);
        }

        /** Respuesta del alumno a la pregunta i, o null si está en blanco. */
        function respuesta(i) {
          const q = preguntas[i], box = el.querySelector(`.ex-q[data-i="${i}"]`);
          if (!box) return null;
          if (q.tipo === "test") { const r = box.querySelector("input:checked"); return r ? +r.value : null; }
          if (q.tipo === "num") { const v = box.querySelector(".ex-num").value.trim().replace(",", "."); return v === "" ? null : v; }
          const vals = {}; let alguno = false;
          box.querySelectorAll(".slot").forEach((s) => { vals[s.dataset.s] = s.value; if (s.value.trim()) alguno = true; });
          return alguno ? vals : null;
        }

        function acierta(q, r) {
          if (r === null) return false;
          if (q.tipo === "test") return r === q.c;
          if (q.tipo === "num") { const v = parseFloat(r); return !isNaN(v) && Math.abs(v - q.r) <= (q.tol != null ? q.tol : Math.abs(q.r) * 0.02 + 1e-9); }
          return Object.keys(q.slots).every((id) => { const v = norm(r[id] || ""); return v !== "" && q.slots[id].ok.some((o) => (o instanceof RegExp ? o.test(v) : v === norm(o))); });
        }

        function corregir(modo, porTiempo) {
          if (entregado) return; entregado = true; clearInterval(timer);
          let ok = 0; const temas = {};
          preguntas.forEach((q, i) => {
            const r = respuesta(i), bien = acierta(q, r), box = el.querySelector(`.ex-q[data-i="${i}"]`), fb = box.querySelector(".ex-fb");
            if (bien) ok++;
            const t = (temas[q.tema] = temas[q.tema] || { ok: 0, n: 0 }); t.n++; if (bien) t.ok++;
            box.classList.add(bien ? "ok" : "mal");
            box.querySelectorAll("input").forEach((x) => (x.disabled = true));
            let correcta = "";
            if (q.tipo === "test") {
              box.querySelectorAll(".ex-ops label").forEach((l) => { const v = +l.querySelector("input").value; if (v === q.c) l.classList.add("right"); else if (v === r) l.classList.add("wrong"); });
            } else if (q.tipo === "num") correcta = `Respuesta correcta: <b>${q.r}${q.unidad ? " " + q.unidad : ""}</b>. `;
            else {
              box.querySelectorAll(".slot").forEach((s) => { const sl = q.slots[s.dataset.s], v = norm(s.value); const b = v !== "" && sl.ok.some((o) => (o instanceof RegExp ? o.test(v) : v === norm(o))); s.classList.add(b ? "good" : "bad"); });
              correcta = "Solución: " + Object.keys(q.slots).map((id) => `<code>${C.esc(q.slots[id].sol || q.slots[id].ok.find((o) => typeof o === "string") || "")}</code>`).join(" · ") + ". ";
            }
            fb.hidden = false; fb.className = "ex-fb " + (bien ? "ok" : "mal");
            fb.innerHTML = `<strong>${bien ? "Correcta." : r === null ? "Sin responder." : "Incorrecta."}</strong> ${bien ? "" : correcta}${q.e || ""}`;
          });
          const nota = 10 * ok / preguntas.length;
          const mejor = C.store.get("examen." + def.id, null);
          if (!mejor || nota > mejor.nota) C.store.set("examen." + def.id, { nota, modo: modo.nombre });
          const veredicto = nota >= 9 ? "Nivel experto. Estás listo para el proyecto." : nota >= 7 ? "Notable. Repasa los temas en rojo y a por el 9." : nota >= 5 ? "Aprobado justo. Tienes huecos: repasa los temas más flojos." : "Todavía no. Vuelve a las lecciones de los temas más flojos y repite.";
          el.querySelector(".ex-bar").remove();
          el.querySelector("#ex-res").innerHTML = `
            <div class="ex-q"><div class="ex-res">
              <div><div class="ex-meta"><b>Resultado</b>${porTiempo ? "<span>se acabó el tiempo</span>" : ""}</div><div class="ex-nota">${nota.toFixed(1)}</div><p style="margin:6px 0 0">${ok} de ${preguntas.length} correctas. ${veredicto}</p></div>
              <div class="ex-temas">${Object.keys(temas).sort().map((t) => { const x = temas[t], pc = Math.round(100 * x.ok / x.n); return `<div class="ex-tema"><span>${t}</span><div class="bar"><span style="width:${pc}%;background:${pc >= 70 ? "var(--ok)" : pc >= 50 ? "var(--amber)" : "var(--bad)"}"></span></div><span>${x.ok}/${x.n}</span></div>`; }).join("")}</div>
            </div><div class="controls" style="margin-top:14px"><button type="button" class="btn primary" id="ex-otra">Hacer otro examen</button></div></div>
            <h2>Corrección</h2>`;
          el.querySelector("#ex-entregar2").closest(".controls").remove();
          C.on(el.querySelector("#ex-otra"), "click", inicio);
          window.scrollTo(0, 0);
        }

        inicio();
      }
    });
  };
})();
