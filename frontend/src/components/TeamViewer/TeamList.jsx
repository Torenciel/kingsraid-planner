import React, { useMemo, useEffect } from "react";
import { useTeams, useHeroes } from "../../hooks/useApi";
import { useAuth } from "../../contexts/AuthContext";
import TeamCard from "./TeamCard";

const TeamList = ({ tab = "public", searchQuery = "", onCountChange }) => {
  const { user } = useAuth();

  console.log(`TeamList user object:`, user);
  console.log(`user.id:`, user?.id);
  console.log(`tab:`, tab);

  // Build filters based on active tab
  const filters = useMemo(() => {
    if (tab === "private") {
      // My Teams: only teams created by the current user (use author ID, not displayName)
      if (user?.id) {
        return { author: user.id };
      }
      return null;
    } else {
      // Public Teams: only public teams
      return { isPublic: true };
    }
  }, [tab, user?.id]);

  // Only call API if filters are ready
  const shouldFetch = tab === "public" || (tab === "private" && user?.id);
  const { data: teams, loading, error, count } = useTeams(
    shouldFetch ? filters : null
  );

  const { data: heroesMetadata } = useHeroes();

  const heroMetadataMap = useMemo(() => {
    if (!heroesMetadata) return {};
    const map = {};
    heroesMetadata.forEach((hero) => {
      map[hero.slug] = {
        ...hero,
        infos: {
          position: hero.position,
        },
      };
    });
    return map;
  }, [heroesMetadata]);

  // Filter teams by search query
  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    if (!searchQuery) return teams;

    const query = searchQuery.toLowerCase();
    return teams.filter(
      (team) =>
        team.teamTitle?.toLowerCase().includes(query) ||
        team.name?.toLowerCase().includes(query) ||
        team.createdBy?.toLowerCase().includes(query) ||
        team.heroes?.some((hero) =>
          hero.name?.toLowerCase().includes(query)
        )
    );
  }, [teams, searchQuery]);

  // Notify parent of count changes (use filtered count so search is reflected)
  useEffect(() => {
    if (!loading && onCountChange) {
      onCountChange(filteredTeams.length);
    }
  }, [filteredTeams.length, loading, onCountChange]);

  // Show loading state
  if (loading) return <div>Loading teams...</div>;

  // Show error only if we actually have an error and filters were attempted
  if (error && shouldFetch) {
    console.error("Error loading teams:", error);
    return <div>Error loading teams. Please try again later.</div>;
  }

  // Show empty state
  const emptyMessage =
    tab === "private" ? "No private teams yet" : "No public teams yet";
  if (!filteredTeams || filteredTeams.length === 0) {
    return <div>{emptyMessage}</div>;
  }

  return (
    <div className="team-list">
      {filteredTeams.map((team) => (
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
