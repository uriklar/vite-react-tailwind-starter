import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import BracketSubmissionPage from "./components/BracketSubmissionPage";
import ScoreboardPage from "./components/ScoreboardPage"; // Import the real component

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-md p-4 mb-6">
          <div className="container mx-auto flex justify-between items-center">
            <Link
              to="/"
              className="text-xl font-bold text-blue-600 hover:text-blue-800"
            >
              NBA Bracket Challenge
            </Link>
            <div>
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Submit Bracket
              </Link>
              <Link
                to="/scoreboard"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Scoreboard
              </Link>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<BracketSubmissionPage />} />
            {/* Use the real ScoreboardPage component */}
            <Route path="/scoreboard" element={<ScoreboardPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Placeholder no longer needed
// function ScoreboardPlaceholder() { ... }

export default App;
