import React, { useMemo, useEffect, useCallback } from "react";
import { useTeams, useHeroes } from "../../hooks/useApi";
import { useAuth } from "../../contexts/AuthContext";
import TeamCard from "./TeamCard";

const TeamList = ({ tab = "public", searchQuery = "", onCountChange, selectedContent = [], selectedSubFilters = {}, contentOptions = [], showBookmarks = false }) => {
  const { user } = useAuth();

  // Build sets for fast lookup
  const bookmarkedIds = useMemo(() => {
    if (!user?.bookmarkedTeams) return new Set();
    return new Set(user.bookmarkedTeams.map((b) => String(b.teamId || b)));
  }, [user?.bookmarkedTeams]);

  const upvotedIds = useMemo(() => {
    if (!user?.upvotedTeams) return new Set();
    return new Set(user.upvotedTeams.map(String));
  }, [user?.upvotedTeams]);

  // Build filters based on active tab / bookmark mode
  const filters = useMemo(() => {
    if (showBookmarks) {
      if (!user?.id) return null;
      return { bookmarkedBy: user.id };
    }
    if (tab === "private") {
      if (user?.id) return { author: user.id };
      return null;
    }
    return { isPublic: true };
  }, [tab, user?.id, showBookmarks]);

  const shouldFetch = showBookmarks
    ? !!user?.id
    : tab === "public" || (tab === "private" && !!user?.id);

  const { data: teams, loading, error, refetch } = useTeams(
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

  const requiredTagSets = useMemo(() => {
    if (selectedContent.length === 0) return null;

    return selectedContent.map((contentId) => {
      const option = contentOptions.find((c) => c.id === contentId);
      if (!option) return new Set([contentId]);

      const chosenSubs = selectedSubFilters[contentId] || [];
      if (chosenSubs.length > 0) {
        return new Set(chosenSubs);
      }
      return new Set([contentId, ...option.subFilters.map((s) => s.id)]);
    });
  }, [selectedContent, selectedSubFilters, contentOptions]);

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
      result = result.filter((team) => {
        const teamTags = new Set(team.tags || []);
        return requiredTagSets.every((tagSet) =>
          [...tagSet].some((t) => teamTags.has(t))
        );
      });
    }

    return result;
  }, [teams, searchQuery, requiredTagSets, heroMetadataMap]);

  useEffect(() => {
    if (!loading && onCountChange) {
      onCountChange(filteredTeams.length);
    }
  }, [filteredTeams.length, loading, onCountChange]);

  const handleBookmarkToggle = useCallback((teamId, isNowBookmarked) => {
    if (showBookmarks && !isNowBookmarked) {
      refetch();
    }
  }, [showBookmarks, refetch]);

  const handleDeleteTeam = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading) return <div>Loading teams...</div>;

  if (error && shouldFetch) {
    console.error("Error loading teams:", error);
    return <div>Error loading teams. Please try again later.</div>;
  }

  const emptyMessage = showBookmarks
    ? "No bookmarked teams yet"
    : tab === "private"
    ? "No private teams yet"
    : "No public teams yet";

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
          isBookmarked={bookmarkedIds.has(String(team.id))}
          isUpvoted={upvotedIds.has(String(team.id))}
          onBookmarkToggle={handleBookmarkToggle}
          onDeleteTeam={handleDeleteTeam}
        />
      ))}
    </div>
  );
};

export default TeamList;
