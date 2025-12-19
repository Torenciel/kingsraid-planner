// src/contexts/HeroContext.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useHeroes, useHero } from "../hooks/useApi"; // <-- IMPORT DES NOUVEAUX HOOKS

const HeroContext = createContext();

export const useHeroContext = () => {
  const context = useContext(HeroContext);
  if (!context) {
    throw new Error("useHeroContext must be used within a HeroProvider");
  }
  return context;
};

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
const ASSETS_BASE_URL = process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002';

export const HeroProvider = ({ children }) => {
  const [allHeroes, setAllHeroes] = useState([]);
  const [masangOrder, setMasangOrder] = useState([]);
  const [releaseOrder, setReleaseOrder] = useState({});
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("mongodb"); // <-- DÉFAUT: "mongodb"

  // 🎯 TOUS LES FILTRES DANS UN SEUL OBJET
  const [filters, setFilters] = useState({
    availability: "all",
    role: "all",
    sort: "name",
    search: "",
  });

  // Helper pour les URLs d'assets
  const getAssetUrl = (path) => {
    return `${ASSETS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Helper pour les images de héros
  const getHeroImageUrl = (heroName) => {
    return getAssetUrl(`/kingsraid-data/assets/heroes/${heroName}/ico.png`);
  };

  // Charger l'ordre Masang (URL COMPLÈTE) - GARDÉ POUR COMPATIBILITÉ
  const loadMasangOrder = async () => {
    try {
      const masangUrl = `${API_BASE_URL}/kingsraid-data/hero_release_order_masang.json`;
      console.log('📄 Loading masang order from:', masangUrl);
      
      const response = await fetch(masangUrl);
      if (response.ok) {
        const masangData = await response.json();
        
        if (Array.isArray(masangData)) {
          setMasangOrder(masangData);
          console.log("✅ Masang order loaded (array):", masangData.length, "heroes");
        } else if (masangData && typeof masangData === 'object') {
          setMasangOrder(Object.keys(masangData));
          console.log("✅ Masang order loaded (object):", Object.keys(masangData).length, "heroes");
        }
      } else {
        console.warn('⚠️ Masang order not found, using empty array');
        setMasangOrder([]);
      }
    } catch (error) {
      console.error("❌ Error loading masang order:", error);
      setMasangOrder([]);
    }
  };

  // 🆕 NOUVELLE FONCTION: Charger les héros depuis API v2 (MongoDB)
  const loadHeroesFromMongoDBv2 = async () => {
    try {
      console.log("🔄 Loading heroes from MongoDB API v2...");
      
      // Utilisation directe du hook useHeroes
      const response = await fetch(`${API_BASE_URL}/api/v2/heroes`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const heroesData = await response.json();
      console.log('📦 MongoDB v2 response:', heroesData);
      
      if (!Array.isArray(heroesData)) {
        throw new Error('Expected array from API v2');
      }
      
      // Transformer les données MongoDB en format compatible
      const transformedHeroes = heroesData.map(hero => {
        // hero est un document MongoDB avec infos.name, infos.class, etc.
        const heroName = hero.infos?.name || hero.slug;
        const heroClass = hero.infos?.class || 'Unknown';
        
        return {
          // ID: utiliser slug pour la cohérence
          id: hero.slug || heroName.toLowerCase().replace(/\s+/g, '-'),
          // Nom complet
          name: heroName,
          // Rôle/classe
          role: heroClass,
          // Image
          image: getHeroImageUrl(heroName),
          // Rareté par défaut
          rarity: 5,
          // Ordre de release (à adapter selon vos données)
          releaseOrder: hero.releaseOrder || releaseOrder[heroName] || 999,
          // Données brutes MongoDB pour référence
          _mongodb: {
            slug: hero.slug,
            data: hero
          }
        };
      });
      
      setAllHeroes(transformedHeroes);
      setSource("mongodb");
      console.log(`✅ ${transformedHeroes.length} héros chargés depuis MongoDB API v2`);
      return true;
      
    } catch (error) {
      console.error("❌ MongoDB v2 connection error:", error.message);
      return false;
    }
  };

  // 🆕 FONCTION SIMPLIFIÉE: Charger avec fallback
  const loadAllHeroes = async () => {
    setLoading(true);
    
    console.log('🚀 Starting hero data loading...');
    
    // 1. Charger les données de référence (masang, release order)
    await Promise.all([
      loadMasangOrder(),
      // loadReleaseOrder() si nécessaire
    ]);
    
    // 2. Essayer MongoDB API v2 d'abord
    console.log('🔍 Trying MongoDB API v2...');
    const mongoV2Success = await loadHeroesFromMongoDBv2();
    
    if (!mongoV2Success) {
      // 3. Fallback: API v1 (JSON)
      console.log('🔍 Falling back to API v1 (JSON)...');
      const v1Success = await loadHeroesFromAPIv1();
      
      if (!v1Success) {
        // 4. Dernier fallback: héros de test
        console.log('⚠️ Using test heroes as last resort');
        loadTestHeroes();
      }
    }
    
    setLoading(false);
  };

  // 🆕 FONCTION: Charger depuis API v1 (pour compatibilité)
  const loadHeroesFromAPIv1 = async () => {
    try {
      console.log("🔄 Loading heroes from API v1...");
      const apiUrl = `${API_BASE_URL}/api/heroes?sort=name`;
      
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        
        if (data.heroes?.length > 0) {
          const heroes = data.heroes.map(hero => ({
            id: hero.id || hero.name.toLowerCase(),
            name: hero.name,
            role: hero.role || hero.class,
            image: getHeroImageUrl(hero.name),
            rarity: hero.rarity || 5,
            releaseOrder: hero.releaseOrder || 999,
            hasImage: hero.hasImage || true
          }));
          
          setAllHeroes(heroes);
          setSource("json");
          console.log(`✅ ${heroes.length} héros chargés depuis API v1`);
          return true;
        }
      }
    } catch (error) {
      console.error("❌ API v1 error:", error.message);
    }
    return false;
  };

  // Fallback avec héros de test (GARDÉ)
  const loadTestHeroes = () => {
    const testHeroes = [
      {
        id: "kasel",
        name: "Kasel",
        role: "Warrior",
        image: getHeroImageUrl("Kasel"),
        rarity: 5,
        releaseOrder: 1
      },
      {
        id: "frey",
        name: "Frey",
        role: "Priest",
        image: getHeroImageUrl("Frey"),
        rarity: 5,
        releaseOrder: 2
      },
      {
        id: "cleo",
        name: "Cleo",
        role: "Wizard",
        image: getHeroImageUrl("Cleo"),
        rarity: 5,
        releaseOrder: 3
      },
      {
        id: "roi",
        name: "Roi",
        role: "Assassin",
        image: getHeroImageUrl("Roi"),
        rarity: 5,
        releaseOrder: 4
      },
      {
        id: "clause",
        name: "Clause",
        role: "Knight",
        image: getHeroImageUrl("Clause"),
        rarity: 5,
        releaseOrder: 5
      },
    ];
    setAllHeroes(testHeroes);
    setSource("test");
    console.log("⚠️  Using test heroes as fallback");
  };

  // 🎯 FONCTION POUR APPLIQUER TOUS LES FILTRES
  const filteredHeroes = useMemo(() => {
    if (!allHeroes.length) return [];

    let result = [...allHeroes];

    // 1. FILTRE DISPONIBILITÉ (si masangOrder existe)
    if (filters.availability === "available" && masangOrder.length > 0) {
      result = result.filter((hero) => masangOrder.includes(hero.name));
    }

    // 2. FILTRE RÔLE
    if (filters.role !== "all") {
      result = result.filter((hero) => hero.role === filters.role);
    }

    // 3. FILTRE RECHERCHE
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter((hero) =>
        hero.name.toLowerCase().includes(searchTerm)
      );
    }

    // 4. TRI
    switch (filters.sort) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "release":
        result.sort((a, b) => {
          const orderA = a.releaseOrder || 999;
          const orderB = b.releaseOrder || 999;
          return orderA - orderB;
        });
        break;
      case "masang":
        if (masangOrder.length > 0) {
          result.sort((a, b) => {
            const indexA = masangOrder.indexOf(a.name);
            const indexB = masangOrder.indexOf(b.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
          });
        } else {
          result.sort((a, b) => a.name.localeCompare(b.name));
        }
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [allHeroes, masangOrder, filters]);

  // 🎯 FONCTION POUR METTRE À JOUR LES FILTRES
  const updateFilter = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Initialisation
  useEffect(() => {
    loadAllHeroes();
  }, []);

  // 🆕 Recharger les héros
  const refreshHeroes = async () => {
    setLoading(true);
    const success = await loadHeroesFromMongoDBv2();
    if (!success) {
      await loadHeroesFromAPIv1();
    }
    setLoading(false);
  };

  // 🆕 Tester la connexion API
  const testApiConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        mongodb: data.mongodb?.connected || false,
        url: API_BASE_URL,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url: API_BASE_URL
      };
    }
  };

  // 🆕 Obtenir un héros spécifique par slug
  const getHeroBySlug = async (slug) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/heroes/${slug}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error(`Error fetching hero ${slug}:`, error);
      return null;
    }
  };

  const value = {
    // Données
    allHeroes,
    currentHeroes: filteredHeroes,
    loading,
    source,
    isFromMongoDB: source === "mongodb",

    // Filtres
    filters,

    // Fonctions
    updateFilter,
    refreshHeroes,
    getHeroBySlug,
    testApiConnection,
    getHeroImageUrl,
    getAssetUrl,

    // Configuration
    apiBaseUrl: API_BASE_URL,
    assetsBaseUrl: ASSETS_BASE_URL,

    // Statistiques
    heroCount: filteredHeroes.length,
    totalHeroes: allHeroes.length,
    masangOrderCount: masangOrder.length,
    
    // Info source
    dataSource: source
  };

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
};