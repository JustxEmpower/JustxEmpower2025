import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { getMediaUrl } from '@/lib/media';
import { trpc } from '@/lib/trpc';
// Navigation is now fetched from pages table via trpc.pages.getNavPages

interface NavItem {
  href: string;
  label: string;
  isButton?: boolean;
  isExternal?: boolean;
  openInNewTab?: boolean;
  children?: NavItem[];
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const [location] = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch navigation from pages table (pages with showInNav=1)
  const { data: navPages, isLoading: navLoading } = trpc.pages.getNavPages.useQuery();
  
  // Fetch site settings for logo and brand
  const { data: siteSettings } = trpc.siteSettings.get.useQuery();
  
  // Fetch brand assets for logo
  const { data: brandAssets } = trpc.siteSettings.getBrandAssets.useQuery();

  // Build navigation structure from pages table
  const allNavLinks: NavItem[] = useMemo(() => {
    if (!navPages || navPages.length === 0) {
      return [];
    }

    // Separate parent items (no parentId) from child items
    const parentItems = navPages.filter(item => !item.parentId);
    const childItems = navPages.filter(item => item.parentId);

    // Build navigation items with children
    const navItems: NavItem[] = parentItems.map(parent => {
      const children = childItems
        .filter(child => child.parentId === parent.id)
        .map(child => ({
          href: `/${child.slug}`,
          label: child.title,
        }));

      // Check if this is a CTA button (title contains [button] indicator)
      const isButton = parent.title.toLowerCase().includes('[button]');
      const label = parent.title.replace('[button]', '').replace('[Button]', '').trim();

      return {
        href: `/${parent.slug}`,
        label: label,
        isButton: isButton,
        children: children.length > 0 ? children : undefined,
      };
    });

    return navItems;
  }, [navPages]);

  // Separate regular nav items from button items
  const regularNavItems = useMemo(() => allNavLinks.filter(item => !item.isButton), [allNavLinks]);
  const buttonNavItems = useMemo(() => allNavLinks.filter(item => item.isButton), [allNavLinks]);

  // Calculate font size based on number of items
  const navFontSize = useMemo(() => {
    const itemCount = allNavLinks.length;
    if (itemCount <= 6) return 'text-sm';
    if (itemCount <= 8) return 'text-xs';
    return 'text-[10px]';
  }, [allNavLinks.length]);

  // Calculate gap based on number of items
  const navGap = useMemo(() => {
    const itemCount = allNavLinks.length;
    if (itemCount <= 6) return 'gap-8';
    if (itemCount <= 8) return 'gap-6';
    return 'gap-4';
  }, [allNavLinks.length]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      
      const ctx = gsap.context(() => {
        gsap.to(menuRef.current, {
          x: '0%',
          duration: 0.8,
          ease: 'power3.inOut'
        });

        const links = menuItemsRef.current?.querySelectorAll('a, button');
        if (links) {
          gsap.fromTo(links, 
            { y: 50, opacity: 0 },
            { 
              y: 0, 
              opacity: 1, 
              duration: 0.8, 
              stagger: 0.1, 
              ease: 'power3.out',
              delay: 0.3 
            }
          );
        }
      });
      return () => ctx.revert();
    } else {
      document.body.style.overflow = '';
      
      const ctx = gsap.context(() => {
        gsap.to(menuRef.current, {
          x: '100%',
          duration: 0.8,
          ease: 'power3.inOut'
        });
      });
      return () => ctx.revert();
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
    setOpenMobileDropdown(null);
  }, [location]);

  const handleDropdownEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const toggleMobileDropdown = (label: string) => {
    setOpenMobileDropdown(openMobileDropdown === label ? null : label);
  };

  // Get logo URL from brand assets, site settings, or use default
  const logoUrl = brandAssets?.logo_header || siteSettings?.logoUrl || getMediaUrl('/media/logo-white.png');
  const siteName = siteSettings?.siteName || 'Site Logo';

  // Render link helper - handles external vs internal links
  const renderLink = (item: NavItem, className: string, children: React.ReactNode) => {
    if (item.isExternal) {
      return (
        <a 
          href={item.href} 
          className={className}
          target={item.openInNewTab ? '_blank' : undefined}
          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={item.href}>
        <a className={className}>{children}</a>
      </Link>
    );
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-6 md:px-12 py-6",
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent"
      )}
    >
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        <Link href="/">
          <a className="block w-16 h-16 relative transition-transform duration-300 hover:scale-105 z-50">
            <img 
              src={logoUrl} 
              alt={siteName} 
              className={cn(
                "w-full h-full object-contain transition-all duration-300",
                (isScrolled || isMobileMenuOpen) ? "invert brightness-0" : ""
              )}
            />
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav className={cn("hidden md:flex items-center", navGap)}>
          {/* Regular Navigation Items */}
          {regularNavItems.map((link) => (
            <div 
              key={link.href + link.label}
              className="relative"
              onMouseEnter={() => link.children && handleDropdownEnter(link.label)}
              onMouseLeave={handleDropdownLeave}
            >
              {link.children ? (
                // Parent with dropdown
                <button
                  className={cn(
                    "uppercase tracking-[0.15em] hover:opacity-70 transition-all duration-300 flex items-center gap-1",
                    navFontSize,
                    isScrolled ? "text-foreground" : "text-white"
                  )}
                >
                  {link.label}
                  <ChevronDown className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    openDropdown === link.label && "rotate-180"
                  )} />
                </button>
              ) : (
                // Regular link
                renderLink(
                  link,
                  cn(
                    "uppercase tracking-[0.15em] hover:opacity-70 transition-all duration-300",
                    navFontSize,
                    isScrolled ? "text-foreground" : "text-white"
                  ),
                  link.label
                )
              )}

              {/* Dropdown Menu */}
              {link.children && openDropdown === link.label && (
                <div 
                  className="absolute top-full left-0 mt-2 py-2 bg-white rounded-lg shadow-lg min-w-[220px] z-50"
                  onMouseEnter={() => handleDropdownEnter(link.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  {/* Child links */}
                  {link.children.map((child: NavItem) => (
                    <div key={child.href + child.label}>
                      {renderLink(
                        child,
                        "block px-4 py-2 text-sm text-foreground hover:bg-neutral-100 transition-colors",
                        child.label
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Button Navigation Items (CTA buttons) */}
          {buttonNavItems.map((link) => (
            <div key={link.href + link.label}>
              {renderLink(
                link,
                cn(
                  "px-6 py-2 rounded-full uppercase tracking-[0.15em] transition-all duration-300 border",
                  navFontSize,
                  isScrolled 
                    ? "border-foreground text-foreground hover:bg-foreground hover:text-white" 
                    : "border-white text-white hover:bg-white hover:text-foreground"
                ),
                link.label
              )}
            </div>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden z-50 relative w-10 h-10 flex items-center justify-center"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className={cn(
            "w-6 h-0.5 bg-current transition-all duration-300 absolute",
            isMobileMenuOpen ? "rotate-45" : "-translate-y-1.5",
            (isScrolled || isMobileMenuOpen) ? "text-foreground bg-foreground" : "text-white bg-white"
          )} />
          <div className={cn(
            "w-6 h-0.5 bg-current transition-all duration-300 absolute",
            isMobileMenuOpen ? "-rotate-45" : "translate-y-1.5",
            (isScrolled || isMobileMenuOpen) ? "text-foreground bg-foreground" : "text-white bg-white"
          )} />
        </button>

        {/* Mobile Navigation Overlay */}
        <div 
          ref={menuRef}
          className="fixed inset-0 bg-[#f5f5f0] z-40 flex flex-col items-center justify-center translate-x-full md:hidden overflow-y-auto"
        >
          {/* Decorative Background Element */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
             <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] rounded-full bg-black blur-[100px]" />
          </div>

          <nav ref={menuItemsRef} className="flex flex-col items-center gap-6 relative z-10 py-20">
            {/* Regular Navigation Items */}
            {regularNavItems.map((link) => (
              <div key={link.href + link.label} className="flex flex-col items-center">
                {link.children ? (
                  // Parent with dropdown (mobile)
                  <>
                    <button
                      onClick={() => toggleMobileDropdown(link.label)}
                      className="text-3xl font-serif italic text-foreground hover:text-primary transition-colors font-light flex items-center gap-2"
                    >
                      {link.label}
                      <ChevronDown className={cn(
                        "w-5 h-5 transition-transform duration-200",
                        openMobileDropdown === link.label && "rotate-180"
                      )} />
                    </button>
                    {/* Mobile dropdown children */}
                    {openMobileDropdown === link.label && (
                      <div className="flex flex-col items-center gap-3 mt-3 pl-4">
                        {link.children?.map((child: NavItem) => (
                          <div key={child.href + child.label}>
                            {renderLink(
                              child,
                              "text-xl text-foreground/80 hover:text-primary transition-colors",
                              child.label
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Regular link (mobile)
                  renderLink(
                    link,
                    "text-3xl font-serif italic text-foreground hover:text-primary transition-colors font-light",
                    link.label
                  )
                )}
              </div>
            ))}
            
            {/* Button Navigation Items (CTA buttons) - Mobile */}
            {buttonNavItems.map((link) => (
              <div key={link.href + link.label}>
                {renderLink(
                  link,
                  "mt-4 px-8 py-3 rounded-full border-2 border-foreground text-foreground hover:bg-foreground hover:text-white transition-all duration-300 text-xl",
                  link.label
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
