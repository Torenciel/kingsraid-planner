const T2_MAPPING = {
  Knight: [
    "experienced-fighter",
    "excellent-strategy",
    "battle-cry",
    "shield-of-protection",
    "swift-move",
  ],
  Warrior: [
    "opportune-strike",
    "warlike",
    "offensive-guard",
    "tactical-foresight",
    "blood-wrath",
  ],
  Assassin: [
    "target-weakness",
    "swift-and-nimble",
    "tactical-foresight",
    "opportune-strike",
    "vital-detection",
  ],
  Mechanic: [
    "target-weakness",
    "ready-cannons",
    "pressure-point",
    "special-bullet",
    "amplified-gunpowder",
  ],
  Archer: [
    "precision-shot",
    "eagle-eye",
    "mortal-wound",
    "opportune-strike",
    "concentration",
  ],
  Wizard: [
    "deception",
    "moral-rise",
    "blessing-of-mana",
    "circuit-burst",
    "destruction",
  ],
  Priest: [
    "vengeful-curse",
    "goddess-blessing",
    "inner-peace",
    "blessing-of-mana",
    "swiftness",
  ],
};

export function convertDBToTeamContext(dbTeam) {
  if (!dbTeam) return null;

  const size = dbTeam.teamSize || 4;

  const frontendTeam = Array(size).fill(null);
  const frontendSubSlots = Array(size)
    .fill(null)
    .map(() => Array(4).fill(null));
  const frontendSubStars = Array(size)
    .fill(null)
    .map(() => Array(4).fill(0));
  const frontendPerks = Array(size).fill(null);
  const frontendAdvancements = Array(size).fill(null);

  dbTeam.heroes?.forEach((heroConfig) => {
    const slotIndex = heroConfig.slotPosition;
    if (typeof slotIndex !== "number") return;

    frontendTeam[slotIndex] = {
      id: heroConfig.heroSlug,
      slug: heroConfig.heroSlug,
      name: heroConfig.heroSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      role: heroConfig.heroClass || null,
      image: null,
      infos: {},
    };

    if (heroConfig.uw) {
      frontendSubSlots[slotIndex][0] = { stars: heroConfig.uw.stars ?? 0 };
      frontendSubStars[slotIndex][0] = heroConfig.uw.stars ?? 0;
    } else {
      frontendSubSlots[slotIndex][0] = null;
      frontendSubStars[slotIndex][0] = 0;
    }

    let adv = heroConfig.sw?.advancement;
    if (![null, 0, 1, 2].includes(adv)) adv = null;
    frontendAdvancements[slotIndex] = adv;

    if (
      heroConfig.ut &&
      heroConfig.ut.choice !== null &&
      heroConfig.ut.choice !== undefined
    ) {
      frontendSubSlots[slotIndex][1] = { choice: heroConfig.ut.choice };
      frontendSubStars[slotIndex][1] = heroConfig.ut.stars ?? 0;
    } else {
      frontendSubSlots[slotIndex][1] = null;
      frontendSubStars[slotIndex][1] = 0;
    }

    if (heroConfig.artifact?.artifactSlug) {
      frontendSubSlots[slotIndex][2] = {
        artifactSlug: heroConfig.artifact.artifactSlug,
      };
      frontendSubStars[slotIndex][2] = heroConfig.artifact.stars || 0;
    }

    if (heroConfig.gearSet?.sets?.length > 0) {
      frontendSubSlots[slotIndex][3] = {
        gearSetSlug: heroConfig.gearSet.sets[0],
        sets: heroConfig.gearSet.sets,
        pieces: heroConfig.gearSet.pieces || 0,
      };
    }

    if (heroConfig.perks) {
      const heroClass = heroConfig.heroClass || "General";
      const classMapping = T2_MAPPING[heroClass] || [];
      const slugs = heroConfig.perks.t2?.selected || [];

      frontendPerks[slotIndex] = {
        t1: { selected: heroConfig.perks.t1?.selected || [] },
        t2: {
          selected: slugs
            .map((slug) => classMapping.indexOf(slug))
            .filter((index) => index !== -1),
        },
        t3: {
          s1: heroConfig.perks.t3?.s1 || null,
          s2: heroConfig.perks.t3?.s2 || null,
          s3: heroConfig.perks.t3?.s3 || null,
          s4: heroConfig.perks.t3?.s4 || null,
        },
        t5: heroConfig.perks.t5 || null,
      };
    } else {
      frontendPerks[slotIndex] = {
        t1: { selected: [] },
        t2: { selected: [] },
        t3: { s1: null, s2: null, s3: null, s4: null },
        t5: null,
      };
    }
  });

  return {
    id: dbTeam._id?.toString() || dbTeam.id,
    slug: dbTeam.slug,
    name: dbTeam.name,
    teamSize: size,
    team: frontendTeam,
    subSlots: frontendSubSlots,
    subStars: frontendSubStars,
    perks: frontendPerks,
    advancements: frontendAdvancements,
    isPublic: dbTeam.isPublic,
    gameMode: dbTeam.gameMode,
    tags: dbTeam.tags || [],
    createdAt: dbTeam.createdAt,
  };
}
