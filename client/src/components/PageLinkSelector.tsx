import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link2, ExternalLink } from 'lucide-react';

// Define all available pages on the site
const SITE_PAGES = [
  { label: 'Home', value: '/' },
  { label: 'Philosophy', value: '/philosophy' },
  { label: 'Founder', value: '/founder' },
  { label: 'Vision & Ethos', value: '/vision-ethos' },
  { label: 'Offerings', value: '/offerings' },
  { label: 'Seeds of a New Paradigm', value: '/offerings/seeds-of-new-paradigm' },
  { label: 'MOM VI·X Trilogy', value: '/offerings/mom-vix' },
  { label: 'She Writes', value: '/offerings/she-writes' },
  { label: 'Rooted Unity', value: '/offerings/rooted-unity' },
  { label: 'Workshops & Programs', value: '/workshops-programs' },
  { label: 'VI·X Journal Trilogy', value: '/vix-journal-trilogy' },
  { label: 'Blog (She Writes)', value: '/blog' },
  { label: 'Shop', value: '/shop' },
  { label: 'Community Events', value: '/community-events' },
  { label: 'Resources', value: '/resources' },
  { label: 'Walk With Us', value: '/walk-with-us' },
  { label: 'Contact', value: '/contact' },
  { label: 'Accessibility', value: '/accessibility' },
  { label: 'Privacy Policy', value: '/privacy-policy' },
  { label: 'Terms of Service', value: '/terms-of-service' },
  { label: 'Cookie Policy', value: '/cookie-policy' },
];

interface PageLinkSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  allowCustom?: boolean;
}

export function PageLinkSelector({ 
  value, 
  onChange, 
  placeholder = 'Select a page...', 
  label,
  allowCustom = true 
}: PageLinkSelectorProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customUrl, setCustomUrl] = useState(value || '');

  // Check if current value is a custom URL (not in the predefined list)
  const isCustomUrl = value && !SITE_PAGES.some(page => page.value === value);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === '__custom__') {
      setIsCustomMode(true);
      setCustomUrl(value || '');
    } else {
      setIsCustomMode(false);
      onChange(selectedValue);
    }
  };

  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setCustomUrl(newUrl);
    onChange(newUrl);
  };

  const handleSwitchToSelect = () => {
    setIsCustomMode(false);
    // If current value is in the list, keep it; otherwise clear
    if (!SITE_PAGES.some(page => page.value === value)) {
      onChange('');
    }
  };

  // If in custom mode or value is a custom URL, show input
  if (isCustomMode || (isCustomUrl && allowCustom)) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="url"
              value={customUrl}
              onChange={handleCustomUrlChange}
              placeholder="Enter custom URL..."
              className="pl-10"
            />
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={handleSwitchToSelect}
            title="Switch to page selector"
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter a full URL or path (e.g., /my-page or https://example.com)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
      <div className="flex gap-2">
        <Select value={value || ''} onValueChange={handleSelectChange}>
          <SelectTrigger className="flex-1">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={placeholder} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {SITE_PAGES.map((page) => (
              <SelectItem key={page.value} value={page.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{page.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{page.value}</span>
                </div>
              </SelectItem>
            ))}
            {allowCustom && (
              <SelectItem value="__custom__">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Custom URL...</span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default PageLinkSelector;
