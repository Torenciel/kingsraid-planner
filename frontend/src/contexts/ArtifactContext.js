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

  // Helper simple pour les URLs d'images
  const getArtifactImageUrl = (artifactName) => {
    if (!artifactName) return '';
    const formattedName = artifactName.toLowerCase().replace(/\s+/g, '_');
    return `${ASSETS_BASE_URL}/kingsraid-data/assets/artifacts/${formattedName}.png`;
  };

  // 🚀 SIMPLE: Charger depuis MongoDB API v2
  const loadArtifacts = async () => {
    try {
      console.log("🔄 Loading artifacts from MongoDB...");
      
      const response = await fetch(`${API_BASE_URL}/api/v2/artifacts`);
      
      if (!response.ok) {
        throw new Error(`Failed to load artifacts: ${response.status}`);
      }
      
      const artifactsData = await response.json();
      
      // Transformer au format simple
      const artifacts = artifactsData.map(artifact => ({
        id: artifact.slug || artifact.name.toLowerCase().replace(/\s+/g, '-'),
        name: artifact.name,
        description: artifact.description || '',
        thumbnail: artifact.thumbnail || getArtifactImageUrl(artifact.name),
        // Garder les données MongoDB si besoin
        rawData: artifact
      }));

      console.log(`✅ Loaded ${artifacts.length} artifacts from MongoDB`);
      
      setState({
        allArtifacts: artifacts,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error("❌ Error loading artifacts:", error);
      
      setState({
        allArtifacts: [],
        loading: false,
        error: error.message,
      });
    }
  };

  // Recharger les données
  const refreshArtifacts = async () => {
    setState(prev => ({ ...prev, loading: true }));
    await loadArtifacts();
  };

  // Obtenir un artifact par slug
  const getArtifactBySlug = async (slug) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v2/artifacts/${slug}`);
      if (response.ok) {
        const artifact = await response.json();
        return {
          id: artifact.slug,
          name: artifact.name,
          description: artifact.description || '',
          thumbnail: artifact.thumbnail || getArtifactImageUrl(artifact.name),
          details: artifact
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching artifact ${slug}:`, error);
      return null;
    }
  };

  // Recherche simple
  const searchArtifacts = (searchTerm) => {
    if (!searchTerm.trim()) return state.allArtifacts;
    
    const term = searchTerm.toLowerCase();
    return state.allArtifacts.filter(artifact =>
      artifact.name.toLowerCase().includes(term) ||
      artifact.description.toLowerCase().includes(term)
    );
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
    
    // Fonctions
    refreshArtifacts,
    getArtifactBySlug,
    searchArtifacts,
    getArtifactImageUrl,
  };

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
};