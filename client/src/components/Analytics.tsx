import { useEffect } from 'react';

/**
 * Analytics component that loads Umami tracking script
 * Only loads if VITE_ANALYTICS_ENDPOINT and VITE_ANALYTICS_WEBSITE_ID are configured
 */
export function Analytics() {
  useEffect(() => {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

    // Only load analytics if both values are configured and not placeholders
    if (endpoint && websiteId && !endpoint.includes('VITE_') && !websiteId.includes('VITE_')) {
      // Check if script already exists
      if (document.querySelector(`script[data-website-id="${websiteId}"]`)) {
        return;
      }

      const script = document.createElement('script');
      script.defer = true;
      script.async = true;
      script.src = `${endpoint}/script.js`;
      script.setAttribute('data-website-id', websiteId);
      document.head.appendChild(script);

      return () => {
        // Cleanup on unmount (though this rarely happens for analytics)
        const existingScript = document.querySelector(`script[data-website-id="${websiteId}"]`);
        if (existingScript) {
          existingScript.remove();
        }
      };
    }
  }, []);

  return null;
}

export default Analytics;
