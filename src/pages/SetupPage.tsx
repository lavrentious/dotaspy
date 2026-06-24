import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HeroSelectModal } from "../components/HeroSelectModal";
import type { Hero } from "../types";

interface Props {
  playerCount: number;
  spyCount: number;
  hintsEnabled: boolean;
  enabledHeroIds: Set<number>;
  allHeroes: Hero[];
  onStart: (
    playerCount: number,
    spyCount: number,
    hintsEnabled: boolean,
    enabledHeroIds: Set<number>
  ) => void;
  onHeroIdsChange: (ids: Set<number>) => void;
}

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;

export function SetupPage({
  playerCount,
  spyCount,
  hintsEnabled,
  enabledHeroIds,
  allHeroes,
  onStart,
  onHeroIdsChange,
}: Props) {
  const [players, setPlayers] = useState(playerCount);
  const [spies, setSpies] = useState(spyCount);
  const [hints, setHints] = useState(hintsEnabled);
  const [heroModalOpen, setHeroModalOpen] = useState(false);

  const maxSpies = players - 2;
  const effectiveSpies = Math.min(spies, maxSpies);

  function handleSpiesChange(delta: number) {
    setSpies((s) => Math.min(maxSpies, Math.max(1, s + delta)));
  }

  function handlePlayersChange(delta: number) {
    const next = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, players + delta));
    setPlayers(next);
    if (effectiveSpies > next - 2) setSpies(next - 2);
  }

  function handleStart() {
    onStart(players, effectiveSpies, hints, enabledHeroIds);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-center">Dota Spy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Players */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Игроки</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handlePlayersChange(-1)}
                disabled={players <= MIN_PLAYERS}
              >
                −
              </Button>
              <span className="text-2xl font-bold w-8 text-center">{players}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handlePlayersChange(1)}
                disabled={players >= MAX_PLAYERS}
              >
                +
              </Button>
            </div>
          </div>

          {/* Spies */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Шпионы</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleSpiesChange(-1)}
                disabled={effectiveSpies <= 1}
              >
                −
              </Button>
              <span className="text-2xl font-bold w-8 text-center">{effectiveSpies}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleSpiesChange(1)}
                disabled={effectiveSpies >= maxSpies}
              >
                +
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Мирных: {players - effectiveSpies}
            </p>
          </div>

          {/* Spy hints toggle */}
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={hints}
              onCheckedChange={(v) => setHints(!!v)}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Подсказки шпиону</span>
              <span className="text-xs text-muted-foreground">
                Если шпион ходит первым — он получит одну подсказку о герое
              </span>
            </div>
          </label>

          {/* Hero pool */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Пул героев</Label>
            <Button
              variant="outline"
              className="justify-between"
              onClick={() => setHeroModalOpen(true)}
            >
              <span>{enabledHeroIds.size} героев выбрано</span>
              <Badge variant="secondary">{allHeroes.length} всего</Badge>
            </Button>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
            disabled={enabledHeroIds.size === 0}
          >
            Начать игру
          </Button>
        </CardContent>
      </Card>

      <HeroSelectModal
        open={heroModalOpen}
        onClose={() => setHeroModalOpen(false)}
        heroes={allHeroes}
        enabledIds={enabledHeroIds}
        onChange={onHeroIdsChange}
      />
    </div>
  );
}
