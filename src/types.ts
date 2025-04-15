// src/types.ts

export interface Team {
  name: string;
  seed: number | null;
  logo: string;
}

export interface Game {
  gameId: string;
  round: number;
  conference: string;
  matchup: number;
  nextGameId: string | null;
  team1: Team;
  team2: Team;
}

// Remove GuessedWinner interface - not needed
// export interface GuessedWinner {
//     name: string;
//     seed: number | null;
// }

export interface Guess {
  winner: Team | null; // Reverted: Expect full Team object or null for internal logic
  inGames: number | null;
}

export interface Guesses {
  [gameId: string]: Guess;
}
