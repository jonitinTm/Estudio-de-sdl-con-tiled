/* =====================================================================
   Física de coche top-down (estilo iforce2d) y circuito con checkpoints.
   Es la misma lógica que se explica en C++ en las lecciones 08-10:
     forward = GetWorldVector(0, -1)   (el morro apunta hacia arriba)
     right   = GetWorldVector(1, 0)
     lateral = dot(right, v) * right   -> se cancela con un impulso (agarre)
   ===================================================================== */
(function () {
  "use strict";
  const V = (x, y) => planck.Vec2(x, y);
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /** Crea un coche. x, y en píxeles; ang en radianes (0 = morro hacia arriba). */
  function crearCoche(sim, x, y, ang, op = {}) {
    const hw = op.hw || 10, hh = op.hh || 18;           // medias medidas en px
    const body = sim.caja(x, y, hw, hh, { angulo: ang || 0, densidad: 1, friccion: 0.3, rebote: 0.2, categoria: op.categoria, mascara: op.mascara, datos: { coche: true } });
    body.setAngularDamping(op.angularDamping != null ? op.angularDamping : 3);
    const car = {
      body, hw, hh, color: op.color || "#e5533d", nombre: op.nombre || "car",
      // parámetros (unidades Box2D: N, m/s, rad/s)
      engine_force: op.engine_force || 18, max_speed: op.max_speed || 9, max_back: op.max_back || 3,
      grip: op.grip != null ? op.grip : 1, max_lateral_impulse: op.max_lateral_impulse || 0.9,
      turn_speed: op.turn_speed || 3.2, drag: op.drag != null ? op.drag : 0.4,
      surface: 1,            // multiplicador de agarre por zona (aceite < 1)
      handbrake: false, drifting: false,
      // estado de carrera
      lap: 0, next_cp: 1, lap_time: 0, best: null, times: [], finished: false, progress: 0,
      forward() { return body.getWorldVector(V(0, -1)); },
      right() { return body.getWorldVector(V(1, 0)); },
      lateralVel() { const r = this.right(), d = dot(r, body.getLinearVelocity()); return V(r.x * d, r.y * d); },
      forwardSpeed() { return dot(this.forward(), body.getLinearVelocity()); },
      /** Paso 1: matar la velocidad lateral (con límite = derrape). */
      updateGrip() {
        const lat = this.lateralVel(), m = body.getMass();
        let ix = -lat.x * m, iy = -lat.y * m;
        let max = this.max_lateral_impulse * this.surface * (this.handbrake ? 0.25 : 1);
        const len = Math.hypot(ix, iy);
        this.drifting = len > max;
        if (len > max) { ix *= max / len; iy *= max / len; }
        body.applyLinearImpulse(V(ix * this.grip, iy * this.grip), body.getWorldCenter(), true);
        // rozamiento con el suelo en el sentido de la marcha (rodadura + aire)
        const f = this.forward(), s = this.forwardSpeed();
        body.applyForceToCenter(V(-f.x * s * this.drag * m, -f.y * s * this.drag * m), true);
      },
      /** Paso 2: motor. throttle en [-1, 1]. */
      drive(throttle) {
        const s = this.forwardSpeed();
        let force = 0;
        if (throttle > 0 && s < this.max_speed) force = this.engine_force * throttle;
        else if (throttle < 0 && s > -this.max_back) force = this.engine_force * throttle * (s > 0.5 ? 1.5 : 0.6);  // frena fuerte, marcha atrás suave
        if (force) { const f = this.forward(), m = body.getMass(); body.applyForceToCenter(V(f.x * force * m, f.y * force * m), true); }
      },
      /** Paso 3: dirección. steer en [-1, 1]; solo gira si se mueve, y al revés en marcha atrás. */
      steer(steer) {
        const s = this.forwardSpeed();
        const factor = clamp(Math.abs(s) / 2.5, 0, 1) * (s >= 0 ? 1 : -1);
        if (steer !== 0) body.setAngularVelocity(steer * this.turn_speed * factor);
      },
      dibujar(ctx, sim2) {
        const p = sim2.pos(body);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(body.getAngle());
        ctx.fillStyle = "#222"; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => ctx.fillRect(sx * hw - (sx > 0 ? 2 : 3) + (sx > 0 ? 0 : 1), sy * hh * 0.6 - 4, 4, 8));
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 4) : ctx.rect(-hw, -hh, hw * 2, hh * 2); ctx.fill();
        ctx.fillStyle = "rgba(20,30,50,.75)"; ctx.fillRect(-hw + 3, -hh + 7, hw * 2 - 6, 8);
        ctx.fillStyle = "#ffe08a"; ctx.fillRect(-hw + 2, -hh, 4, 3); ctx.fillRect(hw - 6, -hh, 4, 3);
        ctx.restore();
      }
    };
    body.getUserData().dibujar = (ctx, s) => car.dibujar(ctx, s);
    body.getUserData().tambienEnDebug = true;
    body.getUserData().car = car;
    return car;
  }

  /**
   * Circuito: línea central cerrada (en píxeles), ancho del asfalto, y a partir de ella
   * dos cadenas (borde exterior e interior) y N checkpoints (sensores atravesados en la pista).
   */
  function crearCircuito(sim, op = {}) {
    const cx = op.cx || sim.W / 2, cy = op.cy || sim.H / 2, ax = op.ax || sim.W / 2 - 70, ay = op.ay || sim.H / 2 - 60;
    const ancho = op.ancho || 46, N = op.puntos || 64;
    // forma: “supercírculo” deformado para tener rectas y curvas distintas
    const centro = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      const k = 0.55;  // cuanto más pequeño, más “cuadrado”
      let x = Math.sign(c) * Math.pow(Math.abs(c), k) * ax;
      let y = Math.sign(s) * Math.pow(Math.abs(s), k) * ay;
      y += (op.chicane !== false && c > 0.3) ? Math.sin(t * 3) * 18 : 0;   // una chicane a la derecha
      centro.push({ x: cx + x, y: cy + y });
    }
    const normal = (i) => {
      const a = centro[(i - 1 + N) % N], b = centro[(i + 1) % N];
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
      return { x: -dy / l, y: dx / l };
    };
    const ext = [], int = [];
    centro.forEach((p, i) => { const n = normal(i); ext.push(p.x + n.x * ancho, p.y + n.y * ancho); int.push(p.x - n.x * ancho, p.y - n.y * ancho); });
    const muroExt = sim.cadena(0, 0, ext, { datos: { fijo: true, muro: true, trazo: Curso.color("ink-3") } });
    const muroInt = sim.cadena(0, 0, int, { datos: { fijo: true, muro: true, trazo: Curso.color("ink-3") } });
    // checkpoints: cada N/ncp puntos; el 0 es la meta
    const ncp = op.checkpoints || 8, cps = [];
    for (let k = 0; k < ncp; k++) {
      const i = Math.round((k * N) / ncp) % N, p = centro[i], n = normal(i);
      const ang = Math.atan2(n.y, n.x);
      const b = sim.caja(p.x, p.y, ancho, 3, { tipo: "static", sensor: true, angulo: ang, datos: { fijo: true, checkpoint: k } });
      cps.push({ body: b, i, p, ang });
    }
    return { centro, ext, int, ancho, muroExt, muroInt, cps, N, normal };
  }

  /** Dibuja asfalto, bordillos y línea de meta (fondo). */
  function dibujarPista(ctx, pista) {
    const poly = (arr) => { ctx.beginPath(); for (let i = 0; i < arr.length; i += 2) i ? ctx.lineTo(arr[i], arr[i + 1]) : ctx.moveTo(arr[i], arr[i + 1]); ctx.closePath(); };
    ctx.fillStyle = "#5d8a4a"; ctx.fillRect(0, 0, ctx.W, ctx.H);
    ctx.fillStyle = "#4a4d57"; poly(pista.ext); ctx.fill();
    ctx.fillStyle = "#5d8a4a"; poly(pista.int); ctx.fill();
    ctx.setLineDash([10, 10]); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); pista.centro.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 4; ctx.strokeStyle = "#e9e9e9"; poly(pista.ext); ctx.stroke(); poly(pista.int); ctx.stroke(); ctx.lineWidth = 1;
    // meta a cuadros
    const m = pista.cps[0]; ctx.save(); ctx.translate(m.p.x, m.p.y); ctx.rotate(m.ang);
    for (let k = -pista.ancho; k < pista.ancho; k += 6) for (let j = 0; j < 2; j++) { ctx.fillStyle = ((k / 6 + j) & 1) ? "#fff" : "#111"; ctx.fillRect(k, -6 + j * 6, 6, 6); }
    ctx.restore();
  }


  /** Ángulo de body para que su forward (0,-1) apunte en la dirección (dx, dy). */
  function anguloHacia(dx, dy) { return Math.atan2(dx, -dy); }

  /**
   * Gestor de carrera: checkpoints en orden, vueltas, tiempos, cuenta atrás y zonas especiales.
   * Toda la lógica que toca cuerpos (impulsos) se aplica en el paso, nunca dentro del callback.
   */
  function gestorCarrera(sim, pista, op = {}) {
    const ncp = pista.cps.length;
    const g = {
      cars: [], vueltas: op.vueltas || 3, estado: "cuenta", cuenta: 3, t: 0, best: null, mensajes: [],
      zonas: [],
      registrar(car) { this.cars.push(car); car.lap = 0; car.next_cp = 1; car.lap_time = 0; car.times = []; car.finished = false; car.boost = 0; car.enAceite = 0; return car; },
      msg(t) { this.mensajes.push({ t, vida: 2 }); },
      reiniciar() { this.estado = "cuenta"; this.cuenta = 3; this.t = 0; this.cars.forEach((c) => { c.lap = 0; c.next_cp = 1; c.lap_time = 0; c.times = []; c.finished = false; c.place = null; }); this.llegados = 0; },
      llegados: 0,
      /** posición en carrera: vueltas, checkpoint y distancia al siguiente */
      progreso(car) {
        const cp = pista.cps[car.next_cp], p = car.body.getPosition();
        const d = Math.hypot(cp.p.x / sim.ppm - p.x, cp.p.y / sim.ppm - p.y);
        const hechos = car.lap * ncp + ((car.next_cp - 1 + ncp) % ncp);
        return hechos * 1000 - d;
      },
      zona(tipo, x, y, hw, hh, ang) {
        const b = sim.caja(x, y, hw, hh, { tipo: "static", sensor: true, angulo: ang || 0, datos: { fijo: true, zona: tipo } });
        this.zonas.push({ tipo, b, x, y, hw, hh, ang: ang || 0 }); return b;
      }
    };
    const carDe = (f) => (f.getBody().getUserData() || {}).car;
    sim.world.on("begin-contact", (c) => {
      const fa = c.getFixtureA(), fb = c.getFixtureB();
      [[fa, fb], [fb, fa]].forEach(([s, o]) => {
        const ud = s.getBody().getUserData() || {}, car = carDe(o);
        if (!car || !s.isSensor()) return;
        if (ud.checkpoint != null && g.estado === "carrera" && !car.finished) {
          const k = ud.checkpoint;
          if (k === car.next_cp) {
            car.next_cp = (k + 1) % ncp;
            if (k === 0) {                         // ¡meta en orden = vuelta completa!
              car.times.push(car.lap_time);
              if (car.best == null || car.lap_time < car.best) car.best = car.lap_time;
              if (car.jugador && (g.best == null || car.lap_time < g.best)) { g.best = car.lap_time; Curso.store.set("b2best", g.best); }
              car.lap++; car.lap_time = 0;
              if (car.jugador) g.msg(`Vuelta ${car.lap} en ${car.times[car.times.length - 1].toFixed(2)} s`);
              if (car.lap >= g.vueltas) { car.finished = true; car.place = ++g.llegados; if (car.jugador) g.estado = "fin"; }
            }
          } else if (car.jugador && k !== (car.next_cp - 1 + ncp) % ncp) g.msg("¡Te has saltado un checkpoint!");
        }
        if (ud.zona === "aceite") car.enAceite++;
        if (ud.zona === "turbo") car.boost = 0.6;       // se aplica en el paso, no aquí
      });
    });
    sim.world.on("end-contact", (c) => {
      const fa = c.getFixtureA(), fb = c.getFixtureB();
      [[fa, fb], [fb, fa]].forEach(([s, o]) => { const ud = s.getBody().getUserData() || {}, car = carDe(o); if (car && ud.zona === "aceite") car.enAceite = Math.max(0, car.enAceite - 1); });
    });
    g.best = Curso.store.get("b2best", null);
    g.paso = (dt) => {
      if (g.estado === "cuenta") { g.cuenta -= dt; if (g.cuenta <= 0) { g.estado = "carrera"; g.msg("¡YA!"); } }
      if (g.estado === "carrera" || g.estado === "fin") g.t += dt;
      g.cars.forEach((c) => {
        if (g.estado !== "cuenta" && !c.finished) c.lap_time += dt;
        c.surface = c.enAceite > 0 ? 0.15 : 1;
        if (c.boost > 0) { c.boost -= dt; const f = c.forward(), m = c.body.getMass(); c.body.applyForceToCenter(V(f.x * 40 * m, f.y * 40 * m), true); }
      });
      g.mensajes.forEach((m) => (m.vida -= dt)); g.mensajes = g.mensajes.filter((m) => m.vida > 0);
    };
    g.dibujarZonas = (ctx) => {
      g.zonas.forEach((z) => {
        ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.ang);
        if (z.tipo === "aceite") { ctx.fillStyle = "rgba(10,10,20,.75)"; ctx.beginPath(); ctx.ellipse(0, 0, z.hw, z.hh, 0, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(120,80,200,.35)"; ctx.beginPath(); ctx.ellipse(-4, -3, z.hw * .5, z.hh * .4, 0, 0, 7); ctx.fill(); }
        else { ctx.fillStyle = "rgba(250,204,21,.85)"; ctx.fillRect(-z.hw, -z.hh, z.hw * 2, z.hh * 2); ctx.fillStyle = "#7c2d12"; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-6, k * 8 + 4 - z.hh * 0); ctx.lineTo(0, k * 8 - 4); ctx.lineTo(6, k * 8 + 4); ctx.lineTo(4, k * 8 + 6); ctx.lineTo(0, k * 8); ctx.lineTo(-4, k * 8 + 6); ctx.fill(); } }
        ctx.restore();
      });
    };
    g.hud = (ctx, jugador) => {
      const f = (t) => t == null ? "--" : t.toFixed(2) + " s";
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(8, 8, 210, 74);
      ctx.fillStyle = "#fff"; ctx.font = "13px JetBrains Mono, monospace";
      ctx.fillText(`Vuelta ${Math.min(jugador.lap + 1, g.vueltas)}/${g.vueltas}`, 16, 26);
      ctx.fillText(`Actual: ${f(jugador.lap_time)}`, 16, 44);
      ctx.fillText(`Mejor:  ${f(g.best)}`, 16, 62);
      ctx.fillText(`Total:  ${f(g.t)}`, 16, 78);
      ctx.textAlign = "center";
      if (g.estado === "cuenta") { ctx.font = "bold 64px Inter, sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(Math.ceil(g.cuenta), ctx.W / 2, ctx.H / 2 + 20); }
      if (g.estado === "fin") { ctx.font = "bold 30px Inter, sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(`¡META! Posición ${jugador.place || "-"} · ${f(g.t)}`, ctx.W / 2, ctx.H / 2); ctx.font = "14px Inter, sans-serif"; ctx.fillText("Pulsa R para repetir", ctx.W / 2, ctx.H / 2 + 26); }
      g.mensajes.forEach((m, i) => { ctx.font = "bold 16px Inter, sans-serif"; ctx.fillStyle = `rgba(255,255,255,${Math.min(1, m.vida)})`; ctx.fillText(m.t, ctx.W / 2, 40 + i * 20); });
      ctx.textAlign = "left";
    };
    return g;
  }

  /** Coloca un coche en la parrilla: unos puntos antes de la meta, desplazado a un lado. */
  function parrilla(sim, pista, car, atras, lado) {
    const N = pista.N, i = (N - atras) % N, p = pista.centro[i], q = pista.centro[(i + 1) % N], n = pista.normal(i);
    const x = p.x + n.x * lado, y = p.y + n.y * lado;
    car.body.setTransform(planck.Vec2(x / sim.ppm, y / sim.ppm), anguloHacia(q.x - p.x, q.y - p.y));
    car.body.setLinearVelocity(planck.Vec2(0, 0)); car.body.setAngularVelocity(0);
  }

  B2.anguloHacia = anguloHacia;
  B2.gestorCarrera = gestorCarrera;
  B2.parrilla = parrilla;

  B2.crearCoche = crearCoche;
  B2.crearCircuito = crearCircuito;
  B2.dibujarPista = dibujarPista;
  B2.util = { dot, clamp, V };
})();
