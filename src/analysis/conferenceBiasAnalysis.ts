import { guesses } from "../data/guesses";
import { getPredictors, getSeriesIds, getConference } from "../utils/stats";
import bracketTemplate from "../data/playoffBracketTemplate.json";

export type ConferenceBiasResult = {
  conference: string;
  winPercentage: number;
  averageGamesPerSeries: number;
  totalPredictions: number;
};

export type FinalsConferenceBiasResult = {
  winner: {
    east: number;
    west: number;
    eastPercentage: number;
    westPercentage: number;
  };
  averageGames: {
    east: number;
    west: number;
  };
};

export function getConferenceBiasAnalysis(): ConferenceBiasResult[] {
  const predictors = getPredictors();
  const seriesIds = getSeriesIds();

  // Initialize counters for each conference
  const conferenceCounts: {
    [key: string]: { wins: number; totalGames: number; predictions: number };
  } = {
    East: { wins: 0, totalGames: 0, predictions: 0 },
    West: { wins: 0, totalGames: 0, predictions: 0 },
  };

  seriesIds.forEach((seriesId) => {
    const conference = getConference(seriesId);
    if (conference !== "East" && conference !== "West") return; // Skip Finals

    predictors.forEach((predictor) => {
      const prediction = guesses[predictor][seriesId];
      const game = bracketTemplate.games.find((g) => g.gameId === seriesId);

      if (game) {
        conferenceCounts[conference].predictions++;
        conferenceCounts[conference].totalGames += prediction.inGames;

        // Check if winner is from the predicted conference
        const winningTeam = prediction.winner;
        const isTeam1Winner = game.team1.name === winningTeam;
        const isTeam2Winner = game.team2.name === winningTeam;

        if (isTeam1Winner || isTeam2Winner) {
          conferenceCounts[conference].wins++;
        }
      }
    });
  });

  return Object.entries(conferenceCounts).map(([conference, data]) => ({
    conference,
    winPercentage: (data.wins / data.predictions) * 100,
    averageGamesPerSeries: data.totalGames / data.predictions,
    totalPredictions: data.predictions,
  }));
}

export function getFinalsConferenceBias(): FinalsConferenceBiasResult {
  const predictors = getPredictors();
  const finalsData = {
    east: { wins: 0, totalGames: 0 },
    west: { wins: 0, totalGames: 0 },
  };

  predictors.forEach((predictor) => {
    const finalsPrediction = guesses[predictor].Finals;
    const winner = finalsPrediction.winner;

    // Determine winner's conference
    const isEastTeam = [
      "Boston Celtics",
      "Cleveland Cavaliers",
      "New York Knicks",
      "Indiana Pacers",
      "Milwaukee Bucks",
    ].includes(winner);

    if (isEastTeam) {
      finalsData.east.wins++;
      finalsData.east.totalGames += finalsPrediction.inGames;
    } else {
      finalsData.west.wins++;
      finalsData.west.totalGames += finalsPrediction.inGames;
    }
  });

  const totalPredictions = predictors.length;

  return {
    winner: {
      east: finalsData.east.wins,
      west: finalsData.west.wins,
      eastPercentage: (finalsData.east.wins / totalPredictions) * 100,
      westPercentage: (finalsData.west.wins / totalPredictions) * 100,
    },
    averageGames: {
      east:
        finalsData.east.wins > 0
          ? finalsData.east.totalGames / finalsData.east.wins
          : 0,
      west:
        finalsData.west.wins > 0
          ? finalsData.west.totalGames / finalsData.west.wins
          : 0,
    },
  };
}
