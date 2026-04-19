// frontend/src/App.jsx
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import CookieBanner from "./components/CookieConsent/CookieBanner";
import Footer from "./components/UI/Footer";
import Navbar from "./components/UI/Navbar";

import ChangeEmail from "./Routes/Account/ChangeEmail";
import ChangePassword from "./Routes/Account/ChangePassword";
import ChangeUsername from "./Routes/Account/ChangeUsername";
import ForgotPassword from "./Routes/Account/ForgotPassword";
import ResetPassword from "./Routes/Account/ResetPassword";
import VerifyEmail from "./Routes/Account/VerifyEmail";
import VerifyPending from "./Routes/Account/VerifyPending";
import Home from "./Routes/Home";
import CookiePolicy from "./Routes/Legal/CookiePolicy";
import LegalNotice from "./Routes/Legal/LegalNotice";
import PrivacyPolicy from "./Routes/Legal/PrivacyPolicy";
import Login from "./Routes/Login";
import NotFound from "./Routes/NotFound";
import Profile from "./Routes/Profile";
import About from "./Routes/Project/About";
import Register from "./Routes/Register";
import BugReport from "./Routes/Support/BugReport";
import Contact from "./Routes/Support/Contact";
import Feedback from "./Routes/Support/Feedback";
import TeamEdit from "./Routes/TeamEdit";
import TeamViewer from "./Routes/TeamViewer";
import Teams from "./Routes/Teams";

import ProtectedRoute from "./components/Guards/ProtectedRoute";

import ModalManager from "./components/Modals/ModalManager";

// IMPORT EVERY CONTEXT PROVIDER
import { ArtifactProvider } from "./contexts/ArtifactContext";
import { AuthProvider } from "./contexts/AuthContext";
import { GearSetProvider } from "./contexts/GearSetContext";
import { HeroProvider } from "./contexts/HeroContext";
import { ModalProvider } from "./contexts/ModalContext";
import { OverlayProvider } from "./contexts/OverlayContext";
import { PerksProvider } from "./contexts/PerksContext";
import { TeamProvider } from "./contexts/TeamContext";

// Create a wrapper component to use useLocation
function AppRoutes() {
  const location = useLocation();

  return (
    <Routes>
      {/* Main routes */}
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/about" element={<About />} />
      <Route path="/teams/:tab" element={<Teams key={location.key} />} />
      <Route path="/teams" element={<Navigate to="/teams/public" replace />} />
      <Route path="/team/:slug" element={<TeamViewer />} />
      <Route path="/verify-pending" element={<VerifyPending />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/legal-notice" element={<LegalNotice />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/bug-report" element={<BugReport />} />
      <Route path="/contact" element={<Contact />} />

      {/* Auth required routes (Require Loging-in)*/}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams/private"
        element={
          <ProtectedRoute>
            <Teams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/edit"
        element={
          <ProtectedRoute>
            <TeamEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/edit/:slug"
        element={
          <ProtectedRoute>
            <TeamEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/username"
        element={
          <ProtectedRoute>
            <ChangeUsername />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/email"
        element={
          <ProtectedRoute>
            <ChangeEmail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CookieBanner />
        {/* PROVIDERS HIERARCHY (logical order) */}
        {/* 
        Ordre logique :
        HeroProvider (Used by the next 4 providers)
        ArtifactProvider 
        GearSetProvider
        PerksProvider
        ModalProvider (Use precedents providers to show modals)
        OverlayProvider (Use precedents providers to show overlay)
        TeamProvider (Use precedents providers to manage team data)
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
                        <Footer />
                      </div>
                      <ModalManager />
                    </TeamProvider>
                  </OverlayProvider>
                </ModalProvider>
              </PerksProvider>
            </GearSetProvider>
          </ArtifactProvider>
        </HeroProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
