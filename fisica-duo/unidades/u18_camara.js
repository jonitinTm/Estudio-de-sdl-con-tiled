(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "camara", titulo: "Cámara y dibujado con Raylib", icono: "🎥",
    desc: "Camera2D: target, offset, zoom y rotación, seguir al coche suavemente, ratón en coordenadas del mundo, HUD, orden de dibujado y pantalla partida.",
    chuleta: [
      ["Camera2D", "```Camera2D cam = {};\ncam.offset = { SCREEN_W / 2.0f, SCREEN_H / 2.0f };  // dónde aparece el target en pantalla\ncam.target = car_pos;                              // punto del mundo que miras\ncam.zoom = 1.0f;\n\nBeginMode2D(cam);\n    DrawWorld();     // todo lo que se mueve con la cámara\nEndMode2D();\nDrawHUD();           // lo fijo en pantalla, fuera```"],
      ["Seguimiento suave", "```cam.target.x += (car.x - cam.target.x) * 5.0f * dt;\ncam.target.y += (car.y - cam.target.y) * 5.0f * dt;```"],
      ["Ratón", "`GetScreenToWorld2D(GetMousePosition(), cam)` → posición del ratón en el mundo (para el mouse joint)."]
    ],
    preguntas: [
      test("¿Qué significa `cam.offset`?", ["La posición del mundo que miras", "Dónde aparece el target en la pantalla (normalmente el centro)", "El zoom", "La rotación"], 1, "", { nuevo: true }),
      huecos("Cámara centrada en el coche.", String.raw`Camera2D cam = {};
cam.▢ = { SCREEN_W / 2.0f, SCREEN_H / 2.0f };
cam.▢ = { (float)x, (float)y };
cam.zoom = 1.0f;`, ["offset", "target", "rotation", "zoom"], ["offset", "target"], ""),
      orden("Orden de dibujado de un frame.", [
        "BeginDrawing();",
        "ClearBackground(BLACK);",
        "BeginMode2D(cam);",
        "DrawTrack(); DrawCars();",
        "EndMode2D();",
        "DrawHUD();",
        "EndDrawing();"], "El HUD fuera de Mode2D, así no se mueve con la cámara."),
      bug("El texto de las vueltas se va moviendo con la pista.", [
        "BeginMode2D(cam);",
        "DrawTrack();",
        "DrawText(TextFormat(\"Lap %d\", lap), 20, 20, 30, WHITE);",
        "EndMode2D();"], 2, "El HUD va después de EndMode2D."),
      test("Con la cámara, el mouse joint agarra en un sitio que no es donde clicas. ¿Por qué?", ["Box2D falla", "GetMousePosition da coordenadas de pantalla; hay que pasarlas al mundo", "Falta zoom", "Por el filtrado"], 1, ""),
      escribe("Escribe la posición del ratón en el mundo con la cámara `cam`.", ["GetScreenToWorld2D(GetMousePosition(), cam)"], "Y al revés: `GetWorldToScreen2D`.", { ph: "GetScreenToWorld2D(..." }),
      escribe("Escribe el seguimiento suave del eje x: `cam.target.x` se acerca a `car_x` con factor `5.0f * dt`.", [/^cam\.target\.x\+=\(car_x-cam\.target\.x\)\*5(\.0)?f\*dt$/, /^cam\.target\.x\+=\(car_x-cam\.target\.x\)\*\(5(\.0)?f\*dt\)$/, /^cam\.target\.x=cam\.target\.x\+\(car_x-cam\.target\.x\)\*5(\.0)?f\*dt$/], "Interpolación (lerp): recorres una fracción de la distancia cada frame.", { sol: "cam.target.x += (car_x - cam.target.x) * 5.0f * dt", ph: "cam.target.x += ..." }),
      test("¿Qué pasa si el factor del lerp es 1.0 (sin dt)?", ["Nada", "La cámara se pega al coche de golpe (sin suavizado)", "La cámara no se mueve", "Crash"], 1, ""),
      test("¿Qué hace `cam.zoom = 2.0f`?", ["Todo se ve a la mitad", "Todo se ve el doble de grande (ves menos mundo)", "Rota", "Nada"], 1, ""),
      huecos("Zoom según la velocidad: más rápido = más lejos.", String.raw`float target_zoom = 1.2f - fminf(speed / 30.0f, 0.4f);
cam.zoom ▢ (target_zoom - cam.zoom) * 2.0f * dt;`, ["+=", "=", "-=", "*="], ["+="], "También con lerp para que no dé tirones."),
      test("Quieres que la cámara gire con el coche (vista detrás del coche). ¿Qué tocas?", ["offset", "cam.rotation = -angle_del_coche_en_grados", "zoom", "target"], 1, "Negativo para compensar el giro del coche."),
      test("¿Qué es el parallax?", ["Un joint", "Fondos que se mueven más despacio que la cámara para dar profundidad", "Un tipo de sensor", "Una textura"], 1, "Dibuja el fondo con un target multiplicado por 0.5 (por ejemplo)."),
      test("Pantalla partida para 2 jugadores: ¿qué usas?", ["Dos ventanas", "Dos RenderTexture2D, cada una con su Camera2D, y las dibujas una al lado de la otra", "Un zoom negativo", "No se puede"], 1, "`BeginTextureMode(rt1); BeginMode2D(cam1); ... EndMode2D(); EndTextureMode();`"),
      bug("Las texturas de RenderTexture salen boca abajo.", [
        "Rectangle src = { 0, 0, (float)rt.texture.width, (float)rt.texture.height };",
        "DrawTextureRec(rt.texture, src, { 0, 0 }, WHITE);"], 0, "En OpenGL las RenderTexture están invertidas en Y: usa `-(float)rt.texture.height` en src."),
      test("¿En qué orden dibujas pista, marcas de derrape, coches y partículas de humo?", ["Coches, pista, humo, marcas", "Pista → marcas → coches → humo", "Humo → pista → coches", "Da igual"], 1, "Lo último que se dibuja queda encima."),
      test("Minimapa: ¿forma más sencilla?", ["Otra ventana", "Dibujar la pista y puntos de los coches a escala pequeña en una esquina, fuera de Mode2D", "Un sensor", "Zoom 0"], 1, "`DrawCircle(mx + x * 0.1f, my + y * 0.1f, 3, RED);`")
    ]
  });
})();
