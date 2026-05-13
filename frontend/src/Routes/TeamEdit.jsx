import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

import ModalManager from "../components/Modals/ModalManager";
import TeamBuilder from "../components/TeamBuilder/TeamBuilder";

import { ArtifactProvider } from "../contexts/ArtifactContext";
import { HeroProvider } from "../contexts/HeroContext";
import { ModalProvider } from "../contexts/ModalContext";
import { OverlayProvider } from "../contexts/OverlayContext";
import { PerksProvider } from "../contexts/PerksContext";
import { TeamProvider, useTeam } from "../contexts/TeamContext";

import "../index.css";

/*
  This component loads the team if a slug exists
  and injects it into TeamContext
*/
const TeamLoader = () => {

  const { slug } = useParams();
  const { applyTeamData, convertDBToTeamContext, setCurrentTeamId, team } = useTeam();
  const navigate = useNavigate();
  const hasHeroRef = useRef(false);
  hasHeroRef.current = team.some((slot) => slot !== null);

  // Block browser tab close / reload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasHeroRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Block browser back/forward button
  useEffect(() => {
    const handlePopState = () => {
      if (!hasHeroRef.current) return;
      window.history.pushState(null, "", window.location.href);
      if (window.confirm("Leave without saving the team?")) navigate(-1);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  // Block in-app navigation (Navbar links, programmatic navigate calls)
  useEffect(() => {
    const originalPush = window.history.pushState.bind(window.history);
    window.history.pushState = (state, title, url) => {
      if (hasHeroRef.current && url && url !== window.location.pathname) {
        if (!window.confirm("Leave without saving the team?")) return;
      }
      originalPush(state, title, url);
    };
    return () => {
      window.history.pushState = originalPush;
    };
  }, []);

useEffect(() => {

  if (!slug) return;

  const fetchTeam = async () => {
    try {

      const res = await fetch(
        `http://localhost:3002/api/v2/teams/${slug}`
      );

      const data = await res.json();

      if (!data.success) {
        console.error("Team not found");
        return;
      }

      const converted = convertDBToTeamContext(data.team);

      applyTeamData(converted);

      setCurrentTeamId(data.team.slug);

    } catch (err) {
      console.error("Failed to load team", err);
    }
  };

  fetchTeam();

}, [slug]);

  return (
    <>
      <TeamBuilder />
      <ModalManager />
    </>
  );
};

function Team() {
  return (
    <OverlayProvider>
      <ArtifactProvider>
        <TeamProvider>
          <HeroProvider>
            <ModalProvider>
              <PerksProvider>

                <TeamLoader />

              </PerksProvider>
            </ModalProvider>
          </HeroProvider>
        </TeamProvider>
      </ArtifactProvider>
    </OverlayProvider>
  );
}

export default Team;