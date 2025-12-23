import { createContext, useContext, useState } from "react";

const TeamContext = createContext();

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
};

export const TeamProvider = ({ children }) => {
  // Taille d'équipe configurable
  const [teamSize, setTeamSize] = useState(4);
  const MAX_TEAM_SLOTS = teamSize;

  // Initialiser les états avec la taille actuelle
  const [team, setTeam] = useState(Array(MAX_TEAM_SLOTS).fill(null));
  const [teamTitle, setTeamTitle] = useState("Your Team");
  const [subSlots, setSubSlots] = useState(
    Array(MAX_TEAM_SLOTS)
      .fill(null)
      .map(() => Array(4).fill(null))
  );
  const [subStars, setSubStars] = useState(
    Array(MAX_TEAM_SLOTS)
      .fill(null)
      .map(() => Array(4).fill(0))
  );
  const [perks, setPerks] = useState(Array(MAX_TEAM_SLOTS).fill(null));
  const [advancements, setAdvancements] = useState(
    Array(MAX_TEAM_SLOTS).fill("none")
  );

  // Fonction pour changer la taille de l'équipe
  const changeTeamSize = (newSize) => {
    setTeamSize(newSize);

    // Réinitialiser les états avec la nouvelle taille
    setTeam(Array(newSize).fill(null));
    setSubSlots(
      Array(newSize)
        .fill(null)
        .map(() => Array(4).fill(null))
    );
    setSubStars(
      Array(newSize)
        .fill(null)
        .map(() => Array(4).fill(0))
    );
    setPerks(Array(newSize).fill(null));
    setAdvancements(Array(newSize).fill("none"));
  };

  // Ajouter un héros à l'équipe
  const addHeroToTeam = (hero) => {
    // Vérification basique
    if (!hero || !hero.id || !hero.name) {
      console.error("❌ Héros invalide:", hero);
      return;
    }

    // Vérifier IMMÉDIATEMENT si l'équipe est pleine
    const isTeamFull = team.every((slot) => slot !== null);

    if (isTeamFull) {
      alert("No empty slots available! Remove a hero first.");
      return;
    }

    setTeam((currentTeam) => {
      const emptySlotIndex = currentTeam.findIndex((slot) => slot === null);

      if (emptySlotIndex === -1) {
        return currentTeam;
      }

      const newTeam = [...currentTeam];
      newTeam[emptySlotIndex] = hero;
      return newTeam;
    });
  };

  // Retirer un héros de l'équipe
  const removeHeroFromTeam = (heroId) => {
    setTeam((currentTeam) => {
      const heroIndex = currentTeam.findIndex(
        (slot) => slot && slot.id === heroId
      );
      if (heroIndex === -1) return currentTeam;

      const newTeam = [...currentTeam];
      newTeam[heroIndex] = null;

      // Also clear subSlots, subStars, perks, and advancements for this slot
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
        newAdvancements[heroIndex] = "none";
        return newAdvancements;
      });

      return newTeam;
    });
  };

const updateSubSlot = (teamSlotIndex, subSlotIndex, item, stars = 0) => {
  // 🔥 LOG pour debug
  console.log(`updateSubSlot: slot=${teamSlotIndex}, sub=${subSlotIndex}`);
  console.log('Item reçu:', item);
  console.log('Stars reçues:', stars);
  
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

  // Mettre à jour les perks
  const updatePerks = (teamSlotIndex, newPerks) => {
    setPerks((current) => {
      const newPerksArray = [...current];
      newPerksArray[teamSlotIndex] = newPerks;
      return newPerksArray;
    });
  };

  // Mettre à jour les advancements
  const updateAdvancement = (teamSlotIndex, advancement) => {
    setAdvancements((current) => {
      const newAdvancements = [...current];
      newAdvancements[teamSlotIndex] = advancement;
      return newAdvancements;
    });
  };

  const value = {
    team,
    teamTitle,
    setTeamTitle,
    subSlots,
    subStars,
    perks,
    advancements,
    addHeroToTeam,
    removeHeroFromTeam,
    updateSubSlot,
    updatePerks,
    updateAdvancement,
    teamSize,
    changeTeamSize,
    MAX_TEAM_SLOTS,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};
