// frontend/src/contexts/HeroContext.jsx
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

const HeroContext = createContext();

export const HeroProvider = ({ children }) => {
  // State
  const [allHeroes, setAllHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'all',
    sort: 'name',
    search: '',
    availability: 'all' // 'all' or 'available'
  });
  const [source, setSource] = useState('mongodb');
  const [availableHeroesList, setAvailableHeroesList] = useState([]);
  
  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  const ASSETS_BASE_URL = process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002';

  // Load available heroes list
  const loadAvailableHeroes = useCallback(async () => {
    try {
      const response = await fetch('/kingsraid-data/hero_release_order_masang.json');
      if (response.ok) {
        const data = await response.json();
        const availableNames = Object.keys(data);
        setAvailableHeroesList(availableNames);
        return availableNames;
      }
    } catch (error) {}
    return [];
  }, []);

  // Load all heroes
  const loadAllHeroes = useCallback(async () => {
    try {
      setLoading(true);
      
      const availableNames = await loadAvailableHeroes();
      
      const response = await fetch(`${API_BASE_URL}/api/v2/heroes`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.heroes) {
          const formattedHeroes = result.heroes.map(hero => ({
            id: hero._id?.toString() || hero.id,
            slug: hero.slug,
            name: hero.name,
            role: hero.class,
            class: hero.class,
            position: hero.position || 'Unknown',
            image: hero.thumbnail || `${ASSETS_BASE_URL}/kingsraid-data/assets/heroes/${hero.name}/ico.png`,
            rarity: 5,
            releaseOrder: hero.releaseOrder || 999,
            isAvailable: availableNames.includes(hero.name),
            hasUW: false,
            hasSW: false,
            utsCount: 0,
            infos: {
              name: hero.name,
              class: hero.class,
              position: hero.position,
              thumbnail: hero.thumbnail
            }
          }));
          
          setAllHeroes(formattedHeroes);
          setSource('mongodb');
          return formattedHeroes;
        }
      }
      
      return await loadHeroesFromJSON(availableNames);
      
    } catch (error) {
      const testHeroes = getTestHeroes();
      setAllHeroes(testHeroes);
      setSource('test');
      return testHeroes;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, ASSETS_BASE_URL, loadAvailableHeroes]);

  // Load heroes from local JSON
  const loadHeroesFromJSON = async (availableNames = []) => {
    try {
      const response = await fetch('/kingsraid-data/hero_release_order.json');
      if (response.ok) {
        const data = await response.json();
        
        const formattedHeroes = Object.entries(data).map(([heroName, releaseOrder]) => ({
          id: heroName.toLowerCase().replace(/\s+/g, '-'),
          slug: heroName.toLowerCase().replace(/\s+/g, '-'),
          name: heroName,
          role: 'Unknown',
          class: 'Unknown',
          position: 'Unknown',
          image: `${ASSETS_BASE_URL}/kingsraid-data/assets/heroes/${heroName}/ico.png`,
          rarity: 5,
          releaseOrder: parseInt(releaseOrder) || 999,
          isAvailable: availableNames.includes(heroName),
          infos: {
            name: heroName
          }
        }));
        
        setAllHeroes(formattedHeroes);
        setSource('json');
        return formattedHeroes;
      }
    } catch (error) {}
    return [];
  };

  // Test data fallback
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
        isAvailable: true,
        infos: { name: 'Kasel', class: 'Warrior', position: 'Front' }
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
        isAvailable: true,
        infos: { name: 'Frey', class: 'Priest', position: 'Back' }
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
        isAvailable: false,
        infos: { name: 'Cleo', class: 'Wizard', position: 'Back' }
      }
    ];
  };

  // Filter and sort heroes
  const filteredHeroes = useMemo(() => {
    let result = [...allHeroes];
    
    if (filters.availability === 'available') {
      result = result.filter(hero => hero.isAvailable === true);
    }
    
    if (filters.role !== 'all') {
      result = result.filter(hero => 
        hero.role === filters.role || 
        hero.class === filters.role ||
        hero.infos?.class === filters.role
      );
    }
    
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(hero =>
        hero.name.toLowerCase().includes(searchTerm) ||
        hero.slug.toLowerCase().includes(searchTerm) ||
        (hero.infos?.name?.toLowerCase() || '').includes(searchTerm)
      );
    }
    
    switch (filters.sort) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'release':
        result.sort((a, b) => (a.releaseOrder || 999) - (b.releaseOrder || 999));
        break;
      case 'masang':
        result.sort((a, b) => {
          if (a.isAvailable && !b.isAvailable) return -1;
          if (!a.isAvailable && b.isAvailable) return 1;
          return a.name.localeCompare(b.name);
        });
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [allHeroes, filters]);

  const heroCount = filteredHeroes.length;
  const totalHeroes = allHeroes.length;
  const availableCount = useMemo(() => 
    allHeroes.filter(hero => hero.isAvailable === true).length, 
    [allHeroes]
  );

  const loadHeroDetails = async (slug) => {
    const response = await fetch(`${API_BASE_URL}/api/v2/heroes/${slug}`);
    const data = await response.json();

    if (data.success && data.hero) {
      return data.hero;
    }

    return null;
  };

  const getHeroBySlug = (slug) => {
    return allHeroes.find(hero => 
      hero.slug === slug || 
      hero.id === slug ||
      hero.name?.toLowerCase() === slug?.toLowerCase()
    );
  };

  const updateFilter = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const resetFilters = () => {
    setFilters({
      role: 'all',
      sort: 'name',
      search: '',
      availability: 'all'
    });
  };

  const refreshHeroes = async () => {
    return await loadAllHeroes();
  };

  const isHeroAvailable = (heroName) => {
    return availableHeroesList.includes(heroName);
  };

  useEffect(() => {
    loadAllHeroes();
  }, [loadAllHeroes]);

  const value = {
    allHeroes,
    currentHeroes: filteredHeroes,
    loading,
    source,
    filters,
    heroCount,
    totalHeroes,
    availableCount,
    updateFilter,
    resetFilters,
    refreshHeroes,
    loadHeroDetails,
    getHeroBySlug,
    isHeroAvailable,
    API_BASE_URL,
    ASSETS_BASE_URL
  };

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
};

export const useHeroContext = () => {
  const context = useContext(HeroContext);
  if (!context) {
    throw new Error('useHeroContext must be used within a HeroProvider');
  }
  return context;
};

export default HeroProvider;
