import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import BracketSubmissionPage from "./components/BracketSubmissionPage";
import ScoreboardPage from "./components/ScoreboardPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f4edfd]">
        <nav className="bg-[#fce07f] shadow-md">
          <div className="container mx-auto flex justify-between items-center py-3 px-4">
            <Link to="/" className="flex items-center">
              <img
                src="/hb-ball.png"
                alt="NBA Bracket Challenge Logo"
                className="h-12 w-12 object-contain"
              />
            </Link>
            <div className="space-x-4">
              <Link
                to="/submit"
                className="text-[#0c0c0d] hover:text-[#6837f8] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Submit Bracket
              </Link>
              <Link
                to="/"
                className="text-[#0c0c0d] hover:text-[#6837f8] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Scoreboard
              </Link>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<ScoreboardPage />} />
            <Route path="/submit" element={<BracketSubmissionPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Placeholder no longer needed
// function ScoreboardPlaceholder() { ... }

export default App;
