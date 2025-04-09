---

## Project Initialization

- [x] Connect to JSONBin.io API
  - [x] Create `.env` file for API key (`VITE_JSONBIN_API_KEY`)
  - [x] Add `.env` to `.gitignore`
  - [x] Create `src/utils/jsonbin.js` with `createBin`, `getBin`, `updateBin` functions

## Tournament Structure

- [x] Create placeholder JSON for bracket structure
- [x] Create component to render bracket from JSON

## Bracket Submission Page

- [x] Add name input field
- [x] Display bracket from JSON
- [x] Add selection controls for winner and inGames
- [x] On submit, save JSON to JSONBin.io
  - [x] Add Submit button
  - [x] Implement `handleSubmit` function
  - [x] Format data as `{ userId, guess: { gameId: { winner: name, inGames } } }`
  - [x] Call `createBin` utility
  - [x] Add UI feedback (loading, success, error)
  - [x] Update Master Index Bin on successful submission

## Official Results Handling

- [x] Create a results JSON placeholder on JSONBin.io
  - [x] Created local template `src/data/officialResultsTemplate.json`
  - [x] **Action Required:** Manually create bin on JSONBin.io using template.
  - [x] **Action Required:** Add Bin ID to `.env` as `VITE_JSONBIN_RESULTS_BIN_ID`.
- [x] Set up fetch logic to retrieve results JSON
  - [x] Added `getOfficialResults` function to `src/utils/jsonbin.js`
- [x] Set up fetch logic to retrieve user guesses
  - [x] Added `getMasterIndex` and `updateMasterIndex` to `src/utils/jsonbin.js`
  - [x] Modified `handleSubmit` to update master index on submission
  - [x] **Action Required:** Manually create master index bin on JSONBin.io.
  - [x] **Action Required:** Add Bin ID to `.env` as `VITE_JSONBIN_MASTER_INDEX_BIN_ID`.
  - [x] **Note:** Fetching all guesses implemented in ScoreboardPage.

## Scoring Module

- [x] Create scoring module (placeholder logic)
  - [x] Created `src/utils/scoring.js`
  - [x] Implemented basic `calculateScore(guesses, results)` (+1 per correct winner)
- [x] Compare guesses to results (Done within ScoreboardPage)
- [x] Output sorted score array (Done within ScoreboardPage)

## Scoreboard Page

- [x] Fetch and display official results
  - [x] Created `src/components/ScoreboardPage.tsx`
  - [x] Fetched results using `getOfficialResults` in `useEffect`
  - [x] Processed results and displayed using `<BracketDisplay readOnly={true} />`
- [x] Fetch and score all user guesses
  - [x] Fetched master index (`getMasterIndex`)
  - [x] Fetched individual guesses (`getBin`)
  - [x] Calculated scores using `calculateScore`
- [x] Render user scores in descending order
  - [x] Sorted score array
  - [x] Displayed ranked list
