import { Link } from 'wouter';
import NewsletterSignup from '@/components/NewsletterSignup';
import { getMediaUrl } from '@/lib/media';
import { trpc } from '@/lib/trpc';
import { useNavigation } from '@/hooks/useNavigation';
import { useGlobalContent } from '@/hooks/useGlobalContent';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  // Fetch brand assets from database
  const { data: brandAssets } = trpc.siteSettings.getBrandAssets.useQuery();
  
  // Fetch footer navigation from database
  const { footerItems, isLoading: navLoading } = useNavigation();
  
  // Fetch global content for footer
  const { footer: footerContent, isLoading: contentLoading } = useGlobalContent();
  
  // Get footer logo URL from brand assets or use fallback
  const logoUrl = brandAssets?.logo_footer || brandAssets?.logo_header || getMediaUrl('/media/logo-white.png');
  
  // Get footer content from database with fallbacks
  const tagline = footerContent?.tagline || 'Catalyzing the rise of her through embodied transformation and conscious leadership.';
  const instagramUrl = footerContent?.instagramUrl || '#';
  const linkedinUrl = footerContent?.linkedinUrl || '#';
  const newsletterHeading = footerContent?.newsletterHeading || 'Stay Connected';
  const newsletterText = footerContent?.newsletterText || 'Join our monthly mailing list for insights and updates.';
  const copyrightText = footerContent?.copyrightText || `© ${currentYear} Just Empower™. All Rights Reserved.`;
  
  // Group footer navigation items by their parentId (for column grouping)
  // Items without parentId are column headers, items with parentId are children
  const footerColumns = footerItems.reduce((acc, item) => {
    if (!item.parentId) {
      // This is a column header
      acc.push({
        id: item.id,
        label: item.label,
        items: []
      });
    }
    return acc;
  }, [] as { id: number; label: string; items: typeof footerItems }[]);
  
  // Add child items to their parent columns
  footerItems.forEach(item => {
    if (item.parentId) {
      const column = footerColumns.find(col => col.id === item.parentId);
      if (column) {
        column.items.push(item);
      }
    }
  });
  
  // If no footer navigation is set up, use default structure
  const hasFooterNav = footerColumns.length > 0 && footerColumns.some(col => col.items.length > 0);

  // Render link helper - handles external vs internal links
  const renderLink = (item: { url: string; label: string; isExternal?: number; openInNewTab?: number }, className: string) => {
    if (item.isExternal) {
      return (
        <a 
          href={item.url} 
          className={className}
          target={item.openInNewTab ? '_blank' : undefined}
          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {item.label}
        </a>
      );
    }
    return (
      <Link href={item.url}>
        <a className={className}>{item.label}</a>
      </Link>
    );
  };

  return (
    <footer className="bg-[#1a1a1a] text-white pt-24 pb-12">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          
          {/* Brand Column */}
          <div className="md:col-span-4">
            <Link href="/">
              <a className="block w-32 mb-8 hover:opacity-80 transition-opacity duration-300">
              <img 
                src={logoUrl} 
                alt="Just Empower" 
                className="w-full h-auto object-contain"
              />
            </a>
            </Link>
            <p className="font-sans text-white/60 text-sm leading-relaxed max-w-xs mb-8">
              {tagline}
            </p>
            <div className="flex gap-4">
              <a 
                href={instagramUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors duration-300"
              >
                IG
              </a>
              <a 
                href={linkedinUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors duration-300"
              >
                LI
              </a>
            </div>
          </div>

          {/* Dynamic Footer Navigation Columns */}
          {hasFooterNav ? (
            // Render database-driven footer navigation
            footerColumns.map((column, index) => (
              column.items.length > 0 && (
                <div key={column.id} className={`md:col-span-2 ${index === 0 ? 'md:col-start-7' : ''}`}>
                  <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-white/40 mb-8">{column.label}</h3>
                  <ul className="space-y-4">
                    {column.items.map((item) => (
                      <li key={item.id}>
                        {renderLink(
                          item,
                          "font-serif text-lg text-white/80 hover:text-white hover:italic transition-all duration-300"
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))
          ) : (
            // Fallback to hardcoded navigation if database is empty
            <>
              {/* Links Column 1 */}
              <div className="md:col-span-2 md:col-start-7">
                <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-white/40 mb-8">Explore</h3>
                <ul className="space-y-4">
                  {[
                    { label: 'About', href: '/about' },
                    { label: 'Philosophy', href: '/philosophy' },
                    { label: 'Offerings', href: '/offerings' },
                    { label: 'Journal', href: '/journal' }
                  ].map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a className="font-serif text-lg text-white/80 hover:text-white hover:italic transition-all duration-300">
                          {item.label}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Links Column 2 */}
              <div className="md:col-span-2">
                <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-white/40 mb-8">Connect</h3>
                <ul className="space-y-4">
                  {[
                    { label: 'Contact', href: '/contact' },
                    { label: 'Walk With Us', href: '/walk-with-us' }
                  ].map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a className="font-serif text-lg text-white/80 hover:text-white hover:italic transition-all duration-300">
                          {item.label}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Newsletter Column */}
          <div className="md:col-span-2">
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-white/40 mb-8">{newsletterHeading}</h3>
            <p className="font-sans text-white/60 text-sm mb-4">
              {newsletterText}
            </p>
            <NewsletterSignup variant="footer" />
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.1em] text-white/40">
            {copyrightText}
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link href="/accessibility">
              <a className="font-sans text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors">Accessibility</a>
            </Link>
            <Link href="/privacy-policy">
              <a className="font-sans text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors">Privacy Policy</a>
            </Link>
            <Link href="/terms-of-service">
              <a className="font-sans text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors">Terms of Service</a>
            </Link>
            <Link href="/cookie-policy">
              <a className="font-sans text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors">Cookie Policy</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
