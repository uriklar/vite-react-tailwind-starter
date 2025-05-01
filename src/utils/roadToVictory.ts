// src/roadToVictory.ts
/* ------------------------------------------------------------------ */
/*  Types & Config                                                    */

import { SCORING_CONFIG } from "@/utils/constants";
import { determineRound } from "@/utils/scoring";

/* ------------------------------------------------------------------ */
export type SeriesId = string;
export type Team = string;

export interface Pick {
  winner: Team;
  inGames: number;
}
export interface Player {
  id: string;
  picks: Record<SeriesId, Pick>;
}
export interface Outcome {
  seriesId: SeriesId;
  winner: Team;
  games: 4 | 5 | 6 | 7;
}

export enum PlayoffRound {
  FIRST_ROUND = "FIRST_ROUND",
  CONFERENCE_SEMIFINALS = "CONFERENCE_SEMIFINALS",
  CONFERENCE_FINALS = "CONFERENCE_FINALS",
  NBA_FINALS = "NBA_FINALS",
}

export interface RoundPoints {
  basePoints: number;
  bonusPoints: number;
}

export interface FindOpts {
  userId: string;
  players: Player[];
  remainingIds: SeriesId[];
  currentScores: Map<string, number>;
  isLeader?: (scores: Map<string, number>, userId: string) => boolean;
  maxPaths?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const possibleWinners = (sid: SeriesId, players: Player[]): Team[] => {
  const s = new Set<Team>();
  players.forEach((p) => {
    const pk = p.picks[sid];
    if (pk) s.add(pk.winner);
  });
  return [...s];
};

const addScores = (base: Map<string, number>, delta: Map<string, number>) => {
  delta.forEach((v, k) => base.set(k, (base.get(k) || 0) + v));
};

/* ------------------------------------------------------------------ */
/*  Core                                                              */
/* ------------------------------------------------------------------ */
export function findRoadToVictory({
  userId,
  players,
  remainingIds,
  currentScores,
  isLeader = (scores, uid) =>
    [...scores.values()].every((v) => v <= (scores.get(uid) || 0)) &&
    [...scores.values()].filter((v) => v === (scores.get(uid) || 0)).length ===
      1,
  maxPaths = 5,
}: FindOpts): Outcome[][] {
  console.log("Starting findRoadToVictory for user:", userId);
  console.log("Remaining series to process:", remainingIds);
  console.log("Current scores:", Object.fromEntries(currentScores));

  const paths: Outcome[][] = [];

  /* max potential points each player can still gain */
  const maxRemain = new Map<string, number>();
  players.forEach((pl) => maxRemain.set(pl.id, 0));
  remainingIds.forEach((sid) => {
    const round = determineRound(sid);
    const { basePoints, bonusPoints } = SCORING_CONFIG[round!];
    players.forEach((pl) => {
      if (pl.picks[sid])
        maxRemain.set(pl.id, maxRemain.get(pl.id)! + basePoints + bonusPoints);
    });
  });

  console.log(
    "Maximum remaining points possible:",
    Object.fromEntries(maxRemain)
  );

  const bestPossibleUser =
    (currentScores.get(userId) || 0) + maxRemain.get(userId)!;
  console.log("Best possible score for user:", bestPossibleUser);

  if (
    players.some(
      (pl) =>
        pl.id !== userId && bestPossibleUser < (currentScores.get(pl.id) || 0)
    )
  ) {
    console.log("User cannot win - another player already has more points");
    return [];
  }

  const dfs = (idx: number, scores: Map<string, number>, path: Outcome[]) => {
    console.log(`\nDFS at depth ${idx}:`);
    console.log("Current path:", path);
    console.log("Current scores:", Object.fromEntries(scores));

    // Stop the search if we've found the maximum number of paths
    if (paths.length >= maxPaths) {
      console.log(
        `Found ${paths.length} paths (max: ${maxPaths}), stopping search`
      );
      return;
    }

    if (idx === remainingIds.length) {
      const isLeaderResult = isLeader(scores, userId);
      console.log("Reached end of path. Is user leader?", isLeaderResult);
      if (isLeaderResult) paths.push([...path]);
      return;
    }

    const sid = remainingIds[idx];
    const round = determineRound(sid);
    const { basePoints, bonusPoints } = SCORING_CONFIG[round!];
    console.log(`Processing series ${sid} (${round})`);
    console.log(
      `Points available - Base: ${basePoints}, Bonus: ${bonusPoints}`
    );

    const winners = possibleWinners(sid, players);
    console.log("Possible winners for this series:", winners);

    for (const winner of winners) {
      console.log(`\nTrying winner: ${winner}`);
      for (const games of [4, 5, 6, 7] as const) {
        // Check again inside the inner loops to exit sooner
        if (paths.length >= maxPaths) return;

        console.log(`  Testing games count: ${games}`);
        const outcome: Outcome = { seriesId: sid, winner, games };
        const delta = new Map<string, number>();

        players.forEach((pl) => {
          const pk = pl.picks[sid];
          if (!pk) {
            delta.set(pl.id, 0);
            return;
          }
          let pts = 0;
          if (pk.winner === winner) {
            pts += basePoints;
            if (pk.inGames === games) pts += bonusPoints;
          }
          delta.set(pl.id, pts);
        });

        console.log("  Point changes:", Object.fromEntries(delta));

        const nextScores = new Map(scores);
        addScores(nextScores, delta);
        console.log("  New scores would be:", Object.fromEntries(nextScores));

        const userBest = nextScores.get(userId)! + maxRemain.get(userId)!;
        const rivalBest = Math.max(
          ...players.map((pl) => nextScores.get(pl.id)! + maxRemain.get(pl.id)!)
        );

        if (userBest < rivalBest) {
          console.log("  Skipping - user cannot win this path");
          continue;
        }

        console.log("  Exploring this path...");
        path.push(outcome);
        dfs(idx + 1, nextScores, path);
        path.pop();
      }
    }
  };

  dfs(0, new Map(currentScores), []);
  console.log("\nFound winning paths:", paths.length);
  return paths;
}
