import { GameOverlays } from "./GameOverlays";
import { HudLayer } from "./HudLayer";
import { TouchLayer } from "./TouchLayer";
import type { GameViewActions, GameViewModel, GameViewRefs } from "./types";

type GameScreenViewProps = {
  view: GameViewModel;
  refs: GameViewRefs;
  actions: GameViewActions;
};

export function GameScreenView({ view, refs, actions }: GameScreenViewProps) {
  const showTouchLayer =
    view.touchEnabled &&
    view.status === "playing" &&
    !view.paused &&
    !view.confirmRestartOpen &&
    !view.equipmentOpen;

  return (
    <>
      <HudLayer
        view={{
          compactHud: view.compactHud,
          status: view.status,
          touchEnabled: view.touchEnabled,
          itemsLeft: view.itemsLeft,
          coinsCollected: view.coinsCollected,
          spikesLeft: view.spikesLeft,
          bombsLeft: view.bombsLeft,
          helpText: view.helpText,
        }}
        refs={{ hudTopRef: refs.hudTopRef, inventoryRef: refs.inventoryRef }}
      />

      {showTouchLayer && (
        <TouchLayer
          view={{ spikesLeft: view.spikesLeft, bombsLeft: view.bombsLeft }}
          refs={{ joystickRef: refs.joystickRef, joystickKnobRef: refs.joystickKnobRef }}
          actions={{
            onPauseGame: actions.onPauseGame,
            onOpenEquipment: actions.onOpenEquipment,
            onJoystickPointerDown: actions.onJoystickPointerDown,
            onJoystickPointerMove: actions.onJoystickPointerMove,
            onJoystickPointerUp: actions.onJoystickPointerUp,
            onTrapPointerDown: actions.onTrapPointerDown,
            onBombPointerDown: actions.onBombPointerDown,
          }}
        />
      )}

      <GameOverlays
        view={{
          status: view.status,
          loseReason: view.loseReason,
          touchEnabled: view.touchEnabled,
          paused: view.paused,
          confirmRestartOpen: view.confirmRestartOpen,
          equipmentOpen: view.equipmentOpen,
          spikesLeft: view.spikesLeft,
          bombsLeft: view.bombsLeft,
          itemsLeft: view.itemsLeft,
          coinsCollected: view.coinsCollected,
        }}
        actions={{
          onGoToMainMenu: actions.onGoToMainMenu,
          onResumeFromPause: actions.onResumeFromPause,
          onPauseOpenEquipment: actions.onPauseOpenEquipment,
          onOpenControls: actions.onOpenControls,
          onOpenRestartConfirm: actions.onOpenRestartConfirm,
          onCloseEquipment: actions.onCloseEquipment,
          onResumeFromEquipment: actions.onResumeFromEquipment,
          onCloseRestartConfirm: actions.onCloseRestartConfirm,
          onRestartConfirmed: actions.onRestartConfirmed,
        }}
      />
    </>
  );
}
