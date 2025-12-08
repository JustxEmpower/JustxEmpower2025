import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <a className="block w-16 h-16 relative transition-transform duration-300 hover:scale-105">
            <img 
              src="/media/logo-white.png" 
              alt="Just Empower" 
              className={cn(
                "w-full h-full object-contain transition-all duration-300",
                isScrolled ? "invert brightness-0" : "" // Invert to black when scrolled on white background
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
          className="md:hidden z-50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className={isScrolled ? "text-foreground" : "text-white"} />
          ) : (
            <Menu className={isScrolled ? "text-foreground" : "text-white"} />
          )}
        </button>

        {/* Mobile Navigation Overlay */}
        <div className={cn(
          "fixed inset-0 bg-background z-40 flex flex-col items-center justify-center transition-transform duration-500 md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <nav className="flex flex-col items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className="text-2xl font-serif italic text-foreground hover:text-primary transition-colors">
                  {link.label}
                </a>
              </Link>
            ))}
            <Link href="/walk-with-us">
              <a className="px-8 py-3 rounded-full text-sm uppercase tracking-[0.15em] border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all mt-4">
                Walk With Us
              </a>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
