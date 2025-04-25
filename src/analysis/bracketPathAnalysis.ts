import { guesses } from "../data/guesses";
import { getPredictors } from "../utils/stats";
import bracketTemplate from "../data/playoffBracketTemplate.json";

export type BracketPath = {
  team: string;
  path: {
    round: number;
    seriesId: string;
    opponent: string;
    predictedGames: number;
  }[];
  predictors: string[];
  frequency: number;
};

export type ExpectedMatchup = {
  round: number;
  matchup: {
    team1: string;
    team2: string;
  };
  frequency: number;
  percentage: number;
};

// Helper function to find source games for a game ID
function findSourceGames(gameId: string): { game1: string; game2: string } {
  const sourceGames = bracketTemplate.games
    .filter((g) => g.nextGameId === gameId)
    .map((g) => g.gameId);

  return {
    game1: sourceGames[0] || "",
    game2: sourceGames[1] || "",
  };
}

export function getChampionshipPaths(): BracketPath[] {
  const predictors = getPredictors();
  const paths: { [key: string]: BracketPath } = {};

  predictors.forEach((predictor) => {
    const predictions = guesses[predictor];
    const finalsWinner = predictions.Finals.winner;

    if (!paths[finalsWinner]) {
      paths[finalsWinner] = {
        team: finalsWinner,
        path: [],
        predictors: [],
        frequency: 0,
      };
    }

    // Record this predictor
    paths[finalsWinner].predictors.push(predictor);
    paths[finalsWinner].frequency++;

    // Reconstruct the path by following the bracket backwards
    let currentGame = bracketTemplate.games.find((g) => g.gameId === "Finals");
    let currentRound = 4;

    while (currentGame) {
      const prediction = predictions[currentGame.gameId];
      const opponent =
        currentGame.team1.name === finalsWinner
          ? currentGame.team2.name
          : currentGame.team1.name;

      paths[finalsWinner].path.unshift({
        round: currentRound,
        seriesId: currentGame.gameId,
        opponent,
        predictedGames: prediction.inGames,
      });

      // Find previous game
      const sourceGames = findSourceGames(currentGame.gameId);
      const nextGameId =
        currentGame.team1.name === finalsWinner
          ? sourceGames.game1
          : sourceGames.game2;
      currentGame = bracketTemplate.games.find((g) => g.gameId === nextGameId);
      currentRound--;
    }
  });

  return Object.values(paths).sort((a, b) => b.frequency - a.frequency);
}

export function getExpectedMatchups(): ExpectedMatchup[] {
  const predictors = getPredictors();
  const totalPredictors = predictors.length;
  const matchups: { [key: string]: number } = {};
  const results: ExpectedMatchup[] = [];

  // Process each predictor's bracket
  predictors.forEach((predictor) => {
    const predictions = guesses[predictor];

    // Look at each game in rounds 2-4 (semifinals and finals)
    bracketTemplate.games
      .filter((game) => game.round >= 2)
      .forEach((game) => {
        const sourceGames = findSourceGames(game.gameId);
        const winner1 = predictions[sourceGames.game1]?.winner;
        const winner2 = predictions[sourceGames.game2]?.winner;

        if (winner1 && winner2) {
          const matchupKey = `${game.round}-${winner1}-${winner2}`;
          matchups[matchupKey] = (matchups[matchupKey] || 0) + 1;
        }
      });
  });

  // Convert to final format
  Object.entries(matchups).forEach(([key, count]) => {
    const [round, team1, team2] = key.split("-");
    results.push({
      round: parseInt(round),
      matchup: { team1, team2 },
      frequency: count,
      percentage: (count / totalPredictors) * 100,
    });
  });

  return results.sort((a, b) => b.round - a.round || b.frequency - a.frequency);
}
