#pragma once

// LOG("Player at %d %d", x, y): prints file, line and the message to the console / VS Output window
#define LOG(format, ...) Log(__FILE__, __LINE__, format, ##__VA_ARGS__)

void Log(const char file[], int line, const char* format, ...);
