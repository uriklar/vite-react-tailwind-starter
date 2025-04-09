import React, { useState, useEffect } from "react";
import BracketDisplay from "./BracketDisplay";
import bracketData from "../data/playoffBracketTemplate.json";
import {
  createBin,
  getMasterIndex,
  updateMasterIndex,
} from "../utils/jsonbin.js"; // Import the API utility

// Define interfaces (consider moving to a shared types file later)
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

// Define the structure for saving to JSONBin
interface SubmissionData {
  userId: string;
  guess: {
    // Note: Saving only winner NAME, not the full object
    [gameId: string]: {
      winner: string;
      inGames: number;
    };
  };
}

const BracketSubmissionPage: React.FC = () => {
  const [userName, setUserName] = useState<string>("");
  // State for the bracket structure that gets displayed (updates as winners are chosen)
  const [displayedGames, setDisplayedGames] = useState<Game[]>(() =>
    // Deep clone to avoid modifying the original template import
    JSON.parse(JSON.stringify(bracketData.games))
  );
  // State for the user's actual selections
  const [guesses, setGuesses] = useState<Guesses>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error" | "error-index"
  >("idle");
  const [binId, setBinId] = useState<string | null>(null); // To store the created bin ID

  // TODO: Add handler for form submission

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(event.target.value);
  };

  const handleGuessChange = (
    gameId: string,
    selectedWinner: Team | null,
    selectedGames: number | null
  ) => {
    const currentGame = displayedGames.find((g) => g.gameId === gameId);
    if (!currentGame) return;

    // 1. Update guesses state
    setGuesses((prev) => {
      const updatedGuess: Guess = {
        winner: selectedWinner,
        // Only store games if a winner is selected
        inGames: selectedWinner
          ? selectedGames ?? prev[gameId]?.inGames ?? null
          : null,
      };
      // If winner is deselected, clear games too
      if (!selectedWinner) {
        updatedGuess.inGames = null;
      }
      return {
        ...prev,
        [gameId]: updatedGuess,
      };
    });

    // 2. Update displayedGames state for the *next* round
    if (!currentGame.nextGameId) return; // Final game, no propagation needed

    const nextGameIndex = displayedGames.findIndex(
      (g) => g.gameId === currentGame.nextGameId
    );
    if (nextGameIndex === -1) return;

    // Find all games feeding into the next game to determine slots
    const gamesFeedingNext = displayedGames
      .filter((g) => g.nextGameId === currentGame.nextGameId)
      .sort((a, b) => a.matchup - b.matchup); // Sort determines team1/team2 slot

    const slotIndex = gamesFeedingNext.findIndex((g) => g.gameId === gameId); // 0 means this game feeds team1, 1 means team2

    // Get the winner from the *other* game feeding into the next game
    const otherGame = gamesFeedingNext[1 - slotIndex];
    const otherGameWinner = otherGame
      ? guesses[otherGame.gameId]?.winner
      : null;

    // Determine the correct teams for the next game based on current selections
    let nextTeam1: Team | null = null;
    let nextTeam2: Team | null = null;

    if (slotIndex === 0) {
      // Current selection feeds team1
      nextTeam1 = selectedWinner;
      nextTeam2 = otherGameWinner;
    } else if (slotIndex === 1) {
      // Current selection feeds team2
      nextTeam1 = otherGameWinner;
      nextTeam2 = selectedWinner;
    }

    // Find the original template for the next game to get default placeholders
    const templateNextGame = bracketData.games.find(
      (g) => g.gameId === currentGame.nextGameId
    );
    const defaultTeam1 = templateNextGame
      ? templateNextGame.team1
      : { name: "TBD", seed: null, logo: "" };
    const defaultTeam2 = templateNextGame
      ? templateNextGame.team2
      : { name: "TBD", seed: null, logo: "" };

    // Update the displayedGames state
    setDisplayedGames((prevGames) => {
      const newGames = [...prevGames];
      const nextGameToUpdate = { ...newGames[nextGameIndex] }; // Clone the specific game

      // Assign the determined winner or the default placeholder
      nextGameToUpdate.team1 = nextTeam1 ?? defaultTeam1;
      nextGameToUpdate.team2 = nextTeam2 ?? defaultTeam2;

      newGames[nextGameIndex] = nextGameToUpdate;
      return newGames;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    setSubmitStatus("idle");
    setBinId(null);

    if (!userName.trim()) {
      alert("Please enter your name.");
      return;
    }

    // Basic validation: Check if all games have a winner and game count selected
    const totalGames = displayedGames.length;
    const completedGuesses = Object.values(guesses).filter(
      (g) => g.winner && g.inGames !== null
    ).length;

    if (completedGuesses < totalGames) {
      alert(`Please complete all ${totalGames} matchups before submitting.`);
      return;
    }

    // Format data for submission
    const submissionPayload: SubmissionData = {
      userId: userName.trim(),
      guess: {},
    };

    for (const gameId in guesses) {
      const guess = guesses[gameId];
      if (guess.winner && guess.inGames !== null) {
        submissionPayload.guess[gameId] = {
          winner: guess.winner.name, // Store only the name
          inGames: guess.inGames,
        };
      }
    }

    setIsSubmitting(true);
    let createdBinId: string | null = null;

    try {
      // 1. Create user guess bin
      const result = await createBin(
        submissionPayload,
        `bracket_${userName.trim()}`
      );
      if (result && result.metadata && result.metadata.id) {
        createdBinId = result.metadata.id;
        setBinId(createdBinId);
        console.log(
          "User guess bin created successfully! Bin ID:",
          createdBinId
        );

        // 2. Update master index bin
        try {
          const masterIndex = await getMasterIndex();
          if (masterIndex) {
            // Add or update entry (simple add for now, could check for duplicates)
            masterIndex.submissions.push({
              userId: userName.trim(),
              binId: createdBinId,
            });
            const indexUpdateResult = await updateMasterIndex(masterIndex);
            if (indexUpdateResult) {
              console.log("Master index updated successfully.");
              setSubmitStatus("success");
            } else {
              console.error("Failed to update master index.");
              // Still technically a success for user submission, but log the index error
              setSubmitStatus("success"); // Or set a specific warning state
              alert(
                "Submission saved, but failed to update master index. Please contact admin."
              );
            }
          } else {
            console.error("Could not retrieve master index to update.");
            setSubmitStatus("success"); // Submission saved, but index failed
            alert(
              "Submission saved, but failed to update master index. Please contact admin."
            );
          }
        } catch (indexError) {
          console.error("Error updating master index:", indexError);
          setSubmitStatus("success"); // Submission saved, but index failed
          alert(
            "Submission saved, but failed to update master index. Please contact admin."
          );
        }
      } else {
        throw new Error(
          "Failed to create user guess bin or received invalid response."
        );
      }
    } catch (error) {
      console.error("Submission failed:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Submit Your Bracket
      </h1>

      {/* Wrap in a form element */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label
            htmlFor="userName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Name:
          </label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={handleNameChange}
            placeholder="Enter your name"
            required
            disabled={isSubmitting || submitStatus === "success"} // Disable after success
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
          />
        </div>

        {/* Pass displayedGames, guesses, and handler to BracketDisplay */}
        <BracketDisplay
          games={displayedGames}
          guesses={guesses}
          onGuessChange={handleGuessChange}
          readOnly={isSubmitting || submitStatus === "success"} // Make read-only during/after submission
          layoutMode="conferences"
        />

        <div className="mt-8 text-center">
          {(submitStatus === "idle" || submitStatus === "error") && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Submitting..."
                : submitStatus === "error"
                ? "Retry Submission"
                : "Submit Bracket"}
            </button>
          )}

          {submitStatus === "success" && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <p className="font-bold">Success!</p>
              <p>
                Your bracket has been submitted. Your submission ID is: {binId}
              </p>
              {/* Maybe add a link to view scoreboard later */}
            </div>
          )}

          {submitStatus === "error" && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Submission Failed</p>
              <p>
                Could not submit your bracket. Please check your connection or
                API key and try again.
              </p>
              {/* Button is already handled above for retry */}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default BracketSubmissionPage;
