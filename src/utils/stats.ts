import { guesses } from "../data/guesses";
import bracketTemplate from "../data/playoffBracketTemplate.json";

export type BracketTemplate = {
  games: GameInfo[];
};

export type Guess = {
  winner: string;
  inGames: number;
};

export type UserGuesses = {
  [key: string]: Guess;
};

export type AllGuesses = {
  [username: string]: UserGuesses;
};

export type GameInfo = {
  gameId: string;
  round: number;
  conference: string;
  matchup: number;
  nextGameId: string | null;
  team1: {
    name: string;
    seed: number | null;
    logo: string;
  };
  team2: {
    name: string;
    seed: number | null;
    logo: string;
  };
};

// Helper function to get seed difference for a game
export function getSeedDifference(gameId: string): number {
  const game = (bracketTemplate as BracketTemplate).games.find(
    (g) => g.gameId === gameId
  );
  if (!game || game.team1.seed === null || game.team2.seed === null) {
    return 0;
  }
  return Math.abs(game.team1.seed - game.team2.seed);
}

// Helper function to get all predictors
export function getPredictors(): string[] {
  return Object.keys(guesses);
}

// Helper function to get all series IDs
export function getSeriesIds(): string[] {
  return Object.keys(Object.values(guesses)[0]);
}

// Helper function to get round number from series ID
export function getRoundNumber(seriesId: string): number {
  const game = (bracketTemplate as BracketTemplate).games.find(
    (g) => g.gameId === seriesId
  );
  return game ? game.round : 0;
}

// Helper function to get conference from series ID
export function getConference(seriesId: string): string {
  const game = (bracketTemplate as BracketTemplate).games.find(
    (g) => g.gameId === seriesId
  );
  return game ? game.conference : "";
}

// Helper function to calculate percentage
export function calculatePercentage(count: number, total: number): number {
  return (count / total) * 100;
}
