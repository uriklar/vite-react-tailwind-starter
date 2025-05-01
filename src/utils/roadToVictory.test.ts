import { findRoadToVictory, Series, Player } from "./roadToVictory";
import { guesses } from "../data/guesses";
import officialResultsData from "../data/officialResultsTemplate.json";
import baseGameData from "../data/playoffBracketTemplate.json";

const scoring = { win: 2, exact: 1 };

describe("findRoadToVictory", () => {
  test("Uri Klar road to victory test", () => {
    // Convert Uri's guesses to Player format
    const uriGuesses = guesses["Uri Klar"];
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

    // Get series that are still undecided (TBD in official results)
    const seriesLeft: Series[] = Object.entries(officialResultsData.results)
      .filter(([, result]) => result.winner === "TBD")
      .map(([seriesId]) => {
        // Find the game in the bracket template
        const game = baseGameData.games.find((g) => g.gameId === seriesId);
        if (!game) throw new Error(`Game not found for series ${seriesId}`);

        // For first round games, use the actual teams
        if (game.round === 1) {
          return {
            id: seriesId,
            teams: [game.team1.name, game.team2.name],
          };
        }

        // For later rounds, use the potential teams from the previous round winners
        const potentialTeams = new Set<string>();
        // Add all possible teams from Uri's picks and other players' picks
        Object.values(guesses).forEach((playerPicks) => {
          const pick = playerPicks[seriesId];
          if (pick?.winner) potentialTeams.add(pick.winner);
        });

        return {
          id: seriesId,
          teams: Array.from(potentialTeams),
        };
      });

    // Calculate current scores based on completed series
    const currentScores = new Map<string, number>();
    Object.entries(guesses).forEach(([playerId, picks]) => {
      let score = 0;
      Object.entries(officialResultsData.results).forEach(
        ([seriesId, result]) => {
          if (result.winner !== "TBD") {
            const pick = picks[seriesId];
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

    // Find paths to victory
    const paths = findRoadToVictory({
      userId: "Uri Klar",
      players,
      seriesLeft,
      scoring,
      currentScores,
    });

    // Assertions
    expect(paths).toBeDefined();
    expect(paths.length).toBeGreaterThan(0);

    // Verify that at least one path matches Uri's picks
    const hasMatchingPath = paths.some((path) =>
      path.every((outcome) => {
        const uriPick = uriGuesses[outcome.seriesId];
        return (
          uriPick.winner === outcome.winner &&
          uriPick.inGames === outcome.inGames
        );
      })
    );

    expect(hasMatchingPath).toBe(true);

    // Verify that following any path leads to Uri winning
    paths.forEach((path) => {
      const finalScores = new Map(currentScores);

      // Apply the path outcomes and calculate final scores
      path.forEach((outcome) => {
        players.forEach((player) => {
          const pick = player.picks[outcome.seriesId];
          let delta = 0;
          if (pick.winner === outcome.winner) {
            delta += scoring.win;
            if (pick.inGames === outcome.inGames) {
              delta += scoring.exact;
            }
          }
          finalScores.set(player.id, (finalScores.get(player.id) || 0) + delta);
        });
      });

      // Uri should have the highest score
      const uriScore = finalScores.get("Uri Klar") || 0;
      const someoneHasHigherScore = Array.from(finalScores.entries()).some(
        ([playerId, score]) => playerId !== "Uri Klar" && score > uriScore
      );

      expect(someoneHasHigherScore).toBe(false);
    });
  });
});
