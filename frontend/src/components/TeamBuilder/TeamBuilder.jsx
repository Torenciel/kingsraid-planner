import { useEffect } from "react";
import { FaArrowLeft, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useHeroContext } from "../../contexts/HeroContext";
import { useTeam } from "../../contexts/TeamContext";
import { useModal } from "../../contexts/ModalContext";
import HeroGrid from "../HeroGrid/HeroGrid";
import InlineSlotPanel from "../SlotPanel/InlineSlotPanel";
import TeamSlots from "../TeamSlots/TeamSlots";
import SaveTeamButton from "./SaveTeamButton";
import "./TeamBuilder.css";

const TeamBuilder = ({ autoOpenSettings = false }) => {
  const { teamName } = useTeam();
  const { loading } = useHeroContext();
  const { openModal } = useModal();
  const navigate = useNavigate();

  const openTeamSettings = () => openModal("team-settings", {});

  useEffect(() => {
    if (autoOpenSettings) openModal("team-settings", { isNewTeam: true });
  }, []);

  if (loading) {
    return (
      <div className="team-builder-loading">
        <div className="loading-text">Loading Heroes...</div>
      </div>
    );
  }

  return (
    <div className="team-builder-container">
      <button className="tb-back-btn" onClick={() => navigate("/teams/public")}>
        <FaArrowLeft /> Back
      </button>
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

      {/* Team Slots */}
      <TeamSlots />

      {/* Inline slot editor — sits between team and save button */}
      <InlineSlotPanel />

      <SaveTeamButton />

      {/* Available Heroes */}
      <HeroGrid />
    </div>
  );
};

export default TeamBuilder;
