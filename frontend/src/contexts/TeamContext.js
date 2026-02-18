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
  
  // 🔥 Stocker null/0/1/2 (nombres)
  const [advancements, setAdvancements] = useState(
    Array(teamSize).fill(null)
  );
  
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
  const saveTeam = async (teamName = 'My Team') => {
    try {
      setLoading(true);
      
      console.log('=== 🚀 TEAMCONTEXT - saveTeam ===');
      console.log('Advancements avant envoi:', advancements);
      console.log('Types:', advancements.map(a => typeof a));
      console.log('Valeurs:', advancements);
      
      const teamData = {
        teamTitle: teamName,
        teamSize: teamSize,
        team: team,
        subSlots: subSlots,
        subStars: subStars,
        perks: perks,
        advancements: advancements,  // 🔥 Doit être [null, 0, 1, 2]
        isPublic: isPublic,
        gameMode: gameMode
      };
      
      console.log('📤 Données complètes envoyées:', teamData);
      
const response = await fetch(`${API_BASE_URL}/api/v2/teams`, {
  method: 'POST',
  credentials: 'include',   // THIS IS REQUIRED
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    teamData
  })
});

      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          await loadTeams();
          return { success: true, teamId: result.teamId };
        } else {
          console.error('Backend error:', result.error);
          return { success: false, error: result.error || 'Échec de sauvegarde' };
        }
      } else {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        return { 
          success: false, 
          error: `HTTP ${response.status}: Échec de sauvegarde` 
        };
      }
      
    } catch (error) {
      console.error('Erreur réseau sauvegarde équipe:', error);
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
    
    // 🔥 S'assurer que advancements est bien [null, 0, 1, 2]
    const validatedAdvancements = (newAdvancements || Array(newSize).fill(null)).map(adv => {
      if ([null, 0, 1, 2].includes(adv)) return adv;
      console.warn('⚠️ Advancement invalide converti en null:', adv);
      return null;
    });
    
    setAdvancements(validatedAdvancements);
  };

  // 🔥 CONVERTIR LES DONNÉES DU BACKEND AU FORMAT FRONTEND
  const convertDBToTeamContext = (dbTeam) => {
    if (!dbTeam) return null;
    
    const frontendTeam = Array(dbTeam.teamSize).fill(null);
    const frontendSubSlots = Array(dbTeam.teamSize).fill(null).map(() => Array(4).fill(null));
    const frontendSubStars = Array(dbTeam.teamSize).fill(null).map(() => Array(4).fill(0));
    const frontendPerks = Array(dbTeam.teamSize).fill(null);
    const frontendAdvancements = Array(dbTeam.teamSize).fill(null);
    
    console.log('=== 🔄 convertDBToTeamContext ===');
    console.log('Nombre de héros:', dbTeam.heroes?.length);
    
    // Traiter chaque héros
    dbTeam.heroes?.forEach(heroConfig => {
      const slotIndex = heroConfig.slotPosition;
      
      console.log(`\n👤 Héros ${slotIndex} (${heroConfig.heroSlug}):`);
      
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
      
      // 🔥 SW (slot 2) - Conversion correcte
      if (heroConfig.sw) {
        let advancementValue = heroConfig.sw.advancement;
        console.log('  SW advancement from DB:', {
          value: advancementValue,
          type: typeof advancementValue
        });
        
        // Si c'est un objet (erreur), on prend null
        if (advancementValue && typeof advancementValue === 'object') {
          console.warn('  ⚠️ SW advancement est un objet, conversion en null');
          advancementValue = null;
        }
        
        // Convertir string en number si nécessaire
        if (typeof advancementValue === 'string') {
          if (advancementValue === "null" || advancementValue === "none") {
            advancementValue = null;
          } else if (["0", "1", "2"].includes(advancementValue)) {
            advancementValue = parseInt(advancementValue);
          }
        }
        
        // Valider la valeur finale
        if (![null, 0, 1, 2].includes(advancementValue)) {
          console.warn(`  ⚠️ SW advancement invalide "${advancementValue}", conversion en null`);
          advancementValue = null;
        }
        
        frontendAdvancements[slotIndex] = advancementValue;
        console.log('  SW advancement final:', advancementValue);
      }
      
      // Artifact (slot 3 dans subSlots)
      if (heroConfig.artifact?.artifactSlug) {
        frontendSubSlots[slotIndex][2] = {
          artifactSlug: heroConfig.artifact.artifactSlug,
          ...heroConfig.artifact.artifactInfo
        };
        frontendSubStars[slotIndex][2] = heroConfig.artifact.stars || 0;
      }
      
      // Gear Set (slot 4 dans subSlots)
      if (heroConfig.gearSet) {
        if (heroConfig.gearSet.isMultiSet && heroConfig.gearSet.sets) {
          frontendSubSlots[slotIndex][3] = {
            sets: heroConfig.gearSet.sets,
            isMultiSet: true,
            gearSetSlug: heroConfig.gearSet.sets[0],
            gearSetInfo: heroConfig.gearSet.gearSetInfo,
            set1Info: heroConfig.gearSet.set1Info,
            set2Info: heroConfig.gearSet.set2Info,
            pieces: 2
          };
        } else {
          frontendSubSlots[slotIndex][3] = {
            gearSetSlug: heroConfig.gearSet.gearSetSlug,
            gearSetInfo: heroConfig.gearSet.gearSetInfo,
            pieces: heroConfig.gearSet.pieces || 0
          };
        }
      }
      
      // Perks
      if (heroConfig.perks) {
        frontendPerks[slotIndex] = heroConfig.perks;
      }
    });
    
    console.log('Advancements convertis:', frontendAdvancements);
    
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
        newAdvancements[heroIndex] = null;
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
    setAdvancements(Array(newSize).fill(null));
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
    console.log('📝 [TeamContext] updateAdvancement appelé:', { 
      slotIndex, 
      advancement,
      type: typeof advancement 
    });
    
    // 🔥 Valider strictement la valeur
    let validatedAdvancement = null;
    if ([null, 0, 1, 2].includes(advancement)) {
      validatedAdvancement = advancement;
    } else {
      console.warn('⚠️ Valeur advancement invalide, conversion en null:', advancement);
      validatedAdvancement = null;
    }
    
    setAdvancements(current => {
      const newAdvancements = [...current];
      newAdvancements[slotIndex] = validatedAdvancement;
      console.log('✅ Advancements mis à jour:', newAdvancements);
      return newAdvancements;
    });
  };

  // 🔥 RÉINITIALISER L'ÉQUIPE
  const resetTeam = () => {
    setTeam(Array(teamSize).fill(null));
    setSubSlots(Array(teamSize).fill(null).map(() => Array(4).fill(null)));
    setSubStars(Array(teamSize).fill(null).map(() => Array(4).fill(0)));
    setPerks(Array(teamSize).fill(null));
    setAdvancements(Array(teamSize).fill(null));
    setTeamName('New Team');
    setCurrentTeamId(null);
  };

  // 🔥 FONCTION UTILITAIRE : Convertir advancement pour l'affichage
  const getAdvancementDisplay = (advancementValue) => {
    switch(advancementValue) {
      case null: return "none";
      case 0: return "blue";
      case 1: return "purple";
      case 2: return "red";
      default: return "none";
    }
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
    
    // Utilitaires
    getAdvancementDisplay,
    
    // Constantes
    MAX_TEAM_SLOTS: teamSize,
    API_BASE_URL
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