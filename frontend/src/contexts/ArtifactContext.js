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

  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "http://localhost:3002";

  /**
   * Build the public URL for an artifact image.
   * All artifact thumbnails are stored as:
   * "artifacts/Artifact Name.png"
   */
  const getArtifactPublicUrl = (artifact) => {
    if (!artifact || !artifact.thumbnail) {
      return "/default-avatar.png";
    }

    const filename = artifact.thumbnail.split("/").pop();
    const encodedFilename = filename.replace(/\s/g, "%20");

    return `/kingsraid-data/assets/artifacts/${encodedFilename}`;
  };

  /**
   * Load artifacts from MongoDB API.
   */
  const loadArtifacts = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/artifacts`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load artifacts: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Failed to load artifacts"
        );
      }

      const artifacts = result.artifacts.map((artifact) => ({
        id: artifact.id || artifact._id,
        name: artifact.name,
        description: artifact.description || "",
        slug: artifact.slug,
        thumbnail: artifact.thumbnail, // Keep relative path only
        values: artifact.values || artifact.value || {},
        rawData: artifact,
        releaseOrder: artifact.releaseOrder || 999,
      }));

      setState({
        allArtifacts: artifacts,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        allArtifacts: [],
        loading: false,
        error: error.message,
      });
    }
  };

  const refreshArtifacts = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    await loadArtifacts();
  };

  const getArtifactBySlug = (slug) => {
    if (!slug) return null;

    return state.allArtifacts.find(
      (artifact) =>
        artifact.slug === slug ||
        artifact.id === slug
    );
  };

  const getArtifactById = (id) => {
    if (!id) return null;

    return state.allArtifacts.find(
      (artifact) =>
        artifact.id === id ||
        artifact.slug === id
    );
  };

  const searchArtifacts = (searchTerm) => {
    if (!searchTerm.trim()) return state.allArtifacts;

    const term = searchTerm.toLowerCase();

    return state.allArtifacts.filter(
      (artifact) =>
        artifact.name?.toLowerCase().includes(term) ||
        artifact.description?.toLowerCase().includes(term) ||
        artifact.slug?.toLowerCase().includes(term)
    );
  };

  /**
   * Format artifact values for overlay display.
   */
  const formatArtifactValues = (artifact, stars = 0) => {
    if (!artifact?.values) return [];

    const formatted = [];
    const values = artifact.values;

    Object.entries(values).forEach(
      ([statIndex, starValues]) => {
        if (
          starValues &&
          typeof starValues === "object"
        ) {
          const valueForStars =
            starValues[stars] ||
            starValues[stars?.toString()];

          if (valueForStars) {
            formatted.push({
              label: `Stat ${parseInt(statIndex) + 1}`,
              value: valueForStars,
            });
          }
        }
      }
    );

    return formatted;
  };

  useEffect(() => {
    loadArtifacts();
  }, []);

  const value = {
    allArtifacts: state.allArtifacts,
    loading: state.loading,
    error: state.error,
    count: state.allArtifacts.length,

    refreshArtifacts,
    getArtifactBySlug,
    getArtifactById,
    searchArtifacts,
    formatArtifactValues,
    getArtifactPublicUrl,

    createArtifactForSave: (artifact, stars = 0) => {
      if (!artifact) return null;

      return {
        artifactSlug: artifact.slug || artifact.id,
        artifactInfo: {
          name: artifact.name,
          thumbnail: artifact.thumbnail,
          description: artifact.description,
        },
        stars: stars,
      };
    },
  };

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
};
