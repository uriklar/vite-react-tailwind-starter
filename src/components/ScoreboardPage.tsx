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
import { guesses as staticGuesses } from "../data/guesses";

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
  const [showScoringModal, setShowScoringModal] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Extract unique team names from the bracket data for the dropdown
  const allTeams = React.useMemo(() => {
    const teams = new Set<string>();
    bracketData.games
      .filter(game => game.round === 1) // Only use first round games to get actual team names
      .forEach(game => {
        if (game.team1.name !== "TBD") teams.add(game.team1.name);
        if (game.team2.name !== "TBD") teams.add(game.team2.name);
      });
    return Array.from(teams).sort();
  }, []);

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

  // Find where a user predicted a team would exit
  const findTeamExitPrediction = (userId: string, teamName: string): string => {
    if (!teamName) return "No pick";
    
    const userGuesses = (staticGuesses as Record<string, any>)[userId];
    if (!userGuesses) return "No pick";
    
    // Check if the user picked this team to win the Finals (champion)
    const finalsGuess = userGuesses.Finals;
    if (finalsGuess?.winner === teamName) {
      return `Champion`;
    }

    // Map rounds to display abbreviations
    const roundAbbr: Record<number, string> = {
      1: "R1",
      2: "CONF SF",
      3: "CONF F",
      4: "FINALS"
    };

    // Check first round games to find the team's starting point
    const firstRoundGames = bracketData.games.filter(game => game.round === 1);
    const startingGame = firstRoundGames.find(
      game => game.team1.name === teamName || game.team2.name === teamName
    );
    
    if (!startingGame) return "No pick"; // Team not in first round
    
    const startingGameId = startingGame.gameId;
    const guessForStartingGame = userGuesses[startingGameId];
    
    // If team lost in first round
    if (!guessForStartingGame || guessForStartingGame.winner !== teamName) {
      if (!guessForStartingGame) return "No pick";
      return `Lost in ${roundAbbr[1]}`;
    }
    
    // Track team's path through bracket
    let currentGameId = startingGameId;
    let currentRound = 1;
    
    // Loop until we find where team gets eliminated
    while (true) {
      const currentGame = bracketData.games.find(game => game.gameId === currentGameId);
      if (!currentGame) break;
      
      if (!currentGame.nextGameId) {
        // Reached finals and already checked if they won
        return `Lost in ${roundAbbr[4]}`;
      }
      
      const nextGameId = currentGame.nextGameId;
      const nextRound = currentRound + 1;
      const nextGameGuess = userGuesses[nextGameId];
      
      // Team didn't advance to next round or no prediction made
      if (!nextGameGuess || nextGameGuess.winner !== teamName) {
        return `Lost in ${roundAbbr[nextRound]}`;
      }
      
      // Team won this round, move to next round
      currentGameId = nextGameId;
      currentRound = nextRound;
    }
    
    return "No pick"; // Should only reach here if data is incomplete
  };

  // Scoring formula modal component
  const ScoringFormulaModal = () => {
    if (!showScoringModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Playoff Scoring Formula</h3>
            <button 
              onClick={() => setShowScoringModal(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-700">Points are awarded for correctly predicting winners and series length in each round:</p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Playoff Round</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Correct Winner</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Correct Series Length</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Max Points Per Series</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-medium">First Round</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">8 pts</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">6 pts</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-medium">14 pts</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">Conference Semifinals</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">12 pts</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">8 pts</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-medium">20 pts</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Conference Finals</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">16 pts</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">10 pts</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-medium">26 pts</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">NBA Finals</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">24 pts</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">12 pts</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-medium">36 pts</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="text-gray-700 mt-4">
              <p className="mb-2"><strong>Notes:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Correct winner points are awarded for predicting the team that wins a series</li>
                <li>Bonus points are awarded for correctly predicting the exact number of games in the series</li>
                <li>You must predict the correct winner to be eligible for series length points</li>
                <li>Points increase with each round to reflect increased difficulty</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 text-right">
            <button 
              onClick={() => setShowScoringModal(false)}
              className="bg-[#5a2ee5] hover:bg-[#4a1ed5] text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Scoreboard Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#1a1a1d] mb-4">Scoreboard</h2>
        
        {/* Team Selector */}
        <div className="mb-6">
          <label htmlFor="team-selector" className="block text-sm font-medium text-gray-700 mb-2">
            Select a team to see predictions:
          </label>
          <select
            id="team-selector"
            value={selectedTeam || ""}
            onChange={(e) => setSelectedTeam(e.target.value || null)}
            className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#5a2ee5] focus:border-[#5a2ee5]"
          >
            <option value="">-- Select Team --</option>
            {allTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
        
        {isLoadingResults ? (
          <div className="text-center py-4">Loading scores...</div>
        ) : errorResults ? (
          <div className="text-red-500 text-center py-4">{errorResults}</div>
        ) : (
          <div className="overflow-x-auto pt-24 relative">
            <table className="w-full">
              <thead className="bg-[#f8f5fd]">
                <tr>
                  <th className="px-4 py-2 text-left text-[#1a1a1d] relative group cursor-help">
                    Rank
                    <div className="absolute hidden group-hover:block bg-gray-800 text-white p-3 rounded shadow-lg w-64 text-sm z-20 left-0 top-0 transform -translate-y-full">
                      <div className="absolute h-8 w-full bottom-0 translate-y-full opacity-0"></div>
                      Position in the standings based on score
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-[#1a1a1d] relative group cursor-help">
                    User
                    <div className="absolute hidden group-hover:block bg-gray-800 text-white p-3 rounded shadow-lg w-64 text-sm z-20 left-0 top-0 transform -translate-y-full">
                      <div className="absolute h-8 w-full bottom-0 translate-y-full opacity-0"></div>
                      Participant name
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-[#1a1a1d] relative group cursor-help">
                    Finals Guess
                    <div className="absolute hidden group-hover:block bg-gray-800 text-white p-3 rounded shadow-lg w-64 text-sm z-20 left-0 top-0 transform -translate-y-full">
                      <div className="absolute h-8 w-full bottom-0 translate-y-full opacity-0"></div>
                      Participant's prediction for the NBA Finals
                    </div>
                  </th>
                  {selectedTeam && (
                    <th className="px-4 py-2 text-left text-[#1a1a1d] relative group cursor-help">
                      Finish for {selectedTeam}
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white p-3 rounded shadow-lg w-64 text-sm z-20 left-0 top-0 transform -translate-y-full">
                        <div className="absolute h-8 w-full bottom-0 translate-y-full opacity-0"></div>
                        Where this participant predicted {selectedTeam} would finish in the playoffs
                      </div>
                    </th>
                  )}
                  <th className="px-4 py-2 text-right text-[#1a1a1d] relative group cursor-help">
                    Potential Pts
                    <div className="absolute hidden group-hover:block bg-gray-800 text-white p-3 rounded shadow-lg w-64 text-sm z-20 right-0 top-0 transform -translate-y-full">
                      <div className="absolute h-8 w-full bottom-0 translate-y-full opacity-0"></div>
                      Maximum possible score based on remaining games and predictions.
                    </div>
                  </th>
                  <th className="px-4 py-2 text-right text-[#1a1a1d] relative group cursor-help">
                    Score
                    <div className="absolute hidden group-hover:block hover:block bg-gray-800 text-white p-3 rounded shadow-lg w-64 text-sm z-20 right-0 top-0 transform -translate-y-full">
                      <div className="absolute h-8 w-full bottom-0 translate-y-full opacity-0"></div>
                      Current score based on correct predictions. 
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowScoringModal(true);
                        }}
                        className="ml-1 text-blue-300 hover:text-blue-100 hover:underline focus:outline-none"
                      >
                        View scoring formula
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry, index) => {
                  // Get finals guess for this user
                  const finalsGuess = (staticGuesses as Record<string, any>)[entry.userId]?.Finals;
                  const finalsGuessText =
                    finalsGuess && finalsGuess.winner && finalsGuess.inGames
                      ? `${finalsGuess.winner} in ${finalsGuess.inGames}`
                      : "—";
                  return (
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
                      <td className="px-4 py-2 text-[#1a1a1d]">{finalsGuessText}</td>
                      {selectedTeam && (
                        <td className="px-4 py-2 text-[#1a1a1d]">
                          {findTeamExitPrediction(entry.userId, selectedTeam)}
                        </td>
                      )}
                      <td className="px-4 py-2 text-right text-[#1a1a1d] font-medium">
                        {entry.status === "loaded" && entry.potentialPoints !== null 
                          ? entry.potentialPoints
                          : entry.status === "pending" 
                            ? "--" 
                            : entry.status === "loading" 
                              ? "Loading..." 
                              : "Error"}
                      </td>
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
                  );
                })}
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

      {/* Scoring Formula Modal */}
      <ScoringFormulaModal />
    </div>
  );
};

export default ScoreboardPage;
