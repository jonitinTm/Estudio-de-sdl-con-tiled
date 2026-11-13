Curso.practica({
  leccion: "l06",
  titulo: "Carga el mapa y todos sus tilesets",
  intro: "Leerás los atributos del nodo <map>, recorrerás todos los <tileset>, cargarás sus imágenes y los liberarás al terminar.",
  pasos: [
    {
      t: "El struct TileSet",
      exp: `<p>Antes de leer, decide dónde guardar. Completa el struct con los tipos correctos: los tamaños son enteros, el nombre es texto y la imagen es una textura de SDL (puntero).</p>`,
      code: String.raw`
struct TileSet
{
    §s1§ firstGid;
    §s2§ name;
    int tileWidth, tileHeight;
    int spacing, margin;
    int tileCount, columns;
    §s3§ texture = nullptr;
};`,
      slots: {
        s1: { ok: ["int", "unsigned int", "unsigned", "uint32_t"] },
        s2: { ok: ["std::string", "string"], err: [[/^char\*?$/, "Mejor <code>std::string</code>: se gestiona solo la memoria."]], w: 12, sol: "std::string" },
        s3: { ok: ["SDL_Texture*"], err: [[/^SDL_Texture$/, "Las texturas de SDL siempre se manejan por puntero: <code>SDL_Texture*</code>."]] }
      },
      pistas: ["firstGid es un número; name, texto.", "Las texturas se manejan con un puntero: lleva <code>*</code>."],
      bien: "<p>Un struct por cada nodo del XML que te interesa: <code>&lt;tileset&gt;</code> + <code>&lt;image&gt;</code> → TileSet.</p>"
    },
    {
      t: "Leer el nodo <map>",
      exp: `<p>Los atributos de <code>&lt;map&gt;</code> son <code>width</code>, <code>height</code>, <code>tilewidth</code>, <code>tileheight</code>. Ojo a cómo se escriben en el TMX (todo en minúscula).</p>`,
      code: String.raw`    pugi::xml_node mapNode = mapFileXML.child("map");
    mapData.width      = mapNode.attribute(§s1§).as_int();
    mapData.height     = mapNode.attribute("height").as_int();
    mapData.tileWidth  = mapNode.attribute(§s2§).as_int();
    mapData.tileHeight = mapNode.attribute("tileheight").as_int();`,
      slots: {
        s1: { ok: ['"width"'], err: [[/^width$/, "Los nombres van entre comillas: <code>\"width\"</code>."]] },
        s2: { ok: ['"tilewidth"'], err: [[/^"tileWidth"$/, "En el TMX es <code>tilewidth</code>, todo en minúscula. Con la W mayúscula pugixml no lo encuentra y te devuelve 0."], [/^tilewidth$/, "Entre comillas: <code>\"tilewidth\"</code>."]], w: 13 }
      },
      pistas: ["Mira el TMX: <code>&lt;map … width=\"50\" … tilewidth=\"32\"&gt;</code>."],
      bien: "<p>Error típico: escribir el nombre de tu variable (<code>tileWidth</code>) en vez del nombre del atributo del XML (<code>tilewidth</code>). Compila, no avisa… y todo mide 0.</p>"
    },
    {
      t: "Recorrer TODOS los tilesets",
      exp: `<p>Un mapa puede tener varios <code>&lt;tileset&gt;</code> seguidos (el tuyo tiene 6). Completa el <code>for</code>: empieza en el primero y avanza al siguiente <em>hermano</em> con el mismo nombre.</p>`,
      code: String.raw`for (pugi::xml_node tilesetNode = mapFileXML.child("map").§s1§;
     tilesetNode != NULL;
     tilesetNode = tilesetNode.§s2§)
{`,
      slots: {
        s1: { ok: ['child("tileset")'], w: 18 },
        s2: { ok: ['next_sibling("tileset")'], err: [[/^next_sibling\(\)$/, "Sin nombre pasaría también por los <code>&lt;layer&gt;</code>. Pon <code>next_sibling(\"tileset\")</code>."], [/^child\("tileset"\)$/, "child baja un nivel. Para ir al siguiente al mismo nivel se usa next_sibling."]], w: 24 }
      },
      pistas: ["Primer hijo: <code>child(\"…\")</code>. Siguiente hermano: <code>next_sibling(\"…\")</code>."],
      bien: "<p>Cuando no hay más hermanos, <code>next_sibling</code> devuelve un nodo vacío que se evalúa como NULL y el bucle termina.</p>"
    },
    {
      t: "Rellenar el TileSet",
      exp: `<p>Dentro del bucle ya tienes <code>TileSet* tileSet = new TileSet();</code>. Escribe las líneas que leen <code>firstgid</code>, <code>spacing</code>, <code>margin</code> y <code>columns</code> (todos enteros).</p>`,
      escribe: {
        antes: "    TileSet* tileSet = new TileSet();",
        filas: 5,
        checks: [
          [/tileSet->firstGid=tilesetNode\.attribute\("firstgid"\)\.as_int\(\);/, "firstGid: <code>tileSet-&gt;firstGid = tilesetNode.attribute(\"firstgid\").as_int();</code>"],
          [/tileSet->spacing=tilesetNode\.attribute\("spacing"\)\.as_int\(\);/, "Falta spacing (mismo patrón, atributo <code>\"spacing\"</code>)."],
          [/tileSet->margin=tilesetNode\.attribute\("margin"\)\.as_int\(\);/, "Falta margin."],
          [/tileSet->columns=tilesetNode\.attribute\("columns"\)\.as_int\(\);/, "Falta columns."]
        ],
        prohibido: [[/tileSet\.(firstGid|spacing|margin|columns)/, "tileSet es un PUNTERO (lo creaste con new): usa <code>-&gt;</code>, no <code>.</code>"], [/"firstGid"/, "En el XML el atributo es <code>firstgid</code> en minúscula."]],
        sol: String.raw`    tileSet->firstGid = tilesetNode.attribute("firstgid").as_int();
    tileSet->spacing  = tilesetNode.attribute("spacing").as_int();
    tileSet->margin   = tilesetNode.attribute("margin").as_int();
    tileSet->columns  = tilesetNode.attribute("columns").as_int();`
      },
      pistas: ["Patrón: <code>tileSet-&gt;campo = tilesetNode.attribute(\"nombre_xml\").as_int();</code>", "Los nombres del XML van en minúscula: firstgid, spacing, margin, columns."],
      bien: "<p>El resto (name, tilewidth, tileheight, tilecount) es igual. Si un tileset no tiene margin, <code>as_int()</code> devuelve 0, que es justo lo correcto.</p>"
    },
    {
      t: "Cargar la imagen",
      exp: `<p>El <code>source</code> de <code>&lt;image&gt;</code> es relativo a la carpeta del mapa. Junta la carpeta (<code>mapPath</code>, p. ej. <code>"Assets/Maps/"</code>) y el source, y carga la textura.</p>`,
      code: String.raw`    std::string imgPath = §s1§ + tilesetNode.child("image").attribute("source").as_string();
    tileSet->texture = Engine::GetInstance().textures->§s2§(imgPath.c_str());
    mapData.tilesets.§s3§(tileSet);`,
      slots: {
        s1: { ok: ["mapPath"], err: [[/^mapFileName$/, "Eso es el nombre del .tmx; necesitas la CARPETA."]] },
        s2: { ok: ["Load"] },
        s3: { ok: ["push_back"], err: [[/^add$|^push$/, "En std::list / std::vector se añade al final con <code>push_back</code>."]] }
      },
      pistas: ["La carpeta del mapa la guardaste en <code>mapPath</code> al empezar Load().", "Añadir al final de una lista: <code>push_back</code>."],
      bien: "<p>Si ves la textura en pantalla al dibujarla en (0,0) (TODO 6), la carga funciona.</p>"
    },
    {
      t: "Liberar en CleanUp",
      exp: `<p>Cada TileSet se creó con <code>new</code>, así que hay que borrarlo. Completa el bucle.</p>`,
      code: String.raw`
bool Map::CleanUp()
{
    for (auto& ts : mapData.tilesets) {
        Engine::GetInstance().textures->UnLoad(ts->texture);
        §s1§ ts;
    }
    mapData.tilesets.§s2§();
    return true;
}`,
      slots: { s1: { ok: ["delete"], err: [[/^free$/, "free es de C (malloc). Lo creado con new se borra con delete."]] }, s2: { ok: ["clear"] } },
      pistas: ["Lo contrario de <code>new</code>.", "Vaciar la lista: <code>clear()</code>."],
      bien: "<p>Regla de oro: cada <code>new</code> tiene su <code>delete</code>. Si no, tienes una fuga de memoria que crece cada vez que cargas un mapa.</p>"
    }
  ]
});
