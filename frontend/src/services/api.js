// src/services/api.js

// Base URL configurable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
const API_BASE = '/api'; // Chemin relatif de l'API

class ApiService {
  constructor() {
    // Utilise l'URL complète, pas juste le chemin relatif
    this.baseURL = `${API_BASE_URL}${API_BASE}`;
    console.log('API Service initialized with base URL:', this.baseURL);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('API Request:', { url, method: options.method || 'GET' });
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
          message: response.statusText
        }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', {
        url,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // ============ HÉROS ============

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

  // ============ ÉQUIPES ============

  async saveTeam(teamData) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  async loadTeam(teamId) {
    return this.request(`/teams/${teamId}`);
  }

  async getTeams(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/teams${query ? `?${query}` : ''}`);
  }

  async updateTeam(teamId, teamData) {
    return this.request(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  }

  async deleteTeam(teamId) {
    return this.request(`/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  // ============ UTILITAIRES ============

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
    } catch (error) {
      return false;
    }
  }

  // NOUVEAU : Méthode pour tester la connexion
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

// Helper pour les assets
export const getAssetUrl = (assetPath) => {
  const base = process.env.REACT_APP_ASSETS_URL || API_BASE_URL;
  return `${base}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
};

// Helper pour les images de héros
export const getHeroImageUrl = (heroName) => {
  return getAssetUrl(`/kingsraid-data/assets/heroes/${heroName}/ico.png`);
};

// Helper pour les images d'artéfacts
export const getArtifactImageUrl = (artifactName) => {
  const encodedName = encodeURIComponent(artifactName);
  return getAssetUrl(`/kingsraid-data/assets/artifacts/${encodedName}`);
};

// Singleton pour maintenir la compatibilité
const apiService = new ApiService();

// Exporter à la fois le singleton et les fonctions individuelles
export const teamAPI = {
  saveTeam: (teamData) => apiService.saveTeam(teamData),
  loadTeam: (teamId) => apiService.loadTeam(teamId),
  checkOwnership: (teamId) => apiService.checkOwnership(teamId)
};

export const heroAPI = {
  getHeroes: (params) => apiService.getHeroes(params),
  getHero: (id) => apiService.getHero(id),
  searchHeroes: (searchTerm, filters) => apiService.searchHeroes(searchTerm, filters),
  getHeroesByClass: (heroClass) => apiService.getHeroesByClass(heroClass),
  getHeroesByElement: (element) => apiService.getHeroesByElement(element)
};

// Export pour les assets
export const assetsAPI = {
  getHeroImageUrl,
  getArtifactImageUrl,
  getAssetUrl
};

// Export complet pour les composants qui veulent tout
export const api = apiService;

// Export par défaut pour faciliter l'import
export default apiService;