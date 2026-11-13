Curso.practica({
  leccion: "l01",
  titulo: "Tu primer programa SDL3, línea a línea",
  intro: "Vas a escribir el programa mínimo de SDL: abrir una ventana, mantener el bucle vivo y dibujar un cuadrado. Es la base sobre la que se monta todo el motor.",
  pasos: [
    {
      t: "Arrancar SDL",
      exp: `<p>Antes de usar nada, SDL necesita arrancar los subsistemas que vas a usar. A <code>SDL_Init</code> se le pasan <em>flags</em>: constantes que dicen qué encender. Para tener ventana y dibujo basta con el subsistema de vídeo.</p>`,
      code: String.raw`
#include <SDL3/SDL.h>

int main(int argc, char* argv[])
{
    SDL_Init(§s1§);`,
      slots: { s1: { ok: ["SDL_INIT_VIDEO", /^SDL_INIT_VIDEO\|.+$/], err: [[/^SDL_INIT_EVERYTHING$/, "En SDL3 ya no existe SDL_INIT_EVERYTHING. Pide solo lo que usas."], [/video/i, "Casi: las constantes de SDL van en MAYÚSCULAS."]] } },
      pistas: ["Todas las flags empiezan por <code>SDL_INIT_</code>.", "Queremos el subsistema de <em>vídeo</em>."],
      bien: "<p>SDL_INIT_VIDEO enciende ventanas y render (y también eventos). Si luego quieres sonido añadirás <code>| SDL_INIT_AUDIO</code>: las flags se combinan con el operador <code>|</code>.</p>"
    },
    {
      t: "Crear la ventana",
      exp: `<p><code>SDL_CreateWindow(título, ancho, alto, flags)</code> crea la ventana y te devuelve un <em>puntero</em> a ella. Crea una de 1280×720 con el título que quieras.</p>`,
      code: String.raw`    SDL_Window* window = §s1§("Mi juego", §s2§, §s3§, 0);`,
      slots: {
        s1: { ok: ["SDL_CreateWindow"], err: [[/^CreateWindow$/i, "Recuerda el prefijo SDL_ de todas las funciones."]] },
        s2: { ok: ["1280"], err: [[/^720$/, "Primero va el ANCHO y luego el ALTO."]], w: 6 },
        s3: { ok: ["720"], err: [[/^1280$/, "Primero va el ANCHO y luego el ALTO."]], w: 6 }
      },
      pistas: ["El nombre sigue el patrón SDL_ + Verbo + Cosa.", "Los números son 1280 y 720, en ese orden."],
      bien: "<p>El <code>*</code> de <code>SDL_Window*</code> indica que guardas una dirección de memoria. SDL es dueña de esa ventana: al final tendrás que llamar a <code>SDL_DestroyWindow(window)</code>.</p>"
    },
    {
      t: "Crear el renderer",
      exp: `<p>La ventana es el marco; el <strong>renderer</strong> es quien dibuja dentro usando la GPU. Necesita saber <em>en qué ventana</em> dibuja. El segundo parámetro (<code>nullptr</code>) deja que SDL elija el mejor driver.</p>`,
      code: String.raw`    SDL_Renderer* renderer = SDL_CreateRenderer(§s1§, nullptr);`,
      slots: { s1: { ok: ["window"], err: [[/^SDL_Window\*?$/, "Pasa la VARIABLE que creaste en el paso anterior, no el tipo."]] } },
      pistas: ["Es la variable del paso anterior."],
      bien: "<p>Todo lo que dibujes irá a través de <code>renderer</code>. En el motor de clase, esto lo hace el módulo Render en su Awake.</p>"
    },
    {
      t: "El bucle de juego y los eventos",
      exp: `<p>Ahora el corazón: un bucle que se repite mientras <code>running</code> sea true. Dentro, primero hay que <strong>vaciar la cola de eventos</strong> con <code>SDL_PollEvent(&amp;e)</code>, que devuelve true mientras queden eventos. Si llega <code>SDL_EVENT_QUIT</code> (el usuario cierra la ventana), pon <code>running</code> a false.</p><p>Escribe el <code>while</code> interior de los eventos.</p>`,
      escribe: {
        antes: String.raw`    bool running = true;
    while (running)
    {
        SDL_Event e;`,
        despues: String.raw`        // ... aquí irá el dibujado
    }`,
        filas: 5,
        checks: [
          [/while\(SDL_PollEvent\(&e\)\)/, "Necesitas un <code>while (SDL_PollEvent(&amp;e))</code>. Ojo al <code>&amp;</code>: SDL rellena el evento a través de su dirección."],
          [/e\.type==SDL_EVENT_QUIT/, "Dentro, compara <code>e.type</code> con <code>SDL_EVENT_QUIT</code> (con dos <code>==</code>)."],
          [/running=false/, "Cuando llegue el evento de salir, pon <code>running = false;</code>"]
        ],
        prohibido: [[/if\(e\.type=SDL_EVENT_QUIT\)/, "Has escrito <code>=</code> (asignar) en vez de <code>==</code> (comparar). Es uno de los errores más típicos de C++."]],
        sol: String.raw`        while (SDL_PollEvent(&e))
        {
            if (e.type == SDL_EVENT_QUIT)
                running = false;
        }`
      },
      pistas: ["Estructura: <code>while (...) { if (...) running = false; }</code>", "La condición del while es <code>SDL_PollEvent(&amp;e)</code>; la del if, <code>e.type == SDL_EVENT_QUIT</code>."],
      bien: "<p>Se usa <code>while</code> y no <code>if</code> porque en un frame pueden llegar varios eventos (teclas, ratón…) y hay que procesarlos todos. En el motor esto vive en el módulo Input, en su PreUpdate.</p>"
    },
    {
      t: "Borrar, dibujar, presentar",
      exp: `<p>Cada frame se dibuja desde cero: primero se <strong>borra</strong> la pantalla con el color de fondo, luego se dibuja todo y al final se <strong>presenta</strong> (se muestra) el resultado. Si te olvidas de presentar, no verás nada.</p>`,
      code: String.raw`        SDL_SetRenderDrawColor(renderer, 30, 30, 40, 255);
        §s1§(renderer);              // borrar

        // ... dibujar ...

        §s2§(renderer);              // mostrar el frame`,
      slots: {
        s1: { ok: ["SDL_RenderClear"], err: [[/^SDL_RenderPresent$/, "Ese es el de MOSTRAR, va al final."]] },
        s2: { ok: ["SDL_RenderPresent"], err: [[/^SDL_RenderClear$/, "Ese es el de BORRAR, va al principio."]] }
      },
      pistas: ["Las dos empiezan por <code>SDL_Render</code>.", "Borrar en inglés: <em>clear</em>. Mostrar: <em>present</em>."],
      bien: "<p>SDL dibuja en un <em>back buffer</em> oculto; <code>SDL_RenderPresent</code> lo intercambia con lo que se ve. Así nunca ves un frame a medio dibujar.</p>"
    },
    {
      t: "Un cuadrado en (100, 200)",
      exp: `<p>Para dibujar un rectángulo relleno se describe con un <code>SDL_FRect</code> <code>{ x, y, w, h }</code> (la F es de <em>float</em>) y se pasa su dirección a <code>SDL_RenderFillRect</code>. Dibuja un cuadrado de 64×64 cuya esquina superior izquierda esté en x = 100, y = 200.</p>`,
      code: String.raw`        SDL_FRect rect = { §s1§, §s2§, 64.0f, 64.0f };
        SDL_SetRenderDrawColor(renderer, 255, 200, 0, 255);
        SDL_RenderFillRect(renderer, §s3§);`,
      slots: {
        s1: { ok: [/^100(\.0*)?f?$/], err: [[/^200(\.0*)?f?$/, "x va primero: 100."]], w: 7, sol: "100.0f" },
        s2: { ok: [/^200(\.0*)?f?$/], err: [[/^100(\.0*)?f?$/, "y va segundo: 200."]], w: 7, sol: "200.0f" },
        s3: { ok: ["&rect"], err: [[/^rect$/, "La función pide un PUNTERO al rectángulo: usa <code>&amp;rect</code> (la dirección de rect)."]], w: 7 }
      },
      pistas: ["El orden es x, y, ancho, alto.", "La función recibe <code>const SDL_FRect*</code>: un puntero. El operador <code>&amp;</code> te da la dirección de una variable."],
      bien: "<p><code>&amp;</code> delante de una variable = “su dirección”. Lo verás constantemente con SDL: <code>&amp;rect</code>, <code>&amp;e</code>… Y recuerda: Y = 200 significa 200 píxeles <em>hacia abajo</em> desde arriba.</p>"
    },
    {
      t: "Liberar al salir",
      exp: `<p>Lo que creas, lo destruyes, y en orden inverso: primero el renderer, luego la ventana, y por último apagas SDL. Escribe las tres líneas.</p>`,
      escribe: {
        antes: String.raw`    }   // fin del while (running)`,
        despues: String.raw`    return 0;
}`,
        filas: 4,
        checks: [
          [/SDL_DestroyRenderer\(renderer\);/, "Falta destruir el renderer: <code>SDL_DestroyRenderer(renderer);</code>"],
          [/SDL_DestroyWindow\(window\);/, "Falta destruir la ventana: <code>SDL_DestroyWindow(window);</code>"],
          [/SDL_Quit\(\);/, "Falta apagar SDL con <code>SDL_Quit();</code>"],
          [/SDL_DestroyRenderer\(renderer\);.*SDL_DestroyWindow\(window\);.*SDL_Quit\(\);/, "Están todas, pero el orden importa: renderer → ventana → SDL_Quit (al revés de como se crearon)."]
        ],
        sol: String.raw`    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();`
      },
      pistas: ["Las funciones son SDL_Destroy + lo que destruyes.", "El renderer depende de la ventana, así que se destruye antes."],
      bien: "<p>En el motor esto es lo que hace cada módulo en su <code>CleanUp()</code>, que el Engine llama en orden inverso al de creación. ¡Ya has escrito un programa SDL completo!</p>"
    }
  ]
});
