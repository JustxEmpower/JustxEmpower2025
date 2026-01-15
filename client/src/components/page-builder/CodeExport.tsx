/**
 * Code Export - Export page builder blocks as clean React/HTML code
 * 
 * Features:
 * - Export as React TSX
 * - Export as HTML
 * - Export as JSON
 * - Copy to clipboard
 * - Download as file
 */

import React, { useState, useMemo } from 'react';
import { PageBlock } from './usePageBuilderStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Copy, Download, Code, FileJson, FileCode, Check, Braces } from 'lucide-react';
import { toast } from 'sonner';

interface CodeExportProps {
  blocks: PageBlock[];
  pageTitle: string;
  pageSlug: string;
}

// Convert block content to React props string
function contentToProps(content: Record<string, unknown>, indent: number = 2): string {
  const spaces = ' '.repeat(indent);
  const entries = Object.entries(content).filter(([_, v]) => v !== undefined && v !== '');
  
  if (entries.length === 0) return '';
  
  return entries.map(([key, value]) => {
    if (typeof value === 'string') {
      return `${spaces}${key}="${value}"`;
    } else if (typeof value === 'boolean') {
      return value ? `${spaces}${key}` : '';
    } else if (typeof value === 'number') {
      return `${spaces}${key}={${value}}`;
    } else if (Array.isArray(value)) {
      return `${spaces}${key}={${JSON.stringify(value, null, 2).split('\n').join('\n' + spaces)}}`;
    } else if (typeof value === 'object') {
      return `${spaces}${key}={${JSON.stringify(value, null, 2).split('\n').join('\n' + spaces)}}`;
    }
    return '';
  }).filter(Boolean).join('\n');
}

// Generate React component for a block
function blockToReact(block: PageBlock): string {
  const componentName = block.type
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  const props = contentToProps(block.content, 4);
  
  if (props) {
    return `    <${componentName}\n${props}\n    />`;
  }
  return `    <${componentName} />`;
}

// Generate HTML for a block
function blockToHTML(block: PageBlock): string {
  const { type, content } = block;
  
  switch (type) {
    case 'je-hero-video':
    case 'je-hero-image':
      return `
  <section class="je-hero relative min-h-screen flex items-center justify-center overflow-hidden">
    ${content.videoUrl ? `<video class="absolute inset-0 w-full h-full object-cover" src="${content.videoUrl}" autoplay muted loop playsinline></video>` : ''}
    ${content.imageUrl ? `<img class="absolute inset-0 w-full h-full object-cover" src="${content.imageUrl}" alt="" />` : ''}
    <div class="absolute inset-0 bg-black/40"></div>
    <div class="relative z-10 text-center text-white max-w-4xl px-6">
      ${content.subtitle ? `<p class="text-xs tracking-widest uppercase mb-4">${content.subtitle}</p>` : ''}
      <h1 class="text-5xl md:text-7xl font-serif italic font-light mb-6">${content.title || ''}</h1>
      ${content.description ? `<p class="text-lg md:text-xl mb-8">${content.description}</p>` : ''}
      ${content.ctaText ? `<a href="${content.ctaLink || '#'}" class="inline-block px-8 py-3 border border-white rounded-full hover:bg-white hover:text-black transition-colors">${content.ctaText}</a>` : ''}
    </div>
  </section>`;

    case 'je-section-standard':
      return `
  <section class="je-section py-24 px-6 ${content.backgroundColor === 'dark' ? 'bg-stone-900 text-white' : 'bg-stone-50'}">
    <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <div class="${content.imagePosition === 'left' ? 'order-2' : ''}">
        ${content.label ? `<p class="text-xs tracking-widest uppercase text-amber-600 mb-4">${content.label}</p>` : ''}
        <h2 class="text-4xl font-serif mb-6">${content.title || ''}</h2>
        <p class="text-lg leading-relaxed mb-8">${content.description || ''}</p>
        ${content.ctaText ? `<a href="${content.ctaLink || '#'}" class="inline-block px-6 py-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors">${content.ctaText}</a>` : ''}
      </div>
      ${content.imageUrl ? `<div class="${content.imagePosition === 'left' ? 'order-1' : ''}"><img src="${content.imageUrl}" alt="" class="rounded-2xl w-full" /></div>` : ''}
    </div>
  </section>`;

    case 'je-heading':
      const level = content.level || 'h2';
      const align = content.alignment || 'center';
      return `
  <${level} class="text-${align} ${level === 'h1' ? 'text-5xl' : level === 'h2' ? 'text-4xl' : 'text-3xl'} font-serif mb-6">
    ${content.label ? `<span class="block text-xs tracking-widest uppercase text-amber-600 mb-2">${content.label}</span>` : ''}
    ${content.title || ''}
  </${level}>`;

    case 'je-paragraph':
      return `
  <p class="text-${content.alignment || 'left'} text-lg leading-relaxed max-w-prose ${content.alignment === 'center' ? 'mx-auto' : ''}">
    ${content.text || ''}
  </p>`;

    case 'je-button':
      return `
  <a href="${content.link || '#'}" class="inline-block px-6 py-3 ${content.variant === 'primary' ? 'bg-amber-600 text-white' : 'border border-current'} rounded-full hover:opacity-90 transition-opacity">
    ${content.text || 'Learn More'}
  </a>`;

    case 'je-newsletter':
      return `
  <section class="je-newsletter py-16 px-6 ${content.backgroundColor === 'dark' ? 'bg-stone-900 text-white' : 'bg-stone-100'}">
    <div class="max-w-xl mx-auto text-center">
      <h3 class="text-2xl font-serif mb-4">${content.title || 'Subscribe'}</h3>
      <p class="mb-6">${content.description || ''}</p>
      <form class="flex gap-2">
        <input type="email" placeholder="${content.placeholder || 'Enter your email'}" class="flex-1 px-4 py-3 rounded-full border" />
        <button type="submit" class="px-6 py-3 bg-amber-600 text-white rounded-full">${content.buttonText || 'Subscribe'}</button>
      </form>
    </div>
  </section>`;

    case 'je-divider':
      return `
  <hr class="my-12 border-t ${content.color === 'gold' ? 'border-amber-600' : 'border-stone-300'} ${content.width === 'small' ? 'w-16' : content.width === 'medium' ? 'w-32' : 'w-full'} mx-auto" />`;

    case 'je-spacer':
      const heights: Record<string, string> = { small: '2rem', medium: '4rem', large: '8rem' };
      return `
  <div style="height: ${heights[content.height as string] || '4rem'}"></div>`;

    default:
      return `
  <!-- Block: ${type} -->
  <div class="block-${type}" data-content='${JSON.stringify(content)}'>
    <!-- Implement ${type} block -->
  </div>`;
  }
}

export default function CodeExport({ blocks, pageTitle, pageSlug }: CodeExportProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('react');

  const reactCode = useMemo(() => {
    const imports = `import React from 'react';
import { 
  JEHero, JESection, JEHeading, JEParagraph, 
  JEButton, JENewsletter, JEDivider, JESpacer 
} from '@/components/page-builder';

`;
    const component = `export default function ${pageTitle.replace(/\s+/g, '')}Page() {
  return (
    <main className="min-h-screen">
${blocks.map(blockToReact).join('\n\n')}
    </main>
  );
}
`;
    return imports + component;
  }, [blocks, pageTitle]);

  const htmlCode = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet">
  <style>
    .font-serif { font-family: 'Cormorant Garamond', serif; }
    .je-hero { font-family: 'Cormorant Garamond', serif; }
  </style>
</head>
<body class="bg-white text-stone-900">
${blocks.map(blockToHTML).join('\n')}
</body>
</html>`;
  }, [blocks, pageTitle]);

  const jsonCode = useMemo(() => {
    return JSON.stringify({
      title: pageTitle,
      slug: pageSlug,
      blocks: blocks.map(({ id, type, content, order }) => ({
        id,
        type,
        content,
        order,
      })),
    }, null, 2);
  }, [blocks, pageTitle, pageSlug]);

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (code: string, filename: string, type: string) => {
    const blob = new Blob([code], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case 'react': return reactCode;
      case 'html': return htmlCode;
      case 'json': return jsonCode;
      default: return reactCode;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Code className="w-4 h-4" />
          Export Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Export Page Code</DialogTitle>
          <DialogDescription>
            Export your page as React components, HTML, or JSON data.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="react" className="gap-2">
                <FileCode className="w-4 h-4" />
                React TSX
              </TabsTrigger>
              <TabsTrigger value="html" className="gap-2">
                <Braces className="w-4 h-4" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <FileJson className="w-4 h-4" />
                JSON
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(getActiveCode())}
                className="gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const ext = activeTab === 'react' ? 'tsx' : activeTab === 'html' ? 'html' : 'json';
                  const type = activeTab === 'json' ? 'application/json' : 'text/plain';
                  downloadFile(getActiveCode(), `${pageSlug}.${ext}`, type);
                }}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <TabsContent value="react" className="m-0">
              <pre className="p-4 bg-stone-950 text-stone-100 text-sm overflow-auto max-h-[50vh] font-mono">
                <code>{reactCode}</code>
              </pre>
            </TabsContent>
            <TabsContent value="html" className="m-0">
              <pre className="p-4 bg-stone-950 text-stone-100 text-sm overflow-auto max-h-[50vh] font-mono">
                <code>{htmlCode}</code>
              </pre>
            </TabsContent>
            <TabsContent value="json" className="m-0">
              <pre className="p-4 bg-stone-950 text-stone-100 text-sm overflow-auto max-h-[50vh] font-mono">
                <code>{jsonCode}</code>
              </pre>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
