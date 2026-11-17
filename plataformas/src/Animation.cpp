#include "Animation.h"
#include "Log.h"
#include "pugixml.hpp"

void Animation::Update(float dtMs)
{
	if (frames.empty() || finished) return;

	timer += dtMs;
	// while, not if: with a big dt we may have to skip several frames
	while (timer >= frames[currentFrame].durationMs)
	{
		timer -= frames[currentFrame].durationMs;
		currentFrame++;
		if (currentFrame >= (int)frames.size())
		{
			if (loop) currentFrame = 0;
			else { currentFrame = (int)frames.size() - 1; finished = true; break; }
		}
	}
}

bool AnimationSet::LoadFromTSX(const char* path, const std::map<int, std::string>& aliases)
{
	pugi::xml_document doc;
	pugi::xml_parse_result result = doc.load_file(path);
	if (!result)
	{
		LOG("Could not load %s: %s", path, result.description());
		return false;
	}

	pugi::xml_node tileset = doc.child("tileset");
	int tw = tileset.attribute("tilewidth").as_int();
	int th = tileset.attribute("tileheight").as_int();
	int columns = tileset.attribute("columns").as_int();

	for (pugi::xml_node tile = tileset.child("tile"); tile; tile = tile.next_sibling("tile"))
	{
		pugi::xml_node animNode = tile.child("animation");
		if (!animNode) continue;

		int id = tile.attribute("id").as_int();
		auto alias = aliases.find(id);
		std::string name = (alias != aliases.end()) ? alias->second : "tile" + std::to_string(id);

		Animation anim;
		for (pugi::xml_node f = animNode.child("frame"); f; f = f.next_sibling("frame"))
		{
			int tileId = f.attribute("tileid").as_int();
			// The same formula as the map (L07), without firstgid, margin or spacing
			SDL_Rect r = { (tileId % columns) * tw, (tileId / columns) * th, tw, th };
			anim.AddFrame(r, f.attribute("duration").as_int(100));
		}
		animations[name] = anim;
	}

	if (animations.empty())
	{
		LOG("%s has no animations", path);
		return false;
	}
	current = animations.begin()->first;
	return true;
}

void AnimationSet::SetCurrent(const std::string& name)
{
	if (name == current) return;                  // if not, it would restart every frame
	if (animations.find(name) == animations.end()) return;
	current = name;
	animations[current].Reset();
}

void AnimationSet::SetLoop(const std::string& name, bool loop)
{
	auto it = animations.find(name);
	if (it != animations.end()) it->second.SetLoop(loop);
}

void AnimationSet::Update(float dtMs)
{
	animations[current].Update(dtMs);
}

const SDL_Rect& AnimationSet::GetCurrentFrame() const
{
	return animations.at(current).GetCurrentFrame();
}

bool AnimationSet::HasFinished() const
{
	return animations.at(current).HasFinished();
}
