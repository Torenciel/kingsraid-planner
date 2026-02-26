import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTeam } from "../contexts/TeamContext";
import TeamSlots from "../components/TeamSlots/TeamSlots";

const TeamViewer = () => {
  const { slug } = useParams();
  const { convertDBToTeamContext } = useTeam();

  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await fetch(
          `http://localhost:3002/api/v2/teams/${slug}`
        );

        const result = await response.json();

        if (result.success) {
          // Convert DB format to frontend format
          const converted = convertDBToTeamContext(result.team);

          // Store ONLY converted version
          setTeamData(converted);
        }
      } catch (error) {
        console.error("Error loading team:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [slug, convertDBToTeamContext]);

  if (loading) return <div>Loading...</div>;
  if (!teamData) return <div>Team not found</div>;

  return (
    <div className="team-viewer">
      <h1>{teamData.name}</h1>
      <p>By {teamData.createdBy}</p>

      <TeamSlots
        readOnly={true}
        teamOverride={teamData.team}
        subSlotsOverride={teamData.subSlots}
        subStarsOverride={teamData.subStars}
        advancementsOverride={teamData.advancements}
        perksOverride={teamData.perks}
      />
    </div>
  );
};

export default TeamViewer;