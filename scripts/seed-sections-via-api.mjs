/**
 * Seed script for pageSections via tRPC API
 */

// BASE_URL must be set via environment variable - no hardcoded URLs
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
if (!process.env.BASE_URL) {
  console.log('Warning: BASE_URL not set, using localhost:8080');
}

// Define sections for each page type
const pageSectionDefinitions = {
  'home': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: { navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact'] }, requiredFields: ['navItems', 'logo'] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Just Empower', subtitle: 'Catalyzing the Rise of Her', description: 'Where Empowerment Becomes Embodiment — cultivating self-trust, clarity, and conscious leadership.', ctaText: 'DISCOVER MORE', ctaLink: '/philosophy/vision-ethos' }, requiredFields: ['title', 'subtitle', 'description', 'ctaText', 'ctaLink', 'videoUrl'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Philosophy Section', content: { label: 'Our Approach', title: 'The Philosophy', description: 'Just Empower operates at the intersection of personal reclamation and collective influence.' }, requiredFields: ['title', 'description', 'ctaText', 'ctaLink'] },
    { sectionType: 'carousel', sectionOrder: 3, title: 'Offerings Carousel', content: { offerings: ['The Living Codex™', 'MOM VI•X Journal Trilogy', 'BloomXFlight', 'She Writes Blog', 'Workshops & Programs'] }, requiredFields: ['offerings'] },
    { sectionType: 'community', sectionOrder: 4, title: 'Community Section', content: { label: 'Community', title: 'Emerge With Us', description: 'We are planting seeds for a new paradigm.' }, requiredFields: ['title', 'description', 'ctaText', 'ctaLink'] },
    { sectionType: 'content', sectionOrder: 5, title: 'Rooted Unity Section', content: { label: 'Coming 2026', title: 'Rooted Unity', description: 'Ecological stewardship meets personal healing.' }, requiredFields: ['title', 'description', 'ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 6, title: 'Footer', content: { copyright: '© 2025 Just Empower. All rights reserved.' }, requiredFields: ['copyright', 'socialLinks', 'quickLinks'] },
  ],
  'philosophy': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Philosophy', subtitle: 'Our Guiding Principles' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Introduction', content: { headline: 'The Foundation' }, requiredFields: ['headline', 'body'] },
    { sectionType: 'grid', sectionOrder: 3, title: 'Core Pillars', content: { pillars: ['Self-Trust', 'Discernment', 'Embodied Integrity', 'Conscious Leadership'] }, requiredFields: ['pillars'] },
    { sectionType: 'cta', sectionOrder: 4, title: 'Call to Action', content: { ctaText: 'Explore Our Offerings', ctaLink: '/offerings' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'offerings': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Our Offerings', subtitle: 'Transformational Programs & Resources' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Introduction', content: { headline: 'Explore Our Programs' }, requiredFields: ['headline', 'description'] },
    { sectionType: 'grid', sectionOrder: 3, title: 'Offerings Grid', content: { offerings: [] }, requiredFields: ['offerings'] },
    { sectionType: 'cta', sectionOrder: 4, title: 'Get Started CTA', content: { ctaText: 'Begin Your Journey', ctaLink: '/walk-with-us' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'contact': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Contact Us', subtitle: "We'd Love to Hear From You" }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Contact Info', content: { email: 'hello@justxempower.com' }, requiredFields: ['email', 'phone', 'address', 'hours'] },
    { sectionType: 'form', sectionOrder: 3, title: 'Contact Form', content: { formFields: ['name', 'email', 'message'], submitText: 'Send Message' }, requiredFields: ['formFields', 'submitText'] },
    { sectionType: 'map', sectionOrder: 4, title: 'Location Map', content: {}, requiredFields: ['mapEmbed', 'address'] },
    { sectionType: 'social', sectionOrder: 5, title: 'Social Links', content: { instagram: '', linkedin: '' }, requiredFields: ['instagram', 'linkedin'] },
    { sectionType: 'footer', sectionOrder: 6, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'shop': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Banner', content: { title: 'Shop', subtitle: 'Curated Products for Your Journey' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'grid', sectionOrder: 2, title: 'Product Categories', content: { categories: [] }, requiredFields: ['categories'] },
    { sectionType: 'products', sectionOrder: 3, title: 'Products Grid', content: { products: [] }, requiredFields: ['products'] },
    { sectionType: 'carousel', sectionOrder: 4, title: 'Featured Products', content: {}, requiredFields: ['featuredProducts'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'walk-with-us': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Walk With Us', subtitle: 'Join Our Community' }, requiredFields: ['title', 'subtitle', 'backgroundImage', 'videoUrl'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Introduction', content: { headline: 'Begin Your Journey' }, requiredFields: ['headline', 'description'] },
    { sectionType: 'pricing', sectionOrder: 3, title: 'Membership Options', content: {}, requiredFields: ['tiers'] },
    { sectionType: 'video', sectionOrder: 4, title: 'Video Section', content: {}, requiredFields: ['videoUrl', 'videoTitle'] },
    { sectionType: 'testimonials', sectionOrder: 5, title: 'Member Testimonials', content: {}, requiredFields: ['testimonials'] },
    { sectionType: 'faq', sectionOrder: 6, title: 'FAQ Section', content: {}, requiredFields: ['faqs'] },
    { sectionType: 'cta', sectionOrder: 7, title: 'Join CTA', content: { ctaText: 'Join Now', ctaLink: '/contact' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 8, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'community-events': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Community Events', subtitle: 'Gather. Connect. Transform.' }, requiredFields: ['title', 'subtitle'] },
    { sectionType: 'calendar', sectionOrder: 2, title: 'Upcoming Events', content: { events: [] }, requiredFields: ['events'] },
    { sectionType: 'gallery', sectionOrder: 3, title: 'Past Events Gallery', content: {}, requiredFields: ['gallery'] },
    { sectionType: 'cta', sectionOrder: 4, title: 'Host an Event CTA', content: { ctaText: 'Host an Event', ctaLink: '/contact' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'resources': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Resources', subtitle: 'Tools for Your Journey' }, requiredFields: ['title', 'subtitle'] },
    { sectionType: 'grid', sectionOrder: 2, title: 'Resource Categories', content: { categories: [] }, requiredFields: ['categories'] },
    { sectionType: 'grid', sectionOrder: 3, title: 'Resources List', content: { resources: [] }, requiredFields: ['resources'] },
    { sectionType: 'cta', sectionOrder: 4, title: 'Submit Resource CTA', content: {}, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
};

// Default sections for pages without specific definitions
const defaultSections = [
  { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
  { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: {}, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
  { sectionType: 'content', sectionOrder: 2, title: 'Main Content', content: {}, requiredFields: ['body'] },
  { sectionType: 'cta', sectionOrder: 3, title: 'Call to Action', content: {}, requiredFields: ['ctaText', 'ctaLink'] },
  { sectionType: 'footer', sectionOrder: 4, title: 'Footer', content: {}, requiredFields: [] },
];

async function getPages() {
  const response = await fetch(`${BASE_URL}/api/trpc/pages.getNavPages?input=${encodeURIComponent(JSON.stringify({ json: {} }))}`);
  const data = await response.json();
  return data.result?.data?.json || [];
}

async function seedSectionsForPage(pageId, slug) {
  const sections = pageSectionDefinitions[slug] || defaultSections;
  
  // Use create endpoint for each section since bulkCreate requires admin auth
  for (const section of sections) {
    try {
      const response = await fetch(`${BASE_URL}/api/trpc/pageSections.create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            pageId,
            sectionType: section.sectionType,
            sectionOrder: section.sectionOrder,
            title: section.title,
            content: section.content,
            requiredFields: section.requiredFields,
            isVisible: 1,
          }
        }),
      });
      
      const result = await response.json();
      if (result.error) {
        console.log(`  Warning for ${section.title}: ${result.error.json?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`  Error creating section ${section.title}: ${error.message}`);
    }
  }
  
  return sections.length;
}

async function main() {
  console.log('Fetching pages...');
  const pages = await getPages();
  console.log(`Found ${pages.length} pages`);
  
  let totalSections = 0;
  for (const page of pages) {
    console.log(`Seeding sections for: ${page.title} (${page.slug})`);
    const count = await seedSectionsForPage(page.id, page.slug);
    totalSections += count;
    console.log(`  Created ${count} sections`);
  }
  
  console.log(`\nDone! Total sections created: ${totalSections}`);
}

main().catch(console.error);
