(function () {
  const { test, huecos, orden, escribe, bug } = DUO;
  DUO.unidad({
    id: "filtrado", titulo: "Filtrado de colisiones", icono: "& |",
    desc: "categoryBits, maskBits y groupIndex: quién choca con quién. Cambiar filtros en pleno juego.",
    chuleta: [
      ["La regla", "Dos fixtures chocan si `(catA & maskB) != 0 && (catB & maskA) != 0`. Por defecto cat = 0x0001 y mask = 0xFFFF (choca con todo)."],
      ["En código", "```enum Category : uint16 { CAT_WALL = 1 << 0, CAT_CAR = 1 << 1, CAT_SENSOR = 1 << 2 };\n\nfixture.filter.categoryBits = CAT_CAR;\nfixture.filter.maskBits = CAT_WALL | CAT_CAR | CAT_SENSOR;\nfixture.filter.groupIndex = 0;```"],
      ["groupIndex", "Mismo grupo positivo: siempre chocan. Mismo grupo negativo: nunca chocan (gana a las máscaras). 0: deciden categoría y máscara."],
      ["En pleno juego", "```b2Filter f = fixture->GetFilterData();\nf.maskBits = CAT_WALL | CAT_SENSOR;   // fantasma: atraviesa coches\nfixture->SetFilterData(f);```"]
    ],
    preguntas: [
      test("¿Qué significa `categoryBits`?", ["Con qué choco", "Qué soy", "Mi grupo", "Mi densidad"], 1, "Un bit que identifica el tipo de la fixture.", { nuevo: true }),
      test("¿Qué significa `maskBits`?", ["Qué soy", "Con qué categorías choco", "Mi color", "Mi peso"], 1, "Puede tener varios bits a la vez."),
      test("A: cat 0x0002, mask 0x0001. B: cat 0x0002, mask 0xFFFF. ¿Chocan?", ["Sí", "No", "Depende del grupo 0", "Solo si son sensores"], 1, "catB & maskA = 0x0002 & 0x0001 = 0 → A no acepta a B."),
      huecos("Define las categorías del juego.", String.raw`enum Category : uint16
{
    CAT_WALL   = 1 << ▢,
    CAT_CAR    = 1 << ▢,
    CAT_SENSOR = 1 << ▢
};`, ["0", "1", "2", "3", "4"], ["0", "1", "2"], "Un bit cada una: 1, 2, 4."),
      escribe("Escribe la máscara de un coche que choca con muros, coches y sensores (categorías CAT_WALL, CAT_CAR, CAT_SENSOR).", [/^(CAT_(WALL|CAR|SENSOR)\|){2}CAT_(WALL|CAR|SENSOR)$/],
        "Se combinan con OR de bits: `CAT_WALL | CAT_CAR | CAT_SENSOR`.", { ph: "CAT_WALL | ..." }),
      huecos("Aplica el filtro a la fixture del coche antes de crearla.", String.raw`fixture.filter.▢ = CAT_CAR;
fixture.filter.▢ = CAT_WALL | CAT_CAR | CAT_SENSOR;
b->CreateFixture(&fixture);`, ["categoryBits", "maskBits", "groupIndex", "isSensor", "density"], ["categoryBits", "maskBits"], ""),
      test("Dos coches con `groupIndex = -1`…", ["chocan siempre", "nunca chocan entre ellos, digan lo que digan sus máscaras", "solo chocan con muros", "no chocan con nada"], 1, "Mismo grupo negativo = nunca. Útil para coches fantasma (contrarreloj contra tu mejor vuelta)."),
      test("¿Cuánto vale `CAT_WALL | CAT_SENSOR` si CAT_WALL = 1 y CAT_SENSOR = 4?", ["4", "5", "1", "0"], 1, "001 | 100 = 101 = 5."),
      orden("Haz que el coche atraviese a los demás coches durante 2 s al reaparecer.", [
        "b2Fixture* f = body->GetFixtureList();",
        "b2Filter filter = f->GetFilterData();",
        "filter.maskBits = CAT_WALL | CAT_SENSOR;",
        "f->SetFilterData(filter);",
        "ghost_timer.Start();"], "Se lee, se modifica y se vuelve a poner. Al pasar 2 s, otra vez con CAT_CAR en la máscara."),
      bug("Tras este cambio el coche atraviesa también los muros. ¿Qué línea falla?", [
        "b2Filter filter = f->GetFilterData();",
        "filter.maskBits = CAT_SENSOR;",
        "f->SetFilterData(filter);"], 1, "Al quitar CAT_CAR también has quitado CAT_WALL. Debe ser `CAT_WALL | CAT_SENSOR`."),
      test("Los checkpoints (sensores) no deben interactuar con nada salvo coches. ¿Su máscara?", ["0xFFFF", "CAT_CAR", "CAT_WALL", "0"], 1, "Así no gastan cálculos con los muros ni entre ellos."),
      test("Con máscara 0, una fixture…", ["choca con todo", "no choca ni detecta nada", "solo detecta sensores", "es estática"], 1, ""),
      test("¿Qué tipo de datos son categoryBits y maskBits en Box2D 2.4?", ["int", "uint16 (16 bits sin signo)", "float", "bool"], 1, "Por eso hay como mucho 16 categorías."),
      test("Para reglas que no caben en bits (por ejemplo, “un coche no choca con su propia bala”), ¿qué usas?", ["Más categorías", "Una clase que herede de b2ContactFilter con ShouldCollide, registrada con world->SetContactFilter", "Un joint", "No se puede"], 1, "", { nuevo: true })
    ]
  });
})();
