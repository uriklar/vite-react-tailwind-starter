import { PlayoffRound, PlayoffData } from "./types";
import { SCORING_CONFIG, GAME_ID_PATTERNS } from "./constants";

/**
 * Determines which playoff round a game belongs to based on its ID.
 *
 * @param {string} gameId - The game identifier (e.g., "E1v8", "EWF")
 * @returns {PlayoffRound | null} The playoff round or null if invalid
 */
export const determineRound = (gameId: string): PlayoffRound | null => {
  // Check patterns in order from most specific to least specific
  for (const [round, pattern] of Object.entries(GAME_ID_PATTERNS)) {
    if (pattern.test(gameId)) {
      return round as PlayoffRound;
    }
  }
  return null;
};

/**
 * Calculates a score based on comparing user guesses to official results.
 * Points are awarded for correct winners and correct series lengths,
 * with different point values for each round.
 *
 * @param {PlayoffData} userGuessData - The user's guess object
 * @param {PlayoffData} officialResultsData - The official results object
 * @returns {number} The calculated score
 */
export const calculateScore = (
  userGuessData: PlayoffData,
  officialResultsData: PlayoffData
): number => {
  let score = 0;
  const roundScores: Record<PlayoffRound, { winners: number; series: number }> =
    {
      [PlayoffRound.FIRST_ROUND]: { winners: 0, series: 0 },
      [PlayoffRound.CONFERENCE_SEMIFINALS]: { winners: 0, series: 0 },
      [PlayoffRound.CONFERENCE_FINALS]: { winners: 0, series: 0 },
      [PlayoffRound.NBA_FINALS]: { winners: 0, series: 0 },
    };

  if (!userGuessData || !officialResultsData) {
    console.warn("Scoring requires both user guesses and official results.");
    return 0;
  }

  // Iterate through the official results keys (games that have concluded)
  for (const gameId in officialResultsData) {
    const officialResult = officialResultsData[gameId];
    const userGuess = userGuessData[gameId];
    const round = determineRound(gameId);

    // Skip if round cannot be determined or no user guess exists
    if (
      !round ||
      !userGuess ||
      !officialResult ||
      officialResult.winner === "TBD"
    ) {
      continue;
    }

    const { basePoints, bonusPoints } = SCORING_CONFIG[round];

    // Award points for correct winner
    if (
      userGuess.winner?.toLowerCase() === officialResult.winner.toLowerCase()
    ) {
      score += basePoints;
      roundScores[round].winners++;
    }

    // Award bonus points for correct series length (independent of winner prediction)
    if (userGuess.inGames === officialResult.inGames) {
      score += bonusPoints;
      roundScores[round].series++;
    }
  }

  // Log the breakdown
  // for (const [round, scores] of Object.entries(roundScores)) {
  //   console.log(`${round}:`, {
  //     winners: `${scores.winners} correct (${
  //       scores.winners * SCORING_CONFIG[round as PlayoffRound].basePoints
  //     } pts)`,
  //     series: `${scores.series} correct (${
  //       scores.series * SCORING_CONFIG[round as PlayoffRound].bonusPoints
  //     } pts)`,
  //   });
  // }

  return score;
};
