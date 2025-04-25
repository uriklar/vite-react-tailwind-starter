import {
  getTeamPopularityAnalysis,
  getDarkHorseTeams,
} from "./teamPopularityAnalysis";

describe("Team Popularity Analysis", () => {
  test("getTeamPopularityAnalysis returns valid analysis", () => {
    const results = getTeamPopularityAnalysis();

    // Should have results
    expect(results.length).toBeGreaterThan(0);

    // Results should be sorted by championship picks (descending)
    expect(results).toBeSorted(
      (a, b) => b.championshipPicks - a.championshipPicks
    );

    results.forEach((result) => {
      // Check structure
      expect(result).toHaveProperty("team");
      expect(result).toHaveProperty("championshipPicks");
      expect(result).toHaveProperty("championshipPercentage");
      expect(result).toHaveProperty("advancementsByRound");

      // Check value ranges
      expect(result.championshipPicks).toBeGreaterThanOrEqual(0);
      expect(result.championshipPercentage).toBeGreaterThanOrEqual(0);
      expect(result.championshipPercentage).toBeLessThanOrEqual(100);

      // Check advancement rounds
      Object.entries(result.advancementsByRound).forEach(([round, data]) => {
        expect(Number(round)).toBeGreaterThanOrEqual(1);
        expect(Number(round)).toBeLessThanOrEqual(4);
        expect(data.count).toBeGreaterThanOrEqual(0);
        expect(data.percentage).toBeGreaterThanOrEqual(0);
        expect(data.percentage).toBeLessThanOrEqual(100);
      });
    });

    // Sum of championship percentages should be approximately 100
    const totalChampionshipPercentage = results.reduce(
      (sum, result) => sum + result.championshipPercentage,
      0
    );
    expect(Math.round(totalChampionshipPercentage)).toBe(100);
  });

  test("getDarkHorseTeams returns valid analysis", () => {
    const threshold = 20;
    const results = getDarkHorseTeams(threshold);

    results.forEach((result) => {
      // Check structure
      expect(result).toHaveProperty("team");
      expect(result).toHaveProperty("totalPicks");
      expect(result).toHaveProperty("pickPercentage");
      expect(result).toHaveProperty("roundReached");
      expect(result).toHaveProperty("predictors");

      // Check value constraints
      expect(result.pickPercentage).toBeLessThan(threshold);
      expect(result.roundReached).toBeGreaterThanOrEqual(2);
      expect(result.roundReached).toBeLessThanOrEqual(4);
      expect(result.totalPicks).toBeGreaterThan(0);
      expect(result.predictors.length).toBeGreaterThan(0);
    });

    // Results should be sorted by round reached (descending) and then by pick percentage (ascending)
    expect(results).toBeSorted(
      (a, b) =>
        b.roundReached - a.roundReached || a.pickPercentage - b.pickPercentage
    );
  });
});
