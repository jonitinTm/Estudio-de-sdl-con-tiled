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
