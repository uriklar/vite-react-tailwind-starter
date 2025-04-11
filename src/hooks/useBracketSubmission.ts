import { useState } from "react";
import bracketData from "../data/playoffBracketTemplate.json";
import { createBin, getMasterIndex, updateMasterIndex } from "../utils/jsonbin";

// Types
export interface Team {
  name: string;
  seed: number | null;
  logo: string;
}

export interface Game {
  gameId: string;
  round: number;
  conference: string;
  matchup: number;
  nextGameId: string | null;
  team1: Team;
  team2: Team;
}

export interface Guess {
  winner: Team | null;
  inGames: number | null;
}

export interface Guesses {
  [gameId: string]: Guess;
}

interface SubmissionData {
  userId: string;
  guess: {
    [gameId: string]: {
      winner: string;
      inGames: number;
    };
  };
}

export interface UseBracketSubmissionReturn {
  userName: string;
  displayedGames: Game[];
  guesses: Guesses;
  isSubmitting: boolean;
  submitStatus: "idle" | "success" | "error" | "error-index";
  binId: string | null;
  handleNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleGuessChange: (
    gameId: string,
    selectedWinner: Team | null,
    selectedGames: number | null
  ) => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
}

export const useBracketSubmission = (): UseBracketSubmissionReturn => {
  const [userName, setUserName] = useState<string>("");
  const [displayedGames, setDisplayedGames] = useState<Game[]>(() =>
    JSON.parse(JSON.stringify(bracketData.games))
  );
  const [guesses, setGuesses] = useState<Guesses>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error" | "error-index"
  >("idle");
  const [binId, setBinId] = useState<string | null>(null);

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
        inGames: selectedWinner
          ? selectedGames ?? prev[gameId]?.inGames ?? null
          : null,
      };
      if (!selectedWinner) {
        updatedGuess.inGames = null;
      }
      return {
        ...prev,
        [gameId]: updatedGuess,
      };
    });

    // 2. Update displayedGames state for the next round
    if (!currentGame.nextGameId) return;

    const nextGameIndex = displayedGames.findIndex(
      (g) => g.gameId === currentGame.nextGameId
    );
    if (nextGameIndex === -1) return;

    const gamesFeedingNext = displayedGames
      .filter((g) => g.nextGameId === currentGame.nextGameId)
      .sort((a, b) => a.matchup - b.matchup);

    const slotIndex = gamesFeedingNext.findIndex((g) => g.gameId === gameId);
    const otherGame = gamesFeedingNext[1 - slotIndex];
    const otherGameWinner = otherGame
      ? guesses[otherGame.gameId]?.winner
      : null;

    let nextTeam1: Team | null = null;
    let nextTeam2: Team | null = null;

    if (slotIndex === 0) {
      nextTeam1 = selectedWinner;
      nextTeam2 = otherGameWinner;
    } else if (slotIndex === 1) {
      nextTeam1 = otherGameWinner;
      nextTeam2 = selectedWinner;
    }

    const templateNextGame = bracketData.games.find(
      (g) => g.gameId === currentGame.nextGameId
    );
    const defaultTeam1 = templateNextGame
      ? templateNextGame.team1
      : { name: "TBD", seed: null, logo: "" };
    const defaultTeam2 = templateNextGame
      ? templateNextGame.team2
      : { name: "TBD", seed: null, logo: "" };

    setDisplayedGames((prevGames) => {
      const newGames = [...prevGames];
      const nextGameToUpdate = { ...newGames[nextGameIndex] };
      nextGameToUpdate.team1 = nextTeam1 ?? defaultTeam1;
      nextGameToUpdate.team2 = nextTeam2 ?? defaultTeam2;
      newGames[nextGameIndex] = nextGameToUpdate;
      return newGames;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitStatus("idle");
    setBinId(null);

    if (!userName.trim()) {
      alert("Please enter your name.");
      return;
    }

    const totalGames = displayedGames.length;
    const completedGuesses = Object.values(guesses).filter(
      (g) => g.winner && g.inGames !== null
    ).length;

    if (completedGuesses < totalGames) {
      alert(`Please complete all ${totalGames} matchups before submitting.`);
      return;
    }

    const submissionPayload: SubmissionData = {
      userId: userName.trim(),
      guess: {},
    };

    for (const gameId in guesses) {
      const guess = guesses[gameId];
      if (guess.winner && guess.inGames !== null) {
        submissionPayload.guess[gameId] = {
          winner: guess.winner.name,
          inGames: guess.inGames,
        };
      }
    }

    setIsSubmitting(true);
    let createdBinId: string | null = null;

    try {
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

        try {
          const masterIndex = await getMasterIndex();
          if (masterIndex) {
            masterIndex.submissions.push({
              userId: userName.trim(),
              binId: createdBinId,
              name: userName.trim(),
              timestamp: new Date().toISOString(),
            });
            const indexUpdateResult = await updateMasterIndex(masterIndex);
            if (indexUpdateResult) {
              console.log("Master index updated successfully.");
              setSubmitStatus("success");
            } else {
              console.error("Failed to update master index.");
              setSubmitStatus("success");
              alert(
                "Submission saved, but failed to update master index. Please contact admin."
              );
            }
          } else {
            console.error("Could not retrieve master index to update.");
            setSubmitStatus("success");
            alert(
              "Submission saved, but failed to update master index. Please contact admin."
            );
          }
        } catch (indexError) {
          console.error("Error updating master index:", indexError);
          setSubmitStatus("success");
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

  return {
    userName,
    displayedGames,
    guesses,
    isSubmitting,
    submitStatus,
    binId,
    handleNameChange,
    handleGuessChange,
    handleSubmit,
  };
};
