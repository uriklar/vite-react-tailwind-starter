import { guesses } from "../data/guesses";
import { getPredictors, getSeriesIds, getConference } from "../utils/stats";
import { getConsensusAnalysis } from "./consensusAnalysis";

export type PredictorSimilarity = {
  predictor1: string;
  predictor2: string;
  similarityScore: number;
  matchingPicks: number;
  totalPicks: number;
};

export type ContraryIndex = {
  predictor: string;
  contraryScore: number;
  consensusDefiance: {
    total: number;
    percentage: number;
  };
  mostContraryPicks: {
    seriesId: string;
    prediction: string;
    consensusPercentage: number;
  }[];
};

export type Favoritism = {
  predictor: string;
  favoredTeams: {
    team: string;
    picks: number;
    percentage: number;
  }[];
  favoredConference: {
    conference: string;
    picks: number;
    percentage: number;
  };
};

export function getPredictorSimilarities(): PredictorSimilarity[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();
  const similarities: PredictorSimilarity[] = [];

  // Compare each pair of predictors
  for (let i = 0; i < predictors.length; i++) {
    for (let j = i + 1; j < predictors.length; j++) {
      const predictor1 = predictors[i];
      const predictor2 = predictors[j];
      let matchingPicks = 0;

      seriesIds.forEach((seriesId) => {
        if (
          guesses[predictor1][seriesId].winner ===
          guesses[predictor2][seriesId].winner
        ) {
          matchingPicks++;
        }
      });

      similarities.push({
        predictor1,
        predictor2,
        similarityScore: (matchingPicks / seriesIds.length) * 100,
        matchingPicks,
        totalPicks: seriesIds.length,
      });
    }
  }

  return similarities.sort((a, b) => b.similarityScore - a.similarityScore);
}

export function getContraryIndex(): ContraryIndex[] {
  const predictors = getPredictors();
  const consensusResults = getConsensusAnalysis();

  return predictors
    .map((predictor) => {
      let contraryCount = 0;
      const contraryPicks: {
        seriesId: string;
        prediction: string;
        consensusPercentage: number;
      }[] = [];

      consensusResults.forEach((series) => {
        const prediction = guesses[predictor][series.seriesId].winner;
        const consensusPercentage =
          series.predictions[prediction]?.percentage || 0;

        if (consensusPercentage < 50) {
          contraryCount++;
          contraryPicks.push({
            seriesId: series.seriesId,
            prediction,
            consensusPercentage,
          });
        }
      });

      return {
        predictor,
        contraryScore: (contraryCount / consensusResults.length) * 100,
        consensusDefiance: {
          total: contraryCount,
          percentage: (contraryCount / consensusResults.length) * 100,
        },
        mostContraryPicks: contraryPicks
          .sort((a, b) => a.consensusPercentage - b.consensusPercentage)
          .slice(0, 3),
      };
    })
    .sort((a, b) => b.contraryScore - a.contraryScore);
}

export function getTeamConferenceFavoritism(): Favoritism[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();

  return predictors.map((predictor) => {
    const teamCounts: { [team: string]: number } = {};
    const conferenceCounts: { [conference: string]: number } = {
      East: 0,
      West: 0,
    };
    let totalPicks = 0;

    seriesIds.forEach((seriesId) => {
      const winner = guesses[predictor][seriesId].winner;
      const conference = getConference(seriesId);

      teamCounts[winner] = (teamCounts[winner] || 0) + 1;
      if (conference === "East" || conference === "West") {
        conferenceCounts[conference]++;
        totalPicks++;
      }
    });

    // Calculate team favoritism
    const favoredTeams = Object.entries(teamCounts)
      .map(([team, picks]) => ({
        team,
        picks,
        percentage: (picks / seriesIds.length) * 100,
      }))
      .sort((a, b) => b.picks - a.picks)
      .slice(0, 3);

    // Calculate conference favoritism
    const favoredConference = Object.entries(conferenceCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      predictor,
      favoredTeams,
      favoredConference: {
        conference: favoredConference[0],
        picks: favoredConference[1],
        percentage: (favoredConference[1] / totalPicks) * 100,
      },
    };
  });
}
