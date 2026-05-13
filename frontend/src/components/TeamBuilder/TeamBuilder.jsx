import { FaCog } from "react-icons/fa";
import { useHeroContext } from "../../contexts/HeroContext";
import { useTeam } from "../../contexts/TeamContext";
import { useModal } from "../../contexts/ModalContext";
import HeroGrid from "../HeroGrid/HeroGrid";
import TeamSlots from "../TeamSlots/TeamSlots";
import SaveTeamButton from "./SaveTeamButton";
import "./TeamBuilder.css";
import TeamSizeSelector from "./TeamSizeSelector";

const TeamBuilder = () => {
  const { teamName } = useTeam();
  const { loading } = useHeroContext();
  const { openModal } = useModal();

  const openTeamSettings = () => openModal("team-settings", {});

  if (loading) {
    return (
      <div className="team-builder-loading">
        <div className="loading-text">Loading Heroes...</div>
      </div>
    );
  }

  return (
    <div className="team-builder-container">
      {/* Header */}
      <header className="team-builder-header">
        {/* Team Title */}
        <div className="team-title-container">
          <h2 className="team-title">{teamName || "New Team"}</h2>
          <button className="edit-team-button" onClick={openTeamSettings}>
            <FaCog />
          </button>
        </div>
      </header>

      {/* Team Size Selector */}
      <TeamSizeSelector />

      {/* Team Slots */}
      <TeamSlots />

      <SaveTeamButton />

      {/* Available Heroes */}
      <HeroGrid />
    </div>
  );
};

export default TeamBuilder;
