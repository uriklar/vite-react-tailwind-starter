import { findRoadToVictory, Series, Player } from "./roadToVictory";
import { PlayoffRound } from "./types";
import { SCORING_CONFIG } from "./constants";
import { guesses } from "../data/guesses";
import officialResultsData from "../data/officialResultsTemplate.json";

describe("findRoadToVictory - Uri's Scenario", () => {
  const createScoringFromConfig = (round: PlayoffRound) => ({
    win: SCORING_CONFIG[round].basePoints,
    exact: SCORING_CONFIG[round].bonusPoints,
  });

  test("Uri should have a path to victory if his remaining picks are correct", () => {
    // Get series that are still undecided (TBD in official results)
    const seriesLeft: Series[] = Object.entries(officialResultsData.results)
      .filter(([, result]) => result.winner === "TBD")
      .map(([seriesId]) => {
        // For each series, use Uri's predicted teams
        const uriPick = guesses["Uri Klar"][seriesId];
        return {
          id: seriesId,
          teams: [uriPick.winner, "Other Team"] as [string, string], // We only need Uri's winner to be in the teams
        };
      });

    // Convert guesses to Player format
    const players: Player[] = Object.entries(guesses).map(([name, picks]) => ({
      id: name,
      picks: Object.entries(picks).reduce(
        (acc, [seriesId, pick]) => ({
          ...acc,
          [seriesId]: {
            winner: pick.winner,
            inGames: pick.inGames as 4 | 5 | 6 | 7,
          },
        }),
        {}
      ),
    }));

    // Calculate current scores based on completed series
    const currentScores = new Map<string, number>();
    Object.entries(guesses).forEach(([playerId, picks]) => {
      let score = 0;
      Object.entries(officialResultsData.results).forEach(
        ([seriesId, result]) => {
          if (result.winner !== "TBD") {
            const pick = picks[seriesId];
            const round = determineRound(seriesId);
            if (!round) return;

            const scoring = createScoringFromConfig(round);
            if (pick.winner === result.winner) {
              score += scoring.win;
              if (pick.inGames === result.inGames) {
                score += scoring.exact;
              }
            }
          }
        }
      );
      currentScores.set(playerId, score);
    });

    // Calculate maximum possible points for each player from remaining series
    const maxPossiblePoints = new Map<string, number>();
    players.forEach((player) => {
      let maxPoints = currentScores.get(player.id) || 0;
      seriesLeft.forEach((series) => {
        const round = determineRound(series.id);
        if (!round) return;
        const scoring = createScoringFromConfig(round);
        // Add maximum points possible (win + exact) for this series
        maxPoints += scoring.win + scoring.exact;
      });
      maxPossiblePoints.set(player.id, maxPoints);
    });

    // Create scoring config for remaining series
    const scoring: Record<string, ScoringRules> = {};
    seriesLeft.forEach((series) => {
      const round = determineRound(series.id);
      if (round) {
        scoring[series.id] = createScoringFromConfig(round);
      }
    });

    // Find paths to victory
    const paths = findRoadToVictory({
      userId: "Uri Klar",
      players,
      seriesLeft,
      scoring,
      currentScores,
    });

    // Log current scores, max possible scores, and remaining series for debugging
    console.log("Current Scores:", Object.fromEntries(currentScores));
    console.log(
      "Maximum Possible Scores:",
      Object.fromEntries(maxPossiblePoints)
    );
    console.log("Uri's current score:", currentScores.get("Uri Klar"));
    console.log("Uri's max possible score:", maxPossiblePoints.get("Uri Klar"));
    console.log("Dana's current score:", currentScores.get("Dana Erez"));
    console.log(
      "Dana's max possible score:",
      maxPossiblePoints.get("Dana Erez")
    );
    console.log(
      "Remaining Series:",
      seriesLeft.map((s) => s.id)
    );
    console.log("Number of paths found:", paths.length);
    if (paths.length > 0) {
      console.log("Example path:", paths[0]);
    }

    // Calculate points needed for Uri to win
    const uriMaxPossible = maxPossiblePoints.get("Uri Klar") || 0;
    const danaMaxPossible = maxPossiblePoints.get("Dana Erez") || 0;
    console.log(
      "Uri needs to outscore Dana by:",
      (currentScores.get("Dana Erez") || 0) -
        (currentScores.get("Uri Klar") || 0) +
        1,
      "points to win"
    );
    console.log(
      "Maximum points Uri can gain over Dana:",
      uriMaxPossible - (currentScores.get("Uri Klar") || 0),
      "vs Dana's maximum gain:",
      danaMaxPossible - (currentScores.get("Dana Erez") || 0)
    );

    // There should be at least one path where Uri's exact picks come true
    expect(paths.length).toBeGreaterThan(0);

    // Verify that at least one path matches Uri's picks
    const hasMatchingPath = paths.some((path) =>
      path.every((outcome) => {
        const uriPick = guesses["Uri Klar"][outcome.seriesId];
        return (
          uriPick.winner === outcome.winner &&
          uriPick.inGames === outcome.inGames
        );
      })
    );

    expect(hasMatchingPath).toBe(true);
  });
});

// Helper function to determine round from series ID
function determineRound(gameId: string): PlayoffRound | null {
  if (/^[EW][1-8]v[1-8]$/.test(gameId)) {
    return PlayoffRound.FIRST_ROUND;
  }
  if (/^[EW]SF[1-2]$/.test(gameId)) {
    return PlayoffRound.CONFERENCE_SEMIFINALS;
  }
  if (/^[EW]CF$/.test(gameId)) {
    return PlayoffRound.CONFERENCE_FINALS;
  }
  if (gameId === "Finals") {
    return PlayoffRound.NBA_FINALS;
  }
  return null;
}
