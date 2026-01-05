/**
 * Script to add missing Content Editor sections to the siteContent table
 * This ensures 100% coverage of all page sections in the admin Content Editor
 */

import mysql from 'mysql2/promise';

// DATABASE_URL must be set via environment variable - no hardcoded URLs
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL.replace('mysql://', 'http://'));
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
};

// Define ALL missing content entries
const missingContent = {
  // ============================================
  // BLOG (SHE WRITES) PAGE - COMPLETELY MISSING
  // ============================================
  'blog': {
    hero: {
      subtitle: 'SHE WRITES',
      title: 'Blog',
      description: 'Reflections, wisdom, and stories from our community of conscious leaders',
      imageUrl: '/media/11/Lavender1.jpg'
    },
    overview: {
      title: 'Latest Posts',
      paragraph1: 'Welcome to She Writes, a sacred space for reflection, wisdom, and storytelling.',
      paragraph2: 'Here you will find articles, insights, and musings from April and our community of conscious leaders.'
    }
  },

  // ============================================
  // OFFERINGS PAGE - MISSING MAJOR SECTIONS
  // ============================================
  'offerings': {
    seeds: {
      title: 'Seeds of a New Paradigm',
      subtitle: 'FOUNDATIONAL PROGRAM',
      description: 'A transformative journey for women ready to plant the seeds of conscious leadership and embodied empowerment.',
      buttonText: 'Learn More',
      buttonLink: '/offerings/seeds-of-new-paradigm',
      imageUrl: '/media/11/Fam.jpg'
    },
    sheWrites: {
      title: 'She Writes',
      subtitle: 'THE WRITTEN WORD',
      description: 'Explore the power of written expression as a tool for transformation and self-discovery.',
      buttonText: 'Read More',
      buttonLink: '/blog',
      imageUrl: '/media/11/Lavender1.jpg'
    },
    emerge: {
      title: 'Emerge With Us',
      subtitle: 'COLLECTIVE TRANSFORMATION',
      description: 'An immersive experience of collective transformation, community building, and shared emergence.',
      buttonText: 'Join Us',
      buttonLink: '/offerings/emerge-with-us',
      imageUrl: '/media/11/IMG_3018.jpg'
    },
    rootedUnity: {
      title: 'Rooted Unity',
      subtitle: 'COMING 2026',
      description: 'Ecological stewardship meets personal healing in this regenerative journey connecting us to the land and each other.',
      buttonText: 'Coming Soon',
      buttonLink: '/offerings/rooted-unity',
      imageUrl: '/media/11/Fam.jpg'
    }
  },

  // ============================================
  // PHILOSOPHY PAGE - MISSING SECTIONS
  // ============================================
  'philosophy': {
    principles: {
      title: 'Foundational Principles',
      principle1_title: 'Embodiment',
      principle1_description: 'True transformation lives in the body. We honor somatic wisdom as the foundation of lasting change.',
      principle2_title: 'Wholeness',
      principle2_description: 'We embrace all parts of ourselves—light and shadow—as essential to our authentic expression.',
      principle3_title: "Nature's Intelligence",
      principle3_description: 'We align with the rhythms and wisdom of the natural world, recognizing ourselves as part of the greater web of life.'
    },
    newsletter: {
      title: 'Deepen Your Practice',
      description: 'Join our community and receive monthly reflections, practices, and invitations to gather.',
      buttonText: 'Subscribe',
      placeholder: 'Enter your email'
    }
  },

  // ============================================
  // HOME PAGE - MISSING SECTIONS
  // ============================================
  'home': {
    offeringsCarousel: {
      title: 'Our Offerings',
      card1_title: 'Seeds of New Paradigm',
      card1_description: 'A foundational program for women ready to plant the seeds of conscious leadership.',
      card1_link: '/offerings/seeds-of-new-paradigm',
      card2_title: 'Emerge With Us',
      card2_description: 'An immersive experience of collective transformation and community building.',
      card2_link: '/offerings/emerge-with-us',
      card3_title: 'Rooted Unity',
      card3_description: 'Ecological stewardship meets personal healing in this regenerative journey.',
      card3_link: '/offerings/rooted-unity',
      card4_title: 'MOM VI-X',
      card4_description: 'A sacred container for mothers walking the path of embodied leadership.',
      card4_link: '/offerings/mom-vix'
    },
    rootedUnitySection: {
      title: 'Rooted Unity',
      subtitle: 'COMING 2026',
      description: 'A revolutionary approach to ecological stewardship and collective healing, connecting us to the land and each other.',
      buttonText: 'Learn More',
      buttonLink: '/offerings/rooted-unity',
      imageUrl: '/media/11/Fam.jpg'
    },
    footer: {
      tagline: 'Empowering women to lead from wholeness, authenticity, and embodied wisdom.',
      copyright: '© 2025 Just Empower. All rights reserved.',
      socialInstagram: 'https://instagram.com/justxempower',
      socialFacebook: 'https://facebook.com/justxempower',
      socialLinkedin: 'https://linkedin.com/company/justxempower'
    }
  },

  // ============================================
  // VI•X JOURNAL TRILOGY - ADD MISSING DETAILS
  // ============================================
  'vix-journal-trilogy': {
    hero: {
      subtitle: 'THE WRITTEN WORD',
      title: 'VI • X Journal Trilogy',
      description: 'A three-volume exploration of consciousness, healing, and transformation',
      imageUrl: '/media/11/Fam.jpg'
    },
    overview: {
      title: 'About the Trilogy',
      paragraph1: 'The VI • X Journal Trilogy is a sacred container for your inner work.',
      paragraph2: 'Each volume guides you through a different phase of transformation.'
    },
    volumes: {
      title: 'The Three Volumes',
      volume1: 'Volume I: Awakening',
      volume2: 'Volume II: Integration',
      volume3: 'Volume III: Embodiment'
    }
  }
};

async function addMissingContent() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(config);
  
  try {
    // Get existing pages to avoid duplicates
    const [existingRows] = await connection.execute(
      'SELECT DISTINCT page, section, contentKey FROM siteContent'
    );
    const existingKeys = new Set(existingRows.map(r => `${r.page}:${r.section}:${r.contentKey}`));
    console.log(`Found ${existingKeys.size} existing content entries`);

    let insertedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const [page, sections] of Object.entries(missingContent)) {
      console.log(`\nProcessing page: ${page}`);
      
      for (const [section, fields] of Object.entries(sections)) {
        for (const [contentKey, contentValue] of Object.entries(fields)) {
          const key = `${page}:${section}:${contentKey}`;
          
          if (existingKeys.has(key)) {
            skippedCount++;
            console.log(`  - Skipped ${section}.${contentKey} (already exists)`);
            continue;
          }

          try {
            await connection.execute(
              'INSERT INTO siteContent (page, section, contentKey, contentValue, updatedAt) VALUES (?, ?, ?, ?, NOW())',
              [page, section, contentKey, contentValue]
            );
            insertedCount++;
            console.log(`  ✓ Added ${section}.${contentKey}`);
          } catch (err) {
            console.error(`  ✗ Failed to add ${section}.${contentKey}:`, err.message);
          }
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`Content update complete!`);
    console.log(`  Inserted: ${insertedCount} new entries`);
    console.log(`  Skipped: ${skippedCount} existing entries`);
    console.log(`========================================`);

  } finally {
    await connection.end();
  }
}

addMissingContent().catch(console.error);
