import { Button } from "@/components/ui/button";
import type { GameState } from "../types";

interface Props {
  state: GameState;
  onReset: () => void;
}

export function GameStartPage({ state, onReset }: Props) {
  const { roles, firstSpeakerIndex } = state;
  const firstSpeaker = roles[firstSpeakerIndex]!;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-10 bg-background">
      <div className="text-center space-y-6 w-full max-w-xs">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Все роли розданы
          </p>
          <p className="text-3xl font-bold">Игра начинается!</p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-6 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Первым ходит
          </p>
          <p className="text-4xl font-black">
            Игрок {firstSpeaker.playerNumber}
          </p>
        </div>

        <div className="text-sm text-muted-foreground space-y-1 text-left">
          <p>
            По очереди делитесь подсказками или задавайте вопросы. Мирные — ищут
            шпиона. Шпион — угадывает героя.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onReset}
        className="w-full max-w-xs"
      >
        Новая игра
      </Button>
    </div>
  );
}
