import { guesses } from "../data/guesses";
import {
  getPredictors,
  getSeriesIds,
  calculatePercentage,
} from "../utils/stats";

export type ConsensusResult = {
  seriesId: string;
  predictions: {
    [team: string]: {
      count: number;
      percentage: number;
    };
  };
  consensusLevel: number; // Higher number means more agreement (max percentage)
};

export function getConsensusAnalysis(): ConsensusResult[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();
  const totalPredictors = predictors.length;

  return seriesIds.map((seriesId) => {
    // Count predictions for each team
    const teamCounts: { [team: string]: number } = {};

    predictors.forEach((predictor) => {
      const winner = guesses[predictor][seriesId].winner;
      teamCounts[winner] = (teamCounts[winner] || 0) + 1;
    });

    // Calculate percentages and find max consensus
    const predictions: {
      [team: string]: { count: number; percentage: number };
    } = {};
    let maxPercentage = 0;

    Object.entries(teamCounts).forEach(([team, count]) => {
      const percentage = calculatePercentage(count, totalPredictors);
      predictions[team] = { count, percentage };
      maxPercentage = Math.max(maxPercentage, percentage);
    });

    return {
      seriesId,
      predictions,
      consensusLevel: maxPercentage,
    };
  });
}

export function getMostAndLeastContestedSeries(): {
  mostConsensus: ConsensusResult;
  leastConsensus: ConsensusResult;
} {
  const results = getConsensusAnalysis();

  const sorted = [...results].sort(
    (a, b) => b.consensusLevel - a.consensusLevel
  );

  return {
    mostConsensus: sorted[0],
    leastConsensus: sorted[sorted.length - 1],
  };
}

export function getConsensusChangeByRound(): {
  roundNumber: number;
  averageConsensus: number;
}[] {
  const results = getConsensusAnalysis();
  const roundGroups: { [round: number]: number[] } = {};

  results.forEach((result) => {
    const roundNumber = parseInt(result.seriesId.match(/\d+/)?.[0] || "1");
    if (!roundGroups[roundNumber]) {
      roundGroups[roundNumber] = [];
    }
    roundGroups[roundNumber].push(result.consensusLevel);
  });

  return Object.entries(roundGroups)
    .map(([round, consensusLevels]) => ({
      roundNumber: parseInt(round),
      averageConsensus:
        consensusLevels.reduce((a, b) => a + b, 0) / consensusLevels.length,
    }))
    .sort((a, b) => a.roundNumber - b.roundNumber);
}
