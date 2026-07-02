import { useEffect, useState, useMemo, useRef } from "react";
import { useTeam } from "../../contexts/TeamContext";
import TeamSlot from "./TeamSlot";
import { sortTeamByPosition } from "../../utils/sortTeamByPosition";
import { API_BASE_URL } from "../../services/api";
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

  const team = teamOverride ?? context.team;
  const subSlots = subSlotsOverride ?? context.subSlots;
  const subStars = subStarsOverride ?? context.subStars;
  const advancements = advancementsOverride ?? context.advancements;
  const perks = perksOverride ?? context.perks;
  const removeHeroFromTeam = context.removeHeroFromTeam;

  const [heroesData, setHeroesData] = useState({});
  const [imagesReady, setImagesReady] = useState(false);

  const gridRef = useRef(null);

  /* ===============================
     LOAD HERO METADATA (all at once on mount)
  =============================== */
  useEffect(() => {
    const loadHeroesData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v2/heroes`);
        if (!response.ok) return;
        const data = await response.json();
        const heroes = data.heroes || data;
        if (!Array.isArray(heroes)) return;
        // Wrap into { infos: { position, class } } to match what sortTeamByPosition expects
        const map = {};
        heroes.forEach((hero) => {
          const slug =
            hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-");
          if (slug)
            map[slug] = {
              ...hero,
              infos: { position: hero.position, class: hero.class },
            };
        });
        setHeroesData(map);
      } catch {}
    };
    loadHeroesData();
  }, []);

  const heroMap = useMemo(() => heroesData, [heroesData]);

  const isHeroMetaReady = useMemo(() => {
    const validHeroes = team.filter(Boolean);
    return validHeroes.every((hero) => {
      const heroSlug =
        hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-");
      return heroMap[heroSlug];
    });
  }, [team, heroMap]);

  const hydratedTeam = useMemo(() => {
    return team.map((hero) => {
      if (!hero) return null;

      const heroSlug =
        hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-");

      const meta = heroMap[heroSlug];

      return {
        ...hero,
        role: meta?.infos?.class || meta?.class || hero?.role || null,
      };
    });
  }, [team, heroMap]);

  const sortedIndexes = useMemo(() => {
    const allIndexes = team.map((_, index) => index);

    if (!isHeroMetaReady) {
      return allIndexes;
    }

    const filledSlots = hydratedTeam
      .map((hero, index) => {
        if (!hero) return null;
        return {
          heroSlug: hero.slug || hero.name?.toLowerCase().replace(/\s+/g, "-"),
          slotPosition: index,
        };
      })
      .filter(Boolean);

    if (filledSlots.length === 0) {
      return allIndexes;
    }

    const sorted = sortTeamByPosition(filledSlots, heroMap);
    const sortedFilledIndexes = sorted.map((item) => item.slotPosition);
    const filledSet = new Set(sortedFilledIndexes);
    const emptyIndexes = allIndexes.filter((i) => !filledSet.has(i));
    return [...sortedFilledIndexes, ...emptyIndexes];
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

    images.forEach((img) => {
      if (img.complete) {
        check();
      } else {
        img.addEventListener("load", check);
        img.addEventListener("error", check);
      }
    });
  }, [isHeroMetaReady, sortedIndexes]);

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
        {sortedIndexes.map((originalIndex) => {
          const hero = hydratedTeam[originalIndex];

          return (
            <TeamSlot
              key={originalIndex}
              hero={hero}
              teamSlotIndex={originalIndex}
              subSlots={subSlots[originalIndex]}
              subStars={subStars[originalIndex]}
              advancement={advancements[originalIndex] ?? null}
              perks={hero?.role ? perks[originalIndex] || [] : []}
              readOnly={readOnly}
              onRemoveHero={readOnly ? null : removeHeroFromTeam}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TeamSlots;
