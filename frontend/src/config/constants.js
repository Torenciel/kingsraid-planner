// Shared config
export const CONFIG = {
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3002',
    ASSETS_URL: process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002',
    ENDPOINTS: {
      HEROES: '/api/heroes',
      TEAMS: '/api/teams',
      MASANG_ORDER: '/kingsraid-data/hero_release_order_masang.json',
      RELEASE_ORDER: '/kingsraid-data/hero_release_order.json'
    }
  },
  
  ASSETS: {
    HERO_IMAGE: (heroName) => `/kingsraid-data/assets/heroes/${heroName}/ico.png`,
    ARTIFACT_IMAGE: (artifactName) => `/kingsraid-data/assets/artifacts/${encodeURIComponent(artifactName)}`
  }
};

// Helper to buld url
export const buildUrl = (endpoint) => `${CONFIG.API.BASE_URL}${endpoint}`;
export const buildAssetUrl = (assetPath) => `${CONFIG.API.ASSETS_URL}${assetPath}`;