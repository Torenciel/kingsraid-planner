const convertTeamContextToDB = (teamContext, teamName = "My Team", createdBy = "anonymous") => {
  const {
    team = [],
    subSlots = [],
    subStars = [],
    perks = [],
    advancements = [],
    teamSize = 4,
    teamTitle = "My Team"
  } = teamContext;

  console.log('🔧 teamConverter - convertTeamContextToDB - Début');
  console.log('- teamTitle:', teamTitle);
  console.log('- teamSize:', teamSize);
  console.log('- advancements:', advancements);
  console.log('- perks reçus:', perks);

  const dbHeroes = [];

  for (let slotIndex = 0; slotIndex < teamSize; slotIndex++) {
    const hero = team[slotIndex];
    if (!hero) continue;

    const heroSlug = hero.slug || hero.id || hero.name?.toLowerCase().replace(/\s+/g, '-');
    const heroClass = hero.class || 'General';
    const heroName = hero.name;

    // UW (subSlots[0])
    const uwStars = subStars[slotIndex]?.[0] || 0;

    // UT (subSlots[1])
    const utItem = subSlots[slotIndex]?.[1];
    const utStars = subStars[slotIndex]?.[1] || 0;

    console.log(`🔍 Slot ${slotIndex} - UT Item:`, utItem);
    console.log(`🔍 Slot ${slotIndex} - UT Stars from subStars:`, utStars);

    let utChoice = 0;
    let utStarsValue = utStars;

    if (utItem) {
      if (utItem.choice !== undefined && utItem.choice !== null) {
        utChoice = parseInt(utItem.choice) || 0;
        console.log(`✅ UT choice trouvé: ${utChoice}`);
      }
      else if (utItem.id) {
        utChoice = parseInt(utItem.id) || 1;
        console.log(`🔄 UT choice depuis id: ${utChoice}`);
      }
      
      if (utItem.stars !== undefined && utItem.stars !== null) {
        utStarsValue = parseInt(utItem.stars) || 0;
        console.log(`✅ UT stars depuis utItem.stars: ${utStarsValue}`);
      }
    }

    console.log(`🎯 Slot ${slotIndex} - UT config finale:`, {
      choice: utChoice,
      stars: utStarsValue
    });

    // Artifact (subSlots[2])
    const artifactItem = subSlots[slotIndex]?.[2];
    const artifactStars = subStars[slotIndex]?.[2] || 0;

    // 🔥 GearSet (subSlots[3])
    const gearSetItem = subSlots[slotIndex]?.[3];

    console.log(`🔧 Slot ${slotIndex} - GearSet Item reçu:`, gearSetItem);

    // Gestion GearSet (single et multi-set)
    let gearSetConfig = {
      gearSetSlug: null,
      pieces: 0,
      isMultiSet: false,
      sets: []
    };

    if (gearSetItem) {
      // 🔥 CAS 1: Multi-set
      if (gearSetItem.isMultiSet === true) {
        console.log(`✅ Multi-set détecté:`, gearSetItem);
        
        let setsArray = [];
        
        // Détecter le format des sets
        if (Array.isArray(gearSetItem.sets)) {
          // Format 1: ["fire-dragon", "dark-legion"] (strings)
          if (typeof gearSetItem.sets[0] === 'string') {
            setsArray = gearSetItem.sets.map(slug => ({
              slug: slug,
              pieces: 2
            }));
          }
          // Format 2: [{slug: "...", pieces: 2}, ...] (objets)
          else if (typeof gearSetItem.sets[0] === 'object') {
            setsArray = gearSetItem.sets.map(set => ({
              slug: set.slug || set.gearSetSlug,
              pieces: set.pieces || 2
            }));
          }
        }
        // Format 3: set1Info + set2Info
        else if (gearSetItem.set1Info && gearSetItem.set2Info) {
          setsArray = [
            { slug: gearSetItem.set1Info.slug, pieces: 2 },
            { slug: gearSetItem.set2Info.slug, pieces: 2 }
          ];
        }
        
        // Construire la config
        gearSetConfig = {
          gearSetSlug: null,      // null pour multi-set
          pieces: null,           // null (valeur dans sets)
          isMultiSet: true,
          sets: setsArray
        };
        
        console.log(`✅ Multi-set configuré:`, gearSetConfig);
      }
      // 🔥 CAS 2: Single set
      else if (gearSetItem.gearSetSlug) {
        console.log(`✅ Single set détecté: ${gearSetItem.gearSetSlug} (${gearSetItem.pieces || 0} pieces)`);
        
        gearSetConfig = {
          gearSetSlug: gearSetItem.gearSetSlug,
          pieces: gearSetItem.pieces || 0,
          isMultiSet: false,
          sets: []
        };
      }
    }

    console.log(`🎯 Slot ${slotIndex} - GearSet config finale:`, gearSetConfig);

    // 🔥 PERKS - CONVERSION COMPLÈTE
    const heroPerks = perks[slotIndex];

    console.log(`🔍 Slot ${slotIndex} - Perks reçues:`, heroPerks);
    console.log(`🔍 Slot ${slotIndex} - Hero Class:`, heroClass);
    console.log(`🔍 Slot ${slotIndex} - Hero Name:`, heroName);

    // 🔥 CORRECTION: Structure initiale des perks
    let perksConfig = {
      t1: { selected: [] },
      t2: { selected: [] },
      t3: { s1: null, s2: null, s3: null, s4: null },
      t5: null
    };

    if (heroPerks) {
      // Si c'est un tableau d'indices (format du modal)
      if (Array.isArray(heroPerks)) {
        console.log(`🔄 Format tableau d'indices détecté`, heroPerks);
        
        // === CONVERSION DES INDICES EN SLUGS ===
        
        // T1 perks (indices 0-4)
        const t1Slugs = ['atk-up', 'hp-up', 'def-up', 'crit-resist-up', 'monster-hunting'];
        heroPerks.forEach(index => {
          if (index >= 0 && index < 5) {
            const slug = t1Slugs[index];
            if (slug && !perksConfig.t1.selected.includes(slug)) {
              perksConfig.t1.selected.push(slug);
            }
          }
        });
        
        // T2 perks (indices 10-14)
        if (heroClass) {
          const T2_MAPPING = {
            'Knight': ['experienced-fighter', 'excellent-strategy', 'battle-cry', 'shield-of-protection', 'swift-move'],
            'Warrior': ['opportune-strike', 'warlike', 'offensive-guard', 'tactical-foresight', 'blood-wrath'],
            'Assassin': ['target-weakness', 'swift-and-nimble', 'tactical-foresight', 'opportune-strike', 'vital-detection'],
            'Mechanic': ['target-weakness', 'ready-cannons', 'pressure-point', 'special-bullet', 'amplified-gunpowder'],
            'Archer': ['precision-shot', 'eagle-eye', 'mortal-wound', 'opportune-strike', 'concentration'],
            'Wizard': ['deception', 'moral-rise', 'blessing-of-mana', 'circuit-burst', 'destruction'],
            'Priest': ['vengeful-curse', 'goddess-blessing', 'inner-peace', 'blessing-of-mana', 'swiftness']
          };
          
          const classMapping = T2_MAPPING[heroClass] || [];
          heroPerks.forEach(index => {
            if (index >= 10 && index < 15) {
              const colIndex = index - 10;
              if (colIndex >= 0 && colIndex < 5 && classMapping[colIndex]) {
                const slug = classMapping[colIndex];
                if (!perksConfig.t2.selected.includes(slug)) {
                  perksConfig.t2.selected.push(slug);
                }
              }
            }
          });
        }
        
        // T3 perks (indices 20-33)
        const t3Map = {
          20: { skill: 's1', type: 'light' },
          21: { skill: 's1', type: 'dark' },
          22: { skill: 's2', type: 'light' },
          23: { skill: 's2', type: 'dark' },
          30: { skill: 's3', type: 'light' },
          31: { skill: 's3', type: 'dark' },
          32: { skill: 's4', type: 'light' },
          33: { skill: 's4', type: 'dark' }
        };
        
        heroPerks.forEach(index => {
          const mapping = t3Map[index];
          if (mapping) {
            perksConfig.t3[mapping.skill] = mapping.type;
          }
        });
        
        // T5 perk (indices 40-41)
        heroPerks.forEach(index => {
          if (index === 40) perksConfig.t5 = 'light';
          else if (index === 41) perksConfig.t5 = 'dark';
        });
        
        console.log(`✅ Perks converties depuis indices:`, perksConfig);
      }
      // Si c'est déjà un objet structuré
      else if (typeof heroPerks === 'object') {
        console.log(`🔄 Format objet structuré détecté`);
        
        // T1
        if (heroPerks.t1) {
          perksConfig.t1.selected = Array.isArray(heroPerks.t1) 
            ? heroPerks.t1 
            : heroPerks.t1.selected || [];
        }
        
        // T2
        if (heroPerks.t2) {
          perksConfig.t2.selected = Array.isArray(heroPerks.t2) 
            ? heroPerks.t2 
            : heroPerks.t2.selected || [];
        }
        
        // T3
        if (heroPerks.t3) {
          perksConfig.t3 = {
            s1: heroPerks.t3.s1 || null,
            s2: heroPerks.t3.s2 || null,
            s3: heroPerks.t3.s3 || null,
            s4: heroPerks.t3.s4 || null
          };
        }
        
        // T5
        if (heroPerks.t5 !== undefined) {
          perksConfig.t5 = heroPerks.t5;
        }
        
        console.log(`✅ Perks conservées comme objet:`, perksConfig);
      }
    }

    console.log(`🎯 Slot ${slotIndex} - Perks config finale:`, perksConfig);

    // 🔥 SW Advancement
    let swAdvancement = advancements[slotIndex];
    console.log(`  Slot ${slotIndex} - swAdvancement reçu:`, swAdvancement, 'type:', typeof swAdvancement);
    
    // Validation et nettoyage
    if (swAdvancement === undefined) {
      swAdvancement = null;
    } else if (typeof swAdvancement === 'string') {
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
      
      uw: {
        stars: Math.max(0, Math.min(5, uwStars))
      },
      
      ut: {
        choice: Math.max(0, Math.min(4, utChoice)),
        stars: Math.max(0, Math.min(5, utStarsValue))
      },
      
      sw: {
        advancement: swAdvancement
      },
      
      artifact: artifactItem ? {
        artifactSlug: artifactItem.artifactSlug,
        stars: Math.max(0, Math.min(5, artifactStars))
      } : {
        artifactSlug: null,
        stars: 0
      },
      
      // 🔥 GearSet config
      gearSet: gearSetConfig,
      
      // 🔥 Perks config (nouvelle structure complète)
      perks: perksConfig,
      
      updatedAt: new Date()
    };

    console.log(`✅ Héros ${slotIndex} config:`, {
      heroSlug: heroConfig.heroSlug,
      ut: heroConfig.ut,
      sw: heroConfig.sw,
      gearSet: heroConfig.gearSet,
      perks: heroConfig.perks
    });
    
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
  console.log('  UT du premier héros:', dbHeroes[0]?.ut);
  console.log('  GearSet du premier héros:', dbHeroes[0]?.gearSet);
  console.log('  Perks du premier héros:', dbHeroes[0]?.perks);
  console.log('  T1 perks:', dbHeroes[0]?.perks?.t1?.selected);
  console.log('  T2 perks:', dbHeroes[0]?.perks?.t2?.selected);
  console.log('  T3 perks:', dbHeroes[0]?.perks?.t3);
  console.log('  T5 perk:', dbHeroes[0]?.perks?.t5);

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
    };

    // UW (slot 0)
    if (heroConfig.uw && heroConfig.uw.stars > 0) {
      subStars[slotIndex][0] = heroConfig.uw.stars;
    }

    // UT (slot 1)
    if (heroConfig.ut) {
      subSlots[slotIndex][1] = {
        choice: heroConfig.ut.choice || 0,
        stars: heroConfig.ut.stars || 0
      };
      subStars[slotIndex][1] = heroConfig.ut.stars || 0;
      
      console.log(`    UT convertie pour frontend:`, subSlots[slotIndex][1]);
    }

    // SW Advancement (slot 2)
    if (heroConfig.sw) {
      let advancementValue = heroConfig.sw.advancement;
      
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
        stars: heroConfig.artifact.stars || 0
      };
      subStars[slotIndex][2] = heroConfig.artifact.stars || 0;
    }

    // 🔥 Gear Set (slot 4 dans subSlots, mais slot 3 dans la DB)
    if (heroConfig.gearSet) {
      const gearSet = heroConfig.gearSet;
      
      console.log(`    GearSet DB:`, gearSet);
      
      if (gearSet.isMultiSet && gearSet.sets && gearSet.sets.length >= 2) {
        // 🔥 Multi-set
        const gearSetData = {
          isMultiSet: true,
          sets: gearSet.sets.map(set => ({
            slug: set.slug,
            pieces: set.pieces || 2
          }))
        };
        
        // Pour la compatibilité avec votre frontend actuel
        if (gearSet.sets[0] && gearSet.sets[1]) {
          gearSetData.set1Info = {
            slug: gearSet.sets[0].slug,
            pieces: gearSet.sets[0].pieces || 2
          };
          gearSetData.set2Info = {
            slug: gearSet.sets[1].slug,
            pieces: gearSet.sets[1].pieces || 2
          };
        }
        
        subSlots[slotIndex][3] = gearSetData;
        console.log(`    Multi-set restauré: ${gearSet.sets.map(s => s.slug).join(' + ')}`);
      } 
      else if (gearSet.gearSetSlug) {
        // 🔥 Single set
        subSlots[slotIndex][3] = {
          gearSetSlug: gearSet.gearSetSlug,
          pieces: gearSet.pieces || 0,
          isMultiSet: false
        };
        console.log(`    Single set restauré: ${gearSet.gearSetSlug} (${gearSet.pieces} pieces)`);
      }
    }

    // 🔥 PERKS - Conversion depuis MongoDB vers format frontend
    if (heroConfig.perks) {
      console.log(`    Perks DB:`, heroConfig.perks);
      
      // Pour le frontend, on envoie la structure complète
      perks[slotIndex] = {
        t1: heroConfig.perks.t1?.selected || [],
        t2: heroConfig.perks.t2?.selected || [],
        t3: heroConfig.perks.t3 || { s1: null, s2: null, s3: null, s4: null },
        t5: heroConfig.perks.t5 || null
      };
      
      console.log(`    Perks restaurées pour frontend:`, perks[slotIndex]);
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
  console.log('- GearSets restaurés:', result.subSlots.map((slot, i) => 
    `Slot ${i}: ${slot[3] ? (slot[3].isMultiSet ? 'Multi-set' : `Single: ${slot[3].gearSetSlug}`) : 'None'}`
  ));
  console.log('- Perks restaurées:', result.perks.map((p, i) => 
    `Slot ${i}: T1:${p?.t1?.length || 0}, T2:${p?.t2?.length || 0}, T3:${p?.t3 ? Object.values(p.t3).filter(v => v).length : 0}, T5:${p?.t5 || 'none'}`
  ));

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

module.exports = {
  convertTeamContextToDB,
  convertDBToTeamContext,
  convertAdvancementForDisplay,
  convertAdvancementFromDisplay,
};