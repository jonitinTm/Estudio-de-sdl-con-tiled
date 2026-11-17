# Knight Platformer. Windows: open this folder with Visual Studio (File > Open > Folder) with vcpkg installed.
# Linux/macOS: cmake -B build && cmake --build build && cd build && ./game
cmake_minimum_required(VERSION 3.21)
project(KnightPlatformer CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(SDL3 CONFIG REQUIRED)
find_package(SDL3_image CONFIG REQUIRED)
find_package(box2d CONFIG REQUIRED)
find_package(pugixml CONFIG REQUIRED)

file(GLOB SOURCES CONFIGURE_DEPENDS src/*.cpp src/*.h)
add_executable(game ${SOURCES})
target_link_libraries(game PRIVATE SDL3::SDL3 SDL3_image::SDL3_image box2d::box2d pugixml::pugixml)

# The game reads config.xml and Assets/ from the folder of the executable
add_custom_command(TARGET game POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different ${CMAKE_SOURCE_DIR}/config.xml $<TARGET_FILE_DIR:game>
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_SOURCE_DIR}/Assets $<TARGET_FILE_DIR:game>/Assets)
set_property(TARGET game PROPERTY VS_DEBUGGER_WORKING_DIRECTORY $<TARGET_FILE_DIR:game>)
