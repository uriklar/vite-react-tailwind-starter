import { guesses } from "../data/guesses";
import { getPredictors, getSeriesIds, getSeedDifference } from "../utils/stats";
import bracketTemplate from "../data/playoffBracketTemplate.json";

export type UpsetAnalysis = {
  seedDifference: number;
  averageGames: number;
  upsetPercentage: number;
  seriesDetails: {
    seriesId: string;
    higherSeed: string;
    lowerSeed: string;
    upsetCount: number;
    averageGames: number;
  }[];
};

export type UnderdogPrediction = {
  predictor: string;
  upsetCount: number;
  upsetPercentage: number;
  averageGamesInUpsets: number;
  significantUpsets: {
    seriesId: string;
    winner: string;
    seedDifference: number;
    inGames: number;
  }[];
};

export function getUpsetAnalysisBySeedDifference(): UpsetAnalysis[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();
  const totalPredictors = predictors.length;

  // Group series by seed difference
  const seedDiffData: { [diff: number]: any[] } = {};

  seriesIds.forEach((seriesId) => {
    const seedDiff = getSeedDifference(seriesId);
    if (seedDiff === 0) return; // Skip if seed difference can't be determined

    if (!seedDiffData[seedDiff]) {
      seedDiffData[seedDiff] = [];
    }

    const game = bracketTemplate.games.find((g) => g.gameId === seriesId);
    if (!game || !game.team1.seed || !game.team2.seed) return;

    const higherSeed =
      game.team1.seed < game.team2.seed ? game.team1.name : game.team2.name;
    const lowerSeed =
      game.team1.seed < game.team2.seed ? game.team2.name : game.team1.name;

    let upsetCount = 0;
    let totalGames = 0;

    predictors.forEach((predictor) => {
      const prediction = guesses[predictor][seriesId];
      if (prediction.winner === lowerSeed) {
        upsetCount++;
      }
      totalGames += prediction.inGames;
    });

    seedDiffData[seedDiff].push({
      seriesId,
      higherSeed,
      lowerSeed,
      upsetCount,
      averageGames: totalGames / totalPredictors,
    });
  });

  return Object.entries(seedDiffData)
    .map(([diff, series]) => {
      const totalUpsets = series.reduce((sum, s) => sum + s.upsetCount, 0);
      const totalPossibleUpsets = series.length * totalPredictors;
      const totalGames = series.reduce(
        (sum, s) => sum + s.averageGames * totalPredictors,
        0
      );

      return {
        seedDifference: parseInt(diff),
        averageGames: totalGames / totalPossibleUpsets,
        upsetPercentage: (totalUpsets / totalPossibleUpsets) * 100,
        seriesDetails: series,
      };
    })
    .sort((a, b) => a.seedDifference - b.seedDifference);
}

export function getUnderdogPredictors(): UnderdogPrediction[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();

  return predictors
    .map((predictor) => {
      const predictions = guesses[predictor];
      const upsets: any[] = [];
      let totalGamesInUpsets = 0;

      seriesIds.forEach((seriesId) => {
        const seedDiff = getSeedDifference(seriesId);
        if (seedDiff === 0) return;

        const game = bracketTemplate.games.find((g) => g.gameId === seriesId);
        if (!game || !game.team1.seed || !game.team2.seed) return;

        const prediction = predictions[seriesId];
        const winnerSeed =
          game.team1.name === prediction.winner
            ? game.team1.seed
            : game.team2.seed;
        const otherSeed =
          game.team1.name === prediction.winner
            ? game.team2.seed
            : game.team1.seed;

        if (winnerSeed > otherSeed) {
          upsets.push({
            seriesId,
            winner: prediction.winner,
            seedDifference: seedDiff,
            inGames: prediction.inGames,
          });
          totalGamesInUpsets += prediction.inGames;
        }
      });

      return {
        predictor,
        upsetCount: upsets.length,
        upsetPercentage: (upsets.length / seriesIds.length) * 100,
        averageGamesInUpsets:
          upsets.length > 0 ? totalGamesInUpsets / upsets.length : 0,
        significantUpsets: upsets
          .sort((a, b) => b.seedDifference - a.seedDifference)
          .slice(0, 3),
      };
    })
    .sort((a, b) => b.upsetCount - a.upsetCount);
}
