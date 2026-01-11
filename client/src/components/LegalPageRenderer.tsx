import { useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

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

  // Generate PDF from page content
  const handleDownloadPDF = async () => {
    // Create a printable version of the content
    const printContent = document.getElementById('legal-content');
    if (!printContent) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF');
      return;
    }

    // Build the print HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              line-height: 1.6;
              color: #333;
            }
            h1 {
              font-size: 28px;
              margin-bottom: 20px;
              font-style: italic;
            }
            h2 {
              font-size: 20px;
              margin-top: 30px;
              margin-bottom: 15px;
              font-style: italic;
            }
            p {
              margin-bottom: 15px;
            }
            .last-updated {
              font-size: 12px;
              color: #666;
              margin-bottom: 30px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-footer {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
              font-style: italic;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${lastUpdated ? `<p class="last-updated">Last updated: ${lastUpdated}</p>` : ''}
          ${sections.map(section => `
            <div class="section">
              <h2>${section.header}</h2>
              ${section.body.split('\n\n').map(para => `<p>${para}</p>`).join('')}
              ${section.footer ? `<p class="section-footer">${section.footer}</p>` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
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
              className="flex items-center gap-2 shrink-0"
            >
              <Download className="h-4 w-4" />
              Download PDF
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
