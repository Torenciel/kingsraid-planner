// contexts/GearSetContext.js
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { API_BASE_URL } from "../services/api";

const GearSetContext = createContext();

export const useGearSets = () => {
  const context = useContext(GearSetContext);
  if (!context) {
    throw new Error("useGearSets must be used within GearSetProvider");
  }
  return context;
};

export const GearSetProvider = ({ children }) => {
  const [state, setState] = useState({
    allGearSets: [],
    loading: true,
    error: null,
  });

  const getGearSetImageUrl = useCallback(
    (gearSet) => {
      if (!gearSet) return "";

      if (gearSet.thumbnail) {
        if (
          !gearSet.thumbnail.startsWith("http") &&
          !gearSet.thumbnail.startsWith("/")
        ) {
          return `/kingsraid-data/assets/${gearSet.thumbnail}`;
        }
        return gearSet.thumbnail;
      }

      if (gearSet.slug) {
        return `/kingsraid-data/assets/gearsets/${gearSet.slug}.png`;
      }

      const formattedName =
        gearSet.name?.toLowerCase().replace(/\s+/g, "_") || "unknown";
      return `/kingsraid-data/assets/gearsets/${formattedName}.png`;
    },
    [],
  );

  const loadGearSets = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await fetch(`${API_BASE_URL}/api/v2/gearsets`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load gear sets");
      }

      const gearSets = result.gearsets.map((set) => ({
        id: set.id || set._id,
        slug: set.slug,
        name: set.name,
        thumbnail: getGearSetImageUrl(set),
        bonus2P: set.bonus2P,
        bonus4P: set.bonus4P,
        sortOrder: set.sortOrder || 999,
        rawData: set,
      }));

      setState({
        allGearSets: gearSets,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error loading gear sets:", error);

      try {
        const fallbackResponse = await fetch(
          `/kingsraid-data/table-data/gearsets.json`,
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();

          const transformedSets = fallbackData.map((set) => ({
            id: set._id || set.id || set.name,
            slug: set.slug || set.name?.toLowerCase().replace(/\s+/g, "-"),
            name: set.name,
            thumbnail: getGearSetImageUrl(set),
            bonus2P: set.bonus2P,
            bonus4P: set.bonus4P,
            sortOrder: set.sortOrder || 999,
            rawData: set,
          }));

          setState({
            allGearSets: transformedSets,
            loading: false,
            error: null,
          });
          return;
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }

      setState({
        allGearSets: [],
        loading: false,
        error: error.message,
      });
    }
  };

  const getGearSetBySlug = useCallback(
    (slug) => {
      if (!slug) return null;

      return state.allGearSets.find(
        (set) =>
          set.slug === slug ||
          set.id === slug ||
          set.name.toLowerCase().replace(/\s+/g, "-") === slug,
      );
    },
    [state.allGearSets],
  );

  const getGearSetById = useCallback(
    (id) => {
      if (!id) return null;

      return state.allGearSets.find(
        (set) => set.id === id || set._id === id || set.slug === id,
      );
    },
    [state.allGearSets],
  );

  const searchGearSets = useCallback(
    (searchTerm) => {
      if (!searchTerm.trim()) return state.allGearSets;

      const term = searchTerm.toLowerCase();
      return state.allGearSets.filter(
        (set) =>
          set.name?.toLowerCase().includes(term) ||
          set.bonus2P?.toLowerCase().includes(term) ||
          set.bonus4P?.toLowerCase().includes(term) ||
          set.slug?.toLowerCase().includes(term),
      );
    },
    [state.allGearSets],
  );

  const refreshGearSets = async () => {
    await loadGearSets();
  };

  // Functions for saving multiple gear sets
  const createSingleGearSetForSave = useCallback(
    (gearSet, pieces = 4) => {
      if (!gearSet) return null;

      return {
        gearSetSlug: gearSet.slug || gearSet.id,
        gearSetInfo: {
          name: gearSet.name,
          thumbnail: getGearSetImageUrl(gearSet),
          bonus2P: gearSet.bonus2P,
          bonus4P: gearSet.bonus4P,
        },
        pieces: pieces,
        sets: [gearSet.slug || gearSet.id], // For compatibility with retrieval
      };
    },
    [getGearSetImageUrl],
  );

  const createMultiGearSetForSave = useCallback(
    (gearSet1, gearSet2) => {
      if (!gearSet1 || !gearSet2) return null;

      return {
        isMultiSet: true, // CRITICAL flag to identify multi-sets
        sets: [gearSet1.slug || gearSet1.id, gearSet2.slug || gearSet2.id],
        gearSetSlug: gearSet1.slug || gearSet1.id, // First set for compatibility
        gearSetInfo: {
          name: `${gearSet1.name} + ${gearSet2.name}`,
          thumbnail: getGearSetImageUrl(gearSet1),
          bonus2P: "Multiple sets selected",
          bonus4P: "Not applicable for multiple sets",
        },
        pieces: 2, // 2 pieces per set
        // Store info for each set for the overlay
        set1Info: {
          name: gearSet1.name,
          slug: gearSet1.slug || gearSet1.id,
          bonus2P: gearSet1.bonus2P,
        },
        set2Info: {
          name: gearSet2.name,
          slug: gearSet2.slug || gearSet2.id,
          bonus2P: gearSet2.bonus2P,
        },
      };
    },
    [getGearSetImageUrl],
  );

  // Smart function that handles both single and multi-set cases
  const createGearSetForSave = useCallback(
    (selectedSets) => {
      if (!selectedSets || selectedSets.length === 0) return null;

      if (selectedSets.length === 1) {
        const gearSet = getGearSetBySlug(selectedSets[0]);
        return createSingleGearSetForSave(gearSet, 4);
      }

      if (selectedSets.length === 2) {
        const gearSet1 = getGearSetBySlug(selectedSets[0]);
        const gearSet2 = getGearSetBySlug(selectedSets[1]);
        return createMultiGearSetForSave(gearSet1, gearSet2);
      }

      console.warn("Too many gear sets selected:", selectedSets.length);
      return null;
    },
    [getGearSetBySlug, createSingleGearSetForSave, createMultiGearSetForSave],
  );

  // Convert DB gear set data to frontend format
  const convertDBGearSetToFrontend = useCallback(
    (dbGearSet) => {
      if (!dbGearSet) return null;

      // Check if it's a multi-set
      if (
        dbGearSet.isMultiSet &&
        dbGearSet.sets &&
        Array.isArray(dbGearSet.sets)
      ) {
        // Retrieve full info for each set
        const set1 = getGearSetBySlug(dbGearSet.sets[0]);
        const set2 = getGearSetBySlug(dbGearSet.sets[1]);

        return {
          isMultiSet: true,
          sets: dbGearSet.sets,
          gearSetSlug: dbGearSet.sets[0],
          gearSetInfo: dbGearSet.gearSetInfo || {
            name: "Multiple Gear Sets",
            thumbnail: null,
          },
          pieces: 2,
          set1Info:
            dbGearSet.set1Info ||
            (set1
              ? {
                  name: set1.name,
                  slug: set1.slug,
                  bonus2P: set1.bonus2P,
                }
              : null),
          set2Info:
            dbGearSet.set2Info ||
            (set2
              ? {
                  name: set2.name,
                  slug: set2.slug,
                  bonus2P: set2.bonus2P,
                }
              : null),
        };
      }

      // Single set
      const gearSet = getGearSetBySlug(dbGearSet.gearSetSlug);
      return {
        gearSetSlug: dbGearSet.gearSetSlug,
        gearSetInfo:
          dbGearSet.gearSetInfo ||
          (gearSet
            ? {
                name: gearSet.name,
                thumbnail: getGearSetImageUrl(gearSet),
                bonus2P: gearSet.bonus2P,
                bonus4P: gearSet.bonus4P,
              }
            : null),
        pieces: dbGearSet.pieces || 4,
        sets: dbGearSet.sets || [dbGearSet.gearSetSlug], // For compatibility
      };
    },
    [getGearSetBySlug, getGearSetImageUrl],
  );

  // Parse and validate gear set data
  const parseGearSetData = useCallback((data) => {
    if (!data) return null;

    // If it's already a formatted object
    if (typeof data === "object") {
      // Check if it's a multi-set
      if (data.isMultiSet && data.sets) {
        return {
          type: "multi",
          sets: data.sets,
          data: data,
        };
      }

      // Otherwise it's a single set
      return {
        type: "single",
        sets: data.sets ? data.sets : [data.gearSetSlug],
        data: data,
      };
    }

    // If it's a JSON string (old format)
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return {
            type: "multi",
            sets: parsed,
            data: { sets: parsed, isMultiSet: true },
          };
        }
      } catch (e) {
        console.error("Error parsing gear set string:", e);
      }
    }

    return null;
  }, []);

  // Utility function to get set names
  const getGearSetNames = useCallback(
    (gearSetData) => {
      const parsed = parseGearSetData(gearSetData);
      if (!parsed) return [];

      return parsed.sets.map((slug) => {
        const set = getGearSetBySlug(slug);
        return set ? set.name : slug;
      });
    },
    [parseGearSetData, getGearSetBySlug],
  );

  useEffect(() => {
    loadGearSets();
  }, []);

  const value = {
    // Data
    allGearSets: state.allGearSets,
    loading: state.loading,
    error: state.error,

    // Stats
    count: state.allGearSets.length,

    // Search functions
    refreshGearSets,
    getGearSetBySlug,
    getGearSetById,
    searchGearSets,
    getGearSetImageUrl,

    // Save functions
    createGearSetForSave,
    createSingleGearSetForSave,
    createMultiGearSetForSave,

    // Conversion functions
    convertDBGearSetToFrontend,
    parseGearSetData,
    getGearSetNames,

    // Validation utility
    validateGearSetSelection: (selectedSets) => {
      if (!selectedSets || !Array.isArray(selectedSets)) return false;
      if (selectedSets.length === 0) return true; // Empty is valid
      if (selectedSets.length > 2) return false; // Max 2 sets

      // Check that all slugs exist
      return selectedSets.every((slug) => {
        const set = getGearSetBySlug(slug);
        return set !== undefined && set !== null;
      });
    },

    // Display formatting function
    formatGearSetDisplay: (gearSetData) => {
      const parsed = parseGearSetData(gearSetData);
      if (!parsed) return "No gear set";

      if (parsed.type === "multi") {
        const names = getGearSetNames(gearSetData);
        return `${names.join(" + ")} (2P/2P)`;
      } else {
        const names = getGearSetNames(gearSetData);
        const pieces = parsed.data.pieces || 4;
        return `${names[0] || "Unknown"} (${pieces}P)`;
      }
    },
  };

  return (
    <GearSetContext.Provider value={value}>{children}</GearSetContext.Provider>
  );
};
