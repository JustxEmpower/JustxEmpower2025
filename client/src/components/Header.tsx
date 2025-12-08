import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import gsap from 'gsap';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Animate menu in
      const ctx = gsap.context(() => {
        gsap.to(menuRef.current, {
          x: '0%',
          duration: 0.8,
          ease: 'power3.inOut'
        });

        const links = menuItemsRef.current?.querySelectorAll('a');
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
      // Unlock body scroll
      document.body.style.overflow = '';
      
      // Animate menu out
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
  }, [location]);

  const navLinks = [
    { href: '/about', label: 'About' },
    { href: '/philosophy', label: 'Philosophy' },
    { href: '/offerings', label: 'Offerings' },
    { href: '/journal', label: 'Journal' },
    { href: '/contact', label: 'Contact' },
  ];

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
              src="/media/logo-white.png" 
              alt="Just Empower" 
              className={cn(
                "w-full h-full object-contain transition-all duration-300",
                (isScrolled || isMobileMenuOpen) ? "invert brightness-0" : "" // Invert to black when scrolled or menu open
              )}
            />
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a className={cn(
                "text-sm uppercase tracking-[0.15em] hover:opacity-70 transition-all duration-300",
                isScrolled ? "text-foreground" : "text-white"
              )}>
                {link.label}
              </a>
            </Link>
          ))}
          <Link href="/walk-with-us">
            <a className={cn(
              "px-6 py-2 rounded-full text-sm uppercase tracking-[0.15em] transition-all duration-300 border",
              isScrolled 
                ? "border-foreground text-foreground hover:bg-foreground hover:text-white" 
                : "border-white text-white hover:bg-white hover:text-foreground"
            )}>
              Walk With Us
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
          className="fixed inset-0 bg-[#f5f5f0] z-40 flex flex-col items-center justify-center translate-x-full md:hidden"
        >
          {/* Decorative Background Element */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
             <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] rounded-full bg-black blur-[100px]" />
          </div>

          <nav ref={menuItemsRef} className="flex flex-col items-center gap-8 relative z-10">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className="text-4xl font-serif italic text-foreground hover:text-primary transition-colors font-light">
                  {link.label}
                </a>
              </Link>
            ))}
            <Link href="/walk-with-us">
              <a className="px-10 py-4 rounded-full text-sm uppercase tracking-[0.2em] border border-foreground text-foreground hover:bg-foreground hover:text-white transition-all mt-8">
                Walk With Us
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
