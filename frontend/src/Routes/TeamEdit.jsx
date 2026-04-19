import { useParams } from "react-router-dom";
import { useEffect } from "react";

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
  const { applyTeamData, convertDBToTeamContext, setCurrentTeamId } = useTeam();

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