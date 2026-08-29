const convertTeamContextToDB = (
  teamContext,
  teamName = "My Team",
  createdBy = "anonymous"
) => {
  const {
    team = [],
    subSlots = [],
    subStars = [],
    perks = [],
    advancements = [],
    teamSize = 4,
    teamTitle = "My Team"
  } = teamContext;

  const dbHeroes = [];

  for (let slotIndex = 0; slotIndex < teamSize; slotIndex++) {
    const hero = team[slotIndex];
    if (!hero) continue;

    const heroSlug =
      hero.slug ||
      hero.id ||
      hero.name?.toLowerCase().replace(/\s+/g, "-");

    const heroClass = hero.class || hero.role || "General";

    const uwStars = subStars[slotIndex]?.[0] || 0;

    const utItem = subSlots[slotIndex]?.[1];
    const utStars = subStars[slotIndex]?.[1] || 0;

    let utChoice = 0;
    let utStarsValue = utStars;

    if (utItem) {
      if (utItem.choice !== undefined && utItem.choice !== null) {
        utChoice = parseInt(utItem.choice) || 0;
      } else if (utItem.id) {
        utChoice = parseInt(utItem.id) || 1;
      }

      if (utItem.stars !== undefined && utItem.stars !== null) {
        utStarsValue = parseInt(utItem.stars) || 0;
      }
    }

    const artifactItem = subSlots[slotIndex]?.[2];
    const artifactStars = subStars[slotIndex]?.[2] || 0;

    const gearSetItem = subSlots[slotIndex]?.[3];

    let gearSetConfig = {
      gearSetSlug: null,
      pieces: 0,
      isMultiSet: false,
      sets: []
    };

    if (gearSetItem) {
      if (gearSetItem.isMultiSet === true) {
        let setsArray = [];

        if (Array.isArray(gearSetItem.sets)) {
          if (typeof gearSetItem.sets[0] === "string") {
            setsArray = gearSetItem.sets.map(slug => ({
              slug,
              pieces: 2
            }));
          } else if (typeof gearSetItem.sets[0] === "object") {
            setsArray = gearSetItem.sets.map(set => ({
              slug: set.slug || set.gearSetSlug,
              pieces: set.pieces || 2
            }));
          }
        } else if (gearSetItem.set1Info && gearSetItem.set2Info) {
          setsArray = [
            { slug: gearSetItem.set1Info.slug, pieces: 2 },
            { slug: gearSetItem.set2Info.slug, pieces: 2 }
          ];
        }

        gearSetConfig = {
          gearSetSlug: null,
          pieces: null,
          isMultiSet: true,
          sets: setsArray
        };
      } else if (gearSetItem.gearSetSlug) {
        gearSetConfig = {
          isMultiSet: false,
          sets: [gearSetItem.gearSetSlug],
          pieces: gearSetItem.pieces || 0
        };
      }
    }

    let perksConfig = {
      t1: { selected: [] },
      t2: { selected: [] },
      t3: { s1: null, s2: null, s3: null, s4: null },
      t5: null
    };

    const heroPerks = perks[slotIndex];

    if (heroPerks) {

      const T2_MAPPING = {
        Knight: [
          "experienced-fighter",
          "excellent-strategy",
          "battle-cry",
          "shield-of-protection",
          "swift-move"
        ],
        Warrior: [
          "opportune-strike",
          "warlike",
          "offensive-guard",
          "tactical-foresight",
          "blood-wrath"
        ],
        Assassin: [
          "target-weakness",
          "swift-and-nimble",
          "tactical-foresight",
          "opportune-strike",
          "vital-detection"
        ],
        Mechanic: [
          "target-weakness",
          "ready-cannons",
          "pressure-point",
          "special-bullet",
          "amplified-gunpowder"
        ],
        Archer: [
          "precision-shot",
          "eagle-eye",
          "mortal-wound",
          "opportune-strike",
          "concentration"
        ],
        Wizard: [
          "deception",
          "moral-rise",
          "blessing-of-mana",
          "circuit-burst",
          "destruction"
        ],
        Priest: [
          "vengeful-curse",
          "goddess-blessing",
          "inner-peace",
          "blessing-of-mana",
          "swiftness"
        ]
      };

      const classMapping = T2_MAPPING[heroClass] || [];

      if (Array.isArray(heroPerks)) {

        const t1Slugs = [
          "atk-up",
          "hp-up",
          "def-up",
          "crit-resist-up",
          "monster-hunting"
        ];

        heroPerks.forEach(index => {
          if (index >= 0 && index < 5) {
            const slug = t1Slugs[index];
            if (slug && !perksConfig.t1.selected.includes(slug)) {
              perksConfig.t1.selected.push(slug);
            }
          }
        });

        heroPerks.forEach(index => {
          if (index >= 10 && index < 15) {
            const colIndex = index - 10;
            const slug = classMapping[colIndex];
            if (slug && !perksConfig.t2.selected.includes(slug)) {
              perksConfig.t2.selected.push(slug);
            }
          }
        });

        const t3Map = {
          20: { skill: "s1", type: "light" },
          21: { skill: "s1", type: "dark" },
          22: { skill: "s2", type: "light" },
          23: { skill: "s2", type: "dark" },
          30: { skill: "s3", type: "light" },
          31: { skill: "s3", type: "dark" },
          32: { skill: "s4", type: "light" },
          33: { skill: "s4", type: "dark" }
        };

        heroPerks.forEach(index => {
          const mapping = t3Map[index];
          if (mapping) {
            perksConfig.t3[mapping.skill] = mapping.type;
          }
        });

        heroPerks.forEach(index => {
          if (index === 40) perksConfig.t5 = "light";
          if (index === 41) perksConfig.t5 = "dark";
        });

      } else if (typeof heroPerks === "object") {

        if (heroPerks.t1) {
          perksConfig.t1.selected = Array.isArray(heroPerks.t1)
            ? heroPerks.t1
            : heroPerks.t1.selected || [];
        }

        if (heroPerks.t2) {

          const selectedColumns =
            Array.isArray(heroPerks.t2)
              ? heroPerks.t2
              : heroPerks.t2.selected || [];

          selectedColumns.forEach(col => {

            let columnIndex = col;

            if (typeof columnIndex === "number") {

              if (columnIndex >= 10) columnIndex -= 10;

              const slug = classMapping[columnIndex];

              if (slug && !perksConfig.t2.selected.includes(slug)) {
                perksConfig.t2.selected.push(slug);
              }

            }

          });
        }

        if (heroPerks.t3) {
          perksConfig.t3 = {
            s1: heroPerks.t3.s1 || null,
            s2: heroPerks.t3.s2 || null,
            s3: heroPerks.t3.s3 || null,
            s4: heroPerks.t3.s4 || null
          };
        }

        if (heroPerks.t5 !== undefined) {
          perksConfig.t5 = heroPerks.t5;
        }
      }
    }

    let swAdvancement = advancements[slotIndex];

    if (swAdvancement === undefined) {
      swAdvancement = null;
    } else if (typeof swAdvancement === "string") {
      if (swAdvancement === "null" || swAdvancement === "none") {
        swAdvancement = null;
      } else if (["0", "1", "2"].includes(swAdvancement)) {
        swAdvancement = parseInt(swAdvancement);
      } else {
        swAdvancement = null;
      }
    } else if (
      typeof swAdvancement !== "number" ||
      (swAdvancement !== null && ![0, 1, 2].includes(swAdvancement))
    ) {
      swAdvancement = null;
    }

    const uwItem = subSlots[slotIndex]?.[0];

    let uwConfig = null;

    if (uwItem !== null && uwItem !== undefined) {
      uwConfig = {
        stars: Math.max(0, Math.min(5, uwStars))
      };
    }

    let utConfig = null;

    if (utItem && utItem.choice !== undefined && utItem.choice !== null) {
      utConfig = {
        choice: Math.max(0, Math.min(4, parseInt(utItem.choice))),
        stars: Math.max(0, Math.min(5, utStarsValue))
      };
    }

    const heroConfig = {
      heroSlug,
      heroClass,
      slotPosition: slotIndex,
      uw: uwConfig,
      ut: utConfig,
      sw: { advancement: swAdvancement },
      artifact: artifactItem
        ? {
            artifactSlug: artifactItem.artifactSlug,
            stars: Math.max(0, Math.min(5, artifactStars))
          }
        : { artifactSlug: null, stars: 0 },
      gearSet: gearSetConfig,
      perks: perksConfig,
      updatedAt: new Date()
    };

    dbHeroes.push(heroConfig);
  }

  return {
    name: teamTitle || teamName,
    description: "",
    teamSize,
    heroes: dbHeroes,
    isPublic: teamContext.isPublic,
    createdBy,
    views: 0,
    upvotes: 0,
    bookmarks: 0,
    tags: (() => {
      const rawTags = Array.isArray(teamContext.tags) ? teamContext.tags : [];
      const parentMap = {
        wb_mountain: "wb", wb_protianus: "wb", wb_xanadus: "wb",
        raid_black: "raid", raid_fire: "raid", raid_frost: "raid", raid_poison: "raid",
        gc_lakreil: "gc", gc_tyrfas: "gc", gc_velkazar: "gc",
        gr_gushak: "gr", gr_lakreil: "gr", gr_manticore: "gr", gr_maviel: "gr",
        gr_nordik: "gr", gr_nubis: "gr", gr_tyrfas: "gr", gr_Xakios: "gr",
        trial_imet: "trial", trial_musama: "trial", trial_sekmaha: "trial",
        devourer_shakmeh: "shakmeh", otherworldly_shakmeh: "shakmeh",
        story_ch1: "story", story_ch2: "story", story_ch3: "story",
        league_of_victory: "pvp", league_of_honor: "pvp",
        other_farming: "other", other_event: "other",
      };
      const tagSet = new Set(rawTags);
      rawTags.forEach((tag) => {
        const parent = parentMap[tag];
        if (parent) tagSet.add(parent);
      });
      return [...tagSet];
    })(),
    authorNotes: "",
    formatVersion: 3
  };
};

module.exports = {
  convertTeamContextToDB
};