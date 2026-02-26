// frontend/src/hooks/useApi.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Configuration
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';
const API_V2_BASE = `${API_BASE}/api/v2`;

const DEFAULT_OPTIONS = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  useCache: true,
  refresh: false,
};

// Cache simple en mémoire
const cache = new Map();

/**
 * Fonction utilitaire pour extraire les données du format de réponse standard
 */
const extractData = (result, endpoint) => {
  // Le backend retourne { success, data/heroes/artifacts, count, error }
  if (!result) return null;
  
  if (!result.success) {
    throw new Error(result.error || `API request failed for ${endpoint}`);
  }
  
  // Différents endpoints retournent des données sous différentes clés
  if (result.data !== undefined) return result.data;
  if (result.heroes !== undefined) return result.heroes;
  if (result.artifacts !== undefined) return result.artifacts;
  if (result.gearsets !== undefined) return result.gearsets;
  if (result.perks !== undefined) return result.perks;
  if (result.teams !== undefined) return result.teams;
  if (result.hero !== undefined) return result.hero;
  if (result.artifact !== undefined) return result.artifact;
  if (result.gearset !== undefined) return result.gearset;
  if (result.perk !== undefined) return result.perk;
  if (result.team !== undefined) return result.team;
  if (result.classes !== undefined) return result.classes;
  if (result.positions !== undefined) return result.positions;
  
  // Si le backend retourne directement les données (pour compatibilité)
  return result;
};

/**
 * Hook personnalisé pour effectuer des requêtes API v2
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);
  const cacheKey = useRef(`${endpoint}:${JSON.stringify(options)}`);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    // Vérifier le cache
    if (options.useCache !== false && cache.has(cacheKey.current) && !forceRefresh) {
      const cached = cache.get(cacheKey.current);
      setData(cached.data);
      setRawResponse(cached.raw);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mergedOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        signal: abortControllerRef.current.signal,
      };

      // Ajouter le body si présent
      if (options.body) {
        mergedOptions.body = JSON.stringify(options.body);
      }

      // Timeout
let timeoutId;

if (mergedOptions.timeout) {
  timeoutId = setTimeout(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setError(new Error('Request timeout'));
      setLoading(false);
    }
  }, mergedOptions.timeout);
}


      console.log(`API Request: ${API_V2_BASE}${endpoint}`);
      const response = await fetch(`${API_V2_BASE}${endpoint}`, mergedOptions);
      
      if (timeoutId) clearTimeout(timeoutId);


      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`📦 API Response for ${endpoint}:`, result);
      
      // Extraire les données du format standard
      const extractedData = extractData(result, endpoint);
      
      // Mettre en cache si GET
      if (mergedOptions.method === 'GET' && options.useCache !== false) {
        cache.set(cacheKey.current, {
          data: extractedData,
          raw: result
        });
      }
      
      setData(extractedData);
      setRawResponse(result);
      setError(null);
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error(`❌ API Error (${endpoint}):`, err);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  useEffect(() => {
    if (endpoint) {
      fetchData(options.refresh);
    } else {
      setLoading(false);
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, endpoint, options.refresh]);

  // Recharger manuellement
  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { 
    data,           // Données extraites
    raw: rawResponse, // Réponse brute du backend
    loading, 
    error, 
    refetch,
    
    // Métadonnées de la réponse
    success: rawResponse?.success || false,
    count: rawResponse?.count || 0,
    message: rawResponse?.message
  };
}

/**
 * Hook spécialisé pour les héros
 */
export function useHeroes(filters = {}) {
  const { class: className, name, position, search, ...otherFilters } = filters;
  
  let endpoint = '/heroes';
  const params = new URLSearchParams();
  
  if (className) params.append('class', className);
  if (name) params.append('name', name);
  if (position) params.append('position', position);
  if (search) params.append('search', search);
  
  // Pagination
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  
  Object.entries(otherFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  if (queryString) {
    endpoint = `${endpoint}?${queryString}`;
  }
  
  return useApi(endpoint);
}

/**
 * Hook spécialisé pour un héros spécifique
 */
export function useHero(slug) {
  return useApi(slug ? `/heroes/${slug}` : null, {
    useCache: true,
  });
}

/**
 * Hook spécialisé pour les classes de héros
 */
export function useHeroClasses() {
  return useApi('/heroes/classes');
}

/**
 * Hook spécialisé pour les positions de héros
 */
export function useHeroPositions() {
  return useApi('/heroes/positions');
}

/**
 * Hook spécialisé pour la recherche de héros
 */
export function useHeroSearch(term) {
  return useApi(term ? `/heroes/search/${term}` : null, {
    useCache: false, // Ne pas cacher les résultats de recherche
  });
}

/**
 * Hook spécialisé pour les perks
 */
export function usePerks(tier, filters = {}) {
  const { class: className, heroSlug, ...otherFilters } = filters;
  
  let endpoint = `/perks/tier/${tier}`;
  const params = new URLSearchParams();
  
  if (className) params.append('class', className);
  if (heroSlug) params.append('heroSlug', heroSlug);
  
  Object.entries(otherFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  if (queryString) {
    endpoint = `${endpoint}?${queryString}`;
  }
  
  return useApi(endpoint);
}

/**
 * Hook spécialisé pour toutes les perks
 */
export function useAllPerks() {
  return useApi('/perks');
}

/**
 * Hook spécialisé pour les perks d'un héros (T3/T5)
 */
export function useHeroPerks(heroSlug) {
  return useApi(heroSlug ? `/perks/hero/${heroSlug}` : null);
}

/**
 * Hook spécialisé pour les perks de classe (T1/T2)
 */
export function useClassPerks(className) {
  return useApi(className ? `/perks/class/${className}` : null);
}

/**
 * Hook spécialisé pour la recherche de perks
 */
export function usePerkSearch(term) {
  return useApi(term ? `/perks/search/${term}` : null, {
    useCache: false,
  });
}

/**
 * Hook spécialisé pour les artifacts
 */
export function useArtifacts(filters = {}) {
  const { search, ...otherFilters } = filters;
  
  let endpoint = '/artifacts';
  const params = new URLSearchParams();
  
  if (search) params.append('search', search);
  
  Object.entries(otherFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  if (queryString) {
    endpoint = `${endpoint}?${queryString}`;
  }
  
  return useApi(endpoint);
}

/**
 * Hook spécialisé pour un artifact spécifique
 */
export function useArtifact(slug) {
  return useApi(slug ? `/artifacts/${slug}` : null, {
    useCache: true,
  });
}

/**
 * Hook spécialisé pour la recherche d'artifacts
 */
export function useArtifactSearch(term) {
  return useApi(term ? `/artifacts/search/${term}` : null, {
    useCache: false,
  });
}

/**
 * Hook spécialisé pour les gear sets
 */
export function useGearSets(filters = {}) {
  const { search, ...otherFilters } = filters;
  
  let endpoint = '/gearsets';
  const params = new URLSearchParams();
  
  if (search) params.append('search', search);
  
  Object.entries(otherFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  if (queryString) {
    endpoint = `${endpoint}?${queryString}`;
  }
  
  return useApi(endpoint);
}

/**
 * Hook spécialisé pour un gear set spécifique
 */
export function useGearSet(slug) {
  return useApi(slug ? `/gearsets/${slug}` : null, {
    useCache: true,
  });
}

/**
 * Hook spécialisé pour la recherche de gear sets
 */
export function useGearSetSearch(term) {
  return useApi(term ? `/gearsets/search/${term}` : null, {
    useCache: false,
  });
}

/**
 * Hook pour les équipes
 */
export function useTeams(filters = {}) {
  const { isPublic, createdBy, gameMode, ...otherFilters } = filters;
  
  let endpoint = '/teams';
  const params = new URLSearchParams();
  
  if (isPublic !== undefined) params.append('isPublic', isPublic);
  if (createdBy) params.append('createdBy', createdBy);
  if (gameMode) params.append('gameMode', gameMode);
  
  Object.entries(otherFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  if (queryString) {
    endpoint = `${endpoint}?${queryString}`;
  }
  
  return useApi(endpoint);
}

/**
 * Hook pour une équipe spécifique
 */
export function useTeam(id) {
  return useApi(id ? `/teams/${id}` : null);
}

/**
 * Hook pour créer une équipe
 */
export function useCreateTeam() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const createTeam = useCallback(async (teamData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_V2_BASE}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create team');
      }
      
      setResult(data);
      return data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createTeam, loading, error, result };
}

/**
 * Hook pour mettre à jour une équipe
 */
export function useUpdateTeam(id) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const updateTeam = useCallback(async (teamData) => {
    if (!id) {
      throw new Error('Team ID is required');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_V2_BASE}/teams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update team');
      }
      
      setResult(data);
      return data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { updateTeam, loading, error, result };
}

/**
 * Hook pour supprimer une équipe
 */
export function useDeleteTeam(id) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const deleteTeam = useCallback(async () => {
    if (!id) {
      throw new Error('Team ID is required');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_V2_BASE}/teams/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete team');
      }
      
      setResult(data);
      return data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { deleteTeam, loading, error, result };
}

/**
 * Hook pour vérifier la santé de l'API
 */
export function useApiHealth() {
  return useApi('/health', {
    useCache: false,
    timeout: 5000, // Timeout plus court pour la santé
  });
}

/**
 * Nettoyer le cache
 */
export function clearApiCache() {
  cache.clear();
  console.log('🧹 API cache cleared');
}