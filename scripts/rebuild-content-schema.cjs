/**
 * CONTENT EDITOR FULL REBUILD
 * 
 * This script creates the master schema that maps:
 * - Each page slug → its required sections → its required fields
 * 
 * Based on actual frontend page components analysis.
 * This becomes the single source of truth for the Content Editor.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// MASTER PAGE SCHEMA - derived from analyzing actual frontend components
// Each page only gets the sections/fields it ACTUALLY renders
const PAGE_SCHEMA = {
  // ===================== HOME PAGE =====================
  'home': {
    displayName: 'Home',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'subDescription', label: 'Sub Description', type: 'text' },
          { key: 'ctaText', label: 'CTA Button Text', type: 'text' },
          { key: 'ctaLink', label: 'CTA Button Link', type: 'url' },
          { key: 'buttonText', label: 'Secondary Button Text', type: 'text' },
          { key: 'buttonLink', label: 'Secondary Button Link', type: 'url' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      },
      'philosophy': {
        displayName: 'Philosophy Section',
        type: 'content',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'ctaText', label: 'CTA Text', type: 'text' },
          { key: 'ctaLink', label: 'CTA Link', type: 'url' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'community': {
        displayName: 'Community Section',
        type: 'community',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'ctaText', label: 'CTA Text', type: 'text' },
          { key: 'ctaLink', label: 'CTA Link', type: 'url' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'pointsOfAccess': {
        displayName: 'Points of Access',
        type: 'content',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'ctaText', label: 'CTA Text', type: 'text' },
          { key: 'ctaLink', label: 'CTA Link', type: 'url' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      }
    }
  },

  // ===================== PHILOSOPHY PAGE =====================
  'philosophy': {
    displayName: 'Philosophy',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      },
      'principles': {
        displayName: 'Core Principles',
        type: 'content',
        fields: [
          { key: 'title', label: 'Section Title', type: 'text' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
          { key: 'principle1_title', label: 'Principle 1 Title', type: 'text' },
          { key: 'principle1_description', label: 'Principle 1 Description', type: 'textarea' },
          { key: 'principle2_title', label: 'Principle 2 Title', type: 'text' },
          { key: 'principle2_description', label: 'Principle 2 Description', type: 'textarea' },
          { key: 'principle3_title', label: 'Principle 3 Title', type: 'text' },
          { key: 'principle3_description', label: 'Principle 3 Description', type: 'textarea' },
        ]
      },
      'pillars': {
        displayName: 'Three Pillars',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'newsletter': {
        displayName: 'Newsletter',
        type: 'newsletter',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'buttonText', label: 'Button Text', type: 'text' },
          { key: 'placeholder', label: 'Placeholder Text', type: 'text' },
        ]
      }
    }
  },

  // ===================== FOUNDER PAGE =====================
  'founder': {
    displayName: 'The Founder',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      },
      'opening': {
        displayName: 'Opening',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'paragraph3', label: 'Paragraph 3', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'truth': {
        displayName: 'The Truth Behind Just Empower',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'depth': {
        displayName: 'The Depth Beneath',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'paragraph3', label: 'Paragraph 3', type: 'textarea' },
          { key: 'paragraph4', label: 'Paragraph 4', type: 'textarea' },
          { key: 'paragraph5', label: 'Paragraph 5', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'remembrance': {
        displayName: 'Remembrance',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'quote', label: 'Quote', type: 'textarea' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'paragraph3', label: 'Paragraph 3', type: 'textarea' },
          { key: 'paragraph4', label: 'Paragraph 4', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'renewal': {
        displayName: 'Renewal',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'future': {
        displayName: 'The Future',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'paragraph3', label: 'Paragraph 3', type: 'textarea' },
          { key: 'paragraph4', label: 'Paragraph 4', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      }
    }
  },

  // ===================== OFFERINGS PAGE =====================
  'offerings': {
    displayName: 'Offerings',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      },
      'seeds': {
        displayName: 'Seeds of a New Paradigm',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'buttonText', label: 'Button Text', type: 'text' },
          { key: 'buttonLink', label: 'Button Link', type: 'url' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'sheWrites': {
        displayName: 'She Writes',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'buttonText', label: 'Button Text', type: 'text' },
          { key: 'buttonLink', label: 'Button Link', type: 'url' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'emerge': {
        displayName: 'Emerge With Us',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'buttonText', label: 'Button Text', type: 'text' },
          { key: 'buttonLink', label: 'Button Link', type: 'url' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'rootedUnity': {
        displayName: 'Rooted Unity',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'buttonText', label: 'Button Text', type: 'text' },
          { key: 'buttonLink', label: 'Button Link', type: 'url' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      }
    }
  },

  // ===================== CONTACT PAGE =====================
  'contact': {
    displayName: 'Contact',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      },
      'info': {
        displayName: 'Contact Info',
        type: 'content',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'phone', label: 'Phone', type: 'text' },
          { key: 'address', label: 'Address', type: 'textarea' },
        ]
      }
    }
  },

  // ===================== SHOP PAGE =====================
  'shop': {
    displayName: 'Shop',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      },
      'overview': {
        displayName: 'Overview',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      }
    }
  },

  // ===================== BLOG/JOURNAL PAGE =====================
  'blog': {
    displayName: 'Blog (She Writes)',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      }
    }
  },

  // ===================== JOURNAL PAGE =====================
  'journal': {
    displayName: 'Journal',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      }
    }
  },

  // ===================== EVENTS PAGE =====================
  'events': {
    displayName: 'Events',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]
      }
    }
  },
  
  // Alias for community-events
  'community-events': {
    displayName: 'Community Events',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]
      }
    }
  },

  // ===================== RESOURCES PAGE =====================
  'resources': {
    displayName: 'Resources',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      },
      'overview': {
        displayName: 'Overview',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
        ]
      }
    }
  },

  // ===================== WALK WITH US PAGE =====================
  'walk-with-us': {
    displayName: 'Walk With Us',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      },
      'main': {
        displayName: 'Main Content',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]
      },
      'partners': {
        displayName: 'For Partners',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'ctaText', label: 'CTA Text', type: 'text' },
          { key: 'ctaLink', label: 'CTA Link', type: 'url' },
        ]
      },
      'individuals': {
        displayName: 'For Individuals',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'ctaText', label: 'CTA Text', type: 'text' },
          { key: 'ctaLink', label: 'CTA Link', type: 'url' },
        ]
      },
      'quote': {
        displayName: 'Quote',
        type: 'quote',
        fields: [
          { key: 'text', label: 'Quote Text', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      }
    }
  },

  // ===================== ABOUT PAGE =====================
  'about': {
    displayName: 'About',
    template: 'default',
    sections: {
      'hero': {
        displayName: 'Hero',
        type: 'hero',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'subtitle', label: 'Subtitle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'videoUrl', label: 'Video URL', type: 'media' },
          { key: 'imageUrl', label: 'Image URL', type: 'media' },
        ]
      },
      'opening': {
        displayName: 'Opening',
        type: 'content',
        fields: [
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'paragraph3', label: 'Paragraph 3', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'truth': {
        displayName: 'Our Truth',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'depth': {
        displayName: 'Going Deeper',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'paragraph3', label: 'Paragraph 3', type: 'textarea' },
          { key: 'paragraph4', label: 'Paragraph 4', type: 'textarea' },
          { key: 'paragraph5', label: 'Paragraph 5', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'remembrance': {
        displayName: 'Remembrance',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'quote', label: 'Quote', type: 'textarea' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'paragraph3', label: 'Paragraph 3', type: 'textarea' },
          { key: 'paragraph4', label: 'Paragraph 4', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'renewal': {
        displayName: 'Renewal',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'future': {
        displayName: 'Looking Ahead',
        type: 'content',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'paragraph1', label: 'Paragraph 1', type: 'textarea' },
          { key: 'paragraph2', label: 'Paragraph 2', type: 'textarea' },
          { key: 'paragraph3', label: 'Paragraph 3', type: 'textarea' },
          { key: 'paragraph4', label: 'Paragraph 4', type: 'textarea' },
          { key: 'imageUrl', label: 'Image', type: 'media' },
        ]
      },
      'newsletter': {
        displayName: 'Newsletter',
        type: 'newsletter',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]
      }
    }
  },

  // ===================== GLOBAL (Footer/Newsletter) =====================
  'global': {
    displayName: 'Global Elements',
    template: 'global',
    sections: {
      'footer': {
        displayName: 'Footer',
        type: 'footer',
        fields: [
          { key: 'tagline', label: 'Tagline', type: 'text' },
          { key: 'column1Title', label: 'Column 1 Title', type: 'text' },
          { key: 'column2Title', label: 'Column 2 Title', type: 'text' },
          { key: 'column3Title', label: 'Column 3 Title', type: 'text' },
          { key: 'newsletterTitle', label: 'Newsletter Title', type: 'text' },
          { key: 'newsletterDescription', label: 'Newsletter Description', type: 'textarea' },
          { key: 'copyright', label: 'Copyright Text', type: 'text' },
        ]
      },
      'newsletter': {
        displayName: 'Newsletter Popup',
        type: 'newsletter',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'ctaText', label: 'CTA Text', type: 'text' },
          { key: 'privacyText', label: 'Privacy Text', type: 'text' },
        ]
      }
    }
  }
};

async function rebuildContentSchema() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== REBUILDING CONTENT EDITOR SCHEMA ===\n');
  
  // Step 1: Create pageContentSchema table if not exists
  console.log('Step 1: Creating pageContentSchema table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pageContentSchema (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pageSlug VARCHAR(100) NOT NULL,
      displayName VARCHAR(255) NOT NULL,
      template VARCHAR(50) DEFAULT 'default',
      sectionKey VARCHAR(100) NOT NULL,
      sectionDisplayName VARCHAR(255) NOT NULL,
      sectionType VARCHAR(50) NOT NULL,
      sectionOrder INT DEFAULT 0,
      fieldKey VARCHAR(100) NOT NULL,
      fieldLabel VARCHAR(255) NOT NULL,
      fieldType VARCHAR(50) NOT NULL,
      fieldOrder INT DEFAULT 0,
      isRequired TINYINT(1) DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_field (pageSlug, sectionKey, fieldKey)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // Step 2: Clear existing schema
  console.log('Step 2: Clearing existing schema...');
  await conn.query('DELETE FROM pageContentSchema');
  
  // Step 3: Insert new schema from PAGE_SCHEMA
  console.log('Step 3: Inserting new schema...\n');
  
  let totalFields = 0;
  
  for (const [pageSlug, pageConfig] of Object.entries(PAGE_SCHEMA)) {
    console.log(`  ${pageSlug}: ${pageConfig.displayName}`);
    
    let sectionOrder = 0;
    for (const [sectionKey, sectionConfig] of Object.entries(pageConfig.sections)) {
      let fieldOrder = 0;
      for (const field of sectionConfig.fields) {
        await conn.query(`
          INSERT INTO pageContentSchema 
          (pageSlug, displayName, template, sectionKey, sectionDisplayName, sectionType, sectionOrder, fieldKey, fieldLabel, fieldType, fieldOrder)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          pageSlug,
          pageConfig.displayName,
          pageConfig.template,
          sectionKey,
          sectionConfig.displayName,
          sectionConfig.type,
          sectionOrder,
          field.key,
          field.label,
          field.type,
          fieldOrder
        ]);
        fieldOrder++;
        totalFields++;
      }
      sectionOrder++;
      console.log(`    - ${sectionKey}: ${sectionConfig.fields.length} fields`);
    }
  }
  
  console.log(`\n✅ Schema rebuilt: ${Object.keys(PAGE_SCHEMA).length} pages, ${totalFields} fields`);
  
  // Step 4: Clean up siteContent - remove fields not in schema
  console.log('\nStep 4: Cleaning up orphan content...');
  
  // Get all valid page+section+key combinations from schema
  const [schemaFields] = await conn.query(`
    SELECT DISTINCT pageSlug, sectionKey, fieldKey FROM pageContentSchema
  `);
  
  // Get all current siteContent
  const [currentContent] = await conn.query(`
    SELECT id, page, section, contentKey FROM siteContent
  `);
  
  // Find orphans (content not in schema)
  const schemaSet = new Set(schemaFields.map(f => `${f.pageSlug}|${f.sectionKey}|${f.fieldKey}`));
  const orphans = currentContent.filter(c => !schemaSet.has(`${c.page}|${c.section}|${c.contentKey}`));
  
  // Don't delete Page Builder pages (they have their own content system)
  const [pbPages] = await conn.query(`SELECT slug FROM pages WHERE template = 'page-builder'`);
  const pbSlugs = new Set(pbPages.map(p => p.slug));
  
  const orphansToDelete = orphans.filter(o => !pbSlugs.has(o.page));
  
  if (orphansToDelete.length > 0) {
    console.log(`  Found ${orphansToDelete.length} orphan content fields to remove`);
    for (const orphan of orphansToDelete) {
      await conn.query('DELETE FROM siteContent WHERE id = ?', [orphan.id]);
    }
    console.log(`  ✅ Removed ${orphansToDelete.length} orphan fields`);
  } else {
    console.log('  No orphan content found');
  }
  
  // Step 5: Ensure all schema fields exist in siteContent (with empty values if new)
  console.log('\nStep 5: Ensuring all schema fields exist in siteContent...');
  
  let newFieldsCreated = 0;
  for (const schemaField of schemaFields) {
    const [existing] = await conn.query(`
      SELECT id FROM siteContent 
      WHERE page = ? AND section = ? AND contentKey = ?
    `, [schemaField.pageSlug, schemaField.sectionKey, schemaField.fieldKey]);
    
    if (existing.length === 0) {
      await conn.query(`
        INSERT INTO siteContent (page, section, contentKey, contentValue)
        VALUES (?, ?, ?, '')
      `, [schemaField.pageSlug, schemaField.sectionKey, schemaField.fieldKey]);
      newFieldsCreated++;
    }
  }
  
  console.log(`  ✅ Created ${newFieldsCreated} new content fields`);
  
  // Final summary
  const [finalCount] = await conn.query('SELECT COUNT(*) as cnt FROM siteContent');
  console.log(`\n=== REBUILD COMPLETE ===`);
  console.log(`Total content fields in database: ${finalCount[0].cnt}`);
  console.log(`Schema fields defined: ${totalFields}`);
  
  await conn.end();
}

// Export schema for use in Content Editor
module.exports = { PAGE_SCHEMA };

if (require.main === module) {
  rebuildContentSchema().catch(console.error);
}
