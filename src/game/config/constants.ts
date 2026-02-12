export const GRID_W = 96;
export const GRID_H = 64;
export const TILE_SIZE = 12;

export const ITEMS_TARGET = 10;
export const COINS_TARGET = 100;
export const UNDERGROUND_TRAPS_TARGET = 30;

export const PLAYER_SPEED = 4; // tiles per second
export const EXTRA_CONNECTION_RATIO = 0.2;
export const ENTITY_RADIUS = 0.3; // tiles

export const CAMERA_ZOOM = 2.2;
export const DESKTOP_CAMERA_ZOOM_MULT = 1.5;

// how far we can "snap" into a corridor while turning
export const TURN_ASSIST_TILES = 0.22;
export const TOUCH_TURN_ASSIST_TILES = 0.46;

export const BOMB_RADIUS_TILES = 8;

// 5x5 around player tile
export const EXPLORE_CLEAR_RADIUS_TILES = 2;
export const EXPLORE_CLOUD_FADE_MS = 420;
// sprite body radius factor for overlap/coverage checks
export const EXPLORE_CLOUD_BODY_RADIUS = 0.44;
export const EXPLORE_CLOUD_OPACITY_MULT = 1.0;
export const EXPLORE_CLOUD_BUCKET_SIZE = TILE_SIZE * 10;

export const FOG_RADIUS_TILES = 4;
export const FOG_DURATION_MS = 8000;
// tiles away from player
export const FOG_AREA_MIN_DIST = 10;
export const FOG_AREA_COUNT_MAX = 3;
export const FOG_AREA_DURATION_MIN_MS = 30000;
export const FOG_AREA_DURATION_MAX_MS = 60000;
export const FOG_AREA_FADE_MS = 900;

export const CHASER_BOOST_MULT = 1.5;
export const CHASER_BOOST_MS = 3000;
// 20% slower globally
export const CHASER_SPEED_MULT = 0.8;

export const HELPER_COUNT = 3;
// tiles from player at spawn
export const HELPER_MIN_DIST = 10;
// tiles
export const HELPER_MIN_PATH_LEN = 16;
export const HELPER_SPEED_MULT = 0.6;

export const TOUCH_CHASER_SPEED_MULT = 0.8;
export const TOUCH_JOYSTICK_MAX = 58;
export const TOUCH_JOYSTICK_DEADZONE = 0.18;
