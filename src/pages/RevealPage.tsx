import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GameState } from "../types";

interface Props {
  state: GameState;
  onNext: () => void;
}

type RevealStep = "pass" | "showing" | "hidden";

const ATTR_LABEL: Record<string, string> = {
  str: "Сила",
  agi: "Ловкость",
  int: "Интеллект",
  all: "Универсальный",
};

const ATTR_COLOR: Record<string, string> = {
  str: "bg-red-500/15 text-red-600 dark:text-red-400",
  agi: "bg-green-500/15 text-green-600 dark:text-green-400",
  int: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  all: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

export function RevealPage({ state, onNext }: Props) {
  const [step, setStep] = useState<RevealStep>("pass");

  const { currentRevealIndex, roles, hero } = state;
  const currentRole = roles[currentRevealIndex]!;
  const playerNum = currentRole.playerNumber;

  function handleReveal() {
    setStep("showing");
  }

  function handleHide() {
    setStep("hidden");
  }

  function handleNext() {
    setStep("pass");
    onNext();
  }

  if (step === "pass") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 bg-background">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">Передай устройство</p>
          <p className="text-5xl font-bold">Игроку {playerNum}</p>
        </div>
        <Button size="lg" className="w-full max-w-xs" onClick={handleReveal}>
          Показать роль
        </Button>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Не показывай экран другим игрокам
        </p>
      </div>
    );
  }

  if (step === "showing" && currentRole.isSpy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 bg-background">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground text-sm">Игрок {playerNum}</p>
          <p className="text-4xl font-black tracking-widest text-red-500 dark:text-red-400">
            ШПИОН
          </p>
          {currentRole.hint ? (
            <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4 max-w-xs mx-auto text-left space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Стартовая подсказка
              </p>
              <p className="text-sm">{currentRole.hint}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Угадай героя, слушая подсказки мирных жителей
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="lg"
          className="w-full max-w-xs"
          onClick={handleHide}
        >
          Скрыть
        </Button>
      </div>
    );
  }

  if (step === "showing" && !currentRole.isSpy && hero) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 bg-background">
        <div className="w-full max-w-xs space-y-4">
          <p className="text-muted-foreground text-sm text-center">Игрок {playerNum}</p>

          {/* Hero image */}
          <div className="rounded-xl overflow-hidden w-full aspect-video bg-muted">
            <img
              src={`/heroes/${hero.slug}.png`}
              alt={hero.localized_name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Hero name */}
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold">{hero.localized_name}</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <Badge className={ATTR_COLOR[hero.primary_attr]}>
                {ATTR_LABEL[hero.primary_attr]}
              </Badge>
              <Badge variant="outline">{hero.attack_type}</Badge>
              {hero.roles.slice(0, 2).map((r) => (
                <Badge key={r} variant="secondary">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="w-full max-w-xs"
          onClick={handleHide}
        >
          Скрыть
        </Button>
      </div>
    );
  }

  // hidden step
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 bg-background">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground text-sm">Игрок {playerNum} готов</p>
        <p className="text-lg font-medium text-muted-foreground">
          Передай устройство следующему
        </p>
      </div>
      <Button size="lg" className="w-full max-w-xs" onClick={handleNext}>
        {currentRevealIndex + 1 < state.playerCount
          ? `Далее → Игрок ${roles[currentRevealIndex + 1]!.playerNumber}`
          : "Начать игру"}
      </Button>
    </div>
  );
}
