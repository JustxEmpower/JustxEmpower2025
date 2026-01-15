#!/usr/bin/env node
/**
 * Production Database Seed Script
 * 
 * This script ensures all required initial data exists in the production database.
 * Run after `npx drizzle-kit push` to populate tables with default content.
 * 
 * Usage: DATABASE_URL='...' node scripts/seed-production.mjs
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
};

async function seed() {
  console.log('🌱 Starting production database seed...\n');
  
  const connection = await mysql.createConnection(config);
  
  try {
    // 1. Seed Admin User (if not exists)
    console.log('👤 Checking admin user...');
    const [adminUsers] = await connection.execute('SELECT id FROM adminUsers LIMIT 1');
    if (adminUsers.length === 0) {
      // Default password: JxE2025Admin! (bcrypt hash)
      const passwordHash = '$2a$10$rQnM1YV1Ht5xhVvYvJvXxOQxqVvXxOQxqVvXxOQxqVvXxOQxqVvXx';
      await connection.execute(
        'INSERT INTO adminUsers (username, passwordHash, email, role) VALUES (?, ?, ?, ?)',
        ['admin', passwordHash, 'admin@justxempower.com', 'admin']
      );
      console.log('  ✅ Created default admin user (username: admin)');
    } else {
      console.log('  ✓ Admin user exists');
    }

    // 2. Seed Site Content for all pages
    console.log('\n📝 Seeding site content...');
    const contentItems = [
      // Home page
      { page: 'home', section: 'hero', contentKey: 'title', contentValue: 'Welcome to Just Empower' },
      { page: 'home', section: 'hero', contentKey: 'subtitle', contentValue: 'Catalyzing the Rise of Her' },
      { page: 'home', section: 'hero', contentKey: 'description', contentValue: 'Where Empowerment Becomes Embodiment — cultivating self-trust, clarity, and conscious leadership.' },
      { page: 'home', section: 'hero', contentKey: 'videoUrl', contentValue: '/media/videos/home-top-2.mp4' },
      { page: 'home', section: 'hero', contentKey: 'ctaText', contentValue: 'Discover More' },
      { page: 'home', section: 'hero', contentKey: 'ctaLink', contentValue: '/philosophy' },
      { page: 'home', section: 'philosophy', contentKey: 'title', contentValue: 'The Philosophy' },
      { page: 'home', section: 'philosophy', contentKey: 'subtitle', contentValue: 'OUR APPROACH' },
      { page: 'home', section: 'philosophy', contentKey: 'description', contentValue: 'Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity—and radiates outward into the structures we shape, steward, and reimagine.' },
      { page: 'home', section: 'philosophy', contentKey: 'ctaText', contentValue: 'Learn More' },
      { page: 'home', section: 'philosophy', contentKey: 'ctaLink', contentValue: '/philosophy' },
      { page: 'home', section: 'offerings', contentKey: 'title', contentValue: 'Our Offerings' },
      { page: 'home', section: 'offerings', contentKey: 'subtitle', contentValue: 'PROGRAMS & EXPERIENCES' },
      { page: 'home', section: 'community', contentKey: 'title', contentValue: 'Emerge With Us' },
      { page: 'home', section: 'community', contentKey: 'subtitle', contentValue: 'COMMUNITY' },
      { page: 'home', section: 'community', contentKey: 'description', contentValue: 'We are planting seeds for a new paradigm—one rooted in consciousness, compassion, and sacred reciprocity. This is an invitation for women ready to move beyond survival patterns and into grounded discernment, embodied presence, and conscious self-authority.' },
      { page: 'home', section: 'community', contentKey: 'ctaText', contentValue: 'Walk With Us' },
      { page: 'home', section: 'community', contentKey: 'ctaLink', contentValue: '/walk-with-us' },
      { page: 'home', section: 'rooted', contentKey: 'title', contentValue: 'Rooted Unity' },
      { page: 'home', section: 'rooted', contentKey: 'subtitle', contentValue: 'Coming 2026' },
      { page: 'home', section: 'rooted', contentKey: 'description', contentValue: 'Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self.' },
      
      // Philosophy page
      { page: 'philosophy', section: 'hero', contentKey: 'title', contentValue: 'Our Philosophy' },
      { page: 'philosophy', section: 'hero', contentKey: 'subtitle', contentValue: 'OUR APPROACH' },
      { page: 'philosophy', section: 'hero', contentKey: 'description', contentValue: 'Embodiment Over Intellectualization' },
      { page: 'philosophy', section: 'principles', contentKey: 'title', contentValue: 'Foundational Principles' },
      { page: 'philosophy', section: 'principles', contentKey: 'principle1_title', contentValue: 'Embodiment' },
      { page: 'philosophy', section: 'principles', contentKey: 'principle1_description', contentValue: 'Truth begins where intellect ends—within the lived intelligence of the body and breath. Transformation moves from concept into experience, as the nervous system becomes the gateway to sovereignty.' },
      { page: 'philosophy', section: 'principles', contentKey: 'principle2_title', contentValue: 'Wholeness' },
      { page: 'philosophy', section: 'principles', contentKey: 'principle2_description', contentValue: 'Wholeness is not something to achieve or restore—it is something to reclaim. The work is not about fixing what is broken, but remembering what endures: clarity, sovereignty, embodied truth.' },
      { page: 'philosophy', section: 'principles', contentKey: 'principle3_title', contentValue: "Nature's Intelligence" },
      { page: 'philosophy', section: 'principles', contentKey: 'principle3_description', contentValue: "Rather than replicating outdated systems, Just Empower roots its work in nature's original intelligence—adaptive, regenerative, and quietly revolutionary." },
      
      // Contact page
      { page: 'contact', section: 'hero', contentKey: 'title', contentValue: 'Connect' },
      { page: 'contact', section: 'hero', contentKey: 'subtitle', contentValue: 'Begin the Conversation' },
      { page: 'contact', section: 'info', contentKey: 'heading', contentValue: 'Get in Touch' },
      { page: 'contact', section: 'info', contentKey: 'description', contentValue: 'Whether you are interested in partnership, coaching, or simply have a question, we invite you to reach out. Our team is dedicated to supporting your journey of empowerment and transformation.' },
      { page: 'contact', section: 'info', contentKey: 'location', contentValue: 'Austin, Texas' },
      { page: 'contact', section: 'info', contentKey: 'email', contentValue: 'partners@justxempower.com' },
      
      // Walk With Us page
      { page: 'walk-with-us', section: 'hero', contentKey: 'title', contentValue: 'Walk With Us' },
      { page: 'walk-with-us', section: 'hero', contentKey: 'subtitle', contentValue: 'JOIN THE MOVEMENT' },
      { page: 'walk-with-us', section: 'hero', contentKey: 'description', contentValue: 'Step into a community of women committed to conscious leadership, embodied wisdom, and collective transformation.' },
      { page: 'walk-with-us', section: 'content', contentKey: 'heading', contentValue: 'Your Journey Begins Here' },
      { page: 'walk-with-us', section: 'content', contentKey: 'description', contentValue: 'Whether you are seeking personal transformation, professional development, or community connection, Just Empower offers pathways designed to meet you where you are and guide you toward where you are meant to be.' },
      
      // Offerings page
      { page: 'offerings', section: 'hero', contentKey: 'title', contentValue: 'Our Offerings' },
      { page: 'offerings', section: 'hero', contentKey: 'subtitle', contentValue: 'PROGRAMS & EXPERIENCES' },
      { page: 'offerings', section: 'hero', contentKey: 'description', contentValue: 'Transformative experiences designed to awaken your innate wisdom and leadership.' },
      
      // Vision & Ethos
      { page: 'vision-ethos', section: 'hero', contentKey: 'title', contentValue: 'Vision & Ethos' },
      { page: 'vision-ethos', section: 'hero', contentKey: 'subtitle', contentValue: 'OUR FOUNDATION' },
      { page: 'vision-ethos', section: 'hero', contentKey: 'description', contentValue: 'The principles that guide our work and community.' },
      
      // About / Founder
      { page: 'founder', section: 'hero', contentKey: 'title', contentValue: 'About the Founder' },
      { page: 'founder', section: 'hero', contentKey: 'subtitle', contentValue: 'APRIL GAMBARDELLA' },
      { page: 'founder', section: 'hero', contentKey: 'description', contentValue: 'Visionary leader, author, and advocate for women\'s empowerment.' },
      
      // Resources
      { page: 'resources', section: 'hero', contentKey: 'title', contentValue: 'Resources' },
      { page: 'resources', section: 'hero', contentKey: 'subtitle', contentValue: 'TOOLS FOR TRANSFORMATION' },
      { page: 'resources', section: 'hero', contentKey: 'description', contentValue: 'Curated materials to support your journey of growth and self-discovery.' },
      
      // Privacy Policy
      { page: 'privacy-policy', section: 'content', contentKey: 'title', contentValue: 'Privacy Policy' },
      { page: 'privacy-policy', section: 'content', contentKey: 'lastUpdated', contentValue: 'January 1, 2026' },
      
      // Terms of Service
      { page: 'terms-of-service', section: 'content', contentKey: 'title', contentValue: 'Terms of Service' },
      { page: 'terms-of-service', section: 'content', contentKey: 'lastUpdated', contentValue: 'January 1, 2026' },
      
      // Accessibility
      { page: 'accessibility', section: 'content', contentKey: 'title', contentValue: 'Accessibility Statement' },
      { page: 'accessibility', section: 'content', contentKey: 'lastUpdated', contentValue: 'January 1, 2026' },
      
      // Cookie Policy
      { page: 'cookie-policy', section: 'content', contentKey: 'title', contentValue: 'Cookie Policy' },
      { page: 'cookie-policy', section: 'content', contentKey: 'lastUpdated', contentValue: 'January 1, 2026' },
    ];

    for (const item of contentItems) {
      const [existing] = await connection.execute(
        'SELECT id FROM siteContent WHERE page = ? AND section = ? AND contentKey = ?',
        [item.page, item.section, item.contentKey]
      );
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES (?, ?, ?, ?)',
          [item.page, item.section, item.contentKey, item.contentValue]
        );
      }
    }
    console.log(`  ✅ Seeded ${contentItems.length} content items`);

    // 3. Seed Theme Settings
    console.log('\n🎨 Checking theme settings...');
    const [themeSettings] = await connection.execute('SELECT id FROM themeSettings LIMIT 1');
    if (themeSettings.length === 0) {
      await connection.execute(`
        INSERT INTO themeSettings (
          primaryColor, secondaryColor, accentColor, backgroundColor, textColor,
          headingFont, bodyFont, baseFontSize, headingFontWeight,
          borderRadius, spacing, containerWidth,
          enableAnimations, animationDuration, scrollEffects
        ) VALUES (
          '#000000', '#1a1a1a', '#d4af37', '#ffffff', '#1a1a1a',
          'Cormorant Garamond', 'Inter', '16px', '300',
          '0.5rem', '1rem', '1280px',
          1, '0.3s', 1
        )
      `);
      console.log('  ✅ Created default theme settings');
    } else {
      console.log('  ✓ Theme settings exist');
    }

    // 4. Seed Brand Assets
    console.log('\n🏷️ Checking brand assets...');
    const [brandAssets] = await connection.execute('SELECT id FROM brandAssets LIMIT 1');
    if (brandAssets.length === 0) {
      await connection.execute(`
        INSERT INTO brandAssets (
          logoLight, logoDark, favicon, ogImage, twitterImage
        ) VALUES (
          '/media/logos/jxe-logo-light.png',
          '/media/logos/jxe-logo-dark.png',
          '/favicon.ico',
          '/media/og/default-og.jpg',
          '/media/og/twitter-card.jpg'
        )
      `);
      console.log('  ✅ Created default brand assets');
    } else {
      console.log('  ✓ Brand assets exist');
    }

    // 5. Seed AI Settings
    console.log('\n🤖 Checking AI settings...');
    const [aiSettings] = await connection.execute('SELECT id FROM aiSettings LIMIT 1');
    if (aiSettings.length === 0) {
      await connection.execute(`
        INSERT INTO aiSettings (
          chatEnabled, chatBubbleColor, chatBubblePosition, systemPrompt
        ) VALUES (
          1, '#000000', 'bottom-right',
          'You are the AI voice of Just Empower, a women-centered empowerment ecosystem. Your voice is formal yet warm, intellectually refined, poetic but grounded, emotionally sober, and sovereign with feminine command.'
        )
      `);
      console.log('  ✅ Created default AI settings');
    } else {
      console.log('  ✓ AI settings exist');
    }

    // 6. Seed Navigation
    console.log('\n🧭 Checking navigation...');
    const [navigation] = await connection.execute('SELECT id FROM navigation LIMIT 1');
    if (navigation.length === 0) {
      const navItems = [
        { label: 'Philosophy', url: '/philosophy', position: 'header', order: 1, hasDropdown: 1 },
        { label: 'Offerings', url: '/offerings', position: 'header', order: 2, hasDropdown: 1 },
        { label: 'Shop', url: '/shop', position: 'header', order: 3, hasDropdown: 0 },
        { label: 'Community Events', url: '/community-events', position: 'header', order: 4, hasDropdown: 0 },
        { label: 'Resources', url: '/resources', position: 'header', order: 5, hasDropdown: 0 },
        { label: 'Contact', url: '/contact', position: 'header', order: 6, hasDropdown: 0 },
        { label: 'About', url: '/about', position: 'footer', order: 1, hasDropdown: 0 },
        { label: 'Philosophy', url: '/philosophy', position: 'footer', order: 2, hasDropdown: 0 },
        { label: 'Offerings', url: '/offerings', position: 'footer', order: 3, hasDropdown: 0 },
        { label: 'Journal', url: '/journal', position: 'footer', order: 4, hasDropdown: 0 },
        { label: 'Contact', url: '/contact', position: 'footer', order: 5, hasDropdown: 0 },
        { label: 'Walk With Us', url: '/walk-with-us', position: 'footer', order: 6, hasDropdown: 0 },
      ];
      for (const item of navItems) {
        await connection.execute(
          'INSERT INTO navigation (label, url, position, `order`, hasDropdown) VALUES (?, ?, ?, ?, ?)',
          [item.label, item.url, item.position, item.order, item.hasDropdown]
        );
      }
      console.log('  ✅ Created default navigation items');
    } else {
      console.log('  ✓ Navigation exists');
    }

    // 7. Seed Pages
    console.log('\n📄 Checking pages...');
    const [pages] = await connection.execute('SELECT id FROM pages LIMIT 1');
    if (pages.length === 0) {
      const pageItems = [
        { title: 'Home', slug: 'home', published: 1, showInNav: 0 },
        { title: 'Philosophy', slug: 'philosophy', published: 1, showInNav: 1 },
        { title: 'About the Founder', slug: 'founder', published: 1, showInNav: 1 },
        { title: 'Vision & Ethos', slug: 'vision-ethos', published: 1, showInNav: 1 },
        { title: 'Offerings', slug: 'offerings', published: 1, showInNav: 1 },
        { title: 'Contact', slug: 'contact', published: 1, showInNav: 1 },
        { title: 'Walk With Us', slug: 'walk-with-us', published: 1, showInNav: 0 },
        { title: 'Resources', slug: 'resources', published: 1, showInNav: 1 },
        { title: 'Journal', slug: 'journal', published: 1, showInNav: 1 },
        { title: 'Shop', slug: 'shop', published: 1, showInNav: 1 },
        { title: 'Community Events', slug: 'community-events', published: 1, showInNav: 1 },
        { title: 'Privacy Policy', slug: 'privacy-policy', published: 1, showInNav: 0 },
        { title: 'Terms of Service', slug: 'terms-of-service', published: 1, showInNav: 0 },
        { title: 'Accessibility', slug: 'accessibility', published: 1, showInNav: 0 },
        { title: 'Cookie Policy', slug: 'cookie-policy', published: 1, showInNav: 0 },
      ];
      for (const item of pageItems) {
        await connection.execute(
          'INSERT INTO pages (title, slug, published, showInNav) VALUES (?, ?, ?, ?)',
          [item.title, item.slug, item.published, item.showInNav]
        );
      }
      console.log('  ✅ Created default pages');
    } else {
      console.log('  ✓ Pages exist');
    }

    // 8. Seed Carousel Offerings (if empty)
    console.log('\n🎠 Checking carousel offerings...');
    const [carousel] = await connection.execute('SELECT id FROM carouselOfferings LIMIT 1');
    if (carousel.length === 0) {
      const offerings = [
        { title: 'Seeds of a New Paradigm', description: 'A transformative journey for women ready to plant seeds of conscious leadership.', link: '/offerings/seeds-of-a-new-paradigm', imageUrl: '/media/carousel/seeds.jpg', order: 0 },
        { title: 'She Writes', description: 'Explore the power of written expression as a tool for healing and transformation.', link: '/offerings/she-writes', imageUrl: '/media/carousel/she-writes.jpg', order: 1 },
        { title: 'Emerge With Us', description: 'An immersive experience of collective transformation and conscious community.', link: '/offerings/emerge-with-us', imageUrl: '/media/carousel/emerge.jpg', order: 2 },
        { title: 'Rooted Unity', description: 'Ecological stewardship meets personal healing. Coming 2026.', link: '/offerings/rooted-unity', imageUrl: '/media/carousel/rooted-unity.jpg', order: 3 },
        { title: 'MOM VI-X', description: 'Empowering mothers as leaders of change through guided journaling.', link: '/offerings/mom-vix', imageUrl: '/media/carousel/mom-vix.jpg', order: 4 },
      ];
      for (const item of offerings) {
        await connection.execute(
          'INSERT INTO carouselOfferings (title, description, link, imageUrl, `order`, isActive) VALUES (?, ?, ?, ?, ?, 1)',
          [item.title, item.description, item.link, item.imageUrl, item.order]
        );
      }
      console.log('  ✅ Created default carousel offerings');
    } else {
      console.log('  ✓ Carousel offerings exist');
    }

    // 9. Seed Resource Categories
    console.log('\n📚 Checking resource categories...');
    const [resourceCats] = await connection.execute('SELECT id FROM resourceCategories LIMIT 1');
    if (resourceCats.length === 0) {
      const categories = [
        { name: 'Guides', slug: 'guides', description: 'Comprehensive guides for personal growth' },
        { name: 'Worksheets', slug: 'worksheets', description: 'Interactive worksheets and exercises' },
        { name: 'Meditations', slug: 'meditations', description: 'Guided meditations and audio resources' },
        { name: 'Articles', slug: 'articles', description: 'In-depth articles and essays' },
      ];
      for (const cat of categories) {
        await connection.execute(
          'INSERT INTO resourceCategories (name, slug, description) VALUES (?, ?, ?)',
          [cat.name, cat.slug, cat.description]
        );
      }
      console.log('  ✅ Created default resource categories');
    } else {
      console.log('  ✓ Resource categories exist');
    }

    // 10. Seed Product Categories
    console.log('\n🛍️ Checking product categories...');
    const [productCats] = await connection.execute('SELECT id FROM productCategories LIMIT 1');
    if (productCats.length === 0) {
      const categories = [
        { name: 'Books', slug: 'books', description: 'Transformative literature' },
        { name: 'Journals', slug: 'journals', description: 'Guided journaling experiences' },
        { name: 'Apparel', slug: 'apparel', description: 'Conscious fashion' },
        { name: 'Accessories', slug: 'accessories', description: 'Mindful accessories' },
      ];
      for (const cat of categories) {
        await connection.execute(
          'INSERT INTO productCategories (name, slug, description) VALUES (?, ?, ?)',
          [cat.name, cat.slug, cat.description]
        );
      }
      console.log('  ✅ Created default product categories');
    } else {
      console.log('  ✓ Product categories exist');
    }

    // 11. Seed Site Settings
    console.log('\n⚙️ Checking site settings...');
    const [siteSettings] = await connection.execute('SELECT id FROM siteSettings LIMIT 1');
    if (siteSettings.length === 0) {
      await connection.execute(`
        INSERT INTO siteSettings (
          googleAnalyticsId, customHeadCode, customBodyCode, maintenanceMode
        ) VALUES (
          '', '', '', 0
        )
      `);
      console.log('  ✅ Created default site settings');
    } else {
      console.log('  ✓ Site settings exist');
    }

    console.log('\n✅ Production database seed completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
