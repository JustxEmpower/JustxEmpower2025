import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

// Missing sections to add
const missingSections = [
  // Philosophy page - Founder Quote
  {
    pageId: 60003,
    sectionType: 'quote',
    sectionOrder: 4,
    title: 'Founder Quote',
    content: {
      quote: "The body knows what the mind forgets. When we return to the wisdom of our flesh, we remember who we truly are.",
      author: "April Gambardella",
      authorTitle: "Founder, Just Empower",
      imageUrl: "https://justxempower-assets.s3.us-east-1.amazonaws.com/builds/latest/public/media/09/april-tinified.jpg"
    },
    requiredFields: 'quote,author',
    isVisible: 1
  },
  // Add Footer content to all pages
  {
    pageId: 60001,
    sectionType: 'footer',
    sectionOrder: 99,
    title: 'Footer',
    content: {
      copyright: "© 2025 Just Empower. All rights reserved.",
      links: "/privacy-policy,/terms-of-service,/contact"
    },
    requiredFields: '',
    isVisible: 1
  },
  {
    pageId: 60002,
    sectionType: 'footer',
    sectionOrder: 99,
    title: 'Footer',
    content: {
      copyright: "© 2025 Just Empower. All rights reserved.",
      links: "/privacy-policy,/terms-of-service,/contact"
    },
    requiredFields: '',
    isVisible: 1
  },
  {
    pageId: 60003,
    sectionType: 'footer',
    sectionOrder: 99,
    title: 'Footer',
    content: {
      copyright: "© 2025 Just Empower. All rights reserved.",
      links: "/privacy-policy,/terms-of-service,/contact"
    },
    requiredFields: '',
    isVisible: 1
  },
  {
    pageId: 60004,
    sectionType: 'footer',
    sectionOrder: 99,
    title: 'Footer',
    content: {
      copyright: "© 2025 Just Empower. All rights reserved.",
      links: "/privacy-policy,/terms-of-service,/contact"
    },
    requiredFields: '',
    isVisible: 1
  },
  {
    pageId: 60005,
    sectionType: 'footer',
    sectionOrder: 99,
    title: 'Footer',
    content: {
      copyright: "© 2025 Just Empower. All rights reserved.",
      links: "/privacy-policy,/terms-of-service,/contact"
    },
    requiredFields: '',
    isVisible: 1
  },
  {
    pageId: 60006,
    sectionType: 'footer',
    sectionOrder: 99,
    title: 'Footer',
    content: {
      copyright: "© 2025 Just Empower. All rights reserved.",
      links: "/privacy-policy,/terms-of-service,/contact"
    },
    requiredFields: '',
    isVisible: 1
  },
  {
    pageId: 60007,
    sectionType: 'footer',
    sectionOrder: 99,
    title: 'Footer',
    content: {
      copyright: "© 2025 Just Empower. All rights reserved.",
      links: "/privacy-policy,/terms-of-service,/contact"
    },
    requiredFields: '',
    isVisible: 1
  },
  {
    pageId: 60008,
    sectionType: 'footer',
    sectionOrder: 99,
    title: 'Footer',
    content: {
      copyright: "© 2025 Just Empower. All rights reserved.",
      links: "/privacy-policy,/terms-of-service,/contact"
    },
    requiredFields: '',
    isVisible: 1
  },
  {
    pageId: 60009,
    sectionType: 'footer',
    sectionOrder: 99,
    title: 'Footer',
    content: {
      copyright: "© 2025 Just Empower. All rights reserved.",
      links: "/privacy-policy,/terms-of-service,/contact"
    },
    requiredFields: '',
    isVisible: 1
  }
];

async function addMissingSections() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log('Adding missing sections...\n');
  
  let added = 0;
  let updated = 0;
  
  for (const section of missingSections) {
    // Check if section already exists
    const [existing] = await conn.execute(
      'SELECT id FROM pageSections WHERE pageId = ? AND title = ?',
      [section.pageId, section.title]
    );
    
    if (existing.length > 0) {
      // Update existing section
      await conn.execute(
        'UPDATE pageSections SET content = ?, sectionType = ?, sectionOrder = ?, requiredFields = ?, isVisible = ? WHERE id = ?',
        [JSON.stringify(section.content), section.sectionType, section.sectionOrder, section.requiredFields, section.isVisible, existing[0].id]
      );
      console.log(`Updated: pageId ${section.pageId} - ${section.title}`);
      updated++;
    } else {
      // Insert new section
      await conn.execute(
        'INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [section.pageId, section.sectionType, section.sectionOrder, section.title, JSON.stringify(section.content), section.requiredFields, section.isVisible]
      );
      console.log(`Added: pageId ${section.pageId} - ${section.title}`);
      added++;
    }
  }
  
  console.log(`\nAdded ${added} sections, updated ${updated} sections`);
  
  await conn.end();
}

addMissingSections().catch(console.error);
