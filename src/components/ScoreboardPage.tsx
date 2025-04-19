import React, { useState, useEffect, useCallback } from "react";
import BracketDisplay from "./BracketDisplay"; // Reuse the display component
import { getOfficialResults, getMasterIndex, getBin } from "../utils/jsonbin";
import { calculateScore } from "../utils/scoring"; // Import scoring utility
import bracketData from "../data/playoffBracketTemplate.json"; // For base structure

// --- Configuration ---
const ENABLE_SCORE_FETCHING = false; // Set to true to enable fetching individual scores

// Interfaces (consider shared types file)
interface Team {
  name: string;
  seed: number | null;
  logo: string;
}
interface Game {
  gameId: string;
  round: number;
  conference: string;
  matchup: number;
  nextGameId: string | null;
  team1: Team;
  team2: Team;
}
interface ResultItem {
  winner: string;
  inGames: number;
}
interface OfficialResults {
  [gameId: string]: ResultItem;
}
interface Guess {
  winner: Team | null;
  inGames: number | null;
}
interface Guesses {
  [gameId: string]: Guess;
}

// Interface for user submission data fetched from individual bins
// interface UserSubmission {
//   userId: string;
//   guess: {
//     // User guesses have winner as string
//     [gameId: string]: { winner: string; inGames: number };
//   };
// }

// Interface for master index entries
interface MasterIndexEntry {
  binId: string;
  userId: string;
  name: string; // Assuming name is available, adjust if needed
  timestamp: string;
}

// Interface for scoreboard data entry with status
interface ScoreboardEntry {
  userId: string;
  name: string;
  score: number | null;
  status: "loading" | "loaded" | "error" | "pending"; // Add 'pending' state
  error?: string;
  binId?: string; // Ensure binId is optional here if not always present initially
}

const ScoreboardPage: React.FC = () => {
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(true);
  const [errorResults, setErrorResults] = useState<string | null>(null);
  const [resultsGames, setResultsGames] = useState<Game[]>([]);
  const [resultsGuesses, setResultsGuesses] = useState<Guesses>({});
  const [officialResults, setOfficialResults] =
    useState<OfficialResults | null>(null);

  // State for scoreboard data
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [isLoadingMasterIndex, setIsLoadingMasterIndex] =
    useState<boolean>(true);
  const [errorMasterIndex, setErrorMasterIndex] = useState<string | null>(null);

  // Helper to populate the bracket structure and guesses based on official results
  const processResultsForDisplay = useCallback((results: OfficialResults) => {
    console.log({ results });
    const currentGames: Game[] = JSON.parse(JSON.stringify(bracketData.games));
    const derivedGuesses: Guesses = {};

    const rounds = Array.from(
      new Set(currentGames.map((game) => game.round))
    ).sort((a, b) => a - b);

    rounds.forEach((round) => {
      currentGames
        .filter((g) => g.round === round)
        .forEach((game) => {
          const result = results[game.gameId];
          if (result && result.winner && result.winner !== "TBD") {
            let winnerTeam: Team | null = null;
            if (game.team1.name === result.winner) {
              winnerTeam = game.team1;
            } else if (game.team2.name === result.winner) {
              winnerTeam = game.team2;
            }

            if (winnerTeam) {
              derivedGuesses[game.gameId] = {
                winner: winnerTeam,
                inGames: result.inGames,
              };

              if (game.nextGameId) {
                const nextGameIndex = currentGames.findIndex(
                  (g) => g.gameId === game.nextGameId
                );
                if (nextGameIndex !== -1) {
                  const gamesFeedingNext = currentGames
                    .filter((g) => g.nextGameId === game.nextGameId)
                    .sort((a, b) => a.matchup - b.matchup);
                  const slotIndex = gamesFeedingNext.findIndex(
                    (g) => g.gameId === game.gameId
                  );

                  if (slotIndex === 0) {
                    currentGames[nextGameIndex].team1 = winnerTeam;
                  } else if (slotIndex === 1) {
                    currentGames[nextGameIndex].team2 = winnerTeam;
                  }
                }
              }
            }
          }
        });
    });

    setResultsGames(currentGames);
    setResultsGuesses(derivedGuesses);
  }, []);

  // Effect 1: Fetch initial data (Results and Master Index)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingResults(true);
      setIsLoadingMasterIndex(true);
      setErrorResults(null);
      setErrorMasterIndex(null);
      setScoreboard([]); // Clear previous scoreboard

      try {
        // Fetch results and master index concurrently
        const [results, masterIndex] = await Promise.all([
          getOfficialResults(),
          getMasterIndex(),
        ]);

        // Process Results
        if (!results) {
          throw new Error("Could not fetch official results.");
        }
        setOfficialResults(results);
        processResultsForDisplay(results);
        setIsLoadingResults(false);

        // Process Master Index
        if (
          !masterIndex ||
          !masterIndex.submissions ||
          masterIndex.submissions.length === 0
        ) {
          console.log("No user submissions found in master index.");
          setErrorMasterIndex("No submissions found."); // Set an informative state
          setIsLoadingMasterIndex(false);
          return; // Stop if no submissions
        }

        // Initialize scoreboard with loading state
        const initialScoreboard = masterIndex.submissions.map(
          (entry: MasterIndexEntry): ScoreboardEntry => ({
            userId: entry.userId,
            // Use userId as name if name field doesn't exist, adjust as needed
            name: entry.name || entry.userId,
            score: null,
            // Set initial status based on the flag, explicitly typed
            status: ENABLE_SCORE_FETCHING ? "loading" : "pending",
            binId: entry.binId, // Keep binId for the next step
          })
        );
        setScoreboard(initialScoreboard);
        setIsLoadingMasterIndex(false); // Master index loaded, ready for score fetching
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Error fetching initial data:", err);
        if (isLoadingResults) setErrorResults(errorMessage); // Check which one was loading
        if (isLoadingMasterIndex) setErrorMasterIndex(errorMessage);
        setIsLoadingResults(false);
        setIsLoadingMasterIndex(false);
      }
    };

    fetchInitialData();
  }, [processResultsForDisplay]); // Add processResultsForDisplay dependency

  // Effect 2: Fetch and score individual submissions when results and initial scoreboard are ready
  useEffect(() => {
    // Only run if score fetching is enabled AND we have results and an initial scoreboard structure
    if (
      !ENABLE_SCORE_FETCHING || // Check the flag first
      !officialResults ||
      scoreboard.length === 0 ||
      !scoreboard.some((entry) => entry.status === "loading") // Only run if there are entries to load
    ) {
      return;
    }

    const fetchScoresForUsers = async () => {
      // Use Promise.allSettled to fetch all, even if some fail
      const submissionPromises = scoreboard.map(async (entry) => {
        // Ensure entry has binId - should be guaranteed by Effect 1 structure
        const binId = entry.binId;
        if (!binId) {
          throw new Error(`Missing binId for user ${entry.userId}`);
        }

        try {
          const binData = await getBin(binId);
          const submissionRecord = binData?.record ?? binData;

          if (
            !submissionRecord ||
            !submissionRecord.userId ||
            !submissionRecord.guess
          ) {
            throw new Error(`Invalid data format in bin ${binId}`);
          }

          const score = calculateScore(submissionRecord.guess, officialResults);
          return { userId: entry.userId, score };
        } catch (fetchError) {
          console.error(
            `Failed to fetch/process bin ${binId} for user ${entry.userId}:`,
            fetchError
          );
          // Re-throw with user context for allSettled
          throw new Error(
            `Failed for ${entry.name}: ${
              fetchError instanceof Error
                ? fetchError.message
                : String(fetchError)
            }`
          );
        }
      });

      const results = await Promise.allSettled(submissionPromises);

      // Update scoreboard state based on settled promises
      setScoreboard((prevScoreboard) => {
        const updatedScoreboard = [...prevScoreboard]; // Create a mutable copy

        results.forEach((result, index) => {
          const targetEntryIndex = updatedScoreboard.findIndex(
            (entry) => entry.userId === prevScoreboard[index].userId // Match using original index order
          );

          if (targetEntryIndex === -1) return; // Should not happen

          if (result.status === "fulfilled") {
            updatedScoreboard[targetEntryIndex] = {
              ...updatedScoreboard[targetEntryIndex],
              score: result.value.score,
              status: "loaded",
              error: undefined, // Clear any previous error
            };
          } else {
            // status === 'rejected'
            updatedScoreboard[targetEntryIndex] = {
              ...updatedScoreboard[targetEntryIndex],
              score: null,
              status: "error",
              error: result.reason?.message || "Failed to load score",
            };
          }
        });

        // Sort after all fetches are processed
        updatedScoreboard.sort((a, b) => {
          // Handle sorting with null scores and different statuses
          if (a.status === "loaded" && b.status === "loaded") {
            return (b.score ?? -Infinity) - (a.score ?? -Infinity); // Sort loaded scores descending
          } else if (a.status === "loaded") {
            return -1; // Keep loaded scores before others
          } else if (b.status === "loaded") {
            return 1; // Keep loaded scores before others
          } else if (a.status === "loading" && b.status !== "loading") {
            return -1; // Keep loading before error
          } else if (b.status === "loading" && a.status !== "loading") {
            return 1; // Keep loading before error
          }
          // Both are loading or both are error, maintain relative order or sort by name
          return a.name.localeCompare(b.name);
        });

        return updatedScoreboard;
      });
    };

    fetchScoresForUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officialResults]); // Dependency: run when officialResults are ready

  return (
    <div className="space-y-8">
      {/* Scoreboard Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#1a1a1d] mb-4">Scoreboard</h2>
        {isLoadingMasterIndex ? (
          <div className="text-center py-4">Loading user list...</div>
        ) : errorMasterIndex ? (
          <div className="text-red-500 text-center py-4">
            {errorMasterIndex}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8f5fd]">
                <tr>
                  <th className="px-4 py-2 text-left text-[#1a1a1d]">Rank</th>
                  <th className="px-4 py-2 text-left text-[#1a1a1d]">User</th>
                  <th className="px-4 py-2 text-right text-[#1a1a1d]">Score</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={
                      entry.status === "loaded" &&
                      index === 0 &&
                      (entry.score ?? -1) >= 0
                        ? "bg-[#ffd866]"
                        : "hover:bg-[#f8f5fd]"
                    }
                  >
                    <td className="px-4 py-2 text-[#1a1a1d]">
                      {/* Show rank only if loaded, otherwise '-' */}
                      {entry.status === "loaded" && entry.score !== null
                        ? index + 1
                        : "-"}
                    </td>
                    <td className="px-4 py-2 text-[#1a1a1d]">{entry.name}</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {/* Conditional rendering based on status */}
                      {entry.status === "pending" && (
                        <span className="text-gray-400 text-xs">--</span>
                      )}
                      {entry.status === "loading" && (
                        <span className="text-gray-500 text-xs">
                          Loading...
                        </span>
                      )}
                      {entry.status === "loaded" && (
                        <span className="text-[#5a2ee5]">{entry.score}</span>
                      )}
                      {entry.status === "error" && (
                        <span
                          className="text-red-500 text-xs"
                          title={entry.error}
                        >
                          Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Adjust loading message visibility */}
            {ENABLE_SCORE_FETCHING &&
              scoreboard.some((e) => e.status === "loading") && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  Scores are loading...
                </div>
              )}
          </div>
        )}
      </section>

      {/* Results Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#1a1a1d] mb-4">
          Official Results
        </h2>
        {isLoadingResults ? (
          <div className="text-center py-4">Loading results...</div>
        ) : errorResults ? (
          <div className="text-red-500 text-center py-4">{errorResults}</div>
        ) : (
          <div className="bg-[#f8f5fd] rounded-lg p-4">
            <BracketDisplay
              games={resultsGames}
              guesses={resultsGuesses}
              readOnly={true}
              onGuessChange={() => {}}
              layoutMode="conferences"
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default ScoreboardPage;
