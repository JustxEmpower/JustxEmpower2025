import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { getMediaUrl } from '@/lib/media';
import { trpc } from '@/lib/trpc';
import ThemeToggle from '@/components/ThemeToggle';

interface NavPage {
  id: number;
  title: string;
  slug: string;
  published: number;
  showInNav: number;
  navOrder: number | null;
  parentId: number | null;
}

interface NavItem {
  href: string;
  label: string;
  isButton?: boolean;
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

  // Fetch navigation pages from database - this is the ONLY source of truth
  const { data: navPages, isLoading } = trpc.pages.getNavPages.useQuery();
  
  // Fetch site settings for logo and brand
  const { data: siteSettings } = trpc.siteSettings.get.useQuery();
  
  // Fetch brand assets for logo
  const { data: brandAssets } = trpc.siteSettings.getBrandAssets.useQuery();

  // Build navigation structure entirely from database pages
  const allNavLinks: NavItem[] = useMemo(() => {
    if (!navPages || navPages.length === 0) {
      return [];
    }

    // Separate parent pages (no parentId) from child pages
    const parentPages = navPages.filter(p => !p.parentId);
    const childPages = navPages.filter(p => p.parentId);

    // Build navigation items with children
    const navItems: NavItem[] = parentPages.map(parent => {
      const children = childPages
        .filter(child => child.parentId === parent.id)
        .map(child => ({
          href: `/${child.slug}`,
          label: child.title,
        }));

      // Check if this is a CTA button (slug contains 'walk-with' or title contains button indicator)
      const isButton = parent.slug.includes('walk-with') || parent.title.toLowerCase().includes('[button]');
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
          duration: 0.4,
          ease: 'power2.out'
        });

        const links = menuItemsRef.current?.querySelectorAll('a, button');
        if (links) {
          gsap.fromTo(links, 
            { y: 30, opacity: 0 },
            { 
              y: 0, 
              opacity: 1, 
              duration: 0.4, 
              stagger: 0.05, 
              ease: 'power2.out',
              delay: 0.15 
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
          duration: 0.35,
          ease: 'power2.in'
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

  // Pages without dark hero backgrounds - need dark text from the start
  const pagesWithLightBackground = ['/shop', '/admin', '/cart', '/checkout', '/privacy-policy', '/terms-of-service', '/terms', '/cookie-policy', '/accessibility-statement', '/accessibility'];
  const hasLightBackground = pagesWithLightBackground.some(path => location.startsWith(path));
  
  // Navigation text color classes - when scrolled OR on light background pages, use dark text
  const getNavTextClass = () => {
    if (isScrolled || hasLightBackground) {
      // In light mode: dark text, in dark mode: light text
      return 'text-stone-900 dark:text-white';
    }
    // Not scrolled on dark hero pages - use white text
    return 'text-white';
  };

  // Logo class - invert when scrolled OR on light background pages
  // In dark mode when scrolled, keep logo white (no invert needed)
  const getLogoClass = () => {
    if (isScrolled || isMobileMenuOpen || hasLightBackground) {
      return 'invert brightness-0 dark:invert-0 dark:brightness-100';
    }
    return 'invert-0 brightness-100';
  };

  // CTA button class
  const getCtaClass = () => {
    if (isScrolled || hasLightBackground) {
      return 'border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-stone-900';
    }
    return 'border-white text-white hover:bg-white hover:text-stone-900';
  };

  // Hamburger menu class
  const getHamburgerClass = () => {
    if (isScrolled || isMobileMenuOpen || hasLightBackground) {
      return 'text-stone-900 bg-stone-900 dark:text-white dark:bg-white';
    }
    return 'text-white bg-white';
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-6 md:px-12 py-6",
        (isScrolled || hasLightBackground) ? "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent"
      )}
    >
      <div className="flex items-center justify-between max-w-[1920px] mx-auto w-full">
        <Link href="/" className="block w-12 h-12 md:w-14 md:h-14 relative transition-transform duration-300 hover:scale-105 z-50 flex-shrink-0">
          <img 
            src={logoUrl} 
            alt={siteName} 
            className={cn(
              "w-full h-full object-contain transition-all duration-300",
              getLogoClass()
            )}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className={cn("hidden md:flex items-center flex-shrink-0", navGap)}>
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
                    getNavTextClass()
                  )}
                >
                  {link.label}
                  <ChevronDown className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    openDropdown === link.label && "rotate-180"
                  )} />
                </button>
              ) : (
                // Regular link - wouter v3 Link renders <a> directly
                <Link 
                  href={link.href}
                  className={cn(
                    "uppercase tracking-[0.15em] hover:opacity-70 transition-all duration-300",
                    navFontSize,
                    getNavTextClass()
                  )}
                >
                  {link.label}
                </Link>
              )}

              {/* Dropdown Menu */}
              {link.children && openDropdown === link.label && (
                <div 
                  className="absolute top-full left-0 mt-2 py-2 bg-card text-card-foreground rounded-lg shadow-lg min-w-[220px] z-50 border border-border transition-colors duration-300"
                  onMouseEnter={() => handleDropdownEnter(link.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  {/* Child links */}
                  {link.children.map((child: NavItem) => (
                    <Link 
                      key={child.href + child.label} 
                      href={child.href}
                      className="block px-4 py-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Theme Toggle */}
          <ThemeToggle isScrolled={isScrolled} />
          
          {/* Button Navigation Items (CTA buttons) */}
          {buttonNavItems.map((link) => (
            <Link 
              key={link.href + link.label} 
              href={link.href}
              className={cn(
                "px-6 py-2 rounded-full uppercase tracking-[0.15em] transition-all duration-300 border",
                navFontSize,
                getCtaClass()
              )}
            >
              {link.label}
            </Link>
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
            getHamburgerClass()
          )} />
          <div className={cn(
            "w-6 h-0.5 bg-current transition-all duration-300 absolute",
            isMobileMenuOpen ? "-rotate-45" : "translate-y-1.5",
            getHamburgerClass()
          )} />
        </button>

        {/* Mobile Navigation Overlay */}
        <div 
          ref={menuRef}
          className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-[#f5f5f0] dark:bg-neutral-900 z-40 flex flex-col items-center justify-center translate-x-full md:hidden overflow-y-auto"
          style={{ minHeight: '100dvh' }}
        >
          {/* Decorative Background Element */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
             <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] rounded-full bg-black dark:bg-white blur-[100px]" />
          </div>

          <div ref={menuItemsRef} className="relative z-10 flex flex-col items-center gap-6 py-20">
            {/* Mobile Nav Links */}
            {regularNavItems.map((link) => (
              <div key={link.href + link.label} className="flex flex-col items-center">
                {link.children ? (
                  <>
                    <button
                      onClick={() => toggleMobileDropdown(link.label)}
                      className="font-serif text-3xl md:text-4xl text-foreground hover:opacity-70 transition-opacity flex items-center gap-2"
                    >
                      {link.label}
                      <ChevronDown className={cn(
                        "w-5 h-5 transition-transform duration-200",
                        openMobileDropdown === link.label && "rotate-180"
                      )} />
                    </button>
                    {/* Mobile dropdown children */}
                    {openMobileDropdown === link.label && (
                      <div className="flex flex-col items-center gap-3 mt-4">
                        {link.children.map((child: NavItem) => (
                          <Link 
                            key={child.href + child.label} 
                            href={child.href}
                            className="font-sans text-lg text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link 
                    href={link.href}
                    className="font-serif text-3xl md:text-4xl text-foreground hover:opacity-70 transition-opacity"
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Mobile CTA Buttons */}
            {buttonNavItems.map((link) => (
              <Link 
                key={link.href + link.label} 
                href={link.href}
                className="mt-4 px-8 py-3 rounded-full border border-foreground text-foreground hover:bg-foreground hover:text-white transition-all duration-300 font-sans text-sm uppercase tracking-[0.15em]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
