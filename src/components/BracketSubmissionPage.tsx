import React from "react";
import BracketDisplay from "./BracketDisplay";
import { useBracketSubmission } from "../hooks/useBracketSubmission";

// Import fonts in your main CSS file or index.html:
// font-family: 'Inter', sans-serif - for body text
// font-family: 'Montserrat', sans-serif - for headings

const BracketSubmissionPage: React.FC = () => {
  const {
    userName,
    displayedGames,
    guesses,
    isSubmitting,
    submitStatus,
    binId,
    handleNameChange,
    handleGuessChange,
    handleSubmit,
  } = useBracketSubmission();

  return (
    <div className="min-h-screen bg-[#f4edfd]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-[#0c0c0d] mb-2 font-montserrat text-center">
            March Madness Bracket
          </h1>
          <p className="text-lg text-[#0c0c0d]/80 mb-8 text-center font-inter">
            Fill out your predictions for the tournament
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-[#d5c8f9]">
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-[#0c0c0d] mb-2 font-inter"
              >
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={handleNameChange}
                placeholder="Enter your name to submit"
                required
                disabled={isSubmitting || submitStatus === "success"}
                className="w-full px-4 py-2 border border-[#d5c8f9] rounded-lg focus:ring-2 focus:ring-[#6837f8] focus:border-transparent transition duration-200 disabled:bg-[#f4edfd] disabled:cursor-not-allowed font-inter"
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-[#d5c8f9]">
              <BracketDisplay
                games={displayedGames}
                guesses={guesses}
                onGuessChange={handleGuessChange}
                readOnly={isSubmitting || submitStatus === "success"}
                layoutMode="conferences"
              />
            </div>

            <div className="flex flex-col items-center space-y-4">
              {(submitStatus === "idle" || submitStatus === "error") && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#6837f8] hover:bg-[#6837f8]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6837f8] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-inter shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : submitStatus === "error" ? (
                    "Try Again"
                  ) : (
                    "Submit Bracket"
                  )}
                </button>
              )}

              {submitStatus === "success" && (
                <div className="w-full bg-[#fce07f]/20 border border-[#fce07f] rounded-lg p-6 text-[#0c0c0d]">
                  <div className="flex items-center mb-4">
                    <svg
                      className="h-6 w-6 text-[#6837f8] mr-2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <h3 className="text-lg font-semibold font-montserrat">
                      Submission Successful!
                    </h3>
                  </div>
                  <p className="text-[#0c0c0d]/80 mb-2 font-inter">
                    Your bracket has been submitted successfully.
                  </p>
                  <p className="text-sm text-[#0c0c0d]/60 font-inter">
                    Submission ID: {binId}
                  </p>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
                  <div className="flex items-center mb-4">
                    <svg
                      className="h-6 w-6 text-red-600 mr-2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h3 className="text-lg font-semibold font-montserrat">
                      Submission Failed
                    </h3>
                  </div>
                  <p className="text-red-700 mb-2 font-inter">
                    We couldn't submit your bracket. Please check your
                    connection and try again.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BracketSubmissionPage;
