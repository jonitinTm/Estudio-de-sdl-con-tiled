(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-bugs", titulo: "Caza de bugs del plataformas", icono: "🐞",
    desc: "Los errores reales que salen al programar el motor con SDL3, Tiled y Box2D 3.",
    chuleta: [
      ["Síntoma → causa", "Ventana negra → falta RenderPresent.\nNo cierra → no procesas SDL_EVENT_QUIT.\nSalta mil veces → KEY_REPEAT en vez de KEY_DOWN.\nVa rapidísimo → dt en ms con velocidades en px/s.\nMitad del mapa sin gráficos → solo lees un tileset.\nTiles equivocados → no restas firstgid.\nSprite desplazado → dibujas desde el centro.\nCámara al revés → signo de la cámara.\nTodo tiene 32 m → falta PIXEL_TO_METERS.\nFlota tras teletransporte → falta SetAwake.\nCrash al recoger → borras en OnCollision."]
    ],
    preguntas: [
      bug("Todo cae a cámara lenta y el jugador parece un edificio.", [
        "bd.position = { (float)x, (float)y };",
        "b2Polygon box = b2MakeBox(w * 0.5f, h * 0.5f);"], 0, "Faltan las conversiones a metros (PIXEL_TO_METERS) en posición y tamaño. Las dos líneas: la primera es la que falla primero."),
      bug("El sprite va siempre medio tile desplazado respecto al collider.", [
        "int x, y;",
        "pbody->GetPosition(x, y);",
        "render->DrawTexture(texture, x, y, &frame);"], 2, "GetPosition da el centro: resta la mitad del ancho y alto del frame."),
      bug("Al cargar el nivel 2 sigues chocando con paredes invisibles del nivel 1.", [
        "void Scene::LoadLevel2()",
        "{",
        "    map->Load(\"Assets/Maps/\", \"Level2.tmx\");",
        "}"], 2, "Antes de cargar hay que hacer map->CleanUp() (que borra tiles, tilesets y los colliders del mapa) y limpiar entidades del nivel."),
      bug("El juego va más lento cuanto más tiempo lo juegas.", [
        "void Player::Update(float dt)",
        "{",
        "    SDL_Texture* t = Engine::GetInstance().textures->Load(\"Assets/player.png\");",
        "    Engine::GetInstance().render->DrawTexture(t, x, y);",
        "}"], 2, "Cargas la textura cada frame (y nunca la liberas). Cárgala una vez en Start."),
      bug("La animación va el doble de rápida en un monitor de 120 Hz.", [
        "void Animation::Update()",
        "{",
        "    current++;",
        "    if (current >= frames.size()) current = 0;",
        "}"], 2, "Avanza un frame por frame del juego. Usa un temporizador con dt y la duración de cada frame."),
      bug("El jugador no puede volver a saltar tras el primer salto.", [
        "if (GetKey(SDL_SCANCODE_SPACE) == KEY_DOWN && !isJumping) { Jump(); isJumping = true; }",
        "// OnCollision:",
        "case ColliderType::ITEM: coins++; break;"], 2, "Falta `case ColliderType::PLATFORM: isJumping = false; break;` en OnCollision."),
      bug("Crash al cerrar el juego.", [
        "bool Physics::CleanUp() { b2DestroyWorld(world); return true; }",
        "bool Player::CleanUp() { physics->DeletePhysBody(pbody); return true; }"], 1, "Si Physics hace CleanUp antes (orden inverso mal pensado), el Player intenta borrar un cuerpo de un mundo ya destruido. Comprueba `b2Body_IsValid` o borra las entidades antes que el mundo."),
      bug("El mapa sale completamente negro pero no hay errores.", [
        "pugi::xml_parse_result result = mapFile.load_file((path + name).c_str());",
        "if (result == NULL) LOG(\"Could not load map\");",
        "for (pugi::xml_node ts = mapFile.child(\"map\").child(\"tilesets\"); ts; ts = ts.next_sibling(\"tileset\"))"], 2, "El nodo se llama \"tileset\" (singular). child(\"tilesets\") devuelve vacío y el bucle no entra."),
      bug("El enemigo atraviesa el suelo cuando lo teletransportas al spawn.", [
        "position = spawn;",
        "// el cuerpo físico sigue donde estaba"], 0, "Hay que mover el cuerpo: b2Body_SetTransform + SetLinearVelocity a 0 + SetAwake. La posición del sprite se lee del cuerpo cada frame."),
      bug("Guardas partida y al cargar el jugador aparece en (0, 0).", [
        "player.append_attribute(\"x\") = position.getX();",
        "player.append_attribute(\"y\") = position.getY();",
        "// (no se llama a doc.save_file)"], 2, "Sin `doc.save_file(\"savegame.xml\")` los cambios solo están en memoria."),
      bug("El salto es más alto a 30 fps que a 144 fps.", [
        "if (jumping) b2Body_ApplyForceToCenter(pbody->body, { 0, -jumpForce }, true);"], 0, "Una fuerza aplicada cada frame depende de cuántos frames hay. El salto se hace con UN impulso al pulsar (KEY_DOWN)."),
      bug("El HUD se mueve con el mapa.", [
        "render->DrawTexture(hudBar, 10, 10, nullptr, 0.0f);",
        "render->DrawTexture(coinIcon, 0, 0);"], 1, "DrawTexture aplica la cámara: usa speed = 0 para el HUD (`DrawTexture(coinIcon, 0, 0, nullptr, 0.0f)`)."),
      test("¿Qué herramienta te ahorra más tiempo cuando la física hace cosas raras?", ["Reinstalar Box2D", "El modo debug (F9) que dibuja todos los colliders encima del juego", "Bajar los fps", "Comentar código al azar"], 1, ""),
      test("Un crash ocurre solo en Release. ¿Sospechoso típico?", ["El compilador", "Una variable sin inicializar (en Debug suele valer un patrón, en Release basura)", "SDL", "La textura"], 1, "Inicializa siempre: `bool isJumping = false;`."),
      test("LOG imprime \"Map Level1.tmx: 100x22 tiles, 2 tilesets, 3 layers\", pero no se ve nada. ¿Primer sospechoso?", ["pugixml", "Las capas tienen Draw=false o no se lee la propiedad / la textura del tileset no cargó (ruta)", "Box2D", "El audio"], 1, "")
    ]
  });
})();
