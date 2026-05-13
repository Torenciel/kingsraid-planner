import React, { useMemo, useEffect } from "react";
import { useTeams, useHeroes } from "../../hooks/useApi";
import { useAuth } from "../../contexts/AuthContext";
import TeamCard from "./TeamCard";

const TeamList = ({ tab = "public", searchQuery = "", onCountChange, selectedContent = [], selectedSubFilters = {}, contentOptions = [] }) => {
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

  // Build the set of tag IDs a team must match given the current filter selection.
  // Rules:
  //   - No content selected → no tag filter (show all)
  //   - Parent selected, no sub-filters chosen → match parent OR any of its children
  //   - Parent selected, some sub-filters chosen → match only those sub-filters
  const requiredTagSets = useMemo(() => {
    if (selectedContent.length === 0) return null;

    return selectedContent.map((contentId) => {
      const option = contentOptions.find((c) => c.id === contentId);
      if (!option) return new Set([contentId]);

      const chosenSubs = selectedSubFilters[contentId] || [];
      if (chosenSubs.length > 0) {
        return new Set(chosenSubs);
      }
      // Parent + all children
      return new Set([contentId, ...option.subFilters.map((s) => s.id)]);
    });
  }, [selectedContent, selectedSubFilters, contentOptions]);

  // Filter teams by search query then by tags
  const filteredTeams = useMemo(() => {
    if (!teams) return [];

    let result = teams;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((team) => {
        if (team.name?.toLowerCase().includes(query)) return true;
        if (team.createdBy?.toLowerCase().includes(query)) return true;
        return team.heroes?.some((hero) => {
          const slug = hero.heroSlug || hero.slug || "";
          const meta = heroMetadataMap[slug];
          const heroName = meta?.name || meta?.infos?.name || slug.replace(/-/g, " ");
          return heroName.toLowerCase().includes(query);
        });
      });
    }

    if (requiredTagSets) {
      // Team must match at least one tag from EACH selected content group
      result = result.filter((team) => {
        const teamTags = new Set(team.tags || []);
        return requiredTagSets.every((tagSet) =>
          [...tagSet].some((t) => teamTags.has(t))
        );
      });
    }

    return result;
  }, [teams, searchQuery, requiredTagSets, heroMetadataMap]);

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
          currentUserId={user?.id}
        />
      ))}
    </div>
  );
};

export default TeamList;
