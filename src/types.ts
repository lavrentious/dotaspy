export interface Hero {
  id: number;
  slug: string;
  localized_name: string;
  primary_attr: "str" | "agi" | "int" | "all";
  attack_type: "Melee" | "Ranged";
  roles: string[];
  hints: string[];
}

export type GamePhase = "setup" | "reveal" | "game-start";

export interface PlayerRole {
  playerNumber: number; // 1-based
  isSpy: boolean;
  hint?: string; // set only for spies in consecutive leading positions
}

export interface GameState {
  phase: GamePhase;
  playerCount: number;
  spyCount: number;
  hintsEnabled: boolean;
  enabledHeroIds: Set<number>;
  hero: Hero | null;
  roles: PlayerRole[];
  firstSpeakerIndex: number; // 0-based index into roles (speaking order)
  currentRevealIndex: number; // which player is up to reveal (0-based, maps to roles[i])
}
