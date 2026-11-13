(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  const aceptacion = [
    ["entrega", "Zip con el .exe en Release, todas las DLL y la carpeta Assets (pruébalo en otro PC o en otra carpeta)"],
    ["readme", "README con: enlace al juego original, nombres del grupo, enlace al GitHub, controles y diferencias con el original"],
    ["release", "El mismo zip publicado en la sección Releases de GitHub"],
    ["nombre", "Zip llamado Apellido1Nombre1_Apellido2Nombre2_etc.zip"],
    ["crash", "El juego no crashea en ninguna prueba (empezar, chocar, ganar, perder, reiniciar, cerrar)"],
    ["control", "Coches controlados con flechas izquierda/derecha y/o A y D"],
    ["espacio", "Una acción extra con la barra espaciadora (freno de mano, nitro, disparo…)"],
    ["inicio", "Principio y final claros, con tiempo individual por vuelta"],
    ["audio", "Efectos de sonido para distintas situaciones (salida, choque, vuelta, turbo, victoria…)"],
    ["tiempos", "Se ve el tiempo actual y el mejor tiempo de la sesión"],
    ["ia", "Los rivales tienen alguna forma de IA"],
    ["f1", "F1 dibuja todas las formas y permite usar el mouse joint"],
    ["sindebug", "El juego se puede jugar sin información de debug"],
    ["mecanica", "Al menos una mecánica especial (turbo, nitro, ataques, aceite…)"],
    ["tiemporeal", "Va en tiempo real: sin “bullet time” descontrolado (paso fijo)"]
  ];

  Curso.leccion({
    id: "b11", num: "11", grupo: "Bloque 3 · El juego de carreras", corto: "El Proyecto 02",
    titulo: "El Proyecto 02 de principio a fin",
    resumen: "Requisitos de aceptación como checklist, criterios de nota, arquitectura, plan por fases, fugas de memoria y entrega.",
    intro: "Ya tienes todas las piezas. Esta lección las ordena en un plan para el Proyecto 02: qué hay que entregar para que te lo acepten, qué puntúa, cómo repartir el código en clases y en qué orden construirlo para tener siempre algo que funciona.",
    objetivos: ["Cumplir todos los criterios de aceptación", "Saber qué se puntúa (50 % código, 50 % pulido)", "Organizar el código en módulos y entidades", "Entregar sin fugas de memoria y con la release bien hecha"],
    html: () => `
<h2>Requisitos de aceptación</h2>
<p>Si falla uno, <strong>no se corrige</strong>. Úsalo como checklist (se guarda en este navegador):</p>
<ul class="checklist" id="pj-check">${aceptacion.map(([id, t]) => `<li><label><input type="checkbox" data-id="${id}"> <span>${t}</span></label></li>`).join("")}</ul>
<div class="readout"><span>cumplidos <b id="pj-n">0</b> de ${aceptacion.length}</span></div>

<h2>Qué puntúa</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>50 % Código</th><th>50 % Pulido del juego</th></tr></thead><tbody>
<tr><td>Claro y bien estructurado (clases, nombres, sin copiar y pegar)</td><td>Condición clara de ganar y perder</td></tr>
<tr><td><strong>Sin fugas de memoria</strong></td><td>Divertido y cómodo de jugar, reglas claras</td></tr>
<tr><td>El foco está en el <strong>código de físicas</strong></td><td>Se reconoce el juego original (gráficos, animaciones, audio, marcador). Se premia la creatividad.</td></tr>
</tbody></table></div>

<h2>Arquitectura recomendada</h2>
<p>Parte del handout (Application + módulos) y añade clases de entidad (lección 07):</p>
${code(String.raw`
Application
 ├─ ModuleWindow, ModuleRender, ModuleAudio
 ├─ ModulePhysics      → mundo, Step fijo, CreateCircle/Rectangle/Chain/Sensor,
 │                       BeginContact/EndContact, debug draw + mouse joint (F1), DestroyBody
 └─ ModuleGame         → estado de la carrera, circuito, checkpoints, HUD, récord de la sesión
       entities: std::vector<PhysicEntity*>
         PhysicEntity (abstracta)
          ├─ Car (abstracta)  → UpdateFriction(), Drive(), Steer(), LapCompleted(), Draw()
          │    ├─ PlayerCar   → input
          │    └─ AICar       → waypoints + rayos
          ├─ Checkpoint       → sensor con índice
          └─ BoostPad / OilPatch → sensores de zona`, "txt", "Esqueleto")}
${nota(`<p>Fíjate en que la física de conducción vive <strong>una sola vez</strong> en Car. PlayerCar y AICar solo deciden <code>throttle</code> y <code>steer</code>. Eso es exactamente lo que el profesor mirará como “código claro y bien estructurado” y “foco en las físicas”.</p>`)}

<h2>Plan por fases (siempre con algo jugable)</h2>
<ol>
<li><strong>Elegir juego y assets.</strong> Un top-down de carreras (Micro Machines, Super Sprint, Ice Racer…), o reskin: naves, motos, barcos, rinocerontes… Saca los sprites y el circuito.</li>
<li><strong>Coche en una caja vacía</strong> (lección 08). Ajusta el tacto hasta que sea divertido. Gravedad 0. Textura centrada y rotada.</li>
<li><strong>Circuito</strong> (lección 09): dos cadenas, cámara si no cabe. Prueba con F1 que los muros coinciden con la imagen.</li>
<li><strong>Checkpoints, vueltas y tiempos</strong>: estados cuenta atrás → carrera → final. HUD con actual y mejor.</li>
<li><strong>IA</strong> (lección 10): un rival que complete vueltas solo. Luego dos o tres.</li>
<li><strong>Mecánica especial</strong>: turbo, nitro con Espacio, aceite… (lección 09, sección 5).</li>
<li><strong>Audio</strong>: motor, derrape, choque (puedes usar PostSolve o BeginContact entre coche y muro), vuelta, victoria.</li>
<li><strong>Pulido</strong>: pantalla de título, resultado final con posición, reinicio limpio, partículas de derrape.</li>
<li><strong>Limpieza</strong>: fugas de memoria, warnings, README, release.</li>
</ol>

<h2>Cero fugas de memoria</h2>
<p>Revisa cada <code>new</code> y su <code>delete</code>: entidades, PhysBody, arrays de vértices (<code>delete[]</code>), texturas (<code>UnloadTexture</code>), sonidos. En Visual Studio puedes pedir un informe al cerrar el programa:</p>
${code(String.raw`
// Main.cpp, al principio de main()
#define _CRTDBG_MAP_ALLOC
#include <stdlib.h>
#include <crtdbg.h>

int main(int argc, char** argv)
{
    _CrtSetDbgFlag(_CRTDBG_ALLOC_MEM_DF | _CRTDBG_LEAK_CHECK_DF);   // al salir, lista las fugas en Output
    ...
}`, "cpp", "Detectar fugas (solo Debug, Windows)")}
<p>Ejecuta en Debug, juega, reinicia la carrera varias veces y cierra. Si la ventana Output muestra “Detected memory leaks!”, algo no se libera. Los clásicos: entidades que no se borran al reiniciar, el PhysBody de los checkpoints, la lista <code>bodies_to_destroy</code> con punteros a cosas ya borradas.</p>

<h2>Errores típicos (y su lección)</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Síntoma</th><th>Causa probable</th><th>Lección</th></tr></thead><tbody>
<tr><td>Todo cae hacia abajo</td><td>Gravedad del mundo no es 0</td><td>05</td></tr>
<tr><td>El coche patina como en hielo</td><td>No cancelas la velocidad lateral</td><td>08</td></tr>
<tr><td>El coche no para nunca</td><td>Falta drag / ApplyFriction</td><td>05, 08</td></tr>
<tr><td>La textura no coincide con el debug</td><td>Dibujas desde la esquina, no desde el centro</td><td>02</td></tr>
<tr><td>El coche gira casi nada al dibujar</td><td>Olvidaste RAD2DEG</td><td>02</td></tr>
<tr><td>Crash al cruzar un sensor que destruye</td><td>DestroyBody dentro de OnCollision</td><td>03</td></tr>
<tr><td>Crash arrastrando con F1</td><td>mouse_joint colgando tras destruir el body</td><td>04</td></tr>
<tr><td>Vueltas que cuentan haciendo trampa</td><td>Solo detectas la meta, sin checkpoints en orden</td><td>09</td></tr>
<tr><td>Física más rápida en otro PC</td><td>Un Step por frame sin VSYNC / monitor &gt; 60 Hz</td><td>01</td></tr>
<tr><td>El mouse joint agarra en otro sitio</td><td>Usas cámara y no conviertes la posición del ratón</td><td>09</td></tr>
</tbody></table></div>

<h2>Entrega</h2>
<ol>
<li>Compila en <strong>Release</strong>. Copia el .exe, las DLL y <code>Assets/</code> a una carpeta limpia y ejecútalo desde ahí (si funciona solo desde Visual Studio, te falta algo).</li>
<li>Rellena el README del handout (Description, Key Features, Controls, Developers, License) + enlace al original y diferencias.</li>
<li>Comprime con el nombre <code>Apellido1Nombre1_Apellido2Nombre2.zip</code>.</li>
<li>En GitHub: Releases → <em>Draft a new release</em> → etiqueta (v1.0) → adjunta el zip → publica.</li>
<li>Entrega el mismo zip. Puedes entregar varias veces: cuenta la última.</li>
</ol>

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Qué pasa si el juego crashea durante la corrección?", o: ["Se resta nota", "No se acepta la entrega", "Nada si el código es bueno"], c: 1, e: "Es criterio de aceptación." },
      { p: "¿Dónde debe estar la física de conducción?", o: ["Copiada en PlayerCar y AICar", "Una vez en Car; las hijas solo deciden throttle y steer", "En ModulePhysics"], c: 1, e: "Herencia: código claro y sin repetir." },
      { p: "F1 debe…", o: ["Pausar el juego", "Dibujar las formas y permitir el mouse joint", "Mostrar el récord"], c: 1, e: "Y el juego debe poder jugarse sin debug." },
      { p: "¿Cómo compruebas que la release funciona?", o: ["Ejecutándola desde Visual Studio", "Copiando exe + DLL + Assets a otra carpeta y ejecutando ahí", "Con el modo Debug"], c: 1, e: "Así descubres DLL o assets que faltan." }
    ])}
`,
    init(root) {
      const marcados = Curso.store.get("checklist", {});
      const n = root.querySelector("#pj-n");
      const contar = () => (n.textContent = Object.values(marcados).filter(Boolean).length);
      root.querySelectorAll("#pj-check input").forEach((c) => {
        c.checked = !!marcados[c.dataset.id];
        Curso.on(c, "change", () => { marcados[c.dataset.id] = c.checked; Curso.store.set("checklist", marcados); contar(); });
      });
      contar();
    }
  });
})();
