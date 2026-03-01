import React, { useState, useEffect } from "react";
import BracketDisplay from "../components/BracketDisplay";
import { Game, Guesses, Team } from "../types";
import { getSubmissions, Submission } from "../utils/db";
import baseGameData from "../data/playoffBracketTemplate.json";

interface Player {
  id: string;
  name: string;
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

const ViewBracketPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [baseGames] = useState<Game[]>(baseGameData.games || []);
  const [playerGuesses, setPlayerGuesses] = useState<Guesses | null>(null);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all submissions on mount
  useEffect(() => {
    setIsLoadingPlayers(true);
    setError(null);

    getSubmissions()
      .then((subs) => {
        setSubmissions(subs);
        setPlayers(subs.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch((err) => {
        console.error("Error fetching submissions:", err);
        setError(err.message || "Failed to load player list.");
        setPlayers([]);
      })
      .finally(() => {
        setIsLoadingPlayers(false);
      });
  }, []);

  // When player is selected, convert their bracket to Guesses
  useEffect(() => {
    if (!selectedPlayerId || baseGames.length === 0) {
      setPlayerGuesses(null);
      return;
    }

    setError(null);

    const submission = submissions.find((s) => s.id === selectedPlayerId);
    if (!submission) {
      setError("Player not found.");
      setPlayerGuesses(null);
      return;
    }

    const rawBracket = submission.bracket as {
      [gameId: string]: { winner: string | null; inGames: number | null };
    };

    if (!rawBracket || typeof rawBracket !== "object") {
      setError("Bracket data not found or is in an invalid format for this player.");
      setPlayerGuesses(null);
      return;
    }

    const convertedGuesses: Guesses = {};
    for (const gameId in rawBracket) {
      if (Object.prototype.hasOwnProperty.call(rawBracket, gameId)) {
        const rawGuess = rawBracket[gameId];
        const winnerTeam = findTeamByName(rawGuess.winner, baseGames);
        convertedGuesses[gameId] = {
          winner: winnerTeam,
          inGames: rawGuess.inGames,
        };
      }
    }

    setPlayerGuesses(convertedGuesses);
  }, [selectedPlayerId, submissions, baseGames]);

  const handlePlayerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlayerId(event.target.value);
  };

  const handleGuessChange = () => {
    // Do nothing in read-only mode
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

      {error && (
        <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>Error: {error}</p>
        </div>
      )}

      {selectedPlayerId && playerGuesses && baseGames.length > 0 && (
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

      {selectedPlayerId && !playerGuesses && !error && (
        <div className="my-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p>No bracket data found or loaded for this player.</p>
        </div>
      )}
    </div>
  );
};

export default ViewBracketPage;
