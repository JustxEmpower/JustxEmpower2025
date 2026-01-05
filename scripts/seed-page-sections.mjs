/**
 * Seed script for pageSections table
 * This script populates initial section data for all pages based on the CONTENT_AUDIT.md
 */

import mysql from 'mysql2/promise';

// Database connection
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'JustEmpower2024!',
  database: process.env.DB_NAME || 'justxempower',
});

console.log('Connected to database');

// Get all pages
const [pages] = await connection.execute('SELECT id, title, slug FROM pages WHERE published = 1');
console.log(`Found ${pages.length} published pages`);

// Define sections for each page type
const pageSectionDefinitions = {
  'home': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: { navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact'] }, requiredFields: ['navItems', 'logo'] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Just Empower', subtitle: 'Catalyzing the Rise of Her', description: 'Where Empowerment Becomes Embodiment — cultivating self-trust, clarity, and conscious leadership.', ctaText: 'DISCOVER MORE', ctaLink: '/philosophy/vision-ethos' }, requiredFields: ['title', 'subtitle', 'description', 'ctaText', 'ctaLink', 'videoUrl'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Philosophy Section', content: { label: 'Our Approach', title: 'The Philosophy', description: 'Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity—and radiates outward into the structures we shape, steward, and reimagine.', ctaText: 'Discover More', ctaLink: '/philosophy/vision-ethos' }, requiredFields: ['title', 'description', 'ctaText', 'ctaLink'] },
    { sectionType: 'carousel', sectionOrder: 3, title: 'Offerings Carousel', content: { offerings: ['The Living Codex™', 'MOM VI•X Journal Trilogy', 'BloomXFlight', 'She Writes Blog', 'Workshops & Programs'] }, requiredFields: ['offerings'] },
    { sectionType: 'community', sectionOrder: 4, title: 'Community Section', content: { label: 'Community', title: 'Emerge With Us', description: 'We are planting seeds for a new paradigm—one rooted in consciousness, compassion, and sacred reciprocity. This is an invitation for women ready to move beyond survival patterns and into grounded discernment, embodied presence, and conscious self-authority.', ctaText: 'Walk With Us', ctaLink: '/walk-with-us' }, requiredFields: ['title', 'description', 'ctaText', 'ctaLink'] },
    { sectionType: 'rooted-unity', sectionOrder: 5, title: 'Rooted Unity Section', content: { label: 'Coming 2026', title: 'Rooted Unity', description: 'Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self.', ctaText: 'Learn More', ctaLink: '/offerings/rooted-unity' }, requiredFields: ['title', 'description', 'ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 6, title: 'Footer', content: { copyright: '© 2025 Just Empower. All rights reserved.', socialLinks: ['Instagram', 'LinkedIn'], quickLinks: ['About', 'Philosophy', 'Offerings', 'Journal', 'Contact', 'Walk With Us'] }, requiredFields: ['copyright', 'socialLinks', 'quickLinks'] },
  ],
  'philosophy': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Philosophy', subtitle: 'Our Guiding Principles' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Introduction', content: { headline: 'The Foundation', body: 'Just Empower operates at the intersection of personal reclamation and collective influence.' }, requiredFields: ['headline', 'body'] },
    { sectionType: 'grid', sectionOrder: 3, title: 'Core Pillars', content: { pillars: ['Self-Trust', 'Discernment', 'Embodied Integrity', 'Conscious Leadership'] }, requiredFields: ['pillars'] },
    { sectionType: 'cta', sectionOrder: 4, title: 'Call to Action', content: { ctaText: 'Explore Our Offerings', ctaLink: '/offerings' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'founder': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'The Founder', subtitle: 'Meet the Visionary' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Biography', content: { name: 'Founder Name', title: 'Founder & CEO', bio: 'Biography content here...' }, requiredFields: ['name', 'title', 'bio', 'image'] },
    { sectionType: 'content', sectionOrder: 3, title: 'Journey', content: { timeline: [] }, requiredFields: ['timeline', 'milestones'] },
    { sectionType: 'quote', sectionOrder: 4, title: 'Personal Quote', content: {}, requiredFields: ['quote'] },
    { sectionType: 'social', sectionOrder: 5, title: 'Social Links', content: { instagram: '', linkedin: '' }, requiredFields: ['instagram', 'linkedin'] },
    { sectionType: 'footer', sectionOrder: 6, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'vision-ethos': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Vision & Ethos', subtitle: 'Our Guiding Light' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Vision Statement', content: { title: 'Our Vision', body: 'To catalyze the rise of conscious feminine leadership...' }, requiredFields: ['title', 'body'] },
    { sectionType: 'content', sectionOrder: 3, title: 'Ethos & Values', content: { values: ['Authenticity', 'Integrity', 'Compassion', 'Growth'] }, requiredFields: ['values'] },
    { sectionType: 'quote', sectionOrder: 4, title: 'Guiding Quote', content: {}, requiredFields: ['quote', 'attribution'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'offerings': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Our Offerings', subtitle: 'Transformational Programs & Resources' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Introduction', content: { headline: 'Explore Our Programs', description: 'Discover our range of offerings designed to support your journey.' }, requiredFields: ['headline', 'description'] },
    { sectionType: 'grid', sectionOrder: 3, title: 'Offerings Grid', content: { offerings: [] }, requiredFields: ['offerings'] },
    { sectionType: 'cta', sectionOrder: 4, title: 'Get Started CTA', content: { ctaText: 'Begin Your Journey', ctaLink: '/walk-with-us' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'workshops-programs': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Workshops & Programs', subtitle: 'Transformational Experiences' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'grid', sectionOrder: 2, title: 'Programs List', content: { programs: [] }, requiredFields: ['programs'] },
    { sectionType: 'testimonials', sectionOrder: 3, title: 'Testimonials', content: {}, requiredFields: ['testimonials'] },
    { sectionType: 'cta', sectionOrder: 4, title: 'Register CTA', content: { ctaText: 'Register Now', ctaLink: '/contact' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'vix-journal-trilogy': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'VI•X Journal Trilogy', subtitle: 'Three-Volume Healing Journey' }, requiredFields: ['title', 'subtitle'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Introduction', content: { headline: 'A Sacred Journey', description: 'Three-volume healing journey for maternal lineage work and intergenerational transformation.' }, requiredFields: ['headline', 'description'] },
    { sectionType: 'grid', sectionOrder: 3, title: 'Journal Volumes', content: { volumes: ['Volume 1', 'Volume 2', 'Volume 3'] }, requiredFields: ['volumes'] },
    { sectionType: 'cta', sectionOrder: 4, title: 'Purchase CTA', content: { ctaText: 'Get Your Copy', ctaLink: '/shop' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'blog': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'She Writes', subtitle: 'Lessons from the Living Codex' }, requiredFields: ['title', 'subtitle'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Featured Article', content: {}, requiredFields: ['article'] },
    { sectionType: 'articles', sectionOrder: 3, title: 'Articles Grid', content: { articles: [], categories: [] }, requiredFields: ['articles', 'categories'] },
    { sectionType: 'newsletter', sectionOrder: 4, title: 'Newsletter Signup', content: { title: 'Stay Connected', description: 'Subscribe to receive wisdom and insights.', ctaText: 'Subscribe' }, requiredFields: ['title', 'description', 'ctaText'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
  ],
  'rooted-unity': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Rooted Unity', subtitle: 'Coming 2026' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
    { sectionType: 'content', sectionOrder: 2, title: 'Introduction', content: { headline: 'Ecological Stewardship Meets Personal Healing', description: 'Recognizing that our internal landscape mirrors the external world...' }, requiredFields: ['headline', 'description'] },
    { sectionType: 'features', sectionOrder: 3, title: 'Program Features', content: {}, requiredFields: ['features'] },
    { sectionType: 'cta', sectionOrder: 4, title: 'Coming Soon CTA', content: { ctaText: 'Join the Waitlist', ctaLink: '/contact' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 5, title: 'Footer', content: {}, requiredFields: [] },
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
  'contact': [
    { sectionType: 'header', sectionOrder: 0, title: 'Header Navigation', content: {}, requiredFields: [] },
    { sectionType: 'hero', sectionOrder: 1, title: 'Hero Section', content: { title: 'Contact Us', subtitle: 'We\'d Love to Hear From You' }, requiredFields: ['title', 'subtitle', 'backgroundImage'] },
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
    { sectionType: 'content', sectionOrder: 2, title: 'Introduction', content: { headline: 'Begin Your Journey', description: 'Join a community of conscious women...' }, requiredFields: ['headline', 'description'] },
    { sectionType: 'pricing', sectionOrder: 3, title: 'Membership Options', content: {}, requiredFields: ['tiers'] },
    { sectionType: 'video', sectionOrder: 4, title: 'Video Section', content: {}, requiredFields: ['videoUrl', 'videoTitle'] },
    { sectionType: 'testimonials', sectionOrder: 5, title: 'Member Testimonials', content: {}, requiredFields: ['testimonials'] },
    { sectionType: 'faq', sectionOrder: 6, title: 'FAQ Section', content: {}, requiredFields: ['faqs'] },
    { sectionType: 'cta', sectionOrder: 7, title: 'Join CTA', content: { ctaText: 'Join Now', ctaLink: '/contact' }, requiredFields: ['ctaText', 'ctaLink'] },
    { sectionType: 'footer', sectionOrder: 8, title: 'Footer', content: {}, requiredFields: [] },
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

// Clear existing sections
console.log('Clearing existing sections...');
await connection.execute('DELETE FROM pageSections');

// Insert sections for each page
let totalInserted = 0;
for (const page of pages) {
  const slug = page.slug;
  const sections = pageSectionDefinitions[slug] || defaultSections;
  
  console.log(`Seeding sections for page: ${page.title} (${slug}) - ${sections.length} sections`);
  
  for (const section of sections) {
    await connection.execute(
      `INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        page.id,
        section.sectionType,
        section.sectionOrder,
        section.title,
        JSON.stringify(section.content),
        JSON.stringify(section.requiredFields),
      ]
    );
    totalInserted++;
  }
}

console.log(`\nSeeding complete! Inserted ${totalInserted} sections for ${pages.length} pages.`);

// Verify the data
const [count] = await connection.execute('SELECT COUNT(*) as count FROM pageSections');
console.log(`Total sections in database: ${count[0].count}`);

await connection.end();
console.log('Database connection closed');
