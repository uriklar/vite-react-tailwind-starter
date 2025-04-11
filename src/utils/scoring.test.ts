import { calculateScore, determineRound } from "./scoring";
import { PlayoffRound, PlayoffData } from "./types";

describe("determineRound", () => {
  test("correctly identifies First Round games", () => {
    expect(determineRound("E1v8")).toBe(PlayoffRound.FIRST_ROUND);
    expect(determineRound("W4v5")).toBe(PlayoffRound.FIRST_ROUND);
  });

  test("correctly identifies Conference Semifinals games", () => {
    expect(determineRound("E1v4")).toBe(PlayoffRound.CONFERENCE_SEMIFINALS);
    expect(determineRound("W2v3")).toBe(PlayoffRound.CONFERENCE_SEMIFINALS);
  });

  test("correctly identifies Conference Finals games", () => {
    expect(determineRound("E1v2")).toBe(PlayoffRound.CONFERENCE_FINALS);
    expect(determineRound("W1v2")).toBe(PlayoffRound.CONFERENCE_FINALS);
  });

  test("correctly identifies NBA Finals", () => {
    expect(determineRound("EWF")).toBe(PlayoffRound.NBA_FINALS);
  });

  test("returns null for invalid game IDs", () => {
    expect(determineRound("invalid")).toBeNull();
    expect(determineRound("E9v10")).toBeNull();
  });
});

describe("calculateScore", () => {
  // Test Participant A (Frontrunner in early rounds)
  test("correctly calculates score for Participant A", () => {
    const userGuesses: PlayoffData = {
      // First Round (7/8 correct winners, 4/8 correct series)
      E1v8: { winner: "Team1", inGames: 5 },
      E2v7: { winner: "Team2", inGames: 6 },
      E3v6: { winner: "Team3", inGames: 7 },
      E4v5: { winner: "Team4", inGames: 4 },
      W1v8: { winner: "Team9", inGames: 5 },
      W2v7: { winner: "Team10", inGames: 6 },
      W3v6: { winner: "Team11", inGames: 5 },
      W4v5: { winner: "Team12", inGames: 4 },

      // Conference Semifinals (3/4 correct winners, 2/4 correct series)
      E1v4: { winner: "Team1", inGames: 6 },
      E2v3: { winner: "Team2", inGames: 7 },
      W1v4: { winner: "Team9", inGames: 5 },
      W2v3: { winner: "Team10", inGames: 6 },

      // Conference Finals (1/2 correct winners, 1/2 correct series)
      E1v2: { winner: "Team1", inGames: 7 },
      W1v2: { winner: "Team10", inGames: 6 },

      // NBA Finals (incorrect winner and series)
      EWF: { winner: "Team1", inGames: 6 },
    };

    const officialResults: PlayoffData = {
      // First Round
      E1v8: { winner: "Team1", inGames: 5 },
      E2v7: { winner: "Team2", inGames: 5 },
      E3v6: { winner: "Team3", inGames: 7 },
      E4v5: { winner: "Team4", inGames: 6 },
      W1v8: { winner: "Team9", inGames: 4 },
      W2v7: { winner: "Team10", inGames: 6 },
      W3v6: { winner: "Team11", inGames: 6 },
      W4v5: { winner: "Team13", inGames: 4 },

      // Conference Semifinals
      E1v4: { winner: "Team1", inGames: 6 },
      E2v3: { winner: "Team2", inGames: 7 },
      W1v4: { winner: "Team9", inGames: 6 },
      W2v3: { winner: "Team12", inGames: 5 },

      // Conference Finals
      E1v2: { winner: "Team1", inGames: 7 },
      W1v2: { winner: "Team12", inGames: 5 },

      // NBA Finals
      EWF: { winner: "Team12", inGames: 7 },
    };

    expect(calculateScore(userGuesses, officialResults)).toBe(158);
  });

  // Test edge cases
  test("handles missing data gracefully", () => {
    expect(calculateScore({}, {})).toBe(0);
    expect(calculateScore(null as any, null as any)).toBe(0);
  });

  test("ignores TBD results", () => {
    const userGuesses: PlayoffData = {
      E1v8: { winner: "Team1", inGames: 5 },
    };
    const officialResults: PlayoffData = {
      E1v8: { winner: "TBD", inGames: 0 },
    };
    expect(calculateScore(userGuesses, officialResults)).toBe(0);
  });

  test("handles case-insensitive team names", () => {
    const userGuesses: PlayoffData = {
      E1v8: { winner: "Team1", inGames: 5 },
    };
    const officialResults: PlayoffData = {
      E1v8: { winner: "TEAM1", inGames: 5 },
    };
    expect(calculateScore(userGuesses, officialResults)).toBe(14); // 8 for winner + 6 for series length
  });
});
