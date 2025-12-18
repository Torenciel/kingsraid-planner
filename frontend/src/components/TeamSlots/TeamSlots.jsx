import { useEffect, useState } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useTeam } from "../../contexts/TeamContext";
import TeamSlot from "./TeamSlot";
import "./TeamSlots.css";

const TeamSlots = () => {
  const {
    team,
    subSlots,
    subStars,
    advancements,
    perks,
    removeHeroFromTeam,
    MAX_TEAM_SLOTS,
  } = useTeam();
  const { openModal } = useModal();

  const [artifactsData, setArtifactsData] = useState([]);
  const [heroesData, setHeroesData] = useState({});
  const [gearSetsData, setGearSetsData] = useState([]);

  // Charger les données des artifacts
  useEffect(() => {
    const loadArtifactsData = async () => {
      try {
        const response = await fetch(
          "/kingsraid-data/table-data/artifacts.json"
        );
        const data = await response.json();
        setArtifactsData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des artifacts:", error);
      }
    };
    loadArtifactsData();
  }, []);

  // Charger les données des GearSets
  useEffect(() => {
    const loadGearSetsData = async () => {
      try {
        const response = await fetch(
          "/kingsraid-data/table-data/gearsets.json"
        );
        const data = await response.json();
        setGearSetsData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des gearsets:", error);
      }
    };
    loadGearSetsData();
  }, []);

  // Charger les données des héros de l'équipe
  useEffect(() => {
    const loadHeroesData = async () => {
      const loadedHeroesData = {};

      // Filtrer uniquement les héros non-null
      const validHeroes = team.filter((hero) => hero !== null);

      for (const hero of validHeroes) {
        if (hero && !heroesData[hero.name]) {
          try {
            const response = await fetch(
              `/kingsraid-data/table-data/heroes/${hero.name}.json`
            );
            const data = await response.json();
            loadedHeroesData[hero.name] = data;
          } catch (error) {
            console.error(
              `Erreur lors du chargement des données de ${hero.name}:`,
              error
            );
          }
        }
      }

      if (Object.keys(loadedHeroesData).length > 0) {
        setHeroesData((prev) => ({ ...prev, ...loadedHeroesData }));
      }
    };

    loadHeroesData();
  }, [team]);

  const handleSubSlotClick = (teamSlotIndex, subSlotIndex) => {
    const hero = team[teamSlotIndex];
    if (!hero) {
      alert("Please add a hero to this slot first!");
      return;
    }

    const modalData = {
      teamSlotIndex,
      subSlotIndex,
      heroName: hero.name,
      currentItem: subSlots[teamSlotIndex]?.[subSlotIndex],
      currentStars: subStars[teamSlotIndex]?.[subSlotIndex] || 0,
      currentAdvancement: advancements[teamSlotIndex] || "none",
    };

    switch (subSlotIndex) {
      case 0: // UW
        openModal("uw", modalData);
        break;
      case 1: // UT
        openModal("ut", modalData);
        break;
      case 2: // Artifact
        openModal("artifact", modalData);
        break;
      case 3: // GearSet
        openModal("gearset", modalData);
        break;
      default:
        break;
    }
  };

  const handlePerkClick = (teamSlotIndex) => {
    const hero = team[teamSlotIndex];
    if (!hero) {
      alert("Please add a hero to this slot first!");
      return;
    }

    const modalData = {
      teamSlotIndex,
      heroClass: hero.role,
      heroName: hero.name,
      currentPerks: perks[teamSlotIndex] || [],
    };

    openModal("perk", modalData);
  };

  // Debug log
  // console.log("TeamSlots - Rendering with team:", team);
  // console.log("TeamSlots - team length:", team?.length);
  // console.log("TeamSlots - subSlots:", subSlots);
  // console.log("TeamSlots - subStars:", subStars);

  // Vérification que team est un tableau
  if (!Array.isArray(team)) {
    console.error("Team is not an array:", team);
    return (
      <div className="team-slots-container">
        <div className="text-red-500 p-4">
          Error: Team data is not an array. Please check TeamContext.
        </div>
      </div>
    );
  }

  return (
    <div className="team-slots-container">
      <div className="team-slots-grid" id="team-slots">
        {team.map((hero, index) => {
          // console.log(`Rendering slot ${index}:`, hero);
          return (
            <TeamSlot
              key={index}
              hero={hero}
              teamSlotIndex={index}
              subSlots={subSlots[index]} // Passer tout le tableau de sous-slots pour ce slot
              subStars={subStars[index]} // Passer tout le tableau d'étoiles pour ce slot
              advancement={advancements[index] || "none"}
              perks={perks[index] || []}
              artifactsData={artifactsData}
              heroesData={heroesData}
              gearSetsData={gearSetsData}
              onRemoveHero={removeHeroFromTeam}
              onSubSlotClick={handleSubSlotClick}
              onPerkClick={handlePerkClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TeamSlots;
