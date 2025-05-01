import { findRoadToVictory, Series, Player } from "./roadToVictory";
import { PlayoffRound } from "./types";
import { SCORING_CONFIG } from "./constants";

describe("findRoadToVictory - Simple Cases", () => {
  // Helper function to create a scoring object from SCORING_CONFIG
  const createScoringFromConfig = (round: PlayoffRound) => ({
    win: SCORING_CONFIG[round].basePoints,
    exact: SCORING_CONFIG[round].bonusPoints,
  });

  test("Simple two-player, one series scenario - First Round", () => {
    const seriesLeft: Series[] = [
      {
        id: "E1v8",
        teams: ["Boston", "Miami"] as [string, string],
      },
    ];

    const players: Player[] = [
      {
        id: "player1",
        picks: {
          E1v8: { winner: "Boston", inGames: 5 },
        },
      },
      {
        id: "player2",
        picks: {
          E1v8: { winner: "Miami", inGames: 6 },
        },
      },
    ];

    const currentScores = new Map([
      ["player1", 0],
      ["player2", 0],
    ]);

    const scoring = createScoringFromConfig(PlayoffRound.FIRST_ROUND);

    const paths = findRoadToVictory({
      userId: "player1",
      players,
      seriesLeft,
      scoring,
      currentScores,
    });

    expect(paths).toBeDefined();
    expect(paths.length).toBeGreaterThan(0);

    // Verify that the path leads to victory
    const path = paths[0];
    expect(path.length).toBe(1);
    expect(path[0].winner).toBe("Boston"); // Should pick Boston to win as that's player1's pick
    expect([4, 5, 6, 7]).toContain(path[0].inGames); // Any game count is valid as long as it leads to victory

    // Calculate final scores
    const finalScores = new Map(currentScores);
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

    // Verify player1 wins
    const player1Score = finalScores.get("player1") || 0;
    const player2Score = finalScores.get("player2") || 0;
    expect(player1Score).toBeGreaterThan(player2Score);
  });

  test("Two series from different rounds scenario", () => {
    const seriesLeft: Series[] = [
      {
        id: "E1v8",
        teams: ["Boston", "Miami"] as [string, string],
      },
      {
        id: "EWF",
        teams: ["Boston", "Denver"] as [string, string],
      },
    ];

    const players: Player[] = [
      {
        id: "player1",
        picks: {
          E1v8: { winner: "Boston", inGames: 5 },
          EWF: { winner: "Boston", inGames: 6 },
        },
      },
      {
        id: "player2",
        picks: {
          E1v8: { winner: "Miami", inGames: 6 },
          EWF: { winner: "Denver", inGames: 7 },
        },
      },
    ];

    const currentScores = new Map([
      ["player1", 0],
      ["player2", 10], // player2 starts with a lead
    ]);

    // We'll test with both first round and finals scoring
    const firstRoundScoring = createScoringFromConfig(PlayoffRound.FIRST_ROUND);
    const finalsScoring = createScoringFromConfig(PlayoffRound.NBA_FINALS);

    const paths = findRoadToVictory({
      userId: "player1",
      players,
      seriesLeft,
      scoring: {
        E1v8: firstRoundScoring,
        EWF: finalsScoring,
      },
      currentScores,
    });

    expect(paths).toBeDefined();
    expect(paths.length).toBeGreaterThan(0);

    // Verify that following the path leads to player1 winning
    const finalScores = new Map(currentScores);
    paths[0].forEach((outcome) => {
      const scoring =
        outcome.seriesId === "E1v8" ? firstRoundScoring : finalsScoring;
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

    const player1FinalScore = finalScores.get("player1") || 0;
    const player2FinalScore = finalScores.get("player2") || 0;
    expect(player1FinalScore).toBeGreaterThan(player2FinalScore);
  });

  test("No path to victory scenario", () => {
    const seriesLeft: Series[] = [
      {
        id: "E1v8",
        teams: ["Boston", "Miami"] as [string, string],
      },
    ];

    const players: Player[] = [
      {
        id: "player1",
        picks: {
          E1v8: { winner: "Boston", inGames: 5 },
        },
      },
      {
        id: "player2",
        picks: {
          E1v8: { winner: "Boston", inGames: 5 }, // Same picks
        },
      },
    ];

    const currentScores = new Map([
      ["player1", 0],
      ["player2", 20], // player2 has an insurmountable lead
    ]);

    const scoring = createScoringFromConfig(PlayoffRound.FIRST_ROUND);

    const paths = findRoadToVictory({
      userId: "player1",
      players,
      seriesLeft,
      scoring,
      currentScores,
    });

    expect(paths).toBeDefined();
    expect(paths.length).toBe(0); // No paths should be found
  });
});
