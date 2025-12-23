// backend/src/utils/teamConverter.js
/**
 * Convertisseur entre TeamContext (frontend) et TeamSchema (MongoDB)
 * Version corrigée pour gérer les slugs des héros
 */

/**
 * Convertit TeamContext -> format DB
 * hero.id dans TeamContext = slug ("aisha"), pas ObjectId
 */

const mongoose = require('mongoose');

const convertTeamContextToDB = (teamContext, teamName = "My Team", createdBy = "anonymous") => {
  const {
    team = [],           // [hero1, hero2, hero3, hero4] où hero = {id: "aisha", name: "Aisha", ...}
    subSlots = [],       // Array(slots)[Array(4)]
    subStars = [],       // Même structure
    perks = [],          // Array(slots)
    advancements = [],
    teamSize = 4,
    teamTitle = "My Team"
  } = teamContext;

  const dbHeroes = [];

  for (let slotIndex = 0; slotIndex < teamSize; slotIndex++) {
    const hero = team[slotIndex];
    if (!hero) continue;

    // IMPORTANT: hero.id dans TeamContext est le slug ("aisha"), pas l'ObjectId
    // On va stocker le slug, et le middleware pre-save convertira en ObjectId
    const heroSlug = hero.slug || hero.id || hero.name?.toLowerCase().replace(/\s+/g, '-');

    // S'assurer que heroInfo a tous les champs requis
    const heroInfo = {
      name: hero.name || hero.infos?.name || "Unknown Hero",
      class: hero.class || hero.infos?.class || "Unknown",
      position: hero.position || hero.infos?.position || "Back",
      thumbnail: hero.thumbnail || hero.infos?.thumbnail || "/assets/heroes/default.png",
      slug: heroSlug
    };

    // UW (subSlots[0])
    const uwItem = subSlots[slotIndex]?.[0];
    const uwStars = subStars[slotIndex]?.[0] || 0;

    // UT (subSlots[1])
    const utItem = subSlots[slotIndex]?.[1];
    const utStars = subStars[slotIndex]?.[1] || 0;
    let utChoice = 0;
    if (utItem && utItem.id) {
      utChoice = parseInt(utItem.id) || 1;
    } else if (utItem && utItem.name) {
      // Essayer d'extraire le numéro de "UT1", "UT2", etc.
      const match = utItem.name.match(/UT(\d)/i);
      utChoice = match ? parseInt(match[1]) : 1;
    }

    // Artifact (subSlots[2])
 const artifactItem = subSlots[slotIndex]?.[2];
  const artifactStars = subStars[slotIndex]?.[2] || 0;
  
  let artifactId = null;
  let artifactInfo = null;
  
  if (artifactItem) {
    // 🔥 CORRECTION: Convertir string en ObjectId mongoose
    if (artifactItem._id && mongoose.Types.ObjectId.isValid(artifactItem._id)) {
      artifactId = new mongoose.Types.ObjectId(artifactItem._id);
    } else if (artifactItem.id && mongoose.Types.ObjectId.isValid(artifactItem.id)) {
      artifactId = new mongoose.Types.ObjectId(artifactItem.id);
    }
    
    artifactInfo = {
      name: artifactItem.name || artifactItem._name || "Unknown Artifact",
      thumbnail: artifactItem.thumbnail || artifactItem._thumbnail || "/assets/artifacts/default.png",
      description: artifactItem.description || artifactItem._description || ""
    };
  }
    // GearSet (subSlots[3])
 const gearSetItem = subSlots[slotIndex]?.[3];
  
  let gearSetId = null;
  let gearSetInfo = null;
  
  if (gearSetItem) {
    // 🔥 CORRECTION: Deux possibilités
    if (gearSetItem._id && mongoose.Types.ObjectId.isValid(gearSetItem._id)) {
      // Si c'est un ObjectId (depuis la DB)
      gearSetId = new mongoose.Types.ObjectId(gearSetItem._id);
    } else if (gearSetItem.id) {
      // Sinon garder comme string (ex: "beast_of_chaos")
      gearSetId = gearSetItem.id;
    }
    
    gearSetInfo = {
      id: gearSetItem.id || gearSetItem._id || "unknown",
      name: gearSetItem.name || gearSetItem._name || "Unknown Gear Set",
      image: gearSetItem.image || gearSetItem._image || "/assets/gearsets/default.png",
      bonus2P: gearSetItem.bonus2P || gearSetItem._bonus2P || "",
      bonus4P: gearSetItem.bonus4P || gearSetItem._bonus4P || ""
    };
  }
    // Perks
    const heroPerks = perks[slotIndex];

    // SW Advancement
    const swAdvancement = advancements[slotIndex] || "none";

    // Construction de la configuration du héros
    const heroConfig = {
      // Stocker le slug pour la recherche
      heroSlug: heroSlug,
      // heroId sera rempli par le middleware pre-save
      heroId: null,
      
      slotPosition: slotIndex,
      heroInfo: heroInfo,
      
      // UW
      uw: {
        stars: Math.max(0, Math.min(5, uwStars)) // 0-5 étoiles
      },
      
      // UT
      ut: {
        choice: Math.max(0, Math.min(4, utChoice)), // 0-4
        stars: Math.max(0, Math.min(5, utStars)),
        enhancement: 0
      },
      
      // SW
      sw: {
        advancement: ["none", "blue", "purple", "red"].includes(swAdvancement) 
          ? swAdvancement 
          : "none",
        level: 0
      },
      
      // Artifact
      artifact: {
        artifactId: artifactItem?.id || null,
        artifactInfo: artifactItem ? {
          name: artifactItem.name || "Unknown Artifact",
          thumbnail: artifactItem.thumbnail || "/assets/artifacts/default.png",
          description: artifactItem.description || ""
        } : null,
        stars: Math.max(0, Math.min(5, artifactStars)),
        level: 0
      },
      
      // GearSet
      gearSet: {
        gearSetId: gearSetItem?.id || null,
        gearSetInfo: gearSetItem ? {
          id: gearSetItem.id || gearSetItem.name?.toLowerCase().replace(/\s+/g, '_') || "unknown",
          name: gearSetItem.name || "Unknown Gear Set",
          image: gearSetItem.image || "/assets/gearsets/default.png",
          bonus2P: gearSetItem.bonus2P || "",
          bonus4P: gearSetItem.bonus4P || ""
        } : null,
        pieces: gearSetItem ? 4 : 0
      },
      
      // Perks
      perks: {
        t3: {
          s1: heroPerks?.s1 || null,
          s2: heroPerks?.s2 || null,
          s3: heroPerks?.s3 || null,
          s4: heroPerks?.s4 || null
        },
        t5: heroPerks?.t5 || null
      },
      
      transcendence: 0,
      notes: "",
      updatedAt: new Date()
    };

    dbHeroes.push(heroConfig);
  }

  // Retourner l'objet équipe complet
  return {
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
    formatVersion: 2
  };
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
  const advancements = Array(teamSize).fill("none");

  // Remplir avec les données
  (teamDB.heroes || []).forEach(heroConfig => {
    const slotIndex = heroConfig.slotPosition;

    // Héros
    team[slotIndex] = {
      id: heroConfig.heroId?.toString() || heroConfig.heroSlug,
      name: heroConfig.heroInfo.name,
      class: heroConfig.heroInfo.class,
      position: heroConfig.heroInfo.position,
      thumbnail: heroConfig.heroInfo.thumbnail,
      slug: heroConfig.heroInfo.slug || heroConfig.heroSlug
    };

    // UW
    if (heroConfig.uw && heroConfig.uw.stars > 0) {
      subSlots[slotIndex][0] = {
        type: 'uw',
        name: 'Unique Weapon',
        stars: heroConfig.uw.stars
      };
      subStars[slotIndex][0] = heroConfig.uw.stars;
    }

    // UT
    if (heroConfig.ut && heroConfig.ut.choice > 0) {
      subSlots[slotIndex][1] = {
        type: 'ut',
        id: heroConfig.ut.choice,
        name: `UT${heroConfig.ut.choice}`,
        stars: heroConfig.ut.stars
      };
      subStars[slotIndex][1] = heroConfig.ut.stars;
    }

    // Artifact
    if (heroConfig.artifact && heroConfig.artifact.artifactId) {
      subSlots[slotIndex][2] = {
        type: 'artifact',
        id: heroConfig.artifact.artifactId,
        name: heroConfig.artifact.artifactInfo?.name,
        thumbnail: heroConfig.artifact.artifactInfo?.thumbnail,
        description: heroConfig.artifact.artifactInfo?.description,
        stars: heroConfig.artifact.stars
      };
      subStars[slotIndex][2] = heroConfig.artifact.stars;
    }

    // GearSet
    if (heroConfig.gearSet && heroConfig.gearSet.gearSetId) {
      subSlots[slotIndex][3] = {
        type: 'gearset',
        id: heroConfig.gearSet.gearSetId,
        name: heroConfig.gearSet.gearSetInfo?.name,
        image: heroConfig.gearSet.gearSetInfo?.image,
        bonus2P: heroConfig.gearSet.gearSetInfo?.bonus2P,
        bonus4P: heroConfig.gearSet.gearSetInfo?.bonus4P
      };
    }

    // SW Advancement
    if (heroConfig.sw) {
      advancements[slotIndex] = heroConfig.sw.advancement || "none";
    }

    // Perks
    if (heroConfig.perks) {
      perks[slotIndex] = {
        s1: heroConfig.perks.t3?.s1,
        s2: heroConfig.perks.t3?.s2,
        s3: heroConfig.perks.t3?.s3,
        s4: heroConfig.perks.t3?.s4,
        t5: heroConfig.perks.t5
      };
    }
  });

  return {
    team,
    teamTitle: teamDB.name || "My Team",
    teamSize,
    subSlots,
    subStars,
    perks,
    advancements
  };
};

/**
 * Trouve l'ObjectId d'un héros par son slug
 * Utilisé par le middleware pre-save
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
          name: hero.infos.name,
          class: hero.infos.class,
          position: hero.infos.position,
          thumbnail: hero.infos.thumbnail,
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
  findHeroIdBySlug
};