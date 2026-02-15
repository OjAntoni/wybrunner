export const GRID_W = 96;
export const GRID_H = 64;
export const TILE_SIZE = 12;

export const ITEMS_TARGET = 10;
export const COINS_TARGET = 100;
export const UNDERGROUND_TRAPS_TARGET = 30;
export const LIFE_HEARTS_TARGET = 3;

export const PLAYER_SPEED = 4; // tiles per second
export const PLAYER_HEARTS_MAX = 3;
export const PLAYER_INVULNERABLE_MS = 4000;
export const EXTRA_CONNECTION_RATIO = 0.2;
export const ENTITY_RADIUS = 0.3; // tiles

export const CAMERA_ZOOM = 2.2;
export const DESKTOP_CAMERA_ZOOM_MULT = 1.5;

// how far we can "snap" into a corridor while turning
export const TURN_ASSIST_TILES = 0.22;
export const TOUCH_TURN_ASSIST_TILES = 0.46;

export const BOMB_RADIUS_TILES = 8;
export const SPIKE_PURCHASE_COINS = 6;
export const BOMB_PURCHASE_COINS = 10;
export const NOT_ENOUGH_MONEY_POPUP_MS = 2000;

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
export const GHOST_SPEED_MULT = 0.72;
export const ENEMY_SENSE_RADIUS_TILES = 2;
export const ENEMY_SENSE_DETECT_RADIUS_TILES = 7;
export const ENEMY_SENSE_BUCKETS = 32;
export const ENEMY_SENSE_FADE_SPEED = 8;
export const GHOST_COUNT_MIN = 13;
export const GHOST_COUNT_MAX = 21;
export const GHOST_NIGHT_VISION_RADIUS_TILES = 4;
export const GHOST_SPAWN_MIN_DIST = 15;
export const GHOST_PATH_MIN_LENGTH_TILES = 60;
export const GHOST_APPEAR_ANIM_MS = 3000;
export const GHOST_DISAPPEAR_ANIM_MS = 3000;

// tiles from player at spawn
export const HUNTER_MIN_DIST = 12;
export const HUNTER_COUNT_MIN = 20;
export const HUNTER_COUNT_MAX = 30;
export const HUNTER_WALK_SPEED_MULT = 0.45;
export const HUNTER_CHASE_SPEED_MULT = 1.3;
export const HUNTER_AGGRESSIVE_SPEED_MULT = 0.75;
export const HUNTER_VISION_RADIUS_TILES = 9;
export const HUNTER_VISION_ANGLE_DEG = 60;
export const HUNTER_VISION_RAY_COUNT = 48;
export const HUNTER_ROTATE_ANIM_MS = 1000;
export const HUNTER_CHASE_ROTATE_ANIM_MULT = 0.5;
export const HUNTER_BACK_CHECK_CHANCE = 0.1;
export const HUNTER_BACK_CHECK_LOOK_MS = 900;
export const HUNTER_BACK_CHECK_MIN_CLEAR_TILES = 2;
export const HUNTER_NERVOUS_SCAN_TURN_MS = 220;
export const HUNTER_NERVOUS_SCAN_HOLD_MS = 80;
export const HUNTER_NERVOUS_SCAN_DURATION_MS = 4000;
export const HUNTER_PATROL_MIN_STRAIGHT_STEPS = 2;
export const HUNTER_PATROL_MAX_STRAIGHT_STEPS = 6;
export const HUNTER_SHORT_CORRIDOR_TILES = 4;
export const HUNTER_CHASER_PLACE_DURATION_MS = 5000;
export const HUNTER_CHASER_PLACE_CHANCE_NO_CHASER = 0.5;
export const HUNTER_CHASER_PLACE_CHANCE_WITH_CHASER = 0.25;
export const HUNTER_CHASER_PLACE_DOT_STEP_MS = 350;
export const HUNTER_TURRET_PLACE_CHANCE_PER_STEP = 0.1;
export const HUNTER_TURRET_PLACE_DURATION_MS = 5000;

// Day-night cycle tuning.
export const DAY_NIGHT_INITIAL_DAY_DURATION_MS = 15000;
export const DAY_DURATION_MS = 40000;
export const NIGHT_DURATION_MS = 30000;
export const DAY_TO_NIGHT_TRANSITION_MS = 8000;
export const NIGHT_TO_DAY_TRANSITION_MS = 5000;
export const NIGHT_TO_DAY_VISION_DISABLE_DARKNESS_ALPHA = 0.45;
export const NIGHT_TO_DAY_VISION_FADE_RANGE_ALPHA = 0.2;
export const NIGHT_WARNING_TEXT_MS = 5000;
export const FLASHLIGHT_STARTUP_DELAY_MS = 3000;
export const FLASHLIGHT_STARTUP_FLICKER_MS = 1550;

// Night vision is hunter-like: a directional cone plus a tiny near circle.
export const PLAYER_NIGHT_VISION_RADIUS_TILES = 10;
export const PLAYER_NIGHT_NEAR_VISION_RADIUS_TILES = 3;
export const PLAYER_NIGHT_VISION_ANGLE_DEG = HUNTER_VISION_ANGLE_DEG;

export const TURRET_MAX_COUNT = 10;
export const TURRET_VISION_RADIUS_TILES = 10;
export const TURRET_VISION_ANGLE_DEG = 60;
export const TURRET_SWEEP_PERIOD_MS = 5000;
export const TURRET_FIRE_PERIOD_MS = 1000;
export const TURRET_PROJECTILE_SPEED_MULT = 5;
export const TURRET_LOST_TARGET_RETURN_DELAY_MS = 3000;
export const TURRET_LOCK_IN_TRANSITION_MS = 500;
export const TURRET_UNLOCK_TRANSITION_MS = 260;

export const HELPER_COUNT = 3;
// tiles from player at spawn
export const HELPER_MIN_DIST = 10;
// tiles
export const HELPER_MIN_PATH_LEN = 16;
export const HELPER_SPEED_MULT = 0.6;

export const TOUCH_CHASER_SPEED_MULT = 0.8;
export const TOUCH_JOYSTICK_MAX = 58;
export const TOUCH_JOYSTICK_DEADZONE = 0.18;

export const SWORD_SWING_DURATION_MS = 180;
export const SWORD_SWING_COOLDOWN_MS = 1000;
export const HUNTER_HEALTH = 3;
export const CHASER_HEALTH = 1;
