import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

type Theme = "light" | "dark";

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  containerMaxWidth: string;
  sectionSpacing: string;
  borderRadius: string;
  enableAnimations: number;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  themeSettings: ThemeSettings | null;
  isLoading: boolean;
}

const defaultThemeSettings: ThemeSettings = {
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  accentColor: "#1a1a1a",
  backgroundColor: "#ffffff",
  textColor: "#000000",
  headingFont: "Playfair Display",
  bodyFont: "Inter",
  containerMaxWidth: "1280px",
  sectionSpacing: "120px",
  borderRadius: "8px",
  enableAnimations: 1,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  // Fetch theme settings from database
  const { data: dbThemeSettings, isLoading } = trpc.theme.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Merge database settings with defaults, handling null values
  const themeSettings: ThemeSettings = {
    primaryColor: dbThemeSettings?.primaryColor || defaultThemeSettings.primaryColor,
    secondaryColor: dbThemeSettings?.secondaryColor || defaultThemeSettings.secondaryColor,
    accentColor: dbThemeSettings?.accentColor || defaultThemeSettings.accentColor,
    backgroundColor: dbThemeSettings?.backgroundColor || defaultThemeSettings.backgroundColor,
    textColor: dbThemeSettings?.textColor || defaultThemeSettings.textColor,
    headingFont: dbThemeSettings?.headingFont || defaultThemeSettings.headingFont,
    bodyFont: dbThemeSettings?.bodyFont || defaultThemeSettings.bodyFont,
    containerMaxWidth: dbThemeSettings?.containerMaxWidth || defaultThemeSettings.containerMaxWidth,
    sectionSpacing: dbThemeSettings?.sectionSpacing || defaultThemeSettings.sectionSpacing,
    borderRadius: dbThemeSettings?.borderRadius || defaultThemeSettings.borderRadius,
    enableAnimations: dbThemeSettings?.enableAnimations ?? defaultThemeSettings.enableAnimations,
  };

  // Apply theme settings as CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply light/dark mode
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }

    // Apply custom theme settings as CSS variables
    if (themeSettings) {
      root.style.setProperty("--theme-primary", themeSettings.primaryColor);
      root.style.setProperty("--theme-secondary", themeSettings.secondaryColor);
      root.style.setProperty("--theme-accent", themeSettings.accentColor);
      root.style.setProperty("--theme-background", themeSettings.backgroundColor);
      root.style.setProperty("--theme-text", themeSettings.textColor);
      root.style.setProperty("--theme-heading-font", themeSettings.headingFont);
      root.style.setProperty("--theme-body-font", themeSettings.bodyFont);
      root.style.setProperty("--theme-container-max-width", themeSettings.containerMaxWidth);
      root.style.setProperty("--theme-section-spacing", themeSettings.sectionSpacing);
      root.style.setProperty("--theme-border-radius", themeSettings.borderRadius);
      
      // Load Google Fonts if specified
      const fontsToLoad = [themeSettings.headingFont, themeSettings.bodyFont].filter(Boolean);
      fontsToLoad.forEach(font => {
        if (font && !document.querySelector(`link[href*="${encodeURIComponent(font)}"]`)) {
          const link = document.createElement("link");
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap`;
          link.rel = "stylesheet";
          document.head.appendChild(link);
        }
      });
    }
  }, [theme, switchable, themeSettings]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, themeSettings, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
