import { Link } from 'wouter';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a1a] text-white pt-24 pb-12">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          
          {/* Brand Column */}
          <div className="md:col-span-4">
            <Link href="/">
              <a className="font-serif text-3xl italic mb-8 block">JustEmpower 2025</a>
            </Link>
            <p className="font-sans text-white/60 text-sm leading-relaxed max-w-xs mb-8">
              Catalyzing the rise of her through embodied transformation and conscious leadership.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors duration-300">IG</a>
              <a href="#" className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors duration-300">LI</a>
            </div>
          </div>

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

          {/* Newsletter Column */}
          <div className="md:col-span-2">
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-white/40 mb-8">Stay Connected</h3>
            <form className="flex flex-col gap-4">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-transparent border-b border-white/20 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-white transition-colors"
              />
              <button className="self-start font-sans text-xs uppercase tracking-[0.2em] mt-2 hover:text-primary transition-colors">
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.1em] text-white/40">
            © {currentYear} Just Empower™. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="font-sans text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="font-sans text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
