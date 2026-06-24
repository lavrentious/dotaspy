import { useState } from "react";
import { useGameState } from "./hooks/useGameState";
import { SetupPage } from "./pages/SetupPage";
import { RevealPage } from "./pages/RevealPage";
import { GameStartPage } from "./pages/GameStartPage";
import "./index.css";

export function App() {
  const { state, startGame, advanceReveal, resetGame, allHeroes } = useGameState();
  const [enabledHeroIds, setEnabledHeroIds] = useState(
    () => new Set(allHeroes.map((h) => h.id))
  );

  if (state.phase === "reveal") {
    return <RevealPage state={state} onNext={advanceReveal} />;
  }

  if (state.phase === "game-start") {
    return <GameStartPage state={state} onReset={resetGame} />;
  }

  return (
    <SetupPage
      playerCount={state.playerCount}
      spyCount={state.spyCount}
      hintsEnabled={state.hintsEnabled}
      enabledHeroIds={enabledHeroIds}
      allHeroes={allHeroes}
      onStart={(players, spies, hints, ids) => {
        setEnabledHeroIds(ids);
        startGame(players, spies, hints, ids);
      }}
      onHeroIdsChange={setEnabledHeroIds}
    />
  );
}

export default App;
