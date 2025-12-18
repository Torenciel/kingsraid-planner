import { useEffect, useState } from "react";

export const useHeroData = (heroName) => {
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("mongodb"); // "mongodb" ou "json"

  useEffect(() => {
    if (!heroName) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔄 Chargement héros: ${heroName}`);
        
        // ESSAIER D'ABORD MONGODB
        try {
          // Vérifier si le backend MongoDB est disponible
          const healthResponse = await fetch('/api/health');
          if (healthResponse.ok) {
            const health = await healthResponse.json();
            
            if (health.mongoDB === 'connected') {
              console.log("📡 Tentative de chargement depuis MongoDB...");
              
              // Essayer par nom
              const response = await fetch(`/api/heroes/name/${heroName}`);
              
              if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.data) {
                  // Format compatible avec ton HeroContext
                  const formattedData = {
                    id: result.data.heroId || heroName.toLowerCase(),
                    name: result.data.infos.name,
                    role: result.data.infos.class,
                    image: `/kingsraid-data/assets/heroes/${result.data.infos.name}/ico.png`,
                    releaseOrder: result.data.releaseOrder,
                    masangOrder: result.data.masangOrder,
                    rarity: 5, // Par défaut
                    
                    // Données complètes pour compatibilité
                    infos: result.data.infos,
                    skills: result.data.skills ? Object.fromEntries(result.data.skills) : {},
                    uw: result.data.uw,
                    uts: result.data.uts ? Object.fromEntries(result.data.uts) : {},
                    sw: result.data.sw,
                    perks: result.data.perks,
                    books: result.data.books ? Object.fromEntries(result.data.books) : {},
                    splashart: result.data.splashart
                  };
                  
                  setHeroData(formattedData);
                  setSource("mongodb");
                  console.log(`✅ Héros chargé depuis MongoDB: ${heroName}`);
                  return;
                }
              }
            }
          }
        } catch (mongoError) {
          console.log("⚠️  MongoDB non disponible:", mongoError.message);
        }

        // FALLBACK: JSON ORIGINAL (ton système actuel)
        console.log("📄 Chargement depuis JSON local...");
        const jsonResponse = await fetch(
          `/kingsraid-data/table-data/heroes/${heroName}.json`
        );

        if (!jsonResponse.ok) {
          throw new Error(`Héros "${heroName}" non trouvé`);
        }

        const jsonData = await jsonResponse.json();
        
        // Format compatible avec ton HeroContext
        const formattedData = {
          id: heroName.toLowerCase(),
          name: jsonData.infos.name,
          role: jsonData.infos.class,
          image: `/kingsraid-data/assets/heroes/${jsonData.infos.name}/ico.png`,
          rarity: 5,
          
          // Données originales
          infos: jsonData.infos,
          skills: jsonData.skills,
          uw: jsonData.uw,
          uts: jsonData.uts,
          sw: jsonData.sw,
          perks: jsonData.perks,
          books: jsonData.books,
          splashart: jsonData.splashart
        };
        
        setHeroData(formattedData);
        setSource("json");
        console.log(`✅ Héros chargé depuis JSON: ${heroName}`);

      } catch (err) {
        console.error("❌ Erreur chargement:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [heroName]);

  return {
    // Données principales (compatibles avec ton HeroCard)
    heroData,
    loading,
    error,
    
    // Format pour HeroCard
    hero: heroData ? {
      id: heroData.id,
      name: heroData.name,
      role: heroData.role,
      image: heroData.image,
      rarity: heroData.rarity,
      releaseOrder: heroData.releaseOrder,
      masangOrder: heroData.masangOrder
    } : null,
    
    // Données détaillées
    infos: heroData?.infos,
    skills: heroData?.skills,
    uw: heroData?.uw,
    uts: heroData?.uts,
    sw: heroData?.sw,
    perks: heroData?.perks,
    books: heroData?.books,
    
    // Source
    source,
    isFromMongoDB: source === "mongodb"
  };
};