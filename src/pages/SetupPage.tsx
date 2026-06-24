import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCheck, Loader } from "lucide-react";
import { HeroSelectModal } from "../components/HeroSelectModal";
import type { Hero } from "../types";

const CACHE_NAME = "dotaspy-v1";

type CacheStatus = "idle" | "loading" | "done" | "error";

async function cacheAllHeroes(
  heroes: Hero[],
  onProgress: (n: number) => void
): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  for (let i = 0; i < heroes.length; i++) {
    const url = `/heroes/${heroes[i]!.slug}.png`;
    if (!(await cache.match(url))) {
      await cache.add(url);
    }
    onProgress(i + 1);
  }
}

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
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>("idle");
  const [cacheProgress, setCacheProgress] = useState(0);

  async function handleCacheAll() {
    if (cacheStatus === "loading") return;
    setCacheStatus("loading");
    setCacheProgress(0);
    try {
      await cacheAllHeroes(allHeroes, setCacheProgress);
      setCacheStatus("done");
    } catch {
      setCacheStatus("error");
    }
  }

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

          {"caches" in window && (
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={handleCacheAll}
              disabled={cacheStatus === "loading" || cacheStatus === "done"}
            >
              <span className="flex items-center gap-2">
                {cacheStatus === "loading" ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : cacheStatus === "done" ? (
                  <CheckCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {cacheStatus === "loading"
                  ? `Загрузка... ${cacheProgress}/${allHeroes.length}`
                  : cacheStatus === "done"
                  ? "Готово к офлайну"
                  : cacheStatus === "error"
                  ? "Ошибка, попробуй ещё раз"
                  : "Скачать для офлайна"}
              </span>
              {cacheStatus === "idle" && (
                <span className="text-xs text-muted-foreground">~9 MB</span>
              )}
            </Button>
          )}

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
