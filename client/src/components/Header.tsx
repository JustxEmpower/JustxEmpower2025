import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { getMediaUrl } from '@/lib/media';
import { trpc } from '@/lib/trpc';

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

  // Fetch dynamic pages from database for additional nav items
  const { data: dynamicPages } = trpc.pages.getNavPages.useQuery();

  // New navigation structure based on sitemap
  const navLinks: NavItem[] = [
    { 
      href: '/philosophy', 
      label: 'Philosophy',
      children: [
        { href: '/about', label: 'Founder' },
        { href: '/philosophy', label: 'Vision & Ethos' },
      ]
    },
    { 
      href: '/offerings', 
      label: 'Offerings',
      children: [
        { href: '/offerings', label: 'Workshops & Programs' },
        { href: '/journal-trilogy', label: 'VI • X Journal Trilogy' },
        { href: '/journal', label: 'Blog (She Writes)' },
      ]
    },
    { href: '/shop', label: 'Shop' },
    { href: '/events', label: 'Events' },
    { href: '/resources', label: 'Resources' },
  ];

  // Add any additional dynamic pages that aren't in the core structure
  const additionalNavItems = useMemo(() => {
    if (!dynamicPages || dynamicPages.length === 0) return [];

    // Filter out pages that are already in our core navigation
    const corePageSlugs = ['philosophy', 'about', 'offerings', 'shop', 'events', 'resources', 'walk-with-us', 'contact', 'journal', 'journal-trilogy'];
    
    const additionalPages = dynamicPages.filter(p => 
      !p.parentId && !corePageSlugs.includes(p.slug)
    );

    return additionalPages.map(page => ({
      href: `/${page.slug}`,
      label: page.title,
    }));
  }, [dynamicPages]);

  // Combine nav links with any additional dynamic pages
  const allNavLinks: NavItem[] = useMemo(() => {
    return [...navLinks, ...additionalNavItems];
  }, [additionalNavItems]);

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
              src={getMediaUrl('/media/logo-white.png')} 
              alt="Just Empower" 
              className={cn(
                "w-full h-full object-contain transition-all duration-300",
                (isScrolled || isMobileMenuOpen) ? "invert brightness-0" : ""
              )}
            />
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav className={cn("hidden md:flex items-center", navGap)}>
          {allNavLinks.map((link) => (
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
                <Link href={link.href}>
                  <a className={cn(
                    "uppercase tracking-[0.15em] hover:opacity-70 transition-all duration-300",
                    navFontSize,
                    isScrolled ? "text-foreground" : "text-white"
                  )}>
                    {link.label}
                  </a>
                </Link>
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
                    <Link key={child.href + child.label} href={child.href}>
                      <a className="block px-4 py-2 text-sm text-foreground hover:bg-neutral-100 transition-colors">
                        {child.label}
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Walk With Us - CTA Button */}
          <Link href="/walk-with-us">
            <a className={cn(
              "px-6 py-2 rounded-full uppercase tracking-[0.15em] transition-all duration-300 border",
              navFontSize,
              isScrolled 
                ? "border-foreground text-foreground hover:bg-foreground hover:text-white" 
                : "border-white text-white hover:bg-white hover:text-foreground"
            )}>
              Walk With Us
            </a>
          </Link>
          
          {/* Contact */}
          <Link href="/contact">
            <a className={cn(
              "uppercase tracking-[0.15em] hover:opacity-70 transition-all duration-300",
              navFontSize,
              isScrolled ? "text-foreground" : "text-white"
            )}>
              Contact
            </a>
          </Link>
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
            {allNavLinks.map((link) => (
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
                          <Link key={child.href + child.label} href={child.href}>
                            <a className="text-xl text-foreground/80 hover:text-primary transition-colors">
                              {child.label}
                            </a>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Regular link (mobile)
                  <Link href={link.href}>
                    <a className="text-3xl font-serif italic text-foreground hover:text-primary transition-colors font-light">
                      {link.label}
                    </a>
                  </Link>
                )}
              </div>
            ))}
            
            {/* Walk With Us - Mobile CTA */}
            <Link href="/walk-with-us">
              <a className="px-10 py-4 rounded-full text-sm uppercase tracking-[0.2em] border border-foreground text-foreground hover:bg-foreground hover:text-white transition-all mt-6">
                Walk With Us
              </a>
            </Link>
            
            {/* Contact - Mobile */}
            <Link href="/contact">
              <a className="text-3xl font-serif italic text-foreground hover:text-primary transition-colors font-light mt-2">
                Contact
              </a>
            </Link>
          </nav>
          
          <div className="absolute bottom-12 left-0 w-full text-center">
             <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
               © 2025 Just Empower
             </p>
          </div>
        </div>
      </div>
    </header>
  );
}
