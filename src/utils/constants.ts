import { PlayoffRound, RoundPoints } from "./types";

export const SCORING_CONFIG: Record<PlayoffRound, RoundPoints> = {
  [PlayoffRound.FIRST_ROUND]: {
    basePoints: 8,
    bonusPoints: 6,
  },
  [PlayoffRound.CONFERENCE_SEMIFINALS]: {
    basePoints: 12,
    bonusPoints: 8,
  },
  [PlayoffRound.CONFERENCE_FINALS]: {
    basePoints: 16,
    bonusPoints: 10,
  },
  [PlayoffRound.NBA_FINALS]: {
    basePoints: 24,
    bonusPoints: 12,
  },
};

export const GAME_ID_PATTERNS = {
  [PlayoffRound.NBA_FINALS]: /^Finals$/,
  [PlayoffRound.CONFERENCE_FINALS]: /^[EW]CF$/,
  [PlayoffRound.CONFERENCE_SEMIFINALS]: /^[EW](SF[12]|[1-4]v[1-4])$/,
  [PlayoffRound.FIRST_ROUND]: /^[EW][1-8]v[1-8]$/,
};
