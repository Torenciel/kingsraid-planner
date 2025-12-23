// contexts/GearSetContext.js
import { createContext, useContext, useEffect, useState } from "react";

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

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  const ASSETS_BASE_URL = process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002';

  const getGearSetImageUrl = (gearSet) => {
    if (!gearSet) return '';
    
    if (gearSet.thumbnail) {
      if (!gearSet.thumbnail.startsWith('http') && !gearSet.thumbnail.startsWith('/')) {
        return `${ASSETS_BASE_URL}/kingsraid-data/assets/${gearSet.thumbnail}`;
      }
      return gearSet.thumbnail;
    }
    
    if (gearSet.slug) {
      return `${ASSETS_BASE_URL}/kingsraid-data/assets/gearsets/${gearSet.slug}.png`;
    }
    
    const formattedName = gearSet.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
    return `${ASSETS_BASE_URL}/kingsraid-data/assets/gearsets/${formattedName}.png`;
  };

  const loadGearSets = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await fetch(`${API_BASE_URL}/api/v2/gearsets`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load gear sets');
      }
      
      const gearSets = result.gearsets.map(set => ({
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
        const fallbackResponse = await fetch(`${ASSETS_BASE_URL}/kingsraid-data/table-data/gearsets.json`);
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          const transformedSets = fallbackData.map(set => ({
            id: set._id || set.id || set.name,
            slug: set.slug || set.name?.toLowerCase().replace(/\s+/g, '-'),
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

  const getGearSetBySlug = (slug) => {
    if (!slug) return null;
    
    return state.allGearSets.find(set => 
      set.slug === slug || 
      set.id === slug ||
      set.name.toLowerCase().replace(/\s+/g, '-') === slug
    );
  };

  const getGearSetById = (id) => {
    if (!id) return null;
    
    return state.allGearSets.find(set => 
      set.id === id ||
      set._id === id ||
      set.slug === id
    );
  };

  const searchGearSets = (searchTerm) => {
    if (!searchTerm.trim()) return state.allGearSets;
    
    const term = searchTerm.toLowerCase();
    return state.allGearSets.filter(set =>
      set.name?.toLowerCase().includes(term) ||
      set.bonus2P?.toLowerCase().includes(term) ||
      set.bonus4P?.toLowerCase().includes(term) ||
      set.slug?.toLowerCase().includes(term)
    );
  };

  const refreshGearSets = async () => {
    await loadGearSets();
  };

  useEffect(() => {
    loadGearSets();
  }, []);

  const value = {
    allGearSets: state.allGearSets,
    loading: state.loading,
    error: state.error,
    count: state.allGearSets.length,
    
    refreshGearSets,
    getGearSetBySlug,
    getGearSetById,
    searchGearSets,
    getGearSetImageUrl,
    
    createGearSetForSave: (gearSet, pieces = 0) => {
      if (!gearSet) return null;
      
      return {
        gearSetSlug: gearSet.slug || gearSet.id,
        gearSetInfo: {
          name: gearSet.name,
          thumbnail: gearSet.thumbnail,
          bonus2P: gearSet.bonus2P,
          bonus4P: gearSet.bonus4P
        },
        pieces: pieces
      };
    }
  };

  return (
    <GearSetContext.Provider value={value}>
      {children}
    </GearSetContext.Provider>
  );
};