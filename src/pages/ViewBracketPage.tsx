import React, { useState, useEffect, useCallback } from "react";
import BracketDisplay from "../components/BracketDisplay";
import { Game, Guesses as ComponentGuesses, Team } from "../types";
import {
  findRoadToVictory,
  SeriesId,
  Outcome,
  Pick,
} from "../utils/roadToVictory";
import { guesses } from "../data/guesses";
import results from "../data/officialResultsTemplate.json";
import baseGameData from "../data/playoffBracketTemplate.json";
import { determineRound } from "@/utils/scoring";
import { SCORING_CONFIG } from "@/utils/constants";
import { PlayoffRound } from "@/utils/roadToVictory";

// Player type based on Master Index structure
interface Player {
  id: string;
  name: string;
  picks: Record<SeriesId, Pick>;
}

// Function to find a Team object by name from the base games
const findTeamByName = (
  name: string | null | undefined,
  games: Game[]
): Team | null => {
  if (!name) return null;
  for (const game of games) {
    if (game.team1.name === name) return game.team1;
    if (game.team2.name === name) return game.team2;
  }
  console.warn(`Team object not found in baseGames for name: ${name}`);
  return null;
};

// Type for the guesses object structure
type GuessesType = typeof guesses;
type PlayerName = keyof GuessesType;

const ViewBracketPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [baseGames] = useState<Game[]>(baseGameData.games || []);
  const [playerGuesses, setPlayerGuesses] = useState<ComponentGuesses | null>(
    null
  );
  const [isLoadingPlayers, setIsLoadingPlayers] = useState<boolean>(true);
  const [isLoadingBracket, setIsLoadingBracket] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Road to Victory states
  const [rtvPaths, setRtvPaths] = useState<Outcome[][] | null>(null);
  const [isCalculatingRTV, setIsCalculatingRTV] = useState<boolean>(false);
  const [rtvError, setRtvError] = useState<string | null>(null);

  // Fetch Players from guesses.ts on Mount
  useEffect(() => {
    setIsLoadingPlayers(true);
    setError(null);

    try {
      const fetchedPlayers = Object.keys(guesses).map((name) => ({
        id: name,
        name: name,
        picks: {}, // Add empty picks object to satisfy the Player interface
      }));
      setPlayers(fetchedPlayers);
      setError(null);
    } catch (err) {
      console.error("Error processing players:", err);
      setError("Failed to load player list.");
      setPlayers([]);
    } finally {
      setIsLoadingPlayers(false);
    }
  }, []);

  // Load Player Guesses
  useEffect(() => {
    if (!selectedPlayerId || baseGames.length === 0) {
      setPlayerGuesses(null);
      return;
    }

    setIsLoadingBracket(true);
    setError(null);
    setPlayerGuesses(null);

    try {
      const playerGuess = guesses[selectedPlayerId as PlayerName];
      if (!playerGuess) {
        throw new Error("Player guesses not found");
      }

      const convertedGuesses: ComponentGuesses = {};
      // Convert guesses to the format expected by BracketDisplay
      Object.entries(playerGuess).forEach(([gameId, guess]) => {
        const winnerTeam = findTeamByName(guess.winner, baseGames);
        convertedGuesses[gameId] = {
          winner: winnerTeam,
          inGames: guess.inGames,
        };
      });

      setPlayerGuesses(convertedGuesses);
    } catch (err) {
      console.error("Error processing player guesses:", err);
      setError("Failed to load bracket.");
      setPlayerGuesses(null);
    } finally {
      setIsLoadingBracket(false);
    }
  }, [selectedPlayerId, baseGames]);

  const handleCalculateRTV = useCallback(async () => {
    if (!selectedPlayerId) return;

    setIsCalculatingRTV(true);
    setRtvError(null);
    setRtvPaths(null);

    try {
      // 1. Convert all guesses to RTV Player format
      // build players[]
      const players: Player[] = Object.entries(guesses).map(([id, picks]) => ({
        id,
        picks,
        name: id, // Add the required name field
      }));

      // compute currentScores
      const currentScores = new Map<string, number>();

      Object.entries(results.results).forEach(([sid, res]) => {
        if (res.winner === "TBD") return;

        const round = determineRound(sid);
        const { basePoints, bonusPoints } =
          SCORING_CONFIG[round as PlayoffRound];

        players.forEach(({ id, picks }) => {
          const pk = picks[sid as SeriesId];
          if (!pk) return;

          let pts = 0;
          if (pk.winner === res.winner) {
            pts += basePoints;
            if (pk.inGames === res.inGames) pts += bonusPoints;
          }
          currentScores.set(id, (currentScores.get(id) || 0) + pts);
        });
      });

      // unresolved IDs
      const remainingIds: SeriesId[] = Object.entries(results.results)
        .filter(([, v]) => v.winner === "TBD")
        .map(([sid]) => sid as SeriesId);

      // example call
      const paths = findRoadToVictory({
        userId: selectedPlayerId,
        players,
        remainingIds,
        currentScores,
      });

      setRtvPaths(paths);
    } catch (err) {
      console.error("Error calculating Road to Victory:", err);
      setRtvError(
        err instanceof Error ? err.message : "Failed to calculate winning paths"
      );
    } finally {
      setIsCalculatingRTV(false);
    }
  }, [selectedPlayerId]);

  const handlePlayerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlayerId(event.target.value);
    // Reset RTV state when player changes
    setRtvPaths(null);
    setRtvError(null);
  };

  const handleGuessChange = () => {
    // Read-only mode, no changes allowed
  };

  if (baseGames.length === 0) {
    return (
      <div className="container mx-auto p-4">
        Error: Base game data could not be loaded. Check
        `src/data/playoffBracketTemplate.json`.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">View Player Bracket</h1>

      <div className="mb-4">
        <label
          htmlFor="playerSelect"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select Player:
        </label>
        <select
          id="playerSelect"
          value={selectedPlayerId}
          onChange={handlePlayerChange}
          disabled={isLoadingPlayers || players.length === 0}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-50 disabled:bg-gray-100"
        >
          <option value="" disabled>
            {isLoadingPlayers ? "Loading players..." : "-- Select a Player --"}
          </option>
          {!isLoadingPlayers && players.length > 0 ? (
            players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))
          ) : !isLoadingPlayers ? (
            <option value="" disabled>
              No players found
            </option>
          ) : null}
        </select>
      </div>

      {/* Road to Victory Button */}
      {selectedPlayerId && (
        <div className="mb-4">
          <button
            onClick={handleCalculateRTV}
            disabled={isCalculatingRTV}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculatingRTV ? "Calculating..." : "Calculate Road to Victory"}
          </button>
        </div>
      )}

      {/* Road to Victory Results */}
      {selectedPlayerId && (
        <div className="mb-4">
          {isCalculatingRTV && (
            <div className="text-gray-600">Calculating possible paths...</div>
          )}
          {rtvError && <div className="text-red-600">Error: {rtvError}</div>}
          {rtvPaths && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Road to Victory</h3>
              {rtvPaths.length === 0 ? (
                <p className="text-red-600">
                  No winning paths found. Victory is impossible.
                </p>
              ) : (
                <div>
                  <p className="text-green-600 mb-2">
                    Found {rtvPaths.length} possible winning path
                    {rtvPaths.length !== 1 ? "s" : ""}!
                  </p>
                  <div className="mt-2">
                    <p className="font-medium">Possible winning paths:</p>
                    {rtvPaths.map((path, pathIndex) => (
                      <div
                        key={pathIndex}
                        className="mb-4 p-3 bg-gray-100 rounded"
                      >
                        <p className="font-medium">Path {pathIndex + 1}:</p>
                        <ul className="list-disc list-inside">
                          {path.map((outcome, index) => (
                            <li key={index} className="text-sm">
                              {outcome.seriesId}: {outcome.winner} in{" "}
                              {outcome.games}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>Error: {error}</p>
        </div>
      )}

      {selectedPlayerId && isLoadingBracket && (
        <div className="my-4 text-center">
          <p>Loading bracket...</p>
        </div>
      )}

      {selectedPlayerId &&
        !isLoadingBracket &&
        playerGuesses &&
        baseGames.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">
              Bracket for{" "}
              {players.find((p) => p.id === selectedPlayerId)?.name ||
                "Selected Player"}
            </h2>
            <BracketDisplay
              games={baseGames}
              guesses={playerGuesses}
              onGuessChange={handleGuessChange}
              readOnly={true}
              layoutMode="conferences"
            />
          </div>
        )}

      {selectedPlayerId && !isLoadingBracket && !playerGuesses && !error && (
        <div className="my-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p>No bracket data found or loaded for this player.</p>
        </div>
      )}
    </div>
  );
};

export default ViewBracketPage;
