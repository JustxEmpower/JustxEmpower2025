/**
 * GOOGLE MAPS FRONTEND INTEGRATION
 * 
 * This component loads Google Maps with the API key directly embedded
 * for production use on justxempower.com
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps?: () => void;
  }
}

// Google Maps API Key - hardcoded for production reliability
const GOOGLE_MAPS_API_KEY = "AIzaSyDTJF0gY65vLesOhd8QPBkHuNGNCG4i84k";

let scriptLoadPromise: Promise<void> | null = null;
let scriptLoaded = false;

function loadMapScript(): Promise<void> {
  // Return existing promise if script is already loading
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  // Check if Google Maps is already loaded
  if (window.google?.maps) {
    scriptLoaded = true;
    return Promise.resolve();
  }

  // Check if script tag already exists
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    scriptLoadPromise = new Promise((resolve) => {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogle);
          scriptLoaded = true;
          resolve();
        }
      }, 100);
      // Timeout after 10 seconds
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
      // Wait a bit for Google Maps to fully initialize
      const checkGoogle = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogle);
          scriptLoaded = true;
          resolve();
        }
      }, 50);
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkGoogle);
        if (window.google?.maps) {
          scriptLoaded = true;
          resolve();
        } else {
          reject(new Error("Google Maps failed to initialize after script load"));
        }
      }, 5000);
    };
    
    script.onerror = (e) => {
      console.error("Failed to load Google Maps script:", e);
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
  const map = useRef<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initAttempted = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initAttempted.current) return;
    initAttempted.current = true;

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Loading Google Maps script...");
        await loadMapScript();
        console.log("Google Maps script loaded successfully");
        
        if (!mapContainer.current) {
          console.error("Map container not found");
          setError("Map container not found");
          setIsLoading(false);
          return;
        }
        
        if (!window.google?.maps) {
          console.error("Google Maps not available after script load");
          setError("Google Maps failed to load");
          setIsLoading(false);
          return;
        }
        
        console.log("Creating map instance...");
        map.current = new window.google.maps.Map(mapContainer.current, {
          zoom: initialZoom,
          center: initialCenter,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: true,
          mapId: "DEMO_MAP_ID",
        });
        
        console.log("Map created successfully");
        
        if (onMapReady && map.current) {
          onMapReady(map.current);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Map initialization error:", err);
        setError(err instanceof Error ? err.message : "Failed to load map");
        setIsLoading(false);
      }
    };

    initMap();
  }, [initialCenter.lat, initialCenter.lng, initialZoom]);

  // Show error state
  if (error) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-stone-100 rounded-lg", className)}>
        <div className="text-center text-stone-500">
          <p className="text-sm">Map unavailable</p>
          <p className="text-xs mt-1">Austin, Texas</p>
          <p className="text-xs mt-2 text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-stone-100 rounded-lg", className)}>
        <div className="text-center text-stone-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400 mx-auto mb-2"></div>
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}
