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
  const { data: textStylesData } = trpc.content.getTextStylesByPage.useQuery(
    { page },
    {
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    }
  );

  // Build a map of contentKey -> styles for easy lookup
  const stylesMap = new Map<string, TextStyle>();
  if (textStylesData) {
    textStylesData.forEach((style) => {
      stylesMap.set(style.contentKey, {
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

  // Helper to get text style for a specific content key
  const getTextStyle = (key: string): TextStyle => {
    return stylesMap.get(key) || { isBold: false, isItalic: false, isUnderline: false };
  };

  // Helper to get CSS classes for text styling
  const getStyleClasses = (key: string): string => {
    const style = getTextStyle(key);
    const classes = [];
    if (style.isBold) classes.push('font-bold');
    if (style.isItalic) classes.push('italic');
    if (style.isUnderline) classes.push('underline');
    return classes.join(' ');
  };

  // Helper to get inline styles for text styling (includes font size and color)
  const getInlineStyles = (key: string): React.CSSProperties => {
    const style = getTextStyle(key);
    return {
      fontWeight: style.isBold ? 'bold' : undefined,
      fontStyle: style.isItalic ? 'italic' : undefined,
      textDecoration: style.isUnderline ? 'underline' : undefined,
      fontSize: style.fontSize || undefined,
      color: style.fontColor || undefined,
    };
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
    Tag: keyof JSX.IntrinsicElements = 'span',
    baseClassName: string = ''
  ): React.ReactElement => {
    const value = getContent(section, key, defaultValue);
    const styleClasses = getStyleClasses(key);
    const combinedClassName = `${baseClassName} ${styleClasses}`.trim();
    
    return React.createElement(Tag, { 
      className: combinedClassName || undefined,
      style: getInlineStyles(key)
    }, value);
  };

  // Helper to get section data with styles
  const getSectionWithStyles = (section: string): Record<string, { value: string; style: TextStyle }> => {
    if (!contentData) return {};
    
    const sectionItems = contentData.filter((c) => c.section === section);
    return sectionItems.reduce((acc, item) => {
      acc[item.contentKey] = {
        value: item.contentValue,
        style: getTextStyle(item.contentKey),
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
