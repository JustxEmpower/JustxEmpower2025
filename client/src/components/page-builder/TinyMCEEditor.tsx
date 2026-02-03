/**
 * TinyMCE Rich Text Editor Components
 * 
 * Provides comprehensive rich text editing for the page builder:
 * - Full editor with all formatting options
 * - Inline editor for in-place editing
 * - Block-level editor for use within EditableElement
 * 
 * Based on TinyMCE (https://github.com/tinymce/tinymce)
 * 
 * @version 2.0
 * @date February 2026
 */

import React, { useRef, useCallback, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  menubar?: boolean;
  inline?: boolean;
  toolbar?: string;
  className?: string;
  // New props for block integration
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  darkMode?: boolean;
}

export default function TinyMCEEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  height = 300,
  menubar = false,
  inline = false,
  toolbar = 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright | bullist numlist | link image | forecolor backcolor | removeformat',
  className = '',
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <div className={className}>
      <Editor
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={(content) => onChange(content)}
        inline={inline}
        init={{
          height,
          menubar,
          placeholder,
          plugins: [
            'advlist',
            'autolink',
            'lists',
            'link',
            'image',
            'charmap',
            'preview',
            'anchor',
            'searchreplace',
            'visualblocks',
            'code',
            'fullscreen',
            'insertdatetime',
            'media',
            'table',
            'help',
            'wordcount',
          ],
          toolbar,
          // Custom font families including brand fonts
          font_family_formats: 'Inter=Inter, sans-serif; Playfair Display=Playfair Display, serif; Lora=Lora, serif; Merriweather=Merriweather, serif; Georgia=Georgia, serif; Retro Signature=Retro Signature, cursive; Aphrodite=Aphrodite, cursive; Cherolina=Cherolina, cursive; Faithfull Signature=Faithfull Signature, cursive; Rise of Beauty Script=Rise of Beauty Script, cursive; Arial=arial, helvetica, sans-serif; Times New Roman=times new roman, times, serif',
          // Font size options
          font_size_formats: '8px 10px 12px 14px 16px 18px 20px 24px 28px 32px 36px 42px 48px 56px 64px 72px',
          content_style: `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap');
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #1a1a1a;
            }
            p { margin: 0 0 1em 0; }
            h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em 0; font-weight: 600; }
          `,
          skin: 'oxide',
          content_css: 'default',
          branding: false,
          promotion: false,
          statusbar: false,
          resize: false,
          paste_data_images: true,
          automatic_uploads: true,
          file_picker_types: 'image',
          images_upload_handler: async (blobInfo) => {
            // For now, return a data URL. In production, upload to server.
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blobInfo.blob());
            });
          },
        }}
      />
    </div>
  );
}

// Inline variant for use in page builder blocks
export function InlineTinyMCEEditor({
  value,
  onChange,
  placeholder = 'Click to edit...',
  className = '',
  onFocus,
  onBlur,
  darkMode = false,
}: Omit<TinyMCEEditorProps, 'height' | 'menubar' | 'inline'>) {
  const editorRef = useRef<any>(null);

  return (
    <div className={className}>
      <Editor
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={(content) => onChange(content)}
        onFocus={onFocus}
        onBlur={onBlur}
        inline={true}
        init={{
          menubar: false,
          placeholder,
          plugins: ['autolink', 'lists', 'link'],
          toolbar: 'bold italic underline | link | bullist numlist',
          content_style: `
            body {
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
              color: ${darkMode ? '#ffffff' : 'inherit'};
            }
          `,
          branding: false,
          promotion: false,
          statusbar: false,
        }}
      />
    </div>
  );
}

/**
 * Block Text Editor - Rich text component for use within blocks
 * Combines TinyMCE with styling controls for complete text manipulation
 */
interface BlockTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  textStyle?: {
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
  };
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
  darkMode?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function BlockTextEditor({
  value,
  onChange,
  placeholder = 'Click to edit...',
  className = '',
  textStyle = {},
  as: Element = 'div',
  darkMode = false,
  onFocus,
  onBlur,
}: BlockTextEditorProps) {
  const editorRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const styleString = `
    body {
      font-family: inherit;
      font-size: ${textStyle.fontSize || 'inherit'};
      font-weight: ${textStyle.fontWeight || 'inherit'};
      font-style: ${textStyle.fontStyle || 'inherit'};
      line-height: ${textStyle.lineHeight || 'inherit'};
      letter-spacing: ${textStyle.letterSpacing || 'inherit'};
      text-align: ${textStyle.textAlign || 'inherit'};
      color: ${textStyle.color || (darkMode ? '#ffffff' : 'inherit')};
      margin: 0;
      padding: 0;
    }
    p { margin: 0; }
  `;

  return (
    <div 
      className={`block-text-editor ${isFocused ? 'is-focused' : ''} ${className}`}
      style={{
        fontSize: textStyle.fontSize,
        fontWeight: textStyle.fontWeight,
        fontStyle: textStyle.fontStyle,
        lineHeight: textStyle.lineHeight,
        letterSpacing: textStyle.letterSpacing,
        textAlign: textStyle.textAlign,
        color: textStyle.color,
      }}
    >
      <Editor
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={(content) => onChange(content)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        inline={true}
        init={{
          menubar: false,
          placeholder,
          plugins: ['autolink', 'lists', 'link', 'charmap'],
          toolbar: isFocused 
            ? 'bold italic underline strikethrough | forecolor | link | removeformat'
            : false,
          toolbar_mode: 'floating',
          content_style: styleString,
          branding: false,
          promotion: false,
          statusbar: false,
        }}
      />
    </div>
  );
}
