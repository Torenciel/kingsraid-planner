/**
 * Convertisseur entre TeamContext (frontend) et TeamSchema (MongoDB)
 * Version compatible avec advancements null/0/1/2
 */

const mongoose = require('mongoose');

const convertTeamContextToDB = (teamContext, teamName = "My Team", createdBy = "anonymous") => {
  const {
    team = [],
    subSlots = [],
    subStars = [],
    perks = [],
    advancements = [], // 🔥 Maintenant null/0/1/2
    teamSize = 4,
    teamTitle = "My Team"
  } = teamContext;

  console.log('🔧 teamConverter - convertTeamContextToDB - Début');
  console.log('- teamTitle:', teamTitle);
  console.log('- teamSize:', teamSize);
  console.log('- advancements:', advancements);
  console.log('- Type advancements[0]:', advancements[0] !== undefined ? typeof advancements[0] : 'undefined');

  const dbHeroes = [];

  for (let slotIndex = 0; slotIndex < teamSize; slotIndex++) {
    const hero = team[slotIndex];
    if (!hero) continue;

    const heroSlug = hero.slug || hero.id || hero.name?.toLowerCase().replace(/\s+/g, '-');

    const heroInfo = {
      name: hero.name || hero.infos?.name || "Unknown Hero",
      class: hero.class || hero.infos?.class || "Unknown",
      position: hero.position || hero.infos?.position || "Back",
      thumbnail: hero.thumbnail || hero.infos?.thumbnail || "/assets/heroes/default.png",
      slug: heroSlug
    };

    // UW (subSlots[0])
    const uwStars = subStars[slotIndex]?.[0] || 0;

    // UT (subSlots[1])
    const utItem = subSlots[slotIndex]?.[1];
    const utStars = subStars[slotIndex]?.[1] || 0;
    let utChoice = 0;
    if (utItem && utItem.id) {
      utChoice = parseInt(utItem.id) || 1;
    } else if (utItem && utItem.name) {
      const match = utItem.name.match(/UT(\d)/i);
      utChoice = match ? parseInt(match[1]) : 1;
    }

    // Artifact (subSlots[2])
    const artifactItem = subSlots[slotIndex]?.[2];
    const artifactStars = subStars[slotIndex]?.[2] || 0;

    // GearSet (subSlots[3])
    const gearSetItem = subSlots[slotIndex]?.[3];

    // Perks
    const heroPerks = perks[slotIndex];

    // 🔥 SW Advancement - Maintenant null/0/1/2 venant du frontend
    let swAdvancement = advancements[slotIndex];
    console.log(`  Slot ${slotIndex} - swAdvancement reçu:`, swAdvancement, 'type:', typeof swAdvancement);
    
    // Validation et nettoyage de l'avancement
    if (swAdvancement === undefined) {
      swAdvancement = null;
    } else if (typeof swAdvancement === 'string') {
      // Convertir les strings
      if (swAdvancement === "null" || swAdvancement === "none") {
        swAdvancement = null;
      } else if (["0", "1", "2"].includes(swAdvancement)) {
        swAdvancement = parseInt(swAdvancement);
      } else {
        console.warn(`  ⚠️ Valeur string invalide "${swAdvancement}", conversion en null`);
        swAdvancement = null;
      }
    } else if (typeof swAdvancement !== 'number' && swAdvancement !== null) {
      console.warn(`  ⚠️ Type invalide "${typeof swAdvancement}", conversion en null`);
      swAdvancement = null;
    } else if (swAdvancement !== null && ![0, 1, 2].includes(swAdvancement)) {
      console.warn(`  ⚠️ Valeur number invalide "${swAdvancement}", conversion en null`);
      swAdvancement = null;
    }
    
    console.log(`  Slot ${slotIndex} - swAdvancement nettoyé:`, swAdvancement, 'type:', typeof swAdvancement);

    // Construction de la configuration du héros
    const heroConfig = {
      heroSlug: heroSlug,
      slotPosition: slotIndex,
      heroInfo: heroInfo,
      
      uw: {
        stars: Math.max(0, Math.min(5, uwStars))
      },
      
      ut: {
        choice: Math.max(0, Math.min(4, utChoice)),
        stars: Math.max(0, Math.min(5, utStars))
      },
      
      // 🔥 SW avec advancement nettoyé
      sw: {
        advancement: swAdvancement
      },
      
      artifact: artifactItem ? {
        artifactSlug: artifactItem.artifactSlug,
        artifactInfo: {
          name: artifactItem.artifactInfo?.name || "Unknown Artifact",
          thumbnail: artifactItem.artifactInfo?.thumbnail || "/assets/artifacts/default.png",
          description: artifactItem.artifactInfo?.description || ""
        },
        stars: Math.max(0, Math.min(5, artifactStars)),
        level: 0
      } : {
        artifactSlug: null,
        artifactInfo: null,
        stars: 0,
        level: 0
      },
      
      gearSet: gearSetItem ? {
        gearSetSlug: gearSetItem.gearSetSlug,
        gearSetInfo: {
          name: gearSetItem.gearSetInfo?.name || "Unknown Gear Set",
          thumbnail: gearSetItem.gearSetInfo?.thumbnail || "/assets/gearsets/default.png",
          bonus2P: gearSetItem.gearSetInfo?.bonus2P || "",
          bonus4P: gearSetItem.gearSetInfo?.bonus4P || ""
        },
        pieces: gearSetItem.pieces || 0
      } : {
        gearSetSlug: null,
        gearSetInfo: null,
        pieces: 0
      },
      
      perks: heroPerks ? {
        t3: {
          s1: heroPerks.t3?.s1 || null,
          s2: heroPerks.t3?.s2 || null,
          s3: heroPerks.t3?.s3 || null,
          s4: heroPerks.t3?.s4 || null
        },
        t5: heroPerks.t5 || null
      } : {
        t3: { s1: null, s2: null, s3: null, s4: null },
        t5: null
      },
      
      transcendence: 0,
      notes: "",
      updatedAt: new Date()
    };

    console.log(`  Héros ${slotIndex} SW config:`, heroConfig.sw);
    dbHeroes.push(heroConfig);
  }

  const dbTeam = {
    name: teamTitle || teamName,
    description: "",
    teamSize: teamSize,
    heroes: dbHeroes,
    isPublic: false,
    createdBy: createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
    views: 0,
    likes: 0,
    saves: 0,
    tags: [],
    gameMode: 'other',
    authorNotes: '',
    formatVersion: 3
  };

  console.log('✅ teamConverter - Conversion terminée');
  console.log('  Nombre de héros:', dbHeroes.length);
  if (dbHeroes.length > 0) {
    console.log('  Premier héros SW:', dbHeroes[0]?.sw);
  }

  return dbTeam;
};

/**
 * Convertit DB -> TeamContext
 */
const convertDBToTeamContext = (teamDB) => {
  const teamSize = teamDB.teamSize || 4;
  
  // Initialiser les tableaux
  const team = Array(teamSize).fill(null);
  const subSlots = Array(teamSize).fill(null).map(() => Array(4).fill(null));
  const subStars = Array(teamSize).fill(null).map(() => Array(4).fill(0));
  const perks = Array(teamSize).fill(null);
  const advancements = Array(teamSize).fill(null);

  console.log('🔄 convertDBToTeamContext - Début');
  console.log('teamDB.heroes:', teamDB.heroes?.length || 0);

  // Remplir avec les données
  (teamDB.heroes || []).forEach(heroConfig => {
    const slotIndex = heroConfig.slotPosition;

    console.log(`  Traitement héros slot ${slotIndex}: ${heroConfig.heroSlug}`);
    console.log(`    SW advancement DB:`, heroConfig.sw?.advancement, 'type:', typeof heroConfig.sw?.advancement);

    // Héros
    team[slotIndex] = {
      id: heroConfig.heroSlug,
      slug: heroConfig.heroSlug,
      name: heroConfig.heroInfo?.name || "Unknown",
      class: heroConfig.heroInfo?.class || "Unknown",
      position: heroConfig.heroInfo?.position || "Back",
      thumbnail: heroConfig.heroInfo?.thumbnail || "/assets/heroes/default.png",
      infos: heroConfig.heroInfo || {}
    };

    // UW (slot 0)
    if (heroConfig.uw && heroConfig.uw.stars > 0) {
      subStars[slotIndex][0] = heroConfig.uw.stars;
    }

    // UT (slot 1)
    if (heroConfig.ut) {
      subSlots[slotIndex][1] = {
        choice: heroConfig.ut.choice || 0
      };
      subStars[slotIndex][1] = heroConfig.ut.stars || 0;
    }

    // SW Advancement (slot 2)
    if (heroConfig.sw) {
      let advancementValue = heroConfig.sw.advancement;
      
      // Nettoyer l'avancement pour le frontend
      if (advancementValue === undefined) {
        advancementValue = null;
      } else if (typeof advancementValue === 'string') {
        if (advancementValue === "null" || advancementValue === "none") {
          advancementValue = null;
        } else if (["0", "1", "2"].includes(advancementValue)) {
          advancementValue = parseInt(advancementValue);
        } else {
          console.warn(`    ⚠️ Valeur SW invalide en DB: "${advancementValue}", conversion en null`);
          advancementValue = null;
        }
      } else if (advancementValue !== null && ![0, 1, 2].includes(advancementValue)) {
        console.warn(`    ⚠️ Valeur SW invalide en DB: ${advancementValue}, conversion en null`);
        advancementValue = null;
      }
      
      advancements[slotIndex] = advancementValue;
      console.log(`    SW advancement nettoyé pour frontend:`, advancementValue);
    }

    // Artifact (slot 3 dans subSlots, mais slot 2 dans la DB)
    if (heroConfig.artifact?.artifactSlug) {
      subSlots[slotIndex][2] = {
        artifactSlug: heroConfig.artifact.artifactSlug,
        artifactInfo: heroConfig.artifact.artifactInfo || {
          name: "Unknown Artifact",
          thumbnail: "/assets/artifacts/default.png",
          description: ""
        },
        stars: heroConfig.artifact.stars || 0
      };
      subStars[slotIndex][2] = heroConfig.artifact.stars || 0;
    }

    // Gear Set (slot 4 dans subSlots, mais slot 3 dans la DB)
    if (heroConfig.gearSet?.gearSetSlug) {
      subSlots[slotIndex][3] = {
        gearSetSlug: heroConfig.gearSet.gearSetSlug,
        gearSetInfo: heroConfig.gearSet.gearSetInfo || {
          name: "Unknown Gear Set",
          thumbnail: "/assets/gearsets/default.png",
          bonus2P: "",
          bonus4P: ""
        },
        pieces: heroConfig.gearSet.pieces || 0
      };
    }

    // Perks
    if (heroConfig.perks) {
      perks[slotIndex] = {
        t3: heroConfig.perks.t3 || { s1: null, s2: null, s3: null, s4: null },
        t5: heroConfig.perks.t5 || null
      };
    }
  });

  const result = {
    team,
    teamTitle: teamDB.name || "My Team",
    teamSize,
    subSlots,
    subStars,
    perks,
    advancements
  };

  console.log('✅ convertDBToTeamContext - Conversion terminée');
  console.log('- advancements final:', result.advancements);
  console.log('- Type advancements[0]:', result.advancements[0] !== undefined ? typeof result.advancements[0] : 'undefined');

  return result;
};

/**
 * Fonction utilitaire pour convertir advancement pour l'affichage
 */
const convertAdvancementForDisplay = (advancement) => {
  if (advancement === null || advancement === undefined) return "none";
  
  switch(advancement) {
    case 0: return "blue";
    case 1: return "purple";
    case 2: return "red";
    default: return "none";
  }
};

/**
 * Fonction utilitaire pour convertir advancement depuis l'affichage
 */
const convertAdvancementFromDisplay = (advancement) => {
  if (advancement === null || advancement === undefined) return null;
  
  if (typeof advancement === 'number') {
    return [0, 1, 2, null].includes(advancement) ? advancement : null;
  }
  
  if (typeof advancement === 'string') {
    const mapping = {
      'none': null,
      'blue': 0,
      'purple': 1,
      'red': 2
    };
    return mapping[advancement.toLowerCase()] !== undefined ? mapping[advancement.toLowerCase()] : null;
  }
  
  return null;
};

/**
 * Trouve l'ObjectId d'un héros par son slug
 */
const findHeroIdBySlug = async (mongoose, heroSlug) => {
  try {
    const Hero = mongoose.model('Hero');
    const hero = await Hero.findOne({ slug: heroSlug })
      .select('_id infos.name infos.class infos.position infos.thumbnail slug');
    
    if (hero) {
      return {
        heroId: hero._id,
        heroInfo: {
          name: hero.infos?.name || "Unknown",
          class: hero.infos?.class || "Unknown",
          position: hero.infos?.position || "Back",
          thumbnail: hero.infos?.thumbnail || "/assets/heroes/default.png",
          slug: hero.slug
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding hero by slug:', error);
    return null;
  }
};

module.exports = {
  convertTeamContextToDB,
  convertDBToTeamContext,
  convertAdvancementForDisplay,
  convertAdvancementFromDisplay,
  findHeroIdBySlug
};