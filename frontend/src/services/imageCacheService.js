// services/imageCacheService.js
class ImageCacheService {
  constructor() {
    this.imageCache = new Map();
    this.preloaded = false;
  }

  async preloadArtifactImages(artifacts) {
    if (this.preloaded) return;

    console.log("🖼️ Pre-loading and caching artifact images...");

    const preloadPromises = artifacts.map((artifactName) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.imageCache.set(artifactName, img);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load image for: ${artifactName}`);
          resolve();
        };
        img.src = `/kingsraid-data/assets/artifacts/${artifactName}.png`;
      });
    });

    await Promise.all(preloadPromises);
    this.preloaded = true;
    console.log(`✅ Pre-loaded ${artifacts.length} artifact images`);
  }

  getCachedImage(artifactName) {
    return this.imageCache.get(artifactName);
  }
}

const imageCacheService = new ImageCacheService();
export default imageCacheService;
