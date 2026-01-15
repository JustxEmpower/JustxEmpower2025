import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout,
  FileText,
  Users,
  Phone,
  Newspaper,
  Image,
  DollarSign,
  HelpCircle,
  Clock,
  Briefcase,
  X,
  Download,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageBlock } from './usePageBuilderStore';

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'landing' | 'content' | 'business' | 'special';
  icon: React.ComponentType<{ className?: string }>;
  preview?: string;
  blocks: Omit<PageBlock, 'id' | 'order'>[];
  tags: string[];
}

// Helper to generate unique IDs
const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// PRE-BUILT TEMPLATES
// ============================================================================

export const PAGE_TEMPLATES: PageTemplate[] = [
  // 1. Landing Page Template
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'A stunning landing page with hero, features, testimonials, and CTA sections.',
    category: 'landing',
    icon: Layout,
    tags: ['hero', 'features', 'testimonials', 'cta'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'Transform Your Vision Into Reality',
          subtitle: 'Discover the power of purposeful design and meaningful connections.',
          buttonText: 'Get Started',
          buttonLink: '/contact',
          backgroundImage: '',
          variant: 'centered',
          overlay: true,
          overlayOpacity: 0.5,
        },
      },
      {
        type: 'je-pillars',
        content: {
          label: 'Our Approach',
          title: 'Three Pillars of Excellence',
          description: 'Built on a foundation of integrity, innovation, and impact.',
          pillar1Icon: 'heart',
          pillar1Title: 'Purpose',
          pillar1Description: 'Every action aligned with your core mission and values.',
          pillar2Icon: 'sparkles',
          pillar2Title: 'Innovation',
          pillar2Description: 'Creative solutions that push boundaries and inspire change.',
          pillar3Icon: 'users',
          pillar3Title: 'Community',
          pillar3Description: 'Building connections that strengthen and uplift.',
        },
      },
      {
        type: 'je-testimonial',
        content: {
          quote: 'This experience has been truly transformative. The attention to detail and genuine care made all the difference.',
          author: 'Sarah Johnson',
          role: 'Community Leader',
          image: '',
        },
      },
      {
        type: 'je-newsletter',
        content: {
          title: 'Stay Connected',
          description: 'Join our community and receive updates on our latest initiatives.',
          buttonText: 'Subscribe',
          placeholder: 'Enter your email',
        },
      },
    ],
  },

  // 2. About Page Template
  {
    id: 'about-page',
    name: 'About Page',
    description: 'Tell your story with a compelling about page featuring mission, team, and values.',
    category: 'content',
    icon: FileText,
    tags: ['story', 'mission', 'team', 'values'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'Our Story',
          subtitle: 'A journey of purpose, passion, and positive impact.',
          variant: 'minimal',
          overlay: false,
        },
      },
      {
        type: 'je-section-standard',
        content: {
          title: 'Our Mission',
          content: 'We believe in the power of community and the importance of creating meaningful connections. Our mission is to empower individuals and organizations to reach their full potential through purposeful design and authentic engagement.',
          alignment: 'center',
        },
      },
      {
        type: 'je-pillars',
        content: {
          label: 'Core Values',
          title: 'What We Stand For',
          description: 'The principles that guide everything we do.',
          pillar1Icon: 'shield',
          pillar1Title: 'Integrity',
          pillar1Description: 'Honesty and transparency in all our interactions.',
          pillar2Icon: 'heart',
          pillar2Title: 'Compassion',
          pillar2Description: 'Leading with empathy and understanding.',
          pillar3Icon: 'zap',
          pillar3Title: 'Excellence',
          pillar3Description: 'Striving for the highest quality in everything we create.',
        },
      },
      {
        type: 'je-team-member',
        content: {
          name: 'Team Member Name',
          role: 'Founder & CEO',
          bio: 'A visionary leader dedicated to making a positive impact in the world.',
          image: '',
        },
      },
    ],
  },

  // 3. Services Page Template
  {
    id: 'services-page',
    name: 'Services Page',
    description: 'Showcase your services with detailed descriptions and clear calls to action.',
    category: 'business',
    icon: Briefcase,
    tags: ['services', 'offerings', 'pricing', 'cta'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'Our Services',
          subtitle: 'Comprehensive solutions tailored to your unique needs.',
          variant: 'centered',
        },
      },
      {
        type: 'je-offerings-grid',
        content: {
          title: 'What We Offer',
          subtitle: 'Explore our range of services designed to help you succeed.',
          offerings: [
            { title: 'Consulting', description: 'Strategic guidance for your journey', icon: 'lightbulb' },
            { title: 'Design', description: 'Beautiful, purposeful creations', icon: 'palette' },
            { title: 'Development', description: 'Robust, scalable solutions', icon: 'code' },
            { title: 'Support', description: 'Ongoing partnership and care', icon: 'heart' },
          ],
        },
      },
      {
        type: 'je-feature-card',
        content: {
          title: 'Premium Package',
          description: 'Our comprehensive solution includes everything you need to succeed, from initial consultation to ongoing support.',
          features: ['Full consultation', 'Custom design', 'Implementation', '24/7 support'],
          buttonText: 'Learn More',
          buttonLink: '/contact',
        },
      },
      {
        type: 'je-button',
        content: {
          text: 'Schedule a Consultation',
          link: '/contact',
          variant: 'primary',
          size: 'large',
          alignment: 'center',
        },
      },
    ],
  },

  // 4. Contact Page Template
  {
    id: 'contact-page',
    name: 'Contact Page',
    description: 'A professional contact page with form, location info, and social links.',
    category: 'business',
    icon: Phone,
    tags: ['contact', 'form', 'location', 'social'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'Get In Touch',
          subtitle: 'We would love to hear from you. Reach out and let us start a conversation.',
          variant: 'minimal',
        },
      },
      {
        type: 'je-contact-form',
        content: {
          title: 'Send Us a Message',
          description: 'Fill out the form below and we will get back to you within 24 hours.',
          fields: ['name', 'email', 'subject', 'message'],
          buttonText: 'Send Message',
        },
      },
      {
        type: 'je-two-column',
        content: {
          leftTitle: 'Visit Us',
          leftContent: '123 Main Street\nSuite 100\nCity, State 12345',
          rightTitle: 'Contact Info',
          rightContent: 'Email: hello@example.com\nPhone: (555) 123-4567',
        },
      },
    ],
  },

  // 5. Blog/Articles Page Template
  {
    id: 'blog-page',
    name: 'Blog Page',
    description: 'A clean blog layout with featured post, article grid, and newsletter signup.',
    category: 'content',
    icon: Newspaper,
    tags: ['blog', 'articles', 'news', 'newsletter'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'Our Journal',
          subtitle: 'Insights, stories, and updates from our community.',
          variant: 'minimal',
        },
      },
      {
        type: 'je-section-standard',
        content: {
          title: 'Featured Article',
          content: 'Discover our latest insights and stories. Our journal is a space for reflection, learning, and growth.',
          alignment: 'left',
        },
      },
      {
        type: 'je-divider',
        content: {
          style: 'line',
          spacing: 'medium',
        },
      },
      {
        type: 'je-newsletter',
        content: {
          title: 'Never Miss an Update',
          description: 'Subscribe to receive our latest articles and insights directly in your inbox.',
          buttonText: 'Subscribe',
        },
      },
    ],
  },

  // 6. Portfolio/Gallery Template
  {
    id: 'portfolio-page',
    name: 'Portfolio',
    description: 'Showcase your work with a beautiful gallery layout and project details.',
    category: 'content',
    icon: Image,
    tags: ['portfolio', 'gallery', 'projects', 'work'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'Our Work',
          subtitle: 'A collection of projects that showcase our passion and expertise.',
          variant: 'centered',
        },
      },
      {
        type: 'je-gallery',
        content: {
          title: 'Featured Projects',
          images: [],
          columns: 3,
          gap: 'medium',
        },
      },
      {
        type: 'je-testimonial',
        content: {
          quote: 'Working with this team was an incredible experience. They brought our vision to life with creativity and precision.',
          author: 'Client Name',
          role: 'Project Partner',
        },
      },
      {
        type: 'je-button',
        content: {
          text: 'Start Your Project',
          link: '/contact',
          variant: 'primary',
          size: 'large',
          alignment: 'center',
        },
      },
    ],
  },

  // 7. Team Page Template
  {
    id: 'team-page',
    name: 'Team Page',
    description: 'Introduce your team with photos, bios, and roles.',
    category: 'content',
    icon: Users,
    tags: ['team', 'people', 'staff', 'about'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'Meet Our Team',
          subtitle: 'The passionate individuals behind our mission.',
          variant: 'minimal',
        },
      },
      {
        type: 'je-section-standard',
        content: {
          title: 'Our People',
          content: 'We are a diverse team of dreamers, doers, and change-makers united by a common purpose.',
          alignment: 'center',
        },
      },
      {
        type: 'je-team-member',
        content: {
          name: 'Jane Doe',
          role: 'Founder & CEO',
          bio: 'A visionary leader with over 20 years of experience in transformative leadership.',
          image: '',
        },
      },
      {
        type: 'je-team-member',
        content: {
          name: 'John Smith',
          role: 'Creative Director',
          bio: 'An award-winning designer passionate about creating meaningful experiences.',
          image: '',
        },
      },
      {
        type: 'je-team-member',
        content: {
          name: 'Emily Chen',
          role: 'Community Manager',
          bio: 'Building bridges and fostering connections within our growing community.',
          image: '',
        },
      },
    ],
  },

  // 8. Pricing Page Template
  {
    id: 'pricing-page',
    name: 'Pricing Page',
    description: 'Display your pricing tiers with features and clear CTAs.',
    category: 'business',
    icon: DollarSign,
    tags: ['pricing', 'plans', 'tiers', 'features'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'Simple, Transparent Pricing',
          subtitle: 'Choose the plan that works best for you.',
          variant: 'minimal',
        },
      },
      {
        type: 'je-pillars',
        content: {
          label: 'Plans',
          title: 'Choose Your Path',
          description: 'Flexible options to meet your needs.',
          pillar1Icon: 'star',
          pillar1Title: 'Starter',
          pillar1Description: 'Perfect for individuals just getting started. $29/month',
          pillar2Icon: 'crown',
          pillar2Title: 'Professional',
          pillar2Description: 'For growing teams and businesses. $79/month',
          pillar3Icon: 'gem',
          pillar3Title: 'Enterprise',
          pillar3Description: 'Custom solutions for large organizations. Contact us',
        },
      },
      {
        type: 'je-faq',
        content: {
          title: 'Frequently Asked Questions',
          items: [
            { question: 'Can I change plans later?', answer: 'Yes, you can upgrade or downgrade at any time.' },
            { question: 'Is there a free trial?', answer: 'We offer a 14-day free trial on all plans.' },
            { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards and PayPal.' },
          ],
        },
      },
    ],
  },

  // 9. FAQ Page Template
  {
    id: 'faq-page',
    name: 'FAQ Page',
    description: 'Answer common questions with an organized FAQ layout.',
    category: 'content',
    icon: HelpCircle,
    tags: ['faq', 'questions', 'help', 'support'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'Frequently Asked Questions',
          subtitle: 'Find answers to common questions about our services.',
          variant: 'minimal',
        },
      },
      {
        type: 'je-faq',
        content: {
          title: 'General Questions',
          items: [
            { question: 'What services do you offer?', answer: 'We offer a comprehensive range of services including consulting, design, development, and ongoing support.' },
            { question: 'How do I get started?', answer: 'Simply reach out through our contact form or schedule a free consultation call.' },
            { question: 'What is your typical timeline?', answer: 'Project timelines vary based on scope, but most projects are completed within 4-8 weeks.' },
            { question: 'Do you offer refunds?', answer: 'We offer a satisfaction guarantee. If you are not happy, we will work with you to make it right.' },
          ],
        },
      },
      {
        type: 'je-section-standard',
        content: {
          title: 'Still Have Questions?',
          content: 'Our team is here to help. Reach out and we will get back to you within 24 hours.',
          alignment: 'center',
        },
      },
      {
        type: 'je-button',
        content: {
          text: 'Contact Support',
          link: '/contact',
          variant: 'primary',
          alignment: 'center',
        },
      },
    ],
  },

  // 10. Coming Soon Template
  {
    id: 'coming-soon-page',
    name: 'Coming Soon',
    description: 'A beautiful coming soon page with countdown and newsletter signup.',
    category: 'special',
    icon: Clock,
    tags: ['coming soon', 'launch', 'countdown', 'newsletter'],
    blocks: [
      {
        type: 'je-coming-soon',
        content: {
          title: 'Something Amazing is Coming',
          subtitle: 'We are working on something special. Be the first to know when we launch.',
          launchDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          showCountdown: true,
        },
      },
      {
        type: 'je-newsletter',
        content: {
          title: 'Get Notified',
          description: 'Enter your email to be the first to know when we launch.',
          buttonText: 'Notify Me',
          placeholder: 'your@email.com',
        },
      },
    ],
  },
];

// ============================================================================
// TEMPLATE LIBRARY COMPONENT
// ============================================================================

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (blocks: PageBlock[]) => void;
}

export function TemplateLibrary({ isOpen, onClose, onSelectTemplate }: TemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PageTemplate | null>(null);

  const categories = [
    { id: null, label: 'All Templates', count: PAGE_TEMPLATES.length },
    { id: 'landing', label: 'Landing Pages', count: PAGE_TEMPLATES.filter(t => t.category === 'landing').length },
    { id: 'content', label: 'Content Pages', count: PAGE_TEMPLATES.filter(t => t.category === 'content').length },
    { id: 'business', label: 'Business Pages', count: PAGE_TEMPLATES.filter(t => t.category === 'business').length },
    { id: 'special', label: 'Special Pages', count: PAGE_TEMPLATES.filter(t => t.category === 'special').length },
  ];

  const filteredTemplates = selectedCategory
    ? PAGE_TEMPLATES.filter(t => t.category === selectedCategory)
    : PAGE_TEMPLATES;

  const handleSelectTemplate = (template: PageTemplate) => {
    // Convert template blocks to PageBlocks with IDs and order
    const blocks: PageBlock[] = template.blocks.map((block, index) => ({
      ...block,
      id: generateId(),
      order: index,
    }));
    onSelectTemplate(blocks);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Template Library
          </DialogTitle>
          <DialogDescription>
            Choose a professionally designed template to get started quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(85vh-120px)]">
          {/* Sidebar - Categories */}
          <div className="w-48 border-r bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id || 'all'}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between',
                    selectedCategory === cat.id
                      ? 'bg-primary text-white'
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  )}
                >
                  <span>{cat.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {cat.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Template Grid */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {filteredTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group border rounded-lg overflow-hidden hover:border-primary transition-colors"
                    >
                      {/* Template Preview */}
                      <div className="h-40 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center relative">
                        <Icon className="w-16 h-16 text-neutral-300 dark:text-neutral-600" />
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                        <p className="text-xs text-neutral-500 mb-2 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Template Preview Modal */}
        <AnimatePresence>
          {previewTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center p-8"
              onClick={() => setPreviewTemplate(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white dark:bg-neutral-900 rounded-lg max-w-2xl w-full max-h-full overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{previewTemplate.name}</h3>
                    <p className="text-sm text-neutral-500">{previewTemplate.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-6">
                  <h4 className="text-sm font-medium mb-4">Included Blocks ({previewTemplate.blocks.length})</h4>
                  <div className="space-y-2">
                    {previewTemplate.blocks.map((block, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md"
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {block.type.replace('je-', '').replace(/-/g, ' ')}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {(block.content as Record<string, unknown>).title as string || 'Content block'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSelectTemplate(previewTemplate)}>
                    <Download className="w-4 h-4 mr-2" />
                    Use This Template
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateLibrary;
