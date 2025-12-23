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
  // État pour les perks de l'équipe
  const [teamPerks, setTeamPerks] = useState(Array(8).fill(null));
  
  // État pour les données des perks depuis le backend
  const [allPerks, setAllPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  const ASSETS_BASE_URL = process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002';

  // Helper pour les URLs d'assets
  const getAssetUrl = (path) => {
    return `${ASSETS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Charger toutes les perks depuis le backend
  const loadAllPerks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔄 Loading perks from backend...");
      
      const response = await fetch(`${API_BASE_URL}/api/v2/perks`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load perks');
      }
      
      // Transformer les données
      const transformedPerks = result.perks.map(perk => ({
        id: perk.id || perk._id,
        name: perk.name,
        tier: perk.tier, // 't1', 't2', 't3', 't5'
        class: perk.class || 'General',
        heroSlug: perk.heroSlug || null,
        description: perk.description || '',
        thumbnail: perk.thumbnail || '',
        displayOrder: perk.displayOrder || 999,
        // Données brutes
        rawData: perk
      }));
      
      setAllPerks(transformedPerks);
      console.log(`✅ Loaded ${transformedPerks.length} perks from backend`);
      
    } catch (error) {
      console.error("❌ Error loading perks:", error);
      setError(error.message);
      
      // Fallback: données de test
      setAllPerks(getTestPerks());
    } finally {
      setLoading(false);
    }
  };

  // Données de test pour le fallback
  const getTestPerks = () => {
    return [
      // T1 General
      {
        id: 't1_atk_up',
        name: 'ATK Up',
        tier: 't1',
        class: 'General',
        description: 'Increases ATK by 10%',
        thumbnail: '/kingsraid-data/assets/perks/t1_atk.png'
      },
      {
        id: 't1_def_up',
        name: 'DEF Up',
        tier: 't1',
        class: 'General',
        description: 'Increases DEF by 10%',
        thumbnail: '/kingsraid-data/assets/perks/t1_def.png'
      },
      // T2 General
      {
        id: 't2_crit_chance',
        name: 'Crit Chance',
        tier: 't2',
        class: 'General',
        description: 'Increases Crit Chance by 100',
        thumbnail: '/kingsraid-data/assets/perks/t2_crit.png'
      },
      // T3 Hero-specific (exemple pour Kasel)
      {
        id: 'kasel_t3_s1_light',
        name: 'Godspeed Sword - Light',
        tier: 't3',
        class: 'Warrior',
        heroSlug: 'kasel',
        description: 'Increases ATK by 50% for 10 seconds',
        thumbnail: '/kingsraid-data/assets/heroes/kasel/perks/s1l.png'
      },
      {
        id: 'kasel_t3_s1_dark',
        name: 'Godspeed Sword - Dark',
        tier: 't3',
        class: 'Warrior',
        heroSlug: 'kasel',
        description: 'Heals for 10% of damage dealt',
        thumbnail: '/kingsraid-data/assets/heroes/kasel/perks/s1d.png'
      },
      // T5 Hero-specific
      {
        id: 'kasel_t5_light',
        name: 'Light Transcendence',
        tier: 't5',
        class: 'Warrior',
        heroSlug: 'kasel',
        description: 'ATK, DEF, HP +15% / Crit Chance +100',
        thumbnail: '/kingsraid-data/assets/heroes/kasel/perks/light.png'
      },
      {
        id: 'kasel_t5_dark',
        name: 'Dark Transcendence',
        tier: 't5',
        class: 'Warrior',
        heroSlug: 'kasel',
        description: 'Upon taking damage, increases own ATK by 5% for 10 sec. Stacks up to 10 times',
        thumbnail: '/kingsraid-data/assets/heroes/kasel/perks/dark.png'
      }
    ];
  };

  // Obtenir les perks pour un héros spécifique
  const getHeroPerks = async (heroSlug) => {
    try {
      console.log(`🔍 Fetching perks for hero: ${heroSlug}`);
      
      const response = await fetch(`${API_BASE_URL}/api/v2/perks/hero/${heroSlug}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load hero perks');
      }
      
      return result.perks || [];
      
    } catch (error) {
      console.error(`❌ Error loading perks for ${heroSlug}:`, error);
      
      // Fallback: filtrer les perks existantes
      return allPerks.filter(perk => 
        perk.heroSlug === heroSlug && 
        ['t3', 't5'].includes(perk.tier)
      );
    }
  };

  // Obtenir les perks par classe (T1/T2)
  const getClassPerks = async (className) => {
    try {
      console.log(`🔍 Fetching class perks for: ${className}`);
      
      const response = await fetch(`${API_BASE_URL}/api/v2/perks/class/${className}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load class perks');
      }
      
      return result.perks || [];
      
    } catch (error) {
      console.error(`❌ Error loading class perks for ${className}:`, error);
      
      // Fallback: filtrer les perks existantes
      return allPerks.filter(perk => 
        ['t1', 't2'].includes(perk.tier) &&
        (perk.class === 'General' || perk.class === className)
      );
    }
  };

  // Obtenir les perks par tier
  const getPerksByTier = async (tier, filters = {}) => {
    try {
      console.log(`🔍 Fetching perks for tier: ${tier}`);
      
      let url = `${API_BASE_URL}/api/v2/perks/tier/${tier}`;
      
      // Ajouter les filtres en query params
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.heroSlug) params.append('heroSlug', filters.heroSlug);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load tier perks');
      }
      
      return result.perks || [];
      
    } catch (error) {
      console.error(`❌ Error loading perks for tier ${tier}:`, error);
      
      // Fallback: filtrer les perks existantes
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

  // Rechercher des perks
  const searchPerks = async (searchTerm) => {
    try {
      console.log(`🔍 Searching perks for: ${searchTerm}`);
      
      const response = await fetch(`${API_BASE_URL}/api/v2/perks/search/${searchTerm}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search perks');
      }
      
      return result.perks || [];
      
    } catch (error) {
      console.error(`❌ Error searching perks:`, error);
      
      // Fallback: recherche locale
      const term = searchTerm.toLowerCase();
      return allPerks.filter(perk =>
        perk.name.toLowerCase().includes(term) ||
        perk.description.toLowerCase().includes(term) ||
        perk.class.toLowerCase().includes(term)
      );
    }
  };

  // Mettre à jour les perks d'un slot d'équipe
  const updateTeamPerks = (teamSlotIndex, newPerks) => {
    setTeamPerks((prev) => {
      const newPerksArray = [...prev];
      newPerksArray[teamSlotIndex] = newPerks;
      return newPerksArray;
    });
  };

  // Réinitialiser les perks d'un slot
  const resetTeamPerks = (teamSlotIndex) => {
    setTeamPerks((prev) => {
      const newPerksArray = [...prev];
      newPerksArray[teamSlotIndex] = null;
      return newPerksArray;
    });
  };

  // Obtenir les stats des perks de l'équipe
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
        if (perk.t3.s1 === 'light') stats.t3Lights++;
        if (perk.t3.s1 === 'dark') stats.t3Darks++;
        if (perk.t3.s2 === 'light') stats.t3Lights++;
        if (perk.t3.s2 === 'dark') stats.t3Darks++;
        if (perk.t3.s3 === 'light') stats.t3Lights++;
        if (perk.t3.s3 === 'dark') stats.t3Darks++;
        if (perk.t3.s4 === 'light') stats.t3Lights++;
        if (perk.t3.s4 === 'dark') stats.t3Darks++;
      }
      
      if (perk && perk.t5) {
        if (perk.t5 === 'light') stats.t5Lights++;
        if (perk.t5 === 'dark') stats.t5Darks++;
      }
    });

    return stats;
  };

  // Chargement initial
  useEffect(() => {
    loadAllPerks();
  }, []);

  const value = {
    // Données des perks
    allPerks,
    teamPerks,
    loading,
    error,
    
    // Fonctions de chargement
    loadAllPerks,
    getHeroPerks,
    getClassPerks,
    getPerksByTier,
    searchPerks,
    
    // Gestion des perks d'équipe
    updateTeamPerks,
    resetTeamPerks,
    getTeamPerksStats,
    
    // Utilitaires
    getAssetUrl,
    
    // Statistiques
    perksCount: allPerks.length,
    teamPerksStats: getTeamPerksStats()
  };

  return (
    <PerksContext.Provider value={value}>
      {children}
    </PerksContext.Provider>
  );
};