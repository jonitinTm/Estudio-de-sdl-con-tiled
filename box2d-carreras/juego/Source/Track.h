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
