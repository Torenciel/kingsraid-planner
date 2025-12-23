// contexts/ArtifactContext.js - VERSION SIMPLIFIÉE POUR MONGODB
import { createContext, useContext, useEffect, useState } from "react";

const ArtifactContext = createContext();

export const useArtifacts = () => {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error("useArtifacts must be used within ArtifactProvider");
  }
  return context;
};

export const ArtifactProvider = ({ children }) => {
  const [state, setState] = useState({
    allArtifacts: [],
    loading: true,
    error: null,
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
  const ASSETS_BASE_URL = process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002';

  // 🔥 MODIFIÉ : Helper pour les URLs d'images
  const getArtifactImageUrl = (artifact) => {
    if (!artifact) return '';
    
    // Priorité 1: thumbnail du backend
    if (artifact.thumbnail) {
      // Si c'est un chemin relatif, ajouter le base URL
      if (!artifact.thumbnail.startsWith('http') && !artifact.thumbnail.startsWith('/')) {
        return `${ASSETS_BASE_URL}/kingsraid-data/assets/${artifact.thumbnail}`;
      }
      return artifact.thumbnail;
    }
    
    // Priorité 2: utiliser le slug
    if (artifact.slug) {
      return `${ASSETS_BASE_URL}/kingsraid-data/assets/artifacts/${artifact.slug}.png`;
    }
    
    // Fallback: utiliser le nom formaté
    const formattedName = artifact.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
    return `${ASSETS_BASE_URL}/kingsraid-data/assets/artifacts/${formattedName}.png`;
  };

  // 🔥 MODIFIÉ : Charger depuis le nouveau backend (format correct)
  const loadArtifacts = async () => {
    try {
      console.log("🔄 Loading artifacts from MongoDB API v2...");
      
      const response = await fetch(`${API_BASE_URL}/api/v2/artifacts`);
      
      if (!response.ok) {
        throw new Error(`Failed to load artifacts: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // 🔥 IMPORTANT : Le backend retourne { success, count, artifacts }
      if (!result.success) {
        throw new Error(result.error || 'Failed to load artifacts');
      }
      
      // Transformer au format du frontend
      const artifacts = result.artifacts.map(artifact => ({
        // ID unique
        id: artifact.id || artifact._id,
        
        // Données de base
        name: artifact.name,
        description: artifact.description || '',
        
        // Slug pour identification
        slug: artifact.slug,
        
        // Image
        thumbnail: getArtifactImageUrl(artifact),
        
        // Valeurs (0-5 étoiles)
        values: artifact.values || artifact.value || {},
        
        // Données complètes MongoDB
        rawData: artifact,
        
        // Métadonnées
        releaseOrder: artifact.releaseOrder || 999
      }));

      console.log(`✅ Loaded ${artifacts.length} artifacts from MongoDB API`);
      
      setState({
        allArtifacts: artifacts,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error("❌ Error loading artifacts:", error);
      
      // Tentative de fallback vers l'ancienne API
      try {
        console.log("🔄 Trying fallback to JSON file...");
        const fallbackResponse = await fetch(`${ASSETS_BASE_URL}/kingsraid-data/table-data/artifacts.json`);
        
        if (fallbackResponse.ok) {
          const fallbackArtifacts = await fallbackResponse.json();
          console.log(`✅ Loaded ${fallbackArtifacts.length} artifacts from fallback`);
          
          const transformedArtifacts = fallbackArtifacts.map(artifact => ({
            id: artifact._id || artifact.id || artifact.name,
            name: artifact.name,
            description: artifact.description || '',
            thumbnail: getArtifactImageUrl(artifact),
            values: artifact.value || {},
            rawData: artifact,
            slug: artifact.name.toLowerCase().replace(/\s+/g, '-')
          }));
          
          setState({
            allArtifacts: transformedArtifacts,
            loading: false,
            error: null,
          });
          return;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }
      
      setState({
        allArtifacts: [],
        loading: false,
        error: error.message,
      });
    }
  };

  // 🔥 MODIFIÉ : Recharger les données
  const refreshArtifacts = async () => {
    setState(prev => ({ ...prev, loading: true }));
    await loadArtifacts();
  };

  // 🔥 MODIFIÉ : Obtenir un artifact par slug
  const getArtifactBySlug = (slug) => {
    if (!slug) return null;
    
    return state.allArtifacts.find(artifact => 
      artifact.slug === slug || 
      artifact.id === slug ||
      artifact.name.toLowerCase().replace(/\s+/g, '-') === slug
    );
  };

  // 🔥 MODIFIÉ : Obtenir un artifact par ID
  const getArtifactById = (id) => {
    if (!id) return null;
    
    return state.allArtifacts.find(artifact => 
      artifact.id === id ||
      artifact._id === id ||
      artifact.slug === id
    );
  };

  // 🔥 MODIFIÉ : Recherche améliorée
  const searchArtifacts = (searchTerm) => {
    if (!searchTerm.trim()) return state.allArtifacts;
    
    const term = searchTerm.toLowerCase();
    return state.allArtifacts.filter(artifact =>
      artifact.name?.toLowerCase().includes(term) ||
      artifact.description?.toLowerCase().includes(term) ||
      artifact.slug?.toLowerCase().includes(term)
    );
  };

  // 🔥 NOUVEAU : Formater les valeurs pour l'overlay
  const formatArtifactValues = (artifact, stars = 0) => {
    if (!artifact?.values) return [];
    
    const formatted = [];
    const values = artifact.values;
    
    // Parcourir les propriétés (0, 1, etc.)
    Object.entries(values).forEach(([statIndex, starValues]) => {
      if (starValues && typeof starValues === 'object') {
        const valueForStars = starValues[stars] || starValues[stars?.toString()];
        if (valueForStars) {
          formatted.push({
            label: `Stat ${parseInt(statIndex) + 1}`,
            value: valueForStars
          });
        }
      }
    });
    
    return formatted;
  };

  // Chargement initial
  useEffect(() => {
    loadArtifacts();
  }, []);

  const value = {
    // Données
    allArtifacts: state.allArtifacts,
    loading: state.loading,
    error: state.error,
    
    // Statistiques
    count: state.allArtifacts.length,
    
    // Fonctions utilitaires
    refreshArtifacts,
    getArtifactBySlug,
    getArtifactById,
    searchArtifacts,
    getArtifactImageUrl,
    formatArtifactValues,
    
    // 🔥 NOUVEAU : Fonction pour créer l'objet de sauvegarde
    createArtifactForSave: (artifact, stars = 0) => {
      if (!artifact) return null;
      
      return {
        artifactSlug: artifact.slug || artifact.id,
        artifactInfo: {
          name: artifact.name,
          thumbnail: artifact.thumbnail,
          description: artifact.description
        },
        stars: stars
      };
    }
  };

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
};