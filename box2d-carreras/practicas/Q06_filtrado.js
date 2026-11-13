Curso.practica({
  leccion: "b06",
  titulo: "Fusiones y filtros: los TODOs del Handout 06",
  intro: "Con el código real del handout: categorías, el filtro de la fixture, máscaras por color, el grupo de los fantasmas, apuntar parejas y fusionar conservando el momento.",
  pasos: [
    {
      t: "TODO 5: las categorías",
      exp: `<p>Escribe el enum <code>PhysicCategory</code> con cuatro flags de un bit: <code>CATEGORY_DEFAULT</code> (bit 0), <code>CATEGORY_RED</code> (bit 1), <code>CATEGORY_BLUE</code> (bit 2) y <code>CATEGORY_GHOST</code> (bit 3). Usa el desplazamiento <code>1 &lt;&lt; n</code>.</p>`,
      escribe: {
        filas: 7,
        checks: [
          [/enumPhysicCategory\{/, "Empieza con <code>enum PhysicCategory {</code>"],
          [/CATEGORY_DEFAULT=(1<<0|0x0*1|1)/, "<code>CATEGORY_DEFAULT = 1 &lt;&lt; 0</code> (0x0001, lo que ya usa la escena)."],
          [/CATEGORY_RED=(1<<1|0x0*2|2)/, "<code>CATEGORY_RED = 1 &lt;&lt; 1</code>"],
          [/CATEGORY_BLUE=(1<<2|0x0*4|4)/, "<code>CATEGORY_BLUE = 1 &lt;&lt; 2</code>"],
          [/CATEGORY_GHOST=(1<<3|0x0*8|8)/, "<code>CATEGORY_GHOST = 1 &lt;&lt; 3</code>"],
          [/\};/, "Cierra el enum con <code>};</code>"]
        ],
        prohibido: [[/CATEGORY_GHOST=(1<<4|3)\b/, "Un bit por categoría: el fantasma es el bit 3 (valor 8)."]],
        sol: String.raw`enum PhysicCategory
{
    CATEGORY_DEFAULT = 1 << 0,
    CATEGORY_RED     = 1 << 1,
    CATEGORY_BLUE    = 1 << 2,
    CATEGORY_GHOST   = 1 << 3
};`
      },
      pistas: ["Cada valor es una potencia de 2: 1, 2, 4, 8.", "Separa los valores con comas."],
      bien: "<p>Al ser potencias de 2, se combinan con <code>|</code> sin pisarse: RED | GHOST = 0b1010.</p>"
    },
    {
      t: "TODO 6: el filtro de la fixture",
      exp: `<p>En CreateCircle (que ahora recibe <code>category</code>, <code>mask</code> y <code>group</code>), antes de CreateFixture, rellena <code>fixture.filter</code>.</p>`,
      escribe: {
        despues: "b->CreateFixture(&fixture);",
        filas: 4,
        checks: [
          [/fixture\.filter\.categoryBits=category;/, "<code>fixture.filter.categoryBits = category;</code>"],
          [/fixture\.filter\.maskBits=mask;/, "<code>fixture.filter.maskBits = mask;</code>"],
          [/fixture\.filter\.groupIndex=group;/, "<code>fixture.filter.groupIndex = group;</code>"]
        ],
        sol: String.raw`fixture.filter.categoryBits = category;
fixture.filter.maskBits = mask;
fixture.filter.groupIndex = group;`
      },
      pistas: ["Tres campos del struct <code>filter</code>."],
      bien: "<p>Con valores por defecto en la declaración (<code>uint16 category = 0x0001, uint16 mask = 0xFFFF, int16 group = 0</code>) las llamadas antiguas siguen compilando.</p>"
    },
    {
      t: "TODO 7: máscara de las rojas",
      exp: `<p>Las rojas chocan con: la escena, las rojas y los fantasmas (y no con las azules).</p>`,
      code: String.raw`
static uint16 Mask(BallColor c)
{
    switch (c) {
    case BALL_RED:  return §s1§;
    case BALL_BLUE: return CATEGORY_DEFAULT | CATEGORY_BLUE | CATEGORY_GHOST;
    default:        return 0xFFFF;
    }
}`,
      slots: { s1: { ok: [/^(CATEGORY_(DEFAULT|RED|GHOST)\|){2}CATEGORY_(DEFAULT|RED|GHOST)$/], err: [[/CATEGORY_BLUE/, "¡Las rojas NO deben chocar con las azules!"], [/&/, "Para combinar categorías se usa <code>|</code> (o), no <code>&amp;</code>."]], w: 46, sol: "CATEGORY_DEFAULT | CATEGORY_RED | CATEGORY_GHOST" } },
      pistas: ["Copia la línea de las azules cambiando una categoría."],
      bien: "<p>Prueba en la demo a quitar DEFAULT: las bolas atraviesan las cajas de la escena.</p>"
    },
    {
      t: "TODO 8: el grupo de los fantasmas",
      exp: `<p>Los fantasmas nunca se tocan entre ellos, digan lo que digan sus máscaras.</p>`,
      code: String.raw`
static int16 Group(BallColor c)
{
    return (c == BALL_GHOST) ? §s1§ : 0;
}`,
      slots: { s1: { ok: [/^-\d+$/, "GROUP_GHOST"], err: [[/^\d+$/, "Un grupo POSITIVO hace que choquen SIEMPRE. Para “nunca”, negativo."]], w: 12, sol: "-1" } },
      pistas: ["Mismo grupo negativo = nunca chocan."],
      bien: "<p>El grupo gana a categoría y máscara: por eso la máscara 0xFFFF de los fantasmas no importa entre ellos.</p>"
    },
    {
      t: "TODO 2: apuntar la pareja",
      exp: `<p>En OnCollision: si los dos cuerpos son bolas (<code>FindBall</code>) del mismo color, añade la pareja a <code>balls_to_merge</code> solo si no estaba ya (en cualquier orden).</p>`,
      escribe: {
        filas: 12,
        checks: [
          [/Ball\*a=FindBall\(bodyA\);/, "<code>Ball* a = FindBall(bodyA);</code>"],
          [/Ball\*b=FindBall\(bodyB\);/, "<code>Ball* b = FindBall(bodyB);</code>"],
          [/a!=(NULL|nullptr)&&b!=(NULL|nullptr)&&a->color==b->color|a&&b&&a->color==b->color/, "Condición: las dos existen y <code>a-&gt;color == b-&gt;color</code>."],
          [/p\.first==a&&p\.second==b|p\.first==b&&p\.second==a|\.first==a&&\w+\.second==b/, "Comprueba si la pareja ya está (recorre <code>balls_to_merge</code> mirando first y second, en los dos órdenes)."],
          [/balls_to_merge\.push_back\(/, "Si no estaba, añádela: <code>balls_to_merge.push_back({ a, b });</code>"]
        ],
        prohibido: [[/DestroyBall|newBall/, "Nada de crear o destruir aquí: el mundo está bloqueado. Solo apuntar."]],
        sol: String.raw`Ball* a = FindBall(bodyA);
Ball* b = FindBall(bodyB);
if (a != NULL && b != NULL && a->color == b->color)
{
    bool repeated = false;
    for (auto& p : balls_to_merge)
        if ((p.first == a && p.second == b) || (p.first == b && p.second == a))
            repeated = true;
    if (!repeated)
        balls_to_merge.push_back({ a, b });
}`
      },
      pistas: ["Cada contacto llega como (A, B) y como (B, A).", "Un bool <code>repeated</code> y un bucle sobre <code>balls_to_merge</code>."],
      bien: ""
    },
    {
      t: "TODO 3 y 4: centro de masas y momento",
      exp: `<p>Ya tienes m1, m2, p1, p2, v1, v2 (en metros) y <code>m = m1 + m2</code>. Completa las fórmulas.</p>`,
      code: String.raw`
b2Vec2 pos = m1 * p1 + m2 * p2;
pos *= §s1§;
b2Vec2 vel = §s2§;
vel *= 1.0f / m;`,
      slots: {
        s1: { ok: ["1.0f/m", "1.0f/(m1+m2)", "1/m"], err: [[/^m$/, "Hay que DIVIDIR entre la masa total: multiplica por 1.0f / m."]], w: 10, sol: "1.0f / m" },
        s2: { ok: ["m1*v1+m2*v2", "m2*v2+m1*v1"], err: [[/^v1\+v2$/, "Eso es la suma de velocidades. El momento pondera por la masa: m1 * v1 + m2 * v2."]], w: 16, sol: "m1 * v1 + m2 * v2" }
      },
      pistas: ["b2Vec2 tiene <code>*=</code> con un float, pero no división: multiplica por el inverso.", "Momento = masa × velocidad."],
      bien: "<p>Luego: destruir las dos, crear la fusionada en <code>METERS_TO_PIXELS(pos)</code> con masa m, y <code>SetLinearVelocity(vel)</code> (TODO 1) justo después.</p>"
    }
  ]
});
