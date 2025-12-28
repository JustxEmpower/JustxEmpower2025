/**
 * GOOGLE MAPS FRONTEND INTEGRATION
 * 
 * This component loads Google Maps with the API key directly embedded
 * for production use on justxempower.com
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

// Google Maps API Key - hardcoded for production reliability
const GOOGLE_MAPS_API_KEY = "AIzaSyDTJF0gY65vLesOhd8QPBkHuNGNCG4i84k";

let scriptLoadPromise: Promise<void> | null = null;

function loadMapScript(): Promise<void> {
  // Return existing promise if script is already loading
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  // Check if Google Maps is already loaded
  if (window.google?.maps) {
    return Promise.resolve();
  }

  // Check if script tag already exists
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    scriptLoadPromise = new Promise((resolve) => {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogle);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkGoogle);
        resolve();
      }, 10000);
    });
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogle);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkGoogle);
        if (window.google?.maps) {
          resolve();
        } else {
          reject(new Error("Google Maps failed to initialize"));
        }
      }, 5000);
    };
    
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContainerReady, setIsContainerReady] = useState(false);

  // Mark container as ready after mount
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      setIsContainerReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Initialize map only after container is ready
  const initMap = useCallback(async () => {
    if (!isContainerReady) return;
    if (!mapContainer.current) {
      console.error("Map container ref is null");
      setError("Map container not found");
      setIsLoading(false);
      return;
    }
    if (mapInstance.current) {
      // Map already initialized
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await loadMapScript();
      
      // Double-check container after async operation
      if (!mapContainer.current) {
        console.error("Map container disappeared after script load");
        setError("Map container not found");
        setIsLoading(false);
        return;
      }
      
      if (!window.google?.maps) {
        console.error("Google Maps not available");
        setError("Google Maps failed to load");
        setIsLoading(false);
        return;
      }
      
      mapInstance.current = new window.google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: "DEMO_MAP_ID",
      });
      
      if (onMapReady && mapInstance.current) {
        onMapReady(mapInstance.current);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Map initialization error:", err);
      setError(err instanceof Error ? err.message : "Failed to load map");
      setIsLoading(false);
    }
  }, [isContainerReady, initialCenter, initialZoom, onMapReady]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  // Always render the container div first
  return (
    <div className={cn("w-full h-[500px] relative", className)}>
      {/* Map container - always rendered */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ display: error ? 'none' : 'block' }}
      />
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 rounded-lg">
          <div className="text-center text-stone-500">
            <p className="text-sm">Map unavailable</p>
            <p className="text-xs mt-1">Austin, Texas</p>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 rounded-lg">
          <div className="text-center text-stone-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400 mx-auto mb-2"></div>
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
