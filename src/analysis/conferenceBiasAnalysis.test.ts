import {
  getConferenceBiasAnalysis,
  getFinalsConferenceBias,
} from "./conferenceBiasAnalysis";

describe("Conference Bias Analysis", () => {
  test("getConferenceBiasAnalysis returns valid analysis for both conferences", () => {
    const results = getConferenceBiasAnalysis();

    // Should have results for both conferences
    expect(results.length).toBe(2);

    // Check if both conferences are present
    const conferences = results.map((r) => r.conference);
    expect(conferences).toContain("East");
    expect(conferences).toContain("West");

    results.forEach((result) => {
      // Check structure
      expect(result).toHaveProperty("conference");
      expect(result).toHaveProperty("winPercentage");
      expect(result).toHaveProperty("averageGamesPerSeries");
      expect(result).toHaveProperty("totalPredictions");

      // Check value ranges
      expect(result.winPercentage).toBeGreaterThanOrEqual(0);
      expect(result.winPercentage).toBeLessThanOrEqual(100);
      expect(result.averageGamesPerSeries).toBeGreaterThanOrEqual(4);
      expect(result.averageGamesPerSeries).toBeLessThanOrEqual(7);
      expect(result.totalPredictions).toBeGreaterThan(0);
    });
  });

  test("getFinalsConferenceBias returns valid analysis", () => {
    const result = getFinalsConferenceBias();

    // Check structure
    expect(result).toHaveProperty("winner");
    expect(result).toHaveProperty("averageGames");

    // Check winner structure
    expect(result.winner).toHaveProperty("east");
    expect(result.winner).toHaveProperty("west");
    expect(result.winner).toHaveProperty("eastPercentage");
    expect(result.winner).toHaveProperty("westPercentage");

    // Check averageGames structure
    expect(result.averageGames).toHaveProperty("east");
    expect(result.averageGames).toHaveProperty("west");

    // Validate percentages sum to 100
    expect(
      Math.round(result.winner.eastPercentage + result.winner.westPercentage)
    ).toBe(100);

    // Validate counts match percentages
    const totalPredictions = result.winner.east + result.winner.west;
    expect(result.winner.eastPercentage).toBe(
      (result.winner.east / totalPredictions) * 100
    );
    expect(result.winner.westPercentage).toBe(
      (result.winner.west / totalPredictions) * 100
    );

    // Check average games are in valid range
    if (result.winner.east > 0) {
      expect(result.averageGames.east).toBeGreaterThanOrEqual(4);
      expect(result.averageGames.east).toBeLessThanOrEqual(7);
    }
    if (result.winner.west > 0) {
      expect(result.averageGames.west).toBeGreaterThanOrEqual(4);
      expect(result.averageGames.west).toBeLessThanOrEqual(7);
    }
  });
});
