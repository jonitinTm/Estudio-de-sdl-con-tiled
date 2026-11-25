(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-base", titulo: "SDL3: ventana, renderer y eventos", icono: "SDL",
    desc: "SDL_Init, SDL_CreateWindow, SDL_CreateRenderer, dibujar rectángulos, presentar, el bucle de eventos y los errores.",
    chuleta: [
      ["Lo mínimo", "```if (!SDL_Init(SDL_INIT_VIDEO)) { SDL_Log(\"%s\", SDL_GetError()); return 1; }\nSDL_Window* window = SDL_CreateWindow(\"Juego\", 1280, 720, 0);\nSDL_Renderer* renderer = SDL_CreateRenderer(window, NULL);\n\nbool running = true;\nwhile (running) {\n    SDL_Event e;\n    while (SDL_PollEvent(&e))\n        if (e.type == SDL_EVENT_QUIT) running = false;\n    SDL_SetRenderDrawColor(renderer, 20, 20, 30, 255);\n    SDL_RenderClear(renderer);\n    SDL_FRect r = { 100, 100, 50, 50 };\n    SDL_SetRenderDrawColor(renderer, 255, 200, 0, 255);\n    SDL_RenderFillRect(renderer, &r);\n    SDL_RenderPresent(renderer);\n}\nSDL_DestroyRenderer(renderer); SDL_DestroyWindow(window); SDL_Quit();```"],
      ["SDL3 vs SDL2", "En SDL3 casi todo devuelve **bool** (true = bien). CreateWindow ya no recibe x, y. Los rectángulos de dibujo son `SDL_FRect` (floats). Los eventos se llaman `SDL_EVENT_...`."]
    ],
    preguntas: [
      test("En SDL3, ¿qué devuelve `SDL_Init` si todo va bien?", ["0", "true", "-1", "Un puntero"], 1, "En SDL2 devolvía 0. En SDL3 es bool: por eso `if (!SDL_Init(...))` es el error.", { nuevo: true }),
      escribe("Escribe la creación de una ventana de 1280×720 sin flags, título \"Juego\" (variable `window`).", [/^SDL_Window\*window=SDL_CreateWindow\("Juego",1280,720,0\)$/, /^window=SDL_CreateWindow\("Juego",1280,720,0\)$/], "En SDL3 no hay x, y en CreateWindow.", { sol: "SDL_Window* window = SDL_CreateWindow(\"Juego\", 1280, 720, 0);", ph: "SDL_Window* window = ..." }),
      huecos("Crea el renderer.", String.raw`SDL_Renderer* renderer = SDL_CreateRenderer(▢, ▢);
if (renderer == nullptr) LOG("Error: %s", SDL_GetError());`, ["window", "NULL", "renderer", "SDL_INIT_VIDEO"], ["window", "NULL"], "El segundo parámetro es el nombre del driver: NULL = el mejor disponible."),
      orden("Un frame de dibujado.", ["SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);", "SDL_RenderClear(renderer);", "DibujarTodo();", "SDL_RenderPresent(renderer);"], "Limpiar, dibujar, presentar. Sin Present no ves nada."),
      test("¿Qué hace `SDL_RenderPresent`?", ["Borra la pantalla", "Muestra en la ventana todo lo dibujado desde el último Present (intercambia buffers)", "Crea el renderer", "Lee el teclado"], 1, ""),
      bug("La ventana se queda en negro.", [
        "SDL_RenderClear(renderer);",
        "SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);",
        "SDL_RenderFillRect(renderer, &r);"], 2, "Falta `SDL_RenderPresent(renderer);` después de dibujar. Sin él, nada llega a la pantalla."),
      test("¿Qué tipo usa SDL_RenderFillRect en SDL3?", ["SDL_Rect (int)", "SDL_FRect (float)", "SDL_Point", "Vector2D"], 1, "SDL_Rect sigue existiendo (por ejemplo para secciones), pero el render usa floats."),
      huecos("El bucle de eventos.", String.raw`SDL_Event event;
while (▢(&event))
{
    if (event.type == ▢) running = false;
}`, ["SDL_PollEvent", "SDL_EVENT_QUIT", "SDL_WaitEvent", "SDL_QUIT", "SDL_EVENT_KEY_DOWN"], ["SDL_PollEvent", "SDL_EVENT_QUIT"], "SDL_QUIT era el nombre de SDL2."),
      test("¿Por qué `while (SDL_PollEvent(...))` y no `if`?", ["Es igual", "En un frame pueden llegar muchos eventos: hay que vaciar la cola entera", "Para esperar", "Por la CPU"], 1, ""),
      test("¿Qué pasa si no llamas a SDL_PollEvent nunca?", ["Nada", "El sistema cree que la ventana no responde (y no puedes cerrarla)", "Va más rápido", "Crash inmediato"], 1, ""),
      escribe("Escribe cómo pones el color de dibujo a blanco opaco.", ["SDL_SetRenderDrawColor(renderer, 255, 255, 255, 255)"], "R, G, B, A de 0 a 255.", { ph: "SDL_SetRenderDrawColor(..." }),
      test("¿Qué hace `SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND)`?", ["Nada", "Que el alfa del color se tenga en cuenta (rectángulos semitransparentes, debug)", "Borra la pantalla", "Activa VSYNC"], 1, ""),
      orden("Cierre limpio.", ["SDL_DestroyTexture(tex);", "SDL_DestroyRenderer(renderer);", "SDL_DestroyWindow(window);", "SDL_Quit();"], "Al revés de como se creó: las texturas dependen del renderer, el renderer de la ventana."),
      test("¿Para qué sirve `SDL_GetError()`?", ["Para lanzar excepciones", "Devuelve el texto del último error de SDL: lo imprimes cuando algo falla", "Cierra SDL", "Nada"], 1, ""),
      test("Quieres pixel art nítido al escalar la ventana. ¿Qué usas?", ["SDL_SCALEMODE_LINEAR", "SDL_SetTextureScaleMode(tex, SDL_SCALEMODE_NEAREST) (y/o SDL_SetRenderScale para escalar todo)", "Más resolución", "Nada"], 1, ""),
      test("¿Qué hace `SDL_SetRenderScale(renderer, 2.0f, 2.0f)`?", ["Dobla la ventana", "Todo lo que dibujas se ve el doble de grande", "Cambia la resolución del monitor", "Nada"], 1, "")
    ]
  });
})();
