Curso.practica({
  leccion: "l05",
  titulo: "Escribe config.xml y léelo con pugixml",
  intro: "Primero escribirás tú el XML de la ventana. Después cargarás el archivo, leerás el título y los FPS, y repartirás a cada módulo su trozo de configuración.",
  pasos: [
    {
      t: "Escribe el nodo <window>",
      exp: `<p>Dentro de <code>&lt;config&gt;</code>, escribe un nodo <code>window</code> que contenga:</p><ul><li><code>resolution</code> con los atributos <code>width="1280"</code>, <code>height="720"</code> y <code>scale="1"</code></li><li><code>fullscreen</code> con <code>value="false"</code></li></ul><p>Recuerda: los nodos sin contenido se cierran con <code>/&gt;</code>.</p>`,
      escribe: {
        lang: "xml",
        antes: String.raw`<config>
  <engine> ... </engine>`,
        despues: "</config>",
        filas: 5,
        checks: [
          [/<window>/, "Abre el nodo con <code>&lt;window&gt;</code>."],
          [/<resolution[^>]*width="1280"/, "Falta <code>&lt;resolution</code> con <code>width=\"1280\"</code> (entre comillas)."],
          [/<resolution[^>]*height="720"/, "A resolution le falta <code>height=\"720\"</code>."],
          [/<resolution[^>]*scale="1"/, "A resolution le falta <code>scale=\"1\"</code>."],
          [/<resolution[^>]*\/>/, "<code>resolution</code> no tiene contenido: ciérralo con <code>/&gt;</code> al final."],
          [/<fullscreenvalue="false"\/>/, "Falta <code>&lt;fullscreen value=\"false\"/&gt;</code>."],
          [/<\/window>/, "Cierra el nodo con <code>&lt;/window&gt;</code>."]
        ],
        prohibido: [[/<Window>|<\/Window>/, "XML distingue mayúsculas y el módulo se llama <code>window</code> en minúscula. <code>child(\"window\")</code> no encontraría <code>&lt;Window&gt;</code>."], [/=1280|=720/, "Los valores de los atributos siempre van entre comillas: <code>width=\"1280\"</code>."]],
        sol: String.raw`  <window>
    <resolution width="1280" height="720" scale="1"/>
    <fullscreen value="false"/>
  </window>`
      },
      pistas: ["Estructura: <code>&lt;window&gt; … &lt;/window&gt;</code> con dos nodos dentro.", "<code>&lt;resolution width=\"1280\" height=\"720\" scale=\"1\"/&gt;</code>"],
      bien: "<p>El nombre <code>window</code> no es casual: coincide con el <code>name</code> del módulo Window. Así, en el paso 6, el Engine podrá darle su nodo automáticamente.</p>"
    },
    {
      t: "Cargar el archivo",
      exp: `<p><code>pugi::xml_document</code> tiene un método para leer un archivo del disco y construir el árbol. Devuelve un <code>xml_parse_result</code> que se puede usar en un <code>if</code> y que, si falla, describe el error.</p>`,
      code: String.raw`
bool Engine::LoadConfig()
{
    pugi::xml_parse_result result = configFile.§s1§("config.xml");
    if (result) {
        LOG("config.xml parsed without errors");
        return true;
    }
    LOG("Error loading config.xml: %s", result.§s2§);
    return false;
}`,
      slots: {
        s1: { ok: ["load_file"], err: [[/^load$/, "<code>load()</code> lee desde un stream. Para un archivo es <code>load_file</code>."], [/^LoadFile$/i, "pugixml usa minúsculas con guion bajo: <code>load_file</code>."]] },
        s2: { ok: ["description()"], err: [[/^description$/, "Es un método: faltan los paréntesis."]] }
      },
      pistas: ["“Cargar archivo” en estilo pugixml (minúsculas y guion bajo).", "El texto del error se obtiene con <code>result.description()</code>."],
      bien: "<p>El archivo se busca relativo a la carpeta desde la que se ejecuta el juego (en Visual Studio, la carpeta de trabajo del proyecto). Si dice “File was not found”, revisa eso antes que tu código.</p>"
    },
    {
      t: "Leer el título",
      exp: `<p>Navega por el árbol: <code>config</code> → <code>engine</code> → <code>title</code>, lee su atributo <code>value</code> y conviértelo a texto.</p>`,
      code: String.raw`    gameTitle = configFile.child("config").§s1§.child("title").attribute("value").§s2§;`,
      slots: {
        s1: { ok: ['child("engine")'], err: [[/^child\(engine\)$/, "El nombre va entre comillas: <code>child(\"engine\")</code>."], [/^child\("Engine"\)$/, "Mayúsculas: en el XML es <code>engine</code>."]], w: 18 },
        s2: { ok: ["as_string()"], err: [[/^as_int\(\)$/, "El título es texto, no un número."], [/^value\(\)$/, "<code>value()</code> también funciona, pero el patrón del curso es <code>as_string()</code>."]], w: 14 }
      },
      pistas: ["Bajar un nivel: <code>.child(\"nombre\")</code>.", "Convertir el atributo a texto: <code>.as_string()</code>."],
      bien: "<p>Si escribes mal un nombre, pugixml no peta: te da un nodo vacío y <code>as_string()</code> devuelve <code>\"\"</code>. Por eso hay que hacer LOG de lo leído.</p>"
    },
    {
      t: "Leer targetFrameRate (tú solo)",
      exp: `<p>Escribe la línea completa que lee <code>config/engine/targetFrameRate</code> (atributo <code>value</code>) como entero y lo guarda en <code>targetFrameRate</code>.</p>`,
      escribe: {
        filas: 2,
        checks: [
          [/targetFrameRate=/, "Asigna el resultado a la variable: <code>targetFrameRate = …;</code>"],
          [/child\("engine"\)/, "Tienes que pasar por <code>child(\"engine\")</code>."],
          [/child\("targetFrameRate"\)/, "El nodo se llama exactamente <code>targetFrameRate</code> (con esas mayúsculas)."],
          [/attribute\("value"\)/, "El número está en el atributo <code>value</code>."],
          [/\.as_(int|uint|float)\(\)/, "Convierte el atributo a número con <code>.as_int()</code>."]
        ],
        sol: String.raw`    targetFrameRate = configFile.child("config").child("engine").child("targetFrameRate").attribute("value").as_int();`
      },
      pistas: ["Es igual que la del título cambiando dos cosas.", "Cambia <code>\"title\"</code> por <code>\"targetFrameRate\"</code> y <code>as_string()</code> por <code>as_int()</code>."],
      bien: "<p>Ahora cambia el 60 del XML por 30, ejecuta, y el juego irá a 30 fps sin recompilar. Eso es serializar configuración.</p>"
    },
    {
      t: "Darle a cada módulo su nodo",
      exp: `<p>En <code>Module.h</code> ya tienes <code>LoadParameters(pugi::xml_node)</code>. En el bucle del Awake del Engine, pásale a cada módulo el hijo de <code>config</code> que tenga <em>su nombre</em>. El nombre es un <code>std::string</code>, pero pugixml quiere un <code>const char*</code>.</p>`,
      code: String.raw`for (const auto& module : moduleList) {
    module->LoadParameters(configFile.child("config").child(§s1§));
    result = module->Awake();
    if (!result) break;
}`,
      slots: { s1: { ok: ["module->name.c_str()"], err: [[/^module->name$/, "Casi: <code>name</code> es std::string; añade <code>.c_str()</code> para obtener un const char*."], [/^"window"$/, "Así todos los módulos recibirían el nodo de window. Usa el nombre de CADA módulo."], [/^module\.name/, "module es un puntero (shared_ptr): se accede con <code>-&gt;</code>."]], w: 22 } },
      pistas: ["Cada módulo tiene un atributo <code>name</code>.", "<code>module-&gt;name.c_str()</code>"],
      bien: "<p>Una línea y todos los módulos reciben su configuración. El de Window recibirá el nodo que escribiste en el paso 1.</p>"
    },
    {
      t: "Window lee su resolución",
      exp: `<p>Dentro de <code>Window::Awake()</code>, el atributo <code>configParameters</code> ya es el nodo <code>&lt;window&gt;</code>. Escribe las dos líneas que leen <code>width</code> y <code>height</code> del nodo <code>resolution</code>.</p>`,
      escribe: {
        antes: "bool Window::Awake()\n{",
        despues: "    ...\n}",
        filas: 3,
        checks: [
          [/width=configParameters\.child\("resolution"\)\.attribute\("width"\)\.as_int\(\);/, "Lee el ancho: <code>width = configParameters.child(\"resolution\").attribute(\"width\").as_int();</code>"],
          [/height=configParameters\.child\("resolution"\)\.attribute\("height"\)\.as_int\(\);/, "Lee el alto igual, cambiando el atributo a <code>\"height\"</code>."]
        ],
        prohibido: [[/configFile/, "Window no tiene acceso a configFile (es del Engine). Usa su <code>configParameters</code>."], [/child\("window"\)/, "configParameters YA es el nodo window; no hace falta volver a bajar."]],
        sol: String.raw`    width  = configParameters.child("resolution").attribute("width").as_int();
    height = configParameters.child("resolution").attribute("height").as_int();`
      },
      pistas: ["Empieza en <code>configParameters</code>, no en configFile.", "<code>configParameters.child(\"resolution\").attribute(\"width\").as_int()</code>"],
      bien: "<p>Haz lo mismo con fullscreen, borderless, etc. usando <code>.as_bool()</code>. Cambia el XML y la ventana cambiará sin recompilar.</p>"
    }
  ]
});
