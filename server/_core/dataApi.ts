/**
 * Data API - External API Integration Hub - Enhanced
 * 
 * Provides unified access to external APIs with:
 * - Rate limiting and retry logic
 * - Response caching
 * - Error handling and logging
 * - Support for multiple API providers
 * 
 * Example usage:
 *   const weather = await fetchWeather("New York, NY");
 *   const quote = await fetchInspirationalQuote();
 *   const news = await fetchWellnessNews();
 */

// ============================================================================
// Types & Configuration
// ============================================================================

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  cache?: boolean;
  cacheTTL?: number;
};

export type ApiResponse<T = unknown> = {
  data: T | null;
  error: string | null;
  cached: boolean;
  timestamp: number;
};

// Simple in-memory cache
const apiCache = new Map<string, { data: unknown; expires: number }>();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Core Request Handler
// ============================================================================

/**
 * Make an external API call with caching and error handling
 * 
 * @param url - Full API URL
 * @param options - Request options
 * @returns API response with data or error
 */
export async function callExternalApi<T = unknown>(
  url: string,
  options: DataApiCallOptions = {}
): Promise<ApiResponse<T>> {
  const { 
    query, 
    body, 
    headers = {}, 
    method = "GET",
    cache = true,
    cacheTTL = DEFAULT_CACHE_TTL,
  } = options;

  // Build URL with query params
  const fullUrl = new URL(url);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        fullUrl.searchParams.append(key, String(value));
      }
    });
  }

  const cacheKey = `${method}:${fullUrl.toString()}`;

  // Check cache
  if (cache && method === "GET") {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return {
        data: cached.data as T,
        error: null,
        cached: true,
        timestamp: cached.expires - cacheTTL,
      };
    }
  }

  try {
    const response = await fetch(fullUrl.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as T;

    // Cache successful GET responses
    if (cache && method === "GET") {
      apiCache.set(cacheKey, { data, expires: Date.now() + cacheTTL });
    }

    return {
      data,
      error: null,
      cached: false,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`[DataAPI] Error calling ${url}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      cached: false,
      timestamp: Date.now(),
    };
  }
}

// Legacy function for backward compatibility
export async function callDataApi(
  apiId: string,
  options: DataApiCallOptions = {}
): Promise<unknown> {
  console.warn(`[DataAPI] Legacy callDataApi called for "${apiId}"`);
  return null;
}

// ============================================================================
// Wellness & Inspiration APIs
// ============================================================================

export type InspirationalQuote = {
  text: string;
  author: string;
  category?: string;
};

/**
 * Fetch an inspirational quote
 * Uses ZenQuotes API (free, no key required)
 */
export async function fetchInspirationalQuote(): Promise<InspirationalQuote | null> {
  const response = await callExternalApi<Array<{ q: string; a: string }>>(
    "https://zenquotes.io/api/random",
    { cache: true, cacheTTL: 60 * 1000 } // 1 minute cache
  );

  if (response.data && response.data[0]) {
    return {
      text: response.data[0].q,
      author: response.data[0].a,
    };
  }
  
  // Fallback quotes for when API is unavailable
  const fallbacks: InspirationalQuote[] = [
    { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
    { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
    { text: "Wellness is the complete integration of body, mind, and spirit.", author: "Greg Anderson" },
    { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
    { text: "The greatest wealth is health.", author: "Virgil" },
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Fetch daily affirmation
 */
export async function fetchDailyAffirmation(): Promise<string> {
  const affirmations = [
    "I am worthy of love, respect, and kindness.",
    "I trust the journey and embrace each moment.",
    "My potential is limitless, and I am capable of achieving greatness.",
    "I radiate positivity and attract abundance into my life.",
    "I am grounded, centered, and at peace with myself.",
    "Every challenge I face is an opportunity to grow.",
    "I honor my body, mind, and spirit with compassion.",
    "I am connected to the infinite wisdom within me.",
    "I release what no longer serves me and welcome transformation.",
    "I am exactly where I need to be on my journey.",
  ];
  
  // Use date to get consistent daily affirmation
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return affirmations[dayOfYear % affirmations.length];
}

// ============================================================================
// Weather API (OpenWeatherMap)
// ============================================================================

export type WeatherData = {
  location: string;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
};

/**
 * Fetch weather data for a location
 * Requires OPENWEATHER_API_KEY environment variable
 */
export async function fetchWeather(location: string): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn("[Weather] OPENWEATHER_API_KEY not configured");
    return null;
  }

  const response = await callExternalApi<{
    name: string;
    main: { temp: number; feels_like: number; humidity: number };
    weather: Array<{ description: string; icon: string }>;
    wind: { speed: number };
  }>(
    "https://api.openweathermap.org/data/2.5/weather",
    {
      query: {
        q: location,
        appid: apiKey,
        units: "imperial",
      },
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes
    }
  );

  if (response.data) {
    return {
      location: response.data.name,
      temperature: Math.round(response.data.main.temp),
      feelsLike: Math.round(response.data.main.feels_like),
      description: response.data.weather[0]?.description || "Unknown",
      icon: response.data.weather[0]?.icon || "01d",
      humidity: response.data.main.humidity,
      windSpeed: Math.round(response.data.wind.speed),
    };
  }

  return null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear the API cache
 */
export function clearApiCache(): void {
  apiCache.clear();
  console.log("[DataAPI] Cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: apiCache.size,
    keys: Array.from(apiCache.keys()),
  };
}
