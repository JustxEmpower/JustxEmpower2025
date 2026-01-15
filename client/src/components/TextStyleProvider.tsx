import React, { createContext, useContext, useMemo, useState, ElementType } from 'react';
import { trpc } from '@/lib/trpc';

interface TextStyle {
  contentId: number;
  contentKey: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontSize?: string | null;
  fontColor?: string | null;
}

interface TextStyleContextType {
  getStyle: (contentKey: string) => TextStyle | undefined;
  getStyleClasses: (contentKey: string) => string;
  getInlineStyles: (contentKey: string) => React.CSSProperties;
  allStyles: TextStyle[];
  isLoading: boolean;
}

const TextStyleContext = createContext<TextStyleContextType>({
  getStyle: () => undefined,
  getStyleClasses: () => '',
  getInlineStyles: () => ({}),
  allStyles: [],
  isLoading: true,
});

export function useTextStyles() {
  return useContext(TextStyleContext);
}

interface TextStyleProviderProps {
  page: string;
  children: React.ReactNode;
}

/**
 * TextStyleProvider fetches and provides text styles (bold/italic/underline/fontSize/fontColor)
 * for a specific page. Wrap page components with this to enable text styling.
 */
export function TextStyleProvider({ page, children }: TextStyleProviderProps) {
  const { data: textStylesData, isLoading } = trpc.content.getTextStylesByPage.useQuery(
    { page },
    {
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    }
  );

  // Build a map for quick lookup by contentKey
  const stylesMap = useMemo(() => {
    const map = new Map<string, TextStyle>();
    if (textStylesData) {
      textStylesData.forEach((style) => {
        map.set(style.contentKey, style);
      });
    }
    return map;
  }, [textStylesData]);

  const getStyle = (contentKey: string): TextStyle | undefined => {
    return stylesMap.get(contentKey);
  };

  const getStyleClasses = (contentKey: string): string => {
    const style = stylesMap.get(contentKey);
    if (!style) return '';
    
    const classes = [];
    if (style.isBold) classes.push('font-bold');
    if (style.isItalic) classes.push('italic');
    if (style.isUnderline) classes.push('underline');
    return classes.join(' ');
  };

  const getInlineStyles = (contentKey: string): React.CSSProperties => {
    const style = stylesMap.get(contentKey);
    if (!style) return {};
    
    const inlineStyles: React.CSSProperties = {};
    
    if (style.isBold) inlineStyles.fontWeight = 'bold';
    if (style.isItalic) inlineStyles.fontStyle = 'italic';
    if (style.isUnderline) inlineStyles.textDecoration = 'underline';
    if (style.fontSize) inlineStyles.fontSize = style.fontSize;
    if (style.fontColor) inlineStyles.color = style.fontColor;
    
    return inlineStyles;
  };

  const value: TextStyleContextType = {
    getStyle,
    getStyleClasses,
    getInlineStyles,
    allStyles: textStylesData || [],
    isLoading,
  };

  return (
    <TextStyleContext.Provider value={value}>
      {children}
    </TextStyleContext.Provider>
  );
}

/**
 * StyledText component that automatically applies text styles based on contentKey
 */
interface StyledTextProps {
  contentKey: string;
  children: React.ReactNode;
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
}

export function StyledText({ 
  contentKey, 
  children, 
  as: Component = 'span',
  className = '',
  style = {},
}: StyledTextProps) {
  const { getStyleClasses, getInlineStyles } = useTextStyles();
  
  const styleClasses = getStyleClasses(contentKey);
  const inlineStyles = getInlineStyles(contentKey);
  
  return React.createElement(Component, {
    className: `${className} ${styleClasses}`.trim(),
    style: { ...style, ...inlineStyles },
  }, children);
}

export default TextStyleProvider;
