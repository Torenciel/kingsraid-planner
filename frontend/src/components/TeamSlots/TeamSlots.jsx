import { useEffect, useState, useMemo } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useTeam } from "../../contexts/TeamContext";
import TeamSlot from "./TeamSlot";
import { sortTeamByPosition } from "../../utils/sortTeamByPosition";
import "./TeamSlots.css";

const TeamSlots = () => {
  const {
    team,
    subSlots,
    subStars,
    advancements,
    perks,
    removeHeroFromTeam,
  } = useTeam();

  const { openModal } = useModal();

  const [artifactsData, setArtifactsData] = useState([]);
  const [heroesData, setHeroesData] = useState({});
  const [gearSetsData, setGearSetsData] = useState([]);

  // Load artifacts
  useEffect(() => {
    const loadArtifactsData = async () => {
      try {
        const response = await fetch("http://localhost:3002/api/v2/artifacts");
        const data = await response.json();
        setArtifactsData(Array.isArray(data) ? data : []);
      } catch {
        setArtifactsData([]);
      }
    };

    loadArtifactsData();
  }, []);

  // Load gear sets
  useEffect(() => {
    const loadGearSetsData = async () => {
      try {
        const response = await fetch("http://localhost:3002/api/v2/gearsets");
        const data = await response.json();
        setGearSetsData(Array.isArray(data) ? data : []);
      } catch {
        setGearSetsData([]);
      }
    };

    loadGearSetsData();
  }, []);

  // Load hero metadata (for position)
  useEffect(() => {
    const loadHeroesData = async () => {
      const loadedHeroesData = {};
      const validHeroes = team.filter((hero) => hero !== null);

      for (const hero of validHeroes) {
        if (hero && !heroesData[hero.name]) {
          try {
            const heroSlug = hero.name.toLowerCase().replace(/\s+/g, "-");
            const response = await fetch(
              `http://localhost:3002/api/v2/heroes/${heroSlug}`
            );

            if (response.ok) {
              const data = await response.json();
              loadedHeroesData[heroSlug] = data.hero;
            }
          } catch {
            // silent
          }
        }
      }

      if (Object.keys(loadedHeroesData).length > 0) {
        setHeroesData((prev) => ({
          ...prev,
          ...loadedHeroesData,
        }));
      }
    };

    loadHeroesData();
  }, [team]);

  // Build hero metadata map for sorting
  const heroMap = useMemo(() => {
    return heroesData;
  }, [heroesData]);

  // Build sortable array (DO NOT mutate team)
  const sortedIndexes = useMemo(() => {
    const teamWithMeta = team
      .map((hero, index) => {
        if (!hero) return null;

        return {
          heroSlug: hero.slug || hero.name.toLowerCase().replace(/\s+/g, "-"),
          slotPosition: index,
        };
      })
      .filter(Boolean);

    const sorted = sortTeamByPosition(teamWithMeta, heroMap);

    return sorted.map((item) => item.slotPosition);
  }, [team, heroMap]);

  const handleSubSlotClick = (teamSlotIndex, subSlotIndex) => {
    const hero = team[teamSlotIndex];
    if (!hero) {
      alert("Please add a hero to this slot first.");
      return;
    }

    const modalData = {
      teamSlotIndex,
      subSlotIndex,
      heroName: hero.name,
      heroSlug: hero.name.toLowerCase().replace(/\s+/g, "-"),
      currentItem: subSlots[teamSlotIndex]?.[subSlotIndex],
      currentStars: subStars[teamSlotIndex]?.[subSlotIndex] || 0,
      currentAdvancement: advancements[teamSlotIndex],
    };

    switch (subSlotIndex) {
      case 0:
        openModal("uw", modalData);
        break;
      case 1:
        openModal("ut", modalData);
        break;
      case 2:
        openModal("artifact", { ...modalData, artifacts: artifactsData });
        break;
      case 3:
        openModal("gearset", { ...modalData, gearSets: gearSetsData });
        break;
      default:
        break;
    }
  };

  const handlePerkClick = (teamSlotIndex) => {
    const hero = team[teamSlotIndex];
    if (!hero) {
      alert("Please add a hero to this slot first.");
      return;
    }

    openModal("perk", {
      teamSlotIndex,
      heroClass: hero.role,
      heroName: hero.name,
      heroSlug: hero.name.toLowerCase().replace(/\s+/g, "-"),
      currentPerks: perks[teamSlotIndex] || [],
    });
  };

  if (!Array.isArray(team)) {
    return (
      <div className="team-slots-container">
        <div className="text-red-500 p-4">
          Error: Team data is not an array.
        </div>
      </div>
    );
  }

  return (
    <div className="team-slots-container">
      <div className="team-slots-grid" id="team-slots">
        {sortedIndexes.map((originalIndex) => (
          <TeamSlot
            key={originalIndex}
            hero={team[originalIndex]}
            teamSlotIndex={originalIndex}
            subSlots={subSlots[originalIndex]}
            subStars={subStars[originalIndex]}
            advancement={advancements[originalIndex] ?? null}
            perks={perks[originalIndex] || []}
            onRemoveHero={removeHeroFromTeam}
            onSubSlotClick={handleSubSlotClick}
            onPerkClick={handlePerkClick}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamSlots;
