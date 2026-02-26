// frontend/src/utils/perkConverter.js

/**
 * Convert structured perks (object) into indices (array)
 * Structured -> indices for rendering
 * indices -> structured for sacing from modal
 * It only uses column position (0–4) for T2.
 */
export const perksToIndices = (perksObj) => {
  if (!perksObj) return [];

  // If already array of indices
  if (Array.isArray(perksObj)) {
    return perksObj;
  }

  const indices = [];

  /* ===============================
     T1 (0–4)
  =============================== */

  const t1Slugs = [
    "atk-up",
    "hp-up",
    "def-up",
    "crit-resist-up",
    "monster-hunting"
  ];

  perksObj.t1?.selected?.forEach(slug => {
    const colIndex = t1Slugs.indexOf(slug);
    if (colIndex !== -1) {
      indices.push(colIndex);
    }
  });

  /* ===============================
     T2 (10–14)
     IMPORTANT:
     We no longer map slug → class.
     We assume order inside selected array
     matches the 0–4 column structure.
  =============================== */

  perksObj.t2?.selected?.forEach((slug, i) => {
    if (i >= 0 && i < 5) {
      indices.push(10 + i);
    }
  });

  /* ===============================
     T3 (20–33)
  =============================== */

  const t3Map = {
    s1: { light: 20, dark: 21 },
    s2: { light: 22, dark: 23 },
    s3: { light: 30, dark: 31 },
    s4: { light: 32, dark: 33 }
  };

  Object.entries(perksObj.t3 || {}).forEach(([skill, type]) => {
    if (type && t3Map[skill]?.[type] !== undefined) {
      indices.push(t3Map[skill][type]);
    }
  });

  /* ===============================
     T5 (40–41)
  =============================== */

  if (perksObj.t5 === "light") indices.push(40);
  if (perksObj.t5 === "dark") indices.push(41);

  return indices;
};


/**
 * Convert indices into structured perks
 * Also no class-based slug mapping.
 */
export const indicesToPerks = (indices) => {
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

  const t1Slugs = [
    "atk-up",
    "hp-up",
    "def-up",
    "crit-resist-up",
    "monster-hunting"
  ];

  indices.forEach(index => {
    const rowIndex = Math.floor(index / 10);
    const colIndex = index % 10;

    /* ===============================
       T1
    =============================== */
    if (rowIndex === 0 && colIndex < 5) {
      const slug = t1Slugs[colIndex];
      if (slug) {
        perksObj.t1.selected.push(slug);
      }
    }

    /* ===============================
       T2
       We store placeholder column-based slugs.
       Real class-specific rendering is handled in UI.
    =============================== */
    else if (rowIndex === 1 && colIndex < 5) {
      perksObj.t2.selected.push(`column-${colIndex}`);
    }

    /* ===============================
       T3
    =============================== */
    else if (rowIndex === 2 || rowIndex === 3) {
      const t3ReverseMap = {
        20: { skill: "s1", type: "light" },
        21: { skill: "s1", type: "dark" },
        22: { skill: "s2", type: "light" },
        23: { skill: "s2", type: "dark" },
        30: { skill: "s3", type: "light" },
        31: { skill: "s3", type: "dark" },
        32: { skill: "s4", type: "light" },
        33: { skill: "s4", type: "dark" }
      };

      const mapping = t3ReverseMap[index];
      if (mapping) {
        perksObj.t3[mapping.skill] = mapping.type;
      }
    }

    /* ===============================
       T5
    =============================== */
    else if (rowIndex === 4) {
      if (index === 40) perksObj.t5 = "light";
      if (index === 41) perksObj.t5 = "dark";
    }
  });

  return perksObj;
};

export default {
  perksToIndices,
  indicesToPerks
};