// frontend/src/contexts/TeamContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  // États principaux de l'équipe
  const [teamSize, setTeamSize] = useState(4);
  const [team, setTeam] = useState(Array(teamSize).fill(null));
  const [teamName, setTeamName] = useState('New Team');
  const [isPublic, setIsPublic] = useState(false);
  const [gameMode, setGameMode] = useState('pve');
  
  // États des équipements
  const [subSlots, setSubSlots] = useState(
    Array(teamSize).fill(null).map(() => Array(4).fill(null))
  );
  const [subStars, setSubStars] = useState(
    Array(teamSize).fill(null).map(() => Array(4).fill(0))
  );
  
  // États des perks et advancements
  const [perks, setPerks] = useState(Array(teamSize).fill(null));
  const [advancements, setAdvancements] = useState(Array(teamSize).fill("none"));
  
  // États de sauvegarde
  const [savedTeams, setSavedTeams] = useState([]);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Configuration API
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

  // 🔥 CHARGER LES ÉQUIPES DEPUIS LE BACKEND
  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v2/teams`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Convertir les données du backend au format frontend
          const formattedTeams = result.teams?.map(teamData => 
            convertDBToTeamContext(teamData)
          ) || [];
          
          setSavedTeams(formattedTeams);
          return formattedTeams;
        }
      }
      return [];
    } catch (error) {
      console.error('Erreur chargement équipes:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 🔥 SAUVEGARDER UNE ÉQUIPE
  const saveTeam = async (teamName = 'My Team', createdBy = 'anonymous') => {
    try {
      setLoading(true);
      
      // Préparer les données pour le backend
      const teamData = {
        teamTitle: teamName,
        teamSize: teamSize,
        team: team,
        subSlots: subSlots,
        subStars: subStars,
        perks: perks,
        advancements: advancements,
        isPublic: isPublic,
        gameMode: gameMode
      };
      
      const response = await fetch(`${API_BASE_URL}/api/v2/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamData,
          createdBy
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Charger les équipes mises à jour
          await loadTeams();
          return { success: true, teamId: result.teamId };
        }
      }
      return { success: false, error: 'Échec de sauvegarde' };
    } catch (error) {
      console.error('Erreur sauvegarde équipe:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CHARGER UNE ÉQUIPE SPÉCIFIQUE
  const loadTeam = async (teamId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v2/teams/${teamId}`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.team) {
          // Convertir les données du backend et appliquer
          const teamContextData = convertDBToTeamContext(result.team);
          applyTeamData(teamContextData);
          setCurrentTeamId(teamId);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur chargement équipe:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 APPLIQUER LES DONNÉES D'UNE ÉQUIPE
  const applyTeamData = (teamData) => {
    if (!teamData) return;
    
    const { teamSize: newSize, team: newTeam, subSlots: newSubSlots, 
            subStars: newSubStars, perks: newPerks, advancements: newAdvancements } = teamData;
    
    setTeamSize(newSize);
    setTeam(newTeam || Array(newSize).fill(null));
    setSubSlots(newSubSlots || Array(newSize).fill(null).map(() => Array(4).fill(null)));
    setSubStars(newSubStars || Array(newSize).fill(null).map(() => Array(4).fill(0)));
    setPerks(newPerks || Array(newSize).fill(null));
    setAdvancements(newAdvancements || Array(newSize).fill("none"));
  };

  // 🔥 CONVERTIR LES DONNÉES DU BACKEND AU FORMAT FRONTEND
  const convertDBToTeamContext = (dbTeam) => {
    if (!dbTeam) return null;
    
    const frontendTeam = Array(dbTeam.teamSize).fill(null);
    const frontendSubSlots = Array(dbTeam.teamSize).fill(null).map(() => Array(4).fill(null));
    const frontendSubStars = Array(dbTeam.teamSize).fill(null).map(() => Array(4).fill(0));
    const frontendPerks = Array(dbTeam.teamSize).fill(null);
    const frontendAdvancements = Array(dbTeam.teamSize).fill("none");
    
    // Traiter chaque héros
    dbTeam.heroes?.forEach(heroConfig => {
      const slotIndex = heroConfig.slotPosition;
      
      // Héros principal
      if (heroConfig.heroInfo) {
        frontendTeam[slotIndex] = {
          id: heroConfig.heroSlug,
          slug: heroConfig.heroSlug,
          name: heroConfig.heroInfo.name,
          role: heroConfig.heroInfo.class,
          image: heroConfig.heroInfo.thumbnail,
          infos: heroConfig.heroInfo
        };
      }
      
      // UW (slot 0)
      if (heroConfig.uw) {
        frontendSubStars[slotIndex][0] = heroConfig.uw.stars || 0;
      }
      
      // UT (slot 1)
      if (heroConfig.ut) {
        frontendSubSlots[slotIndex][1] = {
          choice: heroConfig.ut.choice || 0
        };
        frontendSubStars[slotIndex][1] = heroConfig.ut.stars || 0;
      }
      
      // SW (slot 2) - Conversion advancement
      if (heroConfig.sw) {
        const advancementMap = { null: "none", 0: "none", 1: "blue", 2: "purple", 3: "red" };
        frontendAdvancements[slotIndex] = advancementMap[heroConfig.sw.advancement] || "none";
      }
      
      // Artifact (slot 3)
      if (heroConfig.artifact?.artifactSlug) {
        frontendSubSlots[slotIndex][2] = {
          artifactSlug: heroConfig.artifact.artifactSlug,
          ...heroConfig.artifact.artifactInfo
        };
        frontendSubStars[slotIndex][2] = heroConfig.artifact.stars || 0;
      }
      
      // Gear Set (slot 4)
      if (heroConfig.gearSet?.gearSetSlug) {
        frontendSubSlots[slotIndex][3] = {
          gearSetSlug: heroConfig.gearSet.gearSetSlug,
          ...heroConfig.gearSet.gearSetInfo
        };
      }
      
      // Perks
      if (heroConfig.perks) {
        frontendPerks[slotIndex] = heroConfig.perks;
      }
    });
    
    return {
      id: dbTeam._id?.toString() || dbTeam.id,
      name: dbTeam.name,
      teamSize: dbTeam.teamSize,
      team: frontendTeam,
      subSlots: frontendSubSlots,
      subStars: frontendSubStars,
      perks: frontendPerks,
      advancements: frontendAdvancements,
      isPublic: dbTeam.isPublic,
      gameMode: dbTeam.gameMode,
      createdAt: dbTeam.createdAt
    };
  };

  // 🔥 AJOUTER UN HÉROS À L'ÉQUIPE
  const addHeroToTeam = (hero) => {
    if (!hero) return;
    
    const normalizedHero = {
      id: hero.slug || hero.id,
      name: hero.name || hero.infos?.name,
      role: hero.role || hero.infos?.class,
      image: hero.image || hero.infos?.thumbnail || hero.thumbnail,
      slug: hero.slug,
      infos: hero.infos,
      rawData: hero
    };
    
    const emptySlotIndex = team.findIndex((slot) => slot === null);
    if (emptySlotIndex === -1) {
      alert("No empty slots available! Remove a hero first.");
      return;
    }
    
    setTeam(currentTeam => {
      const newTeam = [...currentTeam];
      newTeam[emptySlotIndex] = normalizedHero;
      return newTeam;
    });
  };

  // 🔥 RETIRER UN HÉROS DE L'ÉQUIPE
  const removeHeroFromTeam = (heroId) => {
    setTeam(currentTeam => {
      const heroIndex = currentTeam.findIndex(
        (slot) => slot && (slot.id === heroId || slot.slug === heroId)
      );
      if (heroIndex === -1) return currentTeam;
      
      const newTeam = [...currentTeam];
      newTeam[heroIndex] = null;
      
      // Nettoyer les données associées
      setSubSlots(current => {
        const newSubSlots = [...current];
        newSubSlots[heroIndex] = Array(4).fill(null);
        return newSubSlots;
      });
      
      setSubStars(current => {
        const newSubStars = [...current];
        newSubStars[heroIndex] = Array(4).fill(0);
        return newSubStars;
      });
      
      setPerks(current => {
        const newPerks = [...current];
        newPerks[heroIndex] = null;
        return newPerks;
      });
      
      setAdvancements(current => {
        const newAdvancements = [...current];
        newAdvancements[heroIndex] = "none";
        return newAdvancements;
      });
      
      return newTeam;
    });
  };

  // 🔥 METTRE À JOUR UN SUB-SLOT
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
  };

  // 🔥 CHANGER LA TAILLE DE L'ÉQUIPE
  const changeTeamSize = (newSize) => {
    setTeamSize(newSize);
    setTeam(Array(newSize).fill(null));
    setSubSlots(Array(newSize).fill(null).map(() => Array(4).fill(null)));
    setSubStars(Array(newSize).fill(null).map(() => Array(4).fill(0)));
    setPerks(Array(newSize).fill(null));
    setAdvancements(Array(newSize).fill("none"));
  };

  // 🔥 METTRE À JOUR LES PERKS
  const updatePerks = (slotIndex, perkData) => {
    setPerks(current => {
      const newPerks = [...current];
      newPerks[slotIndex] = perkData;
      return newPerks;
    });
  };

  // 🔥 METTRE À JOUR L'ADVANCEMENT
  const updateAdvancement = (slotIndex, advancement) => {
    setAdvancements(current => {
      const newAdvancements = [...current];
      newAdvancements[slotIndex] = advancement;
      return newAdvancements;
    });
  };

  // 🔥 RÉINITIALISER L'ÉQUIPE
  const resetTeam = () => {
    setTeam(Array(teamSize).fill(null));
    setSubSlots(Array(teamSize).fill(null).map(() => Array(4).fill(null)));
    setSubStars(Array(teamSize).fill(null).map(() => Array(4).fill(0)));
    setPerks(Array(teamSize).fill(null));
    setAdvancements(Array(teamSize).fill("none"));
    setTeamName('New Team');
    setCurrentTeamId(null);
  };

  // Charger les équipes au démarrage
  useEffect(() => {
    loadTeams();
  }, []);

  // Valeur du contexte
  const value = {
    // États
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
    isPublic,
    gameMode,
    
    // Setters
    setTeamName,
    setIsPublic,
    setGameMode,
    
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
    
    // Constantes
    MAX_TEAM_SLOTS: teamSize
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

// 🔥 EXPORT DU HOOK useTeam
export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export default TeamProvider;