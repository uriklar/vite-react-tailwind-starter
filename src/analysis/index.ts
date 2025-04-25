import {
  getConsensusAnalysis,
  getMostAndLeastContestedSeries,
  getConsensusChangeByRound,
} from "./consensusAnalysis";
import {
  getGameLengthAnalysis,
  getSeriesLengthDistribution,
} from "./gameLengthAnalysis";
import {
  getConferenceBiasAnalysis,
  getFinalsConferenceBias,
} from "./conferenceBiasAnalysis";
import {
  getTeamPopularityAnalysis,
  getDarkHorseTeams,
} from "./teamPopularityAnalysis";
import {
  getPredictorSimilarities,
  getContraryIndex,
  getTeamConferenceFavoritism,
} from "./predictorBehaviorAnalysis";
import { getSeriesCompetitiveness } from "./seriesCompetitivenessAnalysis";
import {
  getChampionshipPaths,
  getExpectedMatchups,
} from "./bracketPathAnalysis";
import { getPredictorConsistency } from "./predictorConsistencyAnalysis";
import {
  getUpsetAnalysisBySeedDifference,
  getUnderdogPredictors,
} from "./upsetAnalysis";

export type ComprehensiveAnalysis = {
  consensus: {
    allSeries: ReturnType<typeof getConsensusAnalysis>;
    mostAndLeastContested: ReturnType<typeof getMostAndLeastContestedSeries>;
    consensusByRound: ReturnType<typeof getConsensusChangeByRound>;
  };
  gameLength: {
    byRound: ReturnType<typeof getGameLengthAnalysis>;
    distribution: ReturnType<typeof getSeriesLengthDistribution>;
  };
  conferenceBias: {
    overall: ReturnType<typeof getConferenceBiasAnalysis>;
    finals: ReturnType<typeof getFinalsConferenceBias>;
  };
  teamPopularity: {
    analysis: ReturnType<typeof getTeamPopularityAnalysis>;
    darkHorseTeams: ReturnType<typeof getDarkHorseTeams>;
  };
  predictorBehavior: {
    similarities: ReturnType<typeof getPredictorSimilarities>;
    contraryIndex: ReturnType<typeof getContraryIndex>;
    favoritism: ReturnType<typeof getTeamConferenceFavoritism>;
  };
  seriesCompetitiveness: ReturnType<typeof getSeriesCompetitiveness>;
  bracketPaths: {
    championshipPaths: ReturnType<typeof getChampionshipPaths>;
    expectedMatchups: ReturnType<typeof getExpectedMatchups>;
  };
  predictorConsistency: ReturnType<typeof getPredictorConsistency>;
  upsetAnalysis: {
    bySeedDifference: ReturnType<typeof getUpsetAnalysisBySeedDifference>;
    underdogPredictors: ReturnType<typeof getUnderdogPredictors>;
  };
};

export function runComprehensiveAnalysis(): ComprehensiveAnalysis {
  return {
    consensus: {
      allSeries: getConsensusAnalysis(),
      mostAndLeastContested: getMostAndLeastContestedSeries(),
      consensusByRound: getConsensusChangeByRound(),
    },
    gameLength: {
      byRound: getGameLengthAnalysis(),
      distribution: getSeriesLengthDistribution(),
    },
    conferenceBias: {
      overall: getConferenceBiasAnalysis(),
      finals: getFinalsConferenceBias(),
    },
    teamPopularity: {
      analysis: getTeamPopularityAnalysis(),
      darkHorseTeams: getDarkHorseTeams(),
    },
    predictorBehavior: {
      similarities: getPredictorSimilarities(),
      contraryIndex: getContraryIndex(),
      favoritism: getTeamConferenceFavoritism(),
    },
    seriesCompetitiveness: getSeriesCompetitiveness(),
    bracketPaths: {
      championshipPaths: getChampionshipPaths(),
      expectedMatchups: getExpectedMatchups(),
    },
    predictorConsistency: getPredictorConsistency(),
    upsetAnalysis: {
      bySeedDifference: getUpsetAnalysisBySeedDifference(),
      underdogPredictors: getUnderdogPredictors(),
    },
  };
}
