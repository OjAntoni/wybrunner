# Webrunner Architecture

## Entry Points

- `src/App.tsx`: minimal app shell.
- `src/hooks/useGameAppController.ts`: composes runtime, UI, and input hooks.
- `src/ui/GameView.tsx`: top-level game UI composition.

## Runtime Layers

- `src/game/model/*`: game state shape and initialization.
  - Includes day-night state anchors (`dayNightCycleStartMs`), player-facing direction (`playerFacing`) for night-vision cones, a smoothed facing vector (`playerFacingIndicator`) used by the player indicator render, player hearts with invulnerability timers, and sword swing timing/cooldown (`swordSwingStartMs`, `swordCooldownUntilMs`, `swordSwingHitMs`) for attack animation.
- Hunter state also tracks smoothed vision angle (`visionAngleDeg`) for cone transitions.
- `src/game/model/init/spawnActors.ts`: chooses player/hunter spawn cells with even spatial distribution (farthest-point sampling) and min-distance preference.
- `src/game/actions/*`: immediate player-triggered actions (equipment placement, purchases, sword swing animation triggers).
- `src/game/systems/*`: state mutation/update logic.
- `src/game/world/*`: pathing, exploration, fog, maze generation.
- `src/game/render/*`: canvas render pipeline and scene layers.
- `src/hooks/useGameLoop.ts` + `src/hooks/gameLoop/stepGameFrame.ts`: simulation-time clock advancement (advances only while gameplay is actively running), event-driven canvas resize (resize observer/window resize + DPR-change guard), and change-only UI counter sync to reduce per-frame React work.
- `src/hooks/useGameLoop.ts`: simulation frame delta is capped (`24ms`) so rare long RAF gaps do not produce large one-frame world jumps after a stall.
- `src/hooks/gameLoop/resizeCanvas.ts`: canvas back-buffer DPR is clamped (default max `1.5`, overridable with `window.__GAME_MAX_DPR__`) to reduce raster/compositor stalls that do not show up as JS update/draw time.
- `src/hooks/useGameLoop.ts`: optional adaptive DPR controller (enabled only when user has not set `window.__GAME_MAX_DPR__`) lowers DPR stepwise after repeated large external frame-gap spikes to reduce compositor misses during gameplay.
- `src/hooks/useGameLoop.ts` + `src/hooks/gameLoop/stepGameFrame.ts`: includes optional in-browser perf telemetry (`window.__GAME_PERF__ = true`) that separates RAF frame-gap timing from game busy time (`update + draw`) and emits threshold-based per-frame spike logs to distinguish external stalls from in-game work spikes.
- `src/hooks/runtime/useRuntimeCombat.ts`: player-triggered sword swing animation action.

## Controller Layers

- `src/hooks/controller/*`: app-level orchestration.
  - `useControllerState.ts`: React state + refs.
    - Includes `mapOpen` UI state for the interactive world map window.
  - `useControllerRuntime.ts`: runtime loop bindings.
  - `useControllerInteractions.ts`: UI action handlers.
  - `useControllerLifecycle.ts`: sync lifecycle/effects.
  - `useControllerTouchBindings.ts`: touch input wiring.
  - `useControllerKeyboardBindings.ts`: keyboard input wiring.
  - `useControllerMouseBindings.ts`: mouse input wiring for left-click sword swing.
  - `useControllerBehavior.ts`: combined behavioral logic.

## Input Layers

- `src/input/keymap.ts`: key-to-direction mapping.
- `src/input/keyboard/*`: keyboard event decision logic.
  - Includes dedicated map-open keyboard handler routing (`M` toggle/close behavior and map-state key blocking).
- `src/input/mouse/*`: mouse button routing (left-click sword swing while in active gameplay).
- `src/input/touch/*`: touch joystick math/guard rules.
- `src/input/touch/touchAction.ts`: shared touch-action helper.
- `src/hooks/useKeyboardControls.ts`: browser listener wrapper for keyboard.
- `src/hooks/useMouseControls.ts`: pointer listener wrapper for mouse input on the game canvas.
- `src/hooks/useTouchJoystick.ts`: touch-hook composition layer.
- `src/hooks/touch/useJoystickVisualState.ts`: joystick visual scheduling/DOM updates.
- `src/hooks/touch/useJoystickPointerHandlers.ts`: joystick pointer interaction flow.
- `src/hooks/touch/useJoystickPointerState.ts`: joystick pointer state and vector sampling.
- `src/hooks/touch/useTouchActionHandlers.ts`: trap/bomb/sword touch button handlers.

## Render Layers

- `src/game/render/scene.ts`: orchestrates scene render order, including night-time cloud blackening via black sprite variants and a post-night-overlay ghost-path + ghost render pass so ghosts are not darkened.
- `src/game/render/sceneViewport.ts`: camera/viewport setup.
- `src/game/render/sceneTerrainLayer.ts`: tiles + arrow throwers.
- `src/game/render/sceneObjectLayer.ts`: world object composition.
- `src/game/render/sceneCollectiblesLayer.ts`: coins/items/boosters.
- `src/game/render/coinLayer.ts`: coin rendering.
- `src/game/render/itemLayer.ts`: artifact rendering.
- `src/game/render/boosterLayer.ts`: booster rendering.
- `src/game/render/collectibleShared.ts`: collectible cell/bounds helpers.
- `src/game/render/sceneHazardsLayer.ts`: traps/spikes/underground traps.
- `src/game/render/sceneEffectsLayer.ts`: temporary visual effects (explosions).
- `src/game/render/sceneActors.ts`: player (including pulsing, smoothed facing indicator triangle, sword swing animation, and hidden-enemy sense arcs), dynamic monster list (chasers + night ghost pack) with tiny health hearts, hunters with tiny health hearts, turrets, helpers, player popup text, and hunter chaser/turret-placement popup text; ghost render includes lifecycle-driven alpha/scale (3s fade in/out), default/angry/sad face variants (`to_hunter` + `with_hunter` are angry/slightly red, `return_to_path` is sad/non-red), and exposes a tiny dotted white path-loop overlay draw used after night darkening.
- `src/game/render/hunterVisionLayer.ts`: hunter + turret vision rendering (wall-clipped sectors with turret cone-to-line targeting transition).
- `src/game/render/dayNightLayer.ts`: day-night darkening overlay that erases darkness on an offscreen darkness layer via `destination-out` using player near-circle + player cone + ghost circles (ghost circles respect ghost fade alpha and use partial erase for dimmer ghost-lit areas; escorting `with_hunter` ghosts use 3x ghost-erase strength), adds a thin perimeter ring for ghost circles (white by default, slightly red only for active relay states `to_hunter`/`with_hunter`), then composites that layer back to preserve underlying map colors, with flashlight startup flicker during day->night transition and center warning text draw.
- `src/game/render/dayNightLayer.ts`: player night-vision cone uses the smoothed facing indicator direction (`playerFacingIndicator`) each frame to avoid jittery front-edge snapping during movement/turning.
- `src/game/render/hudOcclusion.ts`: HUD overlap checks with cached rect sampling and change-only class toggles to avoid unnecessary DOM writes on every frame.
- `src/game/render/hunterVisionLayer.ts`: hunter cones are sampled each frame (smooth facing) to avoid cache-quantization jitter; turret cones remain cached per-entity using quantized pose + effective angle + terrain revision, with stale cache cleanup when turrets despawn.
- `src/game/render/sceneTerrainLayer.ts`: terrain tile colors are pre-rendered into a cached world canvas and each frame draws only the visible camera window (`drawImage` crop); cache invalidates when bomb explosions modify terrain and when game state swaps to a new grid instance (new run/restart).
- `src/game/render/cloudLayers.ts`: compatibility export for cloud layer entry points.
- `src/game/render/exploreCloudLayer.ts`: explored-area cloud rendering (supports day/night sprite variants with transition crossfade blend).
- `src/game/render/fogAreaLayer.ts`: fog-area cloud rendering (supports day/night sprite variants with transition crossfade blend).
- `src/game/render/cloudSprites.ts`: sprite cache entry points (day and night-black variants).
- `src/game/render/cloudSpriteDefs.ts`: cloud sprite palettes and style presets (day and night-black palettes).
- `src/game/render/cloudSpriteFactory.ts`: sprite canvas construction/caching.
- `src/game/render/fogOverlay.ts`, `src/game/render/guidance.ts`: overlays.
- `src/game/render/mapWindowScene.ts`: full-world map rendering pipeline (terrain, objects, actors, fog areas, exploration clouds, day-night overlay, then ghost-path overlay) with zoom/pan camera; cloud layers use darkness-driven day/night sprite crossfade.

## Update Pipeline

- `src/game/systems/updateState.ts`: orchestrator.
- `src/game/systems/update/playerProgress.ts`
- `src/game/systems/update/projectiles.ts`
- `src/game/systems/update/turret.ts` (static turret sweep/track/cooldown state machine + turret projectile firing)
- `src/game/systems/update/items.ts`
- `src/game/systems/update/timers.ts`
- `src/game/systems/update/sword.ts`: sword hit resolution on eligible mobs with health tracking and wall-blocked hit tiles.
- `src/game/systems/update/playerDamage.ts`: enemy-hit heart reduction + invulnerability timing.
- `src/game/systems/update/monster.ts` (typed `monsters[]` update: ground chaser pathing + full-night ghost pack spawn/despawn, sector-distributed ghost path generation for map-wide coverage, guaranteed smoothly player-anchored path for at least one ghost per night spawn, ghost-to-hunter relay logic [ghost detects player, remembers position, flies `2x` speed to closest patrol hunter, then escorts during commanded chase], smooth return-to-path movement (no snap teleport), per-ghost cyclic curved air-path movement that ignores walls, non-lethal ghost behavior, and 3s lifecycle fade timing for appear/disappear; chaser health is decremented by sword hits)
- `src/game/systems/update/hunter.ts` (multi-hunter patrol/chase update with patrol momentum/open-space steering + short-corridor escape bias + recent-cell anti-loop penalty + tight-loop 3x3 escape + last-seen nervous scan for a fixed duration + occasional 180-degree back-check behavior + timed chaser placement after failed chase + per-step probabilistic turret placement + ghost-command chase handling/release + hit-triggered aggressive chase with slowdown multiplier; chase BFS now uses index-based queue/parent arrays to avoid `shift()` and string-map churn)
- `src/game/systems/update/enemySense.ts`: bucketed hidden-enemy proximity indicator state with smooth fade-in/out.
- `src/game/systems/outcome.ts`: lose-state transition.
- `src/game/systems/artifactSpawns.ts`: booster/trap artifact effects.
- `src/game/systems/fogAreaSpawns.ts`: fog-area artifact generation.
- `src/game/systems/fogAreaGrowth.ts`: fog-area seed/growth/anchor helpers.
- `src/game/systems/fogAreaSeed.ts`: fog-area occupancy and seed selection.
- `src/game/systems/fogAreaCells.ts`: fog-area cell growth and anchor generation.
- `src/game/systems/helpers/spawnHelpers.ts`: helper spawn setup.
- `src/game/systems/helpers/updateHelpers.ts`: helper movement/combat update.
- `src/game/systems/dayNight.ts`: simulation-time day-night phase snapshot (initial short day, asymmetric transition durations, transition alphas, warning flags, flashlight startup delay + flicker alpha, and night->day vision smooth fade-out thresholding).
- `src/game/world/hunterVision.ts`: hunter/player/turret line-of-sight and cone ray sampling with exact grid-boundary ray casting (DDA) for wall clipping.
- `src/game/world/hunterFacing.ts`: hunter facing-angle/turn-animation helpers (1s rotation interpolation).
- `src/game/world/ghostVisibility.ts`: ghost lifecycle alpha helpers (3s fade-in/fade-out) shared by monster update and render layers.
- `src/game/world/pathingBfs.ts`: chaser BFS next-step pathing optimized with index-based queue/parent arrays (no `Array.shift()` / string key maps on hot path).

## UI Layers

- `src/ui/gameView/*`: segmented UI/overlay/menu components.
- `src/ui/gameView/menu/*`: menu screen variants.
- `src/ui/gameView/overlays/*`: game overlay widgets.
- `src/ui/gameView/GameScreenView.tsx`: in-game layer composition.
- `src/ui/gameView/MenuScreenView.tsx`: menu/controls overlay composition.
- `src/ui/gameView/overlays/MapOverlay.tsx`: interactive map window overlay, including desktop keyboard/mouse controls and touch drag/pinch support.
- `src/ui/gameView/InventoryPanel.tsx`: desktop/equipment inventory visuals and conditional item cost badges (shown when item count reaches zero).
- `src/ui/gameView/TouchLayer.tsx`: mobile controls including conditional trap/bomb cost badges (shown when item count reaches zero).

## Current Refactor Rule

- Keep orchestration files thin.
- Move branch-heavy logic into domain-focused modules.
- Prefer pure helpers for input/render computations.
- Keep each module aligned to one gameplay concern.
