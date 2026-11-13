(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  Curso.leccion({
    id: "b10", num: "10", grupo: "Bloque 3 · El juego de carreras", corto: "IA de los rivales",
    titulo: "IA de los rivales: waypoints, dirección y rubber banding",
    resumen: "Coches que siguen waypoints con GetLocalPoint y atan2, frenan en las curvas, esquivan muros con rayos y se adaptan a tu nivel.",
    intro: "El proyecto pide rivales con “alguna forma de IA” (no se puntúa lo buena que sea). La buena noticia: un rival es el mismo Car que el jugador. Solo cambia de dónde salen throttle y steer: del teclado o de un pequeño cerebro que mira el siguiente punto del circuito.",
    objetivos: ["Representar el recorrido con waypoints", "Calcular hacia dónde girar con GetLocalPoint y atan2", "Decidir el acelerador según la curva", "Esquivar muros con ray casts y equilibrar la carrera con rubber banding"],
    html: () => `
${demo("d-ai", "Carrera contra la IA", "Clic en el lienzo · conduce con W/S/A/D o flechas · R: reiniciar", `
<canvas id="ai-cv"></canvas>
<div class="controls">
  <label><input type="checkbox" id="ai-dbg" checked> Ver waypoints, objetivos y rayos</label>
  <label><input type="checkbox" id="ai-rubber" checked> Rubber banding</label>
  <label><input type="checkbox" id="ai-whisk" checked> Rayos anti-muro</label>
  <label>Nivel IA <input type="range" id="ai-skill" min="0.6" max="1.2" step="0.05" value="0.9"></label>
</div>
<div class="readout" id="ai-out"></div>`)}
<p>Cada rival mira un punto un poco por delante (línea fina hacia su objetivo). Si el objetivo cae a su derecha, gira a la derecha; si la curva es cerrada, levanta el pie. Los rayos (en amarillo) detectan muros cerca y corrigen. Desactiva los rayos y sube el nivel: verás más choques.</p>

<h2>1. Waypoints: el recorrido como una lista de puntos</h2>
<p>Un <strong>waypoint</strong> es un punto del trazado ideal. La lista, en orden, describe la vuelta. Los puedes sacar igual que los vértices de los muros (con el shape creator, haciendo clic por el centro de la pista), o colocarlos en Tiled en un object layer, o escribirlos a mano.</p>
${code(String.raw`
static const vec2<int> waypoints[] = { {640, 110}, {980, 120}, {1150, 250}, /* ... */ };
static const int WAYPOINT_COUNT = sizeof(waypoints) / sizeof(waypoints[0]);

class AICar : public Car
{
public:
    void Update() override;
private:
    int target = 0;               // índice del waypoint al que va
};`, "cpp", "AICar.h")}

<h2>2. ¿Está el objetivo a mi izquierda o a mi derecha?</h2>
<p>El truco: pasar el objetivo a <strong>coordenadas locales del coche</strong> con <code>GetLocalPoint</code>. En local, el coche está en (0, 0) mirando hacia (0, −1). Entonces:</p>
<ul>
<li><code>local.x &gt; 0</code> → el objetivo está a la derecha.</li>
<li><code>local.y &lt; 0</code> → está delante.</li>
<li>El ángulo exacto: <code>atan2(local.x, -local.y)</code> → 0 = recto delante, positivo = derecha, negativo = izquierda, ±π = justo detrás.</li>
</ul>
${code(String.raw`
void AICar::Update()
{
    b2Body* b = body->body;
    b2Vec2 goal(PIXEL_TO_METERS(waypoints[target].x), PIXEL_TO_METERS(waypoints[target].y));

    // ¿He llegado? -> siguiente waypoint (radio generoso: 2-3 m)
    if ((goal - b->GetPosition()).Length() < 2.5f)
        target = (target + 1) % WAYPOINT_COUNT;

    b2Vec2 local = b->GetLocalPoint(goal);
    float angle = atan2f(local.x, -local.y);            // radianes, 0 = recto

    float steer = angle * 2.0f;                          // proporcional al error
    if (steer >  1.0f) steer =  1.0f;
    if (steer < -1.0f) steer = -1.0f;

    float throttle = (fabsf(angle) > 0.6f) ? 0.4f : 1.0f; // curva cerrada: menos gas

    UpdateFriction();
    Drive(throttle);
    Steer(steer);
    Draw();
}`, "cpp", "AICar.cpp")}
${nota(`<p>Esto es un <strong>controlador proporcional</strong>: giras más cuanto más lejos está el objetivo de tu morro. Si el coche hace zigzag (se pasa a un lado y al otro), baja el 2.0f; si toma las curvas abiertas, súbelo o apunta a un waypoint más adelantado (“lookahead”).</p>`)}

<h2>3. Rayos anti-muro</h2>
<p>Lanza dos o tres rayos desde el morro (frente-izquierda, frente-derecha). Si uno toca un muro cerca, gira hacia el otro lado. Tu <code>PhysBody::RayCast</code> de la lección 03 ya sirve: pásale los muros.</p>
${code(String.raw`
// Puntos en píxeles: morro del coche y punto a 120 px en diagonal
int x, y; body->GetPosition(x, y);
b2Vec2 fl = b->GetWorldVector(b2Vec2(-0.5f, -1.0f)); fl.Normalize();
int ex = x + (int)(fl.x * 120.0f), ey = y + (int)(fl.y * 120.0f);

float nx, ny;
int d = walls_outer->RayCast(x, y, ex, ey, nx, ny);
int d2 = walls_inner->RayCast(x, y, ex, ey, nx, ny);
if (d < 0 || (d2 >= 0 && d2 < d)) d = d2;               // el más cercano de los dos

if (d >= 0) steer += 1.0f - d / 120.0f;                  // muro a la izquierda: gira a la derecha`, "cpp", "AICar.cpp")}

<h2>4. Rubber banding</h2>
<p>Un truco de casi todos los juegos de carreras: si el rival va muy por delante, le bajas un poco la velocidad máxima; si va por detrás, se la subes. La carrera se mantiene emocionante sin que se note demasiado. Para saber quién va delante necesitas el <strong>progreso</strong> de cada coche:</p>
<div class="formula">progreso = vueltas × N_checkpoints + checkpoints_pasados − distancia_al_siguiente / 1000</div>
${code(String.raw`
float gap = Progress(this) - Progress(player);      // >0: la IA va delante
max_speed = base_max_speed * (gap > 0 ? 0.92f : 1.08f);`, "cpp")}
<p>El mismo progreso te da la <strong>posición</strong> en carrera (ordena los coches por progreso) para el HUD: “2º / 4”.</p>

${nota(`<p>Un rival también es un <code>Car</code> con su <code>next_checkpoint</code>, sus vueltas y su timer: el mismo código de la lección 09 cuenta sus vueltas. Así sabes quién gana. Y en debug (F1) puedes arrastrar rivales con el mouse joint para probar que no se pierden (deben volver a su waypoint).</p>`, "game", "Para el proyecto")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "GetLocalPoint(goal) da (2, −5). ¿Dónde está el objetivo?", o: ["Delante y a la derecha", "Detrás a la izquierda", "Justo delante"], c: 0, e: "x > 0 derecha, y < 0 delante." },
      { p: "atan2(local.x, −local.y) vale 0. ¿Qué haces?", o: ["Girar a tope", "Ir recto", "Frenar"], c: 1, e: "El objetivo está justo delante." },
      { p: "El rival hace zigzag por la recta. ¿Qué ajustas?", o: ["Bajar la ganancia del giro o mirar más adelante", "Subir la masa", "Quitar los checkpoints"], c: 0, e: "Controlador proporcional demasiado agresivo." },
      { p: "¿Para qué sirve el rubber banding?", o: ["Para que los coches reboten", "Para que la carrera esté igualada ajustando la velocidad de la IA", "Para el derrape"], c: 1, e: "Delante: más lento; detrás: más rápido." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#ai-cv"), out = root.querySelector("#ai-out");
      const q = (id) => root.querySelector(id);
      const sim = B2.mundo(cv, { w: 760, h: 460, ppm: 25, gravedad: [0, 0], debug: false });
      const pista = B2.crearCircuito(sim, { ancho: 46, checkpoints: 8 });
      const g = B2.gestorCarrera(sim, pista, { vueltas: 3 });
      const V = B2.Vec2, N = pista.N;
      const jugador = g.registrar(B2.crearCoche(sim, 0, 0, 0, { hw: 8, hh: 15, color: "#e5533d" }));
      jugador.jugador = true; jugador.nombre = "Tú";
      const ias = [["#3b82f6", "Azul"], ["#22c55e", "Verde"], ["#eab308", "Amarillo"]].map(([c, n]) => { const a = g.registrar(B2.crearCoche(sim, 0, 0, 0, { hw: 8, hh: 15, color: c })); a.nombre = n; a.wp = 0; a.base = 9; return a; });
      const colocar = () => { B2.parrilla(sim, pista, jugador, 2, -16); ias.forEach((a, i) => { B2.parrilla(sim, pista, a, 4 + i * 2, i % 2 ? -16 : 16); a.wp = 1; }); };
      colocar();
      const keys = Curso.teclado(cv, (e) => { if (e.code === "KeyR") { g.reiniciar(); colocar(); } });
      sim.fondo = (ctx) => B2.dibujarPista(ctx, pista);
      const rayo = (a, lx, ly, len) => {
        const p = a.body.getPosition(), d = a.body.getWorldVector(V(lx, ly)); const l = Math.hypot(d.x, d.y);
        const e = V(p.x + d.x / l * len, p.y + d.y / l * len); let hit = null;
        sim.world.rayCast(p, e, (f, pt, n, fr) => { if (f.isSensor() || !(f.getBody().getUserData() || {}).muro) return -1; hit = { pt, fr }; return fr; });
        return { p, e, hit };
      };
      sim.onPaso((dt) => {
        g.paso(dt);
        const corre = g.estado !== "cuenta";
        let th = 0, st = 0;
        if (corre && !jugador.finished) {
          if (keys.has("KeyW") || keys.has("ArrowUp")) th += 1; if (keys.has("KeyS") || keys.has("ArrowDown")) th -= 1;
          if (keys.has("KeyA") || keys.has("ArrowLeft")) st -= 1; if (keys.has("KeyD") || keys.has("ArrowRight")) st += 1;
        }
        jugador.handbrake = keys.has("Space");
        jugador.updateGrip(); jugador.drive(th); jugador.steer(st);
        ias.forEach((a, i) => {
          a.rayos = [];
          const p = a.body.getPosition();
          let w = pista.centro[a.wp];
          if (Math.hypot(w.x / 25 - p.x, w.y / 25 - p.y) < 2.6) a.wp = (a.wp + 1) % N;
          const objIdx = (a.wp + 1) % N, o = pista.centro[objIdx], n = pista.normal(objIdx);
          const carril = (i - 1) * 10;
          a.objetivo = { x: o.x + n.x * carril, y: o.y + n.y * carril };
          const local = a.body.getLocalPoint(V(a.objetivo.x / 25, a.objetivo.y / 25));
          const ang = Math.atan2(local.x, -local.y);
          let steer = Math.max(-1, Math.min(1, ang * 2));
          let thr = Math.abs(ang) > 0.6 ? 0.4 : 1;
          if (q("#ai-whisk").checked) {
            [[-0.5, -1, 1], [0.5, -1, -1]].forEach(([lx, ly, s]) => { const r = rayo(a, lx, ly, 3.2); a.rayos.push(r); if (r.hit) { steer += s * (1 - r.hit.fr) * 1.5; thr = Math.min(thr, 0.7); } });
          }
          let factor = +q("#ai-skill").value;
          if (q("#ai-rubber").checked && corre) factor *= g.progreso(a) > g.progreso(jugador) ? 0.92 : 1.08;
          a.max_speed = a.base * factor;
          a.updateGrip();
          if (corre && !a.finished) { a.drive(thr); a.steer(Math.max(-1, Math.min(1, steer))); }
        });
      });
      sim.onDibujo((ctx) => {
        if (q("#ai-dbg").checked) {
          ctx.fillStyle = "rgba(255,255,255,.5)"; pista.centro.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fill(); });
          ias.forEach((a) => {
            const p = sim.pos(a.body);
            if (a.objetivo) { ctx.strokeStyle = a.color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(a.objetivo.x, a.objetivo.y); ctx.stroke(); ctx.beginPath(); ctx.arc(a.objetivo.x, a.objetivo.y, 5, 0, 7); ctx.stroke(); }
            (a.rayos || []).forEach((r) => { const e = r.hit ? r.hit.pt : r.e; ctx.strokeStyle = r.hit ? "#facc15" : "rgba(250,204,21,.35)"; ctx.beginPath(); ctx.moveTo(r.p.x * 25, r.p.y * 25); ctx.lineTo(e.x * 25, e.y * 25); ctx.stroke(); });
            ctx.lineWidth = 1;
          });
        }
        g.hud(ctx, jugador);
        const orden = [...g.cars].sort((a, b) => (b.finished && a.finished ? a.place - b.place : b.finished ? 1 : a.finished ? -1 : g.progreso(b) - g.progreso(a)));
        ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(ctx.W - 150, 8, 142, 18 + orden.length * 17);
        orden.forEach((c, i) => { ctx.fillStyle = c.color; ctx.fillRect(ctx.W - 142, 18 + i * 17, 10, 10); sim.texto(`${i + 1}º ${c.nombre} v${Math.min(c.lap + 1, g.vueltas)}`, ctx.W - 126, 27 + i * 17, "#fff", 12); });
        if (document.activeElement !== cv) sim.texto("Haz clic aquí para correr", 300, 240, "#fff", 14);
        const pos = orden.indexOf(jugador) + 1;
        out.innerHTML = `<span>tu posición <b>${pos}º / ${orden.length}</b></span><span>estado <b>${g.estado}</b></span><span>vel. máx IA <b>${ias.map((a) => a.max_speed.toFixed(1)).join(" / ")}</b> m/s</span>`;
      });
    }
  });
})();
