(function () {
  const { code, nota, todo, quiz, demo } = Curso;

  // Mapa de ejemplo 14×7 (gids, firstgid = 1). 0 = vacío.
  const MW = 14, MH = 7;
  const MAPA = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 0, 0,
    0, 0, 0, 29, 0, 0, 0, 0, 0, 0, 10, 10, 10, 0,
    0, 0, 10, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 37, 0, 0, 0, 0, 0, 0,
    1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2,
    17, 18, 19, 17, 18, 19, 17, 18, 19, 17, 18, 19, 17, 18
  ];

  Curso.leccion({
    id: "l07", num: "07", grupo: "Bloque 3 · Mapas con Tiled", corto: "Dibujar el mapa", pdf: "L07_Tiled_TMX_Drawing",
    titulo: "Dibujar un mapa ortogonal desde el TMX",
    resumen: "Cargar capas, pasar de gid a rectángulo del tileset y de (columna, fila) a píxeles del mundo.",
    intro: "Ya tienes los tilesets cargados. Ahora toca leer las capas y, para cada casilla, responder dos preguntas: ¿qué trozo del tileset dibujo? y ¿dónde lo dibujo en el mundo? Con dos fórmulas tienes el mapa entero en pantalla.",
    objetivos: ["Guardar una capa en un std::vector<int> y leerla como matriz", "Calcular el SDL_Rect de un gid teniendo en cuenta margin y spacing", "Convertir coordenadas de mapa a mundo (MapToWorld)", "Escribir el bucle de dibujado de todas las capas"],
    html: () => `
<h2>La idea en cinco pasos</h2>
<ol>
<li>Recorre todas las capas y, en cada una, todas las casillas <code>(i, j)</code>.</li>
<li>Lee el <strong>gid</strong> de esa casilla. Si es 0, no hay nada que dibujar.</li>
<li>Encuentra en qué posición del tileset está ese gid (fila y columna).</li>
<li>Pasa esa posición a píxeles de la imagen del tileset: ese es el rectángulo <strong>src</strong>.</li>
<li>Calcula dónde va la casilla en el mundo y llama a <code>DrawTexture(textura, x, y, &amp;rect)</code>.</li>
</ol>

<h2>De gid a rectángulo del tileset</h2>
<p>En el tileset los tiles están numerados en una dimensión (0, 1, 2… de izquierda a derecha, fila a fila). El gid global empieza en <code>firstgid</code>, así que primero lo pasamos a índice local:</p>
${code(`local = gid - firstgid

fila (i)    = local / columns      // división ENTERA (floor)
columna (j) = local % columns      // resto

x = margin + j * (tilewidth  + spacing)
y = margin + i * (tileheight + spacing)
w = tilewidth
h = tileheight`, "txt", "La fórmula de GetRect")}

${demo("d-gid", "Calculadora de gid", "Haz clic en un tile o escribe un gid", `
<div class="split">
  <canvas id="gid-cv"></canvas>
  <div style="display:grid;gap:10px;align-content:start">
    <div class="controls">
      <label>gid <input type="number" id="gid" value="30" min="1" max="48" style="width:70px"></label>
      <label>firstgid <input type="number" id="fgid" value="1" min="1" style="width:70px"></label>
    </div>
    <pre class="log" id="gid-out" style="max-height:none"></pre>
  </div>
</div>`)}
<p>Prueba a poner <code>firstgid = 49</code>: es lo que pasaría si este tileset fuera el segundo del mapa. El mismo dibujo tendría gid 78 en vez de 30. Por eso nunca hay que asumir que firstgid es 1.</p>

<h2>De la capa a la pantalla</h2>
<p>Los tiles de una capa vienen en una lista plana de <code>width · height</code> números. Para leerla como matriz:</p>
${code(`índice = j * width + i      // i = columna (x), j = fila (y)`, "txt")}
<p>Y la posición en el mundo es simplemente la casilla por el tamaño del tile:</p>
${code(`mundoX = i * tileWidth
mundoY = j * tileHeight`, "txt", "MapToWorld")}

${demo("d-draw", "El bucle de dibujado, casilla a casilla", "Paso a paso o todo de golpe", `
<canvas id="draw-cv"></canvas>
<div class="controls">
  <button type="button" class="btn primary" id="dr-step">Siguiente casilla</button>
  <button type="button" class="btn" id="dr-skip">Saltar a la siguiente no vacía</button>
  <button type="button" class="btn" id="dr-all">Dibujar todo</button>
  <button type="button" class="btn" id="dr-reset">Reiniciar</button>
</div>
<pre class="log" id="draw-out"></pre>`)}

<h2>Los TODOs del handout</h2>
${todo("TODO 1 y 2", "Map.h", `<p>Crea el struct <code>MapLayer</code> (id, name, width, height y los tiles en un <code>std::vector&lt;int&gt;</code>) y añade una lista de capas a <code>MapData</code>. Libera todo en CleanUp.</p>`,
      code(String.raw`
struct MapLayer
{
    int id;
    std::string name;
    int width, height;
    std::vector<int> tiles;

    // TODO 6: gid de la casilla (i = columna, j = fila)
    unsigned int Get(int i, int j) const
    {
        return tiles[(j * width) + i];
    }
};

struct MapData
{
    int width, height, tileWidth, tileHeight;
    std::list<TileSet*>  tilesets;
    std::list<MapLayer*> layers;     // TODO 2
};

// En Map::CleanUp()
for (auto& layer : mapData.layers) delete layer;
mapData.layers.clear();`, "cpp", "Map.h"))}

${todo("TODO 3 y 4", "Map.cpp → Load() y LoadLayer()", `<p>Itera todos los <code>&lt;layer&gt;</code> del TMX. Para cada uno, lee la cabecera y luego todos sus <code>&lt;tile gid&gt;</code>.</p>`,
      code(String.raw`
// En Load(), después de LoadTileSet
for (pugi::xml_node layerNode = mapFileXML.child("map").child("layer");
     layerNode != NULL;
     layerNode = layerNode.next_sibling("layer"))
{
    MapLayer* mapLayer = new MapLayer();
    LoadLayer(layerNode, mapLayer);
    mapData.layers.push_back(mapLayer);
}

bool Map::LoadLayer(pugi::xml_node& node, MapLayer* layer)
{
    layer->id     = node.attribute("id").as_int();
    layer->name   = node.attribute("name").as_string();
    layer->width  = node.attribute("width").as_int();
    layer->height = node.attribute("height").as_int();

    for (pugi::xml_node tileNode = node.child("data").child("tile");
         tileNode != NULL;
         tileNode = tileNode.next_sibling("tile"))
    {
        layer->tiles.push_back(tileNode.attribute("gid").as_int());
    }
    LOG("Layer %s loaded: %d tiles", layer->name.c_str(), (int)layer->tiles.size());
    return true;
}`, "cpp", "Map.cpp"))}

${nota(`<p>Si <code>tiles.size()</code> sale 0, casi seguro que la capa está en CSV o Base64: en Tiled ve a Mapa → Propiedades del mapa → Tile Layer Format → XML, y vuelve a guardar.</p>`, "warn")}

${todo("TODO 7", "Map.h → TileSet::GetRect(gid)", `<p>Devuelve el rectángulo del tileset para un gid, teniendo en cuenta firstgid, margin y spacing.</p>`,
      code(String.raw`
SDL_Rect GetRect(unsigned int gid) const
{
    SDL_Rect rect = { 0 };
    int relativeIndex = gid - firstGid;

    rect.w = tileWidth;
    rect.h = tileHeight;
    rect.x = margin + (tileWidth  + spacing) * (relativeIndex % columns);
    rect.y = margin + (tileHeight + spacing) * (relativeIndex / columns);
    return rect;
}`, "cpp", "Map.h (dentro de struct TileSet)"))}

${todo("TODO 8", "Map.cpp → MapToWorld()", `<p>Convierte coordenadas de mapa (casillas) a mundo (píxeles).</p>`,
      code(String.raw`
Vector2D Map::MapToWorld(int i, int j) const
{
    return Vector2D((float)(i * mapData.tileWidth), (float)(j * mapData.tileHeight));
}`, "cpp", "Map.cpp"))}

${todo("TODO 5 y 9", "Map.cpp → Update()", `<p>Bucle completo: capas → filas → columnas, saltando gid 0, y dibujar.</p>`,
      code(String.raw`
bool Map::Update(float dt)
{
    if (!mapLoaded) return true;

    for (const auto& mapLayer : mapData.layers)
    {
        for (int j = 0; j < mapData.height; j++)          // filas
        {
            for (int i = 0; i < mapData.width; i++)       // columnas
            {
                int gid = mapLayer->Get(i, j);
                if (gid == 0) continue;                    // casilla vacía

                TileSet* tileSet = mapData.tilesets.front();   // L09: GetTilesetFromTileId(gid)
                SDL_Rect tileRect = tileSet->GetRect(gid);
                Vector2D pos = MapToWorld(i, j);

                Engine::GetInstance().render->DrawTexture(tileSet->texture,
                                                          (int)pos.getX(), (int)pos.getY(),
                                                          &tileRect);
            }
        }
    }
    return true;
}`, "cpp", "Map.cpp"))}

${nota(`<p>Recorrer <em>todas</em> las casillas cada frame es caro en mapas grandes (tu mapa tiene 109·59 = 6431 casillas por capa). Una optimización muy común: calcular qué casillas caen dentro de la cámara y recorrer solo esas (<em>culling</em>, como se vio en la L02).</p>`, "", "Para nota")}

<h2>Siguientes pasos</h2>
<ul>
<li>Carga los TMX ortogonales de la carpeta de ejemplos de Tiled (no los isométricos).</li>
<li>Busca tilesets en <a href="https://opengameart.org/content/tilesets-5" target="_blank" rel="noopener">OpenGameArt</a> o itch.io y empieza a diseñar el mapa de tu juego.</li>
</ul>

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "Tileset de 8 columnas, firstgid 1, gid 30. ¿Fila y columna?", o: ["fila 3, col 5", "fila 3, col 6", "fila 4, col 6"], c: 0, e: "local = 29 → 29 / 8 = 3, 29 % 8 = 5." },
      { p: "Con margin 1, spacing 1 y tiles de 32, ¿x de la columna 5?", o: ["160", "166", "165"], c: 1, e: "1 + 5 · 33 = 166." },
      { p: "Capa de 50 de ancho. ¿Índice del vector para la casilla (i=3, j=2)?", o: ["103", "53", "152"], c: 0, e: "2 · 50 + 3 = 103." },
      { p: "¿Por qué se comprueba gid == 0?", o: ["Para no dividir por cero", "Porque es una casilla vacía y no hay nada que dibujar", "Porque es el tile 0 del tileset"], c: 1, e: "Además, con gid 0 GetRect calcularía un índice negativo." }
    ])}
`,
    init(root) {
      const ts = Curso.tilesetDemo({ labels: true });
      // ----- calculadora -----
      const cv = root.querySelector("#gid-cv"), SC = 1.2, ctx = Curso.canvas(cv, Math.round(ts.W * SC), Math.round(ts.H * SC));
      const gidIn = root.querySelector("#gid"), fIn = root.querySelector("#fgid"), out = root.querySelector("#gid-out");
      function calc() {
        const f = +fIn.value || 1; gidIn.min = f; gidIn.max = f + ts.count - 1;
        let g = +gidIn.value; if (g < f || g > f + ts.count - 1) { g = Math.max(f, Math.min(f + ts.count - 1, g)); }
        const local = g - f, i = Math.floor(local / ts.cols), j = local % ts.cols;
        const x = ts.margin + j * (ts.tw + ts.spacing), y = ts.margin + i * (ts.th + ts.spacing);
        ctx.clearRect(0, 0, ctx.W, ctx.H);
        ctx.drawImage(ts.canvas, 0, 0, ts.W * SC, ts.H * SC);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.strokeRect(x * SC, y * SC, ts.tw * SC, ts.th * SC);
        ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.strokeRect(x * SC - 2, y * SC - 2, ts.tw * SC + 4, ts.th * SC + 4);
        out.textContent =
`gid      = ${g}
local    = gid - firstgid = ${g} - ${f} = ${local}
fila i   = ${local} / ${ts.cols} = ${i}
col  j   = ${local} % ${ts.cols} = ${j}

rect.x = margin + j·(tw+spacing) = ${ts.margin} + ${j}·${ts.tw + ts.spacing} = ${x}
rect.y = margin + i·(th+spacing) = ${ts.margin} + ${i}·${ts.th + ts.spacing} = ${y}
rect.w = ${ts.tw}   rect.h = ${ts.th}

SDL_Rect { ${x}, ${y}, ${ts.tw}, ${ts.th} }`;
      }
      Curso.on(gidIn, "input", calc); Curso.on(fIn, "input", calc);
      Curso.on(cv, "click", (e) => {
        const p = Curso.puntero(cv, e, ctx.W, ctx.H);
        const j = Math.floor((p.x / SC - ts.margin) / (ts.tw + ts.spacing)), i = Math.floor((p.y / SC - ts.margin) / (ts.th + ts.spacing));
        if (j >= 0 && j < ts.cols && i >= 0 && i < ts.rows) { gidIn.value = (+fIn.value || 1) + i * ts.cols + j; calc(); }
      });
      calc();

      // ----- dibujado paso a paso -----
      const TS = 40, dv = root.querySelector("#draw-cv"), dx = Curso.canvas(dv, MW * TS, MH * TS + 1);
      const dOut = root.querySelector("#draw-out");
      let k = 0; // índice siguiente casilla
      function drawMap() {
        dx.clearRect(0, 0, dx.W, dx.H);
        dx.strokeStyle = Curso.color("line");
        for (let n = 0; n < MW * MH; n++) {
          const i = n % MW, j = Math.floor(n / MW), g = MAPA[n];
          if (n < k && g) {
            const l = g - 1, r = { x: ts.margin + (l % ts.cols) * (ts.tw + ts.spacing), y: ts.margin + Math.floor(l / ts.cols) * (ts.th + ts.spacing) };
            dx.drawImage(ts.canvas, r.x, r.y, ts.tw, ts.th, i * TS, j * TS, TS, TS);
          }
          dx.strokeRect(i * TS + .5, j * TS + .5, TS, TS);
        }
        if (k > 0 && k <= MW * MH) {
          const n = k - 1, i = n % MW, j = Math.floor(n / MW);
          dx.strokeStyle = Curso.color("amber"); dx.lineWidth = 3; dx.strokeRect(i * TS + 1.5, j * TS + 1.5, TS - 3, TS - 3); dx.lineWidth = 1;
          const g = MAPA[n];
          if (g) {
            const l = g - 1, rx = ts.margin + (l % ts.cols) * (ts.tw + ts.spacing), ry = ts.margin + Math.floor(l / ts.cols) * (ts.th + ts.spacing);
            dOut.textContent = `capa 0 · casilla (i=${i}, j=${j})  índice = j*width+i = ${j}*${MW}+${i} = ${n}
gid = ${g}  -> GetRect(${g}) = { ${rx}, ${ry}, 32, 32 }
MapToWorld(${i}, ${j}) = (${i * 32}, ${j * 32})   (en la demo cada tile se ve a ${TS}px)
DrawTexture(tileset, ${i * 32}, ${j * 32}, &rect)`;
          } else dOut.textContent = `capa 0 · casilla (i=${i}, j=${j})  índice ${n}\ngid = 0 -> casilla vacía: continue;`;
        } else if (k > MW * MH) dOut.textContent = "Mapa completo. En el juego real, esto se repite en cada frame y para cada capa.";
        else dOut.textContent = "Pulsa “Siguiente casilla”. El bucle va fila a fila (j) y dentro columna a columna (i).";
      }
      Curso.on(root.querySelector("#dr-step"), "click", () => { k = Math.min(k + 1, MW * MH + 1); drawMap(); });
      Curso.on(root.querySelector("#dr-skip"), "click", () => { do { k++; } while (k <= MW * MH && !MAPA[k - 1]); k = Math.min(k, MW * MH + 1); drawMap(); });
      Curso.on(root.querySelector("#dr-all"), "click", () => { k = MW * MH + 1; drawMap(); });
      Curso.on(root.querySelector("#dr-reset"), "click", () => { k = 0; drawMap(); });
      drawMap();
    }
  });
})();
