import {
  getPredictorSimilarities,
  getContraryIndex,
  getTeamConferenceFavoritism,
} from "./predictorBehaviorAnalysis";
import { getPredictors } from "../utils/stats";

// Helper function to check if array is sorted according to comparator
function isSorted<T>(arr: T[], comparator: (a: T, b: T) => number): boolean {
  for (let i = 0; i < arr.length - 1; i++) {
    if (comparator(arr[i], arr[i + 1]) > 0) return false;
  }
  return true;
}

describe("Predictor Behavior Analysis", () => {
  test("getPredictorSimilarities returns valid analysis", () => {
    const results = getPredictorSimilarities();
    const predictors = getPredictors();
    const expectedPairCount = (predictors.length * (predictors.length - 1)) / 2;

    // Should have correct number of pairs
    expect(results.length).toBe(expectedPairCount);

    // Check that similarity scores are in descending order
    const scores = results.map((r) => r.similarityScore);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }

    results.forEach((result) => {
      // Check structure
      expect(result).toHaveProperty("predictor1");
      expect(result).toHaveProperty("predictor2");
      expect(result).toHaveProperty("similarityScore");
      expect(result).toHaveProperty("matchingPicks");
      expect(result).toHaveProperty("totalPicks");

      // Check value ranges
      expect(result.similarityScore).toBeGreaterThanOrEqual(0);
      expect(result.similarityScore).toBeLessThanOrEqual(100);
      expect(result.matchingPicks).toBeGreaterThanOrEqual(0);
      expect(result.matchingPicks).toBeLessThanOrEqual(result.totalPicks);

      // Check that predictor pairs are unique
      expect(result.predictor1).not.toBe(result.predictor2);
    });
  });

  test("getContraryIndex returns valid analysis", () => {
    const results = getContraryIndex();
    const predictors = getPredictors();

    // Should have result for each predictor
    expect(results.length).toBe(predictors.length);

    // Check that contrary scores are in descending order
    const scores = results.map((r) => r.contraryScore);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }

    results.forEach((result) => {
      // Check structure
      expect(result).toHaveProperty("predictor");
      expect(result).toHaveProperty("contraryScore");
      expect(result).toHaveProperty("consensusDefiance");
      expect(result).toHaveProperty("mostContraryPicks");

      // Check value ranges
      expect(result.contraryScore).toBeGreaterThanOrEqual(0);
      expect(result.contraryScore).toBeLessThanOrEqual(100);
      expect(result.consensusDefiance.percentage).toBeGreaterThanOrEqual(0);
      expect(result.consensusDefiance.percentage).toBeLessThanOrEqual(100);

      // Check contrary picks
      expect(result.mostContraryPicks.length).toBeLessThanOrEqual(3);
      result.mostContraryPicks.forEach((pick) => {
        expect(pick.consensusPercentage).toBeLessThan(50);
      });
    });
  });

  test("getTeamConferenceFavoritism returns valid analysis", () => {
    const results = getTeamConferenceFavoritism();
    const predictors = getPredictors();

    // Should have result for each predictor
    expect(results.length).toBe(predictors.length);

    results.forEach((result) => {
      // Check structure
      expect(result).toHaveProperty("predictor");
      expect(result).toHaveProperty("favoredTeams");
      expect(result).toHaveProperty("favoredConference");

      // Check favored teams
      expect(result.favoredTeams.length).toBeLessThanOrEqual(3);
      result.favoredTeams.forEach((team) => {
        expect(team.percentage).toBeGreaterThanOrEqual(0);
        expect(team.percentage).toBeLessThanOrEqual(100);
        expect(team.picks).toBeGreaterThan(0);
      });

      // Check conference favoritism
      expect(["East", "West"]).toContain(result.favoredConference.conference);
      expect(result.favoredConference.percentage).toBeGreaterThanOrEqual(0);
      expect(result.favoredConference.percentage).toBeLessThanOrEqual(100);
      expect(result.favoredConference.picks).toBeGreaterThan(0);
    });
  });
});
