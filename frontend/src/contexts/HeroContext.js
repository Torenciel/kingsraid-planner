// src/contexts/HeroContext.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  const [source, setSource] = useState("json"); // "json" ou "mongodb"

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

  // Charger l'ordre Masang (URL COMPLÈTE)
  const loadMasangOrder = async () => {
    try {
      const masangUrl = `${API_BASE_URL}/kingsraid-data/hero_release_order_masang.json`;
      console.log('📄 Loading masang order from:', masangUrl);
      
      const response = await fetch(masangUrl);
      if (response.ok) {
        const masangData = await response.json();
        
        // Le format peut être un tableau ou un objet
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

  // Charger l'ordre de release normal (URL COMPLÈTE)
  const loadReleaseOrder = async () => {
    try {
      const releaseUrl = `${API_BASE_URL}/kingsraid-data/hero_release_order.json`;
      console.log('📄 Loading release order from:', releaseUrl);
      
      const response = await fetch(releaseUrl);
      if (response.ok) {
        const releaseData = await response.json();
        setReleaseOrder(releaseData);
        console.log("✅ Release order loaded");
      } else {
        console.warn('⚠️ Release order not found, using empty object');
        setReleaseOrder({});
      }
    } catch (error) {
      console.error("❌ Error loading release order:", error);
      setReleaseOrder({});
    }
  };

  // 🆕 Charger les héros depuis MongoDB (URL COMPLÈTE)
  const loadHeroesFromMongoDB = async () => {
    try {
      console.log("🔄 Loading heroes from MongoDB...");
      const mongoUrl = `${API_BASE_URL}/api/heroes`;
      console.log('📡 MongoDB URL:', mongoUrl);
      
      const response = await fetch(mongoUrl);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📦 MongoDB response:', result);
        
        // Votre API Express peut retourner différents formats
        // Format 1: Votre serveur actuel
        if (result.heroes && Array.isArray(result.heroes)) {
          const heroes = result.heroes.map(hero => ({
            id: hero.id || hero.name.toLowerCase(),
            name: hero.name,
            role: hero.role,
            image: getHeroImageUrl(hero.name),
            rarity: hero.rarity || 5,
            releaseOrder: hero.releaseOrder || releaseOrder[hero.name] || 999,
            masangOrder: hero.masangOrder || masangOrder.indexOf(hero.name) + 1 || 999
          }));
          
          setAllHeroes(heroes);
          setSource("mongodb");
          console.log(`✅ ${heroes.length} héros chargés depuis MongoDB (format 1)`);
          return true;
        }
        
        // Format 2: Tableau direct
        if (Array.isArray(result) && result.length > 0) {
          const heroes = result.map(hero => ({
            id: hero.id || hero.name.toLowerCase(),
            name: hero.name,
            role: hero.role,
            image: getHeroImageUrl(hero.name),
            rarity: 5,
            releaseOrder: hero.releaseOrder || releaseOrder[hero.name] || 999
          }));
          
          setAllHeroes(heroes);
          setSource("mongodb");
          console.log(`✅ ${heroes.length} héros chargés depuis MongoDB (format 2)`);
          return true;
        }
        
        // Format 3: Avec propriété data
        if (result.data && Array.isArray(result.data)) {
          const heroes = result.data.map(hero => ({
            id: hero.id || hero.name.toLowerCase(),
            name: hero.name,
            role: hero.role || hero.class,
            image: getHeroImageUrl(hero.name),
            rarity: 5,
            releaseOrder: hero.releaseOrder || releaseOrder[hero.name] || 999
          }));
          
          setAllHeroes(heroes);
          setSource("mongodb");
          console.log(`✅ ${heroes.length} héros chargés depuis MongoDB (format 3)`);
          return true;
        }
        
        console.warn('⚠️ MongoDB returned unexpected format:', result);
      } else {
        console.warn('⚠️ MongoDB endpoint not available:', response.status);
      }
    } catch (error) {
      console.error("❌ MongoDB connection error:", error.message);
    }
    return false;
  };

  // Charger les héros depuis l'API Express (URL COMPLÈTE)
  const loadHeroesFromAPI = async () => {
    try {
      console.log("🔄 Loading heroes from Express API...");
      const apiUrl = `${API_BASE_URL}/api/heroes?sort=name`;
      console.log('📡 API URL:', apiUrl);
      
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 API response:", data);
        
        if (data.heroes?.length > 0) {
          const heroes = data.heroes.map(hero => ({
            id: hero.id || hero.name.toLowerCase(),
            name: hero.name,
            role: hero.role || hero.class,
            image: getHeroImageUrl(hero.name),
            rarity: hero.rarity || 5,
            releaseOrder: hero.releaseOrder || releaseOrder[hero.name] || 999,
            hasImage: hero.hasImage || true
          }));
          
          setAllHeroes(heroes);
          console.log(`✅ ${heroes.length} héros chargés depuis Express API`);
          return true;
        }
      } else {
        console.warn('⚠️ Express API endpoint not available:', response.status);
      }
    } catch (error) {
      console.error("❌ Express API error:", error.message);
    }
    return false;
  };

  // Fallback avec héros de test
  const loadTestHeroes = () => {
    const testHeroes = [
      {
        id: "kasel",
        name: "Kasel",
        role: "Warrior",
        image: getHeroImageUrl("Kasel"),
        rarity: 5,
        releaseOrder: releaseOrder["Kasel"] || 1
      },
      {
        id: "frey",
        name: "Frey",
        role: "Priest",
        image: getHeroImageUrl("Frey"),
        rarity: 5,
        releaseOrder: releaseOrder["Frey"] || 2
      },
      {
        id: "cleo",
        name: "Cleo",
        role: "Wizard",
        image: getHeroImageUrl("Cleo"),
        rarity: 5,
        releaseOrder: releaseOrder["Cleo"] || 3
      },
      {
        id: "roi",
        name: "Roi",
        role: "Assassin",
        image: getHeroImageUrl("Roi"),
        rarity: 5,
        releaseOrder: releaseOrder["Roi"] || 4
      },
      {
        id: "clause",
        name: "Clause",
        role: "Knight",
        image: getHeroImageUrl("Clause"),
        rarity: 5,
        releaseOrder: releaseOrder["Clause"] || 5
      },
    ];
    setAllHeroes(testHeroes);
    console.log("⚠️  Using test heroes as fallback");
  };

  // 🆕 Migrer vers MongoDB
  const migrateToMongoDB = async () => {
    if (source === "mongodb") {
      return { success: false, message: "Already using MongoDB" };
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/heroes/migrate`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Recharger depuis MongoDB
        await loadHeroesFromMongoDB();
      }
      
      return result;
    } catch (error) {
      console.error("❌ Migration error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 🎯 FONCTION POUR APPLIQUER TOUS LES FILTRES
  const filteredHeroes = useMemo(() => {
    if (!allHeroes.length) return [];

    let result = [...allHeroes];

    // 1. FILTRE DISPONIBILITÉ
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
    const initializeData = async () => {
      setLoading(true);
      console.log('🚀 Initializing HeroContext...');
      console.log('🔧 Configuration:', {
        API_BASE_URL,
        ASSETS_BASE_URL,
        NODE_ENV: process.env.NODE_ENV
      });
      
      // Charger les ordres de release
      await Promise.all([
        loadMasangOrder(),
        loadReleaseOrder()
      ]);

      console.log('📊 Data loaded:', {
        masangOrderCount: masangOrder.length,
        releaseOrderCount: Object.keys(releaseOrder).length
      });

      // Essayer Express API d'abord
      console.log('🔍 Trying Express API...');
      const apiSuccess = await loadHeroesFromAPI();
      
      if (!apiSuccess) {
        // Fallback: MongoDB
        console.log('🔍 Trying MongoDB...');
        const mongoSuccess = await loadHeroesFromMongoDB();
        
        if (!mongoSuccess) {
          // Dernier fallback: héros de test
          console.log('⚠️ Using test heroes as fallback');
          loadTestHeroes();
        }
      }

      console.log('✅ HeroContext initialized');
      console.log('📈 Stats:', {
        totalHeroes: allHeroes.length,
        source: source,
        loading: false
      });
      
      setLoading(false);
    };

    initializeData();
  }, []);

  // 🆕 Recharger les héros
  const refreshHeroes = async () => {
    setLoading(true);
    const success = await loadHeroesFromAPI();
    if (!success) {
      await loadHeroesFromMongoDB();
    }
    setLoading(false);
  };

  // 🆕 Tester la connexion API
  const testApiConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug`);
      return {
        success: response.ok,
        status: response.status,
        url: API_BASE_URL
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url: API_BASE_URL
      };
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
    migrateToMongoDB,
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
  };

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
};