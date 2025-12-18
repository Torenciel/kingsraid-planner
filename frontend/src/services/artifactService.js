class ArtifactService {
  constructor() {
    this.allArtifacts = [];
    this.loading = true;
    this.error = null;
    this.loadPromise = null;
  }

  async loadArtifacts() {
    // If already loading, return the same promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadArtifacts();
    return this.loadPromise;
  }

  async _loadArtifacts() {
    try {
      this.loading = true;
      const response = await fetch(
        "/kingsraid-data/artifact_release_order.json"
      );

      if (!response.ok) throw new Error("Failed to load artifacts");

      const data = await response.json();
      this.allArtifacts =
        data && typeof data === "object" ? Object.keys(data) : [];
      console.log(
        `✅ Artifacts loaded once: ${this.allArtifacts.length} artifacts`
      );
    } catch (err) {
      this.error = err.message;
      console.error("Error loading artifacts:", err);
    } finally {
      this.loading = false;
    }
  }

  getArtifacts() {
    return {
      allArtifacts: this.allArtifacts,
      loading: this.loading,
      error: this.error,
    };
  }
}

// Create a single instance
const artifactService = new ArtifactService();

// Pre-load artifacts when this module is imported
artifactService.loadArtifacts();

export default artifactService;
