'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Shared hook for user geolocation coordination
 * Handles localStorage caching and browser geolocation
 */
export const useUserCoordinates = () => {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    // Read from localStorage on mount (client-only)
    if (typeof window !== 'undefined') {
      const lat = localStorage.getItem('user_lat');
      const lon = localStorage.getItem('user_lon');
      if (lat && lon && lat !== 'undefined' && lon !== 'undefined') {
        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);
        Promise.resolve().then(() => {
          setCoords({ lat: parsedLat, lon: parsedLon });
          setIsLoaded(true);
        });
        return;
      }
    }
    
    // Defer state update to next microtask to avoid synchronous setState inside useEffect body
    Promise.resolve().then(() => {
      setIsLoaded(true);
    });
  }, []);

  const requestBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setHasPermission(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem('user_lat', String(latitude));
        localStorage.setItem('user_lon', String(longitude));
        setCoords({ lat: latitude, lon: longitude });
        setHasPermission(true);
      },
      (error) => {
        setHasPermission(false);
        console.warn('Geolocation error:', error);
      }
    );
  }, []);

  return {
    lat: coords.lat,
    lon: coords.lon,
    isLoaded,
    hasPermission,
    requestBrowserLocation,
  };
};
