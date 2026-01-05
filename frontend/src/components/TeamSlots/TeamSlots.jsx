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
        
        let artifactsArray = [];
        
        if (Array.isArray(data)) {
          artifactsArray = data;
        } else if (data && typeof data === 'object') {
          if (data._id) {
            artifactsArray = [data];
          } else {
            artifactsArray = Object.values(data).filter(item => item !== null);
          }
        }
        
        setArtifactsData(artifactsArray);
        
      } catch (error) {
        console.error("Erreur lors du chargement des artifacts:", error);
        setArtifactsData([]);
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
            const heroSlug = hero.name.toLowerCase().replace(/\s+/g, '-');
            const mongoResponse = await fetch(
              `http://localhost:3002/api/v2/heroes/${heroSlug}`
            );
            
            if (mongoResponse.ok) {
              const mongoData = await mongoResponse.json();
              loadedHeroesData[hero.name] = mongoData;
              console.log(`✅ Héros ${hero.name} chargé depuis MongoDB`);
            } else {
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
      heroSlug: hero.name.toLowerCase().replace(/\s+/g, '-'),
      currentItem: subSlots[teamSlotIndex]?.[subSlotIndex],
      currentStars: subStars[teamSlotIndex]?.[subSlotIndex] || 0,
      // 🔥 CORRECTION : Passer la valeur telle quelle (null/0/1/2)
      currentAdvancement: advancements[teamSlotIndex],
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
          artifacts: artifactsData
        });
        break;
      case 3: // GearSet
        openModal("gearset", {
          ...modalData,
          gearSets: gearSetsData
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
      heroSlug: hero.name.toLowerCase().replace(/\s+/g, '-'),
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
              // 🔥 CORRECTION : Utiliser ?? null au lieu de || "none"
              advancement={advancements[index] ?? null}
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