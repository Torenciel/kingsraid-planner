import { useHeroContext } from "../../contexts/HeroContext"; // Use the correct export name
import { useTeam } from "../../contexts/TeamContext";
import TeamSlots from "../TeamSlots/TeamSlots";

const TeamBuilder = () => {
  const { teamTitle } = useTeam();
  const { loading } = useHeroContext(); // Use the correct hook name

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-xl">Loading Heroes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">KingsRaid Team Builder</h1>

        {/* Team Title */}
        <div className="team-title-container">
          <h2 className="text-lg font-semibold">{teamTitle}</h2>
        </div>
      </header>

      {/* Team Slots */}
      <TeamSlots />

      {/* Available Heroes */}
      {/* <HeroGrid /> */}
    </div>
  );
};

export default TeamBuilder;
