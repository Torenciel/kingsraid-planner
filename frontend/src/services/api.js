// src/services/api.js

// Configurable base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
const API_BASE = '/api'; // Relative API path

class ApiService {
  constructor() {
    // Use full URL, not just relative path
    this.baseURL = `${API_BASE_URL}${API_BASE}`;
  }

async request(endpoint, options = {}, retry = true) {
  const url = `${this.baseURL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // If unauthorized, try refresh once
  if (response.status === 401 && retry) {
    const refreshResponse = await fetch(
      `${this.baseURL}/v2/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (refreshResponse.ok) {
      // Retry original request once
      return this.request(endpoint, options, false);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}`,
      message: response.statusText
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return await response.json();
}

  // ============ HEROES ============

  async getHeroes(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/heroes${query ? `?${query}` : ''}`);
  }

  async getHero(id) {
    return this.request(`/heroes/${id}`);
  }

  async searchHeroes(searchTerm, filters = {}) {
    const params = { search: searchTerm, ...filters };
    const query = new URLSearchParams(params).toString();
    return this.request(`/heroes?${query}`);
  }

  async getHeroesByClass(heroClass) {
    return this.request(`/heroes?class=${heroClass}`);
  }

  async getHeroesByElement(element) {
    return this.request(`/heroes?element=${element}`);
  }

  // ============ TEAMS ============

  async saveTeam(teamData) {
    return this.request('/v2/teams', {
      method: 'POST',
      body: JSON.stringify({
        teamData,
      })
    });
  }

  async loadTeam(teamId) {
    return this.request(`/v2/teams/${teamId}?format=teamcontext`);
  }

  async getTeams() {
    return this.request('/v2/teams');
  }

  // ============ UTILITIES ============

  async checkHealth() {
    try {
      const data = await this.request('/health');
      return {
        connected: true,
        mongoDB: data.mongoDB === 'connected',
        ...data
      };
    } catch (error) {
      return {
        connected: false,
        mongoDB: false,
        error: error.message
      };
    }
  }

  async migrateHeroes() {
    return this.request('/admin/migrate-heroes', {
      method: 'POST',
    });
  }

  async checkOwnership(teamId) {
    try {
      const response = await this.request(`/teams/${teamId}/ownership`);
      return response.isOwner || false;
    } catch {
      return false;
    }
  }

  // Method to test connection
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return {
        success: response.ok,
        status: response.status,
        server: 'Express API'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        server: 'Express API'
      };
    }
  }
}

// Asset helper
export const getAssetUrl = (assetPath) => {
  const base = process.env.REACT_APP_ASSETS_URL || API_BASE_URL;
  return `${base}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
};

// Hero image helper
export const getHeroImageUrl = (heroName) => {
  return getAssetUrl(`/kingsraid-data/assets/heroes/${heroName}/ico.png`);
};

// Artifact image helper
export const getArtifactImageUrl = (artifactName) => {
  const encodedName = encodeURIComponent(artifactName);
  return getAssetUrl(`/kingsraid-data/assets/artifacts/${encodedName}`);
};

// Singleton instance
const apiService = new ApiService();

// Team API
export const teamAPI = {
  saveTeam: (teamData) => apiService.saveTeam(teamData),
  loadTeam: (teamId) => apiService.loadTeam(teamId),
  checkOwnership: (teamId) => apiService.checkOwnership(teamId)
};

// Hero API
export const heroAPI = {
  getHeroes: (params) => apiService.getHeroes(params),
  getHero: (id) => apiService.getHero(id),
  searchHeroes: (searchTerm, filters) => apiService.searchHeroes(searchTerm, filters),
  getHeroesByClass: (heroClass) => apiService.getHeroesByClass(heroClass),
  getHeroesByElement: (element) => apiService.getHeroesByElement(element)
};

// Asset API
export const assetsAPI = {
  getHeroImageUrl,
  getArtifactImageUrl,
  getAssetUrl
};

// Full export
export const api = apiService;

// Default export
export default apiService;
