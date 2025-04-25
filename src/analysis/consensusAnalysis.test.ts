import {
  getConsensusAnalysis,
  getMostAndLeastContestedSeries,
  getConsensusChangeByRound,
} from "./consensusAnalysis";

describe("Consensus Analysis", () => {
  test("getConsensusAnalysis returns analysis for all series", () => {
    const results = getConsensusAnalysis();

    // Check that we have results for all series
    expect(results.length).toBeGreaterThan(0);

    // Check structure of a result
    const firstResult = results[0];
    expect(firstResult).toHaveProperty("seriesId");
    expect(firstResult).toHaveProperty("predictions");
    expect(firstResult).toHaveProperty("consensusLevel");

    // Check that percentages add up to approximately 100
    const totalPercentage = Object.values(firstResult.predictions).reduce(
      (sum, pred) => sum + pred.percentage,
      0
    );
    expect(Math.round(totalPercentage)).toBe(100);
  });

  test("getMostAndLeastContestedSeries returns valid results", () => {
    const { mostConsensus, leastConsensus } = getMostAndLeastContestedSeries();

    // Most consensus should have higher consensus level than least consensus
    expect(mostConsensus.consensusLevel).toBeGreaterThan(
      leastConsensus.consensusLevel
    );

    // Both should be valid series results
    expect(mostConsensus).toHaveProperty("seriesId");
    expect(leastConsensus).toHaveProperty("seriesId");
  });

  test("getConsensusChangeByRound returns analysis for all rounds", () => {
    const results = getConsensusChangeByRound();

    // Should have results for each round (4 rounds in playoffs)
    expect(results.length).toBe(4);

    // Should be sorted by round number
    expect(results).toBeSorted((a, b) => a.roundNumber - b.roundNumber);

    // Each result should have valid properties
    results.forEach((result) => {
      expect(result).toHaveProperty("roundNumber");
      expect(result).toHaveProperty("averageConsensus");
      expect(result.averageConsensus).toBeGreaterThanOrEqual(0);
      expect(result.averageConsensus).toBeLessThanOrEqual(100);
    });
  });
});
