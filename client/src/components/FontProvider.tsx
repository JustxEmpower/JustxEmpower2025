import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * FontProvider loads the site-wide font settings from the database
 * and applies them globally via CSS custom properties and Google Fonts
 */
export default function FontProvider({ children }: { children: React.ReactNode }) {
  // Fetch font settings from database with refetch capability
  const { data: fontSettings, refetch } = trpc.fontSettings.get.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to get latest fonts
  });

  useEffect(() => {
    if (!fontSettings) return;

    const { headingFont, bodyFont } = fontSettings;

    // Load Google Fonts
    const fontNames = [headingFont, bodyFont]
      .filter(Boolean)
      .map(f => f.replace(/ /g, '+') + ':ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700')
      .join('&family=');

    const linkId = 'site-google-fonts';
    let link = document.getElementById(linkId) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    link.href = `https://fonts.googleapis.com/css2?family=${fontNames}&display=swap`;

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--font-heading', `"${headingFont}", serif`);
    root.style.setProperty('--font-body', `"${bodyFont}", sans-serif`);

    // Apply fonts with high specificity to override any existing styles
    const styleId = 'site-font-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    // Use !important and high specificity selectors to ensure fonts apply everywhere
    style.textContent = `
      /* Site-wide typography from database - High Specificity */
      :root {
        --font-heading: "${headingFont}", serif;
        --font-body: "${bodyFont}", sans-serif;
      }

      /* Apply heading font to ALL headings with maximum specificity */
      html body h1,
      html body h2,
      html body h3,
      html body h4,
      html body h5,
      html body h6,
      html body .font-serif,
      html body .font-heading,
      html body [class*="heading"],
      html body [class*="title"]:not(input):not(button) {
        font-family: "${headingFont}", serif !important;
      }

      /* Apply body font to body text with high specificity */
      html body,
      html body p,
      html body span:not([class*="icon"]),
      html body li,
      html body td,
      html body th,
      html body label,
      html body .font-sans,
      html body .font-body {
        font-family: "${bodyFont}", sans-serif;
      }

      /* Navigation, buttons, and form elements use body font */
      html body nav,
      html body nav a,
      html body nav span,
      html body button,
      html body a,
      html body input,
      html body textarea,
      html body select {
        font-family: "${bodyFont}", sans-serif;
      }

      /* Hero sections and large text - use heading font */
      html body section h1,
      html body section h2,
      html body section h3,
      html body .hero h1,
      html body .hero h2,
      html body [class*="hero"] h1,
      html body [class*="hero"] h2,
      html body [class*="Hero"] h1,
      html body [class*="Hero"] h2 {
        font-family: "${headingFont}", serif !important;
      }

      /* Italic headings (common in elegant designs) */
      html body h1.italic,
      html body h2.italic,
      html body h3.italic,
      html body .italic h1,
      html body .italic h2,
      html body .italic h3 {
        font-family: "${headingFont}", serif !important;
        font-style: italic;
      }

      /* Special classes for explicit font application */
      .use-heading-font {
        font-family: "${headingFont}", serif !important;
      }

      .use-body-font {
        font-family: "${bodyFont}", sans-serif !important;
      }

      /* Card titles and section headers */
      html body [class*="card"] h1,
      html body [class*="card"] h2,
      html body [class*="card"] h3,
      html body [class*="Card"] h1,
      html body [class*="Card"] h2,
      html body [class*="Card"] h3 {
        font-family: "${headingFont}", serif !important;
      }

      /* Footer headings */
      html body footer h1,
      html body footer h2,
      html body footer h3,
      html body footer h4 {
        font-family: "${headingFont}", serif !important;
      }
    `;

    console.log('[FontProvider] Applied fonts:', { headingFont, bodyFont });

    return () => {
      // Cleanup is optional since we want fonts to persist
    };
  }, [fontSettings]);

  // Listen for font changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'font-settings-updated') {
        refetch();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refetch]);

  return <>{children}</>;
}
