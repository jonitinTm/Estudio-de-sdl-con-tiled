Curso.practica({
  leccion: "b07",
  titulo: "Tu propia jerarquía de entidades",
  intro: "Escribirás la base abstracta PhysicEntity, una entidad nueva (Cone) para el circuito y el bucle polimórfico, sin fugas.",
  pasos: [
    {
      t: "Una base abstracta",
      exp: `<p>Haz que <code>Update</code> sea virtual pura (nadie puede crear una PhysicEntity “a secas”) y que el destructor sea virtual.</p>`,
      code: String.raw`
class PhysicEntity
{
protected:
    PhysicEntity(PhysBody* _body) : body(_body) {}
public:
    §s1§ ~PhysicEntity() = default;
    virtual void Update() §s2§;
public:
    PhysBody* body;
};`,
      slots: { s1: { ok: ["virtual"] }, s2: { ok: ["=0"], err: [[/^\{\}$/, "Con {} tendría un cuerpo vacío y se podría instanciar. Para hacerla pura: = 0."], [/^override$/, "override va en las hijas."]], w: 5, sol: "= 0" } },
      pistas: ["Destructor de una clase con virtuales → virtual.", "Virtual pura: <code>= 0</code>."],
      bien: "<p>El constructor protected refuerza la idea: solo las hijas la construyen.</p>"
    },
    {
      t: "Una entidad nueva: Cone",
      exp: `<p>Escribe la clase <code>Cone</code> que hereda públicamente de PhysicEntity. Su constructor recibe <code>ModulePhysics* physics, int x, int y</code> y pasa a la base un círculo de radio 10: <code>physics-&gt;CreateCircle(x, y, 10)</code>. Implementa <code>Update()</code> con <code>override</code> (puede dibujar un círculo naranja con <code>DrawCircle</code>).</p>`,
      escribe: {
        filas: 14,
        checks: [
          [/classCone:publicPhysicEntity\{/, "Cabecera: <code>class Cone : public PhysicEntity {</code>"],
          [/Cone\(ModulePhysics\*physics,int\w+,int\w+\)/, "Constructor: <code>Cone(ModulePhysics* physics, int x, int y)</code>"],
          [/:PhysicEntity\(physics->CreateCircle\(\w+,\w+,10\)\)/, "Lista de inicialización: <code>: PhysicEntity(physics-&gt;CreateCircle(x, y, 10))</code>"],
          [/voidUpdate\(\)override\{/, "<code>void Update() override { … }</code>"],
          [/body->GetPosition\(/, "En Update, lee la posición: <code>body-&gt;GetPosition(px, py);</code>"]
        ],
        sol: String.raw`class Cone : public PhysicEntity
{
public:
    Cone(ModulePhysics* physics, int x, int y)
        : PhysicEntity(physics->CreateCircle(x, y, 10))
    {}

    void Update() override
    {
        int px, py;
        body->GetPosition(px, py);
        DrawCircle(px, py, 10.0f, ORANGE);
    }
};`
      },
      pistas: ["Fíjate en la clase Box del handout.", "La base recibe el PhysBody* ya creado."],
      bien: "<p>Para que un cono pese poco, añade densidad: <code>CreateCircle(x, y, 10, 0.3f)</code>.</p>"
    },
    {
      t: "Polimorfismo en el bucle",
      exp: `<p>Todas las entidades en un vector de punteros a la base; cada una se actualiza a su manera.</p>`,
      code: String.raw`
std::vector<§s1§> entities;
...
for (PhysicEntity* entity : entities)
    entity->§s2§;`,
      slots: { s1: { ok: ["PhysicEntity*"], err: [[/^PhysicEntity$/, "Por valor no funciona (la clase es abstracta y además se “cortaría” la hija). Guarda punteros: <code>PhysicEntity*</code>."]], w: 14 }, s2: { ok: ["Update()"], w: 9 } },
      pistas: ["Un vector de punteros a la base."],
      bien: ""
    },
    {
      t: "Sin fugas",
      exp: `<p>Escribe <code>DestroyAllEntities()</code>: para cada entidad, destruye su cuerpo con <code>App-&gt;physics-&gt;DestroyBody</code> y bórrala; al final vacía el vector.</p>`,
      escribe: {
        antes: "void ModuleGame::DestroyAllEntities()\n{",
        despues: "}",
        filas: 7,
        checks: [
          [/for\(PhysicEntity\*\w+:entities\)|for\(auto\w*\*?\w+:entities\)/, "Recorre: <code>for (PhysicEntity* entity : entities)</code>"],
          [/App->physics->DestroyBody\(\w+->body\);/, "Destruye el cuerpo: <code>App-&gt;physics-&gt;DestroyBody(entity-&gt;body);</code>"],
          [/delete\w+;/, "Borra la entidad: <code>delete entity;</code>"],
          [/entities\.clear\(\);/, "Al final: <code>entities.clear();</code>"]
        ],
        prohibido: [[/entities\.clear\(\);.*delete/, "Si haces clear() antes de borrar, pierdes los punteros: fuga."]],
        sol: String.raw`    for (PhysicEntity* entity : entities)
    {
        App->physics->DestroyBody(entity->body);
        delete entity;
    }
    entities.clear();`
      },
      pistas: ["Cuerpo de Box2D + envoltorio (DestroyBody), luego la entidad (delete)."],
      bien: "<p>Gracias al destructor virtual, <code>delete entity</code> llama primero a <code>~Cone()</code> y luego a <code>~PhysicEntity()</code>.</p>"
    }
  ]
});
