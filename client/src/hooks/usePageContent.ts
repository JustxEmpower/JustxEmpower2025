import { trpc } from '@/lib/trpc';
import React from 'react';

interface TextStyle {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontSize?: string | null;
  fontColor?: string | null;
}

/**
 * Hook to fetch and organize page content from the database
 * Returns a helper function to get specific content values by section and key
 * Also returns text styles for formatting
 */
export function usePageContent(page: string) {
  // Use the public content route instead of admin route
  // Disable caching to ensure fresh content is always fetched
  const { data: contentData, isLoading } = trpc.content.getByPage.useQuery(
    { page },
    {
      staleTime: 0, // Always consider data stale
      refetchOnMount: 'always', // Always refetch on mount
      refetchOnWindowFocus: true, // Refetch when window regains focus
    }
  );

  // Fetch text styles for this page
  const { data: textStylesData, error: textStylesError, isError: textStylesIsError } = trpc.content.getTextStylesByPage.useQuery(
    { page },
    {
      enabled: !!page, // Only fetch when page is defined
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      retry: 3, // Retry failed requests
    }
  );
  
  // DEBUG: Log any errors fetching text styles
  if (textStylesIsError) {
    console.error('[usePageContent] Error fetching text styles:', textStylesError);
  }

  // Build a map of section.contentKey -> styles for easy lookup
  // This ensures each field has independent styling (e.g., hero.title vs philosophy.title)
  const stylesMap = new Map<string, TextStyle>();
  if (textStylesData) {
    // Debug: Log text styles data for this page
    if (page === 'home') {
      console.log('[usePageContent] Text styles for home page:', textStylesData);
    }
    textStylesData.forEach((style) => {
      // Use section.contentKey as the key for unique per-field styling
      const key = style.section ? `${style.section}.${style.contentKey}` : style.contentKey;
      stylesMap.set(key, {
        isBold: style.isBold,
        isItalic: style.isItalic,
        isUnderline: style.isUnderline,
        fontSize: style.fontSize,
        fontColor: style.fontColor,
      });
    });
  }

  // Helper function to get a specific content value
  const getContent = (section: string, key: string, defaultValue: string = ''): string => {
    if (!contentData) return defaultValue;
    
    const item = contentData.find(
      (c) => c.section === section && c.contentKey === key
    );
    
    return item?.contentValue || defaultValue;
  };

  // Helper to get text style for a specific section and content key
  const getTextStyle = (section: string, key: string): TextStyle => {
    // Try section-specific key first, then fall back to just key
    const sectionKey = `${section}.${key}`;
    const style = stylesMap.get(sectionKey) || stylesMap.get(key) || { isBold: false, isItalic: false, isUnderline: false };
    
    // Debug: Log when fetching hero styles
    if (section === 'hero' && (style.isBold || style.isItalic || style.fontSize || style.fontColor)) {
      console.log(`[usePageContent] getTextStyle('${section}', '${key}'):`, style);
    }
    
    return style;
  };

  // Helper to get CSS classes for text styling (with !important to override defaults)
  const getStyleClasses = (section: string, key: string): string => {
    const style = getTextStyle(section, key);
    const classes = [];
    if (style.isBold) classes.push('!font-bold');
    if (style.isItalic) classes.push('!italic');
    if (style.isUnderline) classes.push('!underline');
    // Don't add any color class - let inline style handle it
    return classes.join(' ');
  };

  // Helper to get inline styles for text styling (includes font size and color)
  const getInlineStyles = (section: string, key: string): React.CSSProperties => {
    const style = getTextStyle(section, key);
    const inlineStyles: React.CSSProperties = {};
    if (style.isBold) inlineStyles.fontWeight = 'bold';
    if (style.isItalic) inlineStyles.fontStyle = 'italic';
    if (style.isUnderline) inlineStyles.textDecoration = 'underline';
    if (style.fontSize) inlineStyles.fontSize = style.fontSize;
    if (style.fontColor) inlineStyles.color = style.fontColor;
    return inlineStyles;
  };

  // Helper to get all content for a section as an object
  const getSection = (section: string): Record<string, string> => {
    if (!contentData) return {};
    
    const sectionItems = contentData.filter((c) => c.section === section);
    return sectionItems.reduce((acc, item) => {
      acc[item.contentKey] = item.contentValue;
      return acc;
    }, {} as Record<string, string>);
  };

  // Helper to get content with styles as a React element
  const getStyledContent = (
    section: string, 
    key: string, 
    defaultValue: string = '',
    Tag: React.ElementType = 'span',
    baseClassName: string = ''
  ): React.ReactElement => {
    const value = getContent(section, key, defaultValue);
    const styleClasses = getStyleClasses(section, key);
    const combinedClassName = `${baseClassName} ${styleClasses}`.trim();
    
    return React.createElement(Tag, { 
      className: combinedClassName || undefined,
      style: getInlineStyles(section, key)
    }, value);
  };

  // Helper to get section data with styles
  const getSectionWithStyles = (sectionName: string): Record<string, { value: string; style: TextStyle }> => {
    if (!contentData) return {};
    
    const sectionItems = contentData.filter((c) => c.section === sectionName);
    return sectionItems.reduce((acc, item) => {
      acc[item.contentKey] = {
        value: item.contentValue,
        style: getTextStyle(sectionName, item.contentKey),
      };
      return acc;
    }, {} as Record<string, { value: string; style: TextStyle }>);
  };

  return {
    content: contentData || [],
    textStyles: textStylesData || [],
    isLoading,
    getContent,
    getSection,
    getSectionWithStyles,
    getTextStyle,
    getStyleClasses,
    getInlineStyles,
    getStyledContent,
  };
}
