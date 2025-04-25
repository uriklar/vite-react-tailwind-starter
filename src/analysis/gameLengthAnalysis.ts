import { guesses } from "../data/guesses";
import { getPredictors, getSeriesIds, getRoundNumber } from "../utils/stats";

export type GameLengthResult = {
  roundNumber: number;
  averageLength: number;
  lengthDistribution: {
    [games: number]: {
      count: number;
      percentage: number;
    };
  };
};

export function getGameLengthAnalysis(): GameLengthResult[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();
  const totalPredictors = predictors.length;

  // Group series by round
  const roundGroups: { [round: number]: string[] } = {};
  seriesIds.forEach((seriesId) => {
    const round = getRoundNumber(seriesId);
    if (!roundGroups[round]) {
      roundGroups[round] = [];
    }
    roundGroups[round].push(seriesId);
  });

  return Object.entries(roundGroups)
    .map(([round, seriesInRound]) => {
      const roundNumber = parseInt(round);
      const gameLengths: number[] = [];
      const lengthCounts: { [length: number]: number } = {};

      // Collect all game lengths for this round
      seriesInRound.forEach((seriesId) => {
        predictors.forEach((predictor) => {
          const length = guesses[predictor][seriesId].inGames;
          gameLengths.push(length);
          lengthCounts[length] = (lengthCounts[length] || 0) + 1;
        });
      });

      // Calculate average length
      const averageLength =
        gameLengths.reduce((a, b) => a + b, 0) / gameLengths.length;

      // Calculate distribution percentages
      const lengthDistribution: {
        [games: number]: { count: number; percentage: number };
      } = {};
      Object.entries(lengthCounts).forEach(([length, count]) => {
        lengthDistribution[parseInt(length)] = {
          count,
          percentage: (count / gameLengths.length) * 100,
        };
      });

      return {
        roundNumber,
        averageLength,
        lengthDistribution,
      };
    })
    .sort((a, b) => a.roundNumber - b.roundNumber);
}

export function getSeriesLengthDistribution(): {
  sweeps: number;
  fiveGames: number;
  sixGames: number;
  sevenGames: number;
  total: number;
  percentages: {
    sweeps: number;
    fiveGames: number;
    sixGames: number;
    sevenGames: number;
  };
} {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();
  let sweeps = 0;
  let fiveGames = 0;
  let sixGames = 0;
  let sevenGames = 0;
  let total = 0;

  seriesIds.forEach((seriesId) => {
    predictors.forEach((predictor) => {
      const length = guesses[predictor][seriesId].inGames;
      total++;
      switch (length) {
        case 4:
          sweeps++;
          break;
        case 5:
          fiveGames++;
          break;
        case 6:
          sixGames++;
          break;
        case 7:
          sevenGames++;
          break;
      }
    });
  });

  return {
    sweeps,
    fiveGames,
    sixGames,
    sevenGames,
    total,
    percentages: {
      sweeps: (sweeps / total) * 100,
      fiveGames: (fiveGames / total) * 100,
      sixGames: (sixGames / total) * 100,
      sevenGames: (sevenGames / total) * 100,
    },
  };
}
