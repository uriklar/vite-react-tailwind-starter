import React from "react";

// Shared interfaces (consider moving to a types file)
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

interface Guess {
  winner: Team | null;
  inGames: number | null;
}

interface Guesses {
  [gameId: string]: Guess;
}

interface BracketDisplayProps {
  games: Game[];
  guesses: Guesses; // Receive current guesses
  onGuessChange: (
    gameId: string,
    winner: Team | null,
    inGames: number | null
  ) => void; // Callback for changes
  readOnly?: boolean; // Optional flag to disable controls
  layoutMode?: "horizontal" | "conferences"; // Add layout mode prop
}

// --- Helper Function to Render a Single Game --- (Extracted for reuse)
const GameCard: React.FC<{
  game: Game;
  guess: Guess;
  onWinnerChange: (winner: Team | null) => void;
  onGamesChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  readOnly: boolean;
  isTeamSelectable: (team: Team) => boolean;
}> = ({
  game,
  guess,
  onWinnerChange,
  onGamesChange,
  readOnly,
  isTeamSelectable,
}) => {
  const canSelectTeam1 = isTeamSelectable(game.team1);
  const canSelectTeam2 = isTeamSelectable(game.team2);
  const canSelectGame = canSelectTeam1 && canSelectTeam2 && !readOnly;

  return (
    <div
      key={game.gameId}
      className={`border rounded p-3 shadow-sm w-64 mb-4 ${
        // Fixed width, margin bottom
        guess.winner ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
      }`}
    >
      <p className="text-xs text-gray-500 mb-2">
        {game.conference} - Matchup {game.matchup}
      </p>
      <div className="space-y-2">
        {/* Team 1 Selection */}
        <label
          className={`flex items-center space-x-2 text-sm ${
            canSelectGame ? "cursor-pointer" : "cursor-not-allowed opacity-60"
          } ${guess.winner?.name === game.team1.name ? "font-bold" : ""}`}
        >
          <input
            type="radio"
            name={`winner-${game.gameId}`}
            value={game.team1.name}
            checked={guess.winner?.name === game.team1.name}
            onChange={() => canSelectGame && onWinnerChange(game.team1)}
            disabled={!canSelectGame}
            className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out disabled:opacity-50"
          />
          <span>
            ({game.team1.seed ?? "-"}) {game.team1.name}
          </span>
          {game.team1.logo && (
            <img
              src={game.team1.logo}
              alt={`${game.team1.name} logo`}
              className="w-5 h-5 object-contain ml-auto"
            />
          )}
        </label>
        {/* Team 2 Selection */}
        <label
          className={`flex items-center space-x-2 text-sm ${
            canSelectGame ? "cursor-pointer" : "cursor-not-allowed opacity-60"
          } ${guess.winner?.name === game.team2.name ? "font-bold" : ""}`}
        >
          <input
            type="radio"
            name={`winner-${game.gameId}`}
            value={game.team2.name}
            checked={guess.winner?.name === game.team2.name}
            onChange={() => canSelectGame && onWinnerChange(game.team2)}
            disabled={!canSelectGame}
            className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out disabled:opacity-50"
          />
          <span>
            ({game.team2.seed ?? "-"}) {game.team2.name}
          </span>
          {game.team2.logo && (
            <img
              src={game.team2.logo}
              alt={`${game.team2.name} logo`}
              className="w-5 h-5 object-contain ml-auto"
            />
          )}
        </label>
      </div>
      {/* Games Selection Dropdown */}
      {canSelectGame && (
        <div className="mt-3">
          <label
            htmlFor={`games-${game.gameId}`}
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            {" "}
            Games:{" "}
          </label>
          <select
            id={`games-${game.gameId}`}
            value={guess.inGames ?? ""}
            onChange={onGamesChange}
            disabled={!guess.winner} // Disable if no winner selected
            className="mt-1 block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-50 disabled:bg-gray-100"
          >
            <option value="" disabled>
              Select
            </option>
            <option value="4">in 4</option>
            <option value="5">in 5</option>
            <option value="6">in 6</option>
            <option value="7">in 7</option>
          </select>
        </div>
      )}
    </div>
  );
};
// --- End Helper Function ---

const BracketDisplay: React.FC<BracketDisplayProps> = ({
  games,
  guesses,
  onGuessChange,
  readOnly = false,
  layoutMode = "horizontal", // Default to horizontal
}) => {
  const handleWinnerChange = (game: Game, winner: Team | null) => {
    const currentGuess = guesses[game.gameId] || {
      winner: null,
      inGames: null,
    };
    // If deselecting, clear games too. Otherwise, keep existing game selection or null.
    const gamesSelection = winner ? currentGuess.inGames : null;
    onGuessChange(game.gameId, winner, gamesSelection);
  };

  const handleGamesChange = (
    game: Game,
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const numGames = parseInt(event.target.value, 10);
    const currentGuess = guesses[game.gameId] || {
      winner: null,
      inGames: null,
    };
    // Only update games if a winner is already selected
    if (currentGuess.winner) {
      onGuessChange(
        game.gameId,
        currentGuess.winner,
        isNaN(numGames) ? null : numGames
      );
    }
  };

  const isTeamSelectable = (team: Team): boolean => {
    // Check if the team name indicates it's a placeholder for a future round winner
    return (
      !team.name.toLowerCase().startsWith("winner ") && team.name !== "TBD"
    );
  };

  // --- Horizontal Layout --- (Original Logic)
  if (layoutMode === "horizontal") {
    const rounds = Array.from(new Set(games.map((game) => game.round))).sort(
      (a, b) => a - b
    );

    const getGamesByRound = (round: number): Game[] => {
      return games
        .filter((game) => game.round === round)
        .sort((a, b) => a.matchup - b.matchup);
    };

    return (
      <div className="container mx-auto p-4">
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {rounds.map((round) => (
            <div key={`round-${round}`} className="flex-shrink-0 w-72">
              {" "}
              {/* Increased width */}
              <h2 className="text-xl font-semibold mb-3 text-center">
                {round === 4
                  ? "NBA Finals"
                  : round === 3
                  ? "Conference Finals"
                  : round === 2
                  ? "Conf. Semifinals"
                  : "Round 1"}
              </h2>
              <div className="space-y-4">
                {getGamesByRound(round).map((game) => (
                  <GameCard
                    key={game.gameId}
                    game={game}
                    guess={
                      guesses[game.gameId] || { winner: null, inGames: null }
                    }
                    onWinnerChange={(winner) =>
                      handleWinnerChange(game, winner)
                    }
                    onGamesChange={(e) => handleGamesChange(game, e)}
                    readOnly={readOnly}
                    isTeamSelectable={isTeamSelectable}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Conference Layout --- (Updated Logic)
  if (layoutMode === "conferences") {
    // Helper to check if prerequisite games for a round/conference are complete
    const canDisplayRound = (round: number, conference?: string): boolean => {
      if (round === 1) return true; // Round 1 always visible

      let prerequisiteGames: Game[] = [];
      if (round === 2 && conference) {
        // Need all Round 1 games of the same conference
        prerequisiteGames = games.filter(
          (g) => g.round === 1 && g.conference === conference
        );
      } else if (round === 3 && conference) {
        // Need all Round 2 games of the same conference
        prerequisiteGames = games.filter(
          (g) => g.round === 2 && g.conference === conference
        );
      } else if (round === 4) {
        // Need both Round 3 games (conference finals)
        prerequisiteGames = games.filter((g) => g.round === 3);
      }

      if (prerequisiteGames.length === 0) return false; // Should not happen with valid data

      // Check if all prerequisite games have a winner selected in guesses
      return prerequisiteGames.every(
        (game) =>
          guesses[game.gameId]?.winner !== null &&
          guesses[game.gameId]?.winner !== undefined
      );
    };

    const getGames = (conference: string, round: number): Game[] => {
      return games
        .filter((g) => g.conference === conference && g.round === round)
        .sort((a, b) => a.matchup - b.matchup);
    };

    const renderRound = (conference: string, round: number, title: string) => (
      <div className="flex flex-col items-center mx-2 flex-shrink-0">
        <h2 className="text-lg font-semibold mb-3 text-center h-10 flex items-center">
          {title}
        </h2>
        {getGames(conference, round).map((game) => (
          <GameCard
            key={game.gameId}
            game={game}
            guess={guesses[game.gameId] || { winner: null, inGames: null }}
            onWinnerChange={(winner) => handleWinnerChange(game, winner)}
            onGamesChange={(e) => handleGamesChange(game, e)}
            readOnly={readOnly}
            isTeamSelectable={isTeamSelectable}
          />
        ))}
      </div>
    );

    return (
      <div className="container mx-auto p-4">
        {/* Use min-w-[value] on the flex container to ensure scrolling works */}
        <div className="flex flex-nowrap justify-start space-x-4 overflow-x-auto pb-4 min-w-max">
          {/* Round 1 */}
          {canDisplayRound(1, "East") && renderRound("East", 1, "East R1")}
          {canDisplayRound(1, "West") && renderRound("West", 1, "West R1")}

          {/* Round 2 - Conditionally Rendered */}
          {canDisplayRound(2, "East") && renderRound("East", 2, "East R2")}
          {canDisplayRound(2, "West") && renderRound("West", 2, "West R2")}

          {/* Round 3 - Conditionally Rendered */}
          {canDisplayRound(3, "East") && renderRound("East", 3, "East Finals")}
          {canDisplayRound(3, "West") && renderRound("West", 3, "West Finals")}

          {/* Finals - Conditionally Rendered */}
          {canDisplayRound(4) && renderRound("Finals", 4, "NBA Finals")}
        </div>
      </div>
    );
  }

  return <div>Invalid Layout Mode</div>; // Fallback
};

export default BracketDisplay;
