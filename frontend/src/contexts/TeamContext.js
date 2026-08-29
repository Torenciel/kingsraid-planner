// frontend/src/contexts/TeamContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { convertDBToTeamContext } from "../utils/teamConverter";

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  // Main State of Team
  const [teamSize, setTeamSize] = useState(4);
  const [team, setTeam] = useState(Array(teamSize).fill(null));
  const [teamName, setTeamName] = useState("New Team");
  const [isPublic, setIsPublic] = useState(null);
  const [gameMode, setGameMode] = useState("pve");
  const [tags, setTags] = useState([]);

  // State of Gear
  const [subSlots, setSubSlots] = useState(
    Array(teamSize)
      .fill(null)
      .map(() => Array(4).fill(null)),
  );
  const [subStars, setSubStars] = useState(
    Array(teamSize)
      .fill(null)
      .map(() => Array(4).fill(0)),
  );

  // State of Perks and Advancement
  const [perks, setPerks] = useState(Array(teamSize).fill(null));

  // Stock null/0/1/2 (numbres)
  const [advancements, setAdvancements] = useState(Array(teamSize).fill(null));

  // Save state
  const [savedTeams, setSavedTeams] = useState([]);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // SETUP API
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

  // Load Team from Backend
  const loadTeams = async () => {
    try {
      setLoading(true);
      const meRes = await fetch(`${API_BASE_URL}/api/v2/auth/me`, {
        credentials: "include",
      });
      const meData = await meRes.json();
      const userId = meData?.user?._id || meData?.user?.id;
      if (!userId) return [];
      const response = await fetch(
        `${API_BASE_URL}/api/v2/teams?author=${userId}`,
        { credentials: "include" },
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          const formattedTeams =
            result.teams?.map((teamData) => convertDBToTeamContext(teamData)) ||
            [];

          setSavedTeams(formattedTeams);
          return formattedTeams;
        }
      }
      return [];
    } catch (error) {
      console.error("Error loading team:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Save Team
  const saveTeam = async (teamName = "My Team", overrides = {}) => {
    try {
      setLoading(true);

      const teamData = {
        teamTitle: teamName,
        teamSize: teamSize,
        team: team,
        subSlots: subSlots,
        subStars: subStars,
        perks: perks,
        advancements: advancements,
        isPublic: isPublic,
        gameMode: gameMode,
        tags: tags,
        ...overrides,
      };

      const isEditing = !!currentTeamId;

      const url = isEditing
        ? `${API_BASE_URL}/api/v2/teams/${currentTeamId}`
        : `${API_BASE_URL}/api/v2/teams`;

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamData,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          await loadTeams();
          setIsDirty(false);
          return { success: true, teamId: result.teamId };
        } else {
          console.error("Backend error:", result.error);
          return { success: false, error: result.error || "Failure save" };
        }
      } else {
        const errorText = await response.text();
        console.error("HTTP Error:", response.status, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: failure save team`,
        };
      }
    } catch (error) {
      console.error("Error network save team:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Load a specific team
  const loadTeam = async (teamId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v2/teams/${teamId}`);

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.team) {
          const teamContextData = convertDBToTeamContext(result.team);
          applyTeamData(teamContextData);
          setCurrentTeamId(data.team.slug);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error loading team:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Apply team data
  const applyTeamData = (teamData) => {
    if (!teamData) return;

    const {
      teamSize: newSize,
      team: newTeam,
      subSlots: newSubSlots,
      subStars: newSubStars,
      perks: newPerks,
      advancements: newAdvancements,
      tags: newTags,
      isPublic: newIsPublic,
      gameMode: newGameMode,
      name: newName,
    } = teamData;

    setTeamSize(newSize);
    setTeam(newTeam || Array(newSize).fill(null));
    setSubSlots(
      newSubSlots ||
        Array(newSize)
          .fill(null)
          .map(() => Array(4).fill(null)),
    );
    setSubStars(
      newSubStars ||
        Array(newSize)
          .fill(null)
          .map(() => Array(4).fill(0)),
    );
    setPerks(newPerks || Array(newSize).fill(null));

    // Besure that advancement is [null, 0, 1, 2]
    const validatedAdvancements = (
      newAdvancements || Array(newSize).fill(null)
    ).map((adv) => {
      if ([null, 0, 1, 2].includes(adv)) return adv;
      return null;
    });

    setAdvancements(validatedAdvancements);
    if (newTags) setTags(newTags);
    if (newIsPublic !== undefined) setIsPublic(newIsPublic);
    if (newGameMode) setGameMode(newGameMode);
    if (newName) setTeamName(newName);
    setIsDirty(false);
  };

  // Add Hero to the team
  const addHeroToTeam = (hero) => {
    if (!hero) return;

    const normalizedHero = {
      id: hero.slug || hero.id,
      name: hero.name || hero.infos?.name,
      role: hero.role || hero.infos?.class,
      image: hero.image || hero.infos?.thumbnail || hero.thumbnail,
      slug: hero.slug,
      infos: hero.infos,
      rawData: hero,
    };

    const isDuplicate = team.some(
      (slot) =>
        slot &&
        (slot.id === normalizedHero.id || slot.slug === normalizedHero.id),
    );
    if (isDuplicate) return;

    const emptySlotIndex = team.findIndex((slot) => slot === null);
    if (emptySlotIndex === -1) {
      alert("No empty slots available! Remove a hero first.");
      return;
    }

    setTeam((currentTeam) => {
      const newTeam = [...currentTeam];
      newTeam[emptySlotIndex] = normalizedHero;
      return newTeam;
    });
    setIsDirty(true);
  };

  // Remove a Hero
  const removeHeroFromTeam = (heroId) => {
    setTeam((currentTeam) => {
      const heroIndex = currentTeam.findIndex(
        (slot) => slot && (slot.id === heroId || slot.slug === heroId),
      );
      if (heroIndex === -1) return currentTeam;

      const newTeam = [...currentTeam];
      newTeam[heroIndex] = null;

      // clean data
      setSubSlots((current) => {
        const newSubSlots = [...current];
        newSubSlots[heroIndex] = Array(4).fill(null);
        return newSubSlots;
      });

      setSubStars((current) => {
        const newSubStars = [...current];
        newSubStars[heroIndex] = Array(4).fill(0);
        return newSubStars;
      });

      setPerks((current) => {
        const newPerks = [...current];
        newPerks[heroIndex] = null;
        return newPerks;
      });

      setAdvancements((current) => {
        const newAdvancements = [...current];
        newAdvancements[heroIndex] = null;
        return newAdvancements;
      });

      return newTeam;
    });
    setIsDirty(true);
  };

  // Update a SubSlot
  const updateSubSlot = (teamSlotIndex, subSlotIndex, item, stars = 0) => {
    setSubSlots((current) => {
      const newSubSlots = [...current];
      newSubSlots[teamSlotIndex] = [...newSubSlots[teamSlotIndex]];
      newSubSlots[teamSlotIndex][subSlotIndex] = item;
      return newSubSlots;
    });

    setSubStars((current) => {
      const newSubStars = [...current];
      newSubStars[teamSlotIndex] = [...newSubStars[teamSlotIndex]];
      newSubStars[teamSlotIndex][subSlotIndex] = stars;
      return newSubStars;
    });
    setIsDirty(true);
  };

  // Update Team size
  const changeTeamSize = (newSize) => {
    setTeamSize(newSize);
    setTeam(Array(newSize).fill(null));
    setSubSlots(
      Array(newSize)
        .fill(null)
        .map(() => Array(4).fill(null)),
    );
    setSubStars(
      Array(newSize)
        .fill(null)
        .map(() => Array(4).fill(0)),
    );
    setPerks(Array(newSize).fill(null));
    setAdvancements(Array(newSize).fill(null));
  };

  // Update Perks
  const updatePerks = (slotIndex, perkData) => {
    setPerks((current) => {
      const newPerks = [...current];
      newPerks[slotIndex] = perkData;
      return newPerks;
    });
    setIsDirty(true);
  };

  // Update Advancement
  const updateAdvancement = (slotIndex, advancement) => {
    // Validate value
    let validatedAdvancement = null;
    if ([null, 0, 1, 2].includes(advancement)) {
      validatedAdvancement = advancement;
    } else {
      validatedAdvancement = null;
    }

    setAdvancements((current) => {
      const newAdvancements = [...current];
      newAdvancements[slotIndex] = validatedAdvancement;
      return newAdvancements;
    });
    setIsDirty(true);
  };

  // Reset Team
  const resetTeam = () => {
    setTeam(Array(teamSize).fill(null));
    setSubSlots(
      Array(teamSize)
        .fill(null)
        .map(() => Array(4).fill(null)),
    );
    setSubStars(
      Array(teamSize)
        .fill(null)
        .map(() => Array(4).fill(0)),
    );
    setPerks(Array(teamSize).fill(null));
    setAdvancements(Array(teamSize).fill(null));
    setTeamName("New Team");
    setTags([]);
    setCurrentTeamId(null);
  };

  // Convert advancement
  const getAdvancementDisplay = (advancementValue) => {
    switch (advancementValue) {
      case null:
        return "none";
      case 0:
        return "blue";
      case 1:
        return "purple";
      case 2:
        return "red";
      default:
        return "none";
    }
  };

  // LoadTeam at launch
  useEffect(() => {
    loadTeams();
  }, []);

  // Load User preference to check defaultTeamVisibility is set to public or private
  useEffect(() => {
    const loadUserPreference = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v2/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) return;

        const result = await response.json();

        const defaultVisibility =
          result.user?.preferences?.defaultTeamVisibility;

        setIsPublic(defaultVisibility === "public");
      } catch (err) {
        console.error("Failed to load user preferences", err);
        setIsPublic(false);
      }
    };

    loadUserPreference();
  }, []);

  // Value
  const value = {
    // State
    team,
    teamSize,
    teamName,
    subSlots,
    subStars,
    perks,
    advancements,
    savedTeams,
    currentTeamId,
    loading,
    isDirty,
    isPublic,
    gameMode,
    tags,

    // Setters
    setTeamName,
    setIsPublic,
    setGameMode,
    setTags,
    setCurrentTeamId,

    // Actions
    addHeroToTeam,
    removeHeroFromTeam,
    updateSubSlot,
    changeTeamSize,
    updatePerks,
    updateAdvancement,
    saveTeam,
    loadTeam,
    resetTeam,
    loadTeams,
    applyTeamData,
    convertDBToTeamContext,

    // Utils
    getAdvancementDisplay,

    // Const
    MAX_TEAM_SLOTS: teamSize,
    API_BASE_URL,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

// EXPORT useTeam Hook
export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
};

export default TeamProvider;
