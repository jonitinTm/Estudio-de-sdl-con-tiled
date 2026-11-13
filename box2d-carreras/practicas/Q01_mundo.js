Curso.practica({
  leccion: "b01",
  titulo: "Monta ModulePhysics desde cero",
  intro: "Escribirás el arranque del mundo, el paso de simulación, las macros de conversión, la creación de un círculo completo y la limpieza. Es el esqueleto de ModulePhysics.cpp.",
  pasos: [
    {
      t: "Crear el mundo",
      exp: `<p>En <code>ModulePhysics::Start()</code> se crea el <code>b2World</code> con la gravedad. Recuerda el comentario del handout: la Y de pantalla crece hacia abajo y el mundo recibe <strong>menos</strong> <code>GRAVITY_Y</code>.</p>`,
      code: String.raw`
bool ModulePhysics::Start()
{
    world = new b2World(b2Vec2(§s1§, §s2§));`,
      slots: {
        s1: { ok: ["GRAVITY_X"], err: [[/^0(\.0*)?f?$/, "Funciona, pero usa la macro GRAVITY_X: así la cambias en un solo sitio."]] },
        s2: { ok: ["-GRAVITY_Y"], err: [[/^GRAVITY_Y$/, "Falta el signo: el mundo recibe <code>-GRAVITY_Y</code> (lee el comentario de ModulePhysics.h)."]] }
      },
      pistas: ["Las dos macros están en ModulePhysics.h.", "La segunda lleva un signo menos delante."],
      bien: "<p>Y sin <code>b2World* world = …</code>: asignas al miembro. Declarar otra variable local dejaría el miembro a NULL.</p>"
    },
    {
      t: "Listener y cuerpo ground",
      exp: `<p>Dos cosas más en Start: decirle al mundo que este módulo escucha los contactos (lección 03) y crear un cuerpo estático vacío, <code>ground</code>, para anclar joints (lección 04).</p>`,
      code: String.raw`
    world->§s1§(this);

    b2BodyDef bd;
    ground = world->§s2§(&bd);
    return true;
}`,
      slots: { s1: { ok: ["SetContactListener"] }, s2: { ok: ["CreateBody"], err: [[/^new/, "En Box2D nunca se hace new de un body: se pide al mundo con CreateBody."]] } },
      pistas: ["Set + Contact + Listener.", "El mundo es la fábrica de cuerpos."],
      bien: "<p>Una <code>b2BodyDef</code> sin tocar crea un cuerpo <strong>estático</strong> en (0, 0): perfecto como ancla.</p>"
    },
    {
      t: "El paso de simulación",
      exp: `<p>En <code>PreUpdate</code>, avanza el mundo con el paso fijo y las iteraciones recomendadas (8 de velocidad, 3 de posición).</p>`,
      code: String.raw`
update_status ModulePhysics::PreUpdate()
{
    world->Step(§s1§, 8, 3);
    return UPDATE_CONTINUE;
}`,
      slots: { s1: { ok: ["PHYSICS_DT", "1.0f/60.0f", "1/60.0f"], err: [[/^GetFrameTime\(\)$/, "Con el tiempo real del frame la simulación cambia según los fps. Box2D quiere un paso FIJO: PHYSICS_DT."], [/^1\/60$/, "¡1/60 entre enteros da 0! Usa PHYSICS_DT (o 1.0f / 60.0f)."]], w: 12 } },
      pistas: ["Es una macro de ModulePhysics.h que vale 1/60 s."],
      bien: "<p>Va en PreUpdate para que ModuleGame, en su Update, ya lea las posiciones de este frame.</p>"
    },
    {
      t: "Las macros de conversión",
      exp: `<p>Completa las dos macros con las constantes de escala.</p>`,
      code: String.raw`
#define PIXELS_PER_METER 50.0f
#define METER_PER_PIXEL 0.02f

#define METERS_TO_PIXELS(m) ((int) floor(§s1§ * (m)))
#define PIXEL_TO_METERS(p)  ((float) §s2§ * (p))`,
      slots: {
        s1: { ok: ["PIXELS_PER_METER"], err: [[/^METER_PER_PIXEL$/, "Al revés: de metros a píxeles se MULTIPLICA por píxeles por metro (50)."]], w: 18 },
        s2: { ok: ["METER_PER_PIXEL"], err: [[/^PIXELS_PER_METER$/, "De píxeles a metros se multiplica por 0,02 (metros por píxel)."]], w: 18 }
      },
      pistas: ["2 m × 50 px/m = 100 px.", "100 px × 0,02 m/px = 2 m."],
      bien: "<p>¿Por qué <code>(m)</code> entre paréntesis? Porque es una macro: con <code>METERS_TO_PIXELS(a + b)</code> sin paréntesis saldría <code>50 * a + b</code>.</p>"
    },
    {
      t: "CreateCircle (1): el body",
      exp: `<p>Escribe las líneas que crean el cuerpo: una <code>b2BodyDef</code> llamada <code>body</code>, de tipo dinámico, en la posición (x, y) convertida a metros, y créalo con el mundo en <code>b2Body* b</code>.</p>`,
      escribe: {
        antes: String.raw`PhysBody* ModulePhysics::CreateCircle(int x, int y, int radius, float density)
{
    PhysBody* pbody = new PhysBody();`,
        filas: 6,
        checks: [
          [/b2BodyDefbody;/, "Declara la definición: <code>b2BodyDef body;</code>"],
          [/body\.type=b2_dynamicBody;/, "Tipo dinámico: <code>body.type = b2_dynamicBody;</code>"],
          [/body\.position\.Set\(PIXEL_TO_METERS\(x\),PIXEL_TO_METERS\(y\)\);/, "Posición en METROS: <code>body.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));</code>"],
          [/b2Body\*b=world->CreateBody\(&body\);/, "Créalo: <code>b2Body* b = world-&gt;CreateBody(&amp;body);</code>"]
        ],
        prohibido: [[/position\.Set\(x,y\)/, "¡Píxeles directos! Box2D pensaría que la pelota está a cientos de metros. Convierte con PIXEL_TO_METERS."]],
        sol: String.raw`    b2BodyDef body;
    body.type = b2_dynamicBody;
    body.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));
    b2Body* b = world->CreateBody(&body);`
      },
      pistas: ["Cuatro líneas: declarar, tipo, posición, crear.", "<code>CreateBody</code> recibe la DIRECCIÓN de la def: <code>&amp;body</code>."],
      bien: "<p>El handout además pone aquí <code>body.userData.pointer</code> (lección 03): siempre antes de CreateBody.</p>"
    },
    {
      t: "CreateCircle (2): forma y fixture",
      exp: `<p>Ahora la forma (un <code>b2CircleShape</code> con radio en metros) y la fixture que la pega al cuerpo con la densidad recibida.</p>`,
      escribe: {
        despues: String.raw`    pbody->body = b;
    return pbody;
}`,
        filas: 7,
        checks: [
          [/b2CircleShapeshape;/, "Declara la forma: <code>b2CircleShape shape;</code>"],
          [/shape\.m_radius=PIXEL_TO_METERS\(radius\);/, "Radio en metros: <code>shape.m_radius = PIXEL_TO_METERS(radius);</code>"],
          [/b2FixtureDeffixture;/, "Declara la fixture: <code>b2FixtureDef fixture;</code>"],
          [/fixture\.shape=&shape;/, "La fixture apunta a la forma: <code>fixture.shape = &amp;shape;</code>"],
          [/fixture\.density=density;/, "Material: <code>fixture.density = density;</code>"],
          [/b->CreateFixture\(&fixture\);/, "Pégala al cuerpo: <code>b-&gt;CreateFixture(&amp;fixture);</code>"]
        ],
        sol: String.raw`    b2CircleShape shape;
    shape.m_radius = PIXEL_TO_METERS(radius);

    b2FixtureDef fixture;
    fixture.shape = &shape;
    fixture.density = density;
    b->CreateFixture(&fixture);`
      },
      pistas: ["Forma → def de fixture → CreateFixture.", "<code>fixture.shape</code> es un puntero: <code>&amp;shape</code>."],
      bien: "<p>Ya puedes crear círculos que caen. <code>CreateRectangle</code> es igual con <code>b2PolygonShape</code> y <code>SetAsBox</code> (siguiente lección).</p>"
    },
    {
      t: "Limpiar",
      exp: `<p>En <code>CleanUp</code>, borra el mundo entero (libera todos sus cuerpos, fixtures y joints) y deja el puntero a nulo.</p>`,
      code: String.raw`
bool ModulePhysics::CleanUp()
{
    §s1§ world;
    world = §s2§;
    return true;
}`,
      slots: { s1: { ok: ["delete"], err: [[/^free$/, "Lo creaste con new: se libera con delete."]] }, s2: { ok: ["NULL", "nullptr"] } },
      pistas: ["Lo contrario de new."],
      bien: "<p>Ojo: tus <code>PhysBody</code> y entidades son tuyos, no de Box2D: ModuleGame debe borrarlos en su CleanUp (que va antes, porque CleanUp va en orden inverso).</p>"
    }
  ]
});
