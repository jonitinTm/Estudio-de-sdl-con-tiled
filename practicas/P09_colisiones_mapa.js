Curso.practica({
  leccion: "l09",
  titulo: "Del mapa de Tiled a los colliders",
  intro: "Escribirás la búsqueda del tileset correcto, la lectura de propiedades personalizadas, el filtro de capas visibles y la creación de colliders desde la capa Collisions y desde un object layer.",
  pasos: [
    {
      t: "¿De qué tileset es este gid?",
      exp: `<p>Un tileset contiene los gid desde <code>firstGid</code> hasta <code>firstGid + tileCount − 1</code>. Completa la condición.</p>`,
      code: String.raw`
TileSet* Map::GetTilesetFromTileId(int gid) const
{
    for (const auto& tileset : mapData.tilesets) {
        if (gid >= tileset->firstGid && gid < §s1§)
            return tileset;
    }
    return nullptr;
}`,
      slots: { s1: { ok: ["tileset->firstGid+tileset->tileCount", "tileset->tileCount+tileset->firstGid"], err: [[/^tileset->tileCount$/, "tileCount es cuántos tiles tiene, pero el rango empieza en firstGid: súmalos."], [/^tileset->firstGid\+tileset->tileCount-1$/, "Con <code>&lt;</code> no hace falta el −1 (o usa <code>&lt;=</code> con −1)."]], w: 36, sol: "tileset->firstGid + tileset->tileCount" } },
      pistas: ["Desierto: firstGid 1, 48 tiles → gids 1..48. El siguiente tileset empieza en 49.", "Límite superior (exclusivo) = firstGid + tileCount."],
      bien: "<p>Ejemplo de tu mapa: gid 50 → 49 ≤ 50 &lt; 49 + 2 → MapMetadata.</p>"
    },
    {
      t: "Leer las propiedades de un nodo",
      exp: `<p>En el TMX las propiedades están en <code>&lt;properties&gt;&lt;property name="Draw" value="true"/&gt;…</code>. Escribe el bucle que recorre todos los <code>property</code> del <code>node</code>, crea un <code>Properties::Property</code> con <code>new</code>, le pone nombre y valor (bool), y lo añade a <code>properties.propertyList</code>.</p>`,
      escribe: {
        antes: "bool Map::LoadProperties(pugi::xml_node& node, Properties& properties)\n{",
        despues: "    return true;\n}",
        filas: 9,
        checks: [
          [/node\.child\("properties"\)\.child\("property"\)/, "Primer nodo: <code>node.child(\"properties\").child(\"property\")</code>."],
          [/next_sibling\("property"\)/, "Avanza con <code>next_sibling(\"property\")</code>."],
          [/newProperties::Property/, "Crea cada propiedad: <code>Properties::Property* p = new Properties::Property();</code>"],
          [/->name=\w+\.attribute\("name"\)\.as_string\(\);/, "Asigna el nombre: <code>p-&gt;name = propertyNode.attribute(\"name\").as_string();</code>"],
          [/->value=\w+\.attribute\("value"\)\.as_bool\(\);/, "Asigna el valor como bool: <code>p-&gt;value = propertyNode.attribute(\"value\").as_bool();</code>"],
          [/properties\.propertyList\.push_back\(/, "Añádela: <code>properties.propertyList.push_back(p);</code>"]
        ],
        sol: String.raw`    for (pugi::xml_node propertyNode = node.child("properties").child("property");
         propertyNode;
         propertyNode = propertyNode.next_sibling("property"))
    {
        Properties::Property* p = new Properties::Property();
        p->name  = propertyNode.attribute("name").as_string();
        p->value = propertyNode.attribute("value").as_bool();
        properties.propertyList.push_back(p);
    }`
      },
      pistas: ["Es el bucle de siempre (como los tilesets o los tiles), con otros nombres de nodo.", "Dentro: new, name, value, push_back."],
      bien: "<p>Llámalo desde <code>LoadLayer</code> con <code>LoadProperties(node, layer-&gt;properties);</code>. El destructor de Properties hace los <code>delete</code>.</p>"
    },
    {
      t: "Buscar una propiedad por nombre",
      exp: `<p>Recorre la lista; si el nombre coincide, devuelve esa propiedad. Si no hay ninguna, <code>nullptr</code>. (<code>name</code> es std::string, así que <code>==</code> compara bien con un const char*).</p>`,
      escribe: {
        antes: "Properties::Property* Properties::GetProperty(const char* name)\n{",
        despues: "}",
        filas: 5,
        checks: [
          [/for\(/, "Recorre la lista con un <code>for</code>, por ejemplo <code>for (const auto&amp; property : propertyList)</code>."],
          [/propertyList/, "La lista se llama <code>propertyList</code>."],
          [/if\(\w+->name==name\)returnproperty;|if\(\w+->name==name\)return\w+;/, "Dentro: <code>if (property-&gt;name == name) return property;</code>"],
          [/returnnullptr;$/, "Al final, si no la encontraste: <code>return nullptr;</code>"]
        ],
        sol: String.raw`    for (const auto& property : propertyList)
        if (property->name == name) return property;
    return nullptr;`
      },
      pistas: ["Bucle for-each + if + return.", "El <code>return nullptr;</code> va FUERA del bucle."],
      bien: "<p>Si pusieras el <code>return nullptr</code> dentro del bucle, solo mirarías la primera propiedad.</p>"
    },
    {
      t: "No dibujar las capas con Draw = false",
      exp: `<p>Al principio del bucle de capas en <code>Map::Update</code>, pide la propiedad Draw. Si no existe o es false, salta la capa. ¡Cuidado con el puntero nulo!</p>`,
      code: String.raw`for (const auto& mapLayer : mapData.layers)
{
    Properties::Property* draw = mapLayer->properties.GetProperty(§s1§);
    if (draw == §s2§ || §s3§) continue;`,
      slots: {
        s1: { ok: ['"Draw"'], err: [[/^"draw"$/, "Debe coincidir exactamente con el nombre puesto en Tiled: <code>\"Draw\"</code>."]], w: 8 },
        s2: { ok: ["nullptr", "NULL"] },
        s3: { ok: ["!draw->value", "draw->value==false"], err: [[/^draw->value$/, "Así saltarías las capas VISIBLES. Hay que saltar cuando NO se dibuja: <code>!draw-&gt;value</code>."]], w: 14 }
      },
      pistas: ["Primero comprueba que el puntero no sea nulo; luego, su valor.", "Gracias al <code>||</code>, si draw es nullptr ya no se evalúa <code>draw-&gt;value</code> (no crashea)."],
      bien: "<p>El orden importa: <code>draw == nullptr || !draw-&gt;value</code>. Al revés, con una capa sin la propiedad, accederías a un puntero nulo.</p>"
    },
    {
      t: "Un collider por cada tile de Collisions",
      exp: `<p>Dentro de los dos bucles (i, j) sobre la capa con <code>Collision = true</code>, ya tienes <code>Vector2D pos = MapToWorld(i, j);</code>. <code>CreateRectangle</code> recibe el <strong>centro</strong>: suma medio tile.</p>`,
      code: String.raw`            PhysBody* c = Engine::GetInstance().physics->CreateRectangle(
                (int)pos.getX() + §s1§,
                (int)pos.getY() + mapData.tileHeight / 2,
                mapData.tileWidth, mapData.tileHeight, §s2§);
            c->ctype = ColliderType::PLATFORM;`,
      slots: {
        s1: { ok: ["mapData.tileWidth/2"], err: [[/^mapData\.tileWidth$/, "Eso es un tile entero; al centro hay MEDIO tile."], [/^0$/, "Sin sumar nada, el collider quedaría desplazado medio tile arriba a la izquierda."]], w: 20, sol: "mapData.tileWidth / 2" },
        s2: { ok: ["STATIC", "bodyType::STATIC"], err: [[/DYNAMIC/, "¡Las plataformas se caerían! El suelo es STATIC."]] }
      },
      pistas: ["Fíjate en la línea de la Y: haz lo mismo para la X.", "¿El suelo se mueve?"],
      bien: "<p>Activa F9 en tu juego: si los rectángulos verdes están desplazados medio tile respecto a los ladrillos, es este +tileWidth/2.</p>"
    },
    {
      t: "Colliders desde un object layer",
      exp: `<p>Un objeto rectangular de Tiled guarda <code>x</code>, <code>y</code> (esquina <strong>superior izquierda</strong>), <code>width</code> y <code>height</code>, con decimales. Léelos y crea el collider en su centro.</p>`,
      code: String.raw`for (pugi::xml_node obj = group.child("object"); obj; obj = obj.next_sibling("object"))
{
    float x = obj.attribute("x").§s1§;
    float y = obj.attribute("y").as_float();
    float w = obj.attribute("width").as_float();
    float h = obj.attribute("height").as_float();

    PhysBody* body = Engine::GetInstance().physics->CreateRectangle(
        (int)(x + §s2§), (int)(y + h / 2), (int)w, (int)h, STATIC);
}`,
      slots: {
        s1: { ok: ["as_float()"], err: [[/^as_int\(\)$/, "Tiled guarda coordenadas como 1622.67: con as_int perderías los decimales (o leerías 0 en algunos casos). Usa as_float."]], w: 11 },
        s2: { ok: ["w/2", "w/2.0f", "w*0.5f", "w*0.5"], w: 8, sol: "w / 2" }
      },
      pistas: ["Tu objeto Spawn está en y=1622.67: hay decimales.", "Igual que la Y: medio ancho."],
      bien: "<p>Una sola caja por plataforma en lugar de una por tile: menos cuerpos y sin “enganches” entre cajas. Para Spawn no creas collider: guardas <code>Vector2D(x, y)</code> y colocas al jugador ahí.</p>"
    }
  ]
});
