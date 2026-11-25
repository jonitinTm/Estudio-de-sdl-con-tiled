(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-colmapa", titulo: "Colisiones desde el mapa", icono: "▧",
    desc: "Capa de colisiones con propiedad Collision, un cuerpo estático por tile u objeto, ColliderType (plataforma, pinchos, muerte, meta), OnCollision y god mode.",
    chuleta: [
      ["Desde la capa de tiles", "```if (layer->properties.GetProperty(\"Collision\") && layer->properties.GetProperty(\"Collision\")->value)\n    for (int j = 0; j < mapData.height; j++)\n        for (int i = 0; i < mapData.width; i++) {\n            int gid = layer->Get(i, j);\n            if (gid == 0) continue;\n            Vector2D pos = MapToWorld(i, j);\n            PhysBody* c = physics->CreateRectangle(pos.getX() + tw / 2, pos.getY() + th / 2, tw, th, STATIC);\n            c->ctype = (gid == spikesGid) ? ColliderType::SPIKES : ColliderType::PLATFORM;\n            colliders.push_back(c);\n        }```"],
      ["OnCollision del jugador", "```void Player::OnCollision(PhysBody* a, PhysBody* b)\n{\n    switch (b->ctype) {\n    case ColliderType::PLATFORM: isJumping = false; break;\n    case ColliderType::ITEM:     coins++; audio->PlayFx(coinFx); ((Item*)b->listener)->pendingToDelete = true; break;\n    case ColliderType::SPIKES:   if (!invulnerable) Hurt(); break;\n    case ColliderType::DEATH:    Die(); break;\n    default: break;\n    }\n}```"]
    ],
    preguntas: [
      test("¿Por qué una capa de colisiones separada en vez de usar la capa visual?", ["Es obligatorio", "Puedes decorar con libertad y marcar solo lo sólido; además puede no dibujarse (Draw = false)", "Ocupa menos", "Es más rápido de dibujar"], 1, "", { nuevo: true }),
      huecos("Centro del collider de la casilla (i, j).", String.raw`Vector2D pos = MapToWorld(i, j);
PhysBody* c = physics->CreateRectangle(pos.getX() + tw ▢ 2, pos.getY() + th / 2, tw, th, ▢);`, ["/", "STATIC", "*", "DYNAMIC", "KINEMATIC"], ["/", "STATIC"], "MapToWorld da la esquina; Box2D quiere el centro."),
      test("Un nivel de 100 × 22 con un cuerpo por tile sólido crea miles de cuerpos. ¿Mejora típica?", ["Ninguna", "Unir tiles contiguos de una fila en un único rectángulo (o dibujar las colisiones como objetos en Tiled)", "Hacerlos dinámicos", "Quitar la física"], 1, ""),
      test("¿Para qué sirve `ctype` en PhysBody?", ["Para el color", "Para saber QUÉ has tocado en OnCollision (plataforma, item, pinchos…)", "Para la masa", "Para el filtrado"], 1, ""),
      orden("El switch de OnCollision del jugador.", [
        "switch (physB->ctype)",
        "{",
        "case ColliderType::PLATFORM: isJumping = false; break;",
        "case ColliderType::ITEM: coins++; break;",
        "case ColliderType::DEATH: Die(); break;",
        "default: break;",
        "}"], ""),
      test("¿Cómo distingues pinchos de plataformas si los dos están en la capa de colisiones?", ["No se puede", "Por el gid del tileset de metadatos (cada tipo un tile distinto) o con capas/propiedades separadas", "Por el color", "Por la posición"], 1, ""),
      test("Un foso de muerte instantánea es mejor como…", ["Plataforma", "Sensor de tipo DEATH: no frena, solo avisa", "Cuerpo dinámico", "Item"], 1, ""),
      bug("Al tocar pinchos pierdes todas las vidas de golpe.", [
        "case ColliderType::SPIKES:",
        "    lives--;",
        "    break;"], 1, "Mientras sigas tocándolos pueden llegar más contactos, y el siguiente salto vuelve a tocarlos. Añade invulnerabilidad: `if (!invulnerable) { lives--; invulnerable = true; invTimer.Start(); }` y quítala tras 0,5–1 s."),
      escribe("Escribe la condición para quitar la invulnerabilidad tras 1 segundo (`invTimer.ReadSec()`).", [/^if\(invulnerable&&invTimer\.ReadSec\(\)>=?1(\.0f?|f)?\)(invulnerable=false)?$/, /^if\(invTimer\.ReadSec\(\)>=?1(\.0f?|f)?\)(invulnerable=false)?$/], "", { sol: "if (invulnerable && invTimer.ReadSec() >= 1.0f) invulnerable = false;", ph: "if (invulnerable && ...)" }),
      test("¿Qué es el god mode típico de las entregas (F10)?", ["Más vidas", "Volar sin gravedad y sin morir: gravityScale 0 y se ignoran SPIKES/DEATH", "Más velocidad", "Saltar más"], 1, ""),
      huecos("God mode.", String.raw`if (input->GetKey(SDL_SCANCODE_F10) == KEY_DOWN) godMode = ▢godMode;
b2Body_SetGravityScale(pbody->body, godMode ? ▢ : 1.0f);`, ["!", "0.0f", "-", "2.0f", "~"], ["!", "0.0f"], ""),
      test("¿Dónde se libera la lista de colliders del mapa?", ["Nunca", "En Map::CleanUp: physics->DeletePhysBody de cada uno y luego clear", "En el destructor de Box2D", "En Player"], 1, "Si cambias de nivel sin borrarlos, chocarás con paredes invisibles."),
      test("Detectar el suelo por la normal del contacto es mejor que solo `isJumping = false` al tocar una plataforma porque…", ["es igual", "chocar con una pared o un techo también es una plataforma: solo cuenta si la normal apunta hacia arriba", "es más rápido", "Box2D lo exige"], 1, ""),
      test("La meta del nivel (GOAL) debería…", ["Ser una plataforma", "Ser un sensor que pide cambiar de nivel al final del frame (no en el callback)", "Destruir el mapa ahí mismo", "Reiniciar el juego"], 1, ""),
      bug("Crash al recoger una moneda.", [
        "case ColliderType::ITEM:",
        "    coins++;",
        "    Engine::GetInstance().entityManager->DestroyEntity((Item*)physB->listener);",
        "    break;"], 2, "No destruyas en mitad del procesamiento de colisiones: marca `pendingToDelete = true`.")
    ]
  });
})();
