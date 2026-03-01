import { getOfficialResults, getSubmissions } from "./db";
import { calculateScore, calculatePotentialPoints } from "./scoring";
import { guesses as staticGuesses } from "../data/guesses";

// Types
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

export interface Guess {
  winner: Team | null;
  inGames: number | null;
}

export interface ResultItem {
  winner: string;
  inGames: number;
}

export interface OfficialResults {
  [gameId: string]: ResultItem;
}

export interface RawUserGuess {
  [gameId: string]: { winner: string; inGames: number };
}

export interface ScoreboardEntry {
  userId: string;
  name: string;
  score: number | null;
  potentialPoints: number | null;
  status: "loading" | "loaded" | "error" | "pending";
  error?: string;
}

// Helper function to sort scoreboard entries
export const sortScoreboardEntries = (
  a: ScoreboardEntry,
  b: ScoreboardEntry
) => {
  if (a.status === "loaded" && b.status === "loaded") {
    const scoreA = a.score ?? -Infinity;
    const scoreB = b.score ?? -Infinity;

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return (b.potentialPoints ?? -Infinity) - (a.potentialPoints ?? -Infinity);
  } else if (a.status === "loaded") {
    return -1;
  } else if (b.status === "loaded") {
    return 1;
  }
  return a.name.localeCompare(b.name);
};

// Static Mode Functions
export const loadStaticScoreboard = async (
  results: OfficialResults
): Promise<ScoreboardEntry[]> => {
  const entries = Object.entries(staticGuesses).map(
    ([name, guess]): ScoreboardEntry => {
      try {
        console.log(`-----------------------${name}-----------------------`);
        const score = calculateScore(guess, results);
        const potentialPoints = calculatePotentialPoints(guess, results);
        console.log(`-----------------------${name}-----------------------`);
        return {
          userId: name,
          name,
          score,
          potentialPoints,
          status: "loaded",
        };
      } catch (error) {
        return {
          userId: name,
          name,
          score: null,
          potentialPoints: null,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  return entries.sort(sortScoreboardEntries);
};

// Dynamic Mode Functions
export const loadDynamicScoreboard = async (): Promise<{
  scoreboard: ScoreboardEntry[];
  results: OfficialResults;
}> => {
  const [results, submissions] = await Promise.all([
    getOfficialResults(),
    getSubmissions(),
  ]);

  if (!results) {
    throw new Error("Could not fetch official results.");
  }

  if (!submissions || submissions.length === 0) {
    throw new Error("No user submissions found.");
  }

  const scoreboard: ScoreboardEntry[] = submissions.map((submission) => {
    try {
      const bracket = submission.bracket as RawUserGuess;
      const score = calculateScore(bracket, results);
      const potentialPoints = calculatePotentialPoints(bracket, results);
      return {
        userId: submission.user_id,
        name: submission.name,
        score,
        potentialPoints,
        status: "loaded",
      };
    } catch (error) {
      return {
        userId: submission.user_id,
        name: submission.name,
        score: null,
        potentialPoints: null,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return {
    scoreboard: scoreboard.sort(sortScoreboardEntries),
    results,
  };
};
