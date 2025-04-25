import { guesses } from "../data/guesses";
import { getPredictors, getSeriesIds, getRoundNumber } from "../utils/stats";

export type SeriesCompetitiveness = {
  roundNumber: number;
  averageGames: number;
  seriesDetails: {
    seriesId: string;
    averageGames: number;
    sevenGamePercentage: number;
  }[];
};

export function getSeriesCompetitiveness(): SeriesCompetitiveness[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();
  const totalPredictors = predictors.length;

  // Group series by round
  const roundData: { [round: number]: { [seriesId: string]: number[] } } = {};

  seriesIds.forEach((seriesId) => {
    const round = getRoundNumber(seriesId);
    if (!roundData[round]) {
      roundData[round] = {};
    }
    if (!roundData[round][seriesId]) {
      roundData[round][seriesId] = [];
    }

    predictors.forEach((predictor) => {
      roundData[round][seriesId].push(guesses[predictor][seriesId].inGames);
    });
  });

  return Object.entries(roundData)
    .map(([round, seriesData]) => {
      const roundNumber = parseInt(round);
      const seriesDetails = Object.entries(seriesData).map(
        ([seriesId, games]) => {
          const averageGames = games.reduce((a, b) => a + b, 0) / games.length;
          const sevenGameCount = games.filter((g) => g === 7).length;

          return {
            seriesId,
            averageGames,
            sevenGamePercentage: (sevenGameCount / totalPredictors) * 100,
          };
        }
      );

      const roundAverageGames =
        seriesDetails.reduce((sum, series) => sum + series.averageGames, 0) /
        seriesDetails.length;

      return {
        roundNumber,
        averageGames: roundAverageGames,
        seriesDetails: seriesDetails.sort(
          (a, b) => b.averageGames - a.averageGames
        ),
      };
    })
    .sort((a, b) => a.roundNumber - b.roundNumber);
}
