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
      console.log(`${gameId} - ${officialResult.winner}`);
      score += basePoints;
      roundScores[round].winners++;

      // Award bonus points for correct series length
      if (userGuess.inGames === officialResult.inGames) {
        console.log(`in ${userGuess.inGames}`);
        score += bonusPoints;
        roundScores[round].series++;
      }
    }
  }

  // Log the breakdown
  for (const [round, scores] of Object.entries(roundScores)) {
    console.log(`${round}:`, {
      winners: `${scores.winners} correct (${
        scores.winners * SCORING_CONFIG[round as PlayoffRound].basePoints
      } pts)`,
      series: `${scores.series} correct (${
        scores.series * SCORING_CONFIG[round as PlayoffRound].bonusPoints
      } pts)`,
    });
  }

  return score;
};

/**
 * Calculates the maximum potential points a user can still achieve
 * based on their guesses and current official results.
 * 
 * @param {PlayoffData} userGuessData - The user's guess object
 * @param {PlayoffData} officialResultsData - The current official results
 * @returns {number} The maximum potential points
 */
export const calculatePotentialPoints = (
  userGuessData: PlayoffData,
  officialResultsData: PlayoffData
): number => {
  // First, get the current score
  const currentScore = calculateScore(userGuessData, officialResultsData);
  
  // Track eliminated teams to check if future predictions are possible
  const eliminatedTeams = new Set<string>();
  
  // Track series that have official results
  const decidedSeries = new Set<string>();
  
  // Process completed series to identify eliminated teams
  for (const gameId in officialResultsData) {
    const officialResult = officialResultsData[gameId];
    if (!officialResult || officialResult.winner === "TBD") {
      continue;
    }
    
    decidedSeries.add(gameId);
    
    // Find the loser by checking all userGuesses for this gameId
    // This is a simplification, we really need the bracket structure
    const userGuess = userGuessData[gameId];
    if (userGuess && userGuess.winner && 
        userGuess.winner.toLowerCase() !== officialResult.winner.toLowerCase()) {
      // User's predicted winner was eliminated
      eliminatedTeams.add(userGuess.winner.toLowerCase());
    }
  }
  
  // Calculate potential additional points for each undecided series
  let potentialAdditionalPoints = 0;
  
  // Calculate potential points that can still be earned from undecided series
  for (const gameId in userGuessData) {
    // Skip series that already have results
    if (decidedSeries.has(gameId)) {
      continue;
    }
    
    const userGuess = userGuessData[gameId];
    const round = determineRound(gameId);
    
    if (!round || !userGuess || !userGuess.winner) {
      continue;
    }
    
    // Check if user's predicted winner is eliminated
    if (eliminatedTeams.has(userGuess.winner.toLowerCase())) {
      // Can't get points for this prediction as the team is eliminated
      continue;
    }
    
    const { basePoints, bonusPoints } = SCORING_CONFIG[round];
    
    // Add potential points (winner + series length)
    potentialAdditionalPoints += basePoints + bonusPoints;
  }
  
  // Total potential points = current score + potential additional points
  return currentScore + potentialAdditionalPoints;
};
