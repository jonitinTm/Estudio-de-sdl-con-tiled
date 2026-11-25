(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-animcam", titulo: "Animaciones y cámara", icono: "🎞",
    desc: "Frames, duración por frame, loop y ping-pong, AnimationSet con nombres, cambiar de animación según el estado, cámara que sigue al jugador y límites del mapa.",
    chuleta: [
      ["Animation::Update", "```void Animation::Update(float dtMs)\n{\n    timer += dtMs;\n    while (timer >= frameDurationMs) {\n        timer -= frameDurationMs;\n        current++;\n        if (current >= (int)frames.size())\n            current = loop ? 0 : (int)frames.size() - 1;\n    }\n}```"],
      ["Cámara (negativa)", "```int target = (int)player->position.getX() - screenW / 2;   // borde izquierdo deseado (mundo)\ntarget = std::max(0, std::min(target, mapW - screenW));       // no salir del mapa\nrender->camera.x = -target;```"]
    ],
    preguntas: [
      test("Animación de 6 frames a 100 ms por frame. ¿Cuánto dura un ciclo?", ["100 ms", "600 ms", "60 ms", "6 s"], 1, "", { nuevo: true }),
      huecos("Avanza el frame con el tiempo.", String.raw`timer += dtMs;
while (timer ▢ frameDurationMs)
{
    timer ▢ frameDurationMs;
    current++;
}`, [">=", "-=", "=", "+=", "<"], [">=", "-="], "Restar (no poner a 0) conserva el tiempo sobrante: la animación no se retrasa."),
      test("¿Por qué `while` y no `if`?", ["Es igual", "Si un frame del juego dura más que dos frames de la animación, hay que avanzar varios", "Por estilo", "Para el loop"], 1, ""),
      escribe("Escribe la línea que, al pasarse del último frame, vuelve al 0 si `loop` o se queda en el último si no.", [/^current=loop\?0:\(int\)frames\.size\(\)-1$/, /^current=loop\?0:frames\.size\(\)-1$/, /^current=\(loop\)\?0:\(int\)frames\.size\(\)-1$/], "", { sol: "current = loop ? 0 : (int)frames.size() - 1;", ph: "current = loop ? ..." }),
      test("¿Qué es una animación ping-pong?", ["Muy rápida", "Va 0→N y luego N→0 en vez de saltar al principio", "Aleatoria", "Que no se repite"], 1, ""),
      test("¿Cuándo usas `HasFinished()`?", ["Siempre", "Para animaciones sin loop (muerte, ataque): cambias de estado cuando acaba", "Para el idle", "Nunca"], 1, ""),
      bug("La animación de correr se queda congelada en el primer frame mientras corres.", [
        "if (vx != 0) anims.SetCurrent(\"run\");",
        "else anims.SetCurrent(\"idle\");",
        "anims.Update(dt);"], 0, "Si SetCurrent reinicia la animación cada vez que se llama (aunque ya sea la actual), nunca avanza. SetCurrent debe no hacer nada si el nombre es el mismo."),
      huecos("SetCurrent sin reiniciar si ya está puesta.", String.raw`void AnimationSet::SetCurrent(const std::string& name)
{
    if (currentName ▢ name) return;
    currentName = name;
    animations[name].▢();
}`, ["==", "Reset", "!=", "Update", "Play"], ["==", "Reset"], ""),
      test("¿De dónde sale cada animación en el handout?", ["Del código", "De un .tsx de Tiled con <animation><frame tileid duration/>…</animation>, leído con pugixml", "De un GIF", "De SDL"], 1, "Así ajustas la velocidad de cada frame sin recompilar."),
      test("Del tileid de un frame al rectángulo: ¿qué fórmula?", ["Otra distinta", "La misma que GetRect del mapa (columna = id % columns, fila = id / columns), sin firstgid porque en el .tsx los ids son locales", "id * 32", "No hay fórmula"], 1, ""),
      orden("Cámara que sigue al jugador sin salir del mapa.", [
        "int target = (int)player->position.getX() - screenW / 2;",
        "if (target < 0) target = 0;",
        "if (target > mapW - screenW) target = mapW - screenW;",
        "render->camera.x = -target;"], "La cámara del motor es negativa."),
      test("La cámara va al revés: el jugador va a la derecha y el mundo también. ¿Causa?", ["Box2D", "Has olvidado el signo negativo de la cámara", "La animación", "El dt"], 1, ""),
      escribe("Escribe la cámara suavizada en x: `camera.x` se acerca a `-target` con el factor `0.1f`.", [/^camera\.x\+=\(-target-camera\.x\)\*0\.1f$/, /^camera\.x=camera\.x\+\(-target-camera\.x\)\*0\.1f$/, /^render->camera\.x\+=\(-target-render->camera\.x\)\*0\.1f$/], "Lerp. (Recuerda que camera.x debería ser float para movimientos pequeños).", { sol: "camera.x += (-target - camera.x) * 0.1f;", ph: "camera.x += ..." }),
      test("¿Qué es una deadzone de cámara?", ["Un sitio donde mueres", "Un rectángulo central donde el jugador se mueve sin que la cámara se mueva", "El borde del mapa", "El HUD"], 1, ""),
      test("¿Dónde guardas el sentido (izquierda/derecha) para el flip del sprite?", ["En la animación", "En el jugador: se actualiza solo cuando hay input horizontal (si no, conserva el último)", "En la cámara", "En Box2D"], 1, "")
    ]
  });
})();
