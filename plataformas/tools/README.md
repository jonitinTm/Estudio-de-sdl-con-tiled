# Herramientas

## make_level.py
Genera `Assets/Maps/Level1.tmx` (desde la carpeta `plataformas`): `python3 tools/make_level.py`.
El mapa resultante se abre y edita con Tiled como cualquier otro.

## autoplay.cpp
Prueba automática del juego: arranca el motor real, simula teclas con `Input::SetVirtualKey`, comprueba
16 situaciones (salto, monedas, caer al agua, daño de un slime, pisotón, guardar/cargar, modo dios,
meta, game over) y guarda capturas en la carpeta indicada por la variable de entorno `SHOTS`.
Se compila con todos los `.cpp` de `src` **excepto** `Main.cpp` más este archivo. Sin ventana:
`SDL_VIDEODRIVER=offscreen SDL_AUDIODRIVER=dummy ./autoplay`.
