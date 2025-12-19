// frontend/src/hooks/useApi.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Configuration
const API_BASE = process.env.REACT_APP_API_URL || '/api/v2';
const DEFAULT_OPTIONS = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  // Temps max d'attente pour une requête (en ms)
  timeout: 10000,
  // Si true, utilise le cache
  useCache: true,
  // Si true, refait la requête même si en cache
  refresh: false,
};

// Cache simple en mémoire
const cache = new Map();

/**
 * Hook personnalisé pour effectuer des requêtes API
 * 
 * @param {string} endpoint - Endpoint API (ex: '/heroes', '/perks/tier/t1')
 * @param {Object} options - Options de la requête
 * @param {string} options.method - Méthode HTTP (GET, POST, PUT, DELETE)
 * @param {Object} options.body - Corps de la requête pour POST/PUT
 * @param {Object} options.headers - Headers supplémentaires
 * @param {number} options.timeout - Timeout en ms
 * @param {boolean} options.useCache - Utiliser le cache
 * @param {boolean} options.refresh - Forcer le rafraîchissement (ignorer le cache)
 * 
 * @returns {Object} - { data, loading, error, refetch }
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);
  const cacheKey = useRef(`${endpoint}:${JSON.stringify(options)}`);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouvel AbortController pour cette requête
    abortControllerRef.current = new AbortController();
    
    // Vérifier le cache (sauf si forcé)
    if (options.useCache !== false && cache.has(cacheKey.current) && !forceRefresh) {
      const cachedData = cache.get(cacheKey.current);
      setData(cachedData);
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

      // Ajouter le body si présent (pour POST/PUT)
      if (options.body) {
        mergedOptions.body = JSON.stringify(options.body);
      }

      // Timeout avec AbortController
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setError(new Error('Request timeout'));
          setLoading(false);
        }
      }, mergedOptions.timeout);

      const response = await fetch(`${API_BASE}${endpoint}`, mergedOptions);
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Mettre en cache si GET
      if (mergedOptions.method === 'GET' && options.useCache !== false) {
        cache.set(cacheKey.current, result);
      }
      
      setData(result);
      setError(null);
      
    } catch (err) {
      // Ignorer les erreurs d'abort (annulation volontaire)
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error(`API Error (${endpoint}):`, err);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  useEffect(() => {
    fetchData(options.refresh);
    
    // Nettoyage : annuler la requête si le composant est démonté
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, options.refresh]);

  // Fonction pour recharger manuellement
  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Hook spécialisé pour les héros
 */
export function useHeroes(filters = {}) {
  const { class: className, search, ...otherFilters } = filters;
  
  let endpoint = '/heroes';
  const params = new URLSearchParams();
  
  if (className) params.append('class', className);
  if (search) params.append('search', search);
  
  // Ajouter d'autres filtres
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
 * Hook spécialisé pour les perks d'un héros (T3/T5)
 */
export function useHeroPerks(heroSlug) {
  return useApi(heroSlug ? `/perks/hero/${heroSlug}` : null);
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
  return useApi(slug ? `/artifacts/${slug}` : null);
}

/**
 * Hook pour les équipes
 */
export function useTeams() {
  return useApi('/teams');
}

/**
 * Hook pour une équipe spécifique
 */
export function useTeam(id) {
  return useApi(id ? `/teams/${id}` : null);
}