# Game Logic and Mechanics

This document explains the current gameplay logic, mechanics, features, and component structure, with references to implementation files.

## 1. Game Goal

- The player explores a procedurally generated maze, collects artifacts, and avoids lethal threats.
- Win condition: collect all artifacts.
- Lose conditions: caught by chaser or hunters, trap hit, helper collision, or arrow hit.

Code references:
- `src/game/config/constants.ts`
- `src/game/systems/update/items.ts`
- `src/game/systems/outcome.ts`

## 2. Core Runtime Flow

- App entry renders a controller-driven view model.
- Controller composes runtime, interaction bindings, and lifecycle sync.
- Frame loop updates state, then renders canvas every frame.
- Runtime uses a simulation clock that only advances during active gameplay; pause/map/equipment/restart-confirm/menu states freeze game time.

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
- No red chaser is spawned at game start; chasers are introduced later by hunter behavior.

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
- Underground traps are hidden on first step and lethal on second step.

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

Code references:
- `src/game/actions/equipment.ts`
- `src/game/world/bombs.ts`

## 6. Chaser (Monster) AI

- Chaser runtime uses a dynamic list of active chasers (`state.monsters`), which can be empty.
- No chaser exists initially; hunters may place chasers later.
- Chaser pathing uses BFS next step; falls back to nearest-neighbor steering.
- Avoids immediate reverse turns when possible.
- Speed modifiers include base multiplier, touch-mode multiplier, and temporary boost multiplier.
- Chaser body is hidden while the chaser tile is still on undiscovered land.
- Collision with player triggers lose state.

Code references:
- `src/game/systems/update/monster.ts`
- `src/game/world/pathingBfs.ts`
- `src/game/world/pathingSteering.ts`
- `src/game/config/constants.ts`

## 7. Hunters AI

- Hunters are spawned during map generation as additional enemies (at least 10, up to 15).
- Patrol mode: slow random roaming with no predefined path.
- Patrol movement uses short straight-run momentum (`2-6` tiles before re-evaluating turns) and prefers directions with more open forward space, reducing tiny-area loops in wide open zones.
- Movement model:
  - Hunters can move in 8 directions.
  - Diagonal movement is allowed only when there is enough corner space (no wall clipping through blocked corners).
- Vision model:
  - Circular sector with radius `R` and central angle `60°` per hunter.
  - Orientation follows each hunter heading (cardinal direction).
  - Walls block line-of-sight; vision rays stop at wall boundaries.
  - Hunter body and vision cone are hidden while hunter is on undiscovered land, except chase mode where hunter and cone remain visible.
- Chase model:
  - If player is inside visible cone with clear line-of-sight, that hunter enters chase.
  - Chase speed is `1.3 * player speed`.
  - If player leaves vision while chasing, hunter continues toward last seen player position.
  - If hunter reaches last seen position without reacquiring vision, it nervously scans all directions in place.
  - Nervous scan direction is randomized per scan (clockwise or counterclockwise).
  - If player is still not seen after that scan, hunter returns to patrol mode.
  - After an unsuccessful nervous scan, hunter can start chaser placement at its current tile:
    - placement duration is `5s`.
    - chance is `50%` when no chaser exists, `25%` when at least one chaser already exists.
    - while placing, hunter shows `Placing the chaser` text with loading dots (`. -> .. -> ...`) above itself.
    - when placement completes, a bomb-killable chaser is spawned on the hunter tile.
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

## 8. Projectile System (Arrow Throwers)

- Throwers are embedded in wall cells and fire on intervals.
- Arrows move continuously and collide with walls/player.
- Bombed thrower walls disable corresponding throwers.

Code references:
- `src/game/systems/update/projectiles.ts`
- `src/game/actions/equipment.ts`
- `src/game/render/sceneTerrainLayer.ts`
- `src/game/render/sceneProjectileLayer.ts`

## 9. Artifact Effects and Dynamic Hazards

- Each artifact pickup can trigger one of three effects: spawn boosters, spawn traps, or activate fog-of-war and fog areas.
- After enough artifact progress, helper enemies spawn.

Code references:
- `src/game/systems/update/items.ts`
- `src/game/systems/artifacts.ts`
- `src/game/systems/artifactSpawns.ts`
- `src/game/systems/fogAreaSpawns.ts`
- `src/game/systems/helpers/spawnHelpers.ts`

## 10. Helpers (Secondary Enemies)

- Helpers spawn with generated patrol paths.
- They move along path endpoints with direction reversal.
- They can consume traps/boosters and can kill the player on contact.

Code references:
- `src/game/systems/helpers/spawnHelpers.ts`
- `src/game/systems/helpers/updateHelpers.ts`
- `src/game/world/pathingHelperPath.ts`

## 11. Exploration and Fog Systems

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

## 12. Rendering Pipeline

Per frame, draw order is orchestrated in `drawScene`:

1. Prepare camera/viewport.
2. Terrain + throwers.
3. World objects and arrows.
4. Fog areas and exploration clouds.
5. Hunter vision cone layers, helpers, hunters, player, chaser.
6. Temporary fog overlay + guidance arrows.
7. Temporary popup text layers (player insufficient-money popup, hunter chaser-placement popup).

Code references:
- `src/game/render/scene.ts`
- `src/game/render/sceneViewport.ts`
- `src/game/render/sceneTerrainLayer.ts`
- `src/game/render/sceneObjectLayer.ts`
- `src/game/render/sceneProjectileLayer.ts`
- `src/game/render/sceneActors.ts`
- `src/game/render/hunterVisionLayer.ts`
- `src/game/world/hunterVision.ts`
- `src/game/render/guidance.ts`

## 13. Input Model

### Keyboard

- Keydown handling is split by UI/game state (menu, paused, equipment, restart confirm, playing).
- Direction keys feed movement set; actions trigger spike/bomb/restart/equipment flows.
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
- Touch-mode detector adjusts UI and gameplay tuning.
- Map access is menu-driven (pause menu `Map` button), with drag/pinch zoom support and on-screen zoom buttons.

Code references:
- `src/hooks/useTouchJoystick.ts`
- `src/hooks/touch/useJoystickPointerHandlers.ts`
- `src/hooks/touch/useJoystickPointerState.ts`
- `src/input/touch/joystickMath.ts`
- `src/input/touch/joystickGuard.ts`
- `src/hooks/useTouchMode.ts`

## 14. UI Components

- `GameView` chooses between game screen and menu screen composition.
- HUD, overlays, touch layer, and menu content are split into dedicated UI modules.
- Equipment costs are surfaced only when an item inventory is empty: desktop inventory shows spike/bomb coin cost on the first slot icon; mobile touch action buttons show the same costs.

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

## 15. Key Tunables

Gameplay and balancing constants are centralized in:

- `src/game/config/constants.ts`

Examples: map size, speeds, bomb radius, fog durations, helper counts, touch multipliers.

## 16. State Model

Game state and domain types are organized as:

- `src/game/model/types/basic.ts`
- `src/game/model/types/entities.ts`
- `src/game/model/types/clouds.ts`
- `src/game/model/types/state.ts`
- `src/game/model/types.ts` (public facade)

## 17. Additional Architecture Reference

For module layering and current refactor boundaries:

- `ARCHITECTURE.md`
