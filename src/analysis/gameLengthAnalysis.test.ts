import {
  getGameLengthAnalysis,
  getSeriesLengthDistribution,
} from "./gameLengthAnalysis";

describe("Game Length Analysis", () => {
  test("getGameLengthAnalysis returns analysis for all rounds", () => {
    const results = getGameLengthAnalysis();

    // Should have results for all 4 rounds
    expect(results.length).toBe(4);

    // Results should be sorted by round number
    expect(results).toBeSorted((a, b) => a.roundNumber - b.roundNumber);

    results.forEach((result) => {
      // Check structure
      expect(result).toHaveProperty("roundNumber");
      expect(result).toHaveProperty("averageLength");
      expect(result).toHaveProperty("lengthDistribution");

      // Average length should be between 4 and 7 (valid series lengths)
      expect(result.averageLength).toBeGreaterThanOrEqual(4);
      expect(result.averageLength).toBeLessThanOrEqual(7);

      // Check distribution
      const totalPercentage = Object.values(result.lengthDistribution).reduce(
        (sum, dist) => sum + dist.percentage,
        0
      );
      expect(Math.round(totalPercentage)).toBe(100);
    });
  });

  test("getSeriesLengthDistribution returns valid distribution", () => {
    const distribution = getSeriesLengthDistribution();

    // Check structure
    expect(distribution).toHaveProperty("sweeps");
    expect(distribution).toHaveProperty("fiveGames");
    expect(distribution).toHaveProperty("sixGames");
    expect(distribution).toHaveProperty("sevenGames");
    expect(distribution).toHaveProperty("total");
    expect(distribution).toHaveProperty("percentages");

    // Sum of all games should equal total
    expect(
      distribution.sweeps +
        distribution.fiveGames +
        distribution.sixGames +
        distribution.sevenGames
    ).toBe(distribution.total);

    // Percentages should sum to 100
    const totalPercentage = Object.values(distribution.percentages).reduce(
      (sum, percentage) => sum + percentage,
      0
    );
    expect(Math.round(totalPercentage)).toBe(100);

    // Each count should be non-negative
    expect(distribution.sweeps).toBeGreaterThanOrEqual(0);
    expect(distribution.fiveGames).toBeGreaterThanOrEqual(0);
    expect(distribution.sixGames).toBeGreaterThanOrEqual(0);
    expect(distribution.sevenGames).toBeGreaterThanOrEqual(0);
  });
});
