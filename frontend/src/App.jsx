// frontend/src/App.jsx
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/UI/Navbar";

import About from "./Routes/About";
import Home from "./Routes/Home";
import Login from "./Routes/Login";
import NotFound from "./Routes/NotFound";
import Register from "./Routes/Register";
import TeamEdit from "./Routes/TeamEdit";
import Teams from "./Routes/Teams";



// IMPORT TOUS LES CONTEXT PROVIDERS
import { TeamProvider } from "./contexts/TeamContext";
import { HeroProvider } from "./contexts/HeroContext";
import { ArtifactProvider } from "./contexts/ArtifactContext";
import { GearSetProvider } from "./contexts/GearSetContext";
import { ModalProvider } from "./contexts/ModalContext";
import { OverlayProvider } from "./contexts/OverlayContext";
import { PerksProvider } from "./contexts/PerksContext";

// Create a wrapper component to use useLocation
function AppRoutes() {
  const location = useLocation();

  return (
    <Routes>
      {/* Main routes */}
      <Route path="/" element={<Home />} />
      <Route path="/teams" element={<Navigate to="/teams/public" replace />} />
      <Route path="/teams/:tab" element={<Teams key={location.key} />} />
      <Route
        path="/my-teams"
        element={<Navigate to="/teams/private" replace />}
      />
      <Route path="/team/edit" element={<TeamEdit />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />



      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>

    //   {/* 404 route */}
    //   <Route path="*" element={<NotFound />} />
    // </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* HIÉRARCHIE DES PROVIDERS (ordre important) */}
      {/* 
        Ordre logique :
        1. HeroProvider (utilisé par les providers suivants)
        2. ArtifactProvider 
        3. GearSetProvider
        4. PerksProvider
        5. ModalProvider (utilise les providers précédents)
        6. OverlayProvider (utilise les providers précédents)
        7. TeamProvider (utilise tous les précédents)
      */}
      <HeroProvider>
        <ArtifactProvider>
          <GearSetProvider>
            <PerksProvider>
              <ModalProvider>
                <OverlayProvider>
                  <TeamProvider>
                    <div className="app">
                      <Navbar />
                      <main className="main-content">
                        <AppRoutes />
                      </main>
                    </div>
                  </TeamProvider>
                </OverlayProvider>
              </ModalProvider>
            </PerksProvider>
          </GearSetProvider>
        </ArtifactProvider>
      </HeroProvider>
    </BrowserRouter>
  );
}

export default App;