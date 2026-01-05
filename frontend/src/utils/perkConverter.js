// frontend/src/utils/perkConverter.js

/**
 * Convertit les perks structurées (objet) en indices (tableau)
 */
export const perksToIndices = (perksObj, heroClass, heroName) => {
  if (!perksObj) return [];
  
  // Si c'est déjà un tableau d'indices
  if (Array.isArray(perksObj)) {
    return perksObj;
  }
  
  const indices = [];
  
  // T1 perks (row 0: indices 0-4)
  if (perksObj.t1?.selected) {
    const t1Slugs = ['atk-up', 'hp-up', 'def-up', 'crit-resist-up', 'monster-hunting'];
    perksObj.t1.selected.forEach(slug => {
      const index = t1Slugs.indexOf(slug);
      if (index !== -1) {
        indices.push(index);
      }
    });
  }
  
  // T2 perks (row 1: indices 10-14)
  if (perksObj.t2?.selected && heroClass) {
    // Mappage T2 selon la classe
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
    perksObj.t2.selected.forEach(slug => {
      const index = classMapping.indexOf(slug);
      if (index !== -1) {
        indices.push(10 + index); // Row 1
      }
    });
  }
  
  // T3 perks (rows 2-3)
  if (perksObj.t3) {
    const t3Map = {
      s1: { light: 20, dark: 21 }, // Row 2
      s2: { light: 22, dark: 23 }, // Row 2
      s3: { light: 30, dark: 31 }, // Row 3
      s4: { light: 32, dark: 33 }  // Row 3
    };
    
    Object.entries(perksObj.t3).forEach(([skill, type]) => {
      if (type && t3Map[skill]) {
        indices.push(t3Map[skill][type]);
      }
    });
  }
  
  // T5 perk (row 4)
  if (perksObj.t5) {
    const t5Map = { light: 40, dark: 41 }; // Row 4
    if (t5Map[perksObj.t5]) {
      indices.push(t5Map[perksObj.t5]);
    }
  }
  
  return indices;
};

/**
 * Convertit les indices en perks structurées
 */
export const indicesToPerks = (indices, heroClass, heroName) => {
  if (!Array.isArray(indices)) {
    return {
      t1: { selected: [] },
      t2: { selected: [] },
      t3: { s1: null, s2: null, s3: null, s4: null },
      t5: null
    };
  }
  
  const perksObj = {
    t1: { selected: [] },
    t2: { selected: [] },
    t3: { s1: null, s2: null, s3: null, s4: null },
    t5: null
  };
  
  // T1 mapping
  const t1Slugs = ['atk-up', 'hp-up', 'def-up', 'crit-resist-up', 'monster-hunting'];
  
  // T2 mapping
  const T2_MAPPING = {
    'Knight': ['experienced-fighter', 'excellent-strategy', 'battle-cry', 'shield-of-protection', 'swift-move'],
    'Warrior': ['opportune-strike', 'warlike', 'offensive-guard', 'tactical-foresight', 'blood-wrath'],
    'Assassin': ['target-weakness', 'swift-and-nimble', 'tactical-foresight', 'opportune-strike', 'vital-detection'],
    'Mechanic': ['target-weakness', 'ready-cannons', 'pressure-point', 'special-bullet', 'amplified-gunpowder'],
    'Archer': ['precision-shot', 'eagle-eye', 'mortal-wound', 'opportune-strike', 'concentration'],
    'Wizard': ['deception', 'moral-rise', 'blessing-of-mana', 'circuit-burst', 'destruction'],
    'Priest': ['vengeful-curse', 'goddess-blessing', 'inner-peace', 'blessing-of-mana', 'swiftness']
  };
  
  indices.forEach(index => {
    const rowIndex = Math.floor(index / 10);
    const colIndex = index % 10;
    
    // T1 (row 0)
    if (rowIndex === 0 && colIndex < 5) {
      const slug = t1Slugs[colIndex];
      if (slug && !perksObj.t1.selected.includes(slug)) {
        perksObj.t1.selected.push(slug);
      }
    }
    // T2 (row 1)
    else if (rowIndex === 1 && colIndex < 5 && heroClass) {
      const classMapping = T2_MAPPING[heroClass];
      if (classMapping && classMapping[colIndex]) {
        const slug = classMapping[colIndex];
        if (!perksObj.t2.selected.includes(slug)) {
          perksObj.t2.selected.push(slug);
        }
      }
    }
    // T3 (rows 2-3)
    else if (rowIndex === 2 || rowIndex === 3) {
      const t3ReverseMap = {
        20: { skill: 's1', type: 'light' },
        21: { skill: 's1', type: 'dark' },
        22: { skill: 's2', type: 'light' },
        23: { skill: 's2', type: 'dark' },
        30: { skill: 's3', type: 'light' },
        31: { skill: 's3', type: 'dark' },
        32: { skill: 's4', type: 'light' },
        33: { skill: 's4', type: 'dark' }
      };
      
      const mapping = t3ReverseMap[index];
      if (mapping) {
        perksObj.t3[mapping.skill] = mapping.type;
      }
    }
    // T5 (row 4)
    else if (rowIndex === 4) {
      if (index === 40) perksObj.t5 = 'light';
      else if (index === 41) perksObj.t5 = 'dark';
    }
  });
  
  return perksObj;
};

export default {
  perksToIndices,
  indicesToPerks
};