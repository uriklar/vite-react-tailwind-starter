import { runComprehensiveAnalysis } from "./index";

describe("Comprehensive Analysis", () => {
  test("runComprehensiveAnalysis returns complete analysis", () => {
    const results = runComprehensiveAnalysis();

    // Check consensus analysis
    expect(results.consensus.allSeries).toBeDefined();
    expect(results.consensus.mostAndLeastContested).toBeDefined();
    expect(results.consensus.consensusByRound).toBeDefined();

    // Check game length analysis
    expect(results.gameLength.byRound).toBeDefined();
    expect(results.gameLength.distribution).toBeDefined();

    // Check conference bias analysis
    expect(results.conferenceBias.overall).toBeDefined();
    expect(results.conferenceBias.finals).toBeDefined();

    // Check team popularity analysis
    expect(results.teamPopularity.analysis).toBeDefined();
    expect(results.teamPopularity.darkHorseTeams).toBeDefined();

    // Check predictor behavior analysis
    expect(results.predictorBehavior.similarities).toBeDefined();
    expect(results.predictorBehavior.contraryIndex).toBeDefined();
    expect(results.predictorBehavior.favoritism).toBeDefined();

    // Check series competitiveness
    expect(results.seriesCompetitiveness).toBeDefined();

    // Check bracket paths
    expect(results.bracketPaths.championshipPaths).toBeDefined();
    expect(results.bracketPaths.expectedMatchups).toBeDefined();

    // Check predictor consistency
    expect(results.predictorConsistency).toBeDefined();

    // Check upset analysis
    expect(results.upsetAnalysis.bySeedDifference).toBeDefined();
    expect(results.upsetAnalysis.underdogPredictors).toBeDefined();

    // Basic validation of array results
    expect(results.consensus.allSeries.length).toBeGreaterThan(0);
    expect(results.gameLength.byRound.length).toBe(4); // 4 rounds in playoffs
    expect(results.conferenceBias.overall.length).toBe(2); // East and West
    expect(results.predictorBehavior.contraryIndex.length).toBeGreaterThan(0);
    expect(results.bracketPaths.championshipPaths.length).toBeGreaterThan(0);
    expect(results.predictorConsistency.length).toBeGreaterThan(0);

    console.log(JSON.stringify(results, null, 2));
  });
});
