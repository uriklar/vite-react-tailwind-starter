// Placeholder scoring logic

/**
 * Calculates a score based on comparing user guesses to official results.
 * Placeholder Logic: +1 point for each correct winner.
 *
 * @param {object} userGuessData - The user's guess object, e.g., { "E1v8": { winner: "Team A", inGames: 6 }, ... }
 * @param {object} officialResultsData - The official results object, same structure as userGuessData.
 * @returns {number} The calculated score.
 */
export const calculateScore = (userGuessData, officialResultsData) => {
    let score = 0;

    if (!userGuessData || !officialResultsData) {
        console.warn('Scoring requires both user guesses and official results.');
        return 0;
    }

    // Iterate through the official results keys (games that have concluded)
    for (const gameId in officialResultsData) {
        const officialResult = officialResultsData[gameId];
        const userGuess = userGuessData[gameId];

        // Check if user made a guess for this game and if the official result is valid
        if (userGuess && officialResult && officialResult.winner && officialResult.winner !== 'TBD') {
            // Compare winner names (case-insensitive comparison is safer)
            if (userGuess.winner?.toLowerCase() === officialResult.winner.toLowerCase()) {
                score += 1; // Add 1 point for correct winner
            }

            // TODO: Add points for correct number of games later?
            // if (userGuess.inGames === officialResult.inGames) {
            //   score += X; 
            // }
        }
    }

    return score;
}; 