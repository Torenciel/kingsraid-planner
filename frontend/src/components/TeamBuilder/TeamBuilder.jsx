import { useHeroContext } from "../../contexts/HeroContext";
import { useTeam } from "../../contexts/TeamContext";
import HeroGrid from "../HeroGrid/HeroGrid";
import TeamSlots from "../TeamSlots/TeamSlots";
import "./TeamBuilder.css";
import TeamSizeSelector from "./TeamSizeSelector";
import SaveTeamButton from './SaveTeamButton';
import { FaRegEdit } from "react-icons/fa";

const TeamBuilder = () => {
  const { teamTitle } = useTeam();
  const { loading } = useHeroContext();

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
          <h2 className="team-title">Placeholder title {teamTitle}</h2>
          <button className="edit-team-button"><FaRegEdit /></button>
          
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
