export enum PlayoffRound {
  FIRST_ROUND = "FIRST_ROUND",
  CONFERENCE_SEMIFINALS = "CONFERENCE_SEMIFINALS",
  CONFERENCE_FINALS = "CONFERENCE_FINALS",
  NBA_FINALS = "NBA_FINALS",
}

export interface GameResult {
  winner: string;
  inGames: number;
}

export interface PlayoffData {
  [gameId: string]: GameResult;
}

export interface RoundPoints {
  basePoints: number;
  bonusPoints: number;
}
