(function () {
  const { code } = Curso;
  const T = (tema, p, o, c, e) => ({ tipo: "test", tema, p, o, c, e });
  const N = (tema, p, r, tol, unidad, e) => ({ tipo: "num", tema, p, r, tol, unidad, e });
  const K = (tema, p, src, slots, e) => ({ tipo: "codigo", tema, p, code: src, slots, e });

  const banco = [
    // ---------------- Motor ----------------
    T("Motor y SDL3", "¿Por qué el módulo render va el último en la lista del Engine?", ["Es el más lento", "Presenta el frame en PostUpdate: todos deben haber dibujado antes", "Por orden alfabético", "Porque crea la ventana"], 1, "Borra en PreUpdate y presenta en PostUpdate."),
    T("Motor y SDL3", "Un módulo devuelve false en su Update. ¿Qué pasa?", ["Se salta ese módulo", "El juego se cierra limpiamente (se llama a CleanUp)", "Se reinicia el nivel", "Nada"], 1, "Así cierra Esc el juego."),
    T("Motor y SDL3", "¿En qué método se carga una textura de una entidad?", ["Constructor", "Awake", "Start", "CleanUp"], 2, "En Awake el módulo de texturas aún no está listo."),
    T("Motor y SDL3", "Quieres que el jugador salte una vez por pulsación. ¿Qué estado de tecla compruebas?", ["KEY_REPEAT", "KEY_DOWN", "KEY_IDLE", "KEY_UP"], 1, "DOWN solo dura el frame en que pulsas."),
    T("Motor y SDL3", "¿Qué tiene mal esta línea?" + code(String.raw`SDL_FRect r = { 100, 200, 64, 64 };
SDL_RenderFillRect(renderer, r);`), ["Nada", "SDL_RenderFillRect espera un puntero: &r", "Faltan decimales", "La Y está invertida"], 1, "Las funciones de SDL reciben la dirección del rectángulo."),
    K("Motor y SDL3", "El estado de una tecla en Input::PreUpdate.", String.raw`if (pressed)
    keyboard[i] = (keyboard[i] == KEY_IDLE || keyboard[i] == KEY_UP) ? §s1§ : KEY_REPEAT;
else
    keyboard[i] = (keyboard[i] == KEY_REPEAT || keyboard[i] == KEY_DOWN) ? §s2§ : KEY_IDLE;`, { s1: { ok: ["KEY_DOWN"], w: 10 }, s2: { ok: ["KEY_UP"], w: 8 } }, "IDLE → DOWN → REPEAT → UP → IDLE."),

    // ---------------- Tiempo ----------------
    N("Framerate y dt", "A 50 fps, ¿cuántos milisegundos dura cada frame?", 20, 0.01, "ms", "1000 / 50."),
    N("Framerate y dt", "Un enemigo se mueve a 120 px/s. Si el frame duró 25 ms, ¿cuántos píxeles avanza?", 3, 0.01, "px", "120 · 0,025 = 3."),
    T("Framerate y dt", "¿Dónde se calcula dt en FinishUpdate?", ["Antes del delay", "Después del delay, para incluir la espera", "En Awake", "Da igual"], 1, "Si no, todo iría más lento de lo debido."),
    T("Framerate y dt", "¿Qué evita el VSYNC que no evita el frame cap?", ["El consumo de CPU", "El tearing", "El input lag", "Los saltos de dt"], 1, "VSYNC sincroniza con el refresco del monitor."),
    T("Framerate y dt", "¿Por qué Physics acumula el tiempo y da pasos fijos de 1/60 s?", ["Para ahorrar memoria", "Para que la física dé el mismo resultado a 30, 60 o 144 fps", "Porque Box2D no acepta otros valores", "Para el sonido"], 1, "Paso fijo con acumulador."),
    T("Framerate y dt", "¿Qué falla aquí?" + code(String.raw`double ms = 1000 * (SDL_GetPerformanceCounter() - start) / frequency;   // todos Uint64`), ["Nada", "División entera: se pierden los decimales", "Falta multiplicar por dt", "frequency es 0"], 1, "Convierte a double antes de dividir."),

    // ---------------- Entidades ----------------
    T("Entidades y C++", "¿Qué patrón usa EntityManager::CreateEntity?", ["Singleton", "Factory", "Observer", "State"], 1, "Crea la clase concreta según el tipo."),
    T("Entidades y C++", "¿Por qué el EntityManager recorre una COPIA de la lista en Update?", ["Por velocidad", "Para que una entidad pueda crear otras sin romper el bucle", "Por estilo", "Porque shared_ptr lo exige"], 1, "Modificar una lista mientras se recorre la invalida."),
    T("Entidades y C++", "Una moneda se toca y hay que quitarla. ¿Qué hace su OnCollision?", ["delete this", "Marca pendingToDelete; el EntityManager la borra al final del frame", "Llama a b2DestroyBody", "Nada"], 1, "Nunca se borra en mitad del recorrido."),
    K("Entidades y C++", "Obtén el Player a partir de la Entity que devuelve la fábrica.", String.raw`player = std::§s1§<Player>(
    Engine::GetInstance().entityManager->CreateEntity(EntityType::§s2§));`, { s1: { ok: ["dynamic_pointer_cast"], w: 22 }, s2: { ok: ["PLAYER"], w: 8 } }, "Cast seguro de shared_ptr."),

    // ---------------- XML ----------------
    T("XML y config", "¿Qué devuelve attribute(\"widht\").as_int() si el nombre está mal escrito?", ["Un error", "0 (o el valor por defecto que pases)", "-1", "Crashea"], 1, "pugixml no avisa: por eso LOG y valores por defecto."),
    K("XML y config", "Lee el ancho de la ventana con valor por defecto.", String.raw`width = configParameters.§s1§("resolution").§s2§("width").as_int(1280);`, { s1: { ok: ["child"], w: 7 }, s2: { ok: ["attribute"], w: 10 } }, "child baja de nodo; attribute lee un atributo."),
    T("XML y config", "Para GUARDAR una partida en XML con pugixml usas…", ["load_file y child", "append_child, append_attribute y save_file", "parse", "SDL_SaveBMP"], 1, "Serializar al revés."),

    // ---------------- Tiled ----------------
    N("Tiled y mapas", "Mapa de 100 × 22 tiles de 32 px. ¿Cuántos píxeles mide de ancho?", 3200, 0, "px", "100 · 32."),
    N("Tiled y mapas", "Tileset de 16 columnas, firstgid 1, sin margin. ¿Cuál es rect.x del gid 35?", 64, 0, "px", "local = 34 → columna 34 % 16 = 2 → 2 · 32 = 64."),
    N("Tiled y mapas", "Capa de 100 de ancho. ¿Índice del vector para la casilla (i = 7, j = 3)?", 307, 0, "", "3 · 100 + 7."),
    T("Tiled y mapas", "Tu capa carga 0 tiles. ¿Causa más probable?", ["El tileset no está incrustado", "El formato de capa es CSV o Base64, no XML", "Falta la propiedad Draw", "La capa está oculta"], 1, "Map → Propiedades del mapa → Tile Layer Format → XML."),
    T("Tiled y mapas", "Un objeto de Tiled tiene x = 100, y = 200, width = 32, height = 64. ¿Cuál es su centro?", ["(100, 200)", "(116, 232)", "(132, 264)", "(116, 200)"], 1, "x + w/2, y + h/2: Tiled guarda la esquina superior izquierda."),
    K("Tiled y mapas", "El rectángulo de un gid en el tileset.", String.raw`int relativeIndex = gid - firstGid;
rect.x = margin + (tileWidth + spacing) * (relativeIndex §s1§ columns);
rect.y = margin + (tileHeight + spacing) * (relativeIndex §s2§ columns);`, { s1: { ok: ["%"], w: 3 }, s2: { ok: ["/"], w: 3 } }, "Columna = resto; fila = división."),
    T("Tiled y mapas", "¿Por qué Map::Update solo dibuja las casillas dentro de la cámara?", ["Para que no se vea el borde", "Culling: dibujar lo que no se ve es trabajo desperdiciado", "Porque SDL no lo permite", "Para el sonido"], 1, "Unas 950 casillas visibles de 2200 por capa."),

    // ---------------- Física ----------------
    T("Física Box2D 3", "En Box2D 3, ¿cómo te enteras de que dos cuerpos se han tocado?", ["Box2D llama a OnCollision durante el Step", "Después del Step pides la lista con b2World_GetContactEvents / GetSensorEvents", "Comparando posiciones", "Con un raycast"], 1, "Box2D 3 no usa callbacks durante el paso."),
    T("Física Box2D 3", "Las monedas (sensores) no detectan al jugador en Box2D 3.1. ¿Qué falta?", ["isSensor en el jugador", "enableSensorEvents = true en la forma del jugador", "Más masa", "fixedRotation"], 1, "En 3.1 un sensor solo detecta formas con enableSensorEvents."),
    N("Física Box2D 3", "Con PIXELS_PER_METER = 32, ¿cuántos metros son 80 píxeles?", 2.5, 0.01, "m", "80 / 32."),
    T("Física Box2D 3", "El jugador se queda pegado a las paredes cuando salta contra ellas. ¿Solución?", ["Más gravedad", "friction = 0 en su forma", "fixedRotation = false", "Más masa"], 1, "La fricción contra la pared le frena la caída."),
    T("Física Box2D 3", "Teletransportas al jugador con b2Body_SetTransform y se queda flotando. ¿Por qué?", ["La gravedad es 0", "El cuerpo estaba dormido: hay que despertarlo con b2Body_SetAwake", "Falta el Step", "Es estático"], 1, "Bug real del proyecto, lo encontró la prueba automática."),
    K("Física Box2D 3", "Moverse conservando la gravedad.", String.raw`b2Vec2 velocity = b2Body_§s1§(pbody->body);
velocity.x = speed;
b2Body_SetLinearVelocity(pbody->body, §s2§);`, { s1: { ok: ["GetLinearVelocity"], w: 18 }, s2: { ok: ["velocity"], w: 10 } }, "Se lee la velocidad, se cambia solo la X y se aplica."),
    T("Física Box2D 3", "¿Por qué los colliders del suelo se crean por tramos horizontales?", ["Por estética", "Menos cuerpos y el jugador no se engancha en las uniones", "Box2D no admite cajas de 32 px", "Para el culling"], 1, "Una caja por tramo de tiles sólidos seguidos."),

    // ---------------- Plataformas ----------------
    T("Juego de plataformas", "¿Qué es el tiempo de coyote?", ["Un retardo del sonido", "Poder saltar unos instantes después de dejar una plataforma", "La invulnerabilidad", "Un tipo de cámara"], 1, "0,1 s en el juego de la guía."),
    T("Juego de plataformas", "¿Cómo se hace el salto variable?", ["Con más gravedad", "Si sueltas el botón mientras subes, se reduce la velocidad vertical", "Con dos impulsos", "Con un joint"], 1, "KEY_UP + velocity.y *= 0.5."),
    T("Juego de plataformas", "¿Por qué el pisotón se decide por la posición de los pies y no por la velocidad vertical?", ["Es más rápido", "Al llegar el evento, Box2D ya resolvió el choque y la velocidad vale ~0", "La velocidad es siempre negativa", "Por estilo"], 1, "Bug real encontrado por la prueba automática."),
    T("Juego de plataformas", "El caballero cae al agua. ¿Por qué no se le teletransporta dentro de OnCollision?", ["No se puede", "Por la regla: en los callbacks se anota (pendingRespawn) y se actúa en Update", "Para que se vea la caída", "Porque el agua es estática"], 1, "Anotar en el callback, actuar en el Update."),
    N("Juego de plataformas", "Pantalla de 1280 px, mapa de 3200 px, jugador en x = 3000. Con límites, ¿cuánto vale camX (positivo)?", 1920, 0, "px", "3000 − 640 = 2360 > 3200 − 1280 = 1920 → 1920."),
    T("Juego de plataformas", "¿Qué casillas son nodos del BFS de los slimes?", ["Todas", "Las vacías con suelo debajo (IsWalkable)", "Las de la capa Map", "Las del agua"], 1, "El slime no salta: solo recorre su plataforma."),
    K("Juego de plataformas", "Reconstruir el camino con las miguitas.", String.raw`for (int index = goalIndex; ; index = §s1§[index])
{
    path.push_back(Vector2D((float)(index % width), (float)(index §s2§ width)));
    if (breadcrumbs[index] == index) break;
}`, { s1: { ok: ["breadcrumbs"], w: 12 }, s2: { ok: ["/"], w: 3 } }, "Se sigue de miguita en miguita hasta el inicio (que apunta a sí mismo)."),
    T("Juego de plataformas", "¿Por qué el HUD se dibuja sin cámara (useCamera = false)?", ["Es más rápido", "Para que quede fijo en la pantalla aunque la cámara se mueva", "Para que no se vea", "Por el culling"], 1, "Coordenadas de pantalla, no de mundo."),

    // ---------------- Animaciones y pathfinding ----------------
    N("Animaciones y pathfinding", "Spritesheet de 8 columnas y frames de 40 × 44. ¿Cuál es rect.y del tileid 20?", 88, 0, "px", "20 / 8 = 2 → 2 · 44 = 88."),
    T("Animaciones y pathfinding", "La animación se queda congelada en el primer frame. ¿Por qué?", ["Duraciones a 0", "SetCurrent la reinicia cada frame: debe ignorar la llamada si ya es la actual", "Falta loop", "La textura es nearest"], 1, "if (name == current) return;"),
    T("Animaciones y pathfinding", "¿Qué estructura de datos convierte la búsqueda en BFS?", ["Pila", "Cola (FIFO)", "Cola de prioridad", "Mapa"], 1, "Con prioridad sería Dijkstra."),
    T("Animaciones y pathfinding", "En Dijkstra, ¿puede un nodo visitado volver a la frontera?", ["Nunca", "Sí, si se encuentra un camino más barato hasta él", "Solo el destino", "Solo el inicio"], 1, "newCost < costSoFar.")
  ];

  window.__banco = banco;   // para las pruebas automáticas
  Curso.examen({
    id: "examen", num: "EX", grupo: "Evaluación", corto: "Examen final",
    titulo: "Examen final: SDL3, Tiled, Box2D y el plataformas",
    resumen: "Preguntas al azar de teoría, cálculo, código y “encuentra el bug”, con nota y corrección explicada.",
    intro: "Comprueba si dominas todo el temario y el juego que has construido: motor, tiempo, entidades, XML, mapas de Tiled, física, animaciones, pathfinding y plataformas. Sin pistas: como un examen de verdad.",
    banco
  });
})();
