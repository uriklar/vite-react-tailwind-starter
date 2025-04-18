import React, { useMemo } from "react";
// Import the corrected types from the central file
import { Game, Guesses, Guess, Team } from "../types";

interface BracketDisplayProps {
  games: Game[];
  guesses: Guesses;
  onGuessChange: (
    gameId: string,
    winner: Team | null,
    inGames: number | null
  ) => void;
  readOnly?: boolean;
  layoutMode?: "horizontal" | "conferences";
}

const GameCard: React.FC<{
  game: Game;
  guess: Guess | undefined;
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
  const isGameSelectable = canSelectTeam1 && canSelectTeam2 && !readOnly;

  const TeamDisplay = ({
    team,
    isSelected,
  }: {
    team: Team;
    isSelected: boolean;
  }) => (
    <div
      className={`
      flex items-center p-2 rounded-lg transition-all duration-200
      ${
        isSelected
          ? "bg-accent/5 border border-accent"
          : "hover:bg-background/50 border border-transparent"
      }
      ${isGameSelectable ? "cursor-pointer" : "cursor-not-allowed"}
    `}
    >
      <div className="flex-shrink-0 w-12 h-12 mr-3">
        {team.logo ? (
          <img
            src={team.logo}
            alt={`${team.name} logo`}
            className="w-full h-full object-contain rounded-full p-0.5"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-xs text-primary/40">No logo</span>
          </div>
        )}
      </div>
      <div className="flex-grow">
        <div className="flex items-center">
          <span
            className={`
            text-sm font-medium
            ${isSelected ? "text-accent" : "text-primary"}
          `}
          >
            {team.name}
          </span>
        </div>
        <div className="flex items-center mt-0.5">
          <span className="text-xs text-primary/60">
            Seed: {team.seed ?? "-"}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 ml-2">
        <input
          type="radio"
          name={`winner-${game.gameId}`}
          value={team.name}
          checked={isSelected}
          onChange={() => isGameSelectable && onWinnerChange(team)}
          disabled={!isGameSelectable}
          className="h-4 w-4 text-accent border-secondary/30 focus:ring-accent/30 transition-all duration-200"
        />
      </div>
    </div>
  );

  const hasGuessedWinner = guess && guess.winner;
  const showGamesInfo = hasGuessedWinner;

  // Determine the text to display for games predicted
  const gamesText = guess?.inGames ? `in ${guess.inGames} games` : "Not set";

  return (
    <div
      key={game.gameId}
      className={`
        border rounded-xl p-4 shadow-sm w-72 mb-4 transition-all duration-200
        ${
          hasGuessedWinner
            ? "border-accent/30 bg-white"
            : "border-secondary/30 bg-white"
        }
        hover:shadow-md
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-primary/60 bg-secondary/10 px-2 py-1 rounded-full">
          {game.conference} - Match {game.matchup}
        </span>
        {hasGuessedWinner && (
          <span className="text-xs font-medium text-accent bg-accent/5 px-2 py-1 rounded-full">
            Winner Selected
          </span>
        )}
      </div>

      <div className="space-y-3">
        <TeamDisplay
          team={game.team1}
          isSelected={guess?.winner?.name === game.team1.name}
        />
        <TeamDisplay
          team={game.team2}
          isSelected={guess?.winner?.name === game.team2.name}
        />
      </div>

      {showGamesInfo && (
        <div className="mt-4 p-3 bg-background/30 rounded-lg">
          <label className="block text-sm font-medium text-primary/80 mb-2">
            Games Predicted:
          </label>
          {readOnly ? (
            <p className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-secondary/30 rounded-lg">
              {gamesText}
            </p>
          ) : (
            <select
              id={`games-${game.gameId}`}
              value={guess?.inGames ?? ""}
              onChange={onGamesChange}
              className="w-full px-3 py-2 text-sm border border-secondary/30 rounded-lg
                       bg-white focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              <option value="" disabled>
                Select number of games
              </option>
              <option value="4">in 4 games</option>
              <option value="5">in 5 games</option>
              <option value="6">in 6 games</option>
              <option value="7">in 7 games</option>
            </select>
          )}
        </div>
      )}
    </div>
  );
};

// Placeholder Team for games where winner is not yet decided
const TBD_TEAM: Team = { name: "TBD", seed: null, logo: "" };

const BracketDisplay: React.FC<BracketDisplayProps> = ({
  games: baseGames,
  guesses,
  onGuessChange,
  readOnly = false,
  layoutMode = "horizontal",
}) => {
  // --- Dynamic Game Processing ---
  const processedGames = useMemo(() => {
    console.log("Recalculating processedGames...");
    if (!baseGames) return [];

    const processed = new Map<string, Game>();

    // Helper to get the winner Team object from a previous game's guess
    const getWinnerOf = (gameId: string | null): Team => {
      if (!gameId) return TBD_TEAM;
      const guess = guesses[gameId];
      return guess?.winner ?? TBD_TEAM;
    };

    const sortedBaseGames = [...baseGames].sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return a.matchup - b.matchup;
    });

    for (const baseGame of sortedBaseGames) {
      const processedGame = { ...baseGame };

      if (processedGame.round > 1) {
        const feederGames = sortedBaseGames.filter(
          (g) => g.nextGameId === processedGame.gameId
        );

        const feederId1 = feederGames[0]?.gameId ?? null;
        const feederId2 = feederGames[1]?.gameId ?? null;

        if (feederGames.length === 2) {
          processedGame.team1 = getWinnerOf(feederId1);
          processedGame.team2 = getWinnerOf(feederId2);
        } else if (processedGame.round === 4) {
          const ecfGame = sortedBaseGames.find(
            (g) => g.round === 3 && g.conference === "East"
          );
          const wcfGame = sortedBaseGames.find(
            (g) => g.round === 3 && g.conference === "West"
          );
          processedGame.team1 = getWinnerOf(ecfGame?.gameId ?? null);
          processedGame.team2 = getWinnerOf(wcfGame?.gameId ?? null);
        } else {
          processedGame.team1 = processedGame.team1.name.startsWith("Winner")
            ? TBD_TEAM
            : processedGame.team1;
          processedGame.team2 = processedGame.team2.name.startsWith("Winner")
            ? TBD_TEAM
            : processedGame.team2;
          console.warn(
            `Incorrect number of feeder games (${feederGames.length}) found for ${processedGame.gameId}`
          );
        }
      }
      processed.set(processedGame.gameId, processedGame);
    }
    return Array.from(processed.values());
  }, [baseGames, guesses]);
  // --- End Dynamic Game Processing ---

  // Callbacks now work with Team objects, matching the state/types
  const handleWinnerChange = (game: Game, winnerTeam: Team | null) => {
    if (readOnly) return;
    const currentGuess = guesses[game.gameId];
    const gamesSelection = winnerTeam ? currentGuess?.inGames : null;
    onGuessChange(game.gameId, winnerTeam, gamesSelection);
  };

  const handleGamesChange = (
    gameId: string,
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (readOnly) return;
    const numGames = parseInt(event.target.value, 10);
    const winnerTeam = guesses[gameId]?.winner; // Winner is Team | null

    if (winnerTeam) {
      onGuessChange(gameId, winnerTeam, isNaN(numGames) ? null : numGames);
    }
  };

  const isTeamSelectable = (team: Team): boolean => {
    // Allow selecting TBD team to clear a future guess? Maybe not.
    return (
      team.name !== "TBD" && !team.name.toLowerCase().startsWith("winner ")
    );
  };

  const canDisplayRound = (round: number, conference?: string): boolean => {
    if (round === 1) return true;
    let prerequisiteGames: Game[] = [];

    if (conference === "Finals") {
      // Requires both conference finals to be decided
      const eastFinal = baseGames.find(
        (g) => g.round === 3 && g.conference === "East"
      );
      const westFinal = baseGames.find(
        (g) => g.round === 3 && g.conference === "West"
      );
      // Ensure both finals exist and have winners before returning true
      return !!(
        eastFinal &&
        guesses[eastFinal.gameId]?.winner &&
        westFinal &&
        guesses[westFinal.gameId]?.winner
      );
    } else if (conference) {
      // Requires all games from the previous round in that conference to be decided
      prerequisiteGames = baseGames.filter(
        (g) => g.round === round - 1 && g.conference === conference
      );
    } else {
      // Fallback for unexpected cases (shouldn't happen with specific conf/Finals checks)
      console.warn(
        "Checking canDisplayRound without specific conference for round > 1"
      );
      return false;
    }

    if (prerequisiteGames.length === 0) return false; // Ensure prerequisite games exist
    return prerequisiteGames.every(
      (game) => guesses[game.gameId]?.winner != null
    );
  };

  // --- Rendering Logic ---
  // Use processedGames for rendering
  if (layoutMode === "horizontal") {
    const rounds = Array.from(
      new Set(processedGames.map((game) => game.round))
    ).sort((a, b) => a - b);
    const getGamesByRound = (round: number): Game[] => {
      return processedGames
        .filter((game) => game.round === round)
        .sort((a, b) => a.matchup - b.matchup);
    };
    return (
      <div className="container mx-auto p-4">
        <div className="flex space-x-4 overflow-x-auto pb-4 scroll-smooth">
          {rounds.map((round) => (
            <div key={`round-${round}`} className="flex-shrink-0 w-72">
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
                {getGamesByRound(round).map((game) => {
                  const guessForCard = guesses[game.gameId];
                  return (
                    <GameCard
                      key={game.gameId}
                      game={game}
                      guess={guessForCard}
                      onWinnerChange={(winner) =>
                        handleWinnerChange(game, winner)
                      }
                      onGamesChange={(e) => handleGamesChange(game.gameId, e)}
                      readOnly={readOnly}
                      isTeamSelectable={(team) => isTeamSelectable(team)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Classic Horizontal Bracket Layout (Replaces old 'conferences' mode) ---
  if (layoutMode === "conferences") {
    const getGames = (conference: string, round: number): Game[] => {
      return processedGames
        .filter((g) => g.conference === conference && g.round === round)
        .sort((a, b) => a.matchup - b.matchup);
    };

    const renderRoundColumn = (
      conference: string,
      round: number,
      title: string
    ) => {
      if (!canDisplayRound(round, conference)) {
        return null; // Don't render the column if prerequisites aren't met
      }
      return (
        <div className="flex flex-col items-center mx-4 flex-shrink-0 w-72">
          <h2 className="text-lg font-semibold mb-3 text-center h-10 flex items-center">
            {title}
          </h2>
          <div className="space-y-4">
            {getGames(conference, round).map((game) => {
              const guessForCard = guesses[game.gameId];
              return (
                <GameCard
                  key={game.gameId}
                  game={game}
                  guess={guessForCard}
                  onWinnerChange={(winner) => handleWinnerChange(game, winner)}
                  onGamesChange={(e) => handleGamesChange(game.gameId, e)}
                  readOnly={readOnly}
                  isTeamSelectable={isTeamSelectable}
                />
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="container mx-auto p-4 overflow-x-auto">
        <div className="flex justify-center items-start min-w-max py-4">
          <div className="flex items-start space-x-8">
            {renderRoundColumn("West", 1, "West R1")}
            {renderRoundColumn("West", 2, "West R2")}
            {renderRoundColumn("West", 3, "West Finals")}
          </div>

          <div className="flex-shrink-0 w-8 md:w-16"></div>

          {renderRoundColumn("Finals", 4, "NBA Finals")}

          <div className="flex-shrink-0 w-8 md:w-16"></div>

          <div className="flex items-start space-x-8">
            {renderRoundColumn("East", 3, "East Finals")}
            {renderRoundColumn("East", 2, "East R2")}
            {renderRoundColumn("East", 1, "East R1")}
          </div>
        </div>
      </div>
    );
  }

  return <div>Invalid Layout Mode</div>;
};

export default BracketDisplay;
