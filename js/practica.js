/* =====================================================================
   Prácticas guiadas: el alumno escribe el código paso a paso.

   Curso.practica({ leccion: "l02", titulo, intro, pasos: [...] })

   Cada paso:
     t:       título del paso
     exp:     explicación (HTML)
     code:    plantilla de código con huecos §s1§, §s2§…   (rellenar huecos)
     slots:   { s1: { ok: ["SDL_GetTicks()", /^regex$/], err: [[patrón, "mensaje"]], w: ancho } }
     escribe: { antes, despues, archivo, filas, inicio, sol,
                checks: [[/regex/, "mensaje si NO se cumple"]],
                prohibido: [[/regex/, "mensaje si SÍ se cumple"]] }      (escribir líneas)
     pistas:  ["pista 1", "pista 2"]
     bien:    HTML que se muestra al acertar (el porqué)

   La comprobación compara el código sin espacios ni comentarios, así que
   los regex se escriben SIN espacios: /frontier\.pop\(\)/
   ===================================================================== */
(function () {
  "use strict";
  const C = window.Curso;
  const reg = {};   // leccion -> [práctica]

  C.practica = function (def) { (reg[def.leccion] = reg[def.leccion] || []).push(def); };

  // ---------- Normalización ----------
  const sinComentarios = (s) => String(s).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const compacto = (s) => sinComentarios(s).replace(/\s+/g, "");
  const normSlot = (s) => compacto(s).replace(/;+$/, "");
  const coincide = (val, pat) => pat instanceof RegExp ? pat.test(val) : val === normSlot(pat);

  // ---------- HTML ----------
  function codigoConHuecos(src, slots, lang) {
    src = String(src).replace(/^\n/, "").replace(/\s+$/, "");
    // marcadores § que el resaltador no toca; luego se cambian por <input>
    let html = C.code(src.replace(/§(\w+)§/g, "§$1§"), lang || "cpp", "");
    html = html.replace(/§(?:<span[^>]*>)?(\w+?)(?:<\/span>)?§/g, (m, id) => {
      const sl = slots[id] || {};
      const ancho = sl.w || Math.max(6, ...sl.ok.map((o) => (typeof o === "string" ? o.length : 10))) + 2;
      return `<input class="slot" data-s="${id}" size="${ancho}" spellcheck="false" autocomplete="off" aria-label="hueco ${id}">`;
    });
    // quitamos la cabecera vacía del bloque
    return html.replace(/<div class="code-head">[\s\S]*?<\/div>/, "");
  }

  function pasoHTML(p, i, n) {
    let cuerpo = "";
    if (p.code) cuerpo += codigoConHuecos(p.code, p.slots || {}, p.lang);
    if (p.escribe) {
      const e = p.escribe;
      if (e.antes) cuerpo += C.code(e.antes, e.lang || "cpp", e.archivo || "");
      cuerpo += `<textarea class="prac-ta" rows="${e.filas || 6}" spellcheck="false" autocomplete="off" placeholder="Escribe aquí tu código…" aria-label="tu código">${C.esc(e.inicio || "")}</textarea>`;
      if (e.despues) cuerpo += C.code(e.despues, e.lang || "cpp", "…sigue");
    }
    return `
      <div class="paso" data-i="${i}" hidden>
        <div class="paso-num">Paso ${i + 1} de ${n}</div>
        <h3>${p.t}</h3>
        ${p.exp || ""}
        ${cuerpo}
        <div class="paso-btns">
          <button type="button" class="btn primary" data-pr="check">Comprobar</button>
          ${p.pistas && p.pistas.length ? `<button type="button" class="btn" data-pr="hint">Pista (${p.pistas.length})</button>` : ""}
          <button type="button" class="btn" data-pr="sol">Me rindo: ver solución</button>
        </div>
        <div class="paso-pistas"></div>
        <div class="paso-fb" hidden></div>
      </div>`;
  }

  function practicaHTML(def, k) {
    return `
      <section class="prac" data-prac="${def.leccion}-${k}">
        <div class="prac-head">
          <span class="prac-eyebrow">Práctica guiada · programas tú</span>
          <h2 style="margin:4px 0 6px">${def.titulo}</h2>
          ${def.intro ? `<p style="margin:0">${def.intro}</p>` : ""}
          <div class="prac-prog"><div class="bar"><span></span></div><span class="prac-count"></span><button type="button" class="btn" data-pr="restart">Empezar de nuevo</button></div>
        </div>
        ${def.pasos.map((p, i) => pasoHTML(p, i, def.pasos.length)).join("")}
        <div class="prac-fin" hidden>
          <strong>¡Práctica completada!</strong> Ahora pasa este código a tu handout de Visual Studio y compílalo. Si algo no compila, compara con los TODOs resueltos de esta misma lección.
        </div>
      </section>`;
  }

  // ---------- Estado ----------
  const key = (pid) => "prac." + pid;
  const estado = (pid) => C.store.get(key(pid), { hechos: 0, sol: [] });

  function marcarResuelto(sec, i, conSolucion) {
    const pid = sec.dataset.prac, st = estado(pid);
    if (conSolucion && !st.sol.includes(i)) st.sol.push(i);
    st.hechos = Math.max(st.hechos, i + 1);
    C.store.set(key(pid), st);
  }

  function rellenar(paso, p) {
    paso.querySelectorAll(".slot").forEach((inp) => {
      const sl = p.slots[inp.dataset.s];
      inp.value = sl.sol || sl.ok.find((o) => typeof o === "string") || "";
      inp.classList.remove("bad"); inp.classList.add("good"); inp.readOnly = true;
    });
    const ta = paso.querySelector(".prac-ta");
    if (ta && p.escribe) { ta.value = p.escribe.sol || ""; ta.readOnly = true; ta.classList.remove("bad"); ta.classList.add("good"); }
  }

  function pintar(sec, def) {
    const st = estado(sec.dataset.prac), n = def.pasos.length;
    sec.querySelectorAll(".paso").forEach((el) => {
      const i = +el.dataset.i;
      el.hidden = i > st.hechos;
      el.classList.toggle("resuelto", i < st.hechos);
      el.classList.toggle("actual", i === st.hechos);
      if (i < st.hechos && !el.dataset.relleno) {
        rellenar(el, def.pasos[i]); el.dataset.relleno = "1";
        el.querySelectorAll("[data-pr=check],[data-pr=hint],[data-pr=sol]").forEach((b) => (b.hidden = true));
        const fb = el.querySelector(".paso-fb"); fb.hidden = false; fb.className = "paso-fb ok";
        fb.innerHTML = st.sol.includes(i) ? "Resuelto viendo la solución. Vuelve a intentarlo más tarde con <em>Empezar de nuevo</em>." : "✓ Resuelto";
      }
    });
    sec.querySelector(".prac-fin").hidden = st.hechos < n;
    sec.querySelector(".prac-count").textContent = `${Math.min(st.hechos, n)} de ${n} pasos`;
    sec.querySelector(".prac-prog .bar span").style.width = (100 * Math.min(st.hechos, n) / n) + "%";
  }

  // ---------- Comprobación ----------
  function comprobar(paso, p) {
    const fallos = [];
    let todoBien = true;
    if (p.slots) {
      paso.querySelectorAll(".slot").forEach((inp) => {
        const sl = p.slots[inp.dataset.s], v = normSlot(inp.value);
        const ok = v !== "" && sl.ok.some((o) => coincide(v, o));
        inp.classList.toggle("bad", !ok); inp.classList.toggle("good", ok);
        if (!ok) {
          todoBien = false;
          if (v === "") { fallos.push("Hay un hueco vacío (marcado en rojo)."); return; }
          const e = (sl.err || []).find(([pat]) => coincide(v, pat));
          fallos.push(e ? e[1] : `“${C.esc(inp.value.trim())}” no es lo que va en el hueco marcado en rojo.`);
        }
      });
    }
    if (p.escribe) {
      const ta = paso.querySelector(".prac-ta"), v = compacto(ta.value);
      if (!v) { todoBien = false; fallos.push("Todavía no has escrito nada."); }
      else {
        const prohib = (p.escribe.prohibido || []).find(([re]) => re.test(v));
        if (prohib) { todoBien = false; fallos.push(prohib[1]); }
        const falta = (p.escribe.checks || []).find(([re]) => !re.test(v));
        if (falta) { todoBien = false; fallos.push(falta[1]); }
      }
      ta.classList.toggle("bad", !todoBien); ta.classList.toggle("good", todoBien);
    }
    return { todoBien, fallos: [...new Set(fallos)] };
  }

  function init(page, lid) {
    page.querySelectorAll(".prac").forEach((sec) => initSec(sec, lid));
  }

  function initSec(sec, lid) {
      const k = +sec.dataset.prac.split("-").pop(), def = (reg[lid] || [])[k];
      pintar(sec, def);
      sec.addEventListener("keydown", (e) => {
        if (e.target.classList.contains("prac-ta") && e.key === "Tab" && !e.shiftKey) {
          e.preventDefault();
          const t = e.target, a = t.selectionStart;
          t.value = t.value.slice(0, a) + "    " + t.value.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = a + 4;
        }
        if (e.key === "Enter" && e.target.classList.contains("slot")) { e.preventDefault(); const b = e.target.closest(".paso").querySelector("[data-pr=check]"); if (b) b.click(); }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target.classList.contains("prac-ta")) { e.preventDefault(); e.target.closest(".paso").querySelector("[data-pr=check]").click(); }
      });
      sec.addEventListener("click", (e) => {
        const b = e.target.closest("[data-pr]"); if (!b) return;
        if (b.dataset.pr === "restart") {
          C.store.set(key(sec.dataset.prac), { hechos: 0, sol: [] });
          const tmp = document.createElement("div"); tmp.innerHTML = practicaHTML(def, k);
          const nuevo = tmp.firstElementChild; sec.replaceWith(nuevo); initSec(nuevo, lid); return;
        }
        const paso = b.closest(".paso"), i = +paso.dataset.i, p = def.pasos[i], fb = paso.querySelector(".paso-fb");
        if (b.dataset.pr === "hint") {
          const cont = paso.querySelector(".paso-pistas"), dadas = cont.children.length;
          if (dadas < p.pistas.length) cont.insertAdjacentHTML("beforeend", `<div class="pista"><b>Pista ${dadas + 1}:</b> ${p.pistas[dadas]}</div>`);
          b.textContent = dadas + 1 >= p.pistas.length ? "No hay más pistas" : `Otra pista (${p.pistas.length - dadas - 1})`;
          if (dadas + 1 >= p.pistas.length) b.disabled = true;
          return;
        }
        if (b.dataset.pr === "sol") {
          rellenar(paso, p);
          fb.hidden = false; fb.className = "paso-fb info";
          fb.innerHTML = `Aquí tienes la solución. Léela con calma y entiende cada parte antes de seguir.${p.bien ? `<div class="porque">${p.bien}</div>` : ""}<button type="button" class="btn" data-pr="next">Siguiente paso →</button>`;
          paso.querySelectorAll("[data-pr=check],[data-pr=hint],[data-pr=sol]").forEach((x) => (x.hidden = true));
          paso.dataset.conSol = "1";
          return;
        }
        if (b.dataset.pr === "next") {
          marcarResuelto(sec, i, paso.dataset.conSol === "1"); paso.dataset.relleno = "1"; pintar(sec, def);
          const sig = sec.querySelector(`.paso[data-i="${i + 1}"]`) || sec.querySelector(".prac-fin");
          if (sig) sig.scrollIntoView({ behavior: "smooth", block: "nearest" });
          const f = sig && sig.querySelector(".slot, .prac-ta"); if (f) setTimeout(() => f.focus({ preventScroll: true }), 350);
          return;
        }
        if (b.dataset.pr === "check") {
          const r = comprobar(paso, p);
          fb.hidden = false;
          if (r.todoBien) {
            fb.className = "paso-fb ok";
            fb.innerHTML = `<strong>¡Correcto!</strong>${p.bien ? `<div class="porque">${p.bien}</div>` : ""}<button type="button" class="btn primary" data-pr="next">Siguiente paso →</button>`;
            paso.querySelectorAll(".slot, .prac-ta").forEach((x) => (x.readOnly = true));
            paso.querySelectorAll("[data-pr=check],[data-pr=hint],[data-pr=sol]").forEach((x) => (x.hidden = true));
          } else {
            fb.className = "paso-fb bad";
            fb.innerHTML = `<strong>Casi.</strong><ul>${r.fallos.map((f) => `<li>${f}</li>`).join("")}</ul>`;
          }
        }
      });
  }

  C._prac = {
    html: (lid) => (reg[lid] || []).map((d, k) => practicaHTML(d, k)).join(""),
    resumen: (lid) => { const d = reg[lid] || []; const n = d.reduce((a, x) => a + x.pasos.length, 0); const h = d.reduce((a, x, k) => a + Math.min(estado(lid + "-" + k).hechos, x.pasos.length), 0); return `${h} de ${n} pasos hechos`; },
    init,
    // Autocomprobación: las soluciones deben pasar sus propias comprobaciones
    autotest() {
      const fallos = [];
      Object.values(reg).flat().forEach((d) => d.pasos.forEach((p, i) => {
        const tag = `${d.leccion} paso ${i + 1}`;
        Object.entries(p.slots || {}).forEach(([id, sl]) => {
          const v = normSlot(sl.sol || sl.ok.find((o) => typeof o === "string") || "");
          if (!v || !sl.ok.some((o) => coincide(v, o))) fallos.push(`${tag} hueco ${id}`);
        });
        if (p.code) { const ids = [...String(p.code).matchAll(/§(\w+)§/g)].map((m) => m[1]); ids.forEach((id) => { if (!(p.slots || {})[id]) fallos.push(`${tag} hueco sin definir ${id}`); }); }
        if (p.escribe) {
          const v = compacto(p.escribe.sol || "");
          (p.escribe.checks || []).forEach(([re, m]) => { if (!re.test(v)) fallos.push(`${tag} check: ${m.slice(0, 60)}`); });
          (p.escribe.prohibido || []).forEach(([re, m]) => { if (re.test(v)) fallos.push(`${tag} prohibido: ${m.slice(0, 60)}`); });
        }
      }));
      return fallos;
    }
  };
})();
