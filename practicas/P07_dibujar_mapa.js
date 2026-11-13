Curso.practica({
  leccion: "l07",
  titulo: "Dibuja el mapa: de gid a píxeles",
  intro: "Escribirás las cuatro piezas que dibujan un mapa: leer los tiles de una capa, Get(i, j), GetRect(gid), MapToWorld(i, j) y el bucle que lo une todo.",
  pasos: [
    {
      t: "Guardar los tiles de una capa",
      exp: `<p>Los <code>&lt;tile gid="…"/&gt;</code> están dentro de <code>&lt;data&gt;</code>. Escribe un <code>for</code> que los recorra todos y meta cada gid en <code>layer-&gt;tiles</code> (un <code>std::vector&lt;int&gt;</code>). El nodo de la capa se llama <code>node</code>.</p>`,
      escribe: {
        antes: String.raw`bool Map::LoadLayer(pugi::xml_node& node, MapLayer* layer)
{
    layer->name   = node.attribute("name").as_string();
    layer->width  = node.attribute("width").as_int();
    layer->height = node.attribute("height").as_int();`,
        despues: "    return true;\n}",
        filas: 6,
        checks: [
          [/for\(/, "Necesitas un bucle <code>for</code>."],
          [/node\.child\("data"\)\.child\("tile"\)/, "Empieza en el primer tile: <code>node.child(\"data\").child(\"tile\")</code>."],
          [/next_sibling\("tile"\)/, "Avanza con <code>next_sibling(\"tile\")</code>."],
          [/layer->tiles\.push_back\(\w+\.attribute\("gid"\)\.as_u?int\(\)\)/, "Dentro: <code>layer-&gt;tiles.push_back(tileNode.attribute(\"gid\").as_int());</code>"]
        ],
        sol: String.raw`    for (pugi::xml_node tileNode = node.child("data").child("tile");
         tileNode != NULL;
         tileNode = tileNode.next_sibling("tile"))
    {
        layer->tiles.push_back(tileNode.attribute("gid").as_int());
    }`
      },
      pistas: ["Es el mismo patrón de bucle que usaste para los tilesets en la L06.", "<code>for (pugi::xml_node tileNode = node.child(\"data\").child(\"tile\"); tileNode != NULL; tileNode = tileNode.next_sibling(\"tile\"))</code>"],
      bien: "<p>Al terminar, <code>tiles.size()</code> debe ser width × height. Si es 0, la capa está en CSV: cámbiala a XML en Tiled.</p>"
    },
    {
      t: "Get(i, j): leer un vector como matriz",
      exp: `<p>Los tiles están en una lista plana, fila tras fila. Para la columna <code>i</code> de la fila <code>j</code>: saltas <code>j</code> filas completas (cada una de <code>width</code> elementos) y avanzas <code>i</code>.</p>`,
      code: String.raw`unsigned int MapLayer::Get(int i, int j) const
{
    return tiles[§s1§];
}`,
      slots: { s1: { ok: [/^\(?j\*width\)?\+i$/, /^\(?width\*j\)?\+i$/, /^i\+\(?j\*width\)?$/, /^i\+\(?width\*j\)?$/], err: [[/^\(?i\*width\)?\+j$/, "Has intercambiado filas y columnas. i es la columna (x) y j la fila (y): se saltan j filas."], [/^i\*j$/, "Con i*j muchas casillas darían el mismo índice. Piensa: cuántos elementos saltas por cada fila completa."], [/height/, "Cada fila tiene <code>width</code> elementos; height no hace falta aquí."]], w: 16, sol: "(j * width) + i" } },
      pistas: ["Por cada fila que bajas, te saltas <code>width</code> elementos.", "<code>j * width + i</code>"],
      bien: "<p>Ejemplo: capa de 50 de ancho, casilla (3, 2) → 2·50 + 3 = 103. Esta fórmula la usarás también en visited y breadcrumbs (L11/L12).</p>"
    },
    {
      t: "GetRect(gid): ¿qué trozo del tileset?",
      exp: `<p>Tres operaciones: pasar el gid global a índice local restando <code>firstGid</code>; la <strong>columna</strong> es el resto de dividir entre columns; la <strong>fila</strong>, la división entera. Cada paso ocupa <code>tileWidth + spacing</code> píxeles y todo empieza tras el <code>margin</code>.</p>`,
      code: String.raw`SDL_Rect TileSet::GetRect(unsigned int gid) const
{
    SDL_Rect rect = { 0 };
    int relativeIndex = gid - §s1§;

    rect.w = tileWidth;
    rect.h = tileHeight;
    rect.x = margin + (tileWidth  + spacing) * (relativeIndex §s2§ columns);
    rect.y = margin + (tileHeight + spacing) * (relativeIndex §s3§ columns);
    return rect;
}`,
      slots: {
        s1: { ok: ["firstGid"], err: [[/^1$/, "Solo vale si es el primer tileset. Usa <code>firstGid</code> para que funcione con cualquiera."]] },
        s2: { ok: ["%"], err: [[/^\/$/, "La división da la FILA (y). Para la columna (x) necesitas el resto: <code>%</code>."]], w: 3 },
        s3: { ok: ["/"], err: [[/^%$/, "El resto da la COLUMNA (x). Para la fila (y) es la división entera: <code>/</code>."]], w: 3 }
      },
      pistas: ["Con 8 columnas: el 29 está en la fila 29/8 = 3 y la columna 29%8 = 5.", "x usa <code>%</code>, y usa <code>/</code>."],
      bien: "<p>Comprueba en la calculadora de arriba con gid 30: rect = {166, 100, 32, 32}. Esta fórmula vuelve en la L10 para los frames de animación.</p>"
    },
    {
      t: "MapToWorld(i, j)",
      exp: `<p>Convierte una casilla del mapa a píxeles del mundo. Escribe el <code>return</code> usando <code>mapData.tileWidth</code> y <code>mapData.tileHeight</code>.</p>`,
      escribe: {
        antes: "Vector2D Map::MapToWorld(int i, int j) const\n{",
        despues: "}",
        filas: 2,
        checks: [
          [/^return/, "Empieza con <code>return</code>."],
          [/Vector2D\(/, "Devuelve un <code>Vector2D(x, y)</code>."],
          [/i\*mapData\.tileWidth|mapData\.tileWidth\*i/, "La X es <code>i * mapData.tileWidth</code>."],
          [/j\*mapData\.tileHeight|mapData\.tileHeight\*j/, "La Y es <code>j * mapData.tileHeight</code>."]
        ],
        prohibido: [[/i\*mapData\.tileHeight|j\*mapData\.tileWidth/, "Cruzaste ancho y alto: i (columna) va con tileWidth, j (fila) con tileHeight."]],
        sol: "    return Vector2D((float)(i * mapData.tileWidth), (float)(j * mapData.tileHeight));"
      },
      pistas: ["Casilla × tamaño de casilla.", "<code>return Vector2D(i * mapData.tileWidth, j * mapData.tileHeight);</code>"],
      bien: "<p>Su inversa, <code>WorldToMap</code>, divide en lugar de multiplicar. La necesitarás para el pathfinding.</p>"
    },
    {
      t: "El bucle de dibujado",
      exp: `<p>Ahora escribe los dos <code>for</code> anidados que recorren todas las casillas de una capa: fuera las filas (<code>j</code> hasta <code>mapData.height</code>), dentro las columnas (<code>i</code> hasta <code>mapData.width</code>). Dentro, lee el gid con <code>mapLayer-&gt;Get(i, j)</code> y salta las casillas vacías.</p>`,
      escribe: {
        antes: String.raw`for (const auto& mapLayer : mapData.layers)
{`,
        despues: String.raw`            // (siguiente paso: dibujar)
        }
    }
}`,
        filas: 6,
        checks: [
          [/for\(intj=0;j<mapData\.height;j\+\+\)/, "Bucle exterior: <code>for (int j = 0; j &lt; mapData.height; j++)</code>"],
          [/for\(inti=0;i<mapData\.width;i\+\+\)/, "Bucle interior: <code>for (int i = 0; i &lt; mapData.width; i++)</code>"],
          [/=mapLayer->Get\(i,j\)/, "Lee el gid: <code>int gid = mapLayer-&gt;Get(i, j);</code>"],
          [/if\(gid==0\)continue;/, "Salta las vacías: <code>if (gid == 0) continue;</code>"]
        ],
        prohibido: [[/<=mapData\.(width|height)/, "Con <code>&lt;=</code> te sales una casilla del mapa. Los índices van de 0 a width−1."]],
        sol: String.raw`    for (int j = 0; j < mapData.height; j++)
    {
        for (int i = 0; i < mapData.width; i++)
        {
            int gid = mapLayer->Get(i, j);
            if (gid == 0) continue;`
      },
      pistas: ["Fila = j = height. Columna = i = width.", "<code>continue;</code> salta a la siguiente vuelta del bucle."],
      bien: "<p>Si no compruebas gid == 0, GetRect calcularía un índice negativo y dibujaría basura.</p>"
    },
    {
      t: "Dibujar la casilla",
      exp: `<p>Completa las tres últimas líneas: el rectángulo del tileset, la posición en el mundo, y la llamada a DrawTexture (que recibe un <em>puntero</em> al rect).</p>`,
      code: String.raw`            TileSet* tileSet = mapData.tilesets.front();
            SDL_Rect tileRect = tileSet->§s1§;
            Vector2D pos = §s2§;
            Engine::GetInstance().render->DrawTexture(tileSet->texture,
                (int)pos.getX(), (int)pos.getY(), §s3§);`,
      slots: {
        s1: { ok: ["GetRect(gid)"], w: 14 },
        s2: { ok: ["MapToWorld(i,j)"], err: [[/^MapToWorld\(j,i\)$/, "El orden es (i, j): primero columna, luego fila."]], w: 18, sol: "MapToWorld(i, j)" },
        s3: { ok: ["&tileRect"], err: [[/^tileRect$/, "DrawTexture espera un puntero: <code>&amp;tileRect</code>."]], w: 11 }
      },
      pistas: ["Las dos funciones las has escrito en los pasos 3 y 4."],
      bien: "<p>¡Mapa dibujado! En la L09 cambiarás <code>tilesets.front()</code> por <code>GetTilesetFromTileId(gid)</code> para soportar varios tilesets.</p>"
    }
  ]
});
