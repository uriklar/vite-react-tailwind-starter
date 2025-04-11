import React, { useState, useEffect } from "react";
import BracketDisplay from "./BracketDisplay"; // Reuse the display component
import {
  getOfficialResults,
  getMasterIndex,
  getBin,
} from "../utils/jsonbin.js";
import { calculateScore } from "../utils/scoring.ts"; // Import scoring utility
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
  userId: string;
  binId: string;
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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Scoreboard</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Official Results
        </h2>
        {isLoadingResults && (
          <p className="text-center text-gray-600">
            Loading official results...
          </p>
        )}
        {errorResults && (
          <p className="text-center text-red-600">Error: {errorResults}</p>
        )}
        {officialResults && !isLoadingResults && !errorResults && (
          <BracketDisplay
            games={resultsGames} // Display the populated structure
            guesses={resultsGuesses} // Pass derived guesses to show selections
            onGuessChange={() => {}} // No-op change handler
            readOnly={true} // Ensure it's read-only
            layoutMode="conferences" // Set the layout mode here
          />
        )}
      </section>

      {/* User Scores Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-center">User Scores</h2>
        {isLoadingScores && (
          <p className="text-center text-gray-600">Loading user scores...</p>
        )}
        {errorScores && !isLoadingScores && (
          <p className="text-center text-red-600">
            Error loading scores: {errorScores}
          </p>
        )}
        {!isLoadingScores && !errorScores && scoreboard.length === 0 && (
          <p className="text-center text-gray-500">
            No user submissions found yet.
          </p>
        )}
        {!isLoadingScores && !errorScores && scoreboard.length > 0 && (
          <div className="max-w-md mx-auto bg-white shadow-md rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {scoreboard.map((entry, index) => (
                <li
                  key={entry.userId}
                  className="px-6 py-4 flex justify-between items-center"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {index + 1}. {entry.userId}
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {entry.score} pts
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

export default ScoreboardPage;
