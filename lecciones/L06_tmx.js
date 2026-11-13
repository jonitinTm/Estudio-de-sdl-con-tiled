(function () {
  const { code, nota, todo, quiz, demo, esc } = Curso;

  // Partes del TMX con su explicación (para el explorador)
  const partes = [
    { k: "xml", txt: `<?xml version="1.0" encoding="UTF-8"?>`, exp: "Cabecera estándar de XML: versión y codificación de caracteres. pugixml la procesa sola, no tienes que leerla.", st: "—" },
    { k: "map", txt: `<map version="1.10" orientation="orthogonal" renderorder="right-down" width="50" height="15" tilewidth="32" tileheight="32" infinite="0">`, exp: "Nodo raíz. Guarda la configuración general del mapa (lo mismo que eliges en el diálogo de “Nuevo mapa”). width/height son en TILES, no en píxeles: este mapa mide 50·32 = 1600 px de ancho.", st: "MapData { width, height, tileWidth, tileHeight }" },
    { k: "tileset", txt: `  <tileset firstgid="1" name="Desert" tilewidth="32" tileheight="32" spacing="1" margin="1" tilecount="48" columns="8">`, exp: "Un tileset (paleta de tiles). Puede haber varios: cada uno empieza a numerar en su firstgid. spacing = píxeles entre tiles; margin = píxeles del borde de la imagen. columns y tilecount te ahorran cálculos.", st: "TileSet { firstGid, name, tileWidth, tileHeight, spacing, margin, tileCount, columns }" },
    { k: "image", txt: `    <image source="tmw_desert_spacing.png" width="265" height="199"/>`, exp: "La imagen del tileset. source es una ruta RELATIVA al .tmx, así que tendrás que concatenar la carpeta del mapa. Ya te dice el tamaño de la imagen.", st: "TileSet { texture = textures->Load(carpeta + source) }" },
    { k: "wang", txt: `    <wangsets> … <wangtile tileid="0" wangid="0,4,0,1,0,4,0,4"/> … </wangsets>`, exp: "Los terrenos (Terrain Sets / Wang sets) que creaste en Tiled para pintar automáticamente. Solo sirven al editor: tu motor lo IGNORA.", st: "(se ignora)" },
    { k: "tsend", txt: `  </tileset>`, exp: "Fin del tileset. Si hubiera otro, vendría un segundo <tileset firstgid=\"49\" …>.", st: "—" },
    { k: "layer", txt: `  <layer id="1" name="Capa de Patrones 1" width="50" height="15">`, exp: "Una capa de tiles con su nombre y tamaño. Puede haber muchas (fondo, plataformas, colisiones…). Se dibujan en el orden en que aparecen.", st: "MapLayer { id, name, width, height }  (L07)" },
    { k: "data", txt: `    <data>\n      <tile gid="30"/>\n      <tile gid="30"/>\n      <tile gid="0"/>\n      …\n    </data>`, exp: "El contenido de la capa: width·height elementos <tile>, fila a fila (de izquierda a derecha y de arriba abajo). gid = qué tile del tileset va ahí. gid 0 = casilla vacía. Para leer esto el formato de capa debe ser XML (no CSV ni Base64).", st: "MapLayer { std::vector<int> tiles }  (L07)" },
    { k: "lend", txt: `  </layer>\n</map>`, exp: "Cierre de la capa y del mapa.", st: "—" }
  ];

  Curso.leccion({
    id: "l06", num: "06", grupo: "Bloque 3 · Mapas con Tiled", corto: "Formato TMX", pdf: "L06_Tile_Maps_formats",
    titulo: "Mapas de tiles: Tiled y el formato TMX",
    resumen: "Crear un mapa en Tiled, entender cada etiqueta del .tmx y cargar mapa y tilesets en un módulo Map.",
    intro: "Diseñar niveles a mano en código es imposible. Con Tiled pintas el nivel; el archivo .tmx que guarda es XML, así que ya sabes leerlo. Hoy cargas los datos del mapa y de sus tilesets en un nuevo módulo Map.",
    objetivos: ["Crear un mapa ortogonal de 50×15 tiles de 32 px en Tiled", "Saber qué guarda cada nodo del TMX", "Diseñar los structs MapData y TileSet", "Cargar uno o varios tilesets con su textura"],
    html: () => `
<h2>Qué queremos</h2>
<p>Que el motor lea un archivo hecho en un editor y obtenga: los <strong>gráficos</strong> del nivel, las <strong>colisiones</strong> y otros <strong>metadatos</strong> (dónde aparece el jugador, items, enemigos…). Todo eso lo gestionará un nuevo módulo <code>Map</code> que carga el archivo, guarda los datos, responde preguntas sobre el mapa y se dibuja.</p>
<p><strong>Tiled</strong> es gratuito, se usó en juegos como Shovel Knight y tiene importadores para Unity, GameMaker o Unreal. Guarda los mapas en <strong>TMX</strong> (XML).</p>

<h2>Usar Tiled: lo mínimo</h2>
<ol>
<li>Abre los ejemplos (<code>C:\\Program Files\\Tiled\\examples</code>) y abre <code>desert.tmx</code>. Localiza el panel de <strong>Capas</strong>, el <strong>Minimapa</strong>, los <strong>Tilesets</strong> y los <strong>Terrain Sets</strong>.</li>
<li><strong>Pintar</strong>: selecciona un tile (el cactus) y usa el sello (Stamp, <kbd>B</kbd>). Con clic derecho arrastrando copias una zona y pintas con ella.</li>
<li><strong>Nuevo mapa</strong> (Archivo → Nuevo): Ortogonal, formato de capa CSV de momento, orden Right Down, tamaño fijo <strong>50 × 15 tiles</strong>, tiles de <strong>32×32</strong>. Guárdalo como <code>testMap.tmx</code>.</li>
<li>En las propiedades del mapa cambia <strong>Tile Layer Format a XML</strong>. Es el paso más importante: tu código lee <code>&lt;tile gid=…/&gt;</code>.</li>
<li><strong>Nuevo tileset</strong>: <code>tmw_desert_spacing.png</code>, 32×32 px, <strong>margin 1 y spacing 1</strong>, y marca <strong>Embed in map</strong> (incrustado).</li>
<li><strong>Terrenos</strong>: edita el tileset → Terrain → New Corner Set, marca las esquinas de los ladrillos y pinta en el mapa con el terreno.</li>
</ol>
<div class="table-wrap"><table class="t"><thead><tr><th>Tipo de terreno</th><th>Se define por</th><th>Ideal para</th></tr></thead><tbody>
<tr><td>Corner Set</td><td>las 4 esquinas del tile</td><td>transiciones de suelo (arena → hierba)</td></tr>
<tr><td>Edge Set</td><td>los 4 lados</td><td>caminos, muros, tuberías, ríos, plataformas</td></tr>
<tr><td>Mixed Set</td><td>esquinas y lados</td><td>máxima flexibilidad, más trabajo</td></tr>
</tbody></table></div>

${nota(`<p><strong>Margin y spacing mal puestos</strong> es el error número uno: los tiles salen desplazados uno o dos píxeles y aparecen líneas rosas. Mira la imagen: si hay una línea de 1 px entre tiles y en el borde, son margin = 1 y spacing = 1.</p>`, "warn")}

<h2>El formato TMX, nodo a nodo</h2>
${demo("d-tmx", "Explorador del TMX", "Haz clic en cada línea", `
<div class="split">
  <div class="code" style="margin:0"><div class="code-head"><span>MapTemplate.tmx</span></div><pre id="tmx-pre" style="white-space:pre-wrap;word-break:break-all"></pre></div>
  <div id="tmx-exp" style="font-size:.92rem"></div>
</div>`)}

<h2>Diseño de las estructuras</h2>
<p>Antes de programar, decide dónde guardarás cada dato. La idea: un struct por cada nodo del XML que te interesa.</p>
${code(String.raw`
// Map.h  (fuera de la clase Map)
struct TileSet
{
    int firstGid;
    std::string name;
    int tileWidth, tileHeight;
    int spacing, margin;
    int tileCount, columns;
    SDL_Texture* texture = nullptr;      // la imagen cargada
};

struct MapData
{
    int width, height;                   // en tiles
    int tileWidth, tileHeight;           // en píxeles
    std::list<TileSet*> tilesets;        // puede haber varios
    // std::list<MapLayer*> layers;      // en la L07
};

class Map : public Module
{
public:
    bool Load(std::string path, std::string fileName);
    bool LoadTileSet(pugi::xml_node mapFile);
    bool Update(float dt) override;
    bool CleanUp() override;
private:
    std::string mapFileName, mapPath;
    MapData mapData;
    bool mapLoaded = false;
};`, "cpp", "Map.h")}

<h2>Los TODOs del handout</h2>
${todo("TODO 0", "Engine.h / Engine.cpp", `<p>Comprueba que Map.h/Map.cpp están en la solución y que el Engine crea y añade el módulo <code>map</code>. Fíjate en el orden: el mapa debe dibujarse <em>antes</em> que las entidades (si no, taparía al jugador).</p>`, "")}

${todo("TODO 1 y 2", "Map.h", `<p>Crea <code>MapData</code> (width, height, tilewidth, tileheight) y <code>TileSet</code> (todos los atributos del nodo tileset + la textura del nodo image). Añade a MapData una lista de tilesets y declara <code>mapData</code> en la clase.</p>`, `<p>Es el bloque <em>Map.h</em> de arriba.</p>`)}

${todo("TODO 3", "Scene.cpp / Map.cpp → Load()", `<p>Llama a <code>Load</code> desde <code>Scene::Start()</code> y rellena mapData con los atributos de <code>&lt;map&gt;</code>.</p>`,
      code(String.raw`
// Scene.cpp
bool Scene::Start()
{
    Engine::GetInstance().map->Load("Assets/Maps/", "MapTemplate.tmx");
    return true;
}

// Map.cpp
bool Map::Load(std::string path, std::string fileName)
{
    mapFileName = fileName;
    mapPath = path;
    std::string mapPathName = mapPath + mapFileName;

    pugi::xml_document mapFileXML;
    pugi::xml_parse_result result = mapFileXML.load_file(mapPathName.c_str());
    if (!result) {
        LOG("Could not load map xml file %s. pugi error: %s", mapPathName.c_str(), result.description());
        return false;
    }

    pugi::xml_node mapNode = mapFileXML.child("map");
    mapData.width      = mapNode.attribute("width").as_int();
    mapData.height     = mapNode.attribute("height").as_int();
    mapData.tileWidth  = mapNode.attribute("tilewidth").as_int();
    mapData.tileHeight = mapNode.attribute("tileheight").as_int();

    bool ret = LoadTileSet(mapFileXML);
    // ... TODO 5: LOG
    mapLoaded = ret;
    return ret;
}`, "cpp", "Map.cpp"))}

${todo("TODO 4", "Map.cpp → LoadTileSet()", `<p>Recorre <strong>todos</strong> los <code>&lt;tileset&gt;</code> (puede haber más de uno), crea un TileSet por cada uno, rellénalo y carga su imagen. Recuerda que <code>source</code> es relativo a la carpeta del mapa.</p>`,
      code(String.raw`
bool Map::LoadTileSet(pugi::xml_node mapFile)
{
    for (pugi::xml_node tilesetNode = mapFile.child("map").child("tileset");
         tilesetNode != NULL;
         tilesetNode = tilesetNode.next_sibling("tileset"))
    {
        TileSet* tileSet = new TileSet();
        tileSet->firstGid   = tilesetNode.attribute("firstgid").as_int();
        tileSet->name       = tilesetNode.attribute("name").as_string();
        tileSet->tileWidth  = tilesetNode.attribute("tilewidth").as_int();
        tileSet->tileHeight = tilesetNode.attribute("tileheight").as_int();
        tileSet->spacing    = tilesetNode.attribute("spacing").as_int();
        tileSet->margin     = tilesetNode.attribute("margin").as_int();
        tileSet->tileCount  = tilesetNode.attribute("tilecount").as_int();
        tileSet->columns    = tilesetNode.attribute("columns").as_int();

        std::string imgPath = mapPath + tilesetNode.child("image").attribute("source").as_string();
        tileSet->texture = Engine::GetInstance().textures->Load(imgPath.c_str());

        mapData.tilesets.push_back(tileSet);
    }
    return true;
}`, "cpp", "Map.cpp"))}

${todo("TODO 5", "Map.cpp", `<p>Haz LOG de todo lo leído. Con datos externos hay que ser extremadamente desconfiado.</p>`,
      code(String.raw`
LOG("Successfully parsed map XML file: %s", fileName.c_str());
LOG("width: %d height: %d", mapData.width, mapData.height);
LOG("tile_width: %d tile_height: %d", mapData.tileWidth, mapData.tileHeight);
for (const auto& ts : mapData.tilesets) {
    LOG("Tileset ----");
    LOG("name: %s firstgid: %d", ts->name.c_str(), ts->firstGid);
    LOG("tile width: %d tile height: %d", ts->tileWidth, ts->tileHeight);
    LOG("spacing: %d margin: %d", ts->spacing, ts->margin);
}`, "cpp", "Map.cpp"))}

${todo("TODO 6", "Map.cpp → Update()", `<p>Prueba de humo: dibuja la imagen de cada tileset en (0,0). Si la ves en pantalla, la carga funciona.</p>`,
      code(String.raw`
bool Map::Update(float dt)
{
    if (!mapLoaded) return true;
    for (const auto& tileset : mapData.tilesets)
        Engine::GetInstance().render->DrawTexture(tileset->texture, 0, 0);
    return true;
}

bool Map::CleanUp()
{
    for (auto& ts : mapData.tilesets) {
        Engine::GetInstance().textures->UnLoad(ts->texture);
        delete ts;                       // lo creamos con new -> lo borramos
    }
    mapData.tilesets.clear();
    return true;
}`, "cpp", "Map.cpp"))}

${nota(`<p>Tu <code>MapTemplate.tmx</code> tiene <strong>6 tilesets</strong> (firstgid 1, 49, 51, 99, 355 y 357) y un mapa de 109×59 tiles. Por eso es imprescindible que LoadTileSet recorra todos con <code>next_sibling("tileset")</code>: si solo leyeras el primero, la mitad del nivel no tendría gráficos.</p>`, "game")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "En <map width=\"50\" height=\"15\" tilewidth=\"32\">, ¿cuánto mide el mapa en píxeles de ancho?", o: ["50", "1600", "32"], c: 1, e: "width va en tiles: 50 · 32 = 1600 px." },
      { p: "¿Qué significa gid=\"0\" en una capa?", o: ["El primer tile del tileset", "Casilla vacía", "Error de carga"], c: 1, e: "Los gid empiezan en 1. El 0 se reserva para “nada”." },
      { p: "¿Qué parte del TMX puede ignorar tu motor?", o: ["<image>", "<wangsets>", "<data>"], c: 1, e: "Los terrenos solo ayudan a pintar en el editor." },
      { p: "¿Qué formato de capa debes elegir para el código del curso?", o: ["CSV", "Base64 (zlib)", "XML"], c: 2, e: "El código lee nodos <tile gid=…/>." },
      { p: "La ruta de <image source> es…", o: ["Absoluta", "Relativa a la carpeta del .tmx", "Relativa al .exe"], c: 1, e: "Por eso hacemos mapPath + source." }
    ])}
`,
    init(root) {
      const pre = root.querySelector("#tmx-pre"), exp = root.querySelector("#tmx-exp");
      pre.innerHTML = partes.map((p, i) => `<span data-i="${i}" style="display:block;cursor:pointer;border-radius:3px;padding:1px 4px">${esc(p.txt).replace(/([\w:-]+)=("[^"]*")/g, '<span class="t-attr">$1</span>=<span class="t-str">$2</span>')}</span>`).join("");
      const show = (i) => {
        pre.querySelectorAll("[data-i]").forEach((s) => (s.style.background = +s.dataset.i === i ? "rgba(126,149,255,.25)" : ""));
        exp.innerHTML = `<p style="margin-top:0"><strong>${esc(partes[i].txt.split("\n")[0].replace(/\s.*$/, "").replace(/^\s*/, ""))}</strong></p><p>${esc(partes[i].exp)}</p><p style="font-size:.85rem;color:var(--ink-2)">Se guarda en: <code>${esc(partes[i].st)}</code></p>`;
      };
      pre.querySelectorAll("[data-i]").forEach((s) => Curso.on(s, "click", () => show(+s.dataset.i)));
      show(1);
    }
  });
})();
