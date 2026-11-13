# Box2D Racing Lab

Curso personal de **Box2D 2.4 + Raylib + C++** (Physics II) orientado al **Proyecto 02: Racing**.
Basado en Lesson 2 (Shapes), Lesson 3 (Collision Detection), Lesson 4 (Joints), Handout 05 (Custom Friction),
Handout 06 (Custom Collisions and Filtering), Lesson 10 (Entities) y el enunciado del proyecto, usando los
mismos nombres que el código del Handout 06 (`ModulePhysics`, `PhysBody`, `ModuleGame`, `PhysicEntity`…).

## Cómo abrirlo

Doble clic en `index.html`. No necesita internet: la física de las demos es Box2D real portado a JavaScript
(planck.js, incluido en `vendor/`, licencia MIT).

## Temario

| # | Lección | Material |
|---|---------|----------|
| 01 | El mundo, los cuerpos y las fixtures | (base) |
| 02 | Formas: círculos, cajas, edges y cadenas | Lesson2_Shapes |
| 03 | Detección de colisiones: puntos, rayos, contactos y sensores | Lesson3_Collision_Detection |
| 04 | Joints y el mouse joint de la F1 | Lesson4_Joints |
| 05 | Fricción a medida (vista cenital) | Handout 05 |
| 06 | Colisiones a medida y filtrado | Handout 06 |
| 07 | Entidades en C++ | Lesson 10 - Entities |
| 08 | La física del coche top-down | Proyecto 02 |
| 09 | Circuito, checkpoints, vueltas y tiempos | Proyecto 02 |
| 10 | IA de los rivales | Proyecto 02 |
| 11 | El Proyecto 02 de principio a fin (checklist de entrega) | Proyecto 02 |

Cada lección: explicación, demo con física real, código del handout explicado, práctica guiada
(escribes tú el código con corrección, pistas y solución) y test.

## Estructura

```
index.html            configuración del curso (window.CURSO) y carga de scripts
../css, ../js         motor compartido con el curso de SDL (núcleo, prácticas, estilos)
js/b2demo.js          mundo de planck.js con las unidades y el debug draw del handout + mouse joint
js/coche.js           física del coche top-down, circuito, checkpoints y gestor de carrera
lecciones/B*.js       lecciones
practicas/Q*.js       prácticas guiadas
vendor/planck.min.js  Box2D 2.4 en JavaScript (MIT)
```
