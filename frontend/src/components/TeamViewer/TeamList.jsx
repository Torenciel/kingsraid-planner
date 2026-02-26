import React, { useMemo } from "react";
import { useTeams, useHeroes } from "../../hooks/useApi";
import TeamCard from "./TeamCard";

const TeamList = () => {
  const filters = useMemo(() => ({ isPublic: true }), []);
  const { data: teams, loading, error } = useTeams(filters);

  const { data: heroesMetadata } = useHeroes();

const heroMetadataMap = useMemo(() => {
  if (!heroesMetadata) return {};

  const map = {};

  heroesMetadata.forEach((hero) => {
    map[hero.slug] = {
      ...hero,
      infos: {
        position: hero.position
      }
    };
  });

  return map;
}, [heroesMetadata]);


  if (loading) return <div>Loading teams...</div>;
  if (error) return <div>Error loading teams</div>;
  if (!teams || teams.length === 0)
    return <div>No public teams yet</div>;

  return (
    <div className="team-list">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          heroMetadataMap={heroMetadataMap}
        />
      ))}
    </div>
  );
};

export default TeamList;
