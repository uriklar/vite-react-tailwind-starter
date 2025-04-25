import { guesses } from "../data/guesses";
import { getPredictors, getSeriesIds, getRoundNumber } from "../utils/stats";
import { getConsensusAnalysis } from "./consensusAnalysis";

export type PredictorConsistency = {
  predictor: string;
  consistencyScore: number;
  roundConsistency: {
    [round: number]: {
      consensusAlignment: number;
      gameLengthVariance: number;
    };
  };
  patternMetrics: {
    averageGamesPerSeries: number;
    gameCountVariance: number;
    consensusAlignmentOverall: number;
  };
};

export function getPredictorConsistency(): PredictorConsistency[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();
  const consensusData = getConsensusAnalysis();

  return predictors
    .map((predictor) => {
      const predictions = guesses[predictor];
      const roundData: { [round: number]: number[] } = {};
      let totalConsensusAlignment = 0;
      let totalGames = 0;
      const allGames: number[] = [];

      // Analyze each series
      seriesIds.forEach((seriesId) => {
        const round = getRoundNumber(seriesId);
        if (!roundData[round]) {
          roundData[round] = [];
        }

        const prediction = predictions[seriesId];
        const consensusResult = consensusData.find(
          (c) => c.seriesId === seriesId
        );
        const consensusAlignment =
          consensusResult?.predictions[prediction.winner]?.percentage || 0;

        totalConsensusAlignment += consensusAlignment;
        totalGames += prediction.inGames;
        allGames.push(prediction.inGames);
        roundData[round].push(prediction.inGames);
      });

      // Calculate round-specific metrics
      const roundConsistency: { [round: number]: any } = {};
      Object.entries(roundData).forEach(([round, games]) => {
        const avg = games.reduce((a, b) => a + b, 0) / games.length;
        const variance =
          games.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / games.length;

        roundConsistency[parseInt(round)] = {
          consensusAlignment: 0, // Will be calculated below
          gameLengthVariance: variance,
        };
      });

      // Calculate overall metrics
      const avgGamesPerSeries = totalGames / seriesIds.length;
      const avgOverall = allGames.reduce((a, b) => a + b, 0) / allGames.length;
      const gameCountVariance =
        allGames.reduce((a, b) => a + Math.pow(b - avgOverall, 2), 0) /
        allGames.length;
      const consensusAlignmentOverall =
        totalConsensusAlignment / seriesIds.length;

      // Calculate consistency score (weighted combination of metrics)
      const consistencyScore =
        (100 - gameCountVariance * 10) * 0.4 + // Lower variance is better
        consensusAlignmentOverall * 0.6; // Higher consensus alignment is better

      return {
        predictor,
        consistencyScore,
        roundConsistency,
        patternMetrics: {
          averageGamesPerSeries: avgGamesPerSeries,
          gameCountVariance,
          consensusAlignmentOverall,
        },
      };
    })
    .sort((a, b) => b.consistencyScore - a.consistencyScore);
}
