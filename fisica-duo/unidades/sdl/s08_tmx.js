(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    curso: "sdl", id: "sdl-tmx", titulo: "Tiled: el formato TMX", icono: "▦",
    desc: "Qué hay dentro de un .tmx, tilesets y firstgid, capas de tiles con gids, propiedades personalizadas y capas de objetos.",
    chuleta: [
      ["TMX (XML)", "```<map width=\"100\" height=\"22\" tilewidth=\"32\" tileheight=\"32\">\n  <tileset firstgid=\"1\" name=\"Terrain\" tilewidth=\"32\" tileheight=\"32\" spacing=\"0\" margin=\"0\" tilecount=\"48\" columns=\"8\">\n    <image source=\"terrain.png\" width=\"256\" height=\"192\"/>\n  </tileset>\n  <tileset firstgid=\"49\" name=\"MapMetadata\" .../>\n  <layer id=\"1\" name=\"Background\" width=\"100\" height=\"22\">\n    <properties><property name=\"Draw\" type=\"bool\" value=\"true\"/></properties>\n    <data><tile gid=\"5\"/><tile gid=\"0\"/>...</data>\n  </layer>\n  <objectgroup name=\"Spawn\"><object id=\"7\" x=\"192\" y=\"1600\" width=\"32\" height=\"32\"/></objectgroup>\n</map>```"],
      ["Claves", "gid **0** = casilla vacía. El gid es global: `local = gid - firstgid`. Los tiles se guardan fila a fila: `data[j * width + i]`. En Tiled: Map Properties → Tile Layer Format = **XML**."]
    ],
    preguntas: [
      test("¿Qué significa gid = 0 en una capa?", ["El primer tile", "Casilla vacía: no se dibuja nada", "Error", "Colisión"], 1, "", { nuevo: true }),
      test("Un mapa tiene dos tilesets: Terrain (48 tiles, firstgid 1) y Metadata. ¿firstgid de Metadata?", ["1", "48", "49", "2"], 2, "Los gids siguen donde acabó el anterior: 1 + 48 = 49."),
      test("gid 53 con el tileset Metadata (firstgid 49). ¿Índice local?", ["53", "4", "49", "5"], 1, "local = gid − firstgid = 53 − 49."),
      test("Mapa de 100 × 22. ¿Posición en el array `data` de la casilla (i = 5, j = 2)?", ["205", "105", "27", "502"], 0, "j * width + i = 2 · 100 + 5."),
      escribe("Escribe la expresión del gid de la casilla (i, j) con `layer->tiles` y `layer->width`.", ["layer->tiles[j * layer->width + i]", "layer->tiles[i + j * layer->width]", "layer->tiles[layer->width * j + i]"], "Fila j, columna i.", { ph: "layer->tiles[...]" }),
      test("Tu código lee `<tile gid=…/>`, pero el TMX tiene un texto con números separados por comas. ¿Qué pasa?", ["Funciona igual", "La capa está en formato CSV: hay que cambiar en Tiled Map Properties → Tile Layer Format a XML", "Es un error del mapa", "Hay que usar otro tileset"], 1, ""),
      huecos("Lee la cabecera del mapa.", String.raw`pugi::xml_node map = mapFile.child("map");
mapData.width = map.attribute("width").as_int();
mapData.tileWidth = map.attribute("▢").as_int();
mapData.tileHeight = map.attribute("▢").as_int();`, ["tilewidth", "tileheight", "tileWidth", "width", "height"], ["tilewidth", "tileheight"], "Los atributos del TMX van en minúsculas."),
      orden("Recorre todos los tilesets del TMX.", [
        "for (pugi::xml_node ts = mapFile.child(\"map\").child(\"tileset\");",
        "     ts != NULL;",
        "     ts = ts.next_sibling(\"tileset\"))",
        "{",
        "    TileSet* tileSet = new TileSet();",
        "    tileSet->firstGid = ts.attribute(\"firstgid\").as_int();",
        "    mapData.tilesets.push_back(tileSet);",
        "}"], "Si solo lees el primero, la mitad del nivel no tendrá gráficos."),
      test("¿Para qué sirve una propiedad personalizada `Draw = false` en una capa?", ["Para borrarla", "Para que la capa exista (p. ej. colisiones) pero no se dibuje", "Para ocultar el mapa", "Para el audio"], 1, ""),
      huecos("Lee las propiedades de una capa.", String.raw`for (pugi::xml_node p = node.child("properties").child("▢"); p; p = p.next_sibling("property"))
{
    Properties::Property* prop = new Properties::Property();
    prop->name = p.attribute("name").▢();
    prop->value = p.attribute("value").as_bool();
    layer->properties.propertyList.push_back(prop);
}`, ["property", "as_string", "properties", "as_bool", "value"], ["property", "as_string"], ""),
      test("¿Qué diferencia hay entre una capa de tiles y una de objetos?", ["Ninguna", "La de tiles es una rejilla de gids; la de objetos tiene formas libres (rectángulos, puntos) con x, y, w, h en píxeles", "La de objetos no se guarda", "La de tiles es para colisiones"], 1, ""),
      test("Un objeto rectángulo de Tiled tiene x = 100, y = 200, w = 64, h = 32. ¿Su centro (para Box2D)?", ["(100, 200)", "(132, 216)", "(164, 232)", "(68, 184)"], 1, "x, y es la esquina superior izquierda: centro = (x + w/2, y + h/2)."),
      test("¿Dónde pondrías el punto de aparición del jugador?", ["En el código", "En una capa de objetos (Spawn) del mapa: así lo mueves sin recompilar", "En config.xml siempre", "En la textura"], 1, ""),
      test("Un tile volteado en Tiled tiene gid 2147483653. ¿Qué pasa?", ["Es un error", "Los bits altos indican flip (0x80000000 = horizontal): hay que quitarlos con una máscara antes de buscar el tileset", "Es el tile 2147483653", "Es vacío"], 1, "`gid & 0x1FFFFFFF` da el gid real (en Tiled modernos, 0x0FFFFFFF)."),
      escribe("Escribe la expresión que quita los 3 bits de flip de `gid` (máscara 0x1FFFFFFF).", ["gid & 0x1FFFFFFF", "gid&0x1fffffff"], "", { ph: "gid & ..." })
    ]
  });
})();
