/**
 * Seed script to add siteContent entries for all pages
 * This ensures every page has editable content in the admin Content Editor
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

// Define content entries for each page
const pageContents = {
  // Founder page (mirrors about page structure)
  founder: {
    hero: {
      subtitle: 'APRIL GAMBARDELLA',
      title: 'The Founder',
      description: 'Steward of Embodied Change & Energetic Coherence',
      videoUrl: '/media/founder-hero.mp4',
      imageUrl: '/media/11/Fam.jpg'
    },
    opening: {
      paragraph1: 'April Gambardella is a visionary leader dedicated to catalyzing the rise of feminine leadership and embodied empowerment.',
      paragraph2: 'Her journey began with a deep calling to bridge the gap between personal transformation and systemic change.',
      paragraph3: 'Through Just Empower, she creates transformative spaces where women discover their authentic power.'
    },
    truth: {
      title: 'Speaking Truth',
      paragraph1: 'April believes that true transformation begins with radical honesty—with ourselves and with the world.',
      paragraph2: 'Her work invites women to shed the layers of conditioning and step into their sovereign selves.'
    },
    depth: {
      title: 'Going Deeper',
      paragraph1: 'The path of embodied empowerment requires us to descend into the depths of our being.',
      paragraph2: 'April guides this journey with compassion, wisdom, and unwavering presence.'
    }
  },

  // Vision & Ethos page
  'vision-ethos': {
    hero: {
      subtitle: 'OUR VISION',
      title: 'Vision & Ethos',
      description: 'Embodiment Over Intellectualization',
      imageUrl: '/media/11/Lavender1.jpg'
    },
    vision: {
      title: 'Our Vision',
      paragraph1: 'We envision a world where women lead from a place of wholeness, authenticity, and embodied wisdom.',
      paragraph2: 'A world where the feminine principle is honored as essential to collective healing and transformation.'
    },
    ethos: {
      title: 'Our Ethos',
      paragraph1: 'We believe that true transformation is not a concept—it is a lived experience.',
      paragraph2: 'Our approach integrates ancient wisdom with modern understanding, honoring the body as a vessel of knowledge.',
      paragraph3: 'We practice sacred reciprocity, recognizing our interconnection with all of life.'
    }
  },

  // Workshops & Programs page
  'workshops-programs': {
    hero: {
      subtitle: 'TRANSFORMATIVE EXPERIENCES',
      title: 'Workshops & Programs',
      description: 'Immersive journeys designed to awaken your authentic power',
      imageUrl: '/media/11/Fam.jpg'
    },
    overview: {
      title: 'Our Programs',
      paragraph1: 'Each program is designed to create lasting transformation through embodied practices, community connection, and deep inner work.',
      paragraph2: 'Whether you join us for a single workshop or commit to a longer journey, you will be held in a container of safety, support, and sacred witnessing.'
    },
    offerings: {
      title: 'Current Offerings',
      item1_title: 'Seeds of a New Paradigm',
      item1_description: 'A foundational program for women ready to plant the seeds of conscious leadership.',
      item2_title: 'Emerge With Us',
      item2_description: 'An immersive experience of collective transformation and community building.',
      item3_title: 'Rooted Unity',
      item3_description: 'Ecological stewardship meets personal healing in this regenerative journey.'
    }
  },

  // VI•X Journal Trilogy page
  'vix-journal-trilogy': {
    hero: {
      subtitle: 'THE WRITTEN WORD',
      title: 'VI • X Journal Trilogy',
      description: 'A collection of reflections, wisdom, and transformative writings',
      imageUrl: '/media/11/IMG_3018.jpg'
    },
    overview: {
      title: 'About the Trilogy',
      paragraph1: 'The VI • X Journal Trilogy is a sacred collection of writings that emerged from the depths of transformation.',
      paragraph2: 'Each volume offers a unique lens through which to explore the journey of embodied empowerment.'
    },
    volumes: {
      title: 'The Three Volumes',
      volume1_title: 'Volume I: Awakening',
      volume1_description: 'The first stirrings of consciousness and the call to transformation.',
      volume2_title: 'Volume II: Descent',
      volume2_description: 'The journey into the depths, where true healing begins.',
      volume3_title: 'Volume III: Emergence',
      volume3_description: 'Rising from the ashes, embodying our authentic power.'
    }
  },

  // Blog (She Writes) page - uses journal page ID
  'blog': {
    hero: {
      subtitle: 'SHE WRITES',
      title: 'Blog',
      description: 'Reflections, wisdom, and stories from our community of conscious leaders',
      imageUrl: '/media/11/Lavender1.jpg'
    }
  },

  // Shop page
  'shop': {
    hero: {
      subtitle: 'SACRED OFFERINGS',
      title: 'Shop',
      description: 'Curated products to support your journey of transformation',
      imageUrl: '/media/11/Lavender1.jpg'
    },
    overview: {
      title: 'Our Products',
      paragraph1: 'Each item in our shop has been thoughtfully selected or created to support your journey of embodied empowerment.',
      paragraph2: 'From journals to sacred objects, these offerings are tools for transformation.'
    }
  },

  // Resources page
  'resources': {
    hero: {
      subtitle: 'TOOLS FOR TRANSFORMATION',
      title: 'Resources',
      description: 'Free resources to support your journey of embodied empowerment',
      imageUrl: '/media/11/Fam.jpg'
    },
    overview: {
      title: 'Available Resources',
      paragraph1: 'We believe in making transformative tools accessible to all. Here you will find free resources to support your journey.',
      paragraph2: 'From guided meditations to worksheets, these offerings are gifts from our community to yours.'
    }
  },

  // Walk With Us page
  'walk-with-us': {
    hero: {
      subtitle: 'JOIN THE JOURNEY',
      title: 'Walk With Us',
      description: 'Ways to connect, contribute, and become part of our community',
      imageUrl: '/media/11/Lavender1.jpg'
    },
    overview: {
      title: 'Ways to Connect',
      paragraph1: 'There are many paths to walk with us. Whether you are called to volunteer, partner, or simply stay connected, we welcome you.',
      paragraph2: 'Our community grows through authentic connection and shared purpose.'
    },
    options: {
      title: 'Get Involved',
      option1_title: 'Newsletter',
      option1_description: 'Stay connected with our monthly reflections and updates.',
      option2_title: 'Volunteer',
      option2_description: 'Offer your gifts in service of our shared mission.',
      option3_title: 'Partner',
      option3_description: 'Explore collaboration opportunities for aligned organizations.'
    }
  },

  // Community Events page
  'community-events': {
    hero: {
      subtitle: 'GATHER WITH US',
      title: 'Community Events',
      description: 'Local gatherings and community-led experiences',
      imageUrl: '/media/11/Fam.jpg'
    },
    overview: {
      title: 'About Community Events',
      paragraph1: 'Community events are grassroots gatherings organized by members of our extended community.',
      paragraph2: 'These events create opportunities for connection, learning, and collective transformation in your local area.'
    }
  }
};

async function seedPageContent() {
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

    for (const [page, sections] of Object.entries(pageContents)) {
      console.log(`\nProcessing page: ${page}`);
      
      for (const [section, fields] of Object.entries(sections)) {
        for (const [contentKey, contentValue] of Object.entries(fields)) {
          const key = `${page}:${section}:${contentKey}`;
          
          if (existingKeys.has(key)) {
            skippedCount++;
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
    console.log(`Seed complete!`);
    console.log(`  Inserted: ${insertedCount} new entries`);
    console.log(`  Skipped: ${skippedCount} existing entries`);
    console.log(`========================================`);

  } finally {
    await connection.end();
  }
}

seedPageContent().catch(console.error);
