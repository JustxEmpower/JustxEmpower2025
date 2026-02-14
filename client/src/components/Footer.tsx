import { Link } from 'wouter';
import NewsletterSignup from '@/components/NewsletterSignup';
import { getMediaUrl } from '@/lib/media';
import { trpc } from '@/lib/trpc';
import { useGlobalContent } from '@/hooks/useGlobalContent';

interface NavItem {
  id: number;
  label: string;
  url: string;
  order: number;
  isExternal: number;
  openInNewTab: number;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Fetch brand assets from database
  const { data: brandAssets } = trpc.siteSettings.getBrandAssets.useQuery();
  
  // Fetch footer navigation from database
  const { data: footerNav } = trpc.navigation.getByLocation.useQuery({ location: 'footer' });
  
  // Fetch published pages that should show in nav (includes page builder pages)
  const { data: navPages } = trpc.pages.getNavPages.useQuery();
  
  // Fetch global content (footer section)
  const { footer, isLoading: contentLoading } = useGlobalContent();
  
  // Get footer logo URL from brand assets or use fallback
  const logoUrl = brandAssets?.logo_footer || brandAssets?.logo_header || getMediaUrl('/media/logo-white.png');
  
  // Split footer navigation into columns
  const exploreLinks = footerNav?.filter((item: NavItem) => 
    ['/founder', '/philosophy', '/offerings', '/journal', '/blog', '/she-writes'].some(path => item.url.includes(path))
  ) || [];
  
  const connectLinks = footerNav?.filter((item: NavItem) => 
    ['/contact', '/emerge-with-us', '/events', '/shop', '/community'].some(path => item.url.includes(path))
  ) || [];
  
  const legalLinks = footerNav?.filter((item: NavItem) => 
    ['/privacy-policy', '/terms-of-service', '/cookie-policy', '/accessibility'].some(path => item.url.includes(path))
  ) || [];

  // Fallback links if database is empty
  const defaultExploreLinks = [
    { label: 'Philosophy', url: '/philosophy' },
    { label: 'Offerings', url: '/offerings' },
    { label: 'She Writes', url: '/blog' }
  ];
  
  const defaultConnectLinks = [
    { label: 'Shop', url: '/shop' },
    { label: 'Events', url: '/community-events' },
    { label: 'Contact', url: '/contact' }
  ];
  
  const defaultLegalLinks = [
    { label: 'Accessibility', url: '/accessibility' },
    { label: 'Privacy Policy', url: '/privacy-policy' },
    { label: 'Terms of Service', url: '/terms-of-service' },
    { label: 'Cookie Policy', url: '/cookie-policy' }
  ];

  // Labels to exclude from footer columns
  const excludedLabels = ['about', 'blog'];

  // Transform links to fix labels and URLs
  const transformLinks = (links: any[]) => links
    .filter(item => !excludedLabels.includes(item.label?.toLowerCase()))
    .map(item => {
      // Journal / Blog (She Writes) -> She Writes with /blog URL
      if (item.label === 'Journal' || item.label === 'Blog (She Writes)' || item.url?.includes('/journal')) {
        return { ...item, label: 'She Writes', url: '/blog' };
      }
      // Events -> /community-events
      if (item.label === 'Events' && !item.url?.includes('/community-events')) {
        return { ...item, url: '/community-events' };
      }
      return item;
    });

  // URLs that belong in Connect column
  const connectPatterns = [
    '/community-events', '/community', '/events',
    '/1-1', '/guidance', '/coaching',
    '/resources', '/resource',
    '/emerge', '/emerge-with-us',
    '/shop', '/contact'
  ];
  
  // URLs that belong in Explore column  
  const explorePatterns = [
    '/founder', '/philosophy', '/offerings',
    '/blog', '/journal', '/she-writes',
    '/rooted-unity', '/vision', '/ethos',
    '/mom-vix', '/trilogy', '/overview'
  ];
  
  // Convert published pages to link format
  const pageLinks = (navPages || []).map((page: any) => ({
    label: page.title,
    url: `/${page.slug}`,
  }));
  
  // Categorize pages into Explore vs Connect
  const isConnectLink = (url: string) => connectPatterns.some(p => url.toLowerCase().includes(p));
  const isExploreLink = (url: string) => explorePatterns.some(p => url.toLowerCase().includes(p));
  
  // Build Explore links - start with defaults, add matching pages
  const mergedExploreLinks = [...(exploreLinks.length > 0 ? exploreLinks : defaultExploreLinks)];
  
  // Build Connect links - start with defaults, add matching pages  
  const mergedConnectLinks = [...(connectLinks.length > 0 ? connectLinks : defaultConnectLinks)];
  
  // Add page links to appropriate column
  pageLinks.forEach((pageLink: any) => {
    const urlLower = pageLink.url.toLowerCase();
    
    // Skip if already exists in either column
    const existsInExplore = mergedExploreLinks.some((link: any) => 
      link.url.toLowerCase() === urlLower || link.label.toLowerCase() === pageLink.label.toLowerCase()
    );
    const existsInConnect = mergedConnectLinks.some((link: any) => 
      link.url.toLowerCase() === urlLower || link.label.toLowerCase() === pageLink.label.toLowerCase()
    );
    
    if (existsInExplore || existsInConnect) return;
    
    // Add to Connect if matches connect patterns
    if (isConnectLink(urlLower)) {
      mergedConnectLinks.push(pageLink);
    } 
    // Add to Explore if matches explore patterns or is unmatched
    else {
      mergedExploreLinks.push(pageLink);
    }
  });
  
  // Remove duplicates by URL (case-insensitive)
  const dedupeLinks = (links: any[]) => {
    const seen = new Set<string>();
    return links.filter((link: any) => {
      const key = link.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const displayExploreLinks = transformLinks(dedupeLinks(mergedExploreLinks));
  const displayConnectLinks = transformLinks(dedupeLinks(mergedConnectLinks));
  const displayLegalLinks = legalLinks.length > 0 ? legalLinks : defaultLegalLinks;

  // Get content from database with fallbacks
  const tagline = footer.tagline || 'Catalyzing the rise of her through embodied transformation and conscious leadership.';
  const copyright = footer.copyright || `© ${currentYear} Just Empower™. All Rights Reserved.`;
  const instagramUrl = footer.instagramUrl || 'https://www.instagram.com/justxempower/';
  const linkedinUrl = footer.linkedinUrl || '#';
  const facebookUrl = footer.facebookUrl || 'https://www.facebook.com/justxempower';
  const youtubeUrl = footer.youtubeUrl || '#';
  const newsletterTitle = footer.newsletterTitle || 'Stay Connected';
  const newsletterDescription = footer.newsletterDescription || 'Join our monthly mailing list for insights and updates.';
  const column1Title = footer.column1Title || 'Explore';
  const column2Title = footer.column2Title || 'Connect';

  return (
    <footer className="bg-foreground text-background pt-24 pb-12 transition-colors duration-300">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          
          {/* Brand Column */}
          <div className="md:col-span-4">
            <Link href="/" className="block w-32 mb-8 hover:opacity-80 transition-opacity duration-300">
              <img 
                src={logoUrl} 
                alt="Just Empower" 
                className="w-full h-auto object-contain"
              />
            </Link>
            <p className="font-sans text-background/60 text-sm leading-relaxed max-w-xs mb-8">
              {tagline}
            </p>
            <div className="flex gap-4">
              {instagramUrl && instagramUrl !== '#' && (
                <a 
                  href={instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-background/20 rounded-full flex items-center justify-center hover:bg-background hover:text-foreground transition-colors duration-300"
                >
                  IG
                </a>
              )}
              {linkedinUrl && linkedinUrl !== '#' && (
                <a 
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="w-10 h-10 border border-background/20 rounded-full flex items-center justify-center hover:bg-background hover:text-foreground transition-colors duration-300"
                >
                  LI
                </a>
              )}
              {facebookUrl && facebookUrl !== '#' && (
                <a 
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="w-10 h-10 border border-background/20 rounded-full flex items-center justify-center hover:bg-background hover:text-foreground transition-colors duration-300"
                >
                  FB
                </a>
              )}
              {youtubeUrl && youtubeUrl !== '#' && (
                <a 
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="w-10 h-10 border border-background/20 rounded-full flex items-center justify-center hover:bg-background hover:text-foreground transition-colors duration-300"
                >
                  YT
                </a>
              )}
              {/* Show default social icons if none are set */}
              {(!instagramUrl || instagramUrl === '#') && (!linkedinUrl || linkedinUrl === '#') && (
                <>
                  <a href="#" className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors duration-300">IG</a>
                  <a href="#" className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors duration-300">LI</a>
                </>
              )}
            </div>
          </div>

          {/* Links Column 1 - Explore */}
          <div className="md:col-span-2 md:col-start-6">
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-background/40 mb-8">{column1Title}</h3>
            <ul className="space-y-4">
              {displayExploreLinks.map((item: any) => (
                <li key={item.url}>
                  <Link 
                    href={item.url}
                    className="font-serif text-lg text-background/80 hover:text-background hover:italic transition-all duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 - Connect */}
          <div className="md:col-span-2">
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-background/40 mb-8">{column2Title}</h3>
            <ul className="space-y-4">
              {displayConnectLinks.map((item: any) => (
                <li key={item.url}>
                  <Link 
                    href={item.url}
                    className="font-serif text-lg text-background/80 hover:text-background hover:italic transition-all duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-4">
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-background/40 mb-8">{newsletterTitle}</h3>
            <p className="font-sans text-background/60 text-sm mb-6 max-w-xs">
              {newsletterDescription}
            </p>
            <NewsletterSignup variant="footer" />
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.1em] text-background/40">
            {copyright}
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {displayLegalLinks.map((item: any) => (
              <Link 
                key={item.url} 
                href={item.url}
                className="font-sans text-[10px] uppercase tracking-[0.1em] text-background/40 hover:text-background transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
