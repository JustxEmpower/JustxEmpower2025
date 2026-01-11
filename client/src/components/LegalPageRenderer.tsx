import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface LegalSection {
  id: string;
  header: string;
  body: string;
  footer?: string;
}

interface LegalPageRendererProps {
  pageKey: string;
  defaultTitle: string;
  defaultContent?: React.ReactNode;
}

export default function LegalPageRenderer({ pageKey, defaultTitle, defaultContent }: LegalPageRendererProps) {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent(pageKey);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get page title from hero section
  const title = getContent('hero', 'title', defaultTitle);
  const lastUpdated = getContent('hero', 'lastUpdated', '');

  // Get legal sections from database
  const sectionsJson = getContent('legalSections', 'sections', '[]');
  
  // Parse the sections JSON
  const sections: LegalSection[] = useMemo(() => {
    try {
      const parsed = JSON.parse(sectionsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse legal sections:', e);
      return [];
    }
  }, [sectionsJson]);

  // Generate PDF from page content using print dialog
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access iframe document');
      }

      // Build the print HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} - Just Empower</title>
            <style>
              @page {
                margin: 1in;
                size: letter;
              }
              body {
                font-family: 'Georgia', 'Times New Roman', serif;
                max-width: 100%;
                margin: 0;
                padding: 0;
                line-height: 1.7;
                color: #1a1a1a;
                font-size: 12pt;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #333;
              }
              .company-name {
                font-size: 14pt;
                font-weight: bold;
                margin-bottom: 10px;
                letter-spacing: 2px;
              }
              h1 {
                font-size: 24pt;
                margin: 20px 0 10px 0;
                font-style: italic;
                font-weight: normal;
              }
              .last-updated {
                font-size: 10pt;
                color: #666;
              }
              h2 {
                font-size: 14pt;
                margin-top: 30px;
                margin-bottom: 15px;
                font-style: italic;
                font-weight: normal;
                color: #333;
              }
              p {
                margin-bottom: 12px;
                text-align: justify;
              }
              .section {
                margin-bottom: 25px;
                page-break-inside: avoid;
              }
              .section-footer {
                font-size: 10pt;
                color: #666;
                margin-top: 10px;
                font-style: italic;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ccc;
                font-size: 10pt;
                color: #666;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">JUST EMPOWER</div>
              <h1>${title}</h1>
              ${lastUpdated ? `<p class="last-updated">Last updated: ${lastUpdated}</p>` : ''}
            </div>
            ${sections.map(section => `
              <div class="section">
                <h2>${section.header}</h2>
                ${section.body.split('\n\n').filter(p => p.trim()).map(para => `<p>${para}</p>`).join('')}
                ${section.footer ? `<p class="section-footer">${section.footer}</p>` : ''}
              </div>
            `).join('')}
            <div class="footer">
              <p>© ${new Date().getFullYear()} Just Empower. All rights reserved.</p>
              <p>www.justxempower.com</p>
            </div>
          </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Print the iframe content
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Check if we have dynamic sections
  const hasDynamicSections = sections.length > 0;

  // Render body text with paragraph spacing
  const renderBody = (body: string) => {
    const paragraphs = body.split('\n\n').filter(p => p.trim());
    return paragraphs.map((para, index) => (
      <p key={index} className="mb-4 text-foreground/80 leading-relaxed">
        {para}
      </p>
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        {/* Header with title and download button */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl italic text-foreground">{title}</h1>
            {lastUpdated && <p className="text-sm text-muted-foreground mt-2">Last updated: {lastUpdated}</p>}
          </div>
          {hasDynamicSections && (
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 shrink-0"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          )}
        </div>

        <div id="legal-content" className="prose prose-lg max-w-none">
          {hasDynamicSections ? (
            // Render dynamic sections from database
            <div className="space-y-10">
              {sections.map((section, index) => (
                <section key={section.id || index} className="border-b border-border/30 pb-8 last:border-0">
                  <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                    {section.header}
                  </h2>
                  {renderBody(section.body)}
                  {section.footer && (
                    <p className="text-sm text-muted-foreground italic mt-4">
                      {section.footer}
                    </p>
                  )}
                </section>
              ))}
            </div>
          ) : (
            // Render default content when no dynamic sections exist
            defaultContent
          )}
        </div>
      </div>
    </div>
  );
}
