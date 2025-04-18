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
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <header className="bg-white border-b border-secondary/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl md:text-5xl font-bold text-primary text-center font-montserrat">
            March Madness <span className="text-accent">Bracket Challenge</span>
          </h1>
          <p className="mt-3 text-lg text-primary/70 text-center font-inter max-w-2xl mx-auto">
            Fill out your predictions for the tournament and compete with others
            to see who can make the most accurate picks.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Information Card */}
            <section className="bg-white rounded-xl shadow-custom p-6 border border-secondary/30">
              <h2 className="text-xl font-semibold text-primary mb-4 font-montserrat">
                Your Information
              </h2>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-primary/80 font-inter mb-1.5 block">
                    Full Name
                  </span>
                  <input
                    type="text"
                    value={userName}
                    onChange={handleNameChange}
                    placeholder="Enter your name to submit"
                    required
                    disabled={isSubmitting || submitStatus === "success"}
                    className="w-full px-4 py-2.5 rounded-lg border border-secondary/50 
                             focus:ring-2 focus:ring-accent/30 focus:border-accent
                             disabled:bg-background/50 disabled:cursor-not-allowed
                             placeholder:text-primary/40 font-inter text-primary
                             transition duration-200"
                  />
                </label>
              </div>
            </section>

            {/* Bracket Section */}
            <section className="bg-white rounded-xl shadow-custom p-6 border border-secondary/30">
              <h2 className="text-xl font-semibold text-primary mb-4 font-montserrat">
                Tournament Bracket
              </h2>
              <div className="overflow-x-auto">
                <BracketDisplay
                  games={displayedGames}
                  guesses={guesses}
                  onGuessChange={handleGuessChange}
                  readOnly={isSubmitting || submitStatus === "success"}
                  layoutMode="conferences"
                />
              </div>
            </section>

            {/* Action Section */}
            <section className="flex flex-col items-center space-y-4 pt-4">
              {(submitStatus === "idle" || submitStatus === "error") && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-8 py-3 
                           text-base font-medium rounded-lg text-white 
                           bg-accent hover:bg-accent/90 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 
                           focus:ring-accent disabled:opacity-50 
                           disabled:cursor-not-allowed transition duration-200 
                           font-inter shadow-custom min-w-[200px]"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
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

              {/* Success Message */}
              {submitStatus === "success" && (
                <div className="w-full bg-highlight/10 border border-highlight rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-accent"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary font-montserrat">
                        Bracket Submitted Successfully!
                      </h3>
                      <p className="mt-2 text-primary/80 font-inter">
                        Your predictions have been recorded. Good luck in the
                        tournament!
                      </p>
                      <p className="mt-4 text-sm text-primary/60 font-mono bg-white/50 p-2 rounded">
                        Submission ID: {binId}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submitStatus === "error" && (
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-red-600"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 font-montserrat">
                        Submission Failed
                      </h3>
                      <p className="mt-2 text-red-700 font-inter">
                        We couldn't submit your bracket. Please check your
                        connection and try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-primary/60 font-inter">
            © {new Date().getFullYear()} HoneyBook NBA Playoff Bracket
            Challenge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BracketSubmissionPage;
