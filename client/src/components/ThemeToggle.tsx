import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  isScrolled?: boolean;
  isMobileMenu?: boolean;
}

export default function ThemeToggle({ className, isScrolled = false, isMobileMenu = false }: ThemeToggleProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-14 h-7 rounded-full transition-all duration-300 flex items-center",
        "border focus:outline-none focus:ring-2 focus:ring-primary/50",
        isMobileMenu 
          ? "bg-foreground/10 border-foreground/20" 
          : isScrolled 
            ? "bg-foreground/10 border-foreground/20" 
            : "bg-white/10 border-white/20",
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Track background */}
      <span 
        className={cn(
          "absolute inset-0.5 rounded-full transition-colors duration-300",
          theme === 'dark' ? "bg-slate-800" : "bg-amber-100"
        )}
      />
      
      {/* Toggle knob */}
      <span 
        className={cn(
          "absolute w-5 h-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center",
          theme === 'dark' 
            ? "translate-x-7 bg-slate-700" 
            : "translate-x-1 bg-white"
        )}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3 text-blue-300" />
        ) : (
          <Sun className="w-3 h-3 text-amber-500" />
        )}
      </span>
      
      {/* Icons on track */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2">
        <Sun className={cn(
          "w-3 h-3 transition-opacity duration-300",
          theme === 'light' ? "opacity-0" : "opacity-50 text-amber-400"
        )} />
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
        <Moon className={cn(
          "w-3 h-3 transition-opacity duration-300",
          theme === 'dark' ? "opacity-0" : "opacity-50 text-slate-400"
        )} />
      </span>
    </button>
  );
}
