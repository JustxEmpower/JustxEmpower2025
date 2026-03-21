import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear", icon: "\u2600\uFE0F" },
  1: { label: "Mostly Clear", icon: "\u{1F324}\uFE0F" },
  2: { label: "Partly Cloudy", icon: "\u26C5" },
  3: { label: "Overcast", icon: "\u2601\uFE0F" },
  45: { label: "Foggy", icon: "\u{1F32B}\uFE0F" },
  48: { label: "Rime Fog", icon: "\u{1F32B}\uFE0F" },
  51: { label: "Light Drizzle", icon: "\u{1F326}\uFE0F" },
  53: { label: "Drizzle", icon: "\u{1F326}\uFE0F" },
  55: { label: "Heavy Drizzle", icon: "\u{1F327}\uFE0F" },
  61: { label: "Light Rain", icon: "\u{1F326}\uFE0F" },
  63: { label: "Rain", icon: "\u{1F327}\uFE0F" },
  65: { label: "Heavy Rain", icon: "\u{1F327}\uFE0F" },
  71: { label: "Light Snow", icon: "\u{1F328}\uFE0F" },
  73: { label: "Snow", icon: "\u{1F328}\uFE0F" },
  75: { label: "Heavy Snow", icon: "\u2744\uFE0F" },
  80: { label: "Rain Showers", icon: "\u{1F327}\uFE0F" },
  81: { label: "Rain Showers", icon: "\u{1F327}\uFE0F" },
  82: { label: "Heavy Showers", icon: "\u26C8\uFE0F" },
  95: { label: "Thunderstorm", icon: "\u26A1" },
  96: { label: "Thunderstorm", icon: "\u26A1" },
  99: { label: "Hail Storm", icon: "\u26A1" },
};

function getWeatherInfo(code: number) {
  return WMO_CODES[code] || { label: "Unknown", icon: "\u2601\uFE0F" };
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CodexWeather() {
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [zipInput, setZipInput] = useState("");
  const [geoError, setGeoError] = useState("");
  const userSetLocationRef = useRef(false);

  const utils = trpc.useUtils();
  const settingsQuery = trpc.codex.client.getSettings.useQuery();
  const updateSettings = trpc.codex.client.updateSettings.useMutation({
    onSuccess: () => {
      utils.codex.client.getSettings.invalidate();
    },
  });
  const geocodeQuery = trpc.codex.client.geocode.useQuery(
    { zip: zipInput },
    { enabled: false }
  );

  // Get location from settings, geolocation, or default
  useEffect(() => {
    // Don't overwrite if user just manually set a location
    if (userSetLocationRef.current) return;

    const s = settingsQuery.data;
    if (s?.weatherLat && s?.weatherLon) {
      setCoords({ lat: s.weatherLat, lon: s.weatherLon });
      if (s.weatherZip && !locationName) {
        setLocationName(s.weatherZip);
      }
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = String(pos.coords.latitude.toFixed(4));
          const lon = String(pos.coords.longitude.toFixed(4));
          setCoords({ lat, lon });
          updateSettings.mutate({ weatherLat: lat, weatherLon: lon });
        },
        () => {
          // Default to NYC if denied
          setCoords({ lat: "40.7128", lon: "-74.0060" });
          setLocationName("New York");
        }
      );
    } else {
      setCoords({ lat: "40.7128", lon: "-74.0060" });
      setLocationName("New York");
    }
  }, [settingsQuery.data]);

  const weatherQuery = trpc.codex.client.weather.useQuery(
    { lat: coords?.lat || "", lon: coords?.lon || "" },
    { enabled: !!coords }
  );

  const handleZipSubmit = async () => {
    if (!zipInput.trim()) return;
    setGeoError("");
    try {
      const result = await geocodeQuery.refetch();
      if (result.data) {
        userSetLocationRef.current = true;
        setCoords({ lat: result.data.lat, lon: result.data.lon });
        setLocationName(result.data.name);
        updateSettings.mutate({
          weatherZip: result.data.name || zipInput,
          weatherLat: result.data.lat,
          weatherLon: result.data.lon,
        }, {
          onSuccess: () => {
            // Allow useEffect to run again now that DB has correct data
            userSetLocationRef.current = false;
          },
        });
        setShowSettings(false);
        setZipInput("");
      }
    } catch {
      setGeoError("Location not found");
    }
  };

  const data = weatherQuery.data;
  const current = data?.current_weather;
  const daily = data?.daily;

  if (!coords || weatherQuery.isLoading) {
    return (
      <div className="cx-card" style={{ minHeight: "12rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="cx-slow-pulse" style={{ fontSize: "1.5rem" }}>{"\u2600\uFE0F"}</div>
      </div>
    );
  }

  const currentInfo = current ? getWeatherInfo(current.weathercode) : null;

  return (
    <div className="cx-card" style={{ position: "relative", overflow: "hidden" }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-2rem", right: "-2rem", width: "8rem", height: "8rem",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--cx-gold-dim)" }}>
          {locationName || (data?.timezone ? data.timezone.split("/").pop()?.replace(/_/g, " ") : "Weather")}
        </p>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(245,230,211,0.25)", fontSize: "0.9rem", padding: "0.25rem",
            transition: "color 300ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--cx-gold)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,230,211,0.25)")}
        >
          {"\u2699\uFE0F"}
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{
          marginBottom: "1rem", padding: "0.75rem", borderRadius: "0.5rem",
          background: "rgba(44,31,40,0.6)", border: "1px solid rgba(61,34,51,0.3)",
        }}>
          <p style={{ fontSize: "0.7rem", color: "rgba(245,230,211,0.4)", marginBottom: "0.5rem" }}>
            Enter city or zip code
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={zipInput}
              onChange={e => setZipInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleZipSubmit()}
              placeholder="e.g. Miami or 33101"
              style={{
                flex: 1, padding: "0.5rem 0.75rem", borderRadius: "0.375rem",
                background: "rgba(44,31,40,0.4)", border: "1px solid rgba(61,34,51,0.3)",
                color: "var(--cx-cream)", fontSize: "0.8rem", outline: "none",
                fontFamily: "Inter, sans-serif",
              }}
            />
            <button
              onClick={handleZipSubmit}
              className="cx-btn-primary"
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
            >
              Set
            </button>
          </div>
          {geoError && <p style={{ color: "var(--cx-ember)", fontSize: "0.7rem", marginTop: "0.25rem" }}>{geoError}</p>}
        </div>
      )}

      {/* Current conditions */}
      {current && currentInfo && (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "2.5rem", lineHeight: 1, animation: "cx-float 6s ease-in-out infinite" }}>
            {currentInfo.icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span className="cx-font-heading" style={{ fontSize: "2.5rem", fontWeight: 300, color: "var(--cx-gold)" }}>
                {Math.round(current.temperature)}°
              </span>
              <span style={{ fontSize: "0.75rem", color: "rgba(245,230,211,0.3)" }}>F</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "rgba(245,230,211,0.5)", marginTop: "0.15rem" }}>
              {currentInfo.label}
            </p>
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      {daily && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem" }}>
          {daily.time.map((date: string, i: number) => {
            const d = new Date(date + "T12:00:00");
            const dayName = i === 0 ? "Now" : DAYS[d.getDay()];
            const info = getWeatherInfo(daily.weathercode[i]);
            return (
              <div key={date} style={{
                textAlign: "center", padding: "0.5rem 0.15rem", borderRadius: "0.5rem",
                background: i === 0 ? "rgba(201,168,76,0.06)" : "transparent",
                border: i === 0 ? "1px solid rgba(201,168,76,0.12)" : "1px solid transparent",
                transition: "all 300ms",
              }}>
                <p style={{ fontSize: "0.6rem", color: i === 0 ? "var(--cx-gold)" : "rgba(245,230,211,0.3)", fontWeight: i === 0 ? 600 : 400, marginBottom: "0.35rem" }}>
                  {dayName}
                </p>
                <div style={{ fontSize: "1.1rem", lineHeight: 1, marginBottom: "0.35rem" }}>{info.icon}</div>
                <p style={{ fontSize: "0.7rem", color: "var(--cx-cream)", opacity: 0.7 }}>
                  {Math.round(daily.temperature_2m_max[i])}°
                </p>
                <p style={{ fontSize: "0.6rem", color: "rgba(245,230,211,0.25)" }}>
                  {Math.round(daily.temperature_2m_min[i])}°
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
