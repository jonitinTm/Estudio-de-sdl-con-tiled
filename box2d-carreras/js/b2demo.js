/* =====================================================================
   B2: ayudante para las demos con física REAL (planck.js = Box2D 2.4 en JS).
   Imita el ModulePhysics del handout:
     - unidades: PIXELS_PER_METER (por defecto 50), Y hacia abajo, sin invertir
     - world.step(PHYSICS_DT = 1/60, 8, 3) con paso fijo
     - debug draw con los mismos colores: círculos (gris), polígonos (rojo),
       cadenas (verde), edges (azul); sensores en ámbar discontinuo
     - mouse joint para arrastrar cuerpos dinámicos (como la F1 del handout)
   ===================================================================== */
(function () {
  "use strict";
  const pl = window.planck;
  const { Vec2 } = pl;

  function mundo(canvasEl, op = {}) {
    const W = op.w || 720, H = op.h || 420, ppm = op.ppm || 50;
    const ctx = Curso.canvas(canvasEl, W, H);
    const g = op.gravedad || [0, 10];
    const world = new pl.World({ gravity: Vec2(g[0], g[1]) });
    const ground = world.createBody();          // cuerpo estático sin fixtures (para joints)
    const M = (px) => px / ppm, P = (m) => m * ppm;

    const sim = {
      pl, world, ground, ppm, M, P, W, H, ctx,
      debug: op.debug !== false, raton: op.raton !== false, pausa: false,
      pasos: [], dibujos: [], fondo: null, mouseJoint: null, raton_px: { x: 0, y: 0 },
      dt: 1 / 60, tiempo: 0,
      onPaso(fn) { this.pasos.push(fn); return this; },
      onDibujo(fn) { this.dibujos.push(fn); return this; },
      // ---------- creación, mismas firmas que ModulePhysics (en píxeles) ----------
      circulo(x, y, r, o = {}) {
        const b = world.createBody({ type: o.tipo || "dynamic", position: Vec2(M(x), M(y)), angle: o.angulo || 0, bullet: !!o.bullet });
        b.createFixture(pl.Circle(M(r)), fixOpts(o));
        b.setUserData(o.datos || {}); return b;
      },
      caja(x, y, hw, hh, o = {}) {   // ¡medias medidas, como SetAsBox!
        const b = world.createBody({ type: o.tipo || "dynamic", position: Vec2(M(x), M(y)), angle: o.angulo || 0 });
        b.createFixture(pl.Box(M(hw), M(hh)), fixOpts(o));
        b.setUserData(o.datos || {}); return b;
      },
      cadena(x, y, pts, o = {}) {    // pts = [x0, y0, x1, y1, ...] en píxeles, relativos a (x, y)
        const b = world.createBody({ type: "static", position: Vec2(M(x), M(y)) });
        const v = []; for (let i = 0; i < pts.length; i += 2) v.push(Vec2(M(pts[i]), M(pts[i + 1])));
        b.createFixture(pl.Chain(v, o.abierta ? false : true), fixOpts(o));
        b.setUserData(o.datos || {}); return b;
      },
      edge(x1, y1, x2, y2, o = {}) {
        const b = world.createBody({ type: "static" });
        b.createFixture(pl.Edge(Vec2(M(x1), M(y1)), Vec2(M(x2), M(y2))), fixOpts(o));
        b.setUserData(o.datos || {}); return b;
      },
      sensor(x, y, hw, hh, o = {}) {
        return this.caja(x, y, hw, hh, Object.assign({ tipo: "static", sensor: true }, o));
      },
      destruir(b) {
        if (this.mouseJoint && this.mouseJoint.getBodyB() === b) this.mouseJoint = null;   // igual que DestroyBody()
        world.destroyBody(b);
      },
      pos(b) { const p = b.getPosition(); return { x: P(p.x), y: P(p.y) }; },
      cuerpos() { const r = []; for (let b = world.getBodyList(); b; b = b.getNext()) if (b !== ground) r.push(b); return r; },
      dinamicos() { return this.cuerpos().filter((b) => b.isDynamic()); },
      limpiar() { this.cuerpos().forEach((b) => { if (!(b.getUserData() || {}).fijo) this.destruir(b); }); },
      dibujarCuerpo, texto
    };

    function fixOpts(o) {
      return {
        density: o.densidad != null ? o.densidad : 1, friction: o.friccion != null ? o.friccion : 0.2,
        restitution: o.rebote || 0, isSensor: !!o.sensor,
        filterCategoryBits: o.categoria != null ? o.categoria : 0x0001,
        filterMaskBits: o.mascara != null ? o.mascara : 0xffff,
        filterGroupIndex: o.grupo || 0
      };
    }

    // ---------- debug draw (como ModulePhysics::PostUpdate) ----------
    function dibujarCuerpo(b) {
      const ud = b.getUserData() || {};
      if (!sim.debug) { if (ud.dibujar) ud.dibujar(ctx, sim, b); return; }
      if (ud.dibujar && ud.tambienEnDebug) ud.dibujar(ctx, sim, b);
      const tf = b.getTransform();
      for (let f = b.getFixtureList(); f; f = f.getNext()) {
        const s = f.getShape(), t = f.getType();
        ctx.setLineDash(f.isSensor() ? [5, 4] : []);
        ctx.lineWidth = 1.5;
        if (t === "circle") {
          const c = pl.Transform.mulVec2(tf, s.m_p), r = P(s.m_radius);
          ctx.fillStyle = ud.color || "rgba(90, 95, 120, .45)";
          ctx.beginPath(); ctx.arc(P(c.x), P(c.y), r, 0, Math.PI * 2); ctx.fill();
          const e = b.getWorldPoint(Vec2(s.m_p.x + s.m_radius, s.m_p.y));
          ctx.strokeStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(P(c.x), P(c.y)); ctx.lineTo(P(e.x), P(e.y)); ctx.stroke();
        } else if (t === "polygon") {
          ctx.strokeStyle = f.isSensor() ? Curso.color("amber") : (ud.trazo || Curso.color("bad"));
          ctx.fillStyle = ud.color || "transparent";
          ctx.beginPath();
          s.m_vertices.forEach((v, i) => { const w = b.getWorldPoint(v); i ? ctx.lineTo(P(w.x), P(w.y)) : ctx.moveTo(P(w.x), P(w.y)); });
          ctx.closePath(); if (ud.color) ctx.fill(); ctx.stroke();
        } else if (t === "chain") {
          ctx.strokeStyle = ud.trazo || Curso.color("ok"); ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < s.m_count; i++) { const w = b.getWorldPoint(s.m_vertices[i]); i ? ctx.lineTo(P(w.x), P(w.y)) : ctx.moveTo(P(w.x), P(w.y)); }
          if (s.m_isLoop) ctx.closePath();
          ctx.stroke();
        } else if (t === "edge") {
          const a = b.getWorldPoint(s.m_vertex1), c = b.getWorldPoint(s.m_vertex2);
          ctx.strokeStyle = Curso.color("accent"); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(P(a.x), P(a.y)); ctx.lineTo(P(c.x), P(c.y)); ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }
    function texto(s, x, y, color, size) {
      ctx.fillStyle = color || Curso.color("ink-2"); ctx.font = `${size || 12}px JetBrains Mono, monospace`; ctx.fillText(s, x, y);
    }

    // ---------- mouse joint ----------
    if (sim.raton) {
      const pt = (e) => Curso.puntero(canvasEl, e, W, H);
      Curso.on(canvasEl, "pointerdown", (e) => {
        canvasEl.focus();
        const p = pt(e); sim.raton_px = p;
        if (!sim.debug && !op.ratonSiempre) return;
        const m = Vec2(M(p.x), M(p.y));
        let elegido = null;
        world.queryAABB(new pl.AABB(Vec2(m.x - 0.01, m.y - 0.01), Vec2(m.x + 0.01, m.y + 0.01)), (f) => {
          if (f.getBody().isDynamic() && f.testPoint(m)) { elegido = f.getBody(); return false; }
          return true;
        });
        if (elegido) {
          sim.mouseJoint = world.createJoint(new pl.MouseJoint({ maxForce: 100 * elegido.getMass(), frequencyHz: 5, dampingRatio: 0.7 }, ground, elegido, m));
          elegido.setAwake(true);
          canvasEl.setPointerCapture(e.pointerId);
        }
        if (op.alClicar) op.alClicar(p, elegido);
      });
      Curso.on(canvasEl, "pointermove", (e) => {
        const p = pt(e); sim.raton_px = p;
        if (sim.mouseJoint) sim.mouseJoint.setTarget(Vec2(M(p.x), M(p.y)));
      });
      const soltar = () => { if (sim.mouseJoint) { world.destroyJoint(sim.mouseJoint); sim.mouseJoint = null; } };
      Curso.on(canvasEl, "pointerup", soltar); Curso.on(canvasEl, "pointercancel", soltar);
    } else {
      Curso.on(canvasEl, "pointermove", (e) => { sim.raton_px = Curso.puntero(canvasEl, e, W, H); });
    }

    // ---------- bucle: paso fijo como PHYSICS_DT ----------
    let acc = 0;
    Curso.bucle((dt) => {
      if (!sim.pausa) {
        acc += dt; let n = 0;
        while (acc >= sim.dt && n < 5) {
          sim.pasos.forEach((fn) => fn(sim.dt));
          world.step(sim.dt, 8, 3);
          sim.tiempo += sim.dt; acc -= sim.dt; n++;
        }
        if (n >= 5) acc = 0;
      }
      ctx.clearRect(0, 0, W, H);
      if (sim.fondo) sim.fondo(ctx, sim);
      for (let b = world.getBodyList(); b; b = b.getNext()) if (b !== ground) dibujarCuerpo(b);
      if (sim.mouseJoint) {
        const a = sim.mouseJoint.getAnchorA(), c = sim.mouseJoint.getAnchorB();
        ctx.strokeStyle = "#e53935"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(P(a.x), P(a.y)); ctx.lineTo(P(c.x), P(c.y)); ctx.stroke(); ctx.lineWidth = 1;
      }
      sim.dibujos.forEach((fn) => fn(ctx, sim));
    });
    return sim;
  }

  window.B2 = { mundo, Vec2 };
})();
