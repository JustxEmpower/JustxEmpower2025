import mysql from "mysql2/promise";

// Get DATABASE_URL from environment or use the production URL
const DATABASE_URL = process.env.DATABASE_URL || 'mysql://justxempower:JxE2025SecurePass!@justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com:3306/justxempower';

async function seedPages() {
  console.log("🌱 Seeding pages table with existing site pages...");
  
  const connection = await mysql.createConnection(DATABASE_URL);

  // Define existing pages that should appear in the Page Library
  const existingPages = [
    {
      title: "Home",
      slug: "home",
      template: "content-editor", // Not page-builder, uses siteContent
      metaTitle: "Just Empower | Where Empowerment Becomes Embodiment",
      metaDescription: "Catalyzing the Rise of Her. Welcome to Just Empower - where empowerment becomes embodiment.",
      published: 1,
      showInNav: 1,
      navOrder: 1,
    },
    {
      title: "About the Founder",
      slug: "about",
      template: "content-editor",
      metaTitle: "About April Gambardella | Just Empower",
      metaDescription: "Meet April Gambardella, founder of Just Empower and steward of embodied change.",
      published: 1,
      showInNav: 1,
      navOrder: 2,
    },
    {
      title: "About Just Empower",
      slug: "about-just-empower",
      template: "content-editor",
      metaTitle: "About Just Empower | Our Mission",
      metaDescription: "Learn about Just Empower's mission to catalyze the rise of conscious leadership.",
      published: 1,
      showInNav: 1,
      navOrder: 3,
    },
    {
      title: "Philosophy",
      slug: "philosophy",
      template: "content-editor",
      metaTitle: "Our Philosophy | Just Empower",
      metaDescription: "Discover the philosophy behind Just Empower's approach to empowerment and transformation.",
      published: 1,
      showInNav: 1,
      navOrder: 4,
    },
    {
      title: "Offerings",
      slug: "offerings",
      template: "content-editor",
      metaTitle: "Offerings | Just Empower",
      metaDescription: "Explore our workshops, programs, and transformational offerings.",
      published: 1,
      showInNav: 1,
      navOrder: 5,
    },
    {
      title: "Journal",
      slug: "journal",
      template: "content-editor",
      metaTitle: "Journal | Just Empower",
      metaDescription: "Read insights and reflections from Just Empower.",
      published: 1,
      showInNav: 1,
      navOrder: 6,
    },
    {
      title: "Contact",
      slug: "contact",
      template: "content-editor",
      metaTitle: "Contact Us | Just Empower",
      metaDescription: "Get in touch with Just Empower.",
      published: 1,
      showInNav: 1,
      navOrder: 7,
    },
    {
      title: "Shop",
      slug: "shop",
      template: "content-editor",
      metaTitle: "Shop | Just Empower",
      metaDescription: "Browse our collection of products and resources.",
      published: 1,
      showInNav: 1,
      navOrder: 8,
    },
    {
      title: "Events",
      slug: "events",
      template: "content-editor",
      metaTitle: "Events | Just Empower",
      metaDescription: "Discover upcoming events and gatherings.",
      published: 1,
      showInNav: 1,
      navOrder: 9,
    },
    {
      title: "Resources",
      slug: "resources",
      template: "content-editor",
      metaTitle: "Resources | Just Empower",
      metaDescription: "Access our library of resources and tools.",
      published: 1,
      showInNav: 1,
      navOrder: 10,
    },
    {
      title: "Walk With Us",
      slug: "walk-with-us",
      template: "content-editor",
      metaTitle: "Walk With Us | Just Empower",
      metaDescription: "Join our community and walk with us on this journey.",
      published: 1,
      showInNav: 1,
      navOrder: 11,
    },
    // Legal pages
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      template: "content-editor",
      metaTitle: "Privacy Policy | Just Empower",
      metaDescription: "Read our privacy policy.",
      published: 1,
      showInNav: 0,
      navOrder: 100,
    },
    {
      title: "Terms of Service",
      slug: "terms-of-service",
      template: "content-editor",
      metaTitle: "Terms of Service | Just Empower",
      metaDescription: "Read our terms of service.",
      published: 1,
      showInNav: 0,
      navOrder: 101,
    },
    {
      title: "Accessibility Statement",
      slug: "accessibility",
      template: "content-editor",
      metaTitle: "Accessibility | Just Empower",
      metaDescription: "Our commitment to accessibility.",
      published: 1,
      showInNav: 0,
      navOrder: 102,
    },
    {
      title: "Cookie Policy",
      slug: "cookie-policy",
      template: "content-editor",
      metaTitle: "Cookie Policy | Just Empower",
      metaDescription: "Learn about our use of cookies.",
      published: 1,
      showInNav: 0,
      navOrder: 103,
    },
  ];

  console.log(`Inserting ${existingPages.length} pages...`);

  for (const page of existingPages) {
    try {
      // Use INSERT ... ON DUPLICATE KEY UPDATE to avoid errors if page already exists
      await connection.execute(
        `INSERT INTO pages (title, slug, template, metaTitle, metaDescription, published, showInNav, navOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
           title = VALUES(title),
           template = VALUES(template),
           metaTitle = VALUES(metaTitle),
           metaDescription = VALUES(metaDescription),
           published = VALUES(published),
           showInNav = VALUES(showInNav),
           navOrder = VALUES(navOrder),
           updatedAt = NOW()`,
        [
          page.title,
          page.slug,
          page.template,
          page.metaTitle,
          page.metaDescription,
          page.published,
          page.showInNav,
          page.navOrder,
        ]
      );
      console.log(`✓ Inserted/updated page: ${page.title} (${page.slug})`);
    } catch (error) {
      console.error(`✗ Error inserting page ${page.title}:`, error.message);
    }
  }

  // Verify the pages were inserted
  const [rows] = await connection.execute("SELECT COUNT(*) as count FROM pages");
  console.log(`\n✅ Total pages in database: ${rows[0].count}`);

  await connection.end();
  console.log("\n🎉 Pages seeding complete!");
}

seedPages().catch(console.error);
