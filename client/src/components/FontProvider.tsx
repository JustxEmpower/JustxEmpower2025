import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * FontProvider loads the site-wide font settings from the database
 * and applies them globally via CSS custom properties and Google Fonts
 */
export default function FontProvider({ children }: { children: React.ReactNode }) {
  // Fetch font settings from database
  const { data: fontSettings } = trpc.fontSettings.get.useQuery();

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

    // Also update the font-family on specific elements
    const styleId = 'site-font-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = `
      /* Site-wide typography from database */
      :root {
        --font-heading: "${headingFont}", serif;
        --font-body: "${bodyFont}", sans-serif;
      }

      /* Apply heading font to all headings */
      h1, h2, h3, h4, h5, h6,
      .font-serif,
      .font-heading {
        font-family: var(--font-heading) !important;
      }

      /* Apply body font to body text */
      body,
      p,
      span,
      div,
      .font-sans,
      .font-body {
        font-family: var(--font-body);
      }

      /* Navigation and buttons use body font */
      nav,
      button,
      a,
      input,
      textarea,
      select {
        font-family: var(--font-body);
      }

      /* Special classes for explicit font application */
      .use-heading-font {
        font-family: var(--font-heading) !important;
      }

      .use-body-font {
        font-family: var(--font-body) !important;
      }
    `;

    return () => {
      // Cleanup is optional since we want fonts to persist
    };
  }, [fontSettings]);

  return <>{children}</>;
}
