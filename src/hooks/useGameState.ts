import { useState, useCallback } from "react";
import type { GameState, PlayerRole, Hero } from "../types";
import heroesData from "../data/heroes.json";

const ALL_HEROES = heroesData as Hero[];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr] as (T | undefined)[];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a as T[];
}

function pickRandomHints(hero: Hero, count: number): string[] {
  return shuffle([...hero.hints]).slice(0, count);
}

export function useGameState() {
  const [state, setState] = useState<GameState>({
    phase: "setup",
    playerCount: 4,
    spyCount: 1,
    hintsEnabled: true,
    enabledHeroIds: new Set(ALL_HEROES.map((h) => h.id)),
    hero: null,
    roles: [],
    firstSpeakerIndex: 0,
    currentRevealIndex: 0,
  });

  const startGame = useCallback(
    (
      playerCount: number,
      spyCount: number,
      hintsEnabled: boolean,
      enabledHeroIds: Set<number>
    ) => {
      const pool = ALL_HEROES.filter((h) => enabledHeroIds.has(h.id));
      const hero = pool[Math.floor(Math.random() * pool.length)]!;

      // Assign roles: shuffle player indices, first `spyCount` become spies
      const playerIndices = shuffle(
        Array.from({ length: playerCount }, (_, i) => i)
      );
      const spySet = new Set(playerIndices.slice(0, spyCount));

      // Pick random first speaker
      const firstSpeakerIndex = Math.floor(Math.random() * playerCount);

      // Determine speaking order starting from firstSpeakerIndex (wrap around)
      const speakingOrder: number[] = [];
      for (let i = 0; i < playerCount; i++) {
        speakingOrder.push((firstSpeakerIndex + i) % playerCount);
      }

      // Count consecutive spies at the start of speaking order
      let consecutiveLeadingSpies = 0;
      for (const playerIdx of speakingOrder) {
        if (spySet.has(playerIdx)) consecutiveLeadingSpies++;
        else break;
      }

      // Assign spy hints for leading consecutive spies (if hints enabled)
      const spyHintAssignments = new Map<number, string>();
      if (hintsEnabled && consecutiveLeadingSpies > 0) {
        const availableHints = pickRandomHints(hero, consecutiveLeadingSpies + 3);
        // Give leading spies hints in speaking order
        let hintIdx = 0;
        for (let i = 0; i < consecutiveLeadingSpies; i++) {
          const playerIdx = speakingOrder[i]!;
          spyHintAssignments.set(playerIdx, availableHints[hintIdx++] ?? hero.hints[0]!);
        }
      }

      // Build roles array indexed by reveal order (Player 1 → Player N)
      const roles: PlayerRole[] = Array.from({ length: playerCount }, (_, i) => ({
        playerNumber: i + 1,
        isSpy: spySet.has(i),
        hint: spySet.has(i) ? spyHintAssignments.get(i) : undefined,
      }));

      setState((prev) => ({
        ...prev,
        phase: "reveal",
        playerCount,
        spyCount,
        hintsEnabled,
        enabledHeroIds,
        hero,
        roles,
        firstSpeakerIndex,
        currentRevealIndex: 0,
      }));
    },
    []
  );

  const advanceReveal = useCallback(() => {
    setState((prev) => {
      const next = prev.currentRevealIndex + 1;
      if (next >= prev.playerCount) {
        return { ...prev, phase: "game-start", currentRevealIndex: next };
      }
      return { ...prev, currentRevealIndex: next };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "setup",
      hero: null,
      roles: [],
      currentRevealIndex: 0,
    }));
  }, []);

  return { state, startGame, advanceReveal, resetGame, allHeroes: ALL_HEROES };
}
