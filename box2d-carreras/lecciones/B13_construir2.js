(function () {
  const { code, nota, quiz } = Curso;
  Curso.leccion({
    id: "b13", num: "13", grupo: "Bloque 4 · Construye el juego paso a paso", corto: "Construcción II: la carrera",
    titulo: "Construcción II: la carrera completa",
    resumen: "Fases 4–9: circuito, checkpoints y vueltas, estados de carrera, turbo/aceite/nitro, rivales con IA y cómo poner tus gráficos y tu circuito.",
    intro: "Tu coche ya se conduce. Ahora le das una pista, una meta que no admite trampas, un cronómetro, una cuenta atrás, mecánicas especiales y tres rivales. Al terminar tienes un juego que cumple el enunciado del Proyecto 02.",
    objetivos: ["Cargar un circuito desde datos y dibujarlo", "Contar vueltas válidas con checkpoints en orden", "Organizar la carrera con una máquina de estados", "Añadir zonas especiales y rivales con IA", "Liberar toda la memoria y sustituir los gráficos por los tuyos"],
    html: () => `

<p>Partes del final de la lección anterior: un coche rojo que conduces dentro de una caja. Ahora lo convertimos en un juego completo. En esta lección vamos haciendo crecer <code>ModuleGame</code>; al final tienes los archivos completos para comparar.</p>
<h2 id="fase4">Fase 4 · El circuito</h2>

<p>Un circuito son <strong>datos</strong>: listas de puntos. Los guardamos en un archivo aparte, <code>Track.h</code>, para poder cambiar de circuito sin tocar el código del juego.</p>
<h3>4.1 · Track.h <span style="font-weight:400;color:var(--ink-3)">(archivo nuevo)</span></h3>
<p>Para empezar, usa este circuito de ejemplo (está pensado para la pantalla de 1280×720). Este archivo sí puedes copiarlo y pegarlo: son solo números. En la fase 9 verás cómo crear el tuyo.</p>
<details class="reto"><summary><span>Archivo completo</span>Track.h</summary>${code(String.raw`
#pragma once

// Circuito de ejemplo para una pantalla de 1280x720. Todas las medidas en PIXELES.
// Generado a partir de una linea central recorrida en sentido HORARIO en pantalla.

#define TRACK_HALF_WIDTH 58
#define CHECKPOINT_COUNT 6
#define LAPS_TO_WIN 3

// Muro exterior: los coches estan DENTRO -> vertices en sentido ANTIHORARIO en pantalla
static const int track_outer[] = {
    239, 79, 191, 99, 150, 130, 119, 171, 99, 219, 92, 267,
    92, 330, 92, 390, 92, 453, 99, 501, 119, 549, 150, 590,
    191, 621, 239, 641, 288, 648, 351, 646, 415, 641, 480, 628,
    543, 606, 597, 586, 640, 578, 683, 586, 737, 606, 800, 628,
    865, 641, 929, 646, 992, 648, 1041, 641, 1089, 621, 1130, 590,
    1161, 549, 1181, 501, 1188, 453, 1188, 390, 1188, 330, 1188, 267,
    1181, 219, 1161, 171, 1130, 130, 1089, 99, 1041, 79, 993, 72,
    920, 72, 850, 72, 780, 72, 710, 72, 640, 72, 570, 72,
    500, 72, 430, 72, 360, 72, 287, 72
};

// Isla interior: los coches estan FUERA -> vertices en sentido HORARIO en pantalla
static const int track_inner[] = {
    293, 188, 360, 188, 430, 188, 500, 188, 570, 188, 640, 188,
    710, 188, 780, 188, 850, 188, 920, 188, 987, 188, 1011, 191,
    1031, 199, 1048, 212, 1061, 229, 1069, 249, 1072, 273, 1072, 330,
    1072, 390, 1072, 447, 1069, 471, 1061, 491, 1048, 508, 1031, 521,
    1011, 529, 988, 532, 935, 530, 881, 526, 830, 516, 776, 497,
    714, 474, 640, 462, 566, 474, 504, 497, 450, 516, 399, 526,
    345, 530, 292, 532, 269, 529, 249, 521, 232, 508, 219, 491,
    211, 471, 208, 447, 208, 390, 208, 330, 208, 273, 211, 249,
    219, 229, 232, 212, 249, 199, 269, 191
};

// Trazada ideal para la IA (y para dibujar el asfalto). El ultimo punto es la meta
static const int track_waypoints[] = {
    710, 130, 780, 130, 850, 130, 920, 130, 990, 130, 1026, 135,
    1060, 149, 1089, 171, 1111, 200, 1125, 234, 1130, 270, 1130, 330,
    1130, 390, 1130, 450, 1125, 486, 1111, 520, 1089, 549, 1060, 571,
    1026, 585, 990, 590, 932, 588, 873, 584, 815, 572, 757, 552,
    698, 530, 640, 520, 582, 530, 523, 552, 465, 572, 407, 584,
    348, 588, 290, 590, 254, 585, 220, 571, 191, 549, 169, 520,
    155, 486, 150, 450, 150, 390, 150, 330, 150, 270, 155, 234,
    169, 200, 191, 171, 220, 149, 254, 135, 290, 130, 360, 130,
    430, 130, 500, 130, 570, 130, 640, 130
};
#define WAYPOINT_COUNT (int)(sizeof(track_waypoints) / sizeof(int) / 2)

// Checkpoints: sensores atravesados en la pista. El 0 es la meta. angle en radianes
struct CheckpointDef { int x, y; float angle; };
static const CheckpointDef track_checkpoints[CHECKPOINT_COUNT] = {
    { 640, 130, -1.5708f },
    { 1111, 200, -0.5236f },
    { 1089, 549, 0.7854f },
    { 640, 520, 1.5708f },
    { 191, 549, 2.3562f },
    { 169, 200, -2.6180f }
};

// Parrilla de salida: posicion y angulo (radianes; 0 = morro hacia arriba, PI/2 = hacia la derecha)
struct GridSlot { int x, y; float angle; };
static const GridSlot track_grid[4] = {
    { 590, 108, 1.5708f },
    { 545, 152, 1.5708f },
    { 500, 108, 1.5708f },
    { 455, 152, 1.5708f }
};

// Zonas especiales: { x, y, angulo del body }
static const GridSlot track_boost = { 1125, 486, -2.8798f };
static const GridSlot track_oil   = { 290, 590, -1.5372f };
`, "cpp", "Track.h")}</details>
<p>Qué contiene:</p>
<div class="table-wrap"><table class="t"><thead><tr><th>Dato</th><th>Qué es</th></tr></thead><tbody>
<tr><td><code>track_outer</code></td><td>Vértices del muro exterior. Los coches están dentro → sentido <strong>antihorario</strong>.</td></tr>
<tr><td><code>track_inner</code></td><td>Vértices de la isla central. Los coches están fuera → sentido <strong>horario</strong>.</td></tr>
<tr><td><code>track_waypoints</code></td><td>Puntos por el centro de la pista, en orden. Sirven para dibujar el asfalto y para guiar a la IA.</td></tr>
<tr><td><code>track_checkpoints</code></td><td>6 sensores atravesados en la pista (posición y ángulo). El 0 es la meta.</td></tr>
<tr><td><code>track_grid</code></td><td>4 puestos de salida (posición y ángulo).</td></tr>
<tr><td><code>track_boost</code>, <code>track_oil</code></td><td>Dónde van la placa de turbo y la mancha de aceite.</td></tr>
</tbody></table></div>

<h3>4.2 · El ModuleGame definitivo: la cabecera</h3>
<p>Sustituye <code>ModuleGame.h</code> por la versión final. Declara todo lo que iremos escribiendo en las fases siguientes.</p>
${code(String.raw`
#pragma once

#include "Globals.h"
#include "Module.h"
#include "Timer.h"

#include <vector>

class PhysBody;
class Car;
class PlayerCar;

enum RaceState
{
    RACE_COUNTDOWN,
    RACE_RUNNING,
    RACE_FINISHED
};

class ModuleGame : public Module
{
public:
    ModuleGame(Application* app, bool start_enabled = true);
    ~ModuleGame();

    bool Start();
    update_status Update();
    bool CleanUp();

    void OnCollision(PhysBody* bodyA, PhysBody* bodyB) override;
    void OnCollisionEnd(PhysBody* bodyA, PhysBody* bodyB) override;

private:
    // Everybody back to the grid. The best lap of the session is kept
    void StartRace();

    // NULL if pbody is not a car
    Car* FindCar(PhysBody* pbody) const;

    // -1 if pbody is not a checkpoint
    int FindCheckpoint(PhysBody* pbody) const;

    // How far a car is in the race: laps, checkpoints and distance to the next one
    float Progress(const Car* car) const;

    // 1 = first
    int Position(const Car* car) const;

    void DrawTrack() const;
    void DrawHUD() const;

private:
    std::vector<Car*> cars;      // cars[0] is the player
    PlayerCar* player;

    PhysBody* walls_outer;
    PhysBody* walls_inner;
    std::vector<PhysBody*> checkpoints;
    PhysBody* boost_pad;
    PhysBody* oil;

    RaceState state;
    Timer countdown;
    Timer race_timer;
    double race_time;            // total time of the player when the race ended
    int finished_count;
    double best_lap_session;     // seconds. -1 = none yet

    uint32 lap_fx;
    uint32 boost_fx;
    uint32 crash_fx;
    Timer crash_timer;           // do not play the crash sound every frame
};
`, "cpp", "ModuleGame.h")}
<p>Como el <code>.h</code> ya declara funciones que aún no existen en el <code>.cpp</code>, <strong>no compilará hasta que las escribas todas</strong>. Para ir probando fase a fase, escribe de momento cada función que falte con el cuerpo vacío (por ejemplo <code>void ModuleGame::DrawHUD() const {}</code>, o <code>return 0;</code> / <code>return NULL;</code> / <code>return -1;</code> en las que devuelven algo) y ve rellenándolas.</p>

<h3>4.3 · Inicio del .cpp y los muros</h3>
${code(String.raw`
#include "Globals.h"
#include "Application.h"
#include "ModuleRender.h"
#include "ModuleGame.h"
#include "ModuleAudio.h"
#include "ModulePhysics.h"
#include "Car.h"
#include "Track.h"

#include <math.h>

ModuleGame::ModuleGame(Application* app, bool start_enabled) : Module(app, start_enabled)
{
    player = NULL;
    walls_outer = walls_inner = NULL;
    boost_pad = oil = NULL;
    state = RACE_COUNTDOWN;
    race_time = 0.0;
    finished_count = 0;
    best_lap_session = -1.0;
    lap_fx = boost_fx = crash_fx = 0;
}

ModuleGame::~ModuleGame()
{}`, "cpp", "ModuleGame.cpp · includes y constructor")}
<p>En <code>Start()</code>, de momento, solo el fondo, los muros y tu coche en el primer puesto de la parrilla:</p>
${code(String.raw`
bool ModuleGame::Start()
{
    App->renderer->background = Color{ 70, 120, 60, 255 }; // grass

    // Walls: two closed chains
    walls_outer = App->physics->CreateChain(0, 0, track_outer, sizeof(track_outer) / sizeof(int));
    walls_inner = App->physics->CreateChain(0, 0, track_inner, sizeof(track_inner) / sizeof(int));

    player = new PlayerCar(App->physics, track_grid[0].x, track_grid[0].y, track_grid[0].angle, RED);
    cars.push_back(player);

    return true;
}`, "cpp", "ModuleGame.cpp · Start() (versión de la fase 4)")}
<h3>4.4 · Dibujar la pista</h3>
${code(String.raw`
void ModuleGame::DrawTrack() const
{
    const Color asphalt = { 75, 78, 88, 255 };

    // Asphalt: a thick line along the waypoints, with a circle on every joint
    for (int i = 0; i < WAYPOINT_COUNT; ++i)
    {
        int j = (i + 1) % WAYPOINT_COUNT;
        Vector2 a = { (float)track_waypoints[i * 2], (float)track_waypoints[i * 2 + 1] };
        Vector2 b = { (float)track_waypoints[j * 2], (float)track_waypoints[j * 2 + 1] };
        DrawLineEx(a, b, TRACK_HALF_WIDTH * 2.0f, asphalt);
        DrawCircleV(a, (float)TRACK_HALF_WIDTH, asphalt);
    }

    // Kerbs: the same vertices as the chains
    const int outer_count = sizeof(track_outer) / sizeof(int) / 2;
    for (int i = 0; i < outer_count; ++i)
    {
        int j = (i + 1) % outer_count;
        DrawLineEx(Vector2{ (float)track_outer[i * 2], (float)track_outer[i * 2 + 1] }, Vector2{ (float)track_outer[j * 2], (float)track_outer[j * 2 + 1] }, 4.0f, RAYWHITE);
    }

    const int inner_count = sizeof(track_inner) / sizeof(int) / 2;
    for (int i = 0; i < inner_count; ++i)
    {
        int j = (i + 1) % inner_count;
        DrawLineEx(Vector2{ (float)track_inner[i * 2], (float)track_inner[i * 2 + 1] }, Vector2{ (float)track_inner[j * 2], (float)track_inner[j * 2 + 1] }, 4.0f, RAYWHITE);
    }

    // Finish line
    const CheckpointDef& finish = track_checkpoints[0];
    Rectangle line = { (float)finish.x, (float)finish.y, TRACK_HALF_WIDTH * 2.0f, 8.0f };
    DrawRectanglePro(line, Vector2{ (float)TRACK_HALF_WIDTH, 4.0f }, finish.angle * RAD2DEG, RAYWHITE);

    // Zones
    Rectangle pad = { (float)track_boost.x, (float)track_boost.y, 32.0f, 44.0f };
    DrawRectanglePro(pad, Vector2{ 16.0f, 22.0f }, track_boost.angle * RAD2DEG, GOLD);

    Rectangle spill = { (float)track_oil.x, (float)track_oil.y, 60.0f, 36.0f };
    DrawRectanglePro(spill, Vector2{ 30.0f, 18.0f }, track_oil.angle * RAD2DEG, Color{ 15, 15, 25, 230 });
}`, "cpp", "ModuleGame.cpp · DrawTrack()")}
<ul>
<li><strong>Asfalto</strong>: una línea gruesa (<code>DrawLineEx</code>, de ancho <code>2 × TRACK_HALF_WIDTH</code>) entre cada waypoint y el siguiente, con un círculo en cada unión para redondear. <code>(i + 1) % WAYPOINT_COUNT</code> hace que el último se una con el primero.</li>
<li><strong>Bordillos</strong>: líneas blancas con los <em>mismos</em> vértices que los muros físicos. Así lo que ves es exactamente con lo que chocas.</li>
<li>Meta, turbo y aceite: rectángulos girados.</li>
</ul>
<p>Y en <code>Update()</code>, de momento: <code>player-&gt;Update(); DrawTrack(); player-&gt;Draw();</code></p>

${nota(`<p>Ves la pista gris sobre hierba, con bordillos blancos, la meta, una placa amarilla y una mancha negra. Tu coche sale en la recta de arriba mirando a la derecha y <strong>no puede salirse del asfalto</strong>. Con <kbd>F1</kbd> ves las dos cadenas en verde.</p>`, "game", "Compila y comprueba")}
${nota(`<p><strong>Atraviesas un muro pero no el otro</strong>: esa cadena tiene los vértices en el sentido equivocado. <strong>El coche sale mirando hacia arriba</strong>: no estás pasando <code>track_grid[0].angle</code>.</p>`, "warn", "Si no funciona")}
<h2 id="fase5">Fase 5 · Checkpoints, vueltas y HUD</h2>

<p>La idea (explicada en la <a href="#b09">lección 09</a>): varios sensores atraviesan la pista. Cada coche recuerda <strong>cuál es el siguiente que le toca</strong> (<code>next_checkpoint</code>). Solo cuenta si toca ese. Así no se puede hacer trampa cruzando la meta hacia atrás.</p>
<h3>5.1 · Crear los checkpoints</h3>
<p>En <code>Start()</code>, después de los muros:</p>
${code(String.raw`
    // Checkpoints: sensors across the track. 0 is the finish line
    for (int i = 0; i < CHECKPOINT_COUNT; ++i)
    {
        const CheckpointDef& def = track_checkpoints[i];
        PhysBody* cp = App->physics->CreateRectangleSensor(def.x, def.y, TRACK_HALF_WIDTH, 4, def.angle);
        cp->listener = this;
        checkpoints.push_back(cp);
    }`, "cpp", "ModuleGame.cpp · Start()")}
<p><code>cp-&gt;listener = this;</code> significa “cuando algo toque este sensor, avísame a mí (ModuleGame)”. Ese aviso llega a <code>OnCollision</code>.</p>

<h3>5.2 · Dos buscadores</h3>
<p><code>OnCollision</code> recibe cuerpos (<code>PhysBody*</code>), pero nosotros queremos saber <em>qué coche</em> y <em>qué checkpoint</em> son:</p>
${code(String.raw`
Car* ModuleGame::FindCar(PhysBody* pbody) const
{
    for (Car* car : cars)
    {
        if (car->body == pbody)
            return car;
    }
    return NULL;
}

int ModuleGame::FindCheckpoint(PhysBody* pbody) const
{
    for (int i = 0; i < (int)checkpoints.size(); ++i)
    {
        if (checkpoints[i] == pbody)
            return i;
    }
    return -1;
}`, "cpp", "ModuleGame.cpp · FindCar() y FindCheckpoint()")}
<h3>5.3 · OnCollision: la regla de la vuelta</h3>
${code(String.raw`
// bodyA is always the body that has this module as listener: a wall, a checkpoint or a zone
void ModuleGame::OnCollision(PhysBody* bodyA, PhysBody* bodyB)
{
    Car* car = FindCar(bodyB);
    if (car == NULL)
        return;

    // Checkpoints only count in order: no shortcuts and no driving backwards over the line
    int index = FindCheckpoint(bodyA);
    if (index < 0 || car->finished)
        return;

    if (index != car->next_checkpoint)
        return;

    car->next_checkpoint = (index + 1) % CHECKPOINT_COUNT;

    if (index == 0) // finish line
    {
        car->LapCompleted();

        if (car == player)
        {
            App->audio->PlayFx(lap_fx);
            if (best_lap_session < 0.0 || car->last_lap < best_lap_session)
                best_lap_session = car->last_lap;
        }
    }
}`, "cpp", "ModuleGame.cpp · OnCollision() (versión de la fase 5)")}
<ol>
<li>¿Quién ha tocado? Si no es un coche, nada.</li>
<li>¿Qué ha tocado? Si no es un checkpoint, nada.</li>
<li>¿Es el que le tocaba? Si no, <strong>no cuenta</strong>.</li>
<li>Avanza: el siguiente es <code>(index + 1) % CHECKPOINT_COUNT</code>. El <code>%</code> (resto de la división) hace que después del 5 venga el 0.</li>
<li>Si era el 0 (la meta) → vuelta completada. Si es el jugador, sonido y posible récord de la sesión.</li>
</ol>
<p>Carga el sonido en <code>Start()</code>: <code>lap_fx = App-&gt;audio-&gt;LoadFx("Assets/bonus.wav");</code> y arranca el cronómetro del jugador: <code>player-&gt;lap_timer.Start();</code></p>

<h3>5.4 · El HUD</h3>
<p>De momento, escribe solo la primera parte de <code>DrawHUD()</code> (hasta el nitro incluido); la cuenta atrás y el resultado llegan en la fase 6. Aquí la tienes entera:</p>
${code(String.raw`
void ModuleGame::DrawHUD() const
{
    int lap = (player->lap < LAPS_TO_WIN) ? player->lap + 1 : LAPS_TO_WIN;
    DrawText(TextFormat("Lap %d/%d", lap, LAPS_TO_WIN), 250, 215, 30, RAYWHITE);
    DrawText(TextFormat("Pos %d/%d", Position(player), (int)cars.size()), 250, 250, 30, RAYWHITE);

    // Current lap time and best of the session
    double current = (state == RACE_RUNNING) ? player->lap_timer.ReadSec() : 0.0;
    DrawText(TextFormat("Time %.2f", current), 250, 290, 24, RAYWHITE);

    if (player->last_lap >= 0.0)
        DrawText(TextFormat("Last %.2f", player->last_lap), 250, 318, 24, RAYWHITE);

    if (best_lap_session >= 0.0)
        DrawText(TextFormat("Best %.2f", best_lap_session), 250, 346, 24, GOLD);
    else
        DrawText("Best --", 250, 346, 24, GOLD);

    // Nitro
    float cooldown = player->NitroCooldown();
    if (cooldown > 0.0f)
        DrawText(TextFormat("Nitro %.1f", cooldown), 250, 380, 24, GRAY);
    else
        DrawText("Nitro READY (space)", 250, 380, 24, SKYBLUE);

    if (state == RACE_COUNTDOWN)
    {
        int seconds = 3 - (int)countdown.ReadSec();
        DrawText(TextFormat("%d", seconds), SCREEN_WIDTH / 2 - 20, 280, 120, RAYWHITE);
    }

    if (state == RACE_FINISHED)
    {
        const char* result = (player->place == 1) ? "YOU WIN!" : "YOU LOSE";
        DrawText(result, 700, 260, 60, (player->place == 1) ? GOLD : RAYWHITE);
        DrawText(TextFormat("Place %d  -  %.2f s", player->place, race_time), 700, 330, 26, RAYWHITE);
        DrawText("ENTER to race again", 700, 365, 22, RAYWHITE);
    }
}`, "cpp", "ModuleGame.cpp · DrawHUD()")}
<ul>
<li><code>TextFormat("Lap %d/%d", a, b)</code> construye un texto metiendo números: <code>%d</code> es un entero, <code>%.2f</code> un decimal con 2 cifras.</li>
<li><code>DrawText(texto, x, y, tamaño, color)</code>. El HUD está dibujado en el centro de la isla, donde no tapa la pista.</li>
<li><code>Position(player)</code> la escribirás en la fase 8; de momento haz que devuelva 1.</li>
</ul>

${nota(`<p>Da una vuelta completa: al cruzar la meta, “Lap” pasa a 2/3, aparece “Last” con tu tiempo y “Best” con el mejor. <strong>Prueba a hacer trampa</strong>: da media vuelta en la meta y vuelve a cruzarla. No debe contar.</p>`, "game", "Compila y comprueba")}
${nota(`<p><strong>No cuenta ninguna vuelta</strong>: ¿has puesto <code>cp-&gt;listener = this</code>? ¿<code>OnCollision</code> lleva <code>override</code> y está declarada en el .h? Activa F1 y comprueba que los sensores están atravesados en la pista (si están girados 90°, el ángulo no llega a <code>CreateRectangleSensor</code>).</p>`, "warn", "Si no funciona")}
<h2 id="fase6">Fase 6 · Cuenta atrás, final y reinicio</h2>

<p>Una carrera tiene tres momentos. Los llamamos <strong>estados</strong> y los guardamos en la variable <code>state</code> (el <code>enum RaceState</code> del .h):</p>
<div class="path"><span>RACE_COUNTDOWN</span><i>→ a los 3 s →</i><span>RACE_RUNNING</span><i>→ el jugador acaba →</i><span>RACE_FINISHED</span><i>→ ENTER →</i><span>RACE_COUNTDOWN</span></div>
${code(String.raw`
void ModuleGame::StartRace()
{
    for (int i = 0; i < (int)cars.size(); ++i)
        cars[i]->Reset(track_grid[i].x, track_grid[i].y, track_grid[i].angle);

    state = RACE_COUNTDOWN;
    finished_count = 0;
    race_time = 0.0;
    countdown.Start();
}`, "cpp", "ModuleGame.cpp · StartRace()")}${code(String.raw`
update_status ModuleGame::Update()
{
    // Race logic ------------------------------------------------------------
    switch (state)
    {
    case RACE_COUNTDOWN:
        if (countdown.ReadSec() >= 3.0)
        {
            state = RACE_RUNNING;
            race_timer.Start();
            for (Car* car : cars)
                car->lap_timer.Start();
            App->audio->PlayFx(lap_fx);
        }
        break;

    case RACE_RUNNING:
        // Rubber banding: rivals ahead of the player slow down a bit, rivals behind speed up
        for (int i = 1; i < (int)cars.size(); ++i)
            cars[i]->speed_factor = (Progress(cars[i]) > Progress(player)) ? 0.90f : 1.05f;

        for (Car* car : cars)
            car->Update();

        if (player->nitro_fired)
            App->audio->PlayFx(boost_fx);

        if (player->finished)
        {
            state = RACE_FINISHED;
            race_time = race_timer.ReadSec();
        }
        break;

    case RACE_FINISHED:
        // The rivals keep going until they finish too
        for (Car* car : cars)
            car->Update();
        break;
    }

    if (IsKeyPressed(KEY_R) || (state == RACE_FINISHED && IsKeyPressed(KEY_ENTER)))
        StartRace();

    // Draw ------------------------------------------------------------------
    DrawTrack();

    for (Car* car : cars)
        car->Draw();

    DrawHUD();

    return UPDATE_CONTINUE;
}`, "cpp", "ModuleGame.cpp · Update()")}
<ul>
<li><code>switch (state)</code> ejecuta solo el bloque del estado actual. No olvides el <code>break;</code> al final de cada <code>case</code>.</li>
<li>En la cuenta atrás <strong>no se llama</strong> a <code>car-&gt;Update()</code>: por eso los coches no se mueven aunque pulses.</li>
<li>Al pasar a <code>RACE_RUNNING</code> se arrancan todos los cronómetros a la vez.</li>
<li>El dibujo va <strong>después</strong> del switch y se hace siempre, en cualquier estado.</li>
<li><code>StartRace()</code> no toca <code>best_lap_session</code>: el récord dura toda la sesión, como pide el enunciado.</li>
</ul>
<p>Para que la carrera termine, añade al final del bloque de la meta en <code>OnCollision</code>:</p>
${code(String.raw`
        if (car->lap >= LAPS_TO_WIN)
        {
            car->finished = true;
            car->place = ++finished_count;
        }`, "cpp", "ModuleGame.cpp · OnCollision(), dentro de if (index == 0)")}
<p>Y cambia la condición del principio a <code>if (index &lt; 0 || state == RACE_COUNTDOWN || car-&gt;finished)</code>. Llama a <code>StartRace()</code> al final de <code>Start()</code>.</p>
<p>(Las líneas de <em>rubber banding</em> y <code>nitro_fired</code> del Update son de las fases 7 y 8: puedes escribirlas ya.)</p>

${nota(`<p>Al arrancar: 3, 2, 1 y sales. Tras 3 vueltas: “YOU WIN!” con tu tiempo total. <kbd>Enter</kbd> (o <kbd>R</kbd> en cualquier momento) reinicia la carrera y “Best” se mantiene.</p>`, "game", "Compila y comprueba")}
<h2 id="fase7">Fase 7 · Turbo, aceite y nitro</h2>

<p>Tres mecánicas especiales (el enunciado pide al menos una). Las dos zonas son <strong>sensores</strong>, igual que los checkpoints.</p>
<h3>7.1 · Crear las zonas <span style="font-weight:400;color:var(--ink-3)">(Start)</span></h3>
${code(String.raw`
    // Special zones
    boost_pad = App->physics->CreateRectangleSensor(track_boost.x, track_boost.y, 16, 22, track_boost.angle);
    boost_pad->listener = this;

    oil = App->physics->CreateRectangleSensor(track_oil.x, track_oil.y, 30, 18, track_oil.angle);
    oil->listener = this;`, "cpp", "ModuleGame.cpp · Start()")}
<h3>7.2 · Reaccionar <span style="font-weight:400;color:var(--ink-3)">(OnCollision y OnCollisionEnd)</span></h3>
<p>En <code>OnCollision</code>, después de encontrar el coche y <strong>antes</strong> de los checkpoints:</p>
${code(String.raw`
    // The world is locked here: we only write down what happened.
    // The boost force is applied later, in Car::Drive()
    if (bodyA == boost_pad)
    {
        car->boost_time = 0.6f;
        App->audio->PlayFx(boost_fx);
        return;
    }

    if (bodyA == oil)
    {
        car->in_oil++;
        return;
    }`, "cpp", "ModuleGame.cpp · OnCollision()")}${code(String.raw`
void ModuleGame::OnCollisionEnd(PhysBody* bodyA, PhysBody* bodyB)
{
    if (bodyA != oil)
        return;

    Car* car = FindCar(bodyB);
    if (car != NULL && car->in_oil > 0)
        car->in_oil--;
}`, "cpp", "ModuleGame.cpp · OnCollisionEnd()")}
${nota(`<p><strong>La regla más importante de Box2D:</strong> <code>OnCollision</code> se ejecuta en mitad del cálculo de la física. Dentro <strong>no se pueden crear ni destruir cuerpos ni empujarlos</strong>. Solo apuntamos lo que ha pasado (<code>boost_time = 0.6f</code>, <code>in_oil++</code>) y es <code>Car::Drive()</code> y <code>Car::UpdateFriction()</code>, en el frame siguiente, quienes actúan. Ya lo escribiste en la fase 2: <code>if (boost_time &gt; 0.0f)</code> y <code>if (in_oil &gt; 0)</code>.</p>`, "warn")}
<ul>
<li><strong>Aceite</strong>: un contador. Al entrar +1, al salir −1. Mientras sea mayor que 0, el agarre baja al 15 % y el coche patina.</li>
<li><strong>Turbo</strong>: 0,6 segundos de empuje extra.</li>
<li><strong>Nitro</strong>: ya funciona desde la fase 3. Solo falta su sonido, que está en el Update: <code>if (player-&gt;nitro_fired) App-&gt;audio-&gt;PlayFx(boost_fx);</code></li>
</ul>
<h3>7.3 · Sonido de choque contra el muro</h3>
<p>Haz que el módulo escuche también a los muros (<code>walls_outer-&gt;listener = this;</code> e igual el interior) y añade esto al principio de <code>OnCollision</code>, tras encontrar el coche:</p>
${code(String.raw`
    // Walls: crash sound, if the car was going fast and not too often
    if (bodyA == walls_outer || bodyA == walls_inner)
    {
        if (fabsf(car->GetForwardSpeed()) > 3.0f && crash_timer.ReadSec() > 0.3)
        {
            App->audio->PlayFx(crash_fx);
            crash_timer.Start();
        }
        return;
    }`, "cpp", "ModuleGame.cpp · OnCollision()")}
<p>El <code>crash_timer</code> evita que el sonido se repita 60 veces por segundo mientras rozas el muro. Carga <code>boost_fx</code> y <code>crash_fx</code> en Start (de momento todos usan <code>bonus.wav</code>; en la fase 9 pones los tuyos).</p>

${nota(`<p>Al pisar la placa amarilla sales disparado; en la mancha negra el coche patina; <kbd>Espacio</kbd> dispara el nitro y el HUD muestra la recarga. Los choques fuertes contra el muro suenan.</p>`, "game", "Compila y comprueba")}
<h2 id="fase8">Fase 8 · Rivales con IA</h2>

<p>Un rival es un <code>Car</code> cuya respuesta a <code>Control()</code> la calcula el ordenador. Toda la física es la misma que la tuya: por eso no hay que reescribir nada. La idea está en la <a href="#b10">lección 10</a>.</p>
<h3>8.1 · AICar en Car.h</h3>
${code(String.raw`
// Follows a list of waypoints
class AICar : public Car
{
public:
    // points: x0, y0, x1, y1... in pixels. count: number of waypoints
    AICar(ModulePhysics* physics, int x, int y, float angle, Color _color, const int* points, int count, PhysBody* wall_a, PhysBody* wall_b);

    void Reset(int x, int y, float angle) override;

protected:
    void Control(float& throttle, float& steer) override;

private:
    // Distance in pixels to the closest wall along a ray from the car, -1 if none
    int Whisker(float local_x, float local_y, int length) const;

    const int* waypoints;
    int waypoint_count;
    int target = 0;
    PhysBody* walls[2];
};`, "cpp", "Car.h (al final)")}
<h3>8.2 · AICar en Car.cpp</h3>
${code(String.raw`
// AICar -------------------------------------------------------------------

AICar::AICar(ModulePhysics* physics, int x, int y, float angle, Color _color, const int* points, int count, PhysBody* wall_a, PhysBody* wall_b)
    : Car(physics, x, y, angle, _color)
    , waypoints(points)
    , waypoint_count(count)
{
    walls[0] = wall_a;
    walls[1] = wall_b;
}

void AICar::Reset(int x, int y, float angle)
{
    Car::Reset(x, y, angle);
    target = 0;
}

int AICar::Whisker(float local_x, float local_y, int length) const
{
    int x, y;
    body->GetPosition(x, y);

    b2Vec2 direction = body->body->GetWorldVector(b2Vec2(local_x, local_y));
    direction.Normalize();

    int end_x = x + (int)(direction.x * length);
    int end_y = y + (int)(direction.y * length);

    int closest = -1;
    for (int i = 0; i < 2; ++i)
    {
        float normal_x, normal_y;
        int hit = walls[i]->RayCast(x, y, end_x, end_y, normal_x, normal_y);
        if (hit >= 0 && (closest < 0 || hit < closest))
            closest = hit;
    }
    return closest;
}

void AICar::Control(float& throttle, float& steer)
{
    b2Body* b = body->body;

    b2Vec2 goal(PIXEL_TO_METERS(waypoints[target * 2]), PIXEL_TO_METERS(waypoints[target * 2 + 1]));

    // Close enough: go for the next one
    if ((goal - b->GetPosition()).Length() < 2.2f)
    {
        target = (target + 1) % waypoint_count;
        goal.Set(PIXEL_TO_METERS(waypoints[target * 2]), PIXEL_TO_METERS(waypoints[target * 2 + 1]));
    }

    // The goal seen from the car: x > 0 is to the right, y < 0 is ahead
    b2Vec2 local = b->GetLocalPoint(goal);
    float angle = atan2f(local.x, -local.y); // 0 = straight ahead

    steer = angle * 2.0f;
    throttle = (fabsf(angle) > 0.6f) ? 0.4f : 1.0f;

    // Whiskers: a wall close on one side pushes the steering to the other side
    const int reach = 70;
    int left = Whisker(-0.5f, -1.0f, reach);
    int right = Whisker(0.5f, -1.0f, reach);
    if (left >= 0) steer += 1.5f * (1.0f - (float)left / reach);
    if (right >= 0) steer -= 1.5f * (1.0f - (float)right / reach);

    if (steer > 1.0f) steer = 1.0f;
    if (steer < -1.0f) steer = -1.0f;
}`, "cpp", "Car.cpp (al final)")}
<p>El cerebro, <code>Control()</code>, en cuatro pasos:</p>
<ol>
<li><strong>¿A qué punto voy?</strong> <code>goal</code> es el waypoint número <code>target</code>. Si estoy a menos de 2,2 m, paso al siguiente.</li>
<li><strong>¿Dónde está, visto desde mi coche?</strong> <code>GetLocalPoint(goal)</code> lo convierte: <code>local.x &gt; 0</code> es “a mi derecha”, <code>local.y &lt; 0</code> es “delante”.</li>
<li><strong>¿Cuánto giro?</strong> <code>atan2f(local.x, -local.y)</code> da el ángulo hacia el objetivo: 0 si está justo delante. Giro proporcional a ese ángulo, y si la curva es cerrada (más de 0,6 rad) levanto el pie.</li>
<li><strong>Bigotes</strong>: dos rayos en diagonal desde el morro (<code>Whisker</code>, que usa el <code>RayCast</code> del handout contra los dos muros). Si uno toca un muro cerca, corrijo hacia el otro lado.</li>
</ol>
<h3>8.3 · Crear los rivales y ordenar la carrera</h3>
<p>En <code>Start()</code>, después de crear al jugador:</p>
${code(String.raw`
    const Color rival_colors[3] = { BLUE, GOLD, PURPLE };
    for (int i = 0; i < 3; ++i)
    {
        const GridSlot& slot = track_grid[i + 1];
        cars.push_back(new AICar(App->physics, slot.x, slot.y, slot.angle, rival_colors[i], track_waypoints, WAYPOINT_COUNT, walls_outer, walls_inner));
    }`, "cpp", "ModuleGame.cpp · Start()")}${code(String.raw`
float ModuleGame::Progress(const Car* car) const
{
    // Checkpoints done in this lap
    int done = (car->next_checkpoint - 1 + CHECKPOINT_COUNT) % CHECKPOINT_COUNT;

    // Closer to the next checkpoint = further in the race
    int x, y;
    car->body->GetPosition(x, y);
    const CheckpointDef& next = track_checkpoints[car->next_checkpoint];
    float dx = (float)(next.x - x);
    float dy = (float)(next.y - y);
    float distance = sqrtf(dx * dx + dy * dy);

    return (float)(car->lap * CHECKPOINT_COUNT + done) - distance / 10000.0f;
}

int ModuleGame::Position(const Car* car) const
{
    if (car->place > 0)
        return car->place;

    // Cars that already finished are ahead. Then, the ones with more progress
    int position = 1 + finished_count;
    for (const Car* other : cars)
    {
        if (other != car && other->place == 0 && Progress(other) > Progress(car))
            position++;
    }
    return position;
}`, "cpp", "ModuleGame.cpp · Progress() y Position()")}
<ul>
<li><code>Progress</code>: un número que crece según avanzas: vueltas × 6 + checkpoints pasados, menos un poquito según lo lejos que estés del siguiente. Quien tenga más, va delante.</li>
<li><code>Position</code>: cuenta cuántos coches llevan más progreso que tú.</li>
<li><strong>Rubber banding</strong> (ya está en el Update de la fase 6): los rivales que van por delante corren al 90 % y los que van por detrás al 105 %. Mantiene la carrera igualada.</li>
</ul>

${nota(`<p>Tres coches (azul, dorado y morado) salen contigo y dan vueltas solos sin chocar. El HUD muestra tu posición (“Pos 2/4”). Si llegas primero: “YOU WIN!”; si no, “YOU LOSE”. Con <kbd>F1</kbd> puedes agarrar un rival con el ratón, soltarlo en otro sitio y ver cómo vuelve a su trazada.</p>`, "game", "Compila y comprueba")}
${nota(`<p><strong>Los rivales van hacia atrás o en círculos</strong>: los waypoints no están en el orden de la carrera, o el radio de llegada (2,2 m) es demasiado pequeño para tu pista. <strong>Se estampan en las curvas</strong>: baja su <code>max_speed</code> o añade más waypoints en esa curva.</p>`, "warn", "Si no funciona")}
<h2 id="fase9">Fase 9 · Limpieza y tu propio juego</h2>

<h3>9.1 · CleanUp: no dejar nada sin borrar</h3>
<p>La mitad de la nota del código es “sin fugas de memoria”. Cada <code>new</code> y cada <code>Create…</code> de <code>Start()</code> tiene aquí su pareja:</p>
${code(String.raw`
bool ModuleGame::CleanUp()
{
    LOG("Unloading race");

    // Everything we created with new is deleted here, and its body destroyed
    for (Car* car : cars)
    {
        App->physics->DestroyBody(car->body);
        delete car;
    }
    cars.clear();
    player = NULL;

    for (PhysBody* cp : checkpoints)
        App->physics->DestroyBody(cp);
    checkpoints.clear();

    App->physics->DestroyBody(boost_pad);
    App->physics->DestroyBody(oil);
    App->physics->DestroyBody(walls_outer);
    App->physics->DestroyBody(walls_inner);
    boost_pad = oil = walls_outer = walls_inner = NULL;

    return true;
}`, "cpp", "ModuleGame.cpp · CleanUp()")}
<h3>9.2 · De rectángulos a tus texturas</h3>
<p>Guarda un <code>Texture2D texture;</code> en <code>Car</code>, cárgala una vez en ModuleGame (<code>LoadTexture("Assets/car_red.png")</code>, y <code>UnloadTexture</code> en CleanUp) y cambia <code>Car::Draw()</code>:</p>
${code(String.raw`
void Car::Draw() const
{
    int x, y;
    body->GetPosition(x, y);

    Rectangle source = { 0.0f, 0.0f, (float)texture.width, (float)texture.height };
    Rectangle dest   = { (float)x, (float)y, half_width * 2.0f, half_height * 2.0f };   // del tamaño del cuerpo
    Vector2 origin   = { (float)half_width, (float)half_height };
    DrawTexturePro(texture, source, dest, origin, body->GetRotation() * RAD2DEG, WHITE);
}`, "cpp", "Car.cpp · Draw() con textura")}
<p>La imagen del coche debe estar dibujada <strong>mirando hacia arriba</strong> (el forward es (0, −1)). Para la pista, dibuja tu imagen de fondo con <code>DrawTexture(track_texture, 0, 0, WHITE)</code> en lugar de <code>DrawTrack()</code>.</p>

<h3>9.3 · Tu propio circuito</h3>
<ol>
<li>Dibuja o consigue la imagen del circuito (1280×720 si no quieres cámara).</li>
<li>Con el <em>shape creator</em> de Ric (el de la lección 2), arrastra la imagen y haz clic por el <strong>borde exterior en sentido antihorario</strong>; ESC copia los vértices → pégalos en <code>track_outer</code>.</li>
<li>Lo mismo con la <strong>isla, en sentido horario</strong> → <code>track_inner</code>.</li>
<li>Haz clic por el <strong>centro de la pista en el sentido de la carrera</strong>, empezando justo después de la meta y terminando en la meta → <code>track_waypoints</code>. Un punto cada 60–80 px; más en las curvas.</li>
<li>Elige 6 puntos repartidos para <code>track_checkpoints</code> (el primero, la meta). El ángulo: 1.5708f (90°) si la pista va en horizontal en ese punto, 0 si va en vertical, y valores intermedios en curvas. Compruébalos con F1.</li>
<li>Coloca la parrilla detrás de la meta.</li>
</ol>

<h3>9.4 · Sonidos y pulido</h3>
<ul>
<li>Cambia cada <code>LoadFx("Assets/bonus.wav")</code> por tu sonido: salida, vuelta, turbo, choque, victoria.</li>
<li>Música: <code>App-&gt;audio-&gt;PlayMusic("Assets/music.ogg");</code> en Start.</li>
<li>Marcas de derrape y humo: cada coche tiene <code>drifting</code> a true cuando derrapa.</li>
<li>Una pantalla de título es un estado más: <code>RACE_TITLE</code> antes de <code>RACE_COUNTDOWN</code>.</li>
</ul>
<p>Cuando lo tengas, repasa la checklist de entrega de la <a href="#b11">lección 11</a>.</p>

${nota(`<p>Cierra el juego y mira la ventana <em>Salida</em> de Visual Studio con la detección de fugas activada (lección 11): no debe aparecer “Detected memory leaks!”. Reinicia la carrera varias veces con <kbd>R</kbd> antes de cerrar para asegurarte.</p>`, "game", "Compila y comprueba")}

<h2>Lo que cumple este juego del enunciado</h2>
<div class="table-wrap"><table class="t"><thead><tr><th>Requisito</th><th>Dónde está</th></tr></thead><tbody>
<tr><td>Control con flechas y/o A, D</td><td><code>PlayerCar::Control</code></td></tr>
<tr><td>Acción extra con espacio</td><td>Nitro</td></tr>
<tr><td>Principio y final claros, tiempo por vuelta</td><td>Estados + <code>LapCompleted</code></td></tr>
<tr><td>Tiempo actual y mejor de la sesión</td><td><code>DrawHUD</code> + <code>best_lap_session</code></td></tr>
<tr><td>Rivales con IA</td><td><code>AICar</code></td></tr>
<tr><td>F1: formas y mouse joint</td><td>Ya venía en <code>ModulePhysics</code></td></tr>
<tr><td>Jugable sin debug</td><td><code>debug = false</code></td></tr>
<tr><td>Mecánica especial</td><td>Turbo, aceite, nitro</td></tr>
<tr><td>Tiempo real</td><td><code>SetTargetFPS(60)</code></td></tr>
<tr><td>Efectos de sonido</td><td>Salida, vuelta, turbo, nitro, choque (pon los tuyos)</td></tr>
</tbody></table></div>
<p>Te falta lo que es tuyo: elegir el juego original, sus gráficos y sonidos, tu circuito, el README y la release.</p>

<h2>Archivos completos</h2>
<p>Estos son los archivos finales, tal como los he compilado y probado. Úsalos para comparar cuando algo no te funcione. También están en la carpeta <code>box2d-carreras/juego/Source</code> del repositorio (cópialos encima de los de tu handout si quieres partir del juego ya hecho).</p>
<details class="reto"><summary><span>Archivo completo</span>Car.h</summary>${code(String.raw`
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
};

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
};

// Follows a list of waypoints
class AICar : public Car
{
public:
    // points: x0, y0, x1, y1... in pixels. count: number of waypoints
    AICar(ModulePhysics* physics, int x, int y, float angle, Color _color, const int* points, int count, PhysBody* wall_a, PhysBody* wall_b);

    void Reset(int x, int y, float angle) override;

protected:
    void Control(float& throttle, float& steer) override;

private:
    // Distance in pixels to the closest wall along a ray from the car, -1 if none
    int Whisker(float local_x, float local_y, int length) const;

    const int* waypoints;
    int waypoint_count;
    int target = 0;
    PhysBody* walls[2];
};
`, "cpp", "Car.h")}</details><details class="reto"><summary><span>Archivo completo</span>Car.cpp</summary>${code(String.raw`
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
}

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
}

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
}

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
}

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
}

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
}

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
}

// AICar -------------------------------------------------------------------

AICar::AICar(ModulePhysics* physics, int x, int y, float angle, Color _color, const int* points, int count, PhysBody* wall_a, PhysBody* wall_b)
    : Car(physics, x, y, angle, _color)
    , waypoints(points)
    , waypoint_count(count)
{
    walls[0] = wall_a;
    walls[1] = wall_b;
}

void AICar::Reset(int x, int y, float angle)
{
    Car::Reset(x, y, angle);
    target = 0;
}

int AICar::Whisker(float local_x, float local_y, int length) const
{
    int x, y;
    body->GetPosition(x, y);

    b2Vec2 direction = body->body->GetWorldVector(b2Vec2(local_x, local_y));
    direction.Normalize();

    int end_x = x + (int)(direction.x * length);
    int end_y = y + (int)(direction.y * length);

    int closest = -1;
    for (int i = 0; i < 2; ++i)
    {
        float normal_x, normal_y;
        int hit = walls[i]->RayCast(x, y, end_x, end_y, normal_x, normal_y);
        if (hit >= 0 && (closest < 0 || hit < closest))
            closest = hit;
    }
    return closest;
}

void AICar::Control(float& throttle, float& steer)
{
    b2Body* b = body->body;

    b2Vec2 goal(PIXEL_TO_METERS(waypoints[target * 2]), PIXEL_TO_METERS(waypoints[target * 2 + 1]));

    // Close enough: go for the next one
    if ((goal - b->GetPosition()).Length() < 2.2f)
    {
        target = (target + 1) % waypoint_count;
        goal.Set(PIXEL_TO_METERS(waypoints[target * 2]), PIXEL_TO_METERS(waypoints[target * 2 + 1]));
    }

    // The goal seen from the car: x > 0 is to the right, y < 0 is ahead
    b2Vec2 local = b->GetLocalPoint(goal);
    float angle = atan2f(local.x, -local.y); // 0 = straight ahead

    steer = angle * 2.0f;
    throttle = (fabsf(angle) > 0.6f) ? 0.4f : 1.0f;

    // Whiskers: a wall close on one side pushes the steering to the other side
    const int reach = 70;
    int left = Whisker(-0.5f, -1.0f, reach);
    int right = Whisker(0.5f, -1.0f, reach);
    if (left >= 0) steer += 1.5f * (1.0f - (float)left / reach);
    if (right >= 0) steer -= 1.5f * (1.0f - (float)right / reach);

    if (steer > 1.0f) steer = 1.0f;
    if (steer < -1.0f) steer = -1.0f;
}
`, "cpp", "Car.cpp")}</details><details class="reto"><summary><span>Archivo completo</span>ModuleGame.h</summary>${code(String.raw`
#pragma once

#include "Globals.h"
#include "Module.h"
#include "Timer.h"

#include <vector>

class PhysBody;
class Car;
class PlayerCar;

enum RaceState
{
    RACE_COUNTDOWN,
    RACE_RUNNING,
    RACE_FINISHED
};

class ModuleGame : public Module
{
public:
    ModuleGame(Application* app, bool start_enabled = true);
    ~ModuleGame();

    bool Start();
    update_status Update();
    bool CleanUp();

    void OnCollision(PhysBody* bodyA, PhysBody* bodyB) override;
    void OnCollisionEnd(PhysBody* bodyA, PhysBody* bodyB) override;

private:
    // Everybody back to the grid. The best lap of the session is kept
    void StartRace();

    // NULL if pbody is not a car
    Car* FindCar(PhysBody* pbody) const;

    // -1 if pbody is not a checkpoint
    int FindCheckpoint(PhysBody* pbody) const;

    // How far a car is in the race: laps, checkpoints and distance to the next one
    float Progress(const Car* car) const;

    // 1 = first
    int Position(const Car* car) const;

    void DrawTrack() const;
    void DrawHUD() const;

private:
    std::vector<Car*> cars;      // cars[0] is the player
    PlayerCar* player;

    PhysBody* walls_outer;
    PhysBody* walls_inner;
    std::vector<PhysBody*> checkpoints;
    PhysBody* boost_pad;
    PhysBody* oil;

    RaceState state;
    Timer countdown;
    Timer race_timer;
    double race_time;            // total time of the player when the race ended
    int finished_count;
    double best_lap_session;     // seconds. -1 = none yet

    uint32 lap_fx;
    uint32 boost_fx;
    uint32 crash_fx;
    Timer crash_timer;           // do not play the crash sound every frame
};
`, "cpp", "ModuleGame.h")}</details><details class="reto"><summary><span>Archivo completo</span>ModuleGame.cpp</summary>${code(String.raw`
#include "Globals.h"
#include "Application.h"
#include "ModuleRender.h"
#include "ModuleGame.h"
#include "ModuleAudio.h"
#include "ModulePhysics.h"
#include "Car.h"
#include "Track.h"

#include <math.h>

ModuleGame::ModuleGame(Application* app, bool start_enabled) : Module(app, start_enabled)
{
    player = NULL;
    walls_outer = walls_inner = NULL;
    boost_pad = oil = NULL;
    state = RACE_COUNTDOWN;
    race_time = 0.0;
    finished_count = 0;
    best_lap_session = -1.0;
    lap_fx = boost_fx = crash_fx = 0;
}

ModuleGame::~ModuleGame()
{}

bool ModuleGame::Start()
{
    LOG("Loading race");

    App->renderer->background = Color{ 70, 120, 60, 255 }; // grass

    lap_fx = App->audio->LoadFx("Assets/bonus.wav");
    boost_fx = App->audio->LoadFx("Assets/bonus.wav");
    crash_fx = App->audio->LoadFx("Assets/bonus.wav");

    // Walls: two closed chains. The module listens to them to play the crash sound
    walls_outer = App->physics->CreateChain(0, 0, track_outer, sizeof(track_outer) / sizeof(int));
    walls_inner = App->physics->CreateChain(0, 0, track_inner, sizeof(track_inner) / sizeof(int));
    walls_outer->listener = this;
    walls_inner->listener = this;

    // Checkpoints: sensors across the track. 0 is the finish line
    for (int i = 0; i < CHECKPOINT_COUNT; ++i)
    {
        const CheckpointDef& def = track_checkpoints[i];
        PhysBody* cp = App->physics->CreateRectangleSensor(def.x, def.y, TRACK_HALF_WIDTH, 4, def.angle);
        cp->listener = this;
        checkpoints.push_back(cp);
    }

    // Special zones
    boost_pad = App->physics->CreateRectangleSensor(track_boost.x, track_boost.y, 16, 22, track_boost.angle);
    boost_pad->listener = this;

    oil = App->physics->CreateRectangleSensor(track_oil.x, track_oil.y, 30, 18, track_oil.angle);
    oil->listener = this;

    // Cars: the player and three rivals
    player = new PlayerCar(App->physics, track_grid[0].x, track_grid[0].y, track_grid[0].angle, RED);
    cars.push_back(player);

    const Color rival_colors[3] = { BLUE, GOLD, PURPLE };
    for (int i = 0; i < 3; ++i)
    {
        const GridSlot& slot = track_grid[i + 1];
        cars.push_back(new AICar(App->physics, slot.x, slot.y, slot.angle, rival_colors[i], track_waypoints, WAYPOINT_COUNT, walls_outer, walls_inner));
    }

    StartRace();

    return true;
}

bool ModuleGame::CleanUp()
{
    LOG("Unloading race");

    // Everything we created with new is deleted here, and its body destroyed
    for (Car* car : cars)
    {
        App->physics->DestroyBody(car->body);
        delete car;
    }
    cars.clear();
    player = NULL;

    for (PhysBody* cp : checkpoints)
        App->physics->DestroyBody(cp);
    checkpoints.clear();

    App->physics->DestroyBody(boost_pad);
    App->physics->DestroyBody(oil);
    App->physics->DestroyBody(walls_outer);
    App->physics->DestroyBody(walls_inner);
    boost_pad = oil = walls_outer = walls_inner = NULL;

    return true;
}

void ModuleGame::StartRace()
{
    for (int i = 0; i < (int)cars.size(); ++i)
        cars[i]->Reset(track_grid[i].x, track_grid[i].y, track_grid[i].angle);

    state = RACE_COUNTDOWN;
    finished_count = 0;
    race_time = 0.0;
    countdown.Start();
}

update_status ModuleGame::Update()
{
    // Race logic ------------------------------------------------------------
    switch (state)
    {
    case RACE_COUNTDOWN:
        if (countdown.ReadSec() >= 3.0)
        {
            state = RACE_RUNNING;
            race_timer.Start();
            for (Car* car : cars)
                car->lap_timer.Start();
            App->audio->PlayFx(lap_fx);
        }
        break;

    case RACE_RUNNING:
        // Rubber banding: rivals ahead of the player slow down a bit, rivals behind speed up
        for (int i = 1; i < (int)cars.size(); ++i)
            cars[i]->speed_factor = (Progress(cars[i]) > Progress(player)) ? 0.90f : 1.05f;

        for (Car* car : cars)
            car->Update();

        if (player->nitro_fired)
            App->audio->PlayFx(boost_fx);

        if (player->finished)
        {
            state = RACE_FINISHED;
            race_time = race_timer.ReadSec();
        }
        break;

    case RACE_FINISHED:
        // The rivals keep going until they finish too
        for (Car* car : cars)
            car->Update();
        break;
    }

    if (IsKeyPressed(KEY_R) || (state == RACE_FINISHED && IsKeyPressed(KEY_ENTER)))
        StartRace();

    // Draw ------------------------------------------------------------------
    DrawTrack();

    for (Car* car : cars)
        car->Draw();

    DrawHUD();

    return UPDATE_CONTINUE;
}

// bodyA is always the body that has this module as listener: a wall, a checkpoint or a zone
void ModuleGame::OnCollision(PhysBody* bodyA, PhysBody* bodyB)
{
    Car* car = FindCar(bodyB);
    if (car == NULL)
        return;

    // Walls: crash sound, if the car was going fast and not too often
    if (bodyA == walls_outer || bodyA == walls_inner)
    {
        if (fabsf(car->GetForwardSpeed()) > 3.0f && crash_timer.ReadSec() > 0.3)
        {
            App->audio->PlayFx(crash_fx);
            crash_timer.Start();
        }
        return;
    }

    // The world is locked here: we only write down what happened.
    // The boost force is applied later, in Car::Drive()
    if (bodyA == boost_pad)
    {
        car->boost_time = 0.6f;
        App->audio->PlayFx(boost_fx);
        return;
    }

    if (bodyA == oil)
    {
        car->in_oil++;
        return;
    }

    // Checkpoints only count in order: no shortcuts and no driving backwards over the line
    int index = FindCheckpoint(bodyA);
    if (index < 0 || state == RACE_COUNTDOWN || car->finished)
        return;

    if (index != car->next_checkpoint)
        return;

    car->next_checkpoint = (index + 1) % CHECKPOINT_COUNT;

    if (index == 0) // finish line
    {
        car->LapCompleted();

        if (car == player)
        {
            App->audio->PlayFx(lap_fx);
            if (best_lap_session < 0.0 || car->last_lap < best_lap_session)
                best_lap_session = car->last_lap;
        }

        if (car->lap >= LAPS_TO_WIN)
        {
            car->finished = true;
            car->place = ++finished_count;
        }
    }
}

void ModuleGame::OnCollisionEnd(PhysBody* bodyA, PhysBody* bodyB)
{
    if (bodyA != oil)
        return;

    Car* car = FindCar(bodyB);
    if (car != NULL && car->in_oil > 0)
        car->in_oil--;
}

Car* ModuleGame::FindCar(PhysBody* pbody) const
{
    for (Car* car : cars)
    {
        if (car->body == pbody)
            return car;
    }
    return NULL;
}

int ModuleGame::FindCheckpoint(PhysBody* pbody) const
{
    for (int i = 0; i < (int)checkpoints.size(); ++i)
    {
        if (checkpoints[i] == pbody)
            return i;
    }
    return -1;
}

float ModuleGame::Progress(const Car* car) const
{
    // Checkpoints done in this lap
    int done = (car->next_checkpoint - 1 + CHECKPOINT_COUNT) % CHECKPOINT_COUNT;

    // Closer to the next checkpoint = further in the race
    int x, y;
    car->body->GetPosition(x, y);
    const CheckpointDef& next = track_checkpoints[car->next_checkpoint];
    float dx = (float)(next.x - x);
    float dy = (float)(next.y - y);
    float distance = sqrtf(dx * dx + dy * dy);

    return (float)(car->lap * CHECKPOINT_COUNT + done) - distance / 10000.0f;
}

int ModuleGame::Position(const Car* car) const
{
    if (car->place > 0)
        return car->place;

    // Cars that already finished are ahead. Then, the ones with more progress
    int position = 1 + finished_count;
    for (const Car* other : cars)
    {
        if (other != car && other->place == 0 && Progress(other) > Progress(car))
            position++;
    }
    return position;
}

void ModuleGame::DrawTrack() const
{
    const Color asphalt = { 75, 78, 88, 255 };

    // Asphalt: a thick line along the waypoints, with a circle on every joint
    for (int i = 0; i < WAYPOINT_COUNT; ++i)
    {
        int j = (i + 1) % WAYPOINT_COUNT;
        Vector2 a = { (float)track_waypoints[i * 2], (float)track_waypoints[i * 2 + 1] };
        Vector2 b = { (float)track_waypoints[j * 2], (float)track_waypoints[j * 2 + 1] };
        DrawLineEx(a, b, TRACK_HALF_WIDTH * 2.0f, asphalt);
        DrawCircleV(a, (float)TRACK_HALF_WIDTH, asphalt);
    }

    // Kerbs: the same vertices as the chains
    const int outer_count = sizeof(track_outer) / sizeof(int) / 2;
    for (int i = 0; i < outer_count; ++i)
    {
        int j = (i + 1) % outer_count;
        DrawLineEx(Vector2{ (float)track_outer[i * 2], (float)track_outer[i * 2 + 1] }, Vector2{ (float)track_outer[j * 2], (float)track_outer[j * 2 + 1] }, 4.0f, RAYWHITE);
    }

    const int inner_count = sizeof(track_inner) / sizeof(int) / 2;
    for (int i = 0; i < inner_count; ++i)
    {
        int j = (i + 1) % inner_count;
        DrawLineEx(Vector2{ (float)track_inner[i * 2], (float)track_inner[i * 2 + 1] }, Vector2{ (float)track_inner[j * 2], (float)track_inner[j * 2 + 1] }, 4.0f, RAYWHITE);
    }

    // Finish line
    const CheckpointDef& finish = track_checkpoints[0];
    Rectangle line = { (float)finish.x, (float)finish.y, TRACK_HALF_WIDTH * 2.0f, 8.0f };
    DrawRectanglePro(line, Vector2{ (float)TRACK_HALF_WIDTH, 4.0f }, finish.angle * RAD2DEG, RAYWHITE);

    // Zones
    Rectangle pad = { (float)track_boost.x, (float)track_boost.y, 32.0f, 44.0f };
    DrawRectanglePro(pad, Vector2{ 16.0f, 22.0f }, track_boost.angle * RAD2DEG, GOLD);

    Rectangle spill = { (float)track_oil.x, (float)track_oil.y, 60.0f, 36.0f };
    DrawRectanglePro(spill, Vector2{ 30.0f, 18.0f }, track_oil.angle * RAD2DEG, Color{ 15, 15, 25, 230 });
}

void ModuleGame::DrawHUD() const
{
    int lap = (player->lap < LAPS_TO_WIN) ? player->lap + 1 : LAPS_TO_WIN;
    DrawText(TextFormat("Lap %d/%d", lap, LAPS_TO_WIN), 250, 215, 30, RAYWHITE);
    DrawText(TextFormat("Pos %d/%d", Position(player), (int)cars.size()), 250, 250, 30, RAYWHITE);

    // Current lap time and best of the session
    double current = (state == RACE_RUNNING) ? player->lap_timer.ReadSec() : 0.0;
    DrawText(TextFormat("Time %.2f", current), 250, 290, 24, RAYWHITE);

    if (player->last_lap >= 0.0)
        DrawText(TextFormat("Last %.2f", player->last_lap), 250, 318, 24, RAYWHITE);

    if (best_lap_session >= 0.0)
        DrawText(TextFormat("Best %.2f", best_lap_session), 250, 346, 24, GOLD);
    else
        DrawText("Best --", 250, 346, 24, GOLD);

    // Nitro
    float cooldown = player->NitroCooldown();
    if (cooldown > 0.0f)
        DrawText(TextFormat("Nitro %.1f", cooldown), 250, 380, 24, GRAY);
    else
        DrawText("Nitro READY (space)", 250, 380, 24, SKYBLUE);

    if (state == RACE_COUNTDOWN)
    {
        int seconds = 3 - (int)countdown.ReadSec();
        DrawText(TextFormat("%d", seconds), SCREEN_WIDTH / 2 - 20, 280, 120, RAYWHITE);
    }

    if (state == RACE_FINISHED)
    {
        const char* result = (player->place == 1) ? "YOU WIN!" : "YOU LOSE";
        DrawText(result, 700, 260, 60, (player->place == 1) ? GOLD : RAYWHITE);
        DrawText(TextFormat("Place %d  -  %.2f s", player->place, race_time), 700, 330, 26, RAYWHITE);
        DrawText("ENTER to race again", 700, 365, 22, RAYWHITE);
    }
}
`, "cpp", "ModuleGame.cpp")}</details><details class="reto"><summary><span>Archivo completo</span>PhysicEntity.h</summary>${code(String.raw`
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
`, "cpp", "PhysicEntity.h")}</details><details class="reto"><summary><span>Archivo completo</span>ModulePhysics.h (modificado)</summary>${code(String.raw`
#pragma once

#include "Module.h"
#include "Globals.h"

#include "box2d/box2d.h"

// Gravity in m/s^2. Screen Y grows DOWNWARDS and we convert meters <-> pixels without flipping Y,
// so a POSITIVE Y gravity makes bodies fall down on screen. That is why the world receives -GRAVITY_Y.
// No gravity to the bottom of the screen
#define GRAVITY_X 0.0f
#define GRAVITY_Y 0.0f

// Top view: gravity points into the screen. Box2D never sees it.
// We only need it for the normal force: N = m * g
#define GRAVITY_Z 9.8f

// Fixed time step of world->Step()
#define PHYSICS_DT (1.0f / 60.0f)

// Units: Box2D works in meters (float), raylib draws in pixels (int)
#define PIXELS_PER_METER 50.0f // if touched change METER_PER_PIXEL too
#define METER_PER_PIXEL 0.02f  // this is 1 / PIXELS_PER_METER !

#define METERS_TO_PIXELS(m) ((int) floor(PIXELS_PER_METER * (m)))
#define PIXEL_TO_METERS(p)  ((float) METER_PER_PIXEL * (p))

// Small class to return to other modules to track position and rotation of physics bodies
class PhysBody
{
public:
    PhysBody() : body(NULL), listener(NULL)
    {}

    void GetPosition(int& x, int& y) const;
    float GetRotation() const;
    bool Contains(int x, int y) const;
    int RayCast(int x1, int y1, int x2, int y2, float& normal_x, float& normal_y) const;

public:
    b2Body* body;
    // Module that listens to the collisions of this body
    Module* listener;
};

// Module --------------------------------------
class ModulePhysics : public Module, public b2ContactListener
{
public:
    ModulePhysics(Application* app, bool start_enabled = true);
    ~ModulePhysics();

    bool Start();
    update_status PreUpdate();
    update_status PostUpdate();
    bool CleanUp();

    PhysBody* CreateCircle(int x, int y, int radius, float density = 1.0f);
    PhysBody* CreateRectangle(int x, int y, int half_width, int half_height);
    // angle in radians: sensors across the track need to be rotated
    PhysBody* CreateRectangleSensor(int x, int y, int half_width, int half_height, float angle = 0.0f);
    PhysBody* CreateChain(int x, int y, const int* points, int size);

    void DestroyBody(PhysBody* pbody);

    // Top view friction against the floor. applied_force: the other forces on the body this frame (N)
    void ApplyFriction(PhysBody* pbody, b2Vec2 applied_force);

    void BeginContact(b2Contact* contact) override;
    void EndContact(b2Contact* contact) override;

public:

    // Friction coefficients against the floor
    float static_friction;
    float dynamic_friction;

private:

    bool debug;
    b2World* world;

    // Static body with no fixtures, needed to create joints like the mouse joint
    b2Body* ground;
    b2MouseJoint* mouse_joint;
};
`, "cpp", "ModulePhysics.h (modificado)")}</details><details class="reto"><summary><span>Archivo completo</span>ModulePhysics.cpp (modificado)</summary>${code(String.raw`
#include "Globals.h"
#include "Application.h"
#include "ModuleRender.h"
#include "ModulePhysics.h"

#include "p2Point.h"

#include <math.h>

ModulePhysics::ModulePhysics(Application* app, bool start_enabled) : Module(app, start_enabled)
{
    world = NULL;
    ground = NULL;
    mouse_joint = NULL;
    debug = false; // F1 toggles it: the game must be playable without debug info

    // Some floor friction: heavy balls slow down and the light ones catch them
    static_friction = 0.0f;
    dynamic_friction = 0.1f;
}

// Destructor
ModulePhysics::~ModulePhysics()
{
}

bool ModulePhysics::Start()
{
    LOG("Creating Physics 2D environment");

    // Assign the member variable (do NOT declare a local "b2World* world" here, it would shadow the member)
    world = new b2World(b2Vec2(GRAVITY_X, -GRAVITY_Y));

    world->SetContactListener(this);

    // Needed to create joints like the mouse joint
    b2BodyDef bd;
    ground = world->CreateBody(&bd);

    return true;
}

update_status ModulePhysics::PreUpdate()
{
    world->Step(PHYSICS_DT, 8, 3);

    return UPDATE_CONTINUE;
}

update_status ModulePhysics::PostUpdate()
{
    if (IsKeyPressed(KEY_F1))
    {
        debug = !debug;
    }

    if (!debug)
    {
        // The mouse joint only lives in debug mode
        if (mouse_joint != NULL)
        {
            world->DestroyJoint(mouse_joint);
            mouse_joint = NULL;
        }
        return UPDATE_CONTINUE;
    }

    b2Vec2 mouse_position(PIXEL_TO_METERS(GetMouseX()), PIXEL_TO_METERS(GetMouseY()));
    b2Body* body_clicked = NULL;

    // Bonus code: this will iterate all objects in the world and draw the circles
    for (b2Body* b = world->GetBodyList(); b; b = b->GetNext())
    {
        for(b2Fixture* f = b->GetFixtureList(); f; f = f->GetNext())
        {
            switch(f->GetType())
            {
                // Draw circles ------------------------------------------------
                case b2Shape::e_circle:
                {
                    b2CircleShape* shape = (b2CircleShape*)f->GetShape();
                    b2Vec2 pos = f->GetBody()->GetPosition();
                    
                    DrawCircle(METERS_TO_PIXELS(pos.x), METERS_TO_PIXELS(pos.y), (float)METERS_TO_PIXELS(shape->m_radius), Color{0, 0, 0, 128});

                    // Radius line to see the rotation
                    b2Vec2 edge = b->GetWorldPoint(b2Vec2(shape->m_radius, 0.0f));
                    DrawLine(METERS_TO_PIXELS(pos.x), METERS_TO_PIXELS(pos.y), METERS_TO_PIXELS(edge.x), METERS_TO_PIXELS(edge.y), WHITE);
                }
                break;

                // Draw polygons ------------------------------------------------
                case b2Shape::e_polygon:
                {
                    b2PolygonShape* polygonShape = (b2PolygonShape*)f->GetShape();
                    int32 count = polygonShape->m_count;
                    b2Vec2 prev, v;

                    for(int32 i = 0; i < count; ++i)
                    {
                        v = b->GetWorldPoint(polygonShape->m_vertices[i]);
                        if(i > 0)
                            DrawLine(METERS_TO_PIXELS(prev.x), METERS_TO_PIXELS(prev.y), METERS_TO_PIXELS(v.x), METERS_TO_PIXELS(v.y), RED);

                        prev = v;
                    }

                    v = b->GetWorldPoint(polygonShape->m_vertices[0]);
                    DrawLine(METERS_TO_PIXELS(prev.x), METERS_TO_PIXELS(prev.y), METERS_TO_PIXELS(v.x), METERS_TO_PIXELS(v.y), RED);
                }
                break;

                // Draw chains contour -------------------------------------------
                case b2Shape::e_chain:
                {
                    b2ChainShape* shape = (b2ChainShape*)f->GetShape();
                    b2Vec2 prev, v;

                    for(int32 i = 0; i < shape->m_count; ++i)
                    {
                        v = b->GetWorldPoint(shape->m_vertices[i]);
                        if(i > 0)
                            DrawLine(METERS_TO_PIXELS(prev.x), METERS_TO_PIXELS(prev.y), METERS_TO_PIXELS(v.x), METERS_TO_PIXELS(v.y), GREEN);
                        prev = v;
                    }

                    v = b->GetWorldPoint(shape->m_vertices[0]);
                    DrawLine(METERS_TO_PIXELS(prev.x), METERS_TO_PIXELS(prev.y), METERS_TO_PIXELS(v.x), METERS_TO_PIXELS(v.y), GREEN);
                }
                break;

                // Draw a single segment(edge) ----------------------------------
                case b2Shape::e_edge:
                {
                    b2EdgeShape* shape = (b2EdgeShape*)f->GetShape();
                    b2Vec2 v1, v2;

                    v1 = b->GetWorldPoint(shape->m_vertex1);
                    v2 = b->GetWorldPoint(shape->m_vertex2);
                    DrawLine(METERS_TO_PIXELS(v1.x), METERS_TO_PIXELS(v1.y), METERS_TO_PIXELS(v2.x), METERS_TO_PIXELS(v2.y), BLUE);
                }
                break;
            }

            // Mouse button 1 pressed: test if the current body contains mouse position
            // Only dynamic bodies can be dragged
            if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT) && mouse_joint == NULL && body_clicked == NULL
                && b->GetType() == b2_dynamicBody && f->TestPoint(mouse_position))
            {
                body_clicked = b;
            }
        }
    }

    // A body was selected: create a mouse joint
    if (body_clicked != NULL)
    {
        b2MouseJointDef def;
        def.bodyA = ground;
        def.bodyB = body_clicked;
        def.target = mouse_position;
        def.maxForce = 100.0f * body_clicked->GetMass();
        b2LinearStiffness(def.stiffness, def.damping, 5.0f, 0.7f, def.bodyA, def.bodyB); // 5 Hz, damping ratio 0.7

        mouse_joint = (b2MouseJoint*)world->CreateJoint(&def);
        body_clicked->SetAwake(true);
    }

    // Mouse button kept down: update target position and draw a red line between both anchor points
    if (mouse_joint != NULL && IsMouseButtonDown(MOUSE_BUTTON_LEFT))
    {
        mouse_joint->SetTarget(mouse_position);

        b2Vec2 anchor_a = mouse_joint->GetAnchorA(); // the target
        b2Vec2 anchor_b = mouse_joint->GetAnchorB(); // the point of the body we clicked
        DrawLine(METERS_TO_PIXELS(anchor_a.x), METERS_TO_PIXELS(anchor_a.y), METERS_TO_PIXELS(anchor_b.x), METERS_TO_PIXELS(anchor_b.y), RED);
    }

    // Mouse button released: destroy the joint
    if (mouse_joint != NULL && IsMouseButtonReleased(MOUSE_BUTTON_LEFT))
    {
        world->DestroyJoint(mouse_joint);
        mouse_joint = NULL;
    }

    return UPDATE_CONTINUE;
}


// Called before quitting
bool ModulePhysics::CleanUp()
{
    LOG("Destroying physics world");

    // Delete the whole physics world! (this also frees every body, fixture and joint it owns)
    delete world;
    world = NULL;
    ground = NULL;
    mouse_joint = NULL;

    return true;
}

// PhysBody pointer as UserData: set it in the b2BodyDef BEFORE calling CreateBody()
// mass = density * area
PhysBody* ModulePhysics::CreateCircle(int x, int y, int radius, float density)
{
    PhysBody* pbody = new PhysBody();

    b2BodyDef body;
    body.type = b2_dynamicBody;
    body.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));
    body.userData.pointer = reinterpret_cast<uintptr_t>(pbody);

    b2Body* b = world->CreateBody(&body);

    b2CircleShape shape;
    shape.m_radius = PIXEL_TO_METERS(radius);

    b2FixtureDef fixture;
    fixture.shape = &shape;
    fixture.density = density;

    b->CreateFixture(&fixture);

    pbody->body = b;

    return pbody;
}

PhysBody* ModulePhysics::CreateRectangle(int x, int y, int half_width, int half_height)
{
    PhysBody* pbody = new PhysBody();

    b2BodyDef body;
    body.type = b2_dynamicBody;
    body.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));
    body.userData.pointer = reinterpret_cast<uintptr_t>(pbody);

    b2Body* b = world->CreateBody(&body);

    b2PolygonShape box;
    box.SetAsBox(PIXEL_TO_METERS(half_width), PIXEL_TO_METERS(half_height));

    b2FixtureDef fixture;
    fixture.shape = &box;
    fixture.density = 1.0f;

    b->CreateFixture(&fixture);

    pbody->body = b;

    return pbody;
}

// Static box that detects overlaps but does not collide (a trigger)
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
}

// size is the number of ints, not vertices
PhysBody* ModulePhysics::CreateChain(int x, int y, const int* points, int size)
{
    PhysBody* pbody = new PhysBody();

    b2BodyDef body;
    body.position.Set(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));
    body.userData.pointer = reinterpret_cast<uintptr_t>(pbody);

    b2Body* b = world->CreateBody(&body);

    int count = size / 2;
    b2Vec2* vertices = new b2Vec2[count];
    for (int i = 0; i < count; ++i)
    {
        vertices[i].x = PIXEL_TO_METERS(points[i * 2 + 0]);
        vertices[i].y = PIXEL_TO_METERS(points[i * 2 + 1]);
    }

    b2ChainShape shape;
    shape.CreateLoop(vertices, count);
    delete[] vertices; // CreateLoop copies the vertices

    b2FixtureDef fixture;
    fixture.shape = &shape;
    b->CreateFixture(&fixture);

    pbody->body = b;

    return pbody;
}

void ModulePhysics::DestroyBody(PhysBody* pbody)
{
    if (pbody == NULL)
        return;

    // Box2D also destroys the joints of this body: forget the mouse joint
    if (mouse_joint != NULL && mouse_joint->GetBodyB() == pbody->body)
        mouse_joint = NULL;

    world->DestroyBody(pbody->body); // Box2D frees the body and its fixtures
    delete pbody;                    // we free our own wrapper
}

// Top view friction against the floor
// Static: the body is at rest. It holds the applied force up to mu_s * N
// Dynamic: the body slides. Constant force mu_k * N, opposite to the velocity
void ModulePhysics::ApplyFriction(PhysBody* pbody, b2Vec2 applied_force)
{
    b2Body* b = pbody->body;

    float mass = b->GetMass();
    float normal = mass * GRAVITY_Z; // N = m * g

    b2Vec2 velocity = b->GetLinearVelocity();
    b2Vec2 direction; // direction of the motion

    // At rest: static friction
    if (velocity.Length() < 0.01f)
    {
        // Holds while the applied force is not too big
        if (applied_force.Length() <= static_friction * normal)
        {
            b->ApplyForceToCenter(-applied_force, true);
            return;
        }

        // Too big: it starts sliding
        direction = applied_force;
    }
    else
    {
        direction = velocity;
    }
    direction.Normalize();

    // Dynamic friction
    b2Vec2 friction = -dynamic_friction * normal * direction;

    // Friction stops a body, it never pushes it backwards
    b2Vec2 next_velocity = velocity + (PHYSICS_DT / mass) * (applied_force + friction);
    if (b2Dot(next_velocity, direction) <= 0.0f)
    {
        b->SetLinearVelocity(b2Vec2_zero);
        b->ApplyForceToCenter(-applied_force, true);
        return;
    }

    b->ApplyForceToCenter(friction, true);
}

// Call the listeners that are not NULL
void ModulePhysics::BeginContact(b2Contact* contact)
{
    PhysBody* a = (PhysBody*)contact->GetFixtureA()->GetBody()->GetUserData().pointer;
    PhysBody* b = (PhysBody*)contact->GetFixtureB()->GetBody()->GetUserData().pointer;

    if (a != NULL && a->listener != NULL)
        a->listener->OnCollision(a, b);

    if (b != NULL && b->listener != NULL)
        b->listener->OnCollision(b, a);
}

// Same idea when two bodies stop touching: zones (oil, grass...) need to know when a car leaves
void ModulePhysics::EndContact(b2Contact* contact)
{
    PhysBody* a = (PhysBody*)contact->GetFixtureA()->GetBody()->GetUserData().pointer;
    PhysBody* b = (PhysBody*)contact->GetFixtureB()->GetBody()->GetUserData().pointer;

    if (a != NULL && a->listener != NULL)
        a->listener->OnCollisionEnd(a, b);

    if (b != NULL && b->listener != NULL)
        b->listener->OnCollisionEnd(b, a);
}

// PhysBody ------------------------------------
void PhysBody::GetPosition(int& x, int& y) const
{
    b2Vec2 pos = body->GetPosition();
    x = METERS_TO_PIXELS(pos.x);
    y = METERS_TO_PIXELS(pos.y);
}

float PhysBody::GetRotation() const
{
    return body->GetAngle();
}

bool PhysBody::Contains(int x, int y) const
{
    b2Vec2 p(PIXEL_TO_METERS(x), PIXEL_TO_METERS(y));

    // True if the point is inside ANY of the shapes of this body
    for (b2Fixture* fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext())
    {
        if (fixture->GetShape()->TestPoint(body->GetTransform(), p))
            return true;
    }

    return false;
}

int PhysBody::RayCast(int x1, int y1, int x2, int y2, float& normal_x, float& normal_y) const
{
    // No hit: return -1
    // Hit: fill normal_x and normal_y and return the distance between x1,y1 and the hit point
    int ret = -1;

    b2RayCastInput input;
    input.p1.Set(PIXEL_TO_METERS(x1), PIXEL_TO_METERS(y1));
    input.p2.Set(PIXEL_TO_METERS(x2), PIXEL_TO_METERS(y2));
    input.maxFraction = 1.0f;

    float closest = 1.0f;

    for (b2Fixture* fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext())
    {
        // A chain has one child per edge
        for (int32 i = 0; i < fixture->GetShape()->GetChildCount(); ++i)
        {
            b2RayCastOutput output;
            if (fixture->GetShape()->RayCast(&output, input, body->GetTransform(), i) && output.fraction <= closest)
            {
                closest = output.fraction;

                float dx = (float)(x2 - x1);
                float dy = (float)(y2 - y1);
                ret = (int)(output.fraction * sqrtf(dx * dx + dy * dy));

                normal_x = output.normal.x;
                normal_y = output.normal.y;
            }
        }
    }

    return ret;
}
`, "cpp", "ModulePhysics.cpp (modificado)")}</details>
<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "Un coche tiene next_checkpoint = 3 y toca el checkpoint 0 (la meta). ¿Qué pasa?", o: ["Cuenta una vuelta", "Nada: no es el que le tocaba", "Se reinicia la carrera"], c: 1, e: "Solo cuenta el checkpoint que coincide con next_checkpoint." },
      { p: "¿Por qué el turbo no se aplica dentro de OnCollision?", o: ["Porque no hay acceso al coche", "Porque el mundo está en mitad del cálculo: solo se apunta boost_time y la fuerza se aplica en Drive()", "Porque sería demasiado rápido"], c: 1, e: "En los callbacks solo se anotan cosas; se actúa en el Update." },
      { p: "¿Por qué los coches no se mueven durante la cuenta atrás?", o: ["Tienen la velocidad a 0", "En ese estado no se llama a car->Update()", "Están dormidos"], c: 1, e: "El switch solo actualiza los coches en RACE_RUNNING y RACE_FINISHED." },
      { p: "GetLocalPoint(goal) devuelve x = -3, y = -4. El rival debe…", o: ["Girar a la izquierda", "Girar a la derecha", "Frenar"], c: 0, e: "x negativa = a su izquierda; y negativa = delante." },
      { p: "¿Qué pareja falta si hay una fuga de memoria con los coches?", o: ["new PlayerCar ↔ delete car (y DestroyBody de su cuerpo)", "LoadFx ↔ PlayFx", "Start ↔ Update"], c: 0, e: "Cada new necesita su delete, y cada cuerpo su DestroyBody." }
    ])}
`
  });
})();
