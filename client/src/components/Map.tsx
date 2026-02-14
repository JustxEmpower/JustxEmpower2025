/**
 * GOOGLE MAPS FRONTEND INTEGRATION
 * 
 * Uses a free Google Maps embed iframe - no API key required.
 */

import { cn } from "@/lib/utils";

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: any) => void;
  query?: string;
}

export function MapView({
  className,
  initialCenter = { lat: 30.2672, lng: -97.7431 },
  initialZoom = 12,
  query = "Austin, Texas",
}: MapViewProps) {
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=${initialZoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={cn("w-full h-[500px] relative", className)}>
      <iframe
        src={embedUrl}
        className="w-full h-full border-0 rounded-lg"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Maps - Austin, Texas"
      />
    </div>
  );
}
