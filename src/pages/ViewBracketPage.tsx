import React, { useState, useEffect } from "react";
import BracketDisplay from "../components/BracketDisplay";
import { Game, Guesses, Team } from "../types";
// Import JSONBin utility functions
import { getMasterIndex, getBin } from "../utils/jsonbin";
// Import base game data
import baseGameData from "../data/playoffBracketTemplate.json";

// Player type based on Master Index structure
interface Player {
  id: string; // Corresponds to binId
  name: string;
}

// Interface for the raw data fetched from the player bin
interface PlayerBinRawData {
  userId?: string; // Optional userId if stored
  guess: {
    // Expects 'guess' key
    [gameId: string]: {
      winner: string | null; // Winner is a string name
      inGames: number | null;
    };
  };
}

// Type guard for the raw fetched data
function isValidRawData(data: unknown): data is PlayerBinRawData {
  // Check if data is a non-null object and has a non-null 'guess' property which is also an object
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as PlayerBinRawData).guess === "object" &&
    (data as PlayerBinRawData).guess !== null
  );
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
  return null; // Return null if not found
};

const ViewBracketPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [baseGames] = useState<Game[]>(baseGameData.games || []);
  const [playerGuesses, setPlayerGuesses] = useState<Guesses | null>(null);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState<boolean>(true);
  const [isLoadingBracket, setIsLoadingBracket] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Players (Submissions) from Master Index on Mount
  useEffect(() => {
    setIsLoadingPlayers(true);
    setError(null);

    getMasterIndex()
      .then((masterIndex) => {
        if (masterIndex && Array.isArray(masterIndex.submissions)) {
          const fetchedPlayers = masterIndex.submissions.map((sub) => ({
            id: sub.binId,
            name: sub.name,
          }));
          setPlayers(fetchedPlayers);
        } else {
          console.error("Invalid master index data received:", masterIndex);
          throw new Error("Failed to load player list or invalid format.");
        }
      })
      .catch((err) => {
        console.error("Error fetching master index:", err);
        setError(err.message || "Failed to load player list.");
        setPlayers([]);
      })
      .finally(() => {
        setIsLoadingPlayers(false);
      });
  }, []);

  // Fetch Player Guesses and *convert* them
  useEffect(() => {
    if (!selectedPlayerId || baseGames.length === 0) {
      // Ensure baseGames are loaded
      setPlayerGuesses(null);
      return;
    }

    setIsLoadingBracket(true);
    setError(null);
    setPlayerGuesses(null);

    getBin(selectedPlayerId)
      .then((binResponse) => {
        const rawData = binResponse?.record ?? binResponse;
        console.log("Fetched raw bin data:", rawData);

        if (isValidRawData(rawData)) {
          const convertedGuesses: Guesses = {};
          // Iterate through the raw guesses (winner as string)
          for (const gameId in rawData.guess) {
            if (Object.prototype.hasOwnProperty.call(rawData.guess, gameId)) {
              const rawGuess = rawData.guess[gameId];
              // Find the full Team object using the winner name string
              const winnerTeam = findTeamByName(rawGuess.winner, baseGames);

              // Store the converted guess (winner as Team object)
              convertedGuesses[gameId] = {
                winner: winnerTeam, // Store the found Team object or null
                inGames: rawGuess.inGames,
              };
            }
          }
          console.log("Converted guesses state:", convertedGuesses);
          setPlayerGuesses(convertedGuesses); // Set state with converted data
        } else {
          console.error(
            "Invalid or missing 'guess' data structure in raw bin data:",
            selectedPlayerId,
            rawData
          );
          throw new Error(
            "Bracket data not found or is in an invalid format for this player."
          );
        }
      })
      .catch((err) => {
        console.error("Error fetching or processing player bracket bin:", err);
        const errorMsg = err.message || "Failed to load bracket.";
        // Simplified error handling for now
        setError(errorMsg);
        setPlayerGuesses(null);
      })
      .finally(() => {
        setIsLoadingBracket(false);
      });
  }, [selectedPlayerId, baseGames]); // Add baseGames dependency

  const handlePlayerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlayerId(event.target.value);
  };

  // Dummy function for read-only display
  const handleGuessChange = () =>
    // gameId: string, winner: Team | null, inGames: number | null // Original params
    {
      // Do nothing in read-only mode
      // console.log(`Attempted change (ignored): ${gameId}, ${winner?.name}, ${inGames}`);
    };

  // Simple check if base games loaded correctly
  if (baseGames.length === 0) {
    return (
      <div className="container mx-auto p-4">
        Error: Base game data could not be loaded. Check
        `src/data/playoffBracketTemplate.json`.
      </div>
    );
  }

  // Log the state right before rendering
  console.log(
    "Rendering ViewBracketPage - playerGuesses state (should have Team objects):",
    playerGuesses
  );

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
          {
            !isLoadingPlayers && players.length > 0 ? (
              players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))
            ) : !isLoadingPlayers ? (
              <option value="" disabled>
                No players found
              </option>
            ) : null // While loading, the first option covers it
          }
        </select>
      </div>

      {error && (
        <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>Error: {error}</p>
        </div>
      )}

      {selectedPlayerId && isLoadingBracket && (
        <div className="my-4 text-center">
          <p>Loading bracket...</p>
          {/* Consider adding a spinner component here */}
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
              readOnly={true} // Set to read-only
              layoutMode="conferences" // Or "horizontal", adjust as needed
            />
          </div>
        )}

      {/* Condition to show 'no bracket found' only when not loading, a player is selected, but guesses are null AND there's no general fetch error */}
      {selectedPlayerId && !isLoadingBracket && !playerGuesses && !error && (
        <div className="my-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p>No bracket data found or loaded for this player.</p>
        </div>
      )}
    </div>
  );
};

export default ViewBracketPage;
