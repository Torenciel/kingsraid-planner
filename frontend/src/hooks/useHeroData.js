import { useEffect, useState } from "react";

export const useHeroData = (heroSlug) => {
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("mongodb");

  // Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  const ASSETS_BASE_URL = process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002';

const getHeroImageUrl = (heroName) => {
  if (!heroName) return '';

  // Clean the name (remove accents, special characters if needed)
  let cleanedName = heroName.trim();

  // Option 1: Use encodeURIComponent to handle everything
  const encodedName = encodeURIComponent(cleanedName);

  // Option 2: Replace only spaces (if other characters are already valid)
  // const encodedName = cleanedName.replace(/\s+/g, '%20');

  return `${ASSETS_BASE_URL}/kingsraid-data/assets/heroes/${encodedName}/ico.png`;
};

  useEffect(() => {
    if (!heroSlug) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Loading hero: ${heroSlug}`);

        // TRY THE NEW BACKEND FIRST (API v2)
        try {
          console.log("Attempting to load from API v2...");

          const response = await fetch(`${API_BASE_URL}/api/v2/heroes/${heroSlug}`);

          if (response.ok) {
            const result = await response.json();

            console.log('API v2 response:', result);

            if (result.success && result.hero) {
              const hero = result.hero;
              const heroName = hero.infos?.name || hero.name || heroSlug;

              // FORMAT: Compatible with the new system
              const formattedData = {
                // Base data
                id: hero._id || hero.id,
                slug: hero.slug,
                name: heroName,
                role: hero.infos?.class || hero.class || 'Unknown',
                class: hero.infos?.class || hero.class || 'Unknown',
                position: hero.infos?.position || hero.position || 'Unknown',
                image: hero.infos?.thumbnail || hero.thumbnail || getHeroImageUrl(hero.infos?.name || hero.name || heroSlug),
                rarity: 5,
                releaseOrder: hero.releaseOrder || 999,

                // Metadata
                hasUW: !!hero.uw?.name,
                hasSW: !!hero.sw?.requirement,
                utsCount: hero.uts ? Object.keys(hero.uts).length : 0,

                // Full data
                infos: hero.infos || {},
                skills: hero.skills || {},
                uw: hero.uw || {},
                uts: hero.uts || {},
                sw: hero.sw || {},
                perks: hero.perks || {},
                books: hero.books || {},
                splashart: hero.splashart,

                // Raw data
                rawData: hero
              };

              setHeroData(formattedData);
              setSource("mongodb");
              console.log(`Hero loaded from API v2: ${heroName}`);
              return;
            }
          }
        } catch (mongoError) {
          console.log("API v2 unavailable:", mongoError.message);
        }

        // FALLBACK: Old JSON system
        try {
          console.log("Loading from local JSON...");

          // Try different JSON sources
          const sources = [
            `/kingsraid-data/table-data/heroes/${heroSlug}.json`,
            `/kingsraid-data/table-data/heroes/${heroSlug.toLowerCase()}.json`,
            `/kingsraid-data/table-data/heroes.json`
          ];

          let jsonData = null;

          for (const source of sources) {
            try {
              const response = await fetch(source);
              if (response.ok) {
                const data = await response.json();

                // If it's an array of heroes, find the right one
                if (Array.isArray(data)) {
                  jsonData = data.find(h =>
                    h.slug === heroSlug ||
                    h.name?.toLowerCase() === heroSlug.toLowerCase() ||
                    h.infos?.name?.toLowerCase() === heroSlug.toLowerCase()
                  );
                } else {
                  jsonData = data;
                }

                if (jsonData) break;
              }
            } catch (e) {
              continue;
            }
          }

          if (!jsonData) {
            throw new Error(`Hero "${heroSlug}" not found in JSON files`);
          }

          const heroName = jsonData.infos?.name || jsonData.name || heroSlug;

          // Format for compatibility
          const formattedData = {
            id: jsonData._id || jsonData.id || heroSlug,
            slug: jsonData.slug || heroSlug,
            name: heroName,
            role: jsonData.infos?.class || jsonData.role || 'Unknown',
            class: jsonData.infos?.class || jsonData.class || 'Unknown',
            position: jsonData.infos?.position || jsonData.position || 'Unknown',
            image: getHeroImageUrl(heroName),
            rarity: 5,

            // Full data
            infos: jsonData.infos || {},
            skills: jsonData.skills || {},
            uw: jsonData.uw || {},
            uts: jsonData.uts || {},
            sw: jsonData.sw || {},
            perks: jsonData.perks || {},
            books: jsonData.books || {},
            splashart: jsonData.splashart,

            // Raw data
            rawData: jsonData
          };

          setHeroData(formattedData);
          setSource("json");
          console.log(`Hero loaded from JSON: ${heroName}`);

        } catch (jsonError) {
          console.log("JSON unavailable:", jsonError.message);
          throw new Error(`Unable to load hero "${heroSlug}"`);
        }

      } catch (err) {
        console.error("Load error:", err);
        setError(err.message);

        // Test data as last resort
        const testData = getTestHeroData(heroSlug);
        if (testData) {
          setHeroData(testData);
          setSource("test");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [heroSlug, API_BASE_URL, ASSETS_BASE_URL]);

  // Fallback test data
  const getTestHeroData = (slug) => {
    const testHeroes = {
      'kasel': {
        id: 'kasel',
        slug: 'kasel',
        name: 'Kasel',
        role: 'Warrior',
        class: 'Warrior',
        position: 'Front',
        image: getHeroImageUrl('Kasel'),
        rarity: 5,
        infos: {
          name: 'Kasel',
          class: 'Warrior',
          position: 'Front'
        },
        skills: {},
        uw: {},
        uts: {},
        sw: {},
        perks: {},
        books: {}
      },
      'frey': {
        id: 'frey',
        slug: 'frey',
        name: 'Frey',
        role: 'Priest',
        class: 'Priest',
        position: 'Back',
        image: getHeroImageUrl('Frey'),
        rarity: 5,
        infos: {
          name: 'Frey',
          class: 'Priest',
          position: 'Back'
        }
      }
    };

    return testHeroes[slug] || null;
  };

  // Get data for a specific UT
  const getUTData = (utNumber) => {
    if (!heroData?.uts) return null;

    if (typeof heroData.uts === 'object' && !Array.isArray(heroData.uts)) {
      // Map/object format with keys "1", "2", etc.
      return heroData.uts[utNumber] || heroData.uts[utNumber.toString()];
    }

    return null;
  };

  // Get data for a specific skill
  const getSkillData = (skillNumber) => {
    if (!heroData?.skills) return null;

    if (typeof heroData.skills === 'object' && !Array.isArray(heroData.skills)) {
      return heroData.skills[skillNumber] || heroData.skills[skillNumber.toString()];
    }

    return null;
  };

  // Get T3 perk data for a skill
  const getT3PerkData = (skillNumber, side = 'light') => {
    if (!heroData?.perks?.t3) return null;

    const t3Perks = heroData.perks.t3;
    if (typeof t3Perks === 'object') {
      const skillPerks = t3Perks[skillNumber] || t3Perks[skillNumber.toString()];
      if (skillPerks && typeof skillPerks === 'object') {
        return skillPerks[side];
      }
    }

    return null;
  };

  return {
    // Main data (normalized format)
    heroData,
    loading,
    error,

    // Formatted data for compatibility
    hero: heroData ? {
      id: heroData.id,
      slug: heroData.slug,
      name: heroData.name,
      role: heroData.role,
      class: heroData.class,
      position: heroData.position,
      image: heroData.image,
      rarity: heroData.rarity,
      releaseOrder: heroData.releaseOrder,
      hasUW: heroData.hasUW,
      hasSW: heroData.hasSW,
      utsCount: heroData.utsCount
    } : null,

    // Detailed data
    infos: heroData?.infos,
    skills: heroData?.skills,
    uw: heroData?.uw,
    uts: heroData?.uts,
    sw: heroData?.sw,
    perks: heroData?.perks,
    books: heroData?.books,
    splashart: heroData?.splashart,

    // Raw data
    rawData: heroData?.rawData,

    // Utility functions
    getUTData,
    getSkillData,
    getT3PerkData,

    // Source
    source,
    isFromMongoDB: source === "mongodb",
    isFromJSON: source === "json",
    isTestData: source === "test",

    // API URL for reference
    apiBaseUrl: API_BASE_URL
  };
};
