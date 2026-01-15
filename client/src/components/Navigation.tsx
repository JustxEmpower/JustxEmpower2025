import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '/about' },
    { name: 'Offerings', href: '/offerings' },
    { name: 'Philosophy', href: '/philosophy' },
    { name: 'Journal', href: '/journal' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out px-6 md:px-12 py-6',
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' : 'bg-transparent'
        )}
      >
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          {/* Logo */}
          <Link 
            href="/"
            className={cn(
              "font-serif text-2xl tracking-widest uppercase transition-colors duration-300 z-50 relative",
              scrolled || mobileMenuOpen ? "text-foreground" : "text-white"
            )}
          >
            Just Empower
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "text-xs uppercase tracking-[0.15em] transition-colors duration-300 hover:text-primary",
                  scrolled ? "text-foreground" : "text-white"
                )}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              href="/walk-with-us"
              className={cn(
                "px-6 py-3 border text-xs uppercase tracking-[0.15em] transition-all duration-300 hover:bg-primary hover:border-primary hover:text-white",
                scrolled 
                  ? "border-foreground text-foreground" 
                  : "border-white text-white"
              )}
            >
              Walk With Us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden z-50 relative group"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className="w-8 h-6 flex flex-col justify-between items-end">
              <span className={cn(
                "h-[2px] w-full transition-all duration-300",
                scrolled || mobileMenuOpen ? "bg-foreground" : "bg-white",
                mobileMenuOpen && "rotate-45 translate-y-[11px]"
              )} />
              <span className={cn(
                "h-[2px] w-2/3 transition-all duration-300 group-hover:w-full",
                scrolled || mobileMenuOpen ? "bg-foreground" : "bg-white",
                mobileMenuOpen && "opacity-0"
              )} />
              <span className={cn(
                "h-[2px] w-full transition-all duration-300",
                scrolled || mobileMenuOpen ? "bg-foreground" : "bg-white",
                mobileMenuOpen && "-rotate-45 -translate-y-[11px]"
              )} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 bg-white z-40 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] md:hidden flex flex-col justify-center items-center",
        mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="flex flex-col items-center space-y-8">
          {navLinks.map((link, i) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="font-serif text-4xl text-foreground hover:text-primary transition-colors duration-300 italic"
              onClick={() => setMobileMenuOpen(false)}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {link.name}
            </Link>
          ))}
          <Link 
            href="/walk-with-us"
            className="mt-8 px-8 py-4 border border-foreground text-foreground text-sm uppercase tracking-[0.2em] hover:bg-foreground hover:text-white transition-all duration-300"
            onClick={() => setMobileMenuOpen(false)}
          >
            Walk With Us
          </Link>
        </div>
      </div>
    </>
  );
}
