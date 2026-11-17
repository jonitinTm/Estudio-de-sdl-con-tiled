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
