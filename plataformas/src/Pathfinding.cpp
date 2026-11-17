#include "Pathfinding.h"
#include "Map.h"

#include <queue>

std::vector<Vector2D> Pathfinding::FindPath(const Map& map, Vector2D start, Vector2D goal, int maxNodes)
{
	std::vector<Vector2D> path;
	int width = map.GetWidth(), height = map.GetHeight();
	int sx = (int)start.getX(), sy = (int)start.getY();
	int gx = (int)goal.getX(), gy = (int)goal.getY();
	if (!map.IsWalkable(sx, sy) || !map.IsWalkable(gx, gy)) return path;

	// visited and breadcrumbs as flat vectors: index = j * width + i (L07)
	std::vector<bool> visited(width * height, false);
	std::vector<int> breadcrumbs(width * height, -1);

	std::queue<int> frontier;
	int startIndex = sy * width + sx;
	frontier.push(startIndex);
	visited[startIndex] = true;
	breadcrumbs[startIndex] = startIndex;   // the start is its own breadcrumb: ComputePath stops there

	int goalIndex = gy * width + gx;
	int explored = 0;
	bool found = false;

	while (!frontier.empty() && explored < maxNodes)
	{
		int current = frontier.front();
		frontier.pop();
		explored++;

		if (current == goalIndex) { found = true; break; }

		int ci = current % width, cj = current / width;
		// Walking enemies: left and right along the floor
		const int neighbors[2][2] = { { ci + 1, cj }, { ci - 1, cj } };
		for (const auto& n : neighbors)
		{
			if (!map.IsWalkable(n[0], n[1])) continue;
			int index = n[1] * width + n[0];
			if (visited[index]) continue;
			visited[index] = true;
			breadcrumbs[index] = current;   // where we came from
			frontier.push(index);
		}
	}

	if (!found) return path;

	// Follow the breadcrumbs back from the goal, then reverse
	for (int index = goalIndex; ; index = breadcrumbs[index])
	{
		path.push_back(Vector2D((float)(index % width), (float)(index / width)));
		if (breadcrumbs[index] == index) break;
	}
	std::vector<Vector2D> ordered(path.rbegin(), path.rend());
	return ordered;
}
