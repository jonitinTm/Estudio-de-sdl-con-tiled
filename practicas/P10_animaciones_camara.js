Curso.practica({
  leccion: "l10",
  titulo: "Programa las animaciones y la cámara",
  intro: "Escribirás el corazón de la clase Animation (avanzar frames con el tiempo), el cálculo del rectángulo de cada frame, el cambio de animación según el estado y una cámara que sigue al jugador sin salirse del mapa.",
  pasos: [
    {
      t: "Avanzar frames con el tiempo",
      exp: `<p>Cada frame de la animación dura <code>durationMs</code>. Vamos acumulando dt en <code>timer</code>; mientras el tiempo acumulado supere la duración del frame actual, restamos esa duración y pasamos al siguiente. Se usa <code>while</code> (no if) porque con un dt grande puede que haya que saltar varios frames.</p>`,
      code: String.raw`void Animation::Update(float dtMs)
{
    if (frames.empty() || finished) return;
    timer += dtMs;
    while (timer §s1§ frames[currentFrame].durationMs) {
        timer §s2§ frames[currentFrame].durationMs;
        currentFrame++;`,
      slots: {
        s1: { ok: [">=", ">"], err: [[/^<=?$/, "Al revés: avanzamos cuando el tiempo acumulado ALCANZA la duración."]], w: 3, sol: ">=" },
        s2: { ok: ["-="], err: [[/^=0$|^=$/, "Si pones timer = 0 pierdes el tiempo sobrante y la animación se retrasa poco a poco. Resta la duración: <code>-=</code>."], [/^\+=$/, "Hay que QUITAR el tiempo ya consumido."]], w: 3 }
      },
      pistas: ["“Mientras el tiempo acumulado sea mayor o igual que la duración…”", "…“le restamos la duración”."],
      bien: "<p>Restar (en vez de poner a 0) conserva el sobrante: si un frame dura 100 ms y llevas 130, el siguiente ya empieza con 30 ms. Así la animación no se desincroniza.</p>"
    },
    {
      t: "Llegar al final: bucle o parar",
      exp: `<p>Si nos pasamos del último frame: si la animación hace bucle, volvemos al primero; si no, nos quedamos en el último y la marcamos como terminada.</p>`,
      code: String.raw`        if (currentFrame >= (int)frames.size()) {
            if (loop) currentFrame = §s1§;
            else {
                currentFrame = §s2§;
                finished = true;
                break;
            }
        }
    }
}`,
      slots: {
        s1: { ok: ["0"], err: [[/^1$/, "Los índices empiezan en 0."]], w: 4 },
        s2: { ok: ["(int)frames.size()-1", "frames.size()-1"], err: [[/^\(?int\)?frames\.size\(\)$|^frames\.size\(\)$/, "frames.size() está fuera del vector (los índices van de 0 a size−1)."]], w: 22, sol: "(int)frames.size() - 1" }
      },
      pistas: ["Primer frame = índice 0.", "Último frame = tamaño − 1."],
      bien: "<p><code>HasFinished()</code> te servirá para animaciones de una sola vez (morir, voltereta): cuando termine, vuelves a idle.</p>"
    },
    {
      t: "De tileid a rectángulo",
      exp: `<p>En el .tsx cada frame es un <code>tileid</code> (empieza en 0, sin firstgid ni margin). Calcula su rectángulo en el spritesheet: es la misma idea que GetRect de la L07.</p>`,
      code: String.raw`int tileId = f.attribute("tileid").as_int();
SDL_Rect r = { (tileId §s1§ columns) * tw, (tileId §s2§ columns) * th, tw, th };
anim.AddFrame(r, f.attribute(§s3§).as_int());`,
      slots: {
        s1: { ok: ["%"], err: [[/^\/$/, "Para la X (columna) se usa el resto."]], w: 3 },
        s2: { ok: ["/"], err: [[/^%$/, "Para la Y (fila) se usa la división entera."]], w: 3 },
        s3: { ok: ['"duration"'], w: 11 }
      },
      pistas: ["x: resto; y: división.", "Mira el TSX: <code>&lt;frame tileid=\"11\" duration=\"90\"/&gt;</code>"],
      bien: "<p>Con 11 columnas y 32 px: tileid 13 → x = (13 % 11)·32 = 64, y = (13 / 11)·32 = 32.</p>"
    },
    {
      t: "SetCurrent sin congelar la animación",
      exp: `<p>Escribe <code>SetCurrent</code>: si ya es la animación actual, no hagas nada; si no, cámbiala y reinicia la nueva con <code>Reset()</code>. El nombre actual se guarda en <code>current</code> y las animaciones en el map <code>animations</code>.</p>`,
      escribe: {
        antes: "void AnimationSet::SetCurrent(const std::string& name)\n{",
        despues: "}",
        filas: 5,
        checks: [
          [/if\(current==name\)return;|if\(name==current\)return;/, "Primero: <code>if (current == name) return;</code> (si no, se reinicia cada frame y se queda congelada)."],
          [/current=name;/, "Cambia la actual: <code>current = name;</code>"],
          [/animations\[name\]\.Reset\(\);|animations\.at\(name\)\.Reset\(\);|animations\[current\]\.Reset\(\);/, "Reinicia la nueva: <code>animations[name].Reset();</code>"]
        ],
        sol: String.raw`    if (current == name) return;
    current = name;
    animations[name].Reset();`
      },
      pistas: ["Tres líneas: comprobar, asignar, reiniciar.", "<code>return;</code> sale de una función void."],
      bien: "<p>Sin la primera línea, llamar a <code>SetCurrent(\"move\")</code> en cada Update pondría la animación siempre en el frame 0. Es el bug más típico de esta lección.</p>"
    },
    {
      t: "Elegir la animación según el estado",
      exp: `<p>Al final de <code>Player::Update</code>: si está saltando → <code>"jump"</code>; si se mueve en horizontal (<code>velocity.x != 0</code>) → <code>"move"</code>; si no → <code>"idle"</code>. Escribe el if / else if / else.</p>`,
      escribe: {
        filas: 4,
        checks: [
          [/if\(isJumping\)anims\.SetCurrent\("jump"\);/, "Primero el salto: <code>if (isJumping) anims.SetCurrent(\"jump\");</code>"],
          [/elseif\(velocity\.x!=0(\.0*f?)?\)anims\.SetCurrent\("move"\);/, "Luego: <code>else if (velocity.x != 0) anims.SetCurrent(\"move\");</code>"],
          [/elseanims\.SetCurrent\("idle"\);/, "Por último: <code>else anims.SetCurrent(\"idle\");</code>"]
        ],
        sol: String.raw`    if (isJumping)               anims.SetCurrent("jump");
    else if (velocity.x != 0.0f) anims.SetCurrent("move");
    else                         anims.SetCurrent("idle");`
      },
      pistas: ["El orden importa: si saltas mientras te mueves, debe verse el salto.", "<code>if (…) … else if (…) … else …</code>"],
      bien: "<p>Esto es una mini máquina de estados. En SandKnight añadirías la voltereta, el daño y la muerte, con prioridad sobre las demás.</p>"
    },
    {
      t: "Cámara con límites",
      exp: `<p>Escribe el cálculo: <code>camX</code> = posición del jugador menos media pantalla; luego límitalo a <code>[0, mapW − screenW]</code>; y asígnalo a <code>render-&gt;camera.x</code> en negativo.</p>`,
      escribe: {
        antes: String.raw`void Player::UpdateCamera()
{
    auto& render = Engine::GetInstance().render;
    int screenW = render->camera.w;
    float mapW = Engine::GetInstance().map->GetMapSizeInPixels().getX();`,
        despues: "}",
        filas: 6,
        checks: [
          [/floatcamX=position\.getX\(\)-screenW\/2(\.0*f?)?;/, "Centra al jugador: <code>float camX = position.getX() - screenW / 2.0f;</code>"],
          [/if\(camX<0\)camX=0(\.0*f?)?;/, "Límite izquierdo: <code>if (camX &lt; 0) camX = 0;</code>"],
          [/if\(camX>mapW-screenW\)camX=mapW-screenW;/, "Límite derecho: <code>if (camX &gt; mapW - screenW) camX = mapW - screenW;</code>"],
          [/render->camera\.x=-\(int\)camX;|render->camera\.x=-camX;|render->camera\.x=\(int\)-camX;/, "Asigna en negativo: <code>render-&gt;camera.x = -(int)camX;</code>"]
        ],
        sol: String.raw`    float camX = position.getX() - screenW / 2.0f;
    if (camX < 0) camX = 0;
    if (camX > mapW - screenW) camX = mapW - screenW;
    render->camera.x = -(int)camX;`
      },
      pistas: ["Media pantalla = <code>screenW / 2.0f</code>.", "El máximo es donde el borde derecho de la pantalla coincide con el final del mapa: <code>mapW - screenW</code>."],
      bien: "<p>Prueba en la demo de arriba con “Limitar al mapa” activado y desactivado para ver la diferencia. Haz lo mismo con Y para mapas altos como el tuyo (59 tiles de alto).</p>"
    }
  ]
});
