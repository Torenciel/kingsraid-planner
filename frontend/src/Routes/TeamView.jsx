import ModalManager from "../components/Modals/ModalManager";
import TeamBuilder from "../components/TeamBuilder/TeamBuilder";
import { ArtifactProvider } from "../contexts/ArtifactContext";
import { HeroProvider } from "../contexts/HeroContext";
import { ModalProvider } from "../contexts/ModalContext";
import { OverlayProvider } from "../contexts/OverlayContext";
import { PerksProvider } from "../contexts/PerksContext";
import { TeamProvider } from "../contexts/TeamContext";
import "../index.css";

function Team() {
  return (
    <OverlayProvider>
      <ArtifactProvider>
        <TeamProvider>
          <HeroProvider>
            <ModalProvider>
              <PerksProvider>
                <div className="app-container">
                  <div className="background-layer"></div>
                  <div className="background-overlay"></div>
                  <div className="app-content">
                    <TeamBuilder />
                    <ModalManager />
                  </div>
                </div>
              </PerksProvider>
            </ModalProvider>
          </HeroProvider>
        </TeamProvider>
      </ArtifactProvider>
    </OverlayProvider>
  );
}

export default Team;
