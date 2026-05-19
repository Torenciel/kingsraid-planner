import { useEffect, useState, useMemo, useRef } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useTeam } from "../../contexts/TeamContext";
import TeamSlot from "./TeamSlot";
import { sortTeamByPosition } from "../../utils/sortTeamByPosition";
import "./TeamSlots.css";

const TeamSlots = ({
  readOnly = false,
  teamOverride = null,
  subSlotsOverride = null,
  subStarsOverride = null,
  advancementsOverride = null,
  perksOverride = null,
}) => {
  const context = useTeam();
  const { openModal } = useModal();

  const team = teamOverride ?? context.team;
  const subSlots = subSlotsOverride ?? context.subSlots;
  const subStars = subStarsOverride ?? context.subStars;
  const advancements = advancementsOverride ?? context.advancements;
  const perks = perksOverride ?? context.perks;
  const removeHeroFromTeam = context.removeHeroFromTeam;

  const [artifactsData, setArtifactsData] = useState([]);
  const [heroesData, setHeroesData] = useState({});
  const [gearSetsData, setGearSetsData] = useState([]);
  const [imagesReady, setImagesReady] = useState(false);

  const gridRef = useRef(null);

  /* ===============================
     LOAD ARTIFACTS
  =============================== */
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

  /* ===============================
     LOAD GEARSETS
  =============================== */
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

  /* ===============================
     LOAD HERO METADATA (all at once on mount)
  =============================== */
  useEffect(() => {
    const loadHeroesData = async () => {
      try {
        const response = await fetch("http://localhost:3002/api/v2/heroes");
        if (!response.ok) return;
        const data = await response.json();
        const heroes = data.heroes || data;
        if (!Array.isArray(heroes)) return;
        // Wrap into { infos: { position, class } } to match what sortTeamByPosition expects
        const map = {};
        heroes.forEach((hero) => {
          const slug = hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-");
          if (slug) map[slug] = { ...hero, infos: { position: hero.position, class: hero.class } };
        });
        setHeroesData(map);
      } catch {}
    };
    loadHeroesData();
  }, []);

  const heroMap = useMemo(() => heroesData, [heroesData]);

  const isHeroMetaReady = useMemo(() => {
    const validHeroes = team.filter(Boolean);
    return validHeroes.every(hero => {
      const heroSlug =
        hero.slug ||
        hero.name?.toLowerCase().replace(/\s+/g, "-");
      return heroMap[heroSlug];
    });
  }, [team, heroMap]);

  const hydratedTeam = useMemo(() => {
    return team.map(hero => {
      if (!hero) return null;

      const heroSlug =
        hero.slug ||
        hero.name?.toLowerCase().replace(/\s+/g, "-");

      const meta = heroMap[heroSlug];

      return {
        ...hero,
        role:
          meta?.infos?.class ||
          meta?.class ||
          hero?.role ||
          null,
      };
    });
  }, [team, heroMap]);

  const sortedIndexes = useMemo(() => {
    if (!isHeroMetaReady) {
      return team.map((_, index) => index);
    }

    const teamWithMeta = hydratedTeam
      .map((hero, index) => {
        if (!hero) return null;
        return {
          heroSlug:
            hero.slug ||
            hero.name?.toLowerCase().replace(/\s+/g, "-"),
          slotPosition: index,
        };
      })
      .filter(Boolean);

    const sorted = sortTeamByPosition(teamWithMeta, heroMap);
    return sorted.map(item => item.slotPosition);
  }, [hydratedTeam, heroMap, team, isHeroMetaReady]);

  /* ===============================
     IMAGE LOAD DETECTION
  =============================== */
  useEffect(() => {
    if (!isHeroMetaReady) return;

    const grid = gridRef.current;
    if (!grid) return;

    const images = grid.querySelectorAll("img");

    if (images.length === 0) {
      setImagesReady(true);
      return;
    }

    let loaded = 0;

    const check = () => {
      loaded++;
      if (loaded === images.length) {
        setImagesReady(true);
      }
    };

    images.forEach(img => {
      if (img.complete) {
        check();
      } else {
        img.addEventListener("load", check);
        img.addEventListener("error", check);
      }
    });

  }, [isHeroMetaReady, sortedIndexes]);

  /* ===============================
     SUB SLOT CLICK (RESTORED)
  =============================== */
  const handleSubSlotClick = (teamSlotIndex, subSlotIndex) => {
    if (readOnly || !isHeroMetaReady) return;

    const hero = hydratedTeam[teamSlotIndex];
    if (!hero) return;

    const heroSlug =
      hero.slug ||
      hero.name?.toLowerCase().replace(/\s+/g, "-");

    const modalData = {
      teamSlotIndex,
      subSlotIndex,
      heroName: hero.name,
      heroSlug,
      currentItem: subSlots[teamSlotIndex]?.[subSlotIndex],
      currentStars: subStars[teamSlotIndex]?.[subSlotIndex] || 0,
      currentAdvancement: advancements[teamSlotIndex],
    };

    switch (subSlotIndex) {
      case 0: openModal("uw", modalData); break;
      case 1: openModal("ut", modalData); break;
      case 2: openModal("artifact", { ...modalData, artifacts: artifactsData }); break;
      case 3: openModal("gearset", { ...modalData, gearSets: gearSetsData }); break;
      default: break;
    }
  };

  const handlePerkClick = (teamSlotIndex) => {
    if (readOnly || !isHeroMetaReady) return;

    const hero = hydratedTeam[teamSlotIndex];
    if (!hero || !hero.role) return;

    const heroSlug =
      hero.slug ||
      hero.name?.toLowerCase().replace(/\s+/g, "-");

    openModal("perk", {
      teamSlotIndex,
      heroClass: hero.role,
      heroName: hero.name,
      heroSlug,
      currentPerks: perks[teamSlotIndex] || [],
    });
  };

  return (
    <div className="team-slots-container">
      {!imagesReady && (
        <div className="team-spinner-overlay">
          <div className="team-spinner" />
        </div>
      )}

      <div
        ref={gridRef}
        className={`team-slots-grid ${imagesReady ? "visible" : "hidden"}`}
      >
        {sortedIndexes.map(originalIndex => {
          const hero = hydratedTeam[originalIndex];
          if (!hero) return null;

          return (
            <TeamSlot
              key={originalIndex}
              hero={hero}
              teamSlotIndex={originalIndex}
              subSlots={subSlots[originalIndex]}
              subStars={subStars[originalIndex]}
              advancement={advancements[originalIndex] ?? null}
              perks={hero.role ? perks[originalIndex] || [] : []}
              readOnly={readOnly}
              onRemoveHero={readOnly ? null : removeHeroFromTeam}
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