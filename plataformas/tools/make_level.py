#!/usr/bin/env python3
"""Genera Assets/Maps/Level1.tmx: un nivel de ejemplo que se puede abrir y editar en Tiled.
Uso: python3 tools/make_level.py   (desde la carpeta plataformas)"""
import os

W, H, T = 100, 22, 32
GROUND = 18                     # fila donde empieza el suelo (el suelo ocupa 18..21)
WORLD = 1                       # firstgid del tileset del mundo
META = 257                      # firstgid de MapMetadata (tile 0 = rojo = sólido)

GRASS, DIRT, STONE, STONE2, SAND, SAND2 = 0, 16, 1, 17, 2, 18
QBLOCK = 33
TREE = [48, 64, 80]
BUSH, BUSH_S = 49, 65
PALM = [83, 99, 115, 131]
MUSH_O, MUSH_P = 103, 119
FENCE = 57
WATER_TOP, WATER = 148, 164

mapa = [[0] * W for _ in range(H)]
deco = [[0] * W for _ in range(H)]
solid = [[False] * W for _ in range(H)]
objects = []

def tile(layer, i, j, t):
    layer[j][i] = WORLD + t

def ground(i0, i1, top=GROUND, kind="grass"):
    for i in range(i0, i1):
        for j in range(top, H):
            if kind == "grass": t = GRASS if j == top else DIRT
            else: t = SAND if j == top else SAND2
            tile(mapa, i, j, t); solid[j][i] = True

def platform(i0, i1, j, t=STONE):
    for i in range(i0, i1):
        tile(mapa, i, j, t); solid[j][i] = True

def obj(kind, x, y, w=32, h=32, name=""):
    objects.append((kind, x, y, w, h, name))

def coin(i, j): obj("Coin", i * T + 8, j * T + 8, 16, 16)

def water(i0, i1):
    for i in range(i0, i1):
        tile(deco, i, GROUND + 1, WATER_TOP)
        for j in range(GROUND + 2, H): tile(deco, i, j, WATER)
    # zona de muerte: un sensor en el fondo del foso
    obj("Death", i0 * T, (H - 1) * T, (i1 - i0) * T, T)

# --- Tramo 1: inicio -----------------------------------------------------------
ground(0, 22)
obj("Player", 3 * T, (GROUND - 2) * T, 32, 64, "Spawn")
for i, t in [(1, BUSH), (6, BUSH_S), (12, MUSH_O), (19, BUSH)]: tile(deco, i, GROUND - 1, t)
for k, t in enumerate(TREE): tile(deco, 9, GROUND - 3 + k, t)
platform(8, 12, 14); [coin(i, 13) for i in range(8, 12)]
platform(14, 17, 11, QBLOCK); coin(15, 10)
obj("Enemy", 17 * T, (GROUND - 1) * T, 32, 32)

# --- Foso con agua 1 -------------------------------------------------------------
water(22, 26)
platform(23, 25, 14)
coin(23, 12); coin(24, 12)

# --- Tramo 2 ---------------------------------------------------------------------
ground(26, 44)
for k, t in enumerate(PALM): tile(deco, 28, GROUND - 4 + k, t)
tile(deco, 33, GROUND - 1, MUSH_P); tile(deco, 41, GROUND - 1, BUSH_S)
platform(31, 36, 15); [coin(i, 14) for i in range(31, 36)]
platform(37, 41, 12, STONE); [coin(i, 11) for i in range(37, 41)]
obj("Enemy", 34 * T, (GROUND - 1) * T, 32, 32)
obj("Enemy", 40 * T, (GROUND - 1) * T, 32, 32)
obj("Checkpoint", 43 * T, (GROUND - 2) * T, 32, 64, "Checkpoint")
for j in range(GROUND - 1, GROUND): tile(deco, 43, j, FENCE)

# --- Foso grande con plataformas en escalera ----------------------------------------
water(44, 54)
platform(45, 47, 15); platform(48, 50, 13); platform(51, 53, 15)
coin(45, 14); coin(48, 12); coin(49, 12); coin(52, 14)

# --- Tramo 3: arena, escalones y torre ----------------------------------------------
ground(54, 78, kind="sand")
for k, t in enumerate(PALM): tile(deco, 56, GROUND - 4 + k, t)
platform(60, 62, GROUND - 1, STONE); platform(62, 64, GROUND - 2, STONE); platform(64, 66, GROUND - 3, STONE)
for j in range(GROUND - 3, GROUND): platform(66, 67, j, STONE)
[coin(i, GROUND - 5) for i in range(62, 66)]
obj("Enemy", 58 * T, (GROUND - 1) * T, 32, 32)
obj("Enemy", 72 * T, (GROUND - 1) * T, 32, 32)
platform(69, 75, 13, QBLOCK); [coin(i, 12) for i in range(69, 75)]
tile(deco, 76, GROUND - 1, MUSH_O)

# --- Foso final ---------------------------------------------------------------------
water(78, 82)
platform(79, 81, 14); coin(79, 13); coin(80, 13)

# --- Meta -------------------------------------------------------------------------------
ground(82, 100)
for k, t in enumerate(TREE): tile(deco, 85, GROUND - 3 + k, t)
tile(deco, 90, GROUND - 1, BUSH); tile(deco, 98, GROUND - 1, BUSH_S)
obj("Enemy", 88 * T, (GROUND - 1) * T, 32, 32)
obj("Goal", 95 * T, (GROUND - 3) * T, 32, 96, "Goal")

# --- Escribir el TMX -------------------------------------------------------------------
def data(layer):
    return "\n".join(f'   <tile gid="{g}"/>' if g else '   <tile/>' for row in layer for g in row)

coll = [[META if solid[j][i] else 0 for i in range(W)] for j in range(H)]
objs = "\n".join(
    f'  <object id="{k + 1}"{f" name={chr(34)}{n}{chr(34)}" if n else ""} type="{kind}" x="{x}" y="{y}" width="{w}" height="{h}"/>'
    for k, (kind, x, y, w, h, n) in enumerate(objects))

tmx = f'''<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.11.0" orientation="orthogonal" renderorder="right-down" width="{W}" height="{H}" tilewidth="{T}" tileheight="{T}" infinite="0" nextlayerid="5" nextobjectid="{len(objects) + 1}">
 <tileset firstgid="{WORLD}" name="world" tilewidth="32" tileheight="32" tilecount="256" columns="16">
  <image source="world_tileset_32x32.png" width="512" height="512"/>
 </tileset>
 <tileset firstgid="{META}" name="MapMetadata" tilewidth="32" tileheight="32" spacing="1" margin="1" tilecount="2" columns="2">
  <image source="MapMetadata.png" width="67" height="34"/>
 </tileset>
 <layer id="1" name="Decor" width="{W}" height="{H}">
  <properties>
   <property name="Draw" type="bool" value="true"/>
  </properties>
  <data>
{data(deco)}
  </data>
 </layer>
 <layer id="2" name="Map" width="{W}" height="{H}">
  <properties>
   <property name="Draw" type="bool" value="true"/>
  </properties>
  <data>
{data(mapa)}
  </data>
 </layer>
 <layer id="3" name="Collisions" width="{W}" height="{H}">
  <properties>
   <property name="Collision" type="bool" value="true"/>
   <property name="Draw" type="bool" value="false"/>
  </properties>
  <data>
{data(coll)}
  </data>
 </layer>
 <objectgroup id="4" name="Objects">
{objs}
 </objectgroup>
</map>
'''
os.makedirs("Assets/Maps", exist_ok=True)
open("Assets/Maps/Level1.tmx", "w").write(tmx)
print("Level1.tmx:", W, "x", H, "tiles,", sum(1 for o in objects if o[0] == "Coin"), "coins,",
      sum(1 for o in objects if o[0] == "Enemy"), "enemies")
