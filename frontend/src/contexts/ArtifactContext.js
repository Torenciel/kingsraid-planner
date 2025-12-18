// contexts/ArtifactContext.js
import { createContext, useContext, useEffect, useState } from "react";
import artifactService from "../services/artifactService";
import imageCacheService from "../services/imageCacheService";

const ArtifactContext = createContext();

export const useArtifacts = () => {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error("useArtifacts must be used within ArtifactProvider");
  }
  return context;
};

export const ArtifactProvider = ({ children }) => {
  const [artifactsState, setArtifactsState] = useState({
    allArtifacts: [],
    loading: true,
    error: null,
    imagesPreloaded: false,
  });

  useEffect(() => {
    const initializeArtifacts = async () => {
      try {
        setArtifactsState((prev) => ({ ...prev, loading: true }));

        // Wait for artifacts to load
        await artifactService.loadArtifacts();
        const artifactData = artifactService.getArtifacts();

        // Pre-load and cache images
        await imageCacheService.preloadArtifactImages(
          artifactData.allArtifacts
        );

        setArtifactsState({
          ...artifactData,
          imagesPreloaded: true,
          loading: false,
        });

        console.log("✅ Artifacts and images fully loaded and cached");
      } catch (error) {
        setArtifactsState({
          allArtifacts: [],
          loading: false,
          error: error.message,
          imagesPreloaded: false,
        });
      }
    };

    initializeArtifacts();
  }, []);

  return (
    <ArtifactContext.Provider value={artifactsState}>
      {children}
    </ArtifactContext.Provider>
  );
};
