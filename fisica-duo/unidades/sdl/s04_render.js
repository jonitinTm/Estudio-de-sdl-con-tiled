(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-render", titulo: "Texturas y DrawTexture", icono: "🖼",
    desc: "Cargar texturas, secciones de un spritesheet, la cámara negativa, flip, rotación, escala, el HUD con speed = 0 y liberar memoria.",
    chuleta: [
      ["DrawTexture del motor", "```bool Render::DrawTexture(SDL_Texture* tex, int x, int y, const SDL_Rect* section = nullptr,\n                         float speed = 1.0f, double angle = 0, bool flip = false)\n{\n    SDL_FRect dst;\n    dst.x = (float)(camera.x * speed + x * scale);\n    dst.y = (float)(camera.y * speed + y * scale);\n    // tamaño: el de la sección o el de la textura entera\n    ...\n    SDL_RenderTextureRotated(renderer, tex, src, &dst, angle, NULL, flip ? SDL_FLIP_HORIZONTAL : SDL_FLIP_NONE);\n}```"],
      ["Reglas", "x, y en píxeles del **mundo**. La cámara es **negativa**. `speed = 0` → no se aplica la cámara (HUD). `speed = 0.5` → parallax."]
    ],
    preguntas: [
      escribe("Escribe la carga de \"Assets/player.png\" con SDL3_image (variable `tex`, renderer `renderer`).", [/^SDL_Texture\*tex=IMG_LoadTexture\(renderer,"Assets\/player\.png"\)$/, /^tex=IMG_LoadTexture\(renderer,"Assets\/player\.png"\)$/], "En el motor lo hace Textures::Load, que además guarda la textura para liberarla al final.", { ph: "SDL_Texture* tex = ..." }),
      test("¿Qué es una sección (SDL_Rect) en DrawTexture?", ["La posición en pantalla", "El trozo de la imagen que quieres dibujar (un frame del spritesheet o un tile)", "La cámara", "El color"], 1, "", { nuevo: true }),
      test("Spritesheet de frames de 32×32 en una fila. ¿Sección del frame 3 (empezando en 0)?", ["{ 3, 0, 32, 32 }", "{ 96, 0, 32, 32 }", "{ 0, 96, 32, 32 }", "{ 32, 32, 3, 3 }"], 1, "x = 3 · 32 = 96."),
      test("camera.x = -400. Dibujas un árbol en x = 500 (mundo). ¿Dónde aparece en pantalla?", ["900", "100", "-400", "500"], 1, "pantalla = camera.x + mundo = -400 + 500."),
      huecos("La transformación de mundo a pantalla dentro de DrawTexture.", String.raw`dst.x = (float)(camera.x * ▢ + x * scale);
dst.y = (float)(camera.y * speed + y * ▢);`, ["speed", "scale", "dt", "angle"], ["speed", "scale"], ""),
      test("¿Cómo dibujas el contador de monedas fijo en la esquina?", ["Con x = camera.x + 10", "Con speed = 0: la cámara no se aplica", "Con una cámara nueva", "No se puede"], 1, ""),
      test("¿Qué hace speed = 0.5 en el fondo de montañas?", ["Lo oculta", "Se mueve a la mitad de velocidad que la cámara: parallax", "Lo dobla", "Nada"], 1, ""),
      huecos("El jugador mira a la izquierda: voltea el sprite.", String.raw`SDL_FlipMode mode = facingLeft ? ▢ : ▢;
SDL_RenderTextureRotated(renderer, tex, &src, &dst, 0.0, NULL, mode);`, ["SDL_FLIP_HORIZONTAL", "SDL_FLIP_NONE", "SDL_FLIP_VERTICAL", "true"], ["SDL_FLIP_HORIZONTAL", "SDL_FLIP_NONE"], "Así no necesitas sprites duplicados para la izquierda."),
      test("¿En qué unidad está el ángulo de SDL_RenderTextureRotated?", ["Radianes", "Grados (sentido horario)", "Vueltas", "Píxeles"], 1, "Box2D da radianes: multiplica por 180/π (o usa `b2Rot_GetAngle(...) * 180.0f / B2_PI`)."),
      bug("Al cerrar el juego, el detector de fugas se queja de texturas.", [
        "bool Player::Start() { texture = Engine::GetInstance().textures->Load(\"Assets/player.png\"); return true; }",
        "bool Player::CleanUp() { return true; }"], 1, "Falta `Engine::GetInstance().textures->UnLoad(texture);` en CleanUp (o que Textures libere todas al final)."),
      orden("DrawTexture centrado en la posición del cuerpo físico.", [
        "int x, y;",
        "pbody->GetPosition(x, y);",
        "Engine::GetInstance().render->DrawTexture(texture, x - texW / 2, y - texH / 2, &currentFrame);"], "La física da el CENTRO; la textura se dibuja desde la esquina superior izquierda."),
      test("El sprite se ve borroso al escalar. ¿Qué cambias?", ["Más FPS", "SDL_SetTextureScaleMode(tex, SDL_SCALEMODE_NEAREST)", "La cámara", "El ángulo"], 1, ""),
      test("¿Qué hace `SDL_RenderRect` frente a `SDL_RenderFillRect`?", ["Lo mismo", "Solo el borde (ideal para dibujar colliders en debug)", "Rellena", "Dibuja texto"], 1, ""),
      escribe("Escribe un SDL_FRect llamado `r` en (10, 20) de 32×32.", [/^SDL_FRectr=\{10(\.0f?|f)?,20(\.0f?|f)?,32(\.0f?|f)?,32(\.0f?|f)?\}$/], "x, y, w, h.", { ph: "SDL_FRect r = { ... }" }),
      test("Dibujas 6.000 tiles por frame y va lento. ¿Primera optimización?", ["Bajar la resolución", "Dibujar solo los tiles dentro de la cámara (culling)", "Usar más texturas", "Quitar el VSYNC"], 1, "Calcula el rango de columnas y filas visibles con WorldToMap de las esquinas de la pantalla.")
    ]
  });
})();
