const STORAGE_KEY = "cookie_consent";

export const getCookieConsent = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const saveCookieConsent = (preferences) => {
  const consent = {
    essential: true, // always required
    analytics: !!preferences.analytics,
    timestamp: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
};

export const clearCookieConsent = () => {
  localStorage.removeItem(STORAGE_KEY);
};