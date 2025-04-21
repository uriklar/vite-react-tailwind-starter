import React, { useState, useEffect } from "react";
import BracketDisplay from "./BracketDisplay";
import { getOfficialResults } from "../utils/jsonbin";
import bracketData from "../data/playoffBracketTemplate.json";
import {
  loadStaticScoreboard,
  loadDynamicScoreboard,
  fetchUserScore,
  sortScoreboardEntries,
  type ScoreboardEntry,
  type OfficialResults,
  type Game,
  type Guess,
  type Team,
} from "../utils/scoreboardData";

// Configuration
const ENABLE_SCORE_FETCHING = false; // Set to true to enable fetching individual scores

interface Guesses {
  [gameId: string]: Guess;
}

const ScoreboardPage: React.FC = () => {
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(true);
  const [errorResults, setErrorResults] = useState<string | null>(null);
  const [resultsGames, setResultsGames] = useState<Game[]>([]);
  const [resultsGuesses, setResultsGuesses] = useState<Guesses>({});
  const [, setOfficialResults] = useState<OfficialResults | null>(null);
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);

  // Helper to populate the bracket structure and guesses based on official results
  const processResultsForDisplay = (results: OfficialResults) => {
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
  };

  // Effect: Load data based on mode
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingResults(true);
      setErrorResults(null);

      try {
        if (ENABLE_SCORE_FETCHING) {
          // Dynamic mode - fetch from JSONBin
          const { scoreboard: initialScoreboard, results } =
            await loadDynamicScoreboard();
          setOfficialResults(results);
          processResultsForDisplay(results);
          setScoreboard(initialScoreboard);

          // Fetch individual scores
          for (const entry of initialScoreboard) {
            const updatedEntry = await fetchUserScore(entry, results);
            setScoreboard((prev) => {
              const newScoreboard = prev.map((e) =>
                e.userId === updatedEntry.userId ? updatedEntry : e
              );
              return newScoreboard.sort(sortScoreboardEntries);
            });
          }
        } else {
          // Static mode - load from file
          const results = await getOfficialResults();
          if (!results) {
            throw new Error("Could not fetch official results.");
          }

          setOfficialResults(results);
          processResultsForDisplay(results);

          // Load and calculate static scores
          const staticScoreboard = await loadStaticScoreboard(results);
          setScoreboard(staticScoreboard);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Error loading data:", err);
        setErrorResults(errorMessage);
      } finally {
        setIsLoadingResults(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Scoreboard Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#1a1a1d] mb-4">Scoreboard</h2>
        {isLoadingResults ? (
          <div className="text-center py-4">Loading scores...</div>
        ) : errorResults ? (
          <div className="text-red-500 text-center py-4">{errorResults}</div>
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
                      {entry.status === "loaded" && entry.score !== null
                        ? index + 1
                        : "-"}
                    </td>
                    <td className="px-4 py-2 text-[#1a1a1d]">{entry.name}</td>
                    <td className="px-4 py-2 text-right font-semibold">
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
