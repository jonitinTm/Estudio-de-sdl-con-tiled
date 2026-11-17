#pragma once

#include "Vector2D.h"
#include <vector>

class Map;

// BFS on the navigation of the map (L11, L12). Everything in TILE coordinates
class Pathfinding
{
public:
	// Shortest path from start to goal (both included). Empty if there is no path
	// maxNodes limits the search: enemies only care about the player when he is near
	std::vector<Vector2D> FindPath(const Map& map, Vector2D start, Vector2D goal, int maxNodes = 400);
};
