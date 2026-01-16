import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

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

// Helper to extract unique sections from content data and build them dynamically
function buildSectionsFromContent(contentData: Array<{ section: string; contentKey: string; contentValue: string }>) {
  // Get unique section names (excluding 'hero' and 'legalSections')
  const sectionNames = [...new Set(contentData
    .filter(c => c.section && c.section !== 'hero' && c.section !== 'legalSections')
    .map(c => c.section)
  )];

  const sections: LegalSection[] = [];

  for (const sectionName of sectionNames) {
    const sectionContent = contentData.filter(c => c.section === sectionName);
    
    // Get heading
    const headingItem = sectionContent.find(c => c.contentKey === 'heading' || c.contentKey === 'Heading');
    const heading = headingItem?.contentValue || sectionName;
    
    // Get intro/content
    const introItem = sectionContent.find(c => c.contentKey === 'intro' || c.contentKey === 'Intro' || c.contentKey === 'content' || c.contentKey === 'Content');
    
    // Build body from all other fields
    const bodyParts: string[] = [];
    
    // Add intro first if exists
    if (introItem?.contentValue) {
      bodyParts.push(introItem.contentValue);
    }
    
    // Add other content fields (excluding heading and intro)
    const otherFields = sectionContent.filter(c => 
      c.contentKey !== 'heading' && 
      c.contentKey !== 'Heading' && 
      c.contentKey !== 'intro' && 
      c.contentKey !== 'Intro' &&
      c.contentKey !== 'content' &&
      c.contentKey !== 'Content' &&
      c.contentValue
    );
    
    // Sort fields - items first (Item1, Item2, etc.), then others
    otherFields.sort((a, b) => {
      const aIsItem = /^item\d+$/i.test(a.contentKey);
      const bIsItem = /^item\d+$/i.test(b.contentKey);
      if (aIsItem && bIsItem) {
        const aNum = parseInt(a.contentKey.replace(/\D/g, '')) || 0;
        const bNum = parseInt(b.contentKey.replace(/\D/g, '')) || 0;
        return aNum - bNum;
      }
      if (aIsItem) return 1;
      if (bIsItem) return 1;
      return a.contentKey.localeCompare(b.contentKey);
    });
    
    for (const field of otherFields) {
      // Format based on field type
      if (/^item\d+$/i.test(field.contentKey)) {
        bodyParts.push(`• ${field.contentValue}`);
      } else if (field.contentKey.toLowerCase() === 'email') {
        bodyParts.push(`Email: ${field.contentValue}`);
      } else if (field.contentKey.toLowerCase() === 'companyname') {
        bodyParts.push(`Company: ${field.contentValue}`);
      } else if (field.contentKey.toLowerCase() === 'location') {
        bodyParts.push(`Location: ${field.contentValue}`);
      } else if (field.contentKey.toLowerCase() === 'response') {
        bodyParts.push(field.contentValue);
      } else {
        // For other fields like keyboard, screenReader, etc., format as labeled item
        const label = field.contentKey.replace(/([A-Z])/g, ' $1').trim();
        const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        bodyParts.push(`**${capitalizedLabel}:** ${field.contentValue}`);
      }
    }
    
    if (heading || bodyParts.length > 0) {
      sections.push({
        id: sectionName,
        header: heading,
        body: bodyParts.join('\n\n'),
      });
    }
  }

  return sections;
}

export default function LegalPageRenderer({ pageKey, defaultTitle, defaultContent }: LegalPageRendererProps) {
  const [location] = useLocation();
  const { getContent, getSection, content, isLoading } = usePageContent(pageKey);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get page title from hero section
  const title = getContent('hero', 'title', defaultTitle);
  const lastUpdated = getContent('hero', 'lastUpdated', '');

  // Build sections dynamically from all content items in database
  const sections: LegalSection[] = useMemo(() => {
    // First try the new legalSections format
    const sectionsJson = getContent('legalSections', 'sections', '');
    if (sectionsJson && sectionsJson !== '[]') {
      try {
        const parsed = JSON.parse(sectionsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse legal sections JSON:', e);
      }
    }

    // Dynamically build sections from whatever content exists in the database
    if (!content || content.length === 0) return [];
    
    return buildSectionsFromContent(content);
  }, [pageKey, getContent, content]);

  // Generate and download PDF directly
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (height: number) => {
        if (yPosition + height > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper function to wrap text
      const addWrappedText = (text: string, fontSize: number, fontStyle: string = 'normal', lineHeight: number = 1.4) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const lines = doc.splitTextToSize(text, contentWidth);
        const textHeight = (fontSize * 0.352778) * lineHeight; // Convert pt to mm
        
        for (const line of lines) {
          checkPageBreak(textHeight);
          doc.text(line, margin, yPosition);
          yPosition += textHeight;
        }
        return lines.length * textHeight;
      };

      // Company header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      const companyName = 'JUST EMPOWER';
      const companyWidth = doc.getTextWidth(companyName);
      doc.text(companyName, (pageWidth - companyWidth) / 2, yPosition);
      yPosition += 10;

      // Document title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(30, 30, 30);
      const titleWidth = doc.getTextWidth(title);
      if (titleWidth > contentWidth) {
        const titleLines = doc.splitTextToSize(title, contentWidth);
        for (const line of titleLines) {
          const lineWidth = doc.getTextWidth(line);
          doc.text(line, (pageWidth - lineWidth) / 2, yPosition);
          yPosition += 10;
        }
      } else {
        doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
        yPosition += 10;
      }

      // Last updated
      if (lastUpdated) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const updatedText = `Last updated: ${lastUpdated}`;
        const updatedWidth = doc.getTextWidth(updatedText);
        doc.text(updatedText, (pageWidth - updatedWidth) / 2, yPosition);
        yPosition += 8;
      }

      // Divider line
      yPosition += 5;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Sections
      doc.setTextColor(30, 30, 30);
      for (const section of sections) {
        // Section header
        checkPageBreak(15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'italic');
        doc.text(section.header, margin, yPosition);
        yPosition += 8;

        // Section body - split by paragraphs
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const paragraphs = section.body.split('\n\n').filter(p => p.trim());
        
        for (const para of paragraphs) {
          const lines = doc.splitTextToSize(para.trim(), contentWidth);
          for (const line of lines) {
            checkPageBreak(5);
            doc.text(line, margin, yPosition);
            yPosition += 5;
          }
          yPosition += 3; // Paragraph spacing
        }

        // Section footer
        if (section.footer) {
          checkPageBreak(8);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          doc.text(section.footer, margin, yPosition);
          doc.setTextColor(30, 30, 30);
          yPosition += 6;
        }

        yPosition += 10; // Section spacing
      }

      // Footer on last page
      const footerY = pageHeight - 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const year = new Date().getFullYear();
      const footerText1 = `© ${year} Just Empower. All rights reserved.`;
      const footerText2 = 'www.justxempower.com';
      
      const footer1Width = doc.getTextWidth(footerText1);
      const footer2Width = doc.getTextWidth(footerText2);
      
      doc.text(footerText1, (pageWidth - footer1Width) / 2, footerY);
      doc.text(footerText2, (pageWidth - footer2Width) / 2, footerY + 4);

      // Generate filename from title
      const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-just-empower.pdf`;
      
      // Download the PDF
      doc.save(filename);

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

  // Render body text with paragraph spacing and markdown-style bold
  const renderBody = (body: string) => {
    const paragraphs = body.split('\n\n').filter(p => p.trim());
    return paragraphs.map((para, index) => {
      // Handle markdown-style bold **text**
      const parts = para.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      
      return (
        <p key={index} className="mb-4 text-foreground/80 leading-relaxed">
          {rendered}
        </p>
      );
    });
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
            // Show blank state when no sections have been added yet
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No content has been added to this page yet.</p>
              <p className="text-sm mt-2">Please check back later or contact the site administrator.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
