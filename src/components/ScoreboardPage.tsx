import React, { useState, useEffect } from "react";
import BracketDisplay from "./BracketDisplay"; // Reuse the display component
import { getOfficialResults, getMasterIndex, getBin } from "../utils/jsonbin";
import { calculateScore } from "../utils/scoring"; // Import scoring utility
import bracketData from "../data/playoffBracketTemplate.json"; // For base structure

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
interface UserSubmission {
  userId: string;
  guess: {
    // User guesses have winner as string
    [gameId: string]: { winner: string; inGames: number };
  };
}

// Interface for master index entries
interface MasterIndexEntry {
  binId: string;
  userId: string;
  name: string;
  timestamp: string;
}

// Interface for scoreboard data
interface ScoreboardEntry {
  userId: string;
  score: number;
}

const ScoreboardPage: React.FC = () => {
  const [officialResults, setOfficialResults] =
    useState<OfficialResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(true);
  const [errorResults, setErrorResults] = useState<string | null>(null);

  // State for the bracket structure populated with results
  const [resultsGames, setResultsGames] = useState<Game[]>([]);
  // State for the guesses derived from results for BracketDisplay
  const [resultsGuesses, setResultsGuesses] = useState<Guesses>({});

  // State for user scores
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState<boolean>(true);
  const [errorScores, setErrorScores] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndScoreData = async () => {
      setIsLoadingResults(true);
      setIsLoadingScores(true);
      setErrorResults(null);
      setErrorScores(null);
      setOfficialResults(null);
      setScoreboard([]);

      try {
        // 1. Fetch Official Results
        const results = await getOfficialResults();
        if (!results) {
          throw new Error("Could not fetch official results.");
        }
        setOfficialResults(results);
        processResultsForDisplay(results); // Update results display
        setIsLoadingResults(false); // Results loaded

        // 2. Fetch Master Index
        const masterIndex = await getMasterIndex();
        if (
          !masterIndex ||
          !masterIndex.submissions ||
          masterIndex.submissions.length === 0
        ) {
          console.log("No user submissions found in master index.");
          setIsLoadingScores(false); // No scores to load
          return; // Exit if no submissions
        }

        // 3. Fetch individual user guesses
        const userSubmissionsPromises = masterIndex.submissions.map(
          async (entry: MasterIndexEntry) => {
            try {
              // Fetch the specific bin, the content is wrapped in a 'record' property by jsonbin
              const binData = await getBin(entry.binId);
              // Ensure the fetched data has the expected structure
              const submissionRecord = binData?.record ?? binData;
              if (
                submissionRecord &&
                submissionRecord.userId &&
                submissionRecord.guess
              ) {
                return submissionRecord as UserSubmission;
              }
              console.warn(
                `Invalid data format in bin ${entry.binId} for user ${entry.userId}`
              );
              return null;
            } catch (fetchError) {
              console.error(
                `Failed to fetch bin ${entry.binId} for user ${entry.userId}:`,
                fetchError
              );
              return null; // Return null if a specific bin fails
            }
          }
        );

        const fetchedSubmissions = (
          await Promise.all(userSubmissionsPromises)
        ).filter((sub) => sub !== null) as UserSubmission[];

        // 4. Calculate scores
        const scores = fetchedSubmissions.map((submission) => ({
          userId: submission.userId,
          // Pass the .guess part and the official results
          score: calculateScore(submission.guess, results),
        }));

        // 5. Sort scores descending
        scores.sort((a, b) => b.score - a.score);

        setScoreboard(scores);
      } catch (err: any) {
        console.error(err);
        // Determine if error was during results or scores fetching
        if (isLoadingResults)
          setErrorResults(err.message || "An error occurred fetching results.");
        setErrorScores(
          err.message || "An error occurred fetching or processing user scores."
        );
      } finally {
        // Ensure loading states are false if not already set
        setIsLoadingResults(false);
        setIsLoadingScores(false);
      }
    };

    fetchAndScoreData();
  }, []);

  // Helper to populate the bracket structure and guesses based on official results
  const processResultsForDisplay = (results: OfficialResults) => {
    let currentGames: Game[] = JSON.parse(JSON.stringify(bracketData.games));
    const derivedGuesses: Guesses = {};

    // Use a loop that processes rounds sequentially to ensure winners propagate correctly
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

              // Propagate winner to the next round in currentGames state
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
  };

  return (
    <div className="space-y-8">
      {/* Scoreboard Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#0c0c0d] mb-4">Scoreboard</h2>
        {isLoadingScores ? (
          <div className="text-center py-4">Loading scores...</div>
        ) : errorScores ? (
          <div className="text-red-500 text-center py-4">{errorScores}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f4edfd]">
                <tr>
                  <th className="px-4 py-2 text-left text-[#0c0c0d]">Rank</th>
                  <th className="px-4 py-2 text-left text-[#0c0c0d]">User</th>
                  <th className="px-4 py-2 text-right text-[#0c0c0d]">Score</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={
                      index === 0 ? "bg-[#fce07f]" : "hover:bg-[#f4edfd]"
                    }
                  >
                    <td className="px-4 py-2 text-[#0c0c0d]">{index + 1}</td>
                    <td className="px-4 py-2 text-[#0c0c0d]">{entry.userId}</td>
                    <td className="px-4 py-2 text-right font-semibold text-[#6837f8]">
                      {entry.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Results Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#0c0c0d] mb-4">
          Official Results
        </h2>
        {isLoadingResults ? (
          <div className="text-center py-4">Loading results...</div>
        ) : errorResults ? (
          <div className="text-red-500 text-center py-4">{errorResults}</div>
        ) : (
          <div className="bg-[#f4edfd] rounded-lg p-4">
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
