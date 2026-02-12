import { useGameAppController } from "./hooks";
import { GameView } from "./ui/GameView";

export default function App() {
  const { view, refs, actions } = useGameAppController();
  return <GameView view={view} refs={refs} actions={actions} />;
}
