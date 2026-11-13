Curso.practica({
  leccion: "l08",
  titulo: "Dale físicas al jugador",
  intro: "Prepararás Entity para recibir colisiones, crearás el cuerpo del jugador, lo moverás con velocidades de Box2D, harás que salte y reaccionarás a lo que toca.",
  pasos: [
    {
      t: "Entity aprende a recibir colisiones",
      exp: `<p>Physics llamará a <code>OnCollision</code> en las entidades, así que Entity debe declararla. Necesitas: una <em>forward declaration</em> de PhysBody (para usar el puntero sin incluir su .h) y la función virtual con cuerpo vacío.</p>`,
      code: String.raw`
§s1§ PhysBody;

class Entity : public std::enable_shared_from_this<Entity>
{
public:
    §s2§ void OnCollision(PhysBody* physA, PhysBody* physB) {}`,
      slots: {
        s1: { ok: ["class"], err: [[/^#include$/, "Un include funcionaría, pero puede crear inclusiones circulares. Basta con declarar que la clase existe: <code>class PhysBody;</code>"]] },
        s2: { ok: ["virtual"], err: [[/^override$/, "override es para las HIJAS. En la base se declara virtual."]] }
      },
      pistas: ["“Existe una clase llamada PhysBody”: <code>____ PhysBody;</code>", "Para que las hijas puedan tener su propia versión."],
      bien: "<p>Con cuerpo vacío <code>{}</code> las entidades que no necesitan colisiones (por ejemplo, decoración) no tienen que implementar nada.</p>"
    },
    {
      t: "Crear el cuerpo del jugador",
      exp: `<p>En <code>Player::Start()</code>, crea un círculo <strong>dinámico</strong> (le afecta la gravedad y choca) en la posición del jugador. <code>CreateCircle</code> recibe el centro y el radio.</p>`,
      code: String.raw`    pbody = Engine::GetInstance().physics->CreateCircle(
                (int)position.getX() + texW / 2,
                (int)position.getY() + texH / 2,
                §s1§,
                bodyType::§s2§);`,
      slots: {
        s1: { ok: ["texW/2", "texH/2", "texW/2.0f", "texH/2.0f"], err: [[/^texW$|^texH$/, "Eso es el diámetro. El radio es la mitad."]], w: 9, sol: "texW / 2" },
        s2: { ok: ["DYNAMIC"], err: [[/^STATIC$/, "Un cuerpo estático nunca se mueve. El jugador debe ser DYNAMIC."], [/^KINEMATIC$/, "Kinematic no cae con la gravedad ni lo frenan los choques. El jugador es DYNAMIC."]] }
      },
      pistas: ["Radio = mitad del ancho.", "static / dynamic / kinematic: ¿cuál se mueve y cae?"],
      bien: "<p>Sumamos texW/2 a la posición porque Box2D trabaja con el centro del cuerpo y nuestra <code>position</code> es la esquina superior izquierda.</p>"
    },
    {
      t: "Suscribirse a las colisiones",
      exp: `<p>Patrón Observer: dile al cuerpo que avise a <em>esta</em> entidad, y etiquétalo para que los demás sepan qué es.</p>`,
      code: String.raw`    pbody->§s1§ = this;
    pbody->ctype = ColliderType::§s2§;`,
      slots: { s1: { ok: ["listener"] }, s2: { ok: ["PLAYER"] } },
      pistas: ["El atributo de PhysBody que guarda “a quién avisar”.", "El tipo de collider de este cuerpo."],
      bien: "<p>Sin <code>listener</code>, Physics detecta la colisión pero no tiene a quién llamar: tu OnCollision nunca se ejecutaría.</p>"
    },
    {
      t: "Moverse con velocidad",
      exp: `<p>Ya no tocamos <code>position</code>: le pedimos a Box2D una velocidad. Escribe:</p><ol><li>Lee la velocidad actual: <code>b2Vec2 velocity = b2Body_GetLinearVelocity(pbody-&gt;body);</code></li><li>Pon <code>velocity.x</code> a 0.</li><li>Con A, <code>velocity.x = -speed;</code> con D, <code>velocity.x = speed;</code></li><li>Aplica con <code>b2Body_SetLinearVelocity(pbody-&gt;body, velocity);</code></li></ol>`,
      escribe: {
        antes: "bool Player::Update(float dt)\n{\n    auto& input = Engine::GetInstance().input;",
        filas: 7,
        checks: [
          [/b2Vec2velocity=b2Body_GetLinearVelocity\(pbody->body\);/, "Primero lee la velocidad actual (para conservar la Y de la gravedad): <code>b2Vec2 velocity = b2Body_GetLinearVelocity(pbody-&gt;body);</code>"],
          [/velocity\.x=0(\.0*f?)?;/, "Pon <code>velocity.x = 0;</code> para que se pare si no pulsas nada."],
          [/SDL_SCANCODE_A\)==KEY_REPEAT\)velocity\.x=-speed;/, "Con A: <code>velocity.x = -speed;</code>"],
          [/SDL_SCANCODE_D\)==KEY_REPEAT\)velocity\.x=speed;/, "Con D: <code>velocity.x = speed;</code>"],
          [/b2Body_SetLinearVelocity\(pbody->body,velocity\);/, "Aplica la velocidad: <code>b2Body_SetLinearVelocity(pbody-&gt;body, velocity);</code>"]
        ],
        prohibido: [[/speed\*dt/, "No multipliques por dt: una velocidad ya es “por segundo” y Box2D integra con su propio paso fijo."], [/velocity\.y=0/, "Si pones velocity.y a 0 cada frame, anulas la gravedad: el jugador flotaría."], [/position\.set/, "Con físicas no se mueve la position a mano: Box2D manda."]],
        sol: String.raw`    b2Vec2 velocity = b2Body_GetLinearVelocity(pbody->body);
    velocity.x = 0;
    if (input->GetKey(SDL_SCANCODE_A) == KEY_REPEAT) velocity.x = -speed;
    if (input->GetKey(SDL_SCANCODE_D) == KEY_REPEAT) velocity.x = speed;
    b2Body_SetLinearVelocity(pbody->body, velocity);`
      },
      pistas: ["Son 5 líneas: leer, x=0, if A, if D, aplicar.", "La Y no se toca: la gravedad la va cambiando."],
      bien: "<p>Leer primero la velocidad es la clave: así conservas la componente vertical (caída o salto) y solo controlas la horizontal.</p>"
    },
    {
      t: "Saltar con un impulso",
      exp: `<p>Un impulso cambia la velocidad de golpe, una sola vez: perfecto para saltar. Recuerda que en pantalla <strong>arriba es Y negativa</strong>.</p>`,
      code: String.raw`    if (input->GetKey(SDL_SCANCODE_SPACE) == KEY_DOWN && !isJumping) {
        b2Body_§s1§(pbody->body, b2Vec2{ 0, §s2§ }, true);
        isJumping = true;
    }`,
      slots: {
        s1: { ok: ["ApplyLinearImpulseToCenter"], err: [[/^ApplyForceToCenter$/, "Una fuerza se aplica poco a poco durante varios frames. Para un salto instantáneo usa un IMPULSO."], [/^SetLinearVelocity$/, "Funcionaría, pero el handout pide el impulso: <code>ApplyLinearImpulseToCenter</code>."]], w: 28 },
        s2: { ok: ["-jumpForce"], err: [[/^jumpForce$/, "Con Y positiva el impulso sería hacia ABAJO. Arriba es negativo: <code>-jumpForce</code>."]], w: 11 }
      },
      pistas: ["Aplicar Impulso Lineal Al Centro, en inglés y sin espacios.", "¿Hacia dónde crece la Y en pantalla?"],
      bien: "<p>Aquí sí usamos KEY_DOWN (no KEY_REPEAT): queremos un salto por pulsación, no un cohete mientras mantienes la tecla. <code>!isJumping</code> evita el doble salto infinito.</p>"
    },
    {
      t: "Reaccionar a lo que tocas",
      exp: `<p>Escribe el <code>switch</code> de <code>OnCollision</code> sobre <code>physB-&gt;ctype</code> (el <em>otro</em> cuerpo):</p><ul><li><code>PLATFORM</code>: has aterrizado → <code>isJumping = false;</code></li><li><code>ITEM</code>: suena la moneda → <code>Engine::GetInstance().audio-&gt;PlayFx(pickCoinFxId);</code></li></ul>`,
      escribe: {
        antes: "void Player::OnCollision(PhysBody* physA, PhysBody* physB)\n{",
        despues: "}",
        filas: 9,
        checks: [
          [/switch\(physB->ctype\)/, "El switch va sobre el tipo del OTRO cuerpo: <code>switch (physB-&gt;ctype)</code>."],
          [/caseColliderType::PLATFORM:/, "Falta <code>case ColliderType::PLATFORM:</code>"],
          [/caseColliderType::PLATFORM:[^]*?isJumping=false;[^]*?break;/, "En PLATFORM pon <code>isJumping = false;</code> y luego <code>break;</code>"],
          [/caseColliderType::ITEM:/, "Falta <code>case ColliderType::ITEM:</code>"],
          [/PlayFx\(pickCoinFxId\)/, "En ITEM, reproduce el sonido: <code>Engine::GetInstance().audio-&gt;PlayFx(pickCoinFxId);</code>"]
        ],
        prohibido: [[/switch\(physA->ctype\)/, "physA es tu propio cuerpo (siempre PLAYER). Mira physB."]],
        sol: String.raw`    switch (physB->ctype)
    {
    case ColliderType::PLATFORM:
        isJumping = false;
        break;
    case ColliderType::ITEM:
        Engine::GetInstance().audio->PlayFx(pickCoinFxId);
        break;
    default:
        break;
    }`
      },
      pistas: ["physA = yo, physB = lo que he tocado.", "Cada case termina en <code>break;</code>"],
      bien: "<p>Para los pinchos de SandKnight añadirías <code>case ColliderType::SPIKES:</code> que quita una vida y activa la invulnerabilidad. Recuerda: nunca destruyas cuerpos dentro de este callback; márcalos y bórralos después del step.</p>"
    }
  ]
});
