import { useHeroContext } from "../../contexts/HeroContext";
import { useTeam } from "../../contexts/TeamContext";
import HeroGrid from "../HeroGrid/HeroGrid";
import TeamSlots from "../TeamSlots/TeamSlots";
import "./TeamBuilder.css"; // Import du CSS
import TeamSizeSelector from "./TeamSizeSelector";
import SaveTeamButton from './SaveTeamButton';

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
        <h1 className="team-builder-title">Team Builder</h1>

        {/* Team Title */}
        <div className="team-title-container">
          <h2 className="team-title">{teamTitle}</h2>
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
