import { getOfficialResults, getMasterIndex, getBin } from "./jsonbin";
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

export interface MasterIndexEntry {
  binId: string;
  userId: string;
  name: string;
  timestamp: string;
}

export interface ScoreboardEntry {
  userId: string;
  name: string;
  score: number | null;
  potentialPoints: number | null;
  status: "loading" | "loaded" | "error" | "pending";
  error?: string;
  binId?: string;
}

// Helper function to sort scoreboard entries
export const sortScoreboardEntries = (
  a: ScoreboardEntry,
  b: ScoreboardEntry
) => {
  if (a.status === "loaded" && b.status === "loaded") {
    const scoreA = a.score ?? -Infinity;
    const scoreB = b.score ?? -Infinity;
    
    // First compare by score
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    
    // If scores are tied, use potential points as tiebreaker
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
          userId: name, // In static mode, name is the userId
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
  // Fetch results and master index concurrently
  const [results, masterIndex] = await Promise.all([
    getOfficialResults(),
    getMasterIndex(),
  ]);

  if (!results) {
    throw new Error("Could not fetch official results.");
  }

  if (!masterIndex?.submissions || masterIndex.submissions.length === 0) {
    throw new Error("No user submissions found in master index.");
  }

  // Initialize scoreboard with loading state
  const initialScoreboard: ScoreboardEntry[] = masterIndex.submissions.map(
    (entry: MasterIndexEntry): ScoreboardEntry => ({
      userId: entry.userId,
      name: entry.name || entry.userId,
      score: null,
      potentialPoints: null,
      status: "loading",
      binId: entry.binId,
    })
  );

  return {
    scoreboard: initialScoreboard,
    results,
  };
};

export const fetchUserScore = async (
  entry: ScoreboardEntry,
  results: OfficialResults
): Promise<ScoreboardEntry> => {
  if (!entry.binId) {
    return {
      ...entry,
      status: "error",
      error: `Missing binId for user ${entry.userId}`,
    };
  }

  try {
    const binData = await getBin(entry.binId);
    const submissionRecord = binData?.record ?? binData;

    if (!submissionRecord?.userId || !submissionRecord?.guess) {
      throw new Error(`Invalid data format in bin ${entry.binId}`);
    }

    const score = calculateScore(submissionRecord.guess, results);
    const potentialPoints = calculatePotentialPoints(submissionRecord.guess, results);
    return {
      ...entry,
      score,
      potentialPoints,
      status: "loaded",
    };
  } catch (error) {
    return {
      ...entry,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
