// contexts/PerksContext.js
import { createContext, useContext, useEffect, useState } from "react";

const PerksContext = createContext();

export const usePerks = () => {
  const context = useContext(PerksContext);
  if (!context) {
    throw new Error("usePerks must be used within PerksProvider");
  }
  return context;
};

export const PerksProvider = ({ children }) => {
  // State for team perks
  const [teamPerks, setTeamPerks] = useState(Array(8).fill(null));
  
  // State for backend perks data
  const [allPerks, setAllPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  const ASSETS_BASE_URL = process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002';

  // Helper for asset URLs
  const getAssetUrl = (path) => {
    return `${ASSETS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Load all perks from backend
  const loadAllPerks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/v2/perks`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load perks');
      }
      
      const transformedPerks = result.perks.map(perk => ({
        id: perk.id || perk._id,
        name: perk.name,
        tier: perk.tier,
        class: perk.class || 'General',
        heroSlug: perk.heroSlug || null,
        description: perk.description || '',
        thumbnail: perk.thumbnail || '',
        displayOrder: perk.displayOrder || 999,
        rawData: perk
      }));
      
      setAllPerks(transformedPerks);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  const getHeroPerks = async (heroSlug) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/perks/hero/${heroSlug}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load hero perks');
      }
      
      return result.perks || [];
      
    } catch {
      return allPerks.filter(perk => 
        perk.heroSlug === heroSlug && 
        ['t3', 't5'].includes(perk.tier)
      );
    }
  };

  const getClassPerks = async (className) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/perks/class/${className}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load class perks');
      }
      
      return result.perks || [];
      
    } catch {
      return allPerks.filter(perk => 
        ['t1', 't2'].includes(perk.tier) &&
        (perk.class === 'General' || perk.class === className)
      );
    }
  };

  const getPerksByTier = async (tier, filters = {}) => {
    try {
      let url = `${API_BASE_URL}/api/v2/perks/tier/${tier}`;
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.heroSlug) params.append('heroSlug', filters.heroSlug);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load tier perks');
      }
      
      return result.perks || [];
      
    } catch {
      let filteredPerks = allPerks.filter(perk => perk.tier === tier);
      
      if (filters.class) {
        filteredPerks = filteredPerks.filter(perk => 
          perk.class === filters.class || perk.class === 'General'
        );
      }
      
      if (filters.heroSlug) {
        filteredPerks = filteredPerks.filter(perk => 
          perk.heroSlug === filters.heroSlug
        );
      }
      
      return filteredPerks;
    }
  };

  const searchPerks = async (searchTerm) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/perks/search/${searchTerm}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search perks');
      }
      
      return result.perks || [];
      
    } catch {
      const term = searchTerm.toLowerCase();
      return allPerks.filter(perk =>
        perk.name.toLowerCase().includes(term) ||
        perk.description.toLowerCase().includes(term) ||
        perk.class.toLowerCase().includes(term)
      );
    }
  };

  const updateTeamPerks = (teamSlotIndex, newPerks) => {
    setTeamPerks(prev => {
      const newPerksArray = [...prev];
      newPerksArray[teamSlotIndex] = newPerks;
      return newPerksArray;
    });
  };

  const resetTeamPerks = (teamSlotIndex) => {
    setTeamPerks(prev => {
      const newPerksArray = [...prev];
      newPerksArray[teamSlotIndex] = null;
      return newPerksArray;
    });
  };

  const getTeamPerksStats = () => {
    const stats = {
      totalSlots: teamPerks.length,
      filledSlots: teamPerks.filter(p => p !== null).length,
      emptySlots: teamPerks.filter(p => p === null).length,
      t3Lights: 0,
      t3Darks: 0,
      t5Lights: 0,
      t5Darks: 0
    };

    teamPerks.forEach(perk => {
      if (perk && perk.t3) {
        ['s1','s2','s3','s4'].forEach(skill => {
          if (perk.t3[skill] === 'light') stats.t3Lights++;
          if (perk.t3[skill] === 'dark') stats.t3Darks++;
        });
      }
      if (perk && perk.t5) {
        if (perk.t5 === 'light') stats.t5Lights++;
        if (perk.t5 === 'dark') stats.t5Darks++;
      }
    });

    return stats;
  };

  useEffect(() => {
    loadAllPerks();
  }, []);

  const value = {
    allPerks,
    teamPerks,
    loading,
    error,
    loadAllPerks,
    getHeroPerks,
    getClassPerks,
    getPerksByTier,
    searchPerks,
    updateTeamPerks,
    resetTeamPerks,
    getTeamPerksStats,
    getAssetUrl,
    perksCount: allPerks.length,
    teamPerksStats: getTeamPerksStats()
  };

  return (
    <PerksContext.Provider value={value}>
      {children}
    </PerksContext.Provider>
  );
};
