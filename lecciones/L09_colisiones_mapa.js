(function () {
  const { code, nota, todo, quiz, demo } = Curso;
  const MW = 20, MH = 10, T = 32;

  Curso.leccion({
    id: "l09", num: "09", grupo: "Bloque 4 · Físicas y colisiones", corto: "Colisiones del mapa", pdf: "L09_Map_Collisions",
    titulo: "Colisiones desde el mapa: metadatos y propiedades",
    resumen: "Varios tilesets, propiedades personalizadas de Tiled y colliders generados desde una capa o un object layer.",
    intro: "Crear colliders a mano con coordenadas no escala. La idea de hoy: pintar en Tiled una capa invisible de “metadatos” (dónde se choca, dónde se muere, dónde aparece el jugador) y que el motor construya todo eso al cargar el mapa.",
    objetivos: ["Elegir el tileset correcto para cada gid (GetTilesetFromTileId)", "Crear y leer propiedades personalizadas (Draw, Collision)", "Generar colliders de Box2D desde una capa de tiles", "Usar object layers para colliders y puntos de spawn"],
    html: () => `
<h2>Metadatos del mapa</h2>
<p>Son datos que no se ven pero dan significado al mapa: ¿este tile bloquea?, ¿hace daño?, ¿ralentiza (agua, arena)?, ¿aquí empieza el jugador?, ¿aquí acaba el nivel? En Tiled cada capa puede ser gráfica o de metadatos. Para colisiones haremos:</p>
<ol>
<li>Una nueva capa de tiles llamada <strong>Collisions</strong>.</li>
<li>Un tileset nuevo con <code>MapMetadata.png</code> (32×32, margin y spacing 1): un tile rojo = bloqueado.</li>
<li>Pintar en rojo encima de los ladrillos.</li>
</ol>
<p>Como <code>MapMetadata</code> es el <strong>segundo</strong> tileset, su firstgid ya no es 1 (en el handout es 49: el desierto tiene 48 tiles). Ahora tu motor tiene que saber a qué tileset pertenece cada gid.</p>

${todo("TODO 2", "Map.cpp → GetTilesetFromTileId(gid)", `<p>Devuelve el tileset que contiene un gid: aquel en que <code>firstGid ≤ gid &lt; firstGid + tileCount</code>.</p>`,
      code(String.raw`
TileSet* Map::GetTilesetFromTileId(int gid) const
{
    TileSet* set = nullptr;
    for (const auto& tileset : mapData.tilesets) {
        if (gid >= tileset->firstGid && gid < tileset->firstGid + tileset->tileCount) {
            set = tileset;
            break;
        }
    }
    return set;
}`, "cpp", "Map.cpp"))}

${todo("TODO 3", "Map.cpp → Update()", `<p>Usa la función en el bucle de dibujado en lugar de <code>tilesets.front()</code>. No la llames con gid 0. Observa que, si cambias el orden de las capas en Tiled, cambia el orden de dibujado.</p>`,
      code(String.raw`
int gid = mapLayer->Get(i, j);
if (gid == 0) continue;
TileSet* tileSet = GetTilesetFromTileId(gid);
if (tileSet == nullptr) continue;
SDL_Rect tileRect = tileSet->GetRect(gid);`, "cpp", "Map.cpp"))}

<h2>Propiedades personalizadas</h2>
<p>Ahora se dibuja también la capa roja. ¿Cómo sabe el motor que no debe dibujarla? Con una <strong>propiedad personalizada</strong>: en Tiled, selecciona la capa → panel Propiedades → <em>+</em> → nombre <code>Draw</code>, tipo <code>bool</code>. Mapa, capas, tilesets, tiles y terrenos pueden tener propiedades. Al guardar aparecen así:</p>
${code(`<layer id="6" name="Collisions" width="109" height="59">
  <properties>
    <property name="Collision" type="bool" value="true"/>
    <property name="Draw" type="bool" value="false"/>
  </properties>
  <data> ... </data>
</layer>`, "xml", "Tu MapTemplate.tmx")}

${demo("d-col", "Editor de la capa Collisions", "Pinta con clic/arrastre sobre el mapa", `
<canvas id="col-cv"></canvas>
<div class="controls">
  <label><input type="checkbox" id="draw-map" checked> Map · Draw</label>
  <label><input type="checkbox" id="draw-col" checked> Collisions · Draw</label>
  <label>Generar colliders <select id="col-mode"><option value="tile">uno por tile</option><option value="row">fusionando filas</option></select></label>
  <label><input type="checkbox" id="show-bodies" checked> Ver cuerpos Box2D</label>
  <button type="button" class="btn" id="col-clear">Vaciar capa</button>
</div>
<div class="readout" id="col-out"></div>
<div class="code" style="margin:0"><div class="code-head"><span>Así lo guardaría Tiled</span></div><pre id="col-xml"></pre></div>`)}
<p>Quita “Draw” de Collisions y verás el mapa como el jugador. Cambia a “fusionando filas” y fíjate cuántos cuerpos te ahorras: menos cuerpos = Box2D más rápido y sin el famoso “enganche” al caminar entre dos cajas pegadas.</p>

${todo("TODO 5", "Map.h → Properties", `<p>Crea una estructura genérica para guardar propiedades. Una capa puede tener varias.</p>`,
      code(String.raw`
struct Properties
{
    struct Property
    {
        std::string name;
        bool value;          // de momento solo usamos bool
    };

    std::list<Property*> propertyList;

    ~Properties()
    {
        for (const auto& property : propertyList) delete property;
        propertyList.clear();
    }

    // TODO 7: buscar una propiedad por nombre
    Property* GetProperty(const char* name);
};

struct MapLayer
{
    ...
    Properties properties;   // cada capa tiene sus propiedades
};`, "cpp", "Map.h"))}

${todo("TODO 6", "Map.cpp → LoadProperties()", `<p>Lee todos los <code>&lt;property&gt;</code> de un nodo. Llámalo desde <code>LoadLayer</code>.</p>`,
      code(String.raw`
bool Map::LoadProperties(pugi::xml_node& node, Properties& properties)
{
    for (pugi::xml_node propertieNode = node.child("properties").child("property");
         propertieNode;
         propertieNode = propertieNode.next_sibling("property"))
    {
        Properties::Property* p = new Properties::Property();
        p->name  = propertieNode.attribute("name").as_string();
        p->value = propertieNode.attribute("value").as_bool();
        properties.propertyList.push_back(p);
    }
    return true;
}

// En LoadLayer(), tras leer la cabecera:
LoadProperties(node, layer->properties);`, "cpp", "Map.cpp"))}

${todo("TODO 7", "Map.cpp", `<p>Implementa <code>GetProperty</code> y úsalo para dibujar solo las capas con <code>Draw = true</code>.</p>`,
      code(String.raw`
Properties::Property* Properties::GetProperty(const char* name)
{
    for (const auto& property : propertyList)
        if (property->name == name) return property;
    return nullptr;
}

// En Map::Update(), al principio del bucle de capas
for (const auto& mapLayer : mapData.layers)
{
    Properties::Property* draw = mapLayer->properties.GetProperty("Draw");
    if (draw == nullptr || !draw->value) continue;      // no se dibuja
    ...
}`, "cpp", "Map.cpp"))}

${nota(`<p>Fíjate en <code>draw == nullptr</code>: si una capa no tiene la propiedad, <code>draw-&gt;value</code> sería acceder a un puntero nulo → crash. Decide qué hacer por defecto (aquí: no dibujar) y añade la propiedad a <em>todas</em> las capas en Tiled.</p>`, "warn")}

${todo("TODO 8", "Map.cpp → Load()", `<p>Sustituye los colliders a mano de la L08: añade a la capa la propiedad <code>Collision = true</code>, recórrela y crea un rectángulo estático por cada tile no vacío.</p>`,
      code(String.raw`
// En Map::Load(), después de cargar las capas
for (const auto& mapLayer : mapData.layers)
{
    Properties::Property* col = mapLayer->properties.GetProperty("Collision");
    if (col == nullptr || !col->value) continue;

    for (int j = 0; j < mapData.height; j++) {
        for (int i = 0; i < mapData.width; i++) {
            int gid = mapLayer->Get(i, j);
            if (gid == 0) continue;               // o: if (gid == 49) si solo el rojo bloquea

            Vector2D pos = MapToWorld(i, j);
            // CreateRectangle recibe el CENTRO
            PhysBody* c = Engine::GetInstance().physics->CreateRectangle(
                (int)pos.getX() + mapData.tileWidth / 2,
                (int)pos.getY() + mapData.tileHeight / 2,
                mapData.tileWidth, mapData.tileHeight, STATIC);
            c->ctype = ColliderType::PLATFORM;
        }
    }
}`, "cpp", "Map.cpp"))}

<h2>Deberes: object layers (más eficiente)</h2>
<p>En lugar de pintar tiles, crea en Tiled una <strong>capa de objetos</strong> y dibuja rectángulos encima de las zonas sólidas. Un solo rectángulo puede cubrir una plataforma entera. Además los objetos pueden tener nombre, tipo y propiedades, así que sirven para todo: zonas de muerte, puntos de aparición, meta, triggers…</p>
${code(`<objectgroup id="9" name="Spawn">
  <object id="15" name="Player" x="192" y="1622.67" width="32" height="32"/>
</objectgroup>
<objectgroup id="10" name="Colliders">
  <object id="20" type="platform" x="224" y="543" width="256" height="64"/>
  <object id="21" type="death"    x="900" y="1800" width="320" height="40"/>
</objectgroup>`, "xml", "Object layers")}
${code(String.raw`
for (pugi::xml_node group = mapFileXML.child("map").child("objectgroup"); group; group = group.next_sibling("objectgroup"))
{
    std::string groupName = group.attribute("name").as_string();

    for (pugi::xml_node obj = group.child("object"); obj; obj = obj.next_sibling("object"))
    {
        float x = obj.attribute("x").as_float();          // Tiled: esquina SUPERIOR IZQUIERDA
        float y = obj.attribute("y").as_float();
        float w = obj.attribute("width").as_float();
        float h = obj.attribute("height").as_float();
        std::string type = obj.attribute("type").as_string();   // en Tiled 1.9+ puede llamarse "class"

        if (groupName == "Spawn") {
            playerSpawn = Vector2D(x, y);                 // la Scene lo usará para colocar al jugador
            continue;
        }

        PhysBody* body = nullptr;
        if (type == "death")
            body = Engine::GetInstance().physics->CreateRectangleSensor((int)(x + w / 2), (int)(y + h / 2), (int)w, (int)h, STATIC);
        else
            body = Engine::GetInstance().physics->CreateRectangle((int)(x + w / 2), (int)(y + h / 2), (int)w, (int)h, STATIC);

        body->ctype = (type == "death") ? ColliderType::DEATH : ColliderType::PLATFORM;
    }
}`, "cpp", "Map.cpp → cargar object layers")}

${nota(`<p>Tu mapa usa ambas técnicas: la capa de tiles <code>Collisions</code> (con <code>Collision=true</code> y <code>Draw=false</code>) para plataformas, pinchos y fosos, y el object layer <code>Spawn</code> con el punto de aparición del caballero (x=192, y≈1622). Para distinguir pinchos y fosos con tiles puedes usar gids distintos del tileset de metadatos (por eso tienes <code>MapMetadataExtra</code> con firstgid 355).</p>`, "game")}

<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "Tilesets con firstgid 1 (48 tiles) y 49 (2 tiles). ¿A cuál pertenece el gid 50?", o: ["Al primero", "Al segundo", "A ninguno"], c: 1, e: "49 ≤ 50 < 49 + 2." },
      { p: "¿Qué ventaja tiene un object layer frente a una capa de tiles para colisiones?", o: ["Se ve más bonito", "Un rectángulo cubre una zona entera: muchos menos cuerpos", "Box2D no admite tiles"], c: 1, e: "Menos cuerpos y sin costuras entre cajas." },
      { p: "Si una capa no tiene la propiedad Draw y haces GetProperty(\"Draw\")->value…", o: ["Devuelve false", "Crash por puntero nulo", "Devuelve true"], c: 1, e: "Comprueba siempre nullptr." },
      { p: "Las coordenadas x,y de un objeto rectangular de Tiled son…", o: ["Su centro", "Su esquina superior izquierda", "Su esquina inferior izquierda"], c: 1, e: "Para CreateRectangle (que usa el centro) suma w/2 y h/2." }
    ])}
`,
    init(root) {
      const cv = root.querySelector("#col-cv"), ctx = Curso.canvas(cv, MW * T, MH * T);
      const ts = Curso.tilesetDemo();
      const dm = root.querySelector("#draw-map"), dc = root.querySelector("#draw-col"), mode = root.querySelector("#col-mode"), sb = root.querySelector("#show-bodies");
      const out = root.querySelector("#col-out"), xmlEl = root.querySelector("#col-xml");
      // capa gráfica
      const mapL = new Array(MW * MH).fill(0), colL = new Array(MW * MH).fill(0);
      const put = (i, j, g) => (mapL[j * MW + i] = g);
      for (let i = 0; i < MW; i++) { put(i, 8, 9 + (i % 3)); put(i, 9, 17 + (i % 3)); }
      for (let i = 3; i < 7; i++) put(i, 5, 10);
      for (let i = 10; i < 14; i++) put(i, 3, 11);
      for (let i = 15; i < 18; i++) put(i, 6, 12);
      put(8, 7, 29); put(17, 5, 30);
      mapL.forEach((g, n) => { const j = Math.floor(n / MW); if (g && g < 25 && j !== 9) colL[n] = 49; });
      const FIRST_META = 49;

      function colliders() {
        const r = [];
        if (mode.value === "tile") { colL.forEach((g, n) => { if (g) r.push({ x: (n % MW) * T, y: Math.floor(n / MW) * T, w: T, h: T }); }); }
        else {
          for (let j = 0; j < MH; j++) { let start = -1; for (let i = 0; i <= MW; i++) { const g = i < MW ? colL[j * MW + i] : 0; if (g && start < 0) start = i; if (!g && start >= 0) { r.push({ x: start * T, y: j * T, w: (i - start) * T, h: T }); start = -1; } } }
        }
        return r;
      }
      function draw() {
        ctx.clearRect(0, 0, ctx.W, ctx.H);
        ctx.strokeStyle = Curso.color("line");
        for (let i = 0; i <= MW; i++) { ctx.beginPath(); ctx.moveTo(i * T + .5, 0); ctx.lineTo(i * T + .5, ctx.H); ctx.stroke(); }
        for (let j = 0; j <= MH; j++) { ctx.beginPath(); ctx.moveTo(0, j * T + .5); ctx.lineTo(ctx.W, j * T + .5); ctx.stroke(); }
        if (dm.checked) mapL.forEach((g, n) => { if (!g) return; const l = g - 1; ctx.drawImage(ts.canvas, ts.margin + (l % 8) * 33, ts.margin + Math.floor(l / 8) * 33, 32, 32, (n % MW) * T, Math.floor(n / MW) * T, T, T); });
        if (dc.checked) { ctx.fillStyle = "rgba(230, 40, 40, .55)"; colL.forEach((g, n) => { if (g) ctx.fillRect((n % MW) * T, Math.floor(n / MW) * T, T, T); }); }
        const cs = colliders();
        if (sb.checked) { ctx.strokeStyle = Curso.color("ok"); ctx.lineWidth = 2; cs.forEach((c) => ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4)); ctx.lineWidth = 1; }
        const nTiles = colL.filter(Boolean).length;
        out.innerHTML = `<span>tiles en Collisions <b>${nTiles}</b></span><span>CreateRectangle() llamadas <b>${cs.length}</b></span>`;
        const rows = []; for (let j = 0; j < MH; j++) rows.push("     " + colL.slice(j * MW, j * MW + MW).map((g) => String(g).padStart(2)).join(","));
        xmlEl.innerHTML = Curso.hlXml(`<tileset firstgid="1"  name="Desert" ... tilecount="48"/>
<tileset firstgid="${FIRST_META}" name="MapMetadata" ... tilecount="2"/>
<layer name="Map">
  <properties><property name="Draw" type="bool" value="${dm.checked}"/></properties> ...
</layer>
<layer name="Collisions">
  <properties>
    <property name="Collision" type="bool" value="true"/>
    <property name="Draw" type="bool" value="${dc.checked}"/>
  </properties>
  <data>  (gids, vista CSV para que quepa)
${rows.join("\n")}
  </data>
</layer>`);
      }
      let painting = null;
      const cell = (e) => { const p = Curso.puntero(cv, e, ctx.W, ctx.H); return { i: Math.floor(p.x / T), j: Math.floor(p.y / T) }; };
      Curso.on(cv, "pointerdown", (e) => { const c = cell(e); if (c.i < 0 || c.j < 0 || c.i >= MW || c.j >= MH) return; const n = c.j * MW + c.i; painting = colL[n] ? 0 : FIRST_META; colL[n] = painting; cv.setPointerCapture(e.pointerId); draw(); });
      Curso.on(cv, "pointermove", (e) => { if (painting === null) return; const c = cell(e); if (c.i < 0 || c.j < 0 || c.i >= MW || c.j >= MH) return; colL[c.j * MW + c.i] = painting; draw(); });
      Curso.on(cv, "pointerup", () => (painting = null));
      [dm, dc, mode, sb].forEach((x) => Curso.on(x, "change", draw));
      Curso.on(root.querySelector("#col-clear"), "click", () => { colL.fill(0); draw(); });
      draw();
    }
  });
})();
