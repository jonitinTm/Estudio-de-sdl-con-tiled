/* =====================================================================
   Demo compartida de pathfinding (L11 BFS, L12 Dijkstra).
   Imita la clase Pathfinding del handout: frontier, visited,
   breadcrumbs, costSoFar y PropagateBFS / PropagateDijkstra paso a paso.
   ===================================================================== */
(function () {
  "use strict";
  const W = 24, H = 12, S = 26;
  const FREE = 0, WALL = 1, SAND = 2, WATER = 3;
  const COST = { 0: 1, 2: 3, 3: 6 };

  /**
   * opts: { algo: "bfs"|"dijkstra", terrain: bool (permite pintar arena/agua),
   *         breadcrumbs: bool, path: bool, choose: bool (selector de algoritmo) }
   */
  Curso.pathDemo = function (root, opts) {
    root.innerHTML = `
      <canvas class="pf-cv"></canvas>
      <div class="controls">
        <button type="button" class="btn primary" data-a="step">Paso (J)</button>
        <button type="button" class="btn" data-a="run">Reproducir (Shift+J)</button>
        <button type="button" class="btn" data-a="reset">Reset (R)</button>
        <label>Velocidad <input type="range" class="pf-speed" min="1" max="60" value="12"></label>
        ${opts.choose ? `<label>Algoritmo <select class="pf-algo"><option value="bfs">BFS</option><option value="dijkstra" selected>Dijkstra</option></select></label>` : ""}
      </div>
      <div class="controls">
        <span style="color:var(--ink-3)">Pincel:</span>
        <label><input type="radio" name="pf-tool-${opts.algo}" value="${WALL}" checked> Muro</label>
        ${opts.terrain ? `<label><input type="radio" name="pf-tool-${opts.algo}" value="${SAND}"> Arena (coste 3)</label><label><input type="radio" name="pf-tool-${opts.algo}" value="${WATER}"> Agua (coste 6)</label>` : ""}
        <label><input type="radio" name="pf-tool-${opts.algo}" value="${FREE}"> Borrar</label>
        <label><input type="checkbox" class="pf-stop" checked> Parar al llegar al jugador</label>
        ${opts.breadcrumbs ? `<label><input type="checkbox" class="pf-bc" checked> Ver breadcrumbs</label>` : ""}
        ${opts.terrain ? `<label><input type="checkbox" class="pf-cost"> Ver costSoFar</label>` : ""}
      </div>
      <div class="readout pf-out"></div>
      <pre class="log pf-log"></pre>`;

    const cv = root.querySelector(".pf-cv"), ctx = Curso.canvas(cv, W * S, H * S);
    const out = root.querySelector(".pf-out"), logEl = root.querySelector(".pf-log");
    const stopCb = root.querySelector(".pf-stop"), bcCb = root.querySelector(".pf-bc"), costCb = root.querySelector(".pf-cost");
    const algoSel = root.querySelector(".pf-algo"), speed = root.querySelector(".pf-speed");
    const grid = new Array(W * H).fill(FREE);
    // Mapa inicial
    for (let y = 1; y < 10; y++) grid[y * W + 8] = WALL;
    for (let x = 8; x < 18; x++) grid[9 * W + x] = WALL;
    for (let y = 3; y < 9; y++) grid[y * W + 15] = WALL;
    if (opts.terrain) { for (let y = 0; y < 5; y++) for (let x = 10; x < 14; x++) grid[y * W + x] = WATER; for (let y = 10; y < 12; y++) for (let x = 2; x < 20; x++) grid[y * W + x] = SAND; }
    let start = { x: 3, y: 5 }, goal = { x: 20, y: 6 };
    const algo = () => (algoSel ? algoSel.value : opts.algo);
    let st;
    const key = (p) => p.y * W + p.x;
    const walkable = (x, y) => x >= 0 && y >= 0 && x < W && y < H && grid[y * W + x] !== WALL;
    function reset() {
      st = { frontier: [{ x: start.x, y: start.y, p: 0 }], visited: new Set([key(start)]), bc: new Map([[key(start), key(start)]]), cost: new Map([[key(start), 0]]), cur: null, found: false, done: false, steps: 0, path: [], lines: [] };
      log(algo() === "bfs" ? "ResetPath(): frontier = [START], visited = {START}" : "ResetPath(): frontierDijkstra = [(START, 0)], costSoFar[START] = 0");
    }
    function log(s) { if (!st) return; st.lines.push(s); if (st.lines.length > 40) st.lines.shift(); logEl.textContent = st.lines.join("\n"); logEl.scrollTop = logEl.scrollHeight; }
    function computePath() {
      st.path = []; let k = key(goal), guard = 0;
      while (guard++ < W * H) { st.path.push(k); const prev = st.bc.get(k); if (prev === undefined || prev === k) break; k = prev; }
      st.path.reverse();
    }
    const name = (k) => `(${k % W},${Math.floor(k / W)})`;
    function step() {
      if (st.done) return;
      if (!st.frontier.length) { st.done = true; log("frontier vacía -> fin de la exploración" + (st.found ? "" : " (no hay camino)")); return; }
      let cur;
      if (algo() === "bfs") cur = st.frontier.shift();                       // queue: FIFO
      else {                                                                  // priority queue: menor coste primero
        let bi = 0; for (let i = 1; i < st.frontier.length; i++) if (st.frontier[i].p < st.frontier[bi].p) bi = i;
        cur = st.frontier.splice(bi, 1)[0];
        if (cur.p > st.cost.get(key(cur))) { log(`pop ${name(key(cur))} con coste viejo ${cur.p}: se descarta`); return; }
      }
      st.cur = cur; st.steps++;
      if (cur.x === goal.x && cur.y === goal.y) {
        st.found = true; computePath();
        log(`pop ${name(key(cur))} = DESTINO -> ComputePath(): ${st.path.length - 1} pasos` + (algo() === "dijkstra" ? `, coste ${st.cost.get(key(goal))}` : ""));
        if (stopCb.checked) { st.done = true; return; }
      }
      const nb = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      const added = [];
      for (const [dx, dy] of nb) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (!walkable(nx, ny)) continue;
        const nk = ny * W + nx;
        if (algo() === "bfs") {
          if (!st.visited.has(nk)) { st.visited.add(nk); st.bc.set(nk, key(cur)); st.frontier.push({ x: nx, y: ny, p: 0 }); added.push(name(nk)); }
        } else {
          const c = st.cost.get(key(cur)) + COST[grid[nk]];
          if (!st.visited.has(nk) || c < st.cost.get(nk)) { st.cost.set(nk, c); st.visited.add(nk); st.bc.set(nk, key(cur)); st.frontier.push({ x: nx, y: ny, p: c }); added.push(name(nk) + "=" + c); }
        }
      }
      log(`pop ${name(key(cur))}${algo() === "dijkstra" ? " coste " + st.cost.get(key(cur)) : ""} -> añade ${added.length ? added.join(" ") : "nada"}`);
    }
    function draw() {
      ctx.clearRect(0, 0, ctx.W, ctx.H);
      const fset = new Set(st.frontier.map(key));
      const pset = new Set(st.path);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const k = y * W + x, t = grid[k];
        let col = Curso.color("surface");
        if (t === WALL) col = Curso.color("ink-2");
        else if (t === SAND) col = "#e6cf98"; else if (t === WATER) col = "#7fb2e5";
        ctx.fillStyle = col; ctx.fillRect(x * S, y * S, S, S);
        if (t !== WALL && st.visited.has(k)) { ctx.fillStyle = "rgba(53, 82, 200, .22)"; ctx.fillRect(x * S, y * S, S, S); }
        if (fset.has(k)) { ctx.fillStyle = "rgba(230, 150, 20, .55)"; ctx.fillRect(x * S + 3, y * S + 3, S - 6, S - 6); }
        if (pset.has(k)) { ctx.fillStyle = "rgba(31, 138, 76, .75)"; ctx.fillRect(x * S + 6, y * S + 6, S - 12, S - 12); }
      }
      ctx.strokeStyle = Curso.color("line");
      for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x * S + .5, 0); ctx.lineTo(x * S + .5, ctx.H); ctx.stroke(); }
      for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0, y * S + .5); ctx.lineTo(ctx.W, y * S + .5); ctx.stroke(); }
      if (bcCb && bcCb.checked) {
        ctx.strokeStyle = Curso.color("ink-3"); ctx.lineWidth = 1.2;
        st.bc.forEach((from, k) => {
          if (from === k) return;
          const x = (k % W) * S + S / 2, y = Math.floor(k / W) * S + S / 2, fx = (from % W) * S + S / 2, fy = Math.floor(from / W) * S + S / 2;
          const ex = x + (fx - x) * .42, ey = y + (fy - y) * .42;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, 7); ctx.fillStyle = Curso.color("ink-3"); ctx.fill();
        });
        ctx.lineWidth = 1;
      }
      if (costCb && costCb.checked) {
        ctx.fillStyle = Curso.color("ink"); ctx.font = "9px JetBrains Mono, monospace"; ctx.textAlign = "center";
        st.cost.forEach((c, k) => ctx.fillText(String(c), (k % W) * S + S / 2, Math.floor(k / W) * S + S / 2 + 3));
        ctx.textAlign = "left";
      }
      if (st.cur) { ctx.strokeStyle = Curso.color("accent"); ctx.lineWidth = 2.5; ctx.strokeRect(st.cur.x * S + 1.5, st.cur.y * S + 1.5, S - 3, S - 3); ctx.lineWidth = 1; }
      // enemigo y jugador
      ctx.fillStyle = Curso.color("bad"); ctx.beginPath(); ctx.arc(start.x * S + S / 2, start.y * S + S / 2, S * .34, 0, 7); ctx.fill();
      ctx.fillStyle = Curso.color("accent"); ctx.fillRect(goal.x * S + 5, goal.y * S + 4, S - 10, S - 8);
      ctx.fillStyle = "#fff"; ctx.font = "bold 10px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("E", start.x * S + S / 2, start.y * S + S / 2 + 4); ctx.fillText("P", goal.x * S + S / 2, goal.y * S + S / 2 + 4); ctx.textAlign = "left";
      const fr = st.frontier.slice(0, 6).map((f) => `(${f.x},${f.y})${algo() === "dijkstra" ? ":" + f.p : ""}`).join(" ");
      out.innerHTML = `<span>iteraciones <b>${st.steps}</b></span><span>visited <b>${st.visited.size}</b></span><span>frontier <b>${st.frontier.length}</b>: ${fr}${st.frontier.length > 6 ? " …" : ""}</span>${st.found ? `<span>camino <b>${st.path.length - 1} pasos</b>${algo() === "dijkstra" ? ` · coste <b>${st.cost.get(key(goal))}</b>` : ""}</span>` : ""}`;
    }
    // Interacción
    let running = false, acc = 0, drag = null;
    const runBtn = root.querySelector('[data-a="run"]');
    const setRun = (v) => { running = v; runBtn.textContent = v ? "Pausa" : "Reproducir (Shift+J)"; };
    root.querySelector('[data-a="step"]').onclick = () => { step(); };
    runBtn.onclick = () => setRun(!running);
    root.querySelector('[data-a="reset"]').onclick = () => { setRun(false); reset(); };
    if (algoSel) Curso.on(algoSel, "change", () => { setRun(false); reset(); });
    const keys = Curso.teclado(cv, (e) => {
      if (e.code === "KeyJ" && !e.shiftKey) step();
      if (e.code === "KeyR") { setRun(false); reset(); }
    });
    const cell = (e) => { const p = Curso.puntero(cv, e, ctx.W, ctx.H); return { x: Math.floor(p.x / S), y: Math.floor(p.y / S) }; };
    const tool = () => +root.querySelector(`input[name="pf-tool-${opts.algo}"]:checked`).value;
    Curso.on(cv, "pointerdown", (e) => {
      const c = cell(e); if (c.x < 0 || c.y < 0 || c.x >= W || c.y >= H) return;
      cv.focus(); cv.setPointerCapture(e.pointerId);
      if (c.x === start.x && c.y === start.y) drag = "start";
      else if (c.x === goal.x && c.y === goal.y) drag = "goal";
      else { drag = "paint"; grid[c.y * W + c.x] = tool(); }
      setRun(false); reset();
    });
    Curso.on(cv, "pointermove", (e) => {
      if (!drag) return; const c = cell(e); if (c.x < 0 || c.y < 0 || c.x >= W || c.y >= H) return;
      if (drag === "paint") { if ((c.x !== start.x || c.y !== start.y) && (c.x !== goal.x || c.y !== goal.y)) grid[c.y * W + c.x] = tool(); }
      else if (grid[c.y * W + c.x] !== WALL) { if (drag === "start") start = c; else goal = c; }
      reset();
    });
    Curso.on(cv, "pointerup", () => (drag = null));
    reset();
    Curso.bucle((dt) => {
      const hold = keys.has("KeyJ") && (keys.has("ShiftLeft") || keys.has("ShiftRight"));
      if (running || hold) { acc += dt * +speed.value; while (acc >= 1) { acc -= 1; step(); if (st.done) { setRun(false); break; } } }
      draw();
    });
  };
})();
