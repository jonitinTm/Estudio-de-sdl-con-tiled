(function () {
  const { code, nota, quiz } = Curso;
  Curso.leccion({
    id: "l13", num: "16", grupo: "Bloque 8 · Construye el plataformas paso a paso", corto: "Plataformas I: el motor",
    titulo: "Construye el plataformas I: el motor",
    resumen: "Fases 0–4: proyecto con CMake y vcpkg, utilidades, Engine y módulos, config.xml, ventana, teclado, render, texturas y audio.",
    intro: "Empiezas con una carpeta vacía. Al acabar esta lección tienes un motor propio (el mismo que el de clase, con SDL3) que abre una ventana, lee config.xml, controla los fps, lee el teclado, dibuja y suena.",
    objetivos: ["Crear un proyecto SDL3 con CMake y vcpkg", "Escribir el Engine y el ciclo de vida de los módulos", "Leer la configuración de config.xml", "Dibujar, cargar texturas y reproducir sonidos con SDL3"],
    html: () => `

<p>En las lecciones 01–15 has visto cada pieza por separado. En este bloque las juntas todas y construyes <strong>un juego de plataformas completo, desde una carpeta vacía</strong>: el caballero de tu SandKnight corriendo por un nivel de Tiled, monedas, slimes que te persiguen con pathfinding, vidas, checkpoints, meta, pantalla de título, game over, guardar/cargar y teclas de debug.</p>
<figure style="margin:16px 0"><img src="plataformas/docs/inicio.jpg" alt="El juego terminado" style="width:100%;border-radius:6px;border:1px solid var(--line)"><figcaption style="font-size:.82rem;color:var(--ink-3);margin-top:4px">El juego terminado (captura real del juego compilado)</figcaption></figure>
${nota(`<p>Todo el código de esta guía viene de un proyecto que he <strong>compilado y ejecutado</strong> con SDL3, SDL3_image, Box2D 3.1 y pugixml. Además tiene una prueba automática que <strong>juega sola</strong> y comprueba 16 cosas (que el salto funciona, que el agua quita una vida, que el pisotón mata al slime…): las 16 pasan, sin errores de memoria. El proyecto completo está en la carpeta <code>plataformas/</code> del repositorio.</p>`, "", "Código verificado")}

<h3>Cómo usar esta guía</h3>
<ul>
<li><strong>Escribe tú el código</strong> (no copies y pegues todo). Teclearlo es lo que hace que lo entiendas.</li>
<li>Después de cada fase, <strong>compila y comprueba</strong> lo que pone en la caja verde. No sigas si algo falla: la caja naranja dice las causas típicas.</li>
<li>Si una pieza no te queda clara, vuelve a su lección (te digo cuál en cada fase).</li>
<li>Al final de cada lección están los <strong>archivos completos</strong> para comparar.</li>
</ul>

<h3>El mapa de la construcción</h3>
<div class="table-wrap"><table class="t"><thead><tr><th>Lección</th><th>Fases</th><th>Al terminar verás</th></tr></thead><tbody>
<tr><td><strong>16 · El motor</strong></td><td>0 Proyecto · 1 Utilidades · 2 Engine y Module · 3 Ventana, input y render · 4 Texturas y audio</td><td>Una ventana con el color del cielo que se cierra con Esc</td></tr>
<tr><td>17 · El mundo</td><td>5 Mapa TMX · 6 Física Box2D · 7 Entidades y animaciones · 8 El jugador</td><td>El caballero corriendo y saltando por el nivel</td></tr>
<tr><td>18 · El juego</td><td>9 Monedas · 10 Slimes con pathfinding · 11 Escena: estados, cámara, HUD · 12 Guardar, cargar y debug</td><td>El juego completo</td></tr>
</tbody></table></div>

<h3>El esquema del motor</h3>
${code(String.raw`
main()
 └─ Engine (singleton)  ── lee config.xml y llama a los módulos EN ORDEN:
     window        crea la ventana SDL
     input         estado de cada tecla (IDLE / DOWN / REPEAT / UP)
     textures      carga y libera texturas PNG
     audio         efectos de sonido WAV
     physics       mundo de Box2D: Step() en PreUpdate, eventos de colisión
     scene         la partida: estados, cámara, HUD, crea el jugador, monedas y slimes
     map           carga el .tmx, dibuja las capas, crea los colliders
     entitymanager actualiza y dibuja todas las entidades (jugador, monedas, slimes)
     render        el último: borra al principio del frame y presenta al final`, "txt", "Arquitectura")}
<h2 id="pfase0">Fase 0 · Crear el proyecto</h2>

<p>El proyecto usa <strong>CMake + vcpkg</strong>: Visual Studio lo abre directamente y vcpkg descarga las cuatro librerías sola. Así no hay que configurar rutas de includes ni copiar DLLs a mano.</p>
<ol>
<li><strong>Instala vcpkg</strong> (una sola vez): en una terminal, <code>git clone https://github.com/microsoft/vcpkg</code>, luego <code>vcpkg\bootstrap-vcpkg.bat</code>, y crea la variable de entorno <code>VCPKG_ROOT</code> apuntando a esa carpeta (Panel de control → Variables de entorno). Reinicia Visual Studio.</li>
<li>Crea una carpeta <code>Platformer</code> con: <code>src/</code>, <code>Assets/Maps/</code>, <code>Assets/Textures/</code>, <code>Assets/Audio/</code>.</li>
<li>Copia los assets (los de tu SandKnight sirven: son CC0): <code>knight.png</code>, <code>slime_green.png</code>, <code>coin.png</code> en Textures; <code>world_tileset_32x32.png</code> y <code>MapMetadata.png</code> en Maps; <code>jump.wav</code>, <code>coin.wav</code>, <code>hurt.wav</code>, <code>explosion.wav</code>, <code>power_up.wav</code>, <code>tap.wav</code> en Audio. O cópialos de <code>plataformas/Assets</code> del repositorio.</li>
<li>Crea estos dos archivos en la raíz de la carpeta:</li>
</ol>
${code(String.raw`
{
  "name": "knight-platformer",
  "version-string": "1.0",
  "dependencies": [ "sdl3", "sdl3-image", "box2d", "pugixml" ]
}
`, "txt", "vcpkg.json")}${code(String.raw`
# Knight Platformer. Windows: open this folder with Visual Studio (File > Open > Folder) with vcpkg installed.
# Linux/macOS: cmake -B build && cmake --build build && cd build && ./game
cmake_minimum_required(VERSION 3.21)
project(KnightPlatformer CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(SDL3 CONFIG REQUIRED)
find_package(SDL3_image CONFIG REQUIRED)
find_package(box2d CONFIG REQUIRED)
find_package(pugixml CONFIG REQUIRED)

file(GLOB SOURCES CONFIGURE_DEPENDS src/*.cpp src/*.h)
add_executable(game ${'$'}{SOURCES})
target_link_libraries(game PRIVATE SDL3::SDL3 SDL3_image::SDL3_image box2d::box2d pugixml::pugixml)

# The game reads config.xml and Assets/ from the folder of the executable
add_custom_command(TARGET game POST_BUILD
    COMMAND ${'$'}{CMAKE_COMMAND} -E copy_if_different ${'$'}{CMAKE_SOURCE_DIR}/config.xml $<TARGET_FILE_DIR:game>
    COMMAND ${'$'}{CMAKE_COMMAND} -E copy_directory ${'$'}{CMAKE_SOURCE_DIR}/Assets $<TARGET_FILE_DIR:game>/Assets)
set_property(TARGET game PROPERTY VS_DEBUGGER_WORKING_DIRECTORY $<TARGET_FILE_DIR:game>)
`, "txt", "CMakeLists.txt")}
<ul>
<li><code>vcpkg.json</code>: la lista de librerías. vcpkg las descarga y compila la primera vez (tarda unos minutos, solo una vez).</li>
<li><code>file(GLOB … src/*.cpp)</code>: compila todos los <code>.cpp</code> de <code>src</code>. Cuando crees un archivo nuevo, guarda y CMake lo verá (<em>Proyecto → Eliminar caché y reconfigurar</em> si no).</li>
<li>El <code>POST_BUILD</code> copia <code>config.xml</code> y <code>Assets</code> junto al <code>.exe</code>: el juego los busca ahí.</li>
</ul>
<p>Abre la carpeta con Visual Studio: <em>Archivo → Abrir → Carpeta</em>. Todavía no compilará (no hay código): eso es la fase 1.</p>

${nota(`<p>Visual Studio muestra “CMake generation finished” en la ventana <em>Salida</em> (al principio puede tardar mientras vcpkg descarga). Si sale un error de que no hay fuentes, es normal hasta la fase 2.</p>`, "game", "Compila y comprueba")}
${nota(`<p><strong>“Could not find a package configuration file provided by SDL3”</strong>: vcpkg no está enlazado. Comprueba <code>VCPKG_ROOT</code> y, en <em>Proyecto → Configuración de CMake</em>, pon como cadena de herramientas <code>%VCPKG_ROOT%/scripts/buildsystems/vcpkg.cmake</code>.</p>`, "warn", "Si no funciona")}
<h2 id="pfase1">Fase 1 · Utilidades: Vector2D, LOG y temporizadores</h2>

<p>Tres archivos pequeños que usa todo el motor.</p>
<h3>Vector2D.h</h3>
<p>Un punto o vector 2D con decimales. Se usa para posiciones en píxeles y en tiles. Los <code>operator+</code>, <code>operator-</code>… permiten escribir <code>a + b</code> con vectores.</p>
${code(String.raw`
#pragma once

#include <math.h>

// 2D vector with float coordinates (pixels or tiles, depending on who uses it)
class Vector2D
{
public:
    Vector2D() {}
    Vector2D(float x, float y) : x(x), y(y) {}

    float getX() const { return x; }
    float getY() const { return y; }
    void setX(float v) { x = v; }
    void setY(float v) { y = v; }

    Vector2D operator+(const Vector2D& o) const { return Vector2D(x + o.x, y + o.y); }
    Vector2D operator-(const Vector2D& o) const { return Vector2D(x - o.x, y - o.y); }
    Vector2D operator*(float s) const { return Vector2D(x * s, y * s); }
    bool operator==(const Vector2D& o) const { return x == o.x && y == o.y; }
    bool operator!=(const Vector2D& o) const { return !(*this == o); }

    float Length() const { return sqrtf(x * x + y * y); }

private:
    float x = 0.0f;
    float y = 0.0f;
};
`, "cpp", "Vector2D.h")}
<h3>Log.h / Log.cpp</h3>
<p><code>LOG("Vidas: %d", lives)</code> escribe en la consola con el archivo y la línea. Es un <em>macro</em>: <code>__FILE__</code> y <code>__LINE__</code> los rellena el compilador. Imprescindible para depurar (lección 02).</p>
${code(String.raw`
#pragma once

// LOG("Player at %d %d", x, y): prints file, line and the message to the console / VS Output window
#define LOG(format, ...) Log(__FILE__, __LINE__, format, ##__VA_ARGS__)

void Log(const char file[], int line, const char* format, ...);
`, "cpp", "Log.h")}${code(String.raw`
#include "Log.h"

#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include <SDL3/SDL.h>

void Log(const char file[], int line, const char* format, ...)
{
    static char message[4096];

    va_list args;
    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);

    // Only the file name, not the whole path
    const char* name = strrchr(file, '/');
    if (name == nullptr) name = strrchr(file, '\\');
    name = (name != nullptr) ? name + 1 : file;

    SDL_Log("%s(%d) : %s", name, line, message);
}
`, "cpp", "Log.cpp")}
<h3>Timer.h</h3>
<p>Los dos temporizadores de la <a href="#l02">lección 02</a>, en un solo archivo y escritos dentro de la clase (por eso no hay <code>Timer.cpp</code>). <code>Timer</code> usa milisegundos (para el juego: invulnerabilidad, tiempo del nivel); <code>PerfTimer</code> el contador de alta precisión (para medir el frame).</p>
${code(String.raw`
#pragma once

#include <SDL3/SDL.h>

// Millisecond timer (SDL_GetTicks). Enough for gameplay: cooldowns, lap times, invulnerability...
class Timer
{
public:
    Timer() { Start(); }

    void Start() { startTime = SDL_GetTicks(); }
    float ReadMSec() const { return (float)(SDL_GetTicks() - startTime); }
    float ReadSec() const { return ReadMSec() / 1000.0f; }

private:
    Uint64 startTime = 0;
};

// High precision timer (performance counter). For profiling and frame timing
class PerfTimer
{
public:
    PerfTimer()
    {
        if (frequency == 0) frequency = SDL_GetPerformanceFrequency();
        Start();
    }

    void Start() { startTime = SDL_GetPerformanceCounter(); }
    double ReadMs() const { return 1000.0 * (double)(SDL_GetPerformanceCounter() - startTime) / (double)frequency; }

private:
    Uint64 startTime = 0;
    static inline Uint64 frequency = 0;
};
`, "cpp", "Timer.h")}
<p><code>static inline Uint64 frequency</code>: una sola variable compartida por todos los PerfTimer (C++17 permite inicializarla aquí mismo con <code>inline</code>).</p>

${nota(`<p>Aún no hay <code>main</code>, así que no puedes ejecutar. Pulsa <kbd>Ctrl</kbd>+<kbd>Mayús</kbd>+<kbd>B</kbd> solo para ver que estos archivos no tienen errores de sintaxis (el error de enlazado “main no encontrado” es normal).</p>`, "game", "Compila y comprueba")}
<h2 id="pfase2">Fase 2 · Engine y Module: el corazón</h2>

<p>Es la arquitectura de la <a href="#l01">lección 01</a>. Primero la clase base de todos los módulos:</p>
${code(String.raw`
#pragma once

#include <string>
#include "pugixml.hpp"

class PhysBody;

// Base class of every module of the engine (window, input, render, map, physics, scene...)
class Module
{
public:
    Module() : active(false) {}
    virtual ~Module() {}

    void Init() { active = true; }

    // The engine gives each module its own node of config.xml: <config><window>...</window></config>
    virtual bool LoadParameters(pugi::xml_node parameters)
    {
        configParameters = parameters;
        return true;
    }

    virtual bool Awake() { return true; }           // once: read the configuration
    virtual bool Start() { return true; }           // once: load resources
    virtual bool PreUpdate() { return true; }       // every frame
    virtual bool Update(float dt) { return true; }  // every frame. dt in milliseconds
    virtual bool PostUpdate() { return true; }      // every frame
    virtual bool CleanUp() { return true; }         // once: free everything

public:
    std::string name;
    bool active;
    pugi::xml_node configParameters;
};
`, "cpp", "Module.h")}
<ul>
<li>Cada módulo tiene un <code>name</code> (<code>"window"</code>, <code>"render"</code>…) que coincide con un nodo de <code>config.xml</code>. Así el Engine le pasa “su” trozo de configuración (<a href="#l05">lección 05</a>).</li>
<li><code>Update(float dt)</code>: <code>dt</code> en milisegundos (<a href="#l03">lección 03</a>).</li>
<li>Devolver <code>false</code> en cualquier función cierra el juego.</li>
</ul>
<h3>Engine.h</h3>
${code(String.raw`
#pragma once

#include <list>
#include <memory>
#include <string>
#include "Timer.h"
#include "pugixml.hpp"

class Module;
class Window;
class Input;
class Render;
class Textures;
class Audio;
class Scene;
class Map;
class Physics;
class EntityManager;

// The engine: owns the modules and runs the game loop. There is only one (singleton)
class Engine
{
public:
    static Engine& GetInstance();

    bool Awake();
    bool Start();
    bool Update();
    bool CleanUp();

    float GetDt() const { return dt; }
    const char* GetTitle() const { return gameTitle.c_str(); }

    // F11 in the scene: switch between the config frame rate and 30 fps
    void ToggleFrameCap();

private:
    Engine();
    Engine(const Engine&) = delete;
    Engine& operator=(const Engine&) = delete;

    void AddModule(std::shared_ptr<Module> module);
    bool LoadConfig();

    void PrepareUpdate();
    void FinishUpdate();
    bool PreUpdate();
    bool DoUpdate();
    bool PostUpdate();

public:
    // Direct access to the modules: Engine::GetInstance().render->DrawTexture(...)
    std::shared_ptr<Window> window;
    std::shared_ptr<Input> input;
    std::shared_ptr<Render> render;
    std::shared_ptr<Textures> textures;
    std::shared_ptr<Audio> audio;
    std::shared_ptr<Scene> scene;
    std::shared_ptr<Map> map;
    std::shared_ptr<Physics> physics;
    std::shared_ptr<EntityManager> entityManager;

    pugi::xml_document configFile;

private:
    std::list<std::shared_ptr<Module>> moduleList;

    std::string gameTitle = "Platformer";
    int targetFrameRate = 60;
    int configFrameRate = 60;

    // Frame measurements (L02)
    PerfTimer frameTime;
    Timer startupTime;
    Timer lastSecFrameTime;
    int frameCount = 0;
    int lastSecFrameCount = 0;
    int framesPerSecond = 0;
    float dt = 16.0f;   // milliseconds of the last frame
};
`, "cpp", "Engine.h")}
<ul>
<li><strong>Singleton</strong>: el constructor es <code>private</code> y solo se obtiene con <code>Engine::GetInstance()</code>. Las líneas <code>= delete</code> prohíben copiarlo.</li>
<li><code>class Window;</code> etc.: <em>forward declarations</em>. El <code>.h</code> solo necesita saber que existen (usa punteros); los <code>#include</code> reales van en el <code>.cpp</code>.</li>
<li>Los módulos son <code>std::shared_ptr</code>: se borran solos.</li>
</ul>
<h3>Engine.cpp</h3>
${code(String.raw`
#include "Engine.h"
#include "Log.h"

#include "Window.h"
#include "Input.h"
#include "Render.h"
#include "Textures.h"
#include "Audio.h"
#include "Scene.h"
#include "Map.h"
#include "Physics.h"
#include "EntityManager.h"

Engine& Engine::GetInstance()
{
    static Engine instance;
    return instance;
}

Engine::Engine()
{
    window = std::make_shared<Window>();
    input = std::make_shared<Input>();
    render = std::make_shared<Render>();
    textures = std::make_shared<Textures>();
    audio = std::make_shared<Audio>();
    physics = std::make_shared<Physics>();
    scene = std::make_shared<Scene>();
    map = std::make_shared<Map>();
    entityManager = std::make_shared<EntityManager>();

    // The order matters: Awake, Start and Update follow it. CleanUp goes backwards
    AddModule(window);
    AddModule(input);
    AddModule(textures);
    AddModule(audio);
    AddModule(physics);       // Step() in PreUpdate: positions ready for the game
    AddModule(scene);
    AddModule(map);           // the map is drawn before the entities...
    AddModule(entityManager); // ...so the player is drawn on top
    AddModule(render);        // always last: presents the frame
}

void Engine::AddModule(std::shared_ptr<Module> module)
{
    module->Init();
    moduleList.push_back(module);
}`, "cpp", "Engine.cpp · constructor y AddModule")}
<p><strong>El orden de <code>AddModule</code> es el orden del juego.</strong> La física va antes que la escena para que, cuando el jugador lea su posición, el <code>Step()</code> de este frame ya esté hecho. El mapa va antes que las entidades para que el caballero se dibuje encima del suelo. Y <code>render</code> el último, porque presenta el frame.</p>
${code(String.raw`
bool Engine::LoadConfig()
{
    pugi::xml_parse_result result = configFile.load_file("config.xml");
    if (!result)
    {
        LOG("Error loading config.xml: %s", result.description());
        return false;
    }
    return true;
}

bool Engine::Awake()
{
    if (!LoadConfig()) return false;

    pugi::xml_node engineNode = configFile.child("config").child("engine");
    gameTitle = engineNode.child("title").attribute("value").as_string();
    configFrameRate = targetFrameRate = engineNode.child("targetFrameRate").attribute("value").as_int(60);

    for (const auto& module : moduleList)
    {
        // Each module receives its own node: <window>, <render>, <scene>...
        module->LoadParameters(configFile.child("config").child(module->name.c_str()));
        if (!module->Awake()) return false;
    }
    return true;
}

bool Engine::Start()
{
    for (const auto& module : moduleList)
    {
        if (!module->Start())
        {
            LOG("Module %s failed to start", module->name.c_str());
            return false;
        }
    }
    return true;
}`, "cpp", "Engine.cpp · LoadConfig, Awake y Start")}
<p>En <code>Awake</code> cada módulo recibe su nodo: <code>configFile.child("config").child(module-&gt;name.c_str())</code>. Esa sola línea es la que hace funcionar todo el <code>config.xml</code>.</p>
${code(String.raw`
bool Engine::Update()
{
    PrepareUpdate();

    bool ret = PreUpdate();
    if (ret) ret = DoUpdate();
    if (ret) ret = PostUpdate();

    FinishUpdate();
    return ret;
}

bool Engine::CleanUp()
{
    bool ret = true;
    for (auto it = moduleList.rbegin(); it != moduleList.rend(); ++it)
        ret = (*it)->CleanUp() && ret;
    moduleList.clear();
    return ret;
}

void Engine::ToggleFrameCap()
{
    targetFrameRate = (targetFrameRate == 30) ? configFrameRate : 30;
}

void Engine::PrepareUpdate()
{
    frameTime.Start();
}

void Engine::FinishUpdate()
{
    // Frame cap (L03): wait what is left of the frame budget
    double maxFrameDuration = 1000.0 / targetFrameRate;
    double elapsed = frameTime.ReadMs();
    if (elapsed < maxFrameDuration)
        SDL_DelayPrecise((Uint64)((maxFrameDuration - elapsed) * 1000000.0));

    // dt AFTER the wait, so it includes it
    dt = (float)frameTime.ReadMs();
    if (dt > 100.0f) dt = 100.0f; // a breakpoint or dragging the window: do not teleport

    // Frames per second (L02)
    frameCount++;
    lastSecFrameCount++;
    if (lastSecFrameTime.ReadMSec() >= 1000.0f)
    {
        framesPerSecond = lastSecFrameCount;
        lastSecFrameCount = 0;
        lastSecFrameTime.Start();
    }
}

bool Engine::PreUpdate()
{
    for (const auto& module : moduleList)
        if (module->active && !module->PreUpdate()) return false;
    return true;
}

bool Engine::DoUpdate()
{
    for (const auto& module : moduleList)
        if (module->active && !module->Update(dt)) return false;
    return true;
}

bool Engine::PostUpdate()
{
    for (const auto& module : moduleList)
        if (module->active && !module->PostUpdate()) return false;
    return true;
}`, "cpp", "Engine.cpp · el bucle, frame cap y fps")}
<ul>
<li><code>FinishUpdate</code> es la <a href="#l03">lección 03</a> entera: espera lo que sobra del presupuesto del frame con <code>SDL_DelayPrecise</code> y calcula <code>dt</code> <strong>después</strong> de esperar.</li>
<li><code>if (dt &gt; 100) dt = 100</code>: si paras en un breakpoint, el siguiente frame duraría segundos y todo “teletransportaría”. Esto lo limita.</li>
</ul>
<h3>Main.cpp</h3>
${code(String.raw`
#include "Engine.h"
#include "Log.h"

#define SDL_MAIN_HANDLED
#include <SDL3/SDL_main.h>

int main(int argc, char* argv[])
{
    LOG("Engine starting ...");

    Engine& engine = Engine::GetInstance();

    int result = 1;
    if (engine.Awake() && engine.Start())
    {
        while (engine.Update()) {}
        result = 0;
    }

    engine.CleanUp();
    LOG("Bye :)");
    return result;
}
`, "cpp", "Main.cpp")}
<p>Todavía faltan los módulos que el Engine crea (Window, Input…). Para compilar ya, puedes comentar temporalmente en <code>Engine.cpp</code> los <code>#include</code>, los <code>make_shared</code> y los <code>AddModule</code> de los módulos que aún no existen, e ir descomentándolos fase a fase.</p>

${nota(`<p>Con todos los módulos comentados, el programa arranca, no encuentra <code>config.xml</code>… y se cierra con el mensaje “Error loading config.xml” en la consola. ¡Es correcto! Significa que el Engine funciona. El <code>config.xml</code> llega en la fase siguiente.</p>`, "game", "Compila y comprueba")}
<h2 id="pfase3">Fase 3 · config.xml, ventana, teclado y render</h2>

<h3>config.xml</h3>
<p>Créalo en la raíz del proyecto (junto a <code>CMakeLists.txt</code>). Es el archivo completo del juego: las partes de <code>scene</code> se usan a partir de la lección 17.</p>
${code(String.raw`
<!-- Config file for the engine: change values here, no need to recompile -->
<config>
  <engine>
    <title value="Knight Platformer"/>
    <targetFrameRate value="60"/>
  </engine>

  <window>
    <resolution width="1280" height="720" scale="1"/>
    <fullscreen value="false"/>
    <borderless value="false"/>
    <resizable value="false"/>
  </window>

  <render>
    <vsync value="false"/>
  </render>

  <audio>
    <volume value="0.6"/>
  </audio>

  <scene>
    <map path="Assets/Maps/" name="Level1.tmx"/>
    <fx jump="Assets/Audio/jump.wav" coin="Assets/Audio/coin.wav" hurt="Assets/Audio/hurt.wav"
        stomp="Assets/Audio/explosion.wav" win="Assets/Audio/power_up.wav" select="Assets/Audio/tap.wav"/>
    <entities>
      <player>
        <texture path="Assets/Textures/knight.png"/>
        <animations tsx="Assets/Textures/knight.tsx"/>
        <!-- speed in m/s, jump = upwards speed in m/s. 32 px = 1 m -->
        <movement speed="6.0" jump="12.5"/>
        <body width="20" height="36"/>
        <lives value="3"/>
      </player>
      <coin>
        <texture path="Assets/Textures/coin.png"/>
        <animations tsx="Assets/Textures/coin.tsx"/>
      </coin>
      <enemy>
        <texture path="Assets/Textures/slime_green.png"/>
        <animations tsx="Assets/Textures/slime.tsx"/>
        <movement speed="2.0" chase="3.2" sight="10"/>
      </enemy>
    </entities>
  </scene>
</config>
`, "xml", "config.xml")}
<h3>Window</h3>
${code(String.raw`
#pragma once

#include "Module.h"
#include <SDL3/SDL.h>

class Window : public Module
{
public:
    Window();

    bool Awake() override;
    bool CleanUp() override;

    void SetTitle(const char* title);
    int GetWidth() const { return width; }
    int GetHeight() const { return height; }
    int GetScale() const { return scale; }

public:
    SDL_Window* window = nullptr;

private:
    int width = 1280;
    int height = 720;
    int scale = 1;
};
`, "cpp", "Window.h")}${code(String.raw`
#include "Window.h"
#include "Engine.h"
#include "Log.h"

Window::Window()
{
    name = "window";
}

bool Window::Awake()
{
    if (!SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO))
    {
        LOG("SDL_Init error: %s", SDL_GetError());
        return false;
    }

    // <window><resolution width="1280" height="720" scale="1"/> ...
    width = configParameters.child("resolution").attribute("width").as_int(1280);
    height = configParameters.child("resolution").attribute("height").as_int(720);
    scale = configParameters.child("resolution").attribute("scale").as_int(1);

    SDL_WindowFlags flags = 0;
    if (configParameters.child("fullscreen").attribute("value").as_bool()) flags |= SDL_WINDOW_FULLSCREEN;
    if (configParameters.child("borderless").attribute("value").as_bool()) flags |= SDL_WINDOW_BORDERLESS;
    if (configParameters.child("resizable").attribute("value").as_bool()) flags |= SDL_WINDOW_RESIZABLE;

    window = SDL_CreateWindow(Engine::GetInstance().GetTitle(), width, height, flags);
    if (window == nullptr)
    {
        LOG("SDL_CreateWindow error: %s", SDL_GetError());
        return false;
    }
    return true;
}

bool Window::CleanUp()
{
    if (window != nullptr) SDL_DestroyWindow(window);
    window = nullptr;
    SDL_Quit();
    return true;
}

void Window::SetTitle(const char* title)
{
    SDL_SetWindowTitle(window, title);
}
`, "cpp", "Window.cpp")}
<p><code>SDL_Init</code> va aquí porque Window es el primer módulo. Fíjate en los <code>as_int(1280)</code>: el número entre paréntesis es el valor por defecto si el atributo no existe en el XML.</p>
<h3>Input</h3>
${code(String.raw`
#pragma once

#include "Module.h"
#include <SDL3/SDL.h>

enum KeyState
{
    KEY_IDLE = 0,   // not pressed
    KEY_DOWN,       // pressed THIS frame
    KEY_REPEAT,     // held down
    KEY_UP          // released THIS frame
};

class Input : public Module
{
public:
    Input();

    bool PreUpdate() override;

    KeyState GetKey(int id) const { return keyboard[id]; }
    bool GetWindowClose() const { return windowClosed; }

    // Optional: press a key from code (automatic tests, replays, on-screen buttons)
    void SetVirtualKey(int id, bool pressed) { virtualKeys[id] = pressed; }

private:
    KeyState keyboard[SDL_SCANCODE_COUNT] = {};
    bool virtualKeys[SDL_SCANCODE_COUNT] = {};
    bool windowClosed = false;
};
`, "cpp", "Input.h")}${code(String.raw`
#include "Input.h"

Input::Input()
{
    name = "input";
}

bool Input::PreUpdate()
{
    // 1) Empty the event queue (L01)
    SDL_Event event;
    while (SDL_PollEvent(&event))
    {
        if (event.type == SDL_EVENT_QUIT) windowClosed = true;
    }

    // 2) Update the state of every key: IDLE -> DOWN -> REPEAT -> UP -> IDLE
    const bool* keys = SDL_GetKeyboardState(nullptr);
    for (int i = 0; i < SDL_SCANCODE_COUNT; ++i)
    {
        bool pressed = keys[i] || virtualKeys[i];
        if (pressed)
            keyboard[i] = (keyboard[i] == KEY_IDLE || keyboard[i] == KEY_UP) ? KEY_DOWN : KEY_REPEAT;
        else
            keyboard[i] = (keyboard[i] == KEY_REPEAT || keyboard[i] == KEY_DOWN) ? KEY_UP : KEY_IDLE;
    }
    return true;
}
`, "cpp", "Input.cpp")}
<p>Cada tecla pasa por cuatro estados. Así puedes distinguir “acabo de pulsar” (<code>KEY_DOWN</code>: saltar una vez) de “estoy manteniendo” (<code>KEY_REPEAT</code>: correr) y “acabo de soltar” (<code>KEY_UP</code>: salto variable).</p>
<div class="path"><span>IDLE</span><i>→ pulsas →</i><span>DOWN</span><i>→ sigues →</i><span>REPEAT</span><i>→ sueltas →</i><span>UP</span><i>→</i><span>IDLE</span></div>
<p><code>SetVirtualKey</code> es opcional: permite “pulsar” teclas desde código. Lo usa la prueba automática.</p>
<h3>Render</h3>
${code(String.raw`
#pragma once

#include "Module.h"
#include <SDL3/SDL.h>

class Render : public Module
{
public:
    Render();

    bool Awake() override;
    bool PreUpdate() override;
    bool PostUpdate() override;
    bool CleanUp() override;

    // x, y in WORLD pixels: the camera is applied inside. speed = 0 draws on screen (HUD)
    bool DrawTexture(SDL_Texture* texture, int x, int y, const SDL_Rect* section = nullptr,
                     float speed = 1.0f, double angle = 0.0, bool flipH = false) const;
    bool DrawRectangle(const SDL_Rect& rect, Uint8 r, Uint8 g, Uint8 b, Uint8 a = 255,
                       bool filled = true, bool useCamera = true) const;
    bool DrawLine(int x1, int y1, int x2, int y2, Uint8 r, Uint8 g, Uint8 b, Uint8 a = 255, bool useCamera = true) const;
    // Text with the built-in SDL3 debug font (8x8 pixels per letter, times scale). Always on screen
    bool DrawText(const char* text, int x, int y, float scale, Uint8 r, Uint8 g, Uint8 b) const;

    void SetBackgroundColor(SDL_Color color) { background = color; }
    bool SaveScreenshot(const char* path) const;

public:
    SDL_Renderer* renderer = nullptr;
    SDL_Rect camera = { 0, 0, 1280, 720 };   // camera.x/y are NEGATIVE: drawn at x + camera.x
    bool vsync = false;

private:
    SDL_Color background = { 0, 0, 0, 255 };
};
`, "cpp", "Render.h")}${code(String.raw`
#include "Render.h"
#include "Engine.h"
#include "Window.h"
#include "Log.h"

Render::Render()
{
    name = "render";
}

bool Render::Awake()
{
    SDL_Window* window = Engine::GetInstance().window->window;
    renderer = SDL_CreateRenderer(window, nullptr);
    if (renderer == nullptr)
    {
        LOG("SDL_CreateRenderer error: %s", SDL_GetError());
        return false;
    }

    vsync = configParameters.child("vsync").attribute("value").as_bool();
    SDL_SetRenderVSync(renderer, vsync ? 1 : 0);

    camera.w = Engine::GetInstance().window->GetWidth();
    camera.h = Engine::GetInstance().window->GetHeight();
    SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);
    return true;
}

bool Render::PreUpdate()
{
    SDL_SetRenderDrawColor(renderer, background.r, background.g, background.b, background.a);
    SDL_RenderClear(renderer);
    return true;
}

bool Render::PostUpdate()
{
    SDL_RenderPresent(renderer);
    return true;
}

bool Render::CleanUp()
{
    if (renderer != nullptr) SDL_DestroyRenderer(renderer);
    renderer = nullptr;
    return true;
}

bool Render::DrawTexture(SDL_Texture* texture, int x, int y, const SDL_Rect* section, float speed, double angle, bool flipH) const
{
    if (texture == nullptr) return false;

    SDL_FRect src;
    if (section != nullptr) src = { (float)section->x, (float)section->y, (float)section->w, (float)section->h };
    else src = { 0, 0, (float)texture->w, (float)texture->h };

    // World -> screen: add the camera (multiplied by speed: 0 = fixed on screen, < 1 = parallax)
    SDL_FRect dst = { (float)(int)(camera.x * speed) + x, (float)(int)(camera.y * speed) + y, src.w, src.h };

    SDL_FlipMode flip = flipH ? SDL_FLIP_HORIZONTAL : SDL_FLIP_NONE;
    return SDL_RenderTextureRotated(renderer, texture, &src, &dst, angle, nullptr, flip);
}

bool Render::DrawRectangle(const SDL_Rect& rect, Uint8 r, Uint8 g, Uint8 b, Uint8 a, bool filled, bool useCamera) const
{
    SDL_SetRenderDrawColor(renderer, r, g, b, a);
    SDL_FRect f = { (float)rect.x, (float)rect.y, (float)rect.w, (float)rect.h };
    if (useCamera) { f.x += camera.x; f.y += camera.y; }
    return filled ? SDL_RenderFillRect(renderer, &f) : SDL_RenderRect(renderer, &f);
}

bool Render::DrawLine(int x1, int y1, int x2, int y2, Uint8 r, Uint8 g, Uint8 b, Uint8 a, bool useCamera) const
{
    SDL_SetRenderDrawColor(renderer, r, g, b, a);
    int ox = useCamera ? camera.x : 0, oy = useCamera ? camera.y : 0;
    return SDL_RenderLine(renderer, (float)(x1 + ox), (float)(y1 + oy), (float)(x2 + ox), (float)(y2 + oy));
}

bool Render::DrawText(const char* text, int x, int y, float scale, Uint8 r, Uint8 g, Uint8 b) const
{
    SDL_SetRenderScale(renderer, scale, scale);
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 200);
    SDL_RenderDebugText(renderer, x / scale + 1, y / scale + 1, text);   // shadow
    SDL_SetRenderDrawColor(renderer, r, g, b, 255);
    bool ok = SDL_RenderDebugText(renderer, x / scale, y / scale, text);
    SDL_SetRenderScale(renderer, 1.0f, 1.0f);
    return ok;
}

bool Render::SaveScreenshot(const char* path) const
{
    SDL_Surface* surface = SDL_RenderReadPixels(renderer, nullptr);
    if (surface == nullptr) return false;
    bool ok = SDL_SaveBMP(surface, path);
    SDL_DestroySurface(surface);
    return ok;
}
`, "cpp", "Render.cpp")}
<ul>
<li><code>PreUpdate</code> borra con el color de fondo y <code>PostUpdate</code> presenta. Como <code>render</code> es el último módulo, todo lo que dibujen los demás en su <code>Update</code> queda entre medias.</li>
<li><code>DrawTexture</code> recibe coordenadas del <strong>mundo</strong> y les suma la cámara (que es negativa: si la cámara está en x = −500, lo que está en el mundo en x = 600 sale en pantalla en x = 100). Con <code>speed = 0</code> la cámara no se aplica: sirve para el HUD.</li>
<li><code>DrawText</code> usa <code>SDL_RenderDebugText</code>, una fuente de 8×8 píxeles que trae SDL3: no hace falta SDL_ttf.</li>
</ul>

${nota(`<p>Descomenta Window, Input y Render en <code>Engine.cpp</code>. Aparece una ventana de 1280×720 con el título “Knight Platformer” y fondo negro. Para cerrarla, de momento, la X de la ventana no hace nada (la escena se encargará): para el depurador con <kbd>Mayús</kbd>+<kbd>F5</kbd>.</p>`, "game", "Compila y comprueba")}
${nota(`<p><strong>No se abre nada y la consola dice “Error loading config.xml”</strong>: el XML no está junto al .exe. Revisa el <code>POST_BUILD</code> del CMakeLists, o que <code>config.xml</code> esté en la raíz del proyecto. <strong>Error en SDL_CreateRenderer</strong>: actualiza los drivers de la gráfica.</p>`, "warn", "Si no funciona")}
<h2 id="pfase4">Fase 4 · Texturas y audio</h2>

${code(String.raw`
#pragma once

#include "Module.h"
#include <SDL3/SDL.h>
#include <list>

class Textures : public Module
{
public:
    Textures();

    bool CleanUp() override;

    SDL_Texture* Load(const char* path);
    void UnLoad(SDL_Texture* texture);

private:
    std::list<SDL_Texture*> textures;   // everything loaded, to free it in CleanUp
};
`, "cpp", "Textures.h")}${code(String.raw`
#include "Textures.h"
#include "Engine.h"
#include "Render.h"
#include "Log.h"

#include <SDL3_image/SDL_image.h>

Textures::Textures()
{
    name = "textures";
}

SDL_Texture* Textures::Load(const char* path)
{
    SDL_Texture* texture = IMG_LoadTexture(Engine::GetInstance().render->renderer, path);
    if (texture == nullptr)
    {
        LOG("Could not load texture %s: %s", path, SDL_GetError());
        return nullptr;
    }
    SDL_SetTextureScaleMode(texture, SDL_SCALEMODE_NEAREST);   // pixel art: no blur
    textures.push_back(texture);
    return texture;
}

void Textures::UnLoad(SDL_Texture* texture)
{
    if (texture == nullptr) return;
    textures.remove(texture);
    SDL_DestroyTexture(texture);
}

bool Textures::CleanUp()
{
    for (SDL_Texture* texture : textures) SDL_DestroyTexture(texture);
    textures.clear();
    return true;
}
`, "cpp", "Textures.cpp")}
<ul>
<li><code>IMG_LoadTexture</code> (SDL3_image) carga un PNG directamente como textura de la GPU.</li>
<li><code>SDL_SCALEMODE_NEAREST</code>: sin suavizado. En pixel art es obligatorio o el caballero se ve borroso.</li>
<li>La lista <code>textures</code> guarda todo lo cargado para liberarlo en <code>CleanUp</code>: aunque una entidad olvide hacer <code>UnLoad</code>, no hay fuga.</li>
</ul>
${code(String.raw`
#pragma once

#include "Module.h"
#include <SDL3/SDL.h>
#include <vector>

// Sound effects with the SDL3 audio API (no extra library): WAV files only
class Audio : public Module
{
public:
    Audio();

    bool Awake() override;
    bool CleanUp() override;

    // Returns an id > 0, or 0 if it could not be loaded
    int LoadFx(const char* path);
    void PlayFx(int id);

private:
    struct Fx
    {
        Uint8* data = nullptr;
        Uint32 length = 0;
        SDL_AudioStream* stream = nullptr;
    };

    SDL_AudioDeviceID device = 0;
    std::vector<Fx> fxs;
    float volume = 0.6f;
};
`, "cpp", "Audio.h")}${code(String.raw`
#include "Audio.h"
#include "Log.h"

Audio::Audio()
{
    name = "audio";
}

bool Audio::Awake()
{
    volume = configParameters.child("volume").attribute("value").as_float(0.6f);

    device = SDL_OpenAudioDevice(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, nullptr);
    if (device == 0)
        LOG("No audio device (%s): the game runs without sound", SDL_GetError());
    return true; // not having sound is not a reason to close the game
}

int Audio::LoadFx(const char* path)
{
    if (device == 0) return 0;

    Fx fx;
    SDL_AudioSpec spec;
    if (!SDL_LoadWAV(path, &spec, &fx.data, &fx.length))
    {
        LOG("Could not load sound %s: %s", path, SDL_GetError());
        return 0;
    }

    // One stream per sound, converting from the WAV format to the device format
    fx.stream = SDL_CreateAudioStream(&spec, nullptr);
    SDL_SetAudioStreamGain(fx.stream, volume);
    SDL_BindAudioStream(device, fx.stream);

    fxs.push_back(fx);
    return (int)fxs.size();   // ids start at 1
}

void Audio::PlayFx(int id)
{
    if (id <= 0 || id > (int)fxs.size()) return;
    Fx& fx = fxs[id - 1];
    SDL_ClearAudioStream(fx.stream);                        // restart if it was already playing
    SDL_PutAudioStreamData(fx.stream, fx.data, (int)fx.length);
}

bool Audio::CleanUp()
{
    for (Fx& fx : fxs)
    {
        SDL_DestroyAudioStream(fx.stream);
        SDL_free(fx.data);
    }
    fxs.clear();
    if (device != 0) SDL_CloseAudioDevice(device);
    device = 0;
    return true;
}
`, "cpp", "Audio.cpp")}
<ul>
<li>Sin librerías extra: la API de audio de SDL3 lee WAV (<code>SDL_LoadWAV</code>) y reproduce con <em>streams</em>. Un stream por sonido, que convierte su formato al del dispositivo.</li>
<li><code>LoadFx</code> devuelve 1, 2, 3… (0 = error). <code>PlayFx</code> usa <code>id - 1</code> como índice (justo el fallo que tenía el handout de Physics).</li>
<li>Sin tarjeta de sonido el juego sigue funcionando: <code>Awake</code> devuelve <code>true</code> igualmente.</li>
<li>Para música en MP3/OGG necesitarías SDL3_mixer; con WAV en bucle también se puede hacer (es un buen ejercicio).</li>
</ul>
<p>Por último, para probar que todo va, crea una <code>Scene</code> mínima que pinte el fondo y cierre con Esc. En la lección 18 la sustituirás por la completa:</p>
${code(String.raw`
// Scene.h (versión mínima de prueba)
#pragma once
#include "Module.h"

class Scene : public Module
{
public:
    Scene() { name = "scene"; }
    bool Start() override;
    bool PostUpdate() override;
};

// Scene.cpp (versión mínima de prueba)
#include "Scene.h"
#include "Engine.h"
#include "Render.h"
#include "Input.h"

bool Scene::Start()
{
    Engine::GetInstance().render->SetBackgroundColor({ 132, 196, 230, 255 });   // sky
    return true;
}

bool Scene::PostUpdate()
{
    Input& input = *Engine::GetInstance().input;
    if (input.GetKey(SDL_SCANCODE_ESCAPE) == KEY_DOWN || input.GetWindowClose()) return false;
    return true;
}`, "cpp", "Scene mínima (temporal)")}

${nota(`<p>La ventana es azul cielo, se cierra con <kbd>Esc</kbd> o con la X, y la consola no muestra errores. <strong>Tu motor funciona.</strong> En la lección 17 le pones un mundo dentro.</p>`, "game", "Compila y comprueba")}
${nota(`<p><strong>“Scene no tiene miembro…”</strong> o errores en Engine.cpp con módulos que todavía no existen (Map, Physics, EntityManager): déjalos comentados hasta su fase.</p>`, "warn", "Si no funciona")}
<h2>Archivos de esta lección</h2><details class="reto"><summary><span>Archivo completo</span>Engine.h</summary>${code(String.raw`
#pragma once

#include <list>
#include <memory>
#include <string>
#include "Timer.h"
#include "pugixml.hpp"

class Module;
class Window;
class Input;
class Render;
class Textures;
class Audio;
class Scene;
class Map;
class Physics;
class EntityManager;

// The engine: owns the modules and runs the game loop. There is only one (singleton)
class Engine
{
public:
    static Engine& GetInstance();

    bool Awake();
    bool Start();
    bool Update();
    bool CleanUp();

    float GetDt() const { return dt; }
    const char* GetTitle() const { return gameTitle.c_str(); }

    // F11 in the scene: switch between the config frame rate and 30 fps
    void ToggleFrameCap();

private:
    Engine();
    Engine(const Engine&) = delete;
    Engine& operator=(const Engine&) = delete;

    void AddModule(std::shared_ptr<Module> module);
    bool LoadConfig();

    void PrepareUpdate();
    void FinishUpdate();
    bool PreUpdate();
    bool DoUpdate();
    bool PostUpdate();

public:
    // Direct access to the modules: Engine::GetInstance().render->DrawTexture(...)
    std::shared_ptr<Window> window;
    std::shared_ptr<Input> input;
    std::shared_ptr<Render> render;
    std::shared_ptr<Textures> textures;
    std::shared_ptr<Audio> audio;
    std::shared_ptr<Scene> scene;
    std::shared_ptr<Map> map;
    std::shared_ptr<Physics> physics;
    std::shared_ptr<EntityManager> entityManager;

    pugi::xml_document configFile;

private:
    std::list<std::shared_ptr<Module>> moduleList;

    std::string gameTitle = "Platformer";
    int targetFrameRate = 60;
    int configFrameRate = 60;

    // Frame measurements (L02)
    PerfTimer frameTime;
    Timer startupTime;
    Timer lastSecFrameTime;
    int frameCount = 0;
    int lastSecFrameCount = 0;
    int framesPerSecond = 0;
    float dt = 16.0f;   // milliseconds of the last frame
};
`, "cpp", "Engine.h")}</details><details class="reto"><summary><span>Archivo completo</span>Engine.cpp</summary>${code(String.raw`
#include "Engine.h"
#include "Log.h"

#include "Window.h"
#include "Input.h"
#include "Render.h"
#include "Textures.h"
#include "Audio.h"
#include "Scene.h"
#include "Map.h"
#include "Physics.h"
#include "EntityManager.h"

Engine& Engine::GetInstance()
{
    static Engine instance;
    return instance;
}

Engine::Engine()
{
    window = std::make_shared<Window>();
    input = std::make_shared<Input>();
    render = std::make_shared<Render>();
    textures = std::make_shared<Textures>();
    audio = std::make_shared<Audio>();
    physics = std::make_shared<Physics>();
    scene = std::make_shared<Scene>();
    map = std::make_shared<Map>();
    entityManager = std::make_shared<EntityManager>();

    // The order matters: Awake, Start and Update follow it. CleanUp goes backwards
    AddModule(window);
    AddModule(input);
    AddModule(textures);
    AddModule(audio);
    AddModule(physics);       // Step() in PreUpdate: positions ready for the game
    AddModule(scene);
    AddModule(map);           // the map is drawn before the entities...
    AddModule(entityManager); // ...so the player is drawn on top
    AddModule(render);        // always last: presents the frame
}

void Engine::AddModule(std::shared_ptr<Module> module)
{
    module->Init();
    moduleList.push_back(module);
}

bool Engine::LoadConfig()
{
    pugi::xml_parse_result result = configFile.load_file("config.xml");
    if (!result)
    {
        LOG("Error loading config.xml: %s", result.description());
        return false;
    }
    return true;
}

bool Engine::Awake()
{
    if (!LoadConfig()) return false;

    pugi::xml_node engineNode = configFile.child("config").child("engine");
    gameTitle = engineNode.child("title").attribute("value").as_string();
    configFrameRate = targetFrameRate = engineNode.child("targetFrameRate").attribute("value").as_int(60);

    for (const auto& module : moduleList)
    {
        // Each module receives its own node: <window>, <render>, <scene>...
        module->LoadParameters(configFile.child("config").child(module->name.c_str()));
        if (!module->Awake()) return false;
    }
    return true;
}

bool Engine::Start()
{
    for (const auto& module : moduleList)
    {
        if (!module->Start())
        {
            LOG("Module %s failed to start", module->name.c_str());
            return false;
        }
    }
    return true;
}

bool Engine::Update()
{
    PrepareUpdate();

    bool ret = PreUpdate();
    if (ret) ret = DoUpdate();
    if (ret) ret = PostUpdate();

    FinishUpdate();
    return ret;
}

bool Engine::CleanUp()
{
    bool ret = true;
    for (auto it = moduleList.rbegin(); it != moduleList.rend(); ++it)
        ret = (*it)->CleanUp() && ret;
    moduleList.clear();
    return ret;
}

void Engine::ToggleFrameCap()
{
    targetFrameRate = (targetFrameRate == 30) ? configFrameRate : 30;
}

void Engine::PrepareUpdate()
{
    frameTime.Start();
}

void Engine::FinishUpdate()
{
    // Frame cap (L03): wait what is left of the frame budget
    double maxFrameDuration = 1000.0 / targetFrameRate;
    double elapsed = frameTime.ReadMs();
    if (elapsed < maxFrameDuration)
        SDL_DelayPrecise((Uint64)((maxFrameDuration - elapsed) * 1000000.0));

    // dt AFTER the wait, so it includes it
    dt = (float)frameTime.ReadMs();
    if (dt > 100.0f) dt = 100.0f; // a breakpoint or dragging the window: do not teleport

    // Frames per second (L02)
    frameCount++;
    lastSecFrameCount++;
    if (lastSecFrameTime.ReadMSec() >= 1000.0f)
    {
        framesPerSecond = lastSecFrameCount;
        lastSecFrameCount = 0;
        lastSecFrameTime.Start();
    }
}

bool Engine::PreUpdate()
{
    for (const auto& module : moduleList)
        if (module->active && !module->PreUpdate()) return false;
    return true;
}

bool Engine::DoUpdate()
{
    for (const auto& module : moduleList)
        if (module->active && !module->Update(dt)) return false;
    return true;
}

bool Engine::PostUpdate()
{
    for (const auto& module : moduleList)
        if (module->active && !module->PostUpdate()) return false;
    return true;
}
`, "cpp", "Engine.cpp")}</details><details class="reto"><summary><span>Archivo completo</span>Render.cpp</summary>${code(String.raw`
#include "Render.h"
#include "Engine.h"
#include "Window.h"
#include "Log.h"

Render::Render()
{
    name = "render";
}

bool Render::Awake()
{
    SDL_Window* window = Engine::GetInstance().window->window;
    renderer = SDL_CreateRenderer(window, nullptr);
    if (renderer == nullptr)
    {
        LOG("SDL_CreateRenderer error: %s", SDL_GetError());
        return false;
    }

    vsync = configParameters.child("vsync").attribute("value").as_bool();
    SDL_SetRenderVSync(renderer, vsync ? 1 : 0);

    camera.w = Engine::GetInstance().window->GetWidth();
    camera.h = Engine::GetInstance().window->GetHeight();
    SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);
    return true;
}

bool Render::PreUpdate()
{
    SDL_SetRenderDrawColor(renderer, background.r, background.g, background.b, background.a);
    SDL_RenderClear(renderer);
    return true;
}

bool Render::PostUpdate()
{
    SDL_RenderPresent(renderer);
    return true;
}

bool Render::CleanUp()
{
    if (renderer != nullptr) SDL_DestroyRenderer(renderer);
    renderer = nullptr;
    return true;
}

bool Render::DrawTexture(SDL_Texture* texture, int x, int y, const SDL_Rect* section, float speed, double angle, bool flipH) const
{
    if (texture == nullptr) return false;

    SDL_FRect src;
    if (section != nullptr) src = { (float)section->x, (float)section->y, (float)section->w, (float)section->h };
    else src = { 0, 0, (float)texture->w, (float)texture->h };

    // World -> screen: add the camera (multiplied by speed: 0 = fixed on screen, < 1 = parallax)
    SDL_FRect dst = { (float)(int)(camera.x * speed) + x, (float)(int)(camera.y * speed) + y, src.w, src.h };

    SDL_FlipMode flip = flipH ? SDL_FLIP_HORIZONTAL : SDL_FLIP_NONE;
    return SDL_RenderTextureRotated(renderer, texture, &src, &dst, angle, nullptr, flip);
}

bool Render::DrawRectangle(const SDL_Rect& rect, Uint8 r, Uint8 g, Uint8 b, Uint8 a, bool filled, bool useCamera) const
{
    SDL_SetRenderDrawColor(renderer, r, g, b, a);
    SDL_FRect f = { (float)rect.x, (float)rect.y, (float)rect.w, (float)rect.h };
    if (useCamera) { f.x += camera.x; f.y += camera.y; }
    return filled ? SDL_RenderFillRect(renderer, &f) : SDL_RenderRect(renderer, &f);
}

bool Render::DrawLine(int x1, int y1, int x2, int y2, Uint8 r, Uint8 g, Uint8 b, Uint8 a, bool useCamera) const
{
    SDL_SetRenderDrawColor(renderer, r, g, b, a);
    int ox = useCamera ? camera.x : 0, oy = useCamera ? camera.y : 0;
    return SDL_RenderLine(renderer, (float)(x1 + ox), (float)(y1 + oy), (float)(x2 + ox), (float)(y2 + oy));
}

bool Render::DrawText(const char* text, int x, int y, float scale, Uint8 r, Uint8 g, Uint8 b) const
{
    SDL_SetRenderScale(renderer, scale, scale);
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 200);
    SDL_RenderDebugText(renderer, x / scale + 1, y / scale + 1, text);   // shadow
    SDL_SetRenderDrawColor(renderer, r, g, b, 255);
    bool ok = SDL_RenderDebugText(renderer, x / scale, y / scale, text);
    SDL_SetRenderScale(renderer, 1.0f, 1.0f);
    return ok;
}

bool Render::SaveScreenshot(const char* path) const
{
    SDL_Surface* surface = SDL_RenderReadPixels(renderer, nullptr);
    if (surface == nullptr) return false;
    bool ok = SDL_SaveBMP(surface, path);
    SDL_DestroySurface(surface);
    return ok;
}
`, "cpp", "Render.cpp")}</details><details class="reto"><summary><span>Archivo completo</span>Audio.cpp</summary>${code(String.raw`
#include "Audio.h"
#include "Log.h"

Audio::Audio()
{
    name = "audio";
}

bool Audio::Awake()
{
    volume = configParameters.child("volume").attribute("value").as_float(0.6f);

    device = SDL_OpenAudioDevice(SDL_AUDIO_DEVICE_DEFAULT_PLAYBACK, nullptr);
    if (device == 0)
        LOG("No audio device (%s): the game runs without sound", SDL_GetError());
    return true; // not having sound is not a reason to close the game
}

int Audio::LoadFx(const char* path)
{
    if (device == 0) return 0;

    Fx fx;
    SDL_AudioSpec spec;
    if (!SDL_LoadWAV(path, &spec, &fx.data, &fx.length))
    {
        LOG("Could not load sound %s: %s", path, SDL_GetError());
        return 0;
    }

    // One stream per sound, converting from the WAV format to the device format
    fx.stream = SDL_CreateAudioStream(&spec, nullptr);
    SDL_SetAudioStreamGain(fx.stream, volume);
    SDL_BindAudioStream(device, fx.stream);

    fxs.push_back(fx);
    return (int)fxs.size();   // ids start at 1
}

void Audio::PlayFx(int id)
{
    if (id <= 0 || id > (int)fxs.size()) return;
    Fx& fx = fxs[id - 1];
    SDL_ClearAudioStream(fx.stream);                        // restart if it was already playing
    SDL_PutAudioStreamData(fx.stream, fx.data, (int)fx.length);
}

bool Audio::CleanUp()
{
    for (Fx& fx : fxs)
    {
        SDL_DestroyAudioStream(fx.stream);
        SDL_free(fx.data);
    }
    fxs.clear();
    if (device != 0) SDL_CloseAudioDevice(device);
    device = 0;
    return true;
}
`, "cpp", "Audio.cpp")}</details>
<h2>Comprueba lo que sabes</h2>
${quiz([
      { p: "¿Por qué render es el último módulo de la lista?", o: ["Porque es el más lento", "Porque PostUpdate presenta el frame: todo lo demás debe haberse dibujado antes", "Por orden alfabético"], c: 1, e: "Borra en PreUpdate, los demás dibujan en Update, y presenta al final." },
      { p: "¿Qué estado tiene una tecla el frame exacto en que la pulsas?", o: ["KEY_REPEAT", "KEY_DOWN", "KEY_UP"], c: 1, e: "DOWN un frame, luego REPEAT mientras la mantienes." },
      { p: "¿Qué hace la línea module->LoadParameters(configFile.child(\"config\").child(module->name.c_str()))?", o: ["Carga una textura", "Da a cada módulo su propio nodo de config.xml", "Crea el módulo"], c: 1, e: "Por eso el name del módulo debe coincidir con el nodo del XML." },
      { p: "¿Por qué el juego busca config.xml junto al .exe?", o: ["Por seguridad", "load_file usa rutas relativas a la carpeta de trabajo, que es la del ejecutable", "Porque SDL lo exige"], c: 1, e: "El POST_BUILD copia config.xml y Assets ahí." },
      { p: "¿Para qué sirve SDL_SCALEMODE_NEAREST?", o: ["Para que el pixel art no se vea borroso", "Para cargar más rápido", "Para el sonido"], c: 0, e: "Sin suavizado al escalar." }
    ])}
`
  });
})();
