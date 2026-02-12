# Webrunner Architecture

## Entry Points

- `src/App.tsx`: minimal app shell.
- `src/hooks/useGameAppController.ts`: composes runtime, UI, and input hooks.
- `src/ui/GameView.tsx`: top-level game UI composition.

## Runtime Layers

- `src/game/model/*`: game state shape and initialization.
- `src/game/systems/*`: state mutation/update logic.
- `src/game/world/*`: pathing, exploration, fog, maze generation.
- `src/game/render/*`: canvas render pipeline and scene layers.

## Controller Layers

- `src/hooks/controller/*`: app-level orchestration.
  - `useControllerState.ts`: React state + refs.
  - `useControllerRuntime.ts`: runtime loop bindings.
  - `useControllerInteractions.ts`: UI action handlers.
  - `useControllerLifecycle.ts`: sync lifecycle/effects.
  - `useControllerTouchBindings.ts`: touch input wiring.
  - `useControllerKeyboardBindings.ts`: keyboard input wiring.
  - `useControllerBehavior.ts`: combined behavioral logic.

## Input Layers

- `src/input/keymap.ts`: key-to-direction mapping.
- `src/input/keyboard/*`: keyboard event decision logic.
- `src/input/touch/*`: touch joystick math/guard rules.
- `src/input/touch/touchAction.ts`: shared touch-action helper.
- `src/hooks/useKeyboardControls.ts`: browser listener wrapper for keyboard.
- `src/hooks/useTouchJoystick.ts`: touch-hook composition layer.
- `src/hooks/touch/useJoystickVisualState.ts`: joystick visual scheduling/DOM updates.
- `src/hooks/touch/useJoystickPointerHandlers.ts`: joystick pointer interaction flow.
- `src/hooks/touch/useJoystickPointerState.ts`: joystick pointer state and vector sampling.
- `src/hooks/touch/useTouchActionHandlers.ts`: trap/bomb touch button handlers.

## Render Layers

- `src/game/render/scene.ts`: orchestrates scene render order.
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
- `src/game/render/sceneActors.ts`: player, monster, helpers.
- `src/game/render/cloudLayers.ts`: compatibility export for cloud layer entry points.
- `src/game/render/exploreCloudLayer.ts`: explored-area cloud rendering.
- `src/game/render/fogAreaLayer.ts`: fog-area cloud rendering.
- `src/game/render/cloudSprites.ts`: sprite cache entry points.
- `src/game/render/cloudSpriteDefs.ts`: cloud sprite palettes and style presets.
- `src/game/render/cloudSpriteFactory.ts`: sprite canvas construction/caching.
- `src/game/render/fogOverlay.ts`, `src/game/render/guidance.ts`: overlays.

## Update Pipeline

- `src/game/systems/updateState.ts`: orchestrator.
- `src/game/systems/update/playerProgress.ts`
- `src/game/systems/update/projectiles.ts`
- `src/game/systems/update/items.ts`
- `src/game/systems/update/timers.ts`
- `src/game/systems/update/monster.ts`
- `src/game/systems/outcome.ts`: lose-state transition.
- `src/game/systems/artifactSpawns.ts`: booster/trap artifact effects.
- `src/game/systems/fogAreaSpawns.ts`: fog-area artifact generation.
- `src/game/systems/fogAreaGrowth.ts`: fog-area seed/growth/anchor helpers.
- `src/game/systems/fogAreaSeed.ts`: fog-area occupancy and seed selection.
- `src/game/systems/fogAreaCells.ts`: fog-area cell growth and anchor generation.
- `src/game/systems/helpers/spawnHelpers.ts`: helper spawn setup.
- `src/game/systems/helpers/updateHelpers.ts`: helper movement/combat update.

## UI Layers

- `src/ui/gameView/*`: segmented UI/overlay/menu components.
- `src/ui/gameView/menu/*`: menu screen variants.
- `src/ui/gameView/overlays/*`: game overlay widgets.
- `src/ui/gameView/GameScreenView.tsx`: in-game layer composition.
- `src/ui/gameView/MenuScreenView.tsx`: menu/controls overlay composition.

## Current Refactor Rule

- Keep orchestration files thin.
- Move branch-heavy logic into domain-focused modules.
- Prefer pure helpers for input/render computations.
- Keep each module aligned to one gameplay concern.
