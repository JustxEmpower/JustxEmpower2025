#!/usr/bin/env node
/**
 * Content Restoration Script - PostgreSQL Version
 * Based on commit 62d36e4
 * 
 * This script restores the correct navigation structure and page content
 * WITHOUT reverting any code changes.
 */

import pg from 'pg';
const { Client } = pg;

// DATABASE_URL must be set via environment variable - no hardcoded URLs
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

async function restore() {
  console.log('🔧 Starting content restoration from commit 62d36e4...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      ca: undefined
    }
  });
  
  await client.connect();
  
  try {
    // ============================================
    // 1. FIX PAGES - showInNav and navOrder
    // ============================================
    console.log('📄 Fixing pages navigation settings...');
    
    // Pages that should NOT be in main navigation
    const hiddenFromNav = [
      'home',
      'about',
      'about-justxempower',
      'accessibility',
      'privacy-policy',
      'terms-of-service',
      'cookie-policy',
    ];
    
    // First, hide all footer/legal pages from nav
    for (const slug of hiddenFromNav) {
      await client.query(
        'UPDATE pages SET "showInNav" = 0, "navOrder" = 999 WHERE slug = $1',
        [slug]
      );
      console.log(`  ✓ Hidden from nav: ${slug}`);
    }
    
    // Pages that SHOULD be in navigation (header) with correct order
    const mainNavPages = [
      { slug: 'philosophy', navOrder: 1 },
      { slug: 'offerings', navOrder: 2 },
      { slug: 'shop', navOrder: 3 },
      { slug: 'community-events', navOrder: 4 },
      { slug: 'resources', navOrder: 5 },
      { slug: 'contact', navOrder: 6 },
      { slug: 'walk-with-us', navOrder: 7 },
    ];
    
    // Set main nav pages
    for (const page of mainNavPages) {
      await client.query(
        'UPDATE pages SET "showInNav" = 1, "navOrder" = $1 WHERE slug = $2',
        [page.navOrder, page.slug]
      );
      console.log(`  ✓ Main nav: ${page.slug} (order: ${page.navOrder})`);
    }
    
    // Get philosophy page ID for parent reference
    const philosophyResult = await client.query('SELECT id FROM pages WHERE slug = $1', ['philosophy']);
    const philosophyId = philosophyResult.rows[0]?.id;
    
    // Get offerings page ID for parent reference
    const offeringsResult = await client.query('SELECT id FROM pages WHERE slug = $1', ['offerings']);
    const offeringsId = offeringsResult.rows[0]?.id;
    
    // Sub-pages - hide from main nav (they appear in dropdowns via navigation table)
    const subPages = [
      'founder', 'vision-ethos', 'workshops-programs', 
      'vix-journal-trilogy', 'vi-x-journal-trilogy', 'journal', 'blog'
    ];
    
    for (const slug of subPages) {
      await client.query(
        'UPDATE pages SET "showInNav" = 0, "navOrder" = 999 WHERE slug = $1',
        [slug]
      );
      console.log(`  ✓ Sub-page hidden: ${slug}`);
    }

    // ============================================
    // 2. FIX NAVIGATION TABLE
    // ============================================
    console.log('\n🧭 Fixing navigation table...');
    
    // Clear existing navigation
    await client.query('DELETE FROM navigation');
    console.log('  ✓ Cleared existing navigation');
    
    // Insert correct header navigation
    const headerNav = [
      { label: 'Philosophy', url: '/philosophy', order: 1 },
      { label: 'Offerings', url: '/offerings', order: 2 },
      { label: 'Shop', url: '/shop', order: 3 },
      { label: 'Community Events', url: '/community-events', order: 4 },
      { label: 'Resources', url: '/resources', order: 5 },
      { label: 'Contact', url: '/contact', order: 6 },
      { label: 'Walk With Us', url: '/walk-with-us', order: 7 },
    ];
    
    for (const item of headerNav) {
      await client.query(
        'INSERT INTO navigation (location, label, url, "order", "isExternal", "openInNewTab") VALUES ($1, $2, $3, $4, 0, 0)',
        ['header', item.label, item.url, item.order]
      );
      console.log(`  ✓ Header nav: ${item.label}`);
    }
    
    // Insert correct footer navigation
    const footerNav = [
      { label: 'About', url: '/about', order: 1 },
      { label: 'Philosophy', url: '/philosophy', order: 2 },
      { label: 'Offerings', url: '/offerings', order: 3 },
      { label: 'Journal', url: '/journal', order: 4 },
      { label: 'Contact', url: '/contact', order: 5 },
      { label: 'Walk With Us', url: '/walk-with-us', order: 6 },
    ];
    
    for (const item of footerNav) {
      await client.query(
        'INSERT INTO navigation (location, label, url, "order", "isExternal", "openInNewTab") VALUES ($1, $2, $3, $4, 0, 0)',
        ['footer', item.label, item.url, item.order]
      );
      console.log(`  ✓ Footer nav: ${item.label}`);
    }

    // ============================================
    // 3. RESTORE PAGE SECTIONS CONTENT
    // ============================================
    console.log('\n📝 Restoring page sections content...');
    
    // Get page IDs
    const pagesResult = await client.query('SELECT id, slug FROM pages');
    const pageIdMap = {};
    for (const page of pagesResult.rows) {
      pageIdMap[page.slug] = page.id;
    }
    
    // Define the correct content for each page section
    const pageSectionsContent = {
      // HOME PAGE
      home: {
        hero: {
          title: 'Catalyzing the Rise of Her.',
          subtitle: 'Welcome to Just Empower',
          description: 'Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership.',
          videoUrl: 'https://justxempower.s3.us-east-1.amazonaws.com/media/videos/home-top-2.mp4',
          ctaText: 'Discover More',
          ctaLink: '/philosophy'
        },
        content: {
          title: 'Our Philosophy',
          description: 'Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity.'
        }
      },
      
      // PHILOSOPHY PAGE
      philosophy: {
        hero: {
          title: 'Our Philosophy',
          subtitle: 'Seeds of a New Paradigm',
          description: 'Embodiment Over Intellectualization — The foundational body of work: embodied leadership and conscious self-authority.'
        },
        content: {
          title: 'Foundational Principles',
          description: 'Truth begins where intellect ends—within the lived intelligence of the body and breath. Transformation moves from concept into experience.'
        }
      },
      
      // FOUNDER PAGE
      founder: {
        hero: {
          title: 'The Founder',
          subtitle: 'April Gambardella',
          description: 'Steward of Embodied Change & Energetic Coherence',
          imageUrl: 'https://justxempower.s3.us-east-1.amazonaws.com/media/11/Fam.jpg'
        },
        content: {
          title: 'About April',
          description: 'April Gambardella is a visionary leader dedicated to catalyzing the rise of feminine leadership and embodied empowerment.'
        }
      },
      
      // VISION & ETHOS PAGE
      'vision-ethos': {
        hero: {
          title: 'Vision & Ethos',
          subtitle: 'Our Foundation',
          description: 'Embodiment Over Intellectualization — The principles that guide our work and community.',
          imageUrl: 'https://justxempower.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg'
        },
        content: {
          title: 'Our Vision',
          description: 'We envision a world where women lead from a place of wholeness, authenticity, and embodied wisdom.'
        }
      },
      
      // OFFERINGS PAGE
      offerings: {
        hero: {
          title: 'Our Offerings',
          subtitle: 'Programs & Experiences',
          description: 'Transformative experiences designed to awaken your innate wisdom and leadership.'
        },
        content: {
          title: 'Current Programs',
          description: 'Each program is designed to create lasting transformation through embodied practices, community connection, and deep inner work.'
        }
      },
      
      // SHOP PAGE
      shop: {
        hero: {
          title: 'Shop',
          subtitle: 'Sacred Offerings',
          description: 'Curated products to support your journey of transformation'
        },
        content: {
          title: 'Our Products',
          description: 'Each item in our shop has been thoughtfully selected or created to support your journey of embodied empowerment.'
        }
      },
      
      // COMMUNITY EVENTS PAGE
      'community-events': {
        hero: {
          title: 'Community Events',
          subtitle: 'Gather With Us',
          description: 'Local gatherings and community-led experiences'
        },
        content: {
          title: 'About Community Events',
          description: 'Community events are grassroots gatherings organized by members of our extended community.'
        }
      },
      
      // RESOURCES PAGE
      resources: {
        hero: {
          title: 'Resources',
          subtitle: 'Tools for Transformation',
          description: 'Curated materials to support your journey of growth and self-discovery.'
        },
        content: {
          title: 'Available Resources',
          description: 'We believe in making transformative tools accessible to all. Here you will find free resources to support your journey.'
        }
      },
      
      // WALK WITH US PAGE
      'walk-with-us': {
        hero: {
          title: 'Walk With Us',
          subtitle: 'Join the Journey',
          description: 'Ways to connect, contribute, and become part of our community'
        },
        content: {
          title: 'Ways to Connect',
          description: 'There are many paths to walk with us. Whether you are called to volunteer, partner, or simply stay connected, we welcome you.'
        }
      },
      
      // CONTACT PAGE
      contact: {
        hero: {
          title: 'Connect',
          subtitle: 'Begin the Conversation',
          description: 'We invite you to reach out and begin the conversation.'
        },
        content: {
          title: 'Get in Touch',
          description: 'Whether you are interested in partnership, coaching, or simply have a question, we invite you to reach out.'
        }
      },
      
      // ABOUT PAGE
      about: {
        hero: {
          title: 'About',
          subtitle: 'Our Story',
          description: 'Learn about the vision and mission behind Just Empower.'
        },
        content: {
          title: 'Our Mission',
          description: 'Just Empower is dedicated to catalyzing the rise of feminine leadership and embodied empowerment.'
        }
      },
      
      // ACCESSIBILITY PAGE
      accessibility: {
        hero: {
          title: 'Accessibility Statement',
          subtitle: 'Our Commitment',
          description: 'We are committed to ensuring digital accessibility for people with disabilities.'
        },
        content: {
          title: 'Accessibility',
          description: 'Just Empower is committed to ensuring that our website is accessible to people with disabilities.'
        }
      },
      
      // PRIVACY POLICY PAGE
      'privacy-policy': {
        hero: {
          title: 'Privacy Policy',
          subtitle: 'Your Privacy Matters',
          description: 'How we collect, use, and protect your information.'
        },
        content: {
          title: 'Privacy Policy',
          description: 'This Privacy Policy describes how Just Empower collects, uses, and shares your personal information.'
        }
      },
      
      // TERMS OF SERVICE PAGE
      'terms-of-service': {
        hero: {
          title: 'Terms of Service',
          subtitle: 'Legal Agreement',
          description: 'Terms and conditions for using our services.'
        },
        content: {
          title: 'Terms of Service',
          description: 'By accessing or using our services, you agree to be bound by these Terms of Service.'
        }
      },
      
      // COOKIE POLICY PAGE
      'cookie-policy': {
        hero: {
          title: 'Cookie Policy',
          subtitle: 'How We Use Cookies',
          description: 'Information about our use of cookies and similar technologies.'
        },
        content: {
          title: 'Cookie Policy',
          description: 'This Cookie Policy explains how Just Empower uses cookies and similar technologies.'
        }
      }
    };
    
    // Update page sections content
    for (const [slug, sections] of Object.entries(pageSectionsContent)) {
      const pageId = pageIdMap[slug];
      if (!pageId) {
        console.log(`  ⚠ Page not found: ${slug}`);
        continue;
      }
      
      for (const [sectionType, content] of Object.entries(sections)) {
        // Check if section exists
        const existingResult = await client.query(
          'SELECT id FROM "pageSections" WHERE "pageId" = $1 AND "sectionType" = $2',
          [pageId, sectionType]
        );
        
        if (existingResult.rows.length > 0) {
          // Update existing section
          await client.query(
            'UPDATE "pageSections" SET content = $1 WHERE "pageId" = $2 AND "sectionType" = $3',
            [JSON.stringify(content), pageId, sectionType]
          );
          console.log(`  ✓ Updated ${slug}/${sectionType}`);
        } else {
          // Insert new section
          await client.query(
            'INSERT INTO "pageSections" ("pageId", "sectionType", title, content, "sectionOrder", "isVisible") VALUES ($1, $2, $3, $4, $5, true)',
            [pageId, sectionType, content.title || sectionType, JSON.stringify(content), sectionType === 'hero' ? 0 : 1]
          );
          console.log(`  ✓ Created ${slug}/${sectionType}`);
        }
      }
    }

    // ============================================
    // 4. FIX CAROUSEL OFFERINGS
    // ============================================
    console.log('\n🎠 Fixing carousel offerings...');
    
    // Clear and recreate carousel offerings
    await client.query('DELETE FROM "carouselOfferings"');
    
    const carouselItems = [
      {
        title: 'Seeds of a New Paradigm',
        description: 'The foundational body of work: embodied leadership and conscious self-authority.',
        link: '/philosophy',
        imageUrl: 'https://justxempower.s3.us-east-1.amazonaws.com/media/carousel/seeds.jpg',
        order: 0
      },
      {
        title: 'MOM VI·X Trilogy',
        description: 'A literary exploration of identity, inheritance, and becoming.',
        link: '/vix-journal-trilogy',
        imageUrl: 'https://justxempower.s3.us-east-1.amazonaws.com/media/carousel/mom-vix.jpg',
        order: 1
      },
      {
        title: 'She Writes',
        description: 'Written reflections on embodiment, discernment, and truth.',
        link: '/journal',
        imageUrl: 'https://justxempower.s3.us-east-1.amazonaws.com/media/carousel/she-writes.jpg',
        order: 2
      },
      {
        title: 'Rooted Unity',
        description: 'Framework for ecological stewardship and collective responsibility. Launching Fall 2026.',
        link: '/offerings',
        imageUrl: 'https://justxempower.s3.us-east-1.amazonaws.com/media/carousel/rooted-unity.jpg',
        order: 3
      },
      {
        title: 'Walk With Us',
        description: 'Ways to connect, gather, and engage.',
        link: '/walk-with-us',
        imageUrl: 'https://justxempower.s3.us-east-1.amazonaws.com/media/carousel/walk-with-us.jpg',
        order: 4
      }
    ];
    
    for (const item of carouselItems) {
      await client.query(
        'INSERT INTO "carouselOfferings" (title, description, link, "imageUrl", "order", "isActive") VALUES ($1, $2, $3, $4, $5, true)',
        [item.title, item.description, item.link, item.imageUrl, item.order]
      );
      console.log(`  ✓ Carousel: ${item.title}`);
    }

    console.log('\n✅ Content restoration completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

restore();
