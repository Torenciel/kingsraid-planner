// frontend/src/contexts/HeroContext.jsx
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

const HeroContext = createContext();

export const HeroProvider = ({ children }) => {
  // États
  const [allHeroes, setAllHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'all',
    sort: 'name',
    search: '',
    availability: 'all'
  });
  const [source, setSource] = useState('mongodb');
  
  // Configuration API
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  const ASSETS_BASE_URL = process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002';

  // 🔥 CHARGER TOUS LES HÉROS
  const loadAllHeroes = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des héros depuis MongoDB...');
      
      const response = await fetch(`${API_BASE_URL}/api/v2/heroes`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.heroes) {
          // Formater les héros pour le frontend
          const formattedHeroes = result.heroes.map(hero => ({
            // Données de base
            id: hero._id?.toString() || hero.id,
            slug: hero.slug,
            name: hero.name,
            role: hero.class,
            class: hero.class,
            position: hero.position || 'Unknown',
            image: hero.thumbnail || `${ASSETS_BASE_URL}/kingsraid-data/assets/heroes/${hero.name}/ico.png`,
            rarity: 5,
            releaseOrder: hero.releaseOrder || 999,
            
            // Métadonnées
            hasUW: false, // Remplir plus tard si disponible
            hasSW: false,
            utsCount: 0,
            
            // Données complètes (chargées à la demande)
            infos: {
              name: hero.name,
              class: hero.class,
              position: hero.position,
              thumbnail: hero.thumbnail
            }
          }));
          
          setAllHeroes(formattedHeroes);
          setSource('mongodb');
          console.log(`✅ ${formattedHeroes.length} héros chargés depuis MongoDB`);
          return formattedHeroes;
        }
      }
      
      // Fallback vers le JSON local
      console.log('⚠️ MongoDB non disponible, tentative JSON...');
      return await loadHeroesFromJSON();
      
    } catch (error) {
      console.error('❌ Erreur chargement héros:', error);
      // Dernier recours: données de test
      const testHeroes = getTestHeroes();
      setAllHeroes(testHeroes);
      setSource('test');
      return testHeroes;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, ASSETS_BASE_URL]);

  // 🔥 CHARGER DEPUIS JSON LOCAL (fallback)
  const loadHeroesFromJSON = async () => {
    try {
      const response = await fetch('/kingsraid-data/table-data/heroes.json');
      if (response.ok) {
        const data = await response.json();
        
        const formattedHeroes = data.map(hero => ({
          id: hero.slug,
          slug: hero.slug,
          name: hero.infos?.name || hero.name,
          role: hero.infos?.class || hero.class,
          class: hero.infos?.class || hero.class,
          position: hero.infos?.position || 'Unknown',
          image: `${ASSETS_BASE_URL}/kingsraid-data/assets/heroes/${hero.infos?.name}/ico.png`,
          rarity: 5,
          releaseOrder: hero.releaseOrder || 999,
          infos: hero.infos || {}
        }));
        
        setAllHeroes(formattedHeroes);
        setSource('json');
        console.log(`✅ ${formattedHeroes.length} héros chargés depuis JSON`);
        return formattedHeroes;
      }
    } catch (error) {
      console.error('Erreur chargement JSON:', error);
    }
    return [];
  };

  // 🔥 DONNÉES DE TEST
  const getTestHeroes = () => {
    return [
      {
        id: 'kasel',
        slug: 'kasel',
        name: 'Kasel',
        role: 'Warrior',
        class: 'Warrior',
        position: 'Front',
        image: `${ASSETS_BASE_URL}/kingsraid-data/assets/heroes/Kasel/ico.png`,
        rarity: 5,
        releaseOrder: 1,
        infos: {
          name: 'Kasel',
          class: 'Warrior',
          position: 'Front'
        }
      },
      {
        id: 'frey',
        slug: 'frey',
        name: 'Frey',
        role: 'Priest',
        class: 'Priest',
        position: 'Back',
        image: `${ASSETS_BASE_URL}/kingsraid-data/assets/heroes/Frey/ico.png`,
        rarity: 5,
        releaseOrder: 2,
        infos: {
          name: 'Frey',
          class: 'Priest',
          position: 'Back'
        }
      },
      {
        id: 'cleo',
        slug: 'cleo',
        name: 'Cleo',
        role: 'Wizard',
        class: 'Wizard',
        position: 'Back',
        image: `${ASSETS_BASE_URL}/kingsraid-data/assets/heroes/Cleo/ico.png`,
        rarity: 5,
        releaseOrder: 3,
        infos: {
          name: 'Cleo',
          class: 'Wizard',
          position: 'Back'
        }
      },
      {
        id: 'roi',
        slug: 'roi',
        name: 'Roi',
        role: 'Assassin',
        class: 'Assassin',
        position: 'Front',
        image: `${ASSETS_BASE_URL}/kingsraid-data/assets/heroes/Roi/ico.png`,
        rarity: 5,
        releaseOrder: 4,
        infos: {
          name: 'Roi',
          class: 'Assassin',
          position: 'Front'
        }
      }
    ];
  };

  // 🔥 FILTRER ET TRIER LES HÉROS
  const filteredHeroes = useMemo(() => {
    let result = [...allHeroes];
    
    // Filtre par rôle/classe
    if (filters.role !== 'all') {
      result = result.filter(hero => 
        hero.role === filters.role || 
        hero.class === filters.role ||
        hero.infos?.class === filters.role
      );
    }
    
    // Recherche par nom
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(hero =>
        hero.name.toLowerCase().includes(searchTerm) ||
        hero.slug.toLowerCase().includes(searchTerm) ||
        (hero.infos?.name?.toLowerCase() || '').includes(searchTerm)
      );
    }
    
    // Tri
    switch (filters.sort) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'release':
        result.sort((a, b) => (a.releaseOrder || 999) - (b.releaseOrder || 999));
        break;
      case 'class':
        result.sort((a, b) => a.class.localeCompare(b.class));
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [allHeroes, filters]);

  // 🔥 CHARGER LES DONNÉES DÉTAILLÉES D'UN HÉROS
  const loadHeroDetails = async (slug) => {
    try {
      console.log(`🔍 Chargement détails pour: ${slug}`);
      
      const response = await fetch(`${API_BASE_URL}/api/v2/heroes/${slug}`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.hero) {
          return result.hero;
        }
      }
      
      // Fallback: chercher dans les héros déjà chargés
      return allHeroes.find(h => h.slug === slug)?.rawData || null;
      
    } catch (error) {
      console.error(`Erreur chargement détails ${slug}:`, error);
      return null;
    }
  };

  // 🔥 RECHERCHER UN HÉROS PAR SLUG
  const getHeroBySlug = (slug) => {
    return allHeroes.find(hero => 
      hero.slug === slug || 
      hero.id === slug ||
      hero.name?.toLowerCase() === slug?.toLowerCase()
    );
  };

  // 🔥 METTRE À JOUR LES FILTRES
  const updateFilter = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  // 🔥 RÉINITIALISER LES FILTRES
  const resetFilters = () => {
    setFilters({
      role: 'all',
      sort: 'name',
      search: '',
      availability: 'all'
    });
  };

  // 🔥 RECHARGER LES HÉROS
  const refreshHeroes = async () => {
    return await loadAllHeroes();
  };

  // Charger au démarrage
  useEffect(() => {
    loadAllHeroes();
  }, [loadAllHeroes]);

  // Valeur du contexte
  const value = {
    // Données
    allHeroes,
    currentHeroes: filteredHeroes,
    loading,
    source,
    filters,
    
    // Statistiques
    heroCount: filteredHeroes.length,
    totalHeroes: allHeroes.length,
    
    // Actions
    updateFilter,
    resetFilters,
    refreshHeroes,
    loadHeroDetails,
    getHeroBySlug,
    
    // Constantes
    API_BASE_URL,
    ASSETS_BASE_URL
  };

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
};

// 🔥 EXPORT DU HOOK useHeroContext
export const useHeroContext = () => {
  const context = useContext(HeroContext);
  if (!context) {
    throw new Error('useHeroContext must be used within a HeroProvider');
  }
  return context;
};

export default HeroProvider;