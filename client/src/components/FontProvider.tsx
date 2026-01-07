import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * FontProvider loads the site-wide font settings from the database
 * and applies them globally via CSS custom properties and Google Fonts
 * Uses maximum CSS specificity to ensure fonts apply EVERYWHERE
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

    // Load Google Fonts with all weights and styles
    const fontNames = [headingFont, bodyFont]
      .filter(Boolean)
      .map(f => f.replace(/ /g, '+') + ':ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900')
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

    // Apply fonts with MAXIMUM specificity to override any existing styles
    const styleId = 'site-font-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    // Use !important and extremely high specificity selectors to ensure fonts apply EVERYWHERE
    style.textContent = `
      /* ============================================
         SITE-WIDE TYPOGRAPHY - MAXIMUM SPECIFICITY
         Applied from database font settings
         ============================================ */
      
      :root {
        --font-heading: "${headingFont}", serif;
        --font-body: "${bodyFont}", sans-serif;
      }

      /* ============================================
         HEADING FONT - All Headings Everywhere
         ============================================ */
      
      /* Base heading selectors */
      h1, h2, h3, h4, h5, h6 {
        font-family: "${headingFont}", serif !important;
      }

      /* High specificity heading selectors */
      html body h1,
      html body h2,
      html body h3,
      html body h4,
      html body h5,
      html body h6,
      html body main h1,
      html body main h2,
      html body main h3,
      html body main h4,
      html body main h5,
      html body main h6,
      html body section h1,
      html body section h2,
      html body section h3,
      html body section h4,
      html body section h5,
      html body section h6,
      html body article h1,
      html body article h2,
      html body article h3,
      html body article h4,
      html body article h5,
      html body article h6,
      html body div h1,
      html body div h2,
      html body div h3,
      html body div h4,
      html body div h5,
      html body div h6 {
        font-family: "${headingFont}", serif !important;
      }

      /* Hero sections */
      html body .hero-section h1,
      html body .hero-section h2,
      html body .hero-section h3,
      html body [class*="hero"] h1,
      html body [class*="hero"] h2,
      html body [class*="hero"] h3,
      html body [class*="Hero"] h1,
      html body [class*="Hero"] h2,
      html body [class*="Hero"] h3 {
        font-family: "${headingFont}", serif !important;
      }

      /* Card titles */
      html body [class*="card"] h1,
      html body [class*="card"] h2,
      html body [class*="card"] h3,
      html body [class*="card"] h4,
      html body [class*="Card"] h1,
      html body [class*="Card"] h2,
      html body [class*="Card"] h3,
      html body [class*="Card"] h4 {
        font-family: "${headingFont}", serif !important;
      }

      /* Page Builder blocks */
      html body [class*="block"] h1,
      html body [class*="block"] h2,
      html body [class*="block"] h3,
      html body [class*="block"] h4,
      html body [class*="Block"] h1,
      html body [class*="Block"] h2,
      html body [class*="Block"] h3,
      html body [class*="Block"] h4 {
        font-family: "${headingFont}", serif !important;
      }

      /* Section titles */
      html body [class*="section"] h1,
      html body [class*="section"] h2,
      html body [class*="section"] h3,
      html body [class*="Section"] h1,
      html body [class*="Section"] h2,
      html body [class*="Section"] h3 {
        font-family: "${headingFont}", serif !important;
      }

      /* Footer headings */
      html body footer h1,
      html body footer h2,
      html body footer h3,
      html body footer h4,
      html body footer h5,
      html body footer h6 {
        font-family: "${headingFont}", serif !important;
      }

      /* Navigation headings */
      html body nav h1,
      html body nav h2,
      html body nav h3,
      html body header h1,
      html body header h2,
      html body header h3 {
        font-family: "${headingFont}", serif !important;
      }

      /* Tailwind font-serif class override */
      html body .font-serif,
      html body .font-heading,
      html body [class*="font-serif"],
      html body [class*="font-heading"] {
        font-family: "${headingFont}", serif !important;
      }

      /* Title classes */
      html body [class*="title"]:not(input):not(button):not(textarea),
      html body [class*="Title"]:not(input):not(button):not(textarea),
      html body [class*="heading"],
      html body [class*="Heading"] {
        font-family: "${headingFont}", serif !important;
      }

      /* ============================================
         BODY FONT - All Body Text Everywhere
         ============================================ */
      
      /* Base body selectors */
      body {
        font-family: "${bodyFont}", sans-serif !important;
      }

      /* High specificity body text selectors */
      html body,
      html body p,
      html body span,
      html body div,
      html body li,
      html body ul,
      html body ol,
      html body td,
      html body th,
      html body label,
      html body blockquote,
      html body figcaption,
      html body cite,
      html body address {
        font-family: "${bodyFont}", sans-serif;
      }

      /* Paragraphs everywhere */
      html body main p,
      html body section p,
      html body article p,
      html body div p,
      html body [class*="card"] p,
      html body [class*="Card"] p,
      html body [class*="block"] p,
      html body [class*="Block"] p,
      html body [class*="section"] p,
      html body [class*="Section"] p,
      html body [class*="hero"] p,
      html body [class*="Hero"] p {
        font-family: "${bodyFont}", sans-serif !important;
      }

      /* Navigation and links */
      html body nav,
      html body nav a,
      html body nav span,
      html body nav li,
      html body header nav,
      html body header nav a,
      html body a:not(h1 a):not(h2 a):not(h3 a):not(h4 a):not(h5 a):not(h6 a) {
        font-family: "${bodyFont}", sans-serif;
      }

      /* Buttons and form elements */
      html body button,
      html body input,
      html body textarea,
      html body select,
      html body option {
        font-family: "${bodyFont}", sans-serif;
      }

      /* Tailwind font-sans class override */
      html body .font-sans,
      html body .font-body,
      html body [class*="font-sans"],
      html body [class*="font-body"] {
        font-family: "${bodyFont}", sans-serif !important;
      }

      /* Description and content classes */
      html body [class*="description"],
      html body [class*="Description"],
      html body [class*="content"]:not([class*="Content"]),
      html body [class*="text"],
      html body [class*="Text"]:not([class*="TextFormat"]) {
        font-family: "${bodyFont}", sans-serif;
      }

      /* ============================================
         SPECIAL UTILITY CLASSES
         ============================================ */
      
      .use-heading-font,
      .heading-font {
        font-family: "${headingFont}", serif !important;
      }

      .use-body-font,
      .body-font {
        font-family: "${bodyFont}", sans-serif !important;
      }

      /* ============================================
         PAGE BUILDER SPECIFIC OVERRIDES
         ============================================ */
      
      /* Page Builder rendered content */
      html body [data-page-builder] h1,
      html body [data-page-builder] h2,
      html body [data-page-builder] h3,
      html body [data-page-builder] h4,
      html body [data-page-builder] h5,
      html body [data-page-builder] h6 {
        font-family: "${headingFont}", serif !important;
      }

      html body [data-page-builder] p,
      html body [data-page-builder] span,
      html body [data-page-builder] li,
      html body [data-page-builder] div {
        font-family: "${bodyFont}", sans-serif;
      }

      /* Dynamic pages */
      html body [data-dynamic-page] h1,
      html body [data-dynamic-page] h2,
      html body [data-dynamic-page] h3,
      html body [data-dynamic-page] h4,
      html body [data-dynamic-page] h5,
      html body [data-dynamic-page] h6 {
        font-family: "${headingFont}", serif !important;
      }

      html body [data-dynamic-page] p,
      html body [data-dynamic-page] span,
      html body [data-dynamic-page] li,
      html body [data-dynamic-page] div {
        font-family: "${bodyFont}", sans-serif;
      }

      /* ============================================
         CAROUSEL AND SLIDER OVERRIDES
         ============================================ */
      
      html body [class*="carousel"] h1,
      html body [class*="carousel"] h2,
      html body [class*="carousel"] h3,
      html body [class*="Carousel"] h1,
      html body [class*="Carousel"] h2,
      html body [class*="Carousel"] h3,
      html body [class*="slider"] h1,
      html body [class*="slider"] h2,
      html body [class*="slider"] h3,
      html body [class*="Slider"] h1,
      html body [class*="Slider"] h2,
      html body [class*="Slider"] h3 {
        font-family: "${headingFont}", serif !important;
      }

      /* ============================================
         MODAL AND DIALOG OVERRIDES
         ============================================ */
      
      html body [role="dialog"] h1,
      html body [role="dialog"] h2,
      html body [role="dialog"] h3,
      html body [class*="modal"] h1,
      html body [class*="modal"] h2,
      html body [class*="modal"] h3,
      html body [class*="Modal"] h1,
      html body [class*="Modal"] h2,
      html body [class*="Modal"] h3 {
        font-family: "${headingFont}", serif !important;
      }

      html body [role="dialog"] p,
      html body [class*="modal"] p,
      html body [class*="Modal"] p {
        font-family: "${bodyFont}", sans-serif !important;
      }
    `;

    console.log('[FontProvider] Applied fonts site-wide:', { headingFont, bodyFont });

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
