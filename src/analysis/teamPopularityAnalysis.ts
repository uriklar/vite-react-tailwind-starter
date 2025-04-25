import { guesses } from "../data/guesses";
import { getPredictors, getSeriesIds, getRoundNumber } from "../utils/stats";

export type TeamPopularityResult = {
  team: string;
  championshipPicks: number;
  championshipPercentage: number;
  advancementsByRound: {
    [round: number]: {
      count: number;
      percentage: number;
    };
  };
};

export type DarkHorseResult = {
  team: string;
  totalPicks: number;
  pickPercentage: number;
  roundReached: number;
  predictors: string[];
};

export function getTeamPopularityAnalysis(): TeamPopularityResult[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();
  const totalPredictors = predictors.length;

  // Initialize team tracking
  const teamStats: {
    [team: string]: {
      championshipPicks: number;
      advancementsByRound: { [round: number]: number };
    };
  } = {};

  // Process all predictions
  predictors.forEach((predictor) => {
    const predictions = guesses[predictor];

    seriesIds.forEach((seriesId) => {
      const winner = predictions[seriesId].winner;
      const round = getRoundNumber(seriesId);

      if (!teamStats[winner]) {
        teamStats[winner] = {
          championshipPicks: 0,
          advancementsByRound: {},
        };
      }

      if (seriesId === "Finals") {
        teamStats[winner].championshipPicks++;
      }

      if (!teamStats[winner].advancementsByRound[round]) {
        teamStats[winner].advancementsByRound[round] = 0;
      }
      teamStats[winner].advancementsByRound[round]++;
    });
  });

  // Convert to final format
  return Object.entries(teamStats)
    .map(([team, stats]) => ({
      team,
      championshipPicks: stats.championshipPicks,
      championshipPercentage: (stats.championshipPicks / totalPredictors) * 100,
      advancementsByRound: Object.entries(stats.advancementsByRound).reduce(
        (acc, [round, count]) => ({
          ...acc,
          [round]: {
            count,
            percentage: (count / totalPredictors) * 100,
          },
        }),
        {}
      ),
    }))
    .sort((a, b) => b.championshipPicks - a.championshipPicks);
}

export function getDarkHorseTeams(threshold: number = 20): DarkHorseResult[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();
  const totalPredictors = predictors.length;

  const teamPicks: {
    [team: string]: {
      picks: number;
      maxRound: number;
      predictors: Set<string>;
    };
  } = {};

  // Process all predictions
  predictors.forEach((predictor) => {
    const predictions = guesses[predictor];

    seriesIds.forEach((seriesId) => {
      const winner = predictions[seriesId].winner;
      const round = getRoundNumber(seriesId);

      if (!teamPicks[winner]) {
        teamPicks[winner] = {
          picks: 0,
          maxRound: 0,
          predictors: new Set(),
        };
      }

      teamPicks[winner].picks++;
      teamPicks[winner].maxRound = Math.max(teamPicks[winner].maxRound, round);
      teamPicks[winner].predictors.add(predictor);
    });
  });

  // Find dark horse teams (teams with low pick percentage but reached later rounds)
  return Object.entries(teamPicks)
    .map(([team, stats]) => ({
      team,
      totalPicks: stats.picks,
      pickPercentage: (stats.picks / (totalPredictors * 4)) * 100, // 4 rounds total
      roundReached: stats.maxRound,
      predictors: Array.from(stats.predictors),
    }))
    .filter((team) => team.pickPercentage < threshold && team.roundReached >= 2) // Teams picked less than threshold% but reached at least round 2
    .sort(
      (a, b) =>
        b.roundReached - a.roundReached || a.pickPercentage - b.pickPercentage
    );
}
