# Curso SDL + Tiled

Curso web personal e incremental para aprender SDL3 + Tiled + C++ siguiendo el temario de Desarrollo de Videojuegos (L02–L12).
Cada lección explica el concepto, tiene una demo interactiva en el navegador, recorre los TODOs del handout con la solución escondida y termina con un test.

## Cómo abrirlo

No necesita instalar nada: abre `index.html` con doble clic (Chrome, Edge o Firefox).
El progreso (lecciones marcadas como hechas) se guarda en el navegador.

## Temario

| # | Lección | PDF |
|---|---------|-----|
| 01 | Fundamentos: C++, SDL3 y la arquitectura del motor | (base, no hay PDF) |
| 02 | Framerate: medir el tiempo del bucle | L02_Framerate |
| 03 | Delta time, frame cap y VSYNC | L03_DeltaTime |
| 04 | Sistemas de entidades | L04_Entity_Systems |
| 05 | Serialización: config.xml con pugixml | L05_Serialization |
| 06 | Mapas de tiles: Tiled y el formato TMX | L06_Tile_Maps_formats |
| 07 | Dibujar un mapa ortogonal desde el TMX | L07_Tiled_TMX_Drawing |
| 08 | Físicas con Box2D | L08_Physics |
| 09 | Colisiones desde el mapa: metadatos y propiedades | L09_Map_Collisions |
| 10 | Animaciones desde Tiled y cámara | L10_Load Parameters and Animations |
| 11 | Pathfinding I: grafos y BFS | L11_Pathfinding_BFS |
| 12 | Pathfinding II: breadcrumbs y Dijkstra | L12_Pathfinding_Dijkstra |

## Estructura

```
index.html                 página única; carga el núcleo y las lecciones
css/estilo.css             estilos (tema claro y oscuro)
js/nucleo.js               router por #hash, progreso, resaltado de código, quizzes, utilidades de canvas
js/pathfinding_demo.js     demo de BFS/Dijkstra compartida por L11 y L12
lecciones/LXX_*.js         una lección por archivo
```

## Añadir una lección nueva

1. Crea `lecciones/L13_nombre.js` copiando la estructura de cualquier lección:
   ```js
   (function () {
     const { code, nota, todo, quiz, demo } = Curso;
     Curso.leccion({
       id: "l13", num: "13", grupo: "Bloque 6 · Inteligencia artificial", corto: "A*",
       titulo: "…", resumen: "…", intro: "…", objetivos: ["…"],
       html: () => `…`,
       init(root) { /* demos */ }
     });
   })();
   ```
2. Añade `<script src="lecciones/L13_nombre.js"></script>` al final de `index.html`.

Las lecciones aparecen en el orden en que se cargan los `<script>`.
