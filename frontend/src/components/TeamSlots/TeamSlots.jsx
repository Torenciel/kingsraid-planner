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

  // Charger les données des artifacts depuis MongoDB
  useEffect(() => {
    const loadArtifactsData = async () => {
      try {
        const response = await fetch("http://localhost:3002/api/v2/artifacts");
        const data = await response.json();
        setArtifactsData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des artifacts:", error);
      }
    };
    loadArtifactsData();
  }, []);

  // Charger les données des GearSets depuis MongoDB
  useEffect(() => {
    const loadGearSetsData = async () => {
      try {
        const response = await fetch("http://localhost:3002/api/v2/gearsets");
        const data = await response.json();
        setGearSetsData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des gearsets:", error);
      }
    };
    loadGearSetsData();
  }, []);

  // 🆕 CHARGER LES DONNÉES DES HÉROS DEPUIS MONGODB (compatible overlay)
  useEffect(() => {
    const loadHeroesData = async () => {
      const loadedHeroesData = {};
      const validHeroes = team.filter((hero) => hero !== null);

      for (const hero of validHeroes) {
        if (hero && !heroesData[hero.name]) {
          try {
            // Essayer MongoDB d'abord
            const heroSlug = hero.name.toLowerCase().replace(/\s+/g, '-');
            const mongoResponse = await fetch(
              `http://localhost:3002/api/v2/heroes/${heroSlug}`
            );
            
            if (mongoResponse.ok) {
              const mongoData = await mongoResponse.json();
              
              // 🎯 TRANSFORMER LES DONNÉES MONGODB EN FORMAT COMPATIBLE OVERLAY
              // L'overlay attend: { uw: { name, description, value }, uts: { ... }, sw: { ... } }
              // MongoDB a: { uw: { name, description, value }, uts: { ... }, sw: { ... } } → MÊME STRUCTURE !
              // Donc on peut utiliser directement les données MongoDB
              loadedHeroesData[hero.name] = mongoData;
              
              console.log(`✅ Héros ${hero.name} chargé depuis MongoDB`);
            } else {
              // Fallback vers JSON si MongoDB échoue
              throw new Error("MongoDB non disponible");
            }
            
          } catch (mongoError) {
            console.log(`🔄 Fallback JSON pour ${hero.name}`);
            try {
              const jsonResponse = await fetch(
                `/kingsraid-data/table-data/heroes/${hero.name}.json`
              );
              if (jsonResponse.ok) {
                const jsonData = await jsonResponse.json();
                loadedHeroesData[hero.name] = jsonData;
              }
            } catch (jsonError) {
              console.error(`Erreur pour ${hero.name}:`, jsonError);
            }
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
      heroSlug: hero.name.toLowerCase().replace(/\s+/g, '-'), // 🆕 AJOUTÉ pour les modals
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
        openModal("artifact", {
          ...modalData,
          artifacts: artifactsData // Passer les données pour le modal
        });
        break;
      case 3: // GearSet
        openModal("gearset", {
          ...modalData,
          gearSets: gearSetsData // Passer les données pour le modal
        });
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
      heroSlug: hero.name.toLowerCase().replace(/\s+/g, '-'), // 🆕 AJOUTÉ
      currentPerks: perks[teamSlotIndex] || [],
    };

    openModal("perk", modalData);
  };

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
          return (
            <TeamSlot
              key={index}
              hero={hero}
              teamSlotIndex={index}
              subSlots={subSlots[index]}
              subStars={subStars[index]}
              advancement={advancements[index] || "none"}
              perks={perks[index] || []}
              artifactsData={artifactsData}
              heroesData={heroesData} // 🎯 MÊME NOM, MÊME STRUCTURE
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