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
  Heart,
  Crown,
  Mountain,
  Flower2,
  Sun,
  Star,
  Calendar,
  GraduationCap,
  BookOpen,
  Compass,
  Gem,
  Flame,
  Target,
  Award,
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
  category: 'landing' | 'content' | 'business' | 'special' | 'retreat' | 'coaching' | 'community' | 'workshop';
  icon: React.ComponentType<{ className?: string }>;
  preview?: string;
  blocks: Omit<PageBlock, 'id' | 'order'>[];
  tags: string[];
  featured?: boolean;
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
          launchDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

  // ============================================================================
  // ✦ TURBO TEMPLATES - JE WOMEN'S EMPOWERMENT
  // ============================================================================

  // 11. Transformation Retreat
  {
    id: 'retreat-transformation',
    name: '✦ Transformation Retreat',
    description: 'Immersive retreat experience with video hero, pillars of transformation, testimonials, and booking.',
    category: 'retreat',
    icon: Mountain,
    tags: ['retreat', 'transformation', 'wellness', 'luxury'],
    featured: true,
    blocks: [
      {
        type: 'je-hero-video',
        content: {
          videoUrl: '',
          posterImage: '',
          title: 'Awaken Your Inner Power',
          subtitle: 'A Transformational Retreat Experience',
          description: 'Join us for an immersive journey of self-discovery, healing, and empowerment in a sacred space designed for your transformation.',
          ctaText: 'Reserve Your Spot',
          ctaLink: '#register',
          overlayOpacity: 50,
          textAlignment: 'center',
          minHeight: '90vh',
        },
      },
      {
        type: 'je-pillars',
        content: {
          label: 'The Journey',
          title: 'Three Pillars of Transformation',
          description: 'Experience a holistic approach to awakening your full potential.',
          pillar1Icon: 'heart',
          pillar1Title: 'Embodiment',
          pillar1Description: 'Reconnect with your body through movement, breathwork, and somatic practices.',
          pillar2Icon: 'compass',
          pillar2Title: 'Clarity',
          pillar2Description: 'Gain crystal clear vision for your path forward with guided introspection.',
          pillar3Icon: 'crown',
          pillar3Title: 'Empowerment',
          pillar3Description: 'Step into your sovereignty and claim your birthright of abundance.',
        },
      },
      {
        type: 'je-two-column',
        content: {
          imageUrl: '',
          imagePosition: 'left',
          title: 'What Awaits You',
          content: 'Nestled in nature, our retreat offers a sanctuary for deep inner work. Experience daily yoga, meditation, sound healing, and transformational workshops led by expert facilitators. Leave with clarity, community, and a renewed sense of purpose.',
          ctaText: 'View Full Itinerary',
          ctaLink: '#schedule',
        },
      },
      {
        type: 'je-testimonial',
        content: {
          quote: 'This retreat was the most profound experience of my life. I returned home a different woman—more confident, more clear, more me.',
          author: 'Sarah M.',
          role: 'Retreat Participant, 2024',
          image: '',
          style: 'featured',
        },
      },
      {
        type: 'je-offerings-grid',
        content: {
          title: 'Investment Options',
          subtitle: 'Choose the experience that calls to you.',
          offerings: [
            { title: 'Shared Room', description: 'Full retreat experience with shared accommodations', icon: 'users', price: '$2,997' },
            { title: 'Private Room', description: 'Full retreat with private sanctuary space', icon: 'crown', price: '$3,997' },
            { title: 'VIP Experience', description: 'Private room plus 1:1 sessions and extras', icon: 'gem', price: '$5,997' },
          ],
        },
      },
      {
        type: 'je-faq',
        content: {
          title: 'Questions & Answers',
          items: [
            { question: 'What is included in the retreat?', answer: 'All accommodations, meals, workshops, ceremonies, materials, and airport transfers are included.' },
            { question: 'Do I need prior experience?', answer: 'No prior experience is needed. This retreat welcomes women at all stages of their journey.' },
            { question: 'What should I bring?', answer: 'Comfortable clothing, journal, and an open heart. A detailed packing list will be sent upon registration.' },
          ],
        },
      },
      {
        type: 'je-newsletter',
        content: {
          title: 'Ready to Transform?',
          description: 'Spaces are limited. Join our waitlist to be notified when registration opens.',
          buttonText: 'Join Waitlist',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
        },
      },
    ],
  },

  // 12. 1:1 Coaching Program
  {
    id: 'coaching-1on1',
    name: '✦ 1:1 Coaching Program',
    description: 'Personal coaching program page with principles, process, testimonials, and application.',
    category: 'coaching',
    icon: Compass,
    tags: ['coaching', 'mentorship', '1:1', 'transformation'],
    featured: true,
    blocks: [
      {
        type: 'je-hero-image',
        content: {
          imageUrl: '',
          title: 'Your Personal Transformation Journey',
          subtitle: 'Private 1:1 Coaching',
          description: 'Deep, personalized guidance for women ready to claim their power and create extraordinary lives.',
          ctaText: 'Apply Now',
          ctaLink: '#apply',
          overlayOpacity: 40,
          textAlignment: 'center',
          minHeight: '80vh',
        },
      },
      {
        type: 'je-section-standard',
        content: {
          title: 'Is This For You?',
          content: 'This intimate coaching container is for the woman who knows she is meant for more. You have achieved success, yet something deeper calls. You are ready to shed what no longer serves and step fully into your power, purpose, and presence.',
          alignment: 'center',
        },
      },
      {
        type: 'je-principles',
        content: {
          title: 'The Coaching Journey',
          principles: [
            { number: '01', title: 'Discovery', description: 'We begin with a deep dive into your vision, blocks, and desires.' },
            { number: '02', title: 'Activation', description: 'Unlock dormant potential through proven transformational practices.' },
            { number: '03', title: 'Integration', description: 'Embody your new way of being with ongoing support and accountability.' },
            { number: '04', title: 'Expansion', description: 'Watch as your outer world transforms to match your inner shifts.' },
          ],
        },
      },
      {
        type: 'je-two-column',
        content: {
          imageUrl: '',
          imagePosition: 'right',
          title: 'What You Receive',
          content: '• Weekly 60-minute private coaching sessions\n• Unlimited voice/text support between calls\n• Personalized practices and rituals\n• Access to exclusive resources and teachings\n• Recordings of all sessions\n• Emergency support when life happens',
          ctaText: 'See Full Details',
          ctaLink: '#details',
        },
      },
      {
        type: 'je-testimonial',
        content: {
          quote: 'Working with her changed everything. I finally understand my worth and have the tools to create the life I always dreamed of.',
          author: 'Michelle K.',
          role: 'Executive Coach',
          image: '',
        },
      },
      {
        type: 'je-blockquote',
        content: {
          quote: 'You are not here to play small. You are here to rise.',
          author: '',
          role: '',
          style: 'decorative',
        },
      },
      {
        type: 'je-contact-form',
        content: {
          title: 'Apply for 1:1 Coaching',
          description: 'Tell me about yourself and what you are seeking. I personally review every application.',
          fields: ['name', 'email', 'message'],
          submitText: 'Submit Application',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
        },
      },
    ],
  },

  // 13. Group Coaching Circle
  {
    id: 'coaching-group',
    name: '✦ Sisterhood Circle',
    description: 'Group coaching program with community focus, curriculum, and enrollment.',
    category: 'coaching',
    icon: Heart,
    tags: ['group', 'sisterhood', 'community', 'coaching'],
    blocks: [
      {
        type: 'je-hero-image',
        content: {
          imageUrl: '',
          title: 'Rise Together',
          subtitle: 'The Sisterhood Circle',
          description: 'A sacred container for transformation in community. Because we rise higher when we rise together.',
          ctaText: 'Join the Circle',
          ctaLink: '#enroll',
          overlayOpacity: 45,
          textAlignment: 'center',
          minHeight: '80vh',
        },
      },
      {
        type: 'je-pillars',
        content: {
          label: 'The Experience',
          title: 'Three Pillars of Sisterhood',
          description: 'A transformational journey held in sacred community.',
          pillar1Icon: 'heart',
          pillar1Title: 'Connection',
          pillar1Description: 'Deep bonds with women who truly see and support you.',
          pillar2Icon: 'sparkles',
          pillar2Title: 'Growth',
          pillar2Description: 'Structured curriculum designed for lasting transformation.',
          pillar3Icon: 'users',
          pillar3Title: 'Accountability',
          pillar3Description: 'Loving support to help you follow through on your commitments.',
        },
      },
      {
        type: 'je-principles',
        content: {
          title: '12-Week Curriculum',
          principles: [
            { number: 'Weeks 1-3', title: 'Foundation', description: 'Establish your vision, values, and inner compass.' },
            { number: 'Weeks 4-6', title: 'Release', description: 'Clear blocks, patterns, and limiting beliefs.' },
            { number: 'Weeks 7-9', title: 'Activate', description: 'Embody your power and take aligned action.' },
            { number: 'Weeks 10-12', title: 'Integrate', description: 'Anchor your transformation for lasting change.' },
          ],
        },
      },
      {
        type: 'je-testimonial',
        content: {
          quote: 'The sisterhood I found here is unlike anything I have experienced. These women became my soul family.',
          author: 'Jennifer L.',
          role: 'Circle Member, Spring 2024',
          image: '',
        },
      },
      {
        type: 'je-newsletter',
        content: {
          title: 'Next Circle Begins Soon',
          description: 'Join the waitlist to be notified when enrollment opens.',
          buttonText: 'Join Waitlist',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
        },
      },
    ],
  },

  // 14. Workshop/Masterclass
  {
    id: 'workshop-masterclass',
    name: '✦ Workshop Masterclass',
    description: 'Single workshop or masterclass page with agenda, speaker, and registration.',
    category: 'workshop',
    icon: GraduationCap,
    tags: ['workshop', 'masterclass', 'training', 'learning'],
    blocks: [
      {
        type: 'je-hero-image',
        content: {
          imageUrl: '',
          title: 'Unlock Your Authentic Power',
          subtitle: 'A 3-Hour Live Masterclass',
          description: 'Learn the exact framework I use to help women step into their sovereignty and create lives of purpose and abundance.',
          ctaText: 'Register Now',
          ctaLink: '#register',
          overlayOpacity: 40,
          textAlignment: 'center',
          minHeight: '75vh',
        },
      },
      {
        type: 'je-section-standard',
        content: {
          title: 'What You Will Learn',
          content: 'In this immersive masterclass, you will discover the hidden blocks keeping you stuck, learn practical tools for immediate transformation, and leave with a clear action plan for your next chapter.',
          alignment: 'center',
        },
      },
      {
        type: 'je-principles',
        content: {
          title: 'Masterclass Agenda',
          principles: [
            { number: '1', title: 'The Power Framework', description: 'Understand the 4 pillars of authentic feminine power.' },
            { number: '2', title: 'Block Breakthrough', description: 'Identify and release your top 3 limiting patterns.' },
            { number: '3', title: 'Action Blueprint', description: 'Create your personalized 30-day transformation plan.' },
          ],
        },
      },
      {
        type: 'je-team-member',
        content: {
          name: 'Your Host',
          role: 'Transformation Guide & Founder',
          bio: 'With over 15 years guiding women through transformation, she brings wisdom, warmth, and practical tools to every teaching.',
          image: '',
        },
      },
      {
        type: 'je-button',
        content: {
          text: 'Claim Your Spot - $97',
          link: '#register',
          variant: 'primary',
          size: 'large',
          alignment: 'center',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
        },
      },
    ],
  },

  // 15. Community Hub
  {
    id: 'community-hub',
    name: '✦ Community Hub',
    description: 'Community membership page with benefits, events, and join options.',
    category: 'community',
    icon: Users,
    tags: ['community', 'membership', 'sisterhood', 'connection'],
    blocks: [
      {
        type: 'je-hero-image',
        content: {
          imageUrl: '',
          title: 'Welcome to the Sisterhood',
          subtitle: 'The Just Empower Community',
          description: 'A sacred digital village for women who are rising. Connect, learn, and grow with soul-aligned sisters from around the world.',
          ctaText: 'Join Us',
          ctaLink: '#join',
          overlayOpacity: 40,
          textAlignment: 'center',
          minHeight: '80vh',
        },
      },
      {
        type: 'je-pillars',
        content: {
          label: 'Membership Benefits',
          title: 'What Awaits Inside',
          description: 'Everything you need to thrive on your journey.',
          pillar1Icon: 'users',
          pillar1Title: 'Sister Circles',
          pillar1Description: 'Weekly virtual gatherings for connection and support.',
          pillar2Icon: 'book',
          pillar2Title: 'Resource Library',
          pillar2Description: 'Exclusive teachings, meditations, and practices.',
          pillar3Icon: 'calendar',
          pillar3Title: 'Live Events',
          pillar3Description: 'Monthly masterclasses and special guest teachings.',
        },
      },
      {
        type: 'je-testimonial',
        content: {
          quote: 'Finding this community changed my life. For the first time, I feel truly seen and supported.',
          author: 'Amanda R.',
          role: 'Community Member',
          image: '',
        },
      },
      {
        type: 'je-community-section',
        content: {
          title: 'Join Our Growing Sisterhood',
          description: '2,000+ women rising together',
          backgroundImage: '',
          ctaText: 'Become a Member',
          ctaLink: '#join',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
        },
      },
    ],
  },

  // 16. VIX Journal Product
  {
    id: 'product-journal',
    name: '✦ Journal Product Page',
    description: 'Product page for journals or physical products with features and purchase.',
    category: 'business',
    icon: BookOpen,
    tags: ['product', 'journal', 'shop', 'purchase'],
    blocks: [
      {
        type: 'je-hero-split',
        content: {
          imageUrl: '',
          imagePosition: 'right',
          title: 'The VIX Journal',
          subtitle: 'Your Daily Companion for Transformation',
          description: 'A beautifully designed guided journal to help you connect with your inner wisdom, track your growth, and manifest your dreams.',
          ctaText: 'Order Now',
          ctaLink: '#buy',
        },
      },
      {
        type: 'je-pillars',
        content: {
          label: 'Features',
          title: 'Inside the Journal',
          description: 'Thoughtfully designed for your journey.',
          pillar1Icon: 'pen',
          pillar1Title: 'Daily Prompts',
          pillar1Description: '365 carefully crafted questions for reflection.',
          pillar2Icon: 'moon',
          pillar2Title: 'Moon Rituals',
          pillar2Description: 'Lunar cycle tracking and ceremony guides.',
          pillar3Icon: 'heart',
          pillar3Title: 'Affirmations',
          pillar3Description: 'Empowering mantras for every season.',
        },
      },
      {
        type: 'je-gallery',
        content: {
          title: 'Beautiful Inside & Out',
          images: [],
          columns: 3,
          gap: 'medium',
        },
      },
      {
        type: 'je-testimonial',
        content: {
          quote: 'This journal has become my sacred morning ritual. The prompts are profound and the quality is exceptional.',
          author: 'Lisa M.',
          role: 'Verified Buyer',
          image: '',
        },
      },
      {
        type: 'je-button',
        content: {
          text: 'Add to Cart - $44',
          link: '/shop/vix-journal',
          variant: 'primary',
          size: 'large',
          alignment: 'center',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
        },
      },
    ],
  },

  // 17. Event Announcement
  {
    id: 'event-announcement',
    name: '✦ Event Announcement',
    description: 'Single event page with details, speakers, schedule, and tickets.',
    category: 'community',
    icon: Calendar,
    tags: ['event', 'gathering', 'conference', 'tickets'],
    featured: true,
    blocks: [
      {
        type: 'je-hero-video',
        content: {
          videoUrl: '',
          posterImage: '',
          title: 'The Rise Summit 2025',
          subtitle: 'March 15-17 • Sedona, Arizona',
          description: 'Three transformational days with world-class speakers, powerful workshops, and connections that last a lifetime.',
          ctaText: 'Get Tickets',
          ctaLink: '#tickets',
          overlayOpacity: 50,
          textAlignment: 'center',
          minHeight: '85vh',
        },
      },
      {
        type: 'je-section-standard',
        content: {
          title: 'The Experience',
          content: 'Join 300 extraordinary women for an immersive weekend of inspiration, education, and sisterhood. Leave with new tools, deep connections, and a renewed sense of purpose.',
          alignment: 'center',
        },
      },
      {
        type: 'je-offerings-grid',
        content: {
          title: 'Featured Speakers',
          subtitle: 'Learn from visionary leaders.',
          offerings: [
            { title: 'Keynote Speaker', description: 'The Art of Feminine Leadership', icon: 'mic' },
            { title: 'Workshop Leader', description: 'Somatic Healing Practices', icon: 'heart' },
            { title: 'Panel Host', description: 'Building Conscious Business', icon: 'briefcase' },
          ],
        },
      },
      {
        type: 'je-principles',
        content: {
          title: 'Event Schedule',
          principles: [
            { number: 'Day 1', title: 'Arrival & Opening Ceremony', description: 'Welcome reception, intention setting, and opening ritual.' },
            { number: 'Day 2', title: 'Deep Dive Sessions', description: 'Workshops, breakouts, and transformational practices.' },
            { number: 'Day 3', title: 'Integration & Celebration', description: 'Final teachings, integration, and closing celebration.' },
          ],
        },
      },
      {
        type: 'je-faq',
        content: {
          title: 'Event FAQ',
          items: [
            { question: 'What is included in my ticket?', answer: 'All sessions, meals, materials, and networking events are included.' },
            { question: 'Is accommodation included?', answer: 'Accommodation is booked separately. We have negotiated special rates at partner hotels.' },
            { question: 'Can I get a refund?', answer: 'Full refund available up to 30 days before the event. 50% refund up to 14 days before.' },
          ],
        },
      },
      {
        type: 'je-button',
        content: {
          text: 'Secure Your Ticket',
          link: '#tickets',
          variant: 'primary',
          size: 'large',
          alignment: 'center',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
        },
      },
    ],
  },

  // 18. Founder/About Story
  {
    id: 'founder-story',
    name: '✦ Founder Story',
    description: 'Personal story page with journey, philosophy, and connection.',
    category: 'content',
    icon: Flower2,
    tags: ['about', 'founder', 'story', 'mission'],
    blocks: [
      {
        type: 'je-hero-split',
        content: {
          imageUrl: '',
          imagePosition: 'left',
          title: 'Hello, I am April',
          subtitle: 'Founder of Just Empower',
          description: 'I believe every woman carries within her the seeds of extraordinary transformation. My mission is to help you water those seeds.',
          ctaText: 'My Story',
          ctaLink: '#story',
        },
      },
      {
        type: 'je-section-standard',
        content: {
          title: 'My Journey',
          content: 'Like many of you, I spent years dimming my light, playing small, and seeking validation outside myself. It was only through deep inner work, mentorship, and sacred community that I remembered who I truly was. Now I dedicate my life to helping other women do the same.',
          alignment: 'center',
        },
      },
      {
        type: 'je-blockquote',
        content: {
          quote: 'Your transformation begins the moment you decide you are worthy of it.',
          author: 'April Gambardella',
          role: 'Founder',
          style: 'large',
        },
      },
      {
        type: 'je-pillars',
        content: {
          label: 'My Philosophy',
          title: 'What I Believe',
          description: 'The principles that guide my work.',
          pillar1Icon: 'heart',
          pillar1Title: 'Embodiment',
          pillar1Description: 'True transformation happens in the body, not just the mind.',
          pillar2Icon: 'users',
          pillar2Title: 'Community',
          pillar2Description: 'We heal and grow faster together than alone.',
          pillar3Icon: 'sparkles',
          pillar3Title: 'Sovereignty',
          pillar3Description: 'You already have everything you need within you.',
        },
      },
      {
        type: 'je-newsletter',
        content: {
          title: 'Let us Stay Connected',
          description: 'Receive wisdom, inspiration, and updates directly in your inbox.',
          buttonText: 'Subscribe',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
        },
      },
    ],
  },

  // 19. Mini Course / Free Training
  {
    id: 'free-training',
    name: '✦ Free Training',
    description: 'Lead magnet page for free training, mini course, or opt-in.',
    category: 'landing',
    icon: Flame,
    tags: ['free', 'training', 'lead magnet', 'opt-in'],
    blocks: [
      {
        type: 'je-hero-image',
        content: {
          imageUrl: '',
          title: 'Free 5-Day Activation',
          subtitle: 'Reclaim Your Power',
          description: 'Join thousands of women who have transformed their lives with this powerful free training. Delivered straight to your inbox.',
          ctaText: 'Get Instant Access',
          ctaLink: '#signup',
          overlayOpacity: 45,
          textAlignment: 'center',
          minHeight: '80vh',
        },
      },
      {
        type: 'je-principles',
        content: {
          title: 'What You Will Learn',
          principles: [
            { number: 'Day 1', title: 'Awareness', description: 'Identify the patterns keeping you stuck.' },
            { number: 'Day 2', title: 'Release', description: 'Simple techniques to let go of what no longer serves.' },
            { number: 'Day 3', title: 'Vision', description: 'Get crystal clear on what you truly desire.' },
            { number: 'Day 4', title: 'Action', description: 'Create your aligned action plan.' },
            { number: 'Day 5', title: 'Integration', description: 'Anchor your transformation for lasting change.' },
          ],
        },
      },
      {
        type: 'je-testimonial',
        content: {
          quote: 'This free training gave me more clarity than years of therapy. I cannot believe it is free!',
          author: 'Rebecca T.',
          role: 'Training Participant',
          image: '',
        },
      },
      {
        type: 'je-newsletter',
        content: {
          title: 'Get Your Free Training',
          description: 'Enter your email and get instant access to Day 1.',
          buttonText: 'Send Me Day 1',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
        },
      },
    ],
  },

  // 20. Thank You / Confirmation
  {
    id: 'thank-you',
    name: '✦ Thank You Page',
    description: 'Post-purchase or signup confirmation page with next steps.',
    category: 'special',
    icon: Award,
    tags: ['thank you', 'confirmation', 'next steps', 'welcome'],
    blocks: [
      {
        type: 'je-hero',
        content: {
          title: 'You Are In! 🎉',
          subtitle: 'Welcome to the Sisterhood',
          variant: 'minimal',
          overlay: false,
        },
      },
      {
        type: 'je-section-standard',
        content: {
          title: 'What Happens Next',
          content: 'Check your inbox! You will receive a confirmation email with all the details and your next steps. Be sure to add us to your contacts so our emails land in your primary inbox.',
          alignment: 'center',
        },
      },
      {
        type: 'je-principles',
        content: {
          title: 'Your Next Steps',
          principles: [
            { number: '1', title: 'Check Your Email', description: 'Your welcome email is on its way with important details.' },
            { number: '2', title: 'Join the Community', description: 'Connect with fellow sisters in our private group.' },
            { number: '3', title: 'Mark Your Calendar', description: 'Add upcoming dates so you do not miss anything.' },
          ],
        },
      },
      {
        type: 'je-button',
        content: {
          text: 'Join Our Community',
          link: '/community',
          variant: 'primary',
          size: 'large',
          alignment: 'center',
        },
      },
      {
        type: 'je-footer',
        content: {
          tagline: 'Catalyzing the Rise of Her',
          copyright: '© Just Empower. All rights reserved.',
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
    { id: null, label: 'All Templates', count: PAGE_TEMPLATES.length, icon: Sparkles },
    { id: 'retreat', label: '✦ Retreats', count: PAGE_TEMPLATES.filter(t => t.category === 'retreat').length, icon: Mountain },
    { id: 'coaching', label: '✦ Coaching', count: PAGE_TEMPLATES.filter(t => t.category === 'coaching').length, icon: Compass },
    { id: 'workshop', label: '✦ Workshops', count: PAGE_TEMPLATES.filter(t => t.category === 'workshop').length, icon: GraduationCap },
    { id: 'community', label: '✦ Community', count: PAGE_TEMPLATES.filter(t => t.category === 'community').length, icon: Heart },
    { id: 'landing', label: 'Landing Pages', count: PAGE_TEMPLATES.filter(t => t.category === 'landing').length, icon: Layout },
    { id: 'content', label: 'Content Pages', count: PAGE_TEMPLATES.filter(t => t.category === 'content').length, icon: FileText },
    { id: 'business', label: 'Business Pages', count: PAGE_TEMPLATES.filter(t => t.category === 'business').length, icon: Briefcase },
    { id: 'special', label: 'Special Pages', count: PAGE_TEMPLATES.filter(t => t.category === 'special').length, icon: Star },
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
