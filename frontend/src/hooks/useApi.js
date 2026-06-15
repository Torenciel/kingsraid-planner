// frontend/src/hooks/useApi.js
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Configuration
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';
const API_V2_BASE = `${API_BASE}/api/v2`;

const DEFAULT_OPTIONS = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  timeout: 10000,
  useCache: true,
  refresh: false,
};

// Simple in-memory cache
const cache = new Map();

/**
 * Utility function to extract data from the standard response format
 */
const extractData = (result, endpoint) => {
  // Backend returns { success, data/heroes/artifacts, count, error }
  if (!result) return null;

  if (!result.success) {
    throw new Error(result.error || `API request failed for ${endpoint}`);
  }

  // Different endpoints return data under different keys
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
  
  // If the backend returns data directly (for compatibility)
  return result;
};

/**
 * Custom hook for making API v2 requests
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);
  const cacheKey = useRef(`${endpoint}:${JSON.stringify(options)}`);

  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log(`fetchData called for ${endpoint}, forceRefresh=${forceRefresh}`);

    // Cancel the previous request if one exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Check cache
    if (options.useCache !== false && cache.has(cacheKey.current) && !forceRefresh) {
      const cached = cache.get(cacheKey.current);
      console.log(`Using cache for ${endpoint}`);
      setData(cached.data);
      setRawResponse(cached.raw);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let timeoutId = null;
    try {
      const mergedOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        signal: abortControllerRef.current.signal,
      };

      // Add body if present
      if (options.body) {
        mergedOptions.body = JSON.stringify(options.body);
      }

      // Timeout
if (mergedOptions.timeout) {
  timeoutId = setTimeout(() => {
    if (abortControllerRef.current) {
      console.warn(`Request timeout for ${endpoint}, aborting`);
      abortControllerRef.current.abort();
      setError(new Error('Request timeout'));
      setLoading(false);
    }
  }, mergedOptions.timeout);
}


      console.log(`API Request: ${API_V2_BASE}${endpoint}`);
      const response = await fetch(`${API_V2_BASE}${endpoint}`, mergedOptions);

      if (timeoutId) clearTimeout(timeoutId);

      console.log(`Received response for ${endpoint}: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      console.log(`API Response for ${endpoint}:`, result);

      // Extract data from the standard format
      const extractedData = extractData(result, endpoint);

      // Cache if GET
      if (mergedOptions.method === 'GET' && options.useCache !== false) {
        cache.set(cacheKey.current, {
          data: extractedData,
          raw: result
        });
      }

      setData(extractedData);
      setRawResponse(result);
      setError(null);
      setLoading(false);

    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err.name !== 'AbortError') {
        console.error(`API Error (${endpoint}):`, err);
        setError(err.message);
        setLoading(false);
      }
      // AbortError: don't touch loading state — a new request is already starting
    }
  }, [endpoint, options]);

  useEffect(() => {
    console.log(`useApi effect running for ${endpoint}, refresh=${options.refresh}`);
    if (endpoint) {
      fetchData(options.refresh);
    } else {
      setLoading(false);
    }

    return () => {
      console.log(`useApi cleanup: aborting request for ${endpoint}`);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [endpoint, options.refresh]);

  // Manual reload
  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,           // Extracted data
    raw: rawResponse, // Raw backend response
    loading,
    error,
    refetch,

    // Response metadata
    success: rawResponse?.success || false,
    count: rawResponse?.count || 0,
    message: rawResponse?.message
  };
}

/**
 * Specialized hook for heroes
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

  // Disable timeout for heroes endpoint
  const options = useMemo(() => ({ timeout: 0 }), []);
  return useApi(endpoint, options);
}

/**
 * Specialized hook for a specific hero
 */
export function useHero(slug) {
  return useApi(slug ? `/heroes/${slug}` : null, {
    useCache: true,
  });
}

/**
 * Specialized hook for hero classes
 */
export function useHeroClasses() {
  return useApi('/heroes/classes');
}

/**
 * Specialized hook for hero positions
 */
export function useHeroPositions() {
  return useApi('/heroes/positions');
}

/**
 * Specialized hook for hero search
 */
export function useHeroSearch(term) {
  return useApi(term ? `/heroes/search/${term}` : null, {
    useCache: false, // Don't cache search results
  });
}

/**
 * Specialized hook for perks
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
 * Specialized hook for all perks
 */
export function useAllPerks() {
  return useApi('/perks');
}

/**
 * Specialized hook for a hero's perks (T3/T5)
 */
export function useHeroPerks(heroSlug) {
  return useApi(heroSlug ? `/perks/hero/${heroSlug}` : null);
}

/**
 * Specialized hook for class perks (T1/T2)
 */
export function useClassPerks(className) {
  return useApi(className ? `/perks/class/${className}` : null);
}

/**
 * Specialized hook for perk search
 */
export function usePerkSearch(term) {
  return useApi(term ? `/perks/search/${term}` : null, {
    useCache: false,
  });
}

/**
 * Specialized hook for artifacts
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
 * Specialized hook for a specific artifact
 */
export function useArtifact(slug) {
  return useApi(slug ? `/artifacts/${slug}` : null, {
    useCache: true,
  });
}

/**
 * Specialized hook for artifact search
 */
export function useArtifactSearch(term) {
  return useApi(term ? `/artifacts/search/${term}` : null, {
    useCache: false,
  });
}

/**
 * Specialized hook for gear sets
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
 * Specialized hook for a specific gear set
 */
export function useGearSet(slug) {
  return useApi(slug ? `/gearsets/${slug}` : null, {
    useCache: true,
  });
}

/**
 * Specialized hook for gear set search
 */
export function useGearSetSearch(term) {
  return useApi(term ? `/gearsets/search/${term}` : null, {
    useCache: false,
  });
}

/**
 * Hook for teams
 */
export function useTeams(filters = {}) {
  const isNull = filters === null;
  const { isPublic, createdBy, author, gameMode, ...otherFilters } = isNull ? {} : filters;

  let endpoint = '/teams';
  const params = new URLSearchParams();

  if (!isNull) {
    if (isPublic !== undefined) params.append('isPublic', isPublic);
    if (createdBy && createdBy.trim()) params.append('createdBy', createdBy);
    if (author) params.append('author', author);
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
  }

  const options = useMemo(() => ({ useCache: false, timeout: 0 }), []);

  console.log('useTeams endpoint:', isNull ? 'null (skipped)' : endpoint);
  return useApi(isNull ? null : endpoint, options);
}

/**
 * Hook for a specific team
 */
export function useTeam(id) {
  return useApi(id ? `/teams/${id}` : null);
}

/**
 * Hook for creating a team
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
 * Hook for updating a team
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
 * Hook for deleting a team
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
        credentials: 'include',
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
 * Hook for checking API health
 */
export function useApiHealth() {
  return useApi('/health', {
    useCache: false,
    timeout: 5000, // Shorter timeout for health checks
  });
}

/**
 * Toggle bookmark on a team (authenticated)
 */
export function useToggleBookmark() {
  const toggleBookmark = useCallback(async (teamId) => {
    const response = await fetch(`${API_V2_BASE}/teams/${teamId}/bookmark`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to toggle bookmark');
    return data;
  }, []);
  return { toggleBookmark };
}

/**
 * Toggle upvote on a team (authenticated)
 */
export function useToggleUpvote() {
  const toggleUpvote = useCallback(async (teamId) => {
    const response = await fetch(`${API_V2_BASE}/teams/${teamId}/upvote`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to toggle upvote');
    return data;
  }, []);
  return { toggleUpvote };
}

/**
 * Clear the cache
 */
export function clearApiCache() {
  cache.clear();
  console.log('API cache cleared');
}