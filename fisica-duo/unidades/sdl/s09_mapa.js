(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-mapa", titulo: "Dibujar el mapa", icono: "🗺",
    desc: "De gid a rectángulo del tileset (con margin y spacing), qué tileset tiene cada gid, MapToWorld/WorldToMap y el bucle de capas, filas y columnas.",
    chuleta: [
      ["GetRect", "```SDL_Rect TileSet::GetRect(int gid) const\n{\n    int local = gid - firstGid;\n    SDL_Rect r;\n    r.x = margin + (tileWidth + spacing) * (local % columns);\n    r.y = margin + (tileHeight + spacing) * (local / columns);\n    r.w = tileWidth; r.h = tileHeight;\n    return r;\n}```"],
      ["Bucle", "```for (MapLayer* layer : mapData.layers) {\n    if (!layer->properties.GetProperty(\"Draw\") || !layer->properties.GetProperty(\"Draw\")->value) continue;\n    for (int j = 0; j < mapData.height; j++)\n        for (int i = 0; i < mapData.width; i++) {\n            int gid = layer->Get(i, j);\n            if (gid == 0) continue;\n            TileSet* ts = GetTilesetFromTileId(gid);\n            SDL_Rect rect = ts->GetRect(gid);\n            Vector2D pos = MapToWorld(i, j);\n            render->DrawTexture(ts->texture, (int)pos.getX(), (int)pos.getY(), &rect);\n        }\n}```"],
      ["Conversión", "`MapToWorld(i, j) = (i * tileWidth, j * tileHeight)` · `WorldToMap(x, y) = (x / tileWidth, y / tileHeight)` (división entera)."]
    ],
    preguntas: [
      test("Tileset de 8 columnas, tiles de 32 px, sin margin ni spacing. ¿Rectángulo del índice local 10?", ["{ 320, 0, 32, 32 }", "{ 64, 32, 32, 32 }", "{ 32, 64, 32, 32 }", "{ 80, 10, 32, 32 }"], 1, "columna = 10 % 8 = 2 → x = 64; fila = 10 / 8 = 1 → y = 32.", { nuevo: true }),
      huecos("GetRect.", String.raw`int local = gid - firstGid;
r.x = margin + (tileWidth + spacing) * (local ▢ columns);
r.y = margin + (tileHeight + spacing) * (local ▢ columns);`, ["%", "/", "*", "+"], ["%", "/"], "Resto = columna; cociente = fila."),
      test("Con margin = 1 y spacing = 2, tiles de 16 px. ¿x del tile de la columna 3?", ["48", "55", "49", "54"], 1, "1 + (16 + 2) · 3 = 55."),
      test("Si olvidas restar firstgid en un tileset con firstgid 49…", ["Nada", "Dibujas el tile equivocado (49 posiciones más adelante, a menudo fuera de la imagen)", "Crash seguro", "Se ve negro"], 1, ""),
      huecos("¿Qué tileset contiene este gid?", String.raw`TileSet* Map::GetTilesetFromTileId(int gid) const
{
    for (TileSet* ts : mapData.tilesets)
        if (gid >= ts->firstGid && gid ▢ ts->firstGid + ts->▢)
            return ts;
    return nullptr;
}`, ["<", "tileCount", "<=", "columns", "tileWidth"], ["<", "tileCount"], "firstGid ≤ gid < firstGid + tileCount."),
      escribe("Escribe la x en el mundo de la columna `i` (usa `mapData.tileWidth`).", ["i * mapData.tileWidth", "mapData.tileWidth * i"], "MapToWorld.", { ph: "i * ..." }),
      escribe("Escribe la columna de la casilla que contiene el píxel `x` (int) del mundo.", ["x / mapData.tileWidth"], "División entera: 70 / 32 = 2.", { ph: "x / ..." }),
      test("Píxel del mundo (70, 100), tiles de 32. ¿Casilla?", ["(2, 3)", "(3, 4)", "(2, 4)", "(70, 100)"], 0, "70 / 32 = 2, 100 / 32 = 3."),
      orden("Bucle para dibujar una capa.", [
        "for (int j = 0; j < mapData.height; j++)",
        "for (int i = 0; i < mapData.width; i++)",
        "int gid = layer->Get(i, j);",
        "if (gid == 0) continue;",
        "TileSet* ts = GetTilesetFromTileId(gid);",
        "SDL_Rect rect = ts->GetRect(gid);",
        "Vector2D pos = MapToWorld(i, j);",
        "render->DrawTexture(ts->texture, (int)pos.getX(), (int)pos.getY(), &rect);"], ""),
      bug("El nivel solo dibuja bien la parte del primer tileset; el resto sale con tiles raros.", [
        "int gid = layer->Get(i, j);",
        "if (gid == 0) continue;",
        "TileSet* ts = mapData.tilesets.front();",
        "SDL_Rect rect = ts->GetRect(gid);"], 2, "Hay que usar `GetTilesetFromTileId(gid)` en vez del primero."),
      test("Si cambias el orden de las capas en Tiled, ¿qué pasa en tu juego?", ["Nada", "Cambia el orden de dibujado: lo que va después se ve encima", "Se rompe el mapa", "Cambian las colisiones"], 1, ""),
      test("¿Dónde se libera la memoria de las capas y tilesets?", ["En el destructor de SDL", "En Map::CleanUp: delete de cada TileSet y MapLayer (y sus propiedades), y UnLoad de las texturas", "No hace falta", "En Scene"], 1, ""),
      huecos("Solo los tiles visibles (culling) en horizontal.", String.raw`int firstCol = std::max(0, (int)(-camera.x) / tileWidth);
int lastCol  = std::▢(mapData.width - 1, (int)(-camera.x + screenW) / tileWidth);
for (int i = firstCol; i ▢ lastCol; i++) ...`, ["min", "<=", "max", "<", "abs"], ["min", "<="], "La cámara es negativa: −camera.x es el borde izquierdo en el mundo."),
      test("¿Qué tamaño tiene el mapa en píxeles (100 × 22 tiles de 32)?", ["100 × 22", "3200 × 704", "132 × 54", "320 × 220"], 1, "Útil para limitar la cámara."),
      bug("Crash al pedir una propiedad que una capa no tiene.", [
        "Properties::Property* p = layer->properties.GetProperty(\"Draw\");",
        "if (p->value == false) continue;"], 1, "GetProperty devuelve nullptr si no existe: `if (p == nullptr || !p->value) continue;`.")
    ]
  });
})();
