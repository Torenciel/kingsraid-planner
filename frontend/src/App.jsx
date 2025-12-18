// App.jsx
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"; // Added useLocation
import Navbar from "./components/UI/Navbar";
import About from "./Routes/About";
import Home from "./Routes/Home";
import TeamEdit from "./Routes/TeamEdit";
import Teams from "./Routes/Teams";

// Import all other Routes for boss links
import NotFound from "./Routes/NotFound";
import GCTeams from "./Routes/teams/GCTeams";
import GRTeams from "./Routes/teams/GRTeams";
import PvPTeams from "./Routes/teams/PvPTeams";
import RaidTeams from "./Routes/teams/RaidTeams";
import ShakmehTeams from "./Routes/teams/ShakmehTeams";
import StoryTeams from "./Routes/teams/StoryTeams";
import TrialTeams from "./Routes/teams/TrialTeams";
import WBTeams from "./Routes/teams/WBTeams";

// Create a wrapper component to use useLocation
function AppRoutes() {
  const location = useLocation(); // Now this is correct

  return (
    <Routes>
      {/* Main routes */}
      <Route path="/" element={<Home />} />
      <Route path="/teams" element={<Navigate to="/teams/private" replace />} />
      <Route path="/teams/:tab" element={<Teams key={location.key} />} />
      <Route
        path="/teams/:tab/:content*"
        element={<Teams key={location.key} />}
      />
      <Route
        path="/my-teams"
        element={<Navigate to="/teams/private" replace />}
      />
      <Route path="/team/edit" element={<TeamEdit />} />
      <Route path="/about" element={<About />} />

      {/* Boss team routes - you might want to remove these if they're not needed anymore */}
      <Route path="/teams/wb" element={<WBTeams />} />
      <Route path="/teams/raid" element={<RaidTeams />} />
      <Route path="/teams/gc" element={<GCTeams />} />
      <Route path="/teams/gr" element={<GRTeams />} />
      <Route path="/teams/trial" element={<TrialTeams />} />
      <Route path="/teams/shakmeh" element={<ShakmehTeams />} />
      <Route path="/teams/story" element={<StoryTeams />} />
      <Route path="/teams/pvp" element={<PvPTeams />} />

      {/* Optional: Add 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <AppRoutes /> {/* Use the wrapper component */}
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
