# Game Logic and Mechanics

This document explains the current gameplay logic, mechanics, features, and component structure, with references to implementation files.

## 1. Game Goal

- The player explores a procedurally generated maze, collects artifacts, and avoids lethal threats.
- Win condition: collect all artifacts.
- Lose conditions: hearts depleted by enemy hit (chaser/hunter/helper/arrow) or trap damage.

Code references:
- `src/game/config/constants.ts`
- `src/game/systems/update/items.ts`
- `src/game/systems/outcome.ts`

## 2. Core Runtime Flow

- App entry renders a controller-driven view model.
- Controller composes runtime, interaction bindings, and lifecycle sync.
- Frame loop updates state, then renders canvas every frame.
- Runtime uses a simulation clock that only advances during active gameplay; pause/map/equipment/restart-confirm/menu states freeze game time.
- Runtime simulation delta is clamped per frame (`24ms`) to reduce visible movement jumps after occasional external browser/compositor stalls.
- Canvas back-buffer resizing is event-driven (resize observer / window resize / DPR change) rather than forced every frame.
- Canvas render DPR is capped by default to `1.5` to reduce compositor/GPU spikes on high-DPR displays; optional override is available via `window.__GAME_MAX_DPR__`.
- HUD counters (items/coins/hearts) sync to React state only when values change.
- HUD counters (items/coins/hearts) are synced with React transitions to reduce main-thread contention with canvas draw/update work.
- Lose reason is also synced from game state inside the frame loop (no direct update callback from simulation systems).
- Optional runtime perf logging can be enabled from browser console via `window.__GAME_PERF__ = true`, printing periodic RAF-gap and game-work timing summaries with spike counts; detailed per-spike lines are printed only when `window.__GAME_PERF_VERBOSE__ = true`.
- In-game overlays are mounted only when active (pause/map/equipment/restart/end), so normal coin/heart HUD updates avoid running closed-overlay hook trees.
- HUD/overlay/touch inventory UI blocks are memoized with focused prop checks, so unrelated events (for example coin updates) skip re-rendering unaffected control layers.

Code references:
- `src/App.tsx`
- `src/hooks/useGameAppController.ts`
- `src/hooks/controller/useControllerBehavior.ts`
- `src/hooks/controller/useControllerLifecycle.ts`
- `src/hooks/useGameLoop.ts`
- `src/hooks/gameLoop/stepGameFrame.ts`

## 3. World Generation and Initial Placement

- Maze uses DFS carving + extra connection pass for less linear paths.
- Initial placement pipeline spawns player plus a hunter pack (randomly 10-15 hunters, minimum 10), artifacts/coins, underground traps, wall arrow throwers, and the exploration cloud field + bucket index.
- Initial placement also spawns 3 life-heart pickups, each placed near a different artifact when possible.
- No red chaser is spawned at game start; chasers are introduced later by hunter behavior.
- No turrets are spawned at game start; turrets are introduced later by hunter behavior.

Code references:
- `src/game/world/maze.ts`
- `src/game/model/initGame.ts`
- `src/game/model/initGamePlacements.ts`
- `src/game/model/init/spawnActors.ts`
- `src/game/model/init/spawnCollectibles.ts`
- `src/game/model/init/spawnArrowThrowers.ts`
- `src/game/world/exploreCloudGeneration.ts`
- `src/game/world/exploreCloudBuckets.ts`

## 4. Player Movement and Progress

- Input direction combines keyboard + touch joystick.
- Movement uses collision-aware movement/turn assist logic.
- Entering new cells updates exploration clearing and discovered artifacts.
- Coin collection increments counter.
- Coin pickup also triggers a short gold burst effect at the pickup cell to smooth daytime coin disappearance.
- Life-heart pickup grants +1 player life.
- Sword swing animation triggers on attack input and sweeps from right shoulder to left; the visual hit zone covers front, two-steps front, left, right, and front diagonals (6 tiles total) with a 1s cooldown between swings.
- Sword hits remove one heart from chasers and hunters in the hit tiles; chasers have 1 heart, hunters have 3, and turrets/ghosts are immune. Hits require clear line-of-sight (no wall between player and hit tile). Tiny heart pips render above each damageable mob. Hit mobs flicker briefly when damaged; hunters are stunned for 0.7s and then become aggressive (chasing in the hit direction, then a 4s nervous scan that moves around the last-seen area while turning).
- When a hunter is killed, it drops loot: 30% chance to drop 1 life-heart pickup, 50% chance to drop 5 coins, 20% chance to drop nothing.
- Player starts with 3 hearts. Enemy hits (caught/arrow/helper) remove one heart; if at least 2 remain, the player enters a smooth hurt-pulse visibility effect and is invisible to enemies for 4s. If only 1 heart remains, the next enemy hit ends the game.
- Underground traps stay hidden while first stepped on and only reveal after the player leaves; stepping onto a revealed underground trap removes one heart.
- Hidden-enemy sense: if a chaser/hunter/turret is under undiscovered clouds within 7 tiles, a red, softly blurred arc appears on an invisible 2-tile radius ring around the player pointing toward that enemy; arcs fade in/out smoothly.

Code references:
- `src/game/input/direction.ts`
- `src/game/systems/movement.ts`
- `src/game/systems/update/playerProgress.ts`
- `src/game/world/exploration.ts`

## 5. Equipment Mechanics

### Spikes

- Can place spike on current walkable cell if inventory allows.
- If no spikes are left, player can still place one by paying 6 coins.
- If no spikes are left and coins are below 6, a short "Not enough money" popup appears above the player.
- Chaser stepping on spike is stunned.
- Hunters stepping on spike are stunned the same way as chaser.

Code references:
- `src/game/actions/equipment.ts`
- `src/game/systems/update/monster.ts`

### Bombs

- Bomb destroys walls in circular radius.
- If no bombs are left, player can still use one by paying 10 coins.
- If no bombs are left and coins are below 10, a short "Not enough money" popup appears above the player.
- Also clears traps and underground traps in blast.
- Can remove helpers/hunters and invalidate arrows/throwers affected by wall destruction.
- Chasers placed by hunters are bomb-killable (removed if inside blast radius).
- Bombs do not affect ghosts.

Code references:
- `src/game/actions/equipment.ts`
- `src/game/world/bombs.ts`

## 6. Monsters (Chaser + Ghost)

- Monster runtime uses a dynamic mixed enemy list (`state.monsters`) with typed entries:
  - `chaser`: hunter-placed ground monster.
  - `ghost`: night-only flying monster.
- No chaser exists initially; hunters may place chasers later.
- Chaser pathing uses BFS next step; falls back to nearest-neighbor steering.
- Chaser and hunter BFS path searches use index-based queue/parent arrays to reduce GC spikes during enemy updates.
- Chaser avoids immediate reverse turns when possible.
- Chaser speed modifiers include base multiplier, touch-mode multiplier, and temporary boost multiplier.
- Chaser body is hidden while the chaser tile is still on undiscovered land.
- Ghost lifecycle:
  - a ghost pack is auto-spawned when full `night` phase starts.
  - pack size is randomized in range `13-21`.
  - each ghost spawn point is at least `15` tiles away from player.
  - each ghost fades in on spawn (`3s` appear animation).
  - when full night ends, each ghost starts a `3s` fade-out animation and is removed when fade completes.
- Ghost movement:
  - does not chase player.
  - each ghost follows its own predefined cyclic curved path in continuous motion.
  - each generated path has total loop length at least `60` tiles.
  - path centers are distributed by map sectors (with jitter), so ghost paths are spread more evenly across the map.
  - at least one ghost path per night is smoothly deformed to pass through the player's current position at spawn time (no hard corner snap).
- if ghost sees player, it remembers that position, switches to relay behavior, and flies at `2x` ghost speed to the closest hunter in default (`patrol`) state.
- when ghost meets that hunter, hunter is forced into chase toward remembered player position and ghost escorts the hunter (matching hunter movement speed/position).
- while escorting or returning to its path, the ghost keeps watching for the player and refreshes the remembered chase target when it sees them again.
  - if hunter reaches that destination and still cannot see player, hunter returns to default (`patrol`) state and ghost returns to its cyclic path using normal ghost movement (no snap teleport).
  - ignores wall collision/pathing (air movement above the maze).
- Ghost visibility:
  - rendered as a slightly transparent white flying mob.
  - while ghost is actively relaying (`to_hunter`, `with_hunter`), it uses an angry face.
  - active relay ghost body is slightly red-tinted.
  - while ghost is returning to path (`return_to_path`), it uses a sad face with no red tint.
  - body visibility is animation-driven (smooth fade in/out).
  - each ghost predefined path is rendered as a tiny dotted white closed line.
  - ghost path lines are drawn above the night darkness layer, so they stay visible even outside revealed vision.
  - not hidden by exploration-cloud coverage.
- Collision with chaser triggers lose state; ghosts are non-lethal relays.

Code references:
- `src/game/systems/update/monster.ts`
- `src/game/world/pathingBfs.ts`
- `src/game/world/pathingSteering.ts`
- `src/game/config/constants.ts`

## 7. Hunters AI

- Hunters are spawned during map generation as additional enemies (at least 20, up to 30), distributed evenly across open cells.
- Patrol mode: slow random roaming with no predefined path.
- Patrol movement uses short straight-run momentum (`2-6` tiles before re-evaluating turns) and prefers directions with more open forward space, reducing tiny-area loops in wide open zones.
- Short-corridor escape bias: at junctions connected to a short corridor axis (<= `4` tiles each side), patrol hunters prefer side exits over bouncing forward/backward, which prevents corridor ping-pong loops.
- Patrol anti-loop memory: recent patrol cells are tracked and revisits are penalized during patrol direction scoring, reducing stuck circular orbits around tiny obstacles (e.g. `1x1` wall islands).
- Tight-loop escape: if recent patrol movement is confined to a `3x3` neighborhood, hunters try to pick an exit direction that leaves that neighborhood to break micro-orbits.
- Movement model:
  - Hunters can move in 8 directions.
  - Diagonal movement is allowed only when there is enough corner space (no wall clipping through blocked corners).
- Vision model:
  - Circular sector with radius `R` and central angle `60°` per hunter (`120°` while aggressive chase or nervous scan), with smooth transitions between angles.
  - Orientation follows each hunter heading (cardinal direction).
  - Walls block line-of-sight; vision rays stop at wall boundaries.
  - Hunter body and vision cone are hidden while hunter is on undiscovered land, except chase mode where hunter and cone remain visible.
- Chase model:
  - If player is inside visible cone with clear line-of-sight, that hunter enters chase.
- Aggressive movement speed (chase + nervous scan) is `1.3 * player speed * 0.75` (`0.975 * player speed`).
  - If player leaves vision while chasing, hunter continues toward last seen player position.
  - If hunter reaches last seen position without reacquiring vision, it nervously scans all directions in place.
  - Nervous scan direction is randomized per scan (clockwise or counterclockwise).
  - If player is still not seen after that scan, hunter returns to patrol mode.
- Ghost relay chase override:
  - If a ghost recruits a patrol hunter, that hunter receives a ghost-command chase target (remembered player position from the ghost).
  - While ghost command is active, ghost physically escorts the hunter and turret/chaser placement is suppressed.
  - On reaching ghost-command destination without reacquiring vision, hunter immediately returns to patrol and releases ghost back to path mode.
- After an unsuccessful nervous scan, hunter can start chaser placement at its current tile:
    - placement duration is `5s`.
    - chance is `50%` when no chaser exists, `25%` when at least one chaser already exists.
    - while placing, hunter shows `Placing the chaser` text with loading dots (`. -> .. -> ...`) above itself.
    - when placement completes, a bomb-killable chaser is spawned on the hunter tile.
- Turret placement:
  - On each completed hunter movement step, that hunter can start turret placement with `10%` probability (if under turret cap).
  - Placement duration is `5s` and uses the same loading-dots popup style as chaser placement (`Placing the turret...`).
  - Turret cap is `10` active turrets.
- Rotation model:
  - When hunter changes heading, facing rotation is animated for `1s`.
  - While chasing, rotation animation is `2x` faster (`0.5s`).
  - Vision cone and hunter eye direction use the animated facing angle.
- Back-check behavior:
  - In straight corridor cells (middle-of-road), a patrol hunter can occasionally turn `180°` to scan behind.
  - Trigger condition includes at least `2` open tiles behind hunter before the nearest wall.
  - Trigger probability on applicable cells is low (`10%`).
  - Hunter pauses, rotates to back view, checks for a short time, rotates back, then continues patrol.
- Contact with any hunter triggers lose state (`caught`).

Code references:
- `src/game/systems/update/hunter.ts`
- `src/game/world/hunterVision.ts`
- `src/game/world/hunterFacing.ts`
- `src/game/config/constants.ts`

## 8. Turret AI

- Turrets are static enemies spawned by hunters during gameplay.
- Vision model:
  - Radius `10` tiles, sector angle `60°`, wall-clipped line-of-sight (same visibility constraints as other enemies on unexplored land).
- Default mode (`sweep`):
  - Continuously rotates `360°` every `5s`.
- Targeting mode (`track`):
  - When player is visible, turret tracks player angle.
  - First shot is fired only after the lock-in aiming animation completes (`0.5s`), then it fires once per second.
  - Turret projectiles fly at `5x` player speed.
  - Vision presentation transitions from cone to a narrow red targeting line.
- Lost-target mode (`cooldown`):
  - If line-of-sight is lost, turret keeps its last lock for `3s`.
  - If vision is not reacquired, it transitions back to sweep mode with reversed line-to-cone animation.
- Turrets are bomb-destroyable and are unaffected by spikes.

Code references:
- `src/game/systems/update/turret.ts`
- `src/game/systems/update/hunter.ts`
- `src/game/render/hunterVisionLayer.ts`
- `src/game/render/sceneActors.ts`
- `src/game/config/constants.ts`

## 9. Projectile System (Arrow Throwers + Turret Shots)

- Throwers are embedded in wall cells and fire on intervals, with a 0.5s windup animation before each shot.
- Arrows move continuously and collide with walls/player.
- Bombed thrower walls disable corresponding throwers.
- Turrets also fire projectiles that share the projectile update/collision pipeline.

Code references:
- `src/game/systems/update/projectiles.ts`
- `src/game/actions/equipment.ts`
- `src/game/render/sceneTerrainLayer.ts`
- `src/game/render/sceneProjectileLayer.ts`

## 10. Artifact Effects and Dynamic Hazards

- Each artifact pickup can trigger one of three effects: spawn boosters, spawn traps, or activate fog-of-war and fog areas.
- After enough artifact progress, helper enemies spawn.

Code references:
- `src/game/systems/update/items.ts`
- `src/game/systems/artifacts.ts`
- `src/game/systems/artifactSpawns.ts`
- `src/game/systems/fogAreaSpawns.ts`
- `src/game/systems/helpers/spawnHelpers.ts`

## 11. Helpers (Secondary Enemies)

- Helpers spawn with generated patrol paths.
- They move along path endpoints with direction reversal.
- They can consume traps/boosters and can kill the player on contact.

Code references:
- `src/game/systems/helpers/spawnHelpers.ts`
- `src/game/systems/helpers/updateHelpers.ts`
- `src/game/world/pathingHelperPath.ts`

## 12. Exploration and Fog Systems

### Exploration Clouds

- Map starts cloud-covered; local area clears as player moves.
- Cloud queries are bucketed for performance.
- Artifact discovery depends on cloud coverage state.

Code references:
- `src/game/world/exploreCloudGeneration.ts`
- `src/game/world/exploreCloudBuckets.ts`
- `src/game/world/exploration.ts`

### Fog-of-War Event

- Artifact fog effect triggers timed fog overlay.
- Additional fog areas are procedurally grown far from player.
- Fog areas have clip paths, animated cloud sprites, and fade in/out behavior.

Code references:
- `src/game/systems/fogAreaSpawns.ts`
- `src/game/systems/fogAreaSeed.ts`
- `src/game/systems/fogAreaCells.ts`
- `src/game/world/fogAreas.ts`
- `src/game/render/fogAreaLayer.ts`
- `src/game/render/fogOverlay.ts`

## 13. Rendering Pipeline

Per frame, draw order is orchestrated in `drawScene`:

1. Prepare camera/viewport.
2. Terrain + throwers (terrain is drawn from a cached world-sized layer and refreshed when bombs change walls or when a new run loads a new grid).
3. World objects and arrows.
4. Fog areas and exploration clouds.
5. Hunter + turret vision layers, helpers, hunters, turrets, player (with smoothed facing indicator triangle), monsters (chaser).
6. Temporary fog overlay + guidance arrows + night lighting overlay, then ghost path overlay and ghost bodies (drawn after darkening).
7. Temporary popup text layers (player insufficient-money popup, hunter chaser/turret-placement popups).

Camera behavior:
- Camera follow is smoothed each frame and adds a longer, smoother zoom-in/out transition when nearby hunters are actively chasing.
- Chase zoom uses a soft enter/exit blend with release radius + short hold time to prevent flicker/jumps when hunter distance hovers near threshold.
- During active chase zoom, a subtle heartbeat pulse is applied to camera zoom to increase tension.
- During active chase pulse, the scene also applies a soft red blurred border vignette synced to the heartbeat.
- Camera/chase blend smoothing is frame-time normalized (delta-based), and heartbeat pulse uses eased zoom-in/zoom-out (non-sinusoidal) for smoother transitions under variable frame pacing.

Code references:
- `src/game/render/scene.ts`
- `src/game/render/sceneViewport.ts`
- `src/game/render/camera.ts`
- `src/game/render/sceneTerrainLayer.ts`
- `src/game/render/sceneObjectLayer.ts`
- `src/game/render/sceneProjectileLayer.ts`
- `src/game/render/sceneActors.ts`
- `src/game/render/hunterVisionLayer.ts`
- `src/game/world/hunterVision.ts`
- `src/game/render/guidance.ts`

## 14. Day-Night Cycle and Player Night Vision

- The day-night timeline starts with a short first day:
  - initial day: `15s`
  - day->night transition: `8s` (full-screen darkening)
  - night: `30s`
  - night->day transition: `5s` (full-screen brightening)
- After the first cycle, the loop repeats with standard timings:
  - day: `40s`
  - day->night transition: `8s`
  - night: `30s`
  - night->day transition: `5s`
- During day->night transition, a large center warning text appears: `Night is coming...` using the same retro pixel font as the rest of the game.
- During day->night transition, player night vision starts after a `3s` delay, then performs a startup flicker sequence (on `0.25s` -> off `0.5s` -> on `0.4s` -> off `0.4s` -> steady on); during off windows, player vision mask is fully disabled.
- During night->day transition, player night vision smoothly fades out and then turns off once ambient brightness is high enough.
- During full night, the map is dark except for shared night vision:
  - directional cone vision with radius `10` tiles and hunter-like cone angle.
  - guaranteed near-circle visibility with radius `3` tiles around the player.
  - every ghost contributes additional circular visibility (`4` tile radius) around its position.
  - ghost visibility circles are intentionally dimmer than player vision (partial darkness erase).
  - when ghost is escorting a hunter (`with_hunter` relay state), its vision circle becomes `3x` less dark (triple erase strength) relative to normal ghost vision.
  - ghost visibility circles follow ghost fade alpha during appear/disappear animation.
  - each ghost visibility circle has a thin perimeter ring; actively relaying ghosts (`to_hunter`, `with_hunter`) use a slightly red ring.
  - player-visible area preserves original scene colors (no monochrome/dim tint grading).
  - darkness is erased on a dedicated darkness overlay (`destination-out`) with three vision shapes: player near circle, player cone, and ghost circles.
  - overlapping vision areas remain visible as a union (no overlap darkening).
  - cone/wall clipping uses exact grid-boundary ray casting (DDA) for sharper wall silhouettes without step-based scalloping.
  - turret vision cone boundary sampling is cached across frames; hunter and player night-vision cones sample every frame using smooth facing to avoid front-edge snapping/jitter.
  - visible areas use hard borders only (no perimeter soft-transition/falloff).
  - exploration clouds and fog-area clouds smoothly crossfade between day sprites and black night sprites during transitions; full night uses the black variant.
  - only the vision mask area remains visible; outside it is darkened.
- Player vision cone direction uses the player's last non-zero movement input (`playerFacing`), so the cone remains stable while standing still.

Code references:
- `src/game/config/constants.ts`
- `src/game/systems/dayNight.ts`
- `src/game/render/dayNightLayer.ts`
- `src/game/render/scene.ts`
- `src/game/render/mapWindowScene.ts`
- `src/game/systems/update/playerProgress.ts`
- `src/game/model/types/state.ts`
- `src/game/model/initGame.ts`

## 15. Input Model

### Keyboard

- Keydown handling is split by UI/game state (menu, paused, equipment, restart confirm, playing).
- Main menu shortcuts include `Enter`/`Space` to start, `C` for Controls, and `B` for Bestiary.
- While paused in-game, `B` also opens Bestiary from the pause menu and `Esc` from Bestiary returns to the paused game.
- Direction keys feed movement set; actions trigger spike/bomb/restart/equipment flows.
- Sword swing input uses `E` or left mouse button.
- Desktop map controls:
  - `M` opens/closes the map window while in-game.
  - While map is open, gameplay actions are blocked and play stays paused.
  - When zoomed in, map panning supports `W/A/S/D` (or arrow keys) and mouse dragging.
  - Zoom supports mouse wheel and `+` / `-`.

Code references:
- `src/hooks/useKeyboardControls.ts`
- `src/input/keyboard/handleKeyDown.ts`
- `src/input/keyboard/handlers/`
- `src/input/keymap.ts`

### Touch

- Joystick uses pointer capture + sampled vector with deadzone.
- Touch action buttons invoke spike/bomb placement.
- Touch includes a sword action button for swing animation.
- Touch-mode detector adjusts UI and gameplay tuning.
- Map access is menu-driven (pause menu `Map` button), with drag/pinch zoom support and on-screen zoom buttons.

Code references:
- `src/hooks/useTouchJoystick.ts`
- `src/hooks/touch/useJoystickPointerHandlers.ts`
- `src/hooks/touch/useJoystickPointerState.ts`
- `src/input/touch/joystickMath.ts`
- `src/input/touch/joystickGuard.ts`
- `src/hooks/useTouchMode.ts`

## 16. UI Components

- `GameView` chooses between game screen and menu screen composition.
- HUD, overlays, touch layer, and menu content are split into dedicated UI modules.
- Main menu now includes a Bestiary screen: a clickable enemy list (with portraits) and a detail pane with portrait, hearts, damage impact, day/night activity, and behavior description.
- Bestiary is also accessible from the in-game pause menu and preserves return context (Back/Esc returns to paused gameplay when opened from pause).
- Equipment costs are surfaced only when an item inventory is empty: desktop inventory shows spike/bomb coin cost on the first slot icon; mobile touch action buttons show the same costs.
- HUD life display uses a fixed base heart strip (3 hearts) plus a `+N` overflow indicator, avoiding layout jitter when max life temporarily exceeds the base.

### Map Window

- In-game map overlay renders the full world state: terrain, artifacts, hazards, enemies, fog areas, and exploration clouds.
- Opening map pauses gameplay updates and freezes timed effects; closing map returns either to paused menu or directly to gameplay depending on entry path.
- Desktop entry points: `M` key and pause menu `Map` button.
- Touch entry point: pause menu `Map` button.

Code references:
- `src/ui/GameView.tsx`
- `src/ui/gameView/GameScreenView.tsx`
- `src/ui/gameView/MenuScreenView.tsx`
- `src/ui/gameView/HudLayer.tsx`
- `src/ui/gameView/TouchLayer.tsx`
- `src/ui/gameView/GameOverlays.tsx`
- `src/ui/gameView/overlays/MapOverlay.tsx`
- `src/ui/gameView/menu/`
- `src/ui/gameView/overlays/`
- `src/game/render/mapWindowScene.ts`

## 17. Key Tunables

Gameplay and balancing constants are centralized in:

- `src/game/config/constants.ts`

Examples: map size, speeds, bomb radius, fog durations, helper counts, touch multipliers.

## 18. State Model

Game state and domain types are organized as:

- `src/game/model/types/basic.ts`
- `src/game/model/types/entities.ts`
- `src/game/model/types/clouds.ts`
- `src/game/model/types/state.ts`
- `src/game/model/types.ts` (public facade)

## 19. Additional Architecture Reference

For module layering and current refactor boundaries:

- `ARCHITECTURE.md`
