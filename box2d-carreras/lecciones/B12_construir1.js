(function () {
  const { code, nota, quiz } = Curso;
  Curso.leccion({
    id: "b12", num: "12", grupo: "Bloque 4 · Construye el juego paso a paso", corto: "Construcción I: el coche",
    titulo: "Construcción I: del handout a un coche que se conduce",
    resumen: "Fases 0–3: preparar el proyecto, cinco retoques al motor, la clase Car completa y un coche que conduces.",
    intro: "Empieza aquí si lo que quieres es construir el juego. Partes de tu Handout 06 y, fase a fase, acabas esta lección con un coche que aceleras, giras y derrapas dentro de una pista vacía.",
    objetivos: ["Preparar el proyecto y crear archivos en Visual Studio", "Adaptar el motor del handout con cinco cambios", "Escribir la clase Car entendiendo cada función", "Conducir tu coche con teclado y nitro"],
    html: () => `

<p>Esta guía construye el juego de carreras <strong>entero</strong> partiendo de tu Handout 06. No hace falta que sepas programar: en cada fase te digo <strong>qué archivo abrir</strong>, <strong>qué escribir</strong>, <strong>qué significa cada línea</strong> y <strong>qué deberías ver</strong> al ejecutar. El código que ves aquí está sacado de un proyecto que he compilado y ejecutado contra el Box2D de tu handout: los rivales completan sus 3 vueltas, nadie atraviesa los muros y no hay fugas de memoria.</p>
${nota(`<p><strong>Escribe el código tú, no lo copies y pegues</strong> (al menos la primera vez). Teclearlo es lo que hace que se te quede. Si te atascas, al final de cada lección tienes los archivos completos para comparar. Y si quieres entender mejor una pieza, cada fase enlaza con la lección que la explica a fondo.</p>`, "", "Cómo usar esta guía")}

<h3>El mapa completo</h3>
<div class="table-wrap"><table class="t"><thead><tr><th>Fase</th><th>Qué construyes</th><th>Qué verás</th></tr></thead><tbody>
<tr><td>0</td><td>Preparar el proyecto</td><td>El handout compila y arranca</td></tr>
<tr><td>1</td><td>Cinco retoques al motor</td><td>Una ventana gris vacía, sin errores</td></tr>
<tr><td>2</td><td>La clase <code>Car</code> (la física del coche)</td><td>Compila (todavía nada nuevo en pantalla)</td></tr>
<tr><td>3</td><td><code>PlayerCar</code> + escena de prueba</td><td><strong>Un coche rojo que conduces</strong></td></tr>
<tr><td>4</td><td>El circuito</td><td>Pista con muros de los que no puedes salir</td></tr>
<tr><td>5</td><td>Checkpoints, vueltas y HUD</td><td>Contador de vueltas y tiempos</td></tr>
<tr><td>6</td><td>Cuenta atrás, final y reinicio</td><td>Una carrera con principio y fin</td></tr>
<tr><td>7</td><td>Turbo, aceite y nitro</td><td>Las mecánicas especiales</td></tr>
<tr><td>8</td><td>Rivales con IA</td><td>Tres coches que compiten contigo</td></tr>
<tr><td>9</td><td>Tus gráficos, tu circuito, tus sonidos</td><td>Tu juego</td></tr>
</tbody></table></div>
<p>Esta lección cubre las fases 0–3. La siguiente, las fases 4–9.</p>

<h2>Tres cosas de C++ que necesitas para leer el código</h2>
<ul>
<li><strong>Cada clase son dos archivos.</strong> El <code>.h</code> es el índice: dice qué variables y funciones tiene la clase. El <code>.cpp</code> contiene el código de esas funciones. Cuando en la guía pone <code>Car.h</code> escribes en uno; cuando pone <code>Car.cpp</code>, en el otro.</li>
<li><strong><code>-&gt;</code> y <code>.</code></strong> sirven para lo mismo: acceder a algo de dentro. Se usa <code>-&gt;</code> si lo de la izquierda es un puntero (lleva <code>*</code> en su declaración, como <code>b2Body* b</code> → <code>b-&gt;GetMass()</code>) y <code>.</code> si no.</li>
<li><strong>La <code>f</code> de <code>14.0f</code></strong> significa “número con decimales de tipo float”. Ponla siempre en los decimales.</li>
</ul>
<h2 id="fase0">Fase 0 · Preparar el proyecto</h2>

<ol>
<li>Haz una <strong>copia</strong> de la carpeta <code>Handout06</code> y llámala, por ejemplo, <code>Racing</code>. Trabaja siempre en la copia.</li>
<li>Abre <code>PhysicsGame.sln</code> con Visual Studio. Pulsa <kbd>F5</kbd>: debe compilar y abrirse la ventana con las bolas. Si aquí ya falla, el problema no es tu código: revisa que tienes instalado “Desarrollo para el escritorio con C++”.</li>
<li>En el <em>Explorador de soluciones</em> verás los archivos de <code>Source</code>. Los que vamos a tocar: <code>Module.h</code>, <code>ModulePhysics.h/.cpp</code>, <code>ModuleAudio.cpp</code>, <code>ModuleWindow.cpp</code>, <code>Globals.h</code> y <code>ModuleGame.h/.cpp</code>. Y crearemos cuatro nuevos: <code>PhysicEntity.h</code>, <code>Car.h</code>, <code>Car.cpp</code> y <code>Track.h</code>.</li>
</ol>
<h3>Cómo crear un archivo nuevo en Visual Studio</h3>
<ol>
<li>Clic derecho sobre el proyecto <strong>PhysicsGame</strong> → <em>Agregar</em> → <em>Nuevo elemento…</em></li>
<li>Elige “Archivo de encabezado (.h)” o “Archivo C++ (.cpp)” y ponle el nombre.</li>
<li><strong>Importante:</strong> en “Ubicación” elige la carpeta <code>Source</code> del proyecto. Si no, Visual Studio lo guarda fuera y luego los <code>#include</code> no lo encuentran.</li>
</ol>

${nota(`<p>El handout original compila y se ejecuta en tu copia. Todavía no has cambiado nada.</p>`, "game", "Compila y comprueba")}
<h2 id="fase1">Fase 1 · Cinco retoques al motor</h2>

<p>El motor del handout ya hace casi todo. Solo le faltan cinco detalles para un juego de carreras. Son cambios pequeños: busca la línea indicada (<kbd>Ctrl</kbd>+<kbd>F</kbd>) y modifícala.</p>

<h3>1.1 · El juego a 60 fps <span style="font-weight:400;color:var(--ink-3)">(ModuleWindow.cpp)</span></h3>
<p>El motor avanza la física <code>1/60</code> de segundo por cada frame. En un monitor de 144 Hz habría 144 frames por segundo y el juego iría 2,4 veces más rápido. Fijando 60 fps, va a velocidad real en cualquier PC (el enunciado lo exige: “sin bullet-time descontrolado”). Justo después de <code>InitWindow</code>:</p>
${code(String.raw`
    InitWindow(width, height, TITLE);

    // One world->Step(PHYSICS_DT) per frame: lock the game to 60 fps so physics run in real time on every monitor
    SetTargetFPS(60);`, "cpp", "ModuleWindow.cpp → Init()")}

<h3>1.2 · Empezar sin debug <span style="font-weight:400;color:var(--ink-3)">(ModulePhysics.cpp)</span></h3>
<p>En el constructor, cambia <code>debug = true;</code> por <code>false</code>. Con <kbd>F1</kbd> lo activas cuando quieras (y con él, el mouse joint).</p>
${code(String.raw`
    debug = false; // F1 toggles it: the game must be playable without debug info`, "cpp", "ModulePhysics.cpp → constructor")}

<h3>1.3 · Sensores girados <span style="font-weight:400;color:var(--ink-3)">(ModulePhysics.h y .cpp)</span></h3>
<p>Los checkpoints son rectángulos atravesados en la pista, y la pista tiene curvas: necesitan un ángulo. Añade un parámetro <code>angle</code> con valor por defecto 0 (así las llamadas antiguas siguen funcionando).</p>
${code(String.raw`
    // angle in radians: sensors across the track need to be rotated
    PhysBody* CreateRectangleSensor(int x, int y, int half_width, int half_height, float angle = 0.0f);`, "cpp", "ModulePhysics.h")}${code(String.raw`
PhysBody* ModulePhysics::CreateRectangleSensor(int x, int y, int half_width, int half_height, float angle)
{
    PhysBody* pbody = new PhysBody();

    b2BodyDef body;
    body.type = b2_staticBody;
    body.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));
    body.angle = angle;
    body.userData.pointer = reinterpret_cast<uintptr_t>(pbody);

    b2Body* b = world->CreateBody(&body);

    b2PolygonShape box;
    box.SetAsBox(PIXEL_TO_METERS(half_width), PIXEL_TO_METERS(half_height));

    b2FixtureDef fixture;
    fixture.shape = &box;
    fixture.isSensor = true;
    b->CreateFixture(&fixture);

    pbody->body = b;

    return pbody;
}`, "cpp", "ModulePhysics.cpp")}
<p>Lo nuevo son dos cosas: <code>float angle</code> en la cabecera y la línea <code>body.angle = angle;</code>. El valor por defecto (<code>= 0.0f</code>) solo se escribe en el <code>.h</code>.</p>

<h3>1.4 · Avisar cuando dos cuerpos dejan de tocarse <span style="font-weight:400;color:var(--ink-3)">(Module.h, ModulePhysics.h y .cpp)</span></h3>
<p>El handout avisa cuando dos cuerpos <em>empiezan</em> a tocarse (<code>OnCollision</code>). Para la mancha de aceite necesitamos saber también cuándo el coche <em>sale</em>. Es copiar lo que ya existe cambiando el nombre.</p>
${code(String.raw`
    // Called when a body that has this module as listener stops touching another body
    virtual void OnCollisionEnd(PhysBody* bodyA, PhysBody* bodyB)
    {
    }`, "cpp", "Module.h (debajo de OnCollision)")}${code(String.raw`
    void BeginContact(b2Contact* contact) override;
    void EndContact(b2Contact* contact) override;`, "cpp", "ModulePhysics.h")}${code(String.raw`
void ModulePhysics::EndContact(b2Contact* contact)
{
    PhysBody* a = (PhysBody*)contact->GetFixtureA()->GetBody()->GetUserData().pointer;
    PhysBody* b = (PhysBody*)contact->GetFixtureB()->GetBody()->GetUserData().pointer;

    if (a != NULL && a->listener != NULL)
        a->listener->OnCollisionEnd(a, b);

    if (b != NULL && b->listener != NULL)
        b->listener->OnCollisionEnd(b, a);
}`, "cpp", "ModulePhysics.cpp (debajo de BeginContact)")}

<h3>1.5 · Arreglar el sonido <span style="font-weight:400;color:var(--ink-3)">(ModuleAudio.cpp)</span></h3>
<p>El handout tiene un fallo: <code>LoadFx</code> devuelve 1 para el primer sonido, 2 para el segundo… (0 significa error), pero <code>PlayFx</code> reproduce <code>fx[id]</code>, que es la casilla siguiente. Con un solo sonido cargado, no suena nunca. La casilla correcta es <code>id - 1</code>:</p>
${code(String.raw`
    // LoadFx returns 1 for the first sound (0 means error): the array index is id - 1
    if (id > 0 && id <= fx_count)
    {
        PlaySound(fx[id - 1]);
        ret = true;
    }`, "cpp", "ModuleAudio.cpp → PlayFx()")}
<p>Y, si quieres, el título de la ventana en <code>Globals.h</code>: <code>#define TITLE "Racing"</code>.</p>

${nota(`<p>Todavía con el ModuleGame antiguo: compila y funciona igual que antes, pero sin dibujar las formas hasta que pulses <kbd>F1</kbd>.</p>`, "game", "Compila y comprueba")}
${nota(`<p>“<em>no se puede convertir…</em>” o “<em>no coincide con ninguna declaración</em>” en CreateRectangleSensor: la cabecera del <code>.h</code> y la del <code>.cpp</code> deben tener los mismos parámetros (el <code>= 0.0f</code> solo en el .h).</p>`, "warn", "Si no funciona")}
<h2 id="fase2">Fase 2 · La clase Car: la física del coche</h2>

<p>Vamos a crear la pieza central del juego. Todo coche (el tuyo y los rivales) será un <code>Car</code>. La idea está explicada con una demo en la <a href="#b08">lección 08</a>; aquí la escribimos.</p>

<h3>2.1 · PhysicEntity.h <span style="font-weight:400;color:var(--ink-3)">(archivo nuevo)</span></h3>
<p>En el handout, <code>PhysicEntity</code> está escrita dentro de <code>ModuleGame.cpp</code>. La sacamos a su propio archivo para poder usarla desde <code>Car</code>. Es la “plantilla” de cualquier cosa que tenga cuerpo físico.</p>
${code(String.raw`
#pragma once

#include "ModulePhysics.h"

// Base class for everything in the scene that has a physics body
class PhysicEntity
{
protected:

    PhysicEntity(PhysBody* _body)
        : body(_body)
    {
    }

public:
    virtual ~PhysicEntity() = default;

    // Called once per frame while the race is running
    virtual void Update() = 0;

public:
    PhysBody* body;
};
`, "cpp", "PhysicEntity.h")}
<ul>
<li><code>#pragma once</code>: evita que el archivo se incluya dos veces. Va siempre al principio de un <code>.h</code>.</li>
<li><code>PhysBody* body</code>: el cuerpo físico de la entidad (el envoltorio del handout).</li>
<li><code>virtual void Update() = 0;</code>: “toda entidad tiene un Update, pero cada tipo lo escribe a su manera”. El <code>= 0</code> obliga a las clases hijas a escribirlo.</li>
</ul>

<h3>2.2 · Car.h <span style="font-weight:400;color:var(--ink-3)">(archivo nuevo)</span></h3>
<p>El índice de la clase: qué sabe hacer un coche y qué datos guarda. De momento escribe solo la clase <code>Car</code> (las otras dos, <code>PlayerCar</code> y <code>AICar</code>, llegan en las fases 3 y 8).</p>
${code(String.raw`
#pragma once

#include "PhysicEntity.h"
#include "Timer.h"

// Top view car. The driving physics live here, once.
// PlayerCar and AICar only decide the throttle and the steering.
class Car : public PhysicEntity
{
public:
    Car(ModulePhysics* physics, int x, int y, float angle, Color _color);

    // Friction + Control() + engine + steering. Call it once per frame while racing
    void Update() override;
    void Draw() const;

    // Back to the grid: position, speed and race state
    virtual void Reset(int x, int y, float angle);

    // The car crossed the finish line with all the checkpoints done
    void LapCompleted();

    // m/s along the nose of the car. Negative when going backwards
    float GetForwardSpeed() const;

protected:
    // throttle: +1 gas, -1 brake/reverse. steer: -1 left, +1 right
    virtual void Control(float& throttle, float& steer) = 0;

    b2Vec2 GetForward() const;
    b2Vec2 GetRight() const;
    b2Vec2 GetLateralVelocity() const;

    void UpdateFriction();
    void Drive(float throttle);
    void Steer(float steer);

public:
    // Race state -------------------------
    int lap = 0;
    int next_checkpoint = 1;   // we start just after the finish line (checkpoint 0)
    bool finished = false;
    int place = 0;             // 1 = winner. 0 while racing
    Timer lap_timer;
    double last_lap = -1.0;    // seconds. -1 = none yet
    double best_lap = -1.0;

    // Zones ------------------------------
    int in_oil = 0;            // number of oil sensors touching the car
    float boost_time = 0.0f;   // seconds of boost left

    // Driving ----------------------------
    bool handbrake = false;
    bool drifting = false;
    float speed_factor = 1.0f; // rubber banding: scales max_speed

    // Tuning. Accelerations instead of forces: they do not depend on the mass of the car
    float engine_accel = 14.0f;      // m/s^2
    float brake_accel = 20.0f;       // m/s^2
    float reverse_accel = 6.0f;      // m/s^2
    float boost_accel = 25.0f;       // m/s^2
    float max_speed = 7.5f;          // m/s
    float max_back_speed = 2.0f;     // m/s
    float max_lateral_dv = 0.35f;    // m/s of lateral speed the tyres can kill in one step
    float turn_speed = 3.2f;         // rad/s
    float drag = 0.6f;               // 1/s

    Color color;

    static const int half_width = 10;   // pixels
    static const int half_height = 20;  // pixels
};`, "cpp", "Car.h")}
<p>Léelo por bloques:</p>
<ul>
<li><code>class Car : public PhysicEntity</code>: un Car <em>es una</em> PhysicEntity (hereda su <code>body</code>).</li>
<li><strong>public</strong>: lo que el resto del juego puede usar: <code>Update()</code>, <code>Draw()</code>, <code>Reset()</code>, <code>LapCompleted()</code>.</li>
<li><strong>protected</strong>: las tripas, que solo usan el propio coche y sus hijas. <code>Control()</code> es la pregunta “¿cuánto acelero y cuánto giro?”: el jugador la responderá con el teclado y la IA con sus cálculos.</li>
<li><strong>Estado de carrera</strong>: vuelta, siguiente checkpoint, tiempos. Lo usaremos en la fase 5.</li>
<li><strong>Ajustes</strong> (<em>tuning</em>): los números que definen cómo se conduce. Son aceleraciones (m/s²) para que no dependan del tamaño del coche. Cámbialos más tarde para encontrar tu tacto.</li>
</ul>

<h3>2.3 · Car.cpp <span style="font-weight:400;color:var(--ink-3)">(archivo nuevo)</span></h3>
<p>Ahora el código de cada función. Empieza el archivo con los includes y el constructor:</p>
${code(String.raw`
#include "Globals.h"
#include "Car.h"

#include <math.h>

// Car ---------------------------------------------------------------------

Car::Car(ModulePhysics* physics, int x, int y, float angle, Color _color)
    : PhysicEntity(physics->CreateRectangle(x, y, half_width, half_height))
    , color(_color)
{
    b2Body* b = body->body;
    b->SetTransform(b->GetPosition(), angle);

    // Top view: nothing stops a spinning body. This is our angular friction
    b->SetAngularDamping(3.0f);
}`, "cpp", "Car.cpp · inicio y constructor")}
<ul>
<li><code>: PhysicEntity(physics-&gt;CreateRectangle(x, y, half_width, half_height))</code>: antes de nada, crea el cuerpo (una caja de 20×40 px; recuerda que son <em>medias</em> medidas) y se lo pasa a la clase base.</li>
<li><code>SetTransform(posición, angle)</code>: gira el coche para que mire hacia donde toca en la parrilla.</li>
<li><code>SetAngularDamping(3.0f)</code>: rozamiento al giro. Sin esto, tras un choque el coche giraría como una peonza para siempre.</li>
</ul>

<p><strong>Hacia dónde miro y cómo de rápido voy.</strong> Cuatro funciones cortas que usan todas las demás:</p>
${code(String.raw`
// The texture of the car points up, and screen Y grows downwards: the nose is (0, -1)
b2Vec2 Car::GetForward() const
{
    return body->body->GetWorldVector(b2Vec2(0.0f, -1.0f));
}

b2Vec2 Car::GetRight() const
{
    return body->body->GetWorldVector(b2Vec2(1.0f, 0.0f));
}

// The part of the velocity that goes sideways: (right . v) * right
b2Vec2 Car::GetLateralVelocity() const
{
    b2Vec2 right = GetRight();
    return b2Dot(right, body->body->GetLinearVelocity()) * right;
}

float Car::GetForwardSpeed() const
{
    return b2Dot(GetForward(), body->body->GetLinearVelocity());
}`, "cpp", "Car.cpp · direcciones y velocidades")}
<ul>
<li><code>GetWorldVector(b2Vec2(0, -1))</code>: “la dirección <em>arriba</em> del coche, girada con él”. Como en pantalla la Y crece hacia abajo, arriba es −1.</li>
<li><code>b2Dot(a, b)</code> (producto escalar): cuánto de <code>b</code> va en la dirección de <code>a</code>. <code>GetForwardSpeed()</code> es la velocidad hacia el morro (negativa si vas marcha atrás); <code>GetLateralVelocity()</code>, la parte de la velocidad que va de lado.</li>
</ul>

<p><strong>Los neumáticos.</strong> Esta función es la que convierte una caja que patina en un coche:</p>
${code(String.raw`
void Car::UpdateFriction()
{
    b2Body* b = body->body;
    float mass = b->GetMass();

    // Tyres: kill the lateral velocity with an impulse. impulse = mass * change of velocity
    b2Vec2 impulse = mass * -GetLateralVelocity();

    // ...but only up to a limit. Past it the car drifts
    float max_impulse = mass * max_lateral_dv;
    if (in_oil > 0) max_impulse *= 0.15f;
    if (handbrake) max_impulse *= 0.25f;

    float length = impulse.Length();
    if (length > max_impulse)
    {
        impulse *= max_impulse / length;
        drifting = true;
    }
    else
    {
        drifting = false;
    }
    b->ApplyLinearImpulse(impulse, b->GetWorldCenter(), true);

    // Rolling resistance and air: without it the car never stops
    b->ApplyForceToCenter(-drag * mass * GetForwardSpeed() * GetForward(), true);
}`, "cpp", "Car.cpp · UpdateFriction()")}
<ol>
<li>Calcula el <strong>impulso</strong> que anularía toda la velocidad lateral: masa × (−velocidad lateral).</li>
<li>Lo <strong>limita</strong>: los neumáticos solo pueden quitar <code>max_lateral_dv</code> m/s por paso. Si hace falta más (curva rápida), sobra velocidad lateral: el coche <strong>derrapa</strong>. En aceite o con freno de mano, el límite baja mucho.</li>
<li>Aplica el impulso.</li>
<li>Añade un rozamiento hacia atrás proporcional a la velocidad, para que el coche se pare al soltar el acelerador.</li>
</ol>

<p><strong>El motor y el volante:</strong></p>
${code(String.raw`
void Car::Drive(float throttle)
{
    b2Body* b = body->body;
    float speed = GetForwardSpeed();
    float accel = 0.0f;

    if (throttle > 0.0f && speed < max_speed * speed_factor)
        accel = engine_accel;
    else if (throttle < 0.0f && speed > -max_back_speed)
        accel = (speed > 0.5f) ? -brake_accel : -reverse_accel;

    // Boost pads and nitro push even over the top speed
    if (boost_time > 0.0f)
    {
        boost_time -= PHYSICS_DT;
        accel += boost_accel;
    }

    // F = m * a. Forces are cleared after every Step(): apply it every frame
    if (accel != 0.0f)
        b->ApplyForceToCenter(accel * b->GetMass() * GetForward(), true);
}

void Car::Steer(float steer)
{
    if (steer == 0.0f)
        return; // the angular damping straightens the car

    // A car that does not move does not turn. Backwards, the wheel works the other way round
    float speed = GetForwardSpeed();
    float factor = fminf(fabsf(speed) / 2.5f, 1.0f);
    if (speed < 0.0f) factor = -factor;

    body->body->SetAngularVelocity(steer * turn_speed * factor);
}`, "cpp", "Car.cpp · Drive() y Steer()")}
<ul>
<li><code>Drive</code>: si aceleras y no has llegado a la velocidad máxima, empuja hacia delante. Si frenas yendo hacia delante, frena fuerte; si ya estás casi parado, marcha atrás suave. <code>F = m · a</code>: por eso multiplica por la masa.</li>
<li><code>boost_time</code>: mientras quede tiempo de turbo, empuje extra (lo activarán el nitro y las placas de turbo).</li>
<li><code>Steer</code>: fija la velocidad de giro, pero multiplicada por <code>factor</code>, que vale 0 parado y 1 a partir de 2,5 m/s (un coche parado no gira) y cambia de signo marcha atrás.</li>
</ul>

<p><strong>Update, Draw, Reset y LapCompleted:</strong></p>
${code(String.raw`
void Car::Update()
{
    float throttle = 0.0f;
    float steer = 0.0f;

    if (!finished)
        Control(throttle, steer);

    UpdateFriction();
    Drive(throttle);
    Steer(steer);
}

void Car::Draw() const
{
    int x, y;
    body->GetPosition(x, y);
    float degrees = body->GetRotation() * RAD2DEG;

    // Box2D gives the center of the body: origin = center of the rectangle
    Rectangle chassis = { (float)x, (float)y, half_width * 2.0f, half_height * 2.0f };
    DrawRectanglePro(chassis, Vector2{ (float)half_width, (float)half_height }, degrees, color);

    // Windscreen, towards the nose
    Rectangle glass = { (float)x, (float)y, half_width * 2.0f - 6.0f, 9.0f };
    DrawRectanglePro(glass, Vector2{ half_width - 3.0f, half_height - 8.0f }, degrees, Color{ 20, 30, 50, 220 });
}`, "cpp", "Car.cpp · Update() y Draw()")}${code(String.raw`
void Car::Reset(int x, int y, float angle)
{
    b2Body* b = body->body;
    b->SetTransform(b2Vec2(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y)), angle);
    b->SetLinearVelocity(b2Vec2_zero);
    b->SetAngularVelocity(0.0f);
    b->SetAwake(true);

    lap = 0;
    next_checkpoint = 1;
    finished = false;
    place = 0;
    last_lap = -1.0;
    best_lap = -1.0;
    in_oil = 0;
    boost_time = 0.0f;
    handbrake = false;
    drifting = false;
    speed_factor = 1.0f;
}

void Car::LapCompleted()
{
    double t = lap_timer.ReadSec();
    last_lap = t;
    if (best_lap < 0.0 || t < best_lap)
        best_lap = t;

    lap++;
    lap_timer.Start();
}`, "cpp", "Car.cpp · Reset() y LapCompleted()")}
<ul>
<li><code>Update()</code> es el orden de cada frame: preguntar a <code>Control</code> qué hacer → neumáticos → motor → volante.</li>
<li><code>Draw()</code> dibuja un rectángulo girado con <code>DrawRectanglePro</code>. El <code>origin</code> en el centro es lo que hace que quede encima del cuerpo físico (lección 02), y <code>* RAD2DEG</code> pasa de radianes a grados.</li>
<li><code>Reset()</code> devuelve el coche a la parrilla: lo teletransporta, le quita la velocidad y pone a cero su carrera.</li>
<li><code>LapCompleted()</code> guarda el tiempo de la vuelta, actualiza el mejor y reinicia el cronómetro.</li>
</ul>

${nota(`<p>Añade <code>Car.cpp</code> al proyecto y compila (<kbd>Ctrl</kbd>+<kbd>B</kbd>). No verás nada nuevo todavía, pero no debe haber errores. Nota: <code>Car</code> aún no se puede crear, porque <code>Control</code> es <code>= 0</code>. Eso lo resuelve la fase 3.</p>`, "game", "Compila y comprueba")}
${nota(`<p>“<em>identificador no declarado</em>”: revisa mayúsculas y que el nombre coincide en el .h y el .cpp. “<em>símbolo externo sin resolver</em>”: una función está en el .h pero no la has escrito en el .cpp (o <code>Car.cpp</code> no está añadido al proyecto).</p>`, "warn", "Si no funciona")}
<h2 id="fase3">Fase 3 · PlayerCar y una escena de prueba</h2>

<p>Un <code>PlayerCar</code> es un <code>Car</code> cuya respuesta a <code>Control()</code> viene del teclado. Además tiene el nitro (la “acción extra con la barra espaciadora” del enunciado).</p>
<h3>3.1 · Añadir PlayerCar a Car.h</h3>
${code(String.raw`
// Driven with the keyboard
class PlayerCar : public Car
{
public:
    PlayerCar(ModulePhysics* physics, int x, int y, float angle, Color _color);

    void Reset(int x, int y, float angle) override;

    // Seconds until the nitro can be used again
    float NitroCooldown() const;

    // True during the frame the nitro was fired: ModuleGame plays the sound
    bool nitro_fired = false;

protected:
    void Control(float& throttle, float& steer) override;

private:
    Timer nitro_timer;
    bool nitro_ready = true;
};`, "cpp", "Car.h (debajo de la clase Car)")}
<h3>3.2 · Añadir PlayerCar a Car.cpp</h3>
${code(String.raw`
// PlayerCar ---------------------------------------------------------------

PlayerCar::PlayerCar(ModulePhysics* physics, int x, int y, float angle, Color _color)
    : Car(physics, x, y, angle, _color)
{
}

void PlayerCar::Reset(int x, int y, float angle)
{
    Car::Reset(x, y, angle);
    nitro_ready = true;
    nitro_fired = false;
}

float PlayerCar::NitroCooldown() const
{
    if (nitro_ready)
        return 0.0f;

    float left = 5.0f - (float)nitro_timer.ReadSec();
    return (left > 0.0f) ? left : 0.0f;
}

void PlayerCar::Control(float& throttle, float& steer)
{
    if (IsKeyDown(KEY_UP) || IsKeyDown(KEY_W)) throttle += 1.0f;
    if (IsKeyDown(KEY_DOWN) || IsKeyDown(KEY_S)) throttle -= 1.0f;
    if (IsKeyDown(KEY_LEFT) || IsKeyDown(KEY_A)) steer -= 1.0f;
    if (IsKeyDown(KEY_RIGHT) || IsKeyDown(KEY_D)) steer += 1.0f;

    handbrake = IsKeyDown(KEY_LEFT_SHIFT);

    // Nitro: one second of boost, then 5 seconds to recharge
    if (!nitro_ready && nitro_timer.ReadSec() >= 5.0)
        nitro_ready = true;

    nitro_fired = false;
    if (IsKeyPressed(KEY_SPACE) && nitro_ready)
    {
        boost_time = 1.0f;
        nitro_ready = false;
        nitro_fired = true;
        nitro_timer.Start();
    }
}`, "cpp", "Car.cpp (al final)")}
<ul>
<li><code>IsKeyDown</code>: verdadero <em>mientras</em> la tecla está pulsada (para acelerar y girar). <code>IsKeyPressed</code>: verdadero <em>solo el frame</em> en que la pulsas (para el nitro: un disparo por pulsación).</li>
<li>Flechas <strong>y</strong> WASD, como pide el enunciado. <kbd>Shift</kbd> izquierdo es el freno de mano (derrape).</li>
<li>Nitro: un segundo de turbo y 5 segundos de recarga, medidos con el <code>Timer</code> del handout.</li>
</ul>

<h3>3.3 · Un ModuleGame de prueba</h3>
<p>Ahora sustituye <strong>todo</strong> el contenido de <code>ModuleGame.h</code> y <code>ModuleGame.cpp</code> (las bolas, Rick, etc. ya no hacen falta; los tienes en el handout original) por esta escena mínima: una caja de muros y tu coche.</p>
${code(String.raw`
#pragma once

#include "Globals.h"
#include "Module.h"

class PhysBody;
class PlayerCar;

// Fase 3: solo el coche del jugador en una pista vacia
class ModuleGame : public Module
{
public:
    ModuleGame(Application* app, bool start_enabled = true);
    ~ModuleGame();

    bool Start();
    update_status Update();
    bool CleanUp();

private:
    PlayerCar* player;
    PhysBody* walls;
};
`, "cpp", "ModuleGame.h (versión de prueba)")}${code(String.raw`
#include "Globals.h"
#include "Application.h"
#include "ModuleRender.h"
#include "ModuleGame.h"
#include "ModulePhysics.h"
#include "Car.h"

ModuleGame::ModuleGame(Application* app, bool start_enabled) : Module(app, start_enabled)
{
    player = NULL;
    walls = NULL;
}

ModuleGame::~ModuleGame()
{}

bool ModuleGame::Start()
{
    App->renderer->background = Color{ 75, 78, 88, 255 }; // asphalt

    // The cars are INSIDE this loop: vertices counter-clockwise on screen
    static const int box[] = {
        20, 20,
        20, 700,
        1260, 700,
        1260, 20
    };
    walls = App->physics->CreateChain(0, 0, box, sizeof(box) / sizeof(int));

    // Angle 0: the nose points up
    player = new PlayerCar(App->physics, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 0.0f, RED);

    return true;
}

bool ModuleGame::CleanUp()
{
    App->physics->DestroyBody(player->body);
    delete player;
    player = NULL;

    App->physics->DestroyBody(walls);
    walls = NULL;

    return true;
}

update_status ModuleGame::Update()
{
    player->Update();
    player->Draw();

    DrawText(TextFormat("Speed %.1f m/s", player->GetForwardSpeed()), 30, 40, 24, RAYWHITE);
    DrawText(player->drifting ? "DRIFT" : "", 30, 70, 24, GOLD);

    return UPDATE_CONTINUE;
}
`, "cpp", "ModuleGame.cpp (versión de prueba)")}
<ul>
<li><code>CreateChain(0, 0, box, sizeof(box) / sizeof(int))</code>: los muros. <code>sizeof(box) / sizeof(int)</code> cuenta cuántos números tiene el array, para no contarlos a mano.</li>
<li><strong>El orden de los vértices importa.</strong> En Box2D 2.4 las cadenas solo chocan por un lado. Si el coche está <em>dentro</em> del recinto, los vértices van en sentido <strong>antihorario</strong> en pantalla (como aquí: arriba-izquierda → abajo-izquierda → abajo-derecha → arriba-derecha). Si los pones al revés, el coche atraviesa el muro.</li>
<li><code>CleanUp()</code>: todo lo creado con <code>new</code> se borra con <code>delete</code>, y su cuerpo con <code>DestroyBody</code>.</li>
</ul>

${nota(`<p><strong>Ya tienes un coche.</strong> Un rectángulo rojo en el centro; acelera con <kbd>W</kbd>/<kbd>↑</kbd>, gira con <kbd>A</kbd>/<kbd>D</kbd> o las flechas, frena con <kbd>S</kbd>, derrapa con <kbd>Shift</kbd> y dispara el nitro con <kbd>Espacio</kbd>. No puede salir de la pantalla. Pulsa <kbd>F1</kbd>: verás la caja roja del cuerpo físico exactamente encima del rectángulo, y podrás arrastrar el coche con el ratón.</p>`, "game", "Compila y comprueba")}
${nota(`<p><strong>El coche atraviesa los muros</strong>: vértices de la cadena en el sentido contrario. <strong>El coche patina como en hielo</strong>: falta la llamada a <code>UpdateFriction()</code> en <code>Car::Update</code>. <strong>No se mueve</strong>: revisa <code>Control</code> (¿<code>+=</code> y <code>-=</code>?) y que <code>GRAVITY_Y</code> sea 0. <strong>El dibujo no coincide con la caja de F1</strong>: revisa el <code>origin</code> de <code>DrawRectanglePro</code>.</p>`, "warn", "Si no funciona")}

<h2>Antes de seguir: juega con los números</h2>
<p>Abre <code>Car.h</code> y cambia los ajustes de uno en uno, ejecutando cada vez. Así entenderás qué hace cada uno mejor que con cualquier explicación:</p>
<div class="table-wrap"><table class="t"><thead><tr><th>Cambia…</th><th>a…</th><th>y observa</th></tr></thead><tbody>
<tr><td><code>max_lateral_dv</code></td><td>0.1f</td><td>Derrapa en cada curva</td></tr>
<tr><td><code>max_lateral_dv</code></td><td>2.0f</td><td>Va sobre raíles</td></tr>
<tr><td><code>drag</code></td><td>0.0f</td><td>No se para nunca al soltar</td></tr>
<tr><td><code>turn_speed</code></td><td>6.0f</td><td>Gira muy nervioso</td></tr>
<tr><td><code>engine_accel</code></td><td>40.0f</td><td>Sale disparado</td></tr>
</tbody></table></div>

<h2>Archivos completos de esta lección</h2>
<details class="reto"><summary><span>Archivo completo</span>PhysicEntity.h</summary>${code(String.raw`
#pragma once

#include "ModulePhysics.h"

// Base class for everything in the scene that has a physics body
class PhysicEntity
{
protected:

    PhysicEntity(PhysBody* _body)
        : body(_body)
    {
    }

public:
    virtual ~PhysicEntity() = default;

    // Called once per frame while the race is running
    virtual void Update() = 0;

public:
    PhysBody* body;
};
`, "cpp", "PhysicEntity.h")}</details><details class="reto"><summary><span>Archivo completo</span>ModuleGame.h (fase 3)</summary>${code(String.raw`
#pragma once

#include "Globals.h"
#include "Module.h"

class PhysBody;
class PlayerCar;

// Fase 3: solo el coche del jugador en una pista vacia
class ModuleGame : public Module
{
public:
    ModuleGame(Application* app, bool start_enabled = true);
    ~ModuleGame();

    bool Start();
    update_status Update();
    bool CleanUp();

private:
    PlayerCar* player;
    PhysBody* walls;
};
`, "cpp", "ModuleGame.h (fase 3)")}</details><details class="reto"><summary><span>Archivo completo</span>ModuleGame.cpp (fase 3)</summary>${code(String.raw`
#include "Globals.h"
#include "Application.h"
#include "ModuleRender.h"
#include "ModuleGame.h"
#include "ModulePhysics.h"
#include "Car.h"

ModuleGame::ModuleGame(Application* app, bool start_enabled) : Module(app, start_enabled)
{
    player = NULL;
    walls = NULL;
}

ModuleGame::~ModuleGame()
{}

bool ModuleGame::Start()
{
    App->renderer->background = Color{ 75, 78, 88, 255 }; // asphalt

    // The cars are INSIDE this loop: vertices counter-clockwise on screen
    static const int box[] = {
        20, 20,
        20, 700,
        1260, 700,
        1260, 20
    };
    walls = App->physics->CreateChain(0, 0, box, sizeof(box) / sizeof(int));

    // Angle 0: the nose points up
    player = new PlayerCar(App->physics, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 0.0f, RED);

    return true;
}

bool ModuleGame::CleanUp()
{
    App->physics->DestroyBody(player->body);
    delete player;
    player = NULL;

    App->physics->DestroyBody(walls);
    walls = NULL;

    return true;
}

update_status ModuleGame::Update()
{
    player->Update();
    player->Draw();

    DrawText(TextFormat("Speed %.1f m/s", player->GetForwardSpeed()), 30, 40, 24, RAYWHITE);
    DrawText(player->drifting ? "DRIFT" : "", 30, 70, 24, GOLD);

    return UPDATE_CONTINUE;
}
`, "cpp", "ModuleGame.cpp (fase 3)")}</details><p>(<code>Car.h</code> y <code>Car.cpp</code> completos, con la IA incluida, están al final de la lección siguiente.)</p>
<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Por qué fijamos el juego a 60 fps?", o: ["Para que se vea mejor", "Porque la física avanza 1/60 s por frame: así va a velocidad real en cualquier monitor", "Porque Raylib lo exige"], c: 1, e: "Con 144 fps y un Step(1/60) por frame, todo iría 2,4 veces más rápido." },
      { p: "El coche está DENTRO de una cadena cerrada. ¿En qué sentido van los vértices (en pantalla)?", o: ["Horario", "Antihorario", "Da igual"], c: 1, e: "Las cadenas de Box2D 2.4 chocan por un solo lado. Dentro → antihorario; fuera (isla) → horario." },
      { p: "¿Qué función convierte la caja que patina en un coche?", o: ["Drive()", "UpdateFriction(): cancela la velocidad lateral", "Draw()"], c: 1, e: "Sin ella, la velocidad antigua se conserva al girar." },
      { p: "Para el nitro (un disparo por pulsación) se usa…", o: ["IsKeyDown", "IsKeyPressed", "IsKeyReleased"], c: 1, e: "IsKeyPressed solo es verdadero el frame en que pulsas." },
      { p: "¿Qué significa “símbolo externo sin resolver” al compilar?", o: ["Falta un punto y coma", "Una función declarada en el .h no está escrita en ningún .cpp del proyecto", "Falta memoria"], c: 1, e: "O el .cpp no está añadido al proyecto." }
    ])}
`
  });
})();
