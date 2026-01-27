require('dotenv').config();
const mysql = require('mysql2/promise');

// Real JustEmpower content mapped to siteContent format
const REAL_CONTENT = {
  // ==================== HOME PAGE ====================
  'home': {
    'hero': {
      'title': 'Catalyzing the Rise of Her.',
      'subtitle': 'Where empowerment becomes embodied.',
      'description': 'For women cultivating clarity, leadership, and conscious self-direction.',
      'subDescription': 'WELCOME TO JUST EMPOWER',
      'ctaText': 'DISCOVER MORE',
      'ctaLink': '/philosophy',
      'buttonText': 'EXPLORE',
      'buttonLink': '/offerings'
    },
    'philosophy': {
      'label': 'OUR APPROACH',
      'title': 'The Philosophy',
      'subtitle': 'Embodied Leadership',
      'description': 'Just Empower operates at the intersection of personal reclamation and collective responsibility. We believe meaningful leadership begins within—through self-trust, discernment, and embodied integrity—and extends outward into the ways we build, steward, and lead.',
      'ctaText': 'LEARN MORE',
      'ctaLink': '/philosophy'
    },
    'community': {
      'label': 'COMMUNITY',
      'title': 'The Work, In Practice',
      'subtitle': 'Join Our Movement',
      'description': 'Just Empower produces written works, frameworks, and curated experiences that support clarity, discernment, and embodied leadership. The work takes form through publishing, reflective writing, and evolving initiatives—each translating inner authority into practical application.',
      'ctaText': 'WALK WITH US',
      'ctaLink': '/walk-with-us'
    },
    'offerings': {
      'title': 'Our Offerings',
      'subtitle': 'SCROLL TO EXPLORE'
    },
    'offeringsCarousel': {
      'title': 'Pathways to Transformation',
      'subtitle': 'Choose Your Journey',
      'item1_title': 'Seeds of a New Paradigm',
      'item1_description': 'The foundational body of work: embodied leadership and conscious self-authority.',
      'item1_link': '/offerings',
      'item2_title': 'MOM VI·X Trilogy',
      'item2_description': 'A literary exploration of identity, inheritance, and becoming.',
      'item2_link': '/vix-journal-trilogy',
      'item3_title': 'She Writes',
      'item3_description': 'Written reflections on embodiment, discernment, and truth.',
      'item3_link': '/blog',
      'item4_title': 'Rooted Unity',
      'item4_description': 'Framework for ecological stewardship and collective responsibility. Launching Fall 2026.',
      'item4_link': '/rooted-unity',
      'item5_title': 'Walk With Us',
      'item5_description': 'Ways to connect, gather, and engage.',
      'item5_link': '/walk-with-us',
      'item6_link': '/community-events'
    },
    'pointsOfAccess': {
      'label': 'COMING 2026',
      'title': 'Rooted Unity',
      'subtitle': 'Ecological Stewardship',
      'description': 'Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care.',
      'ctaText': 'LEARN MORE',
      'ctaLink': '/rooted-unity'
    }
  },

  // ==================== PHILOSOPHY PAGE ====================
  'philosophy': {
    'hero': {
      'title': 'Our Philosophy',
      'subtitle': 'TRUE TRANSFORMATION IS NOT A CONCEPT—IT IS A LIVED EXPERIENCE.',
      'description': 'The foundation of embodied leadership and conscious self-authority.'
    },
    'principles': {
      'title': 'Foundational Principles',
      'principle1_title': 'EMBODIMENT',
      'principle1_description': 'Truth begins where intellect ends—within the lived intelligence of the body and breath. Transformation moves from concept into experience, as the nervous system becomes the gateway to sovereignty.',
      'principle2_title': 'WHOLENESS',
      'principle2_description': 'Wholeness is not something to achieve or restore—it is something to reclaim. The work is not about fixing what is broken, but remembering what endures: clarity, sovereignty, embodied truth.',
      'principle3_title': "NATURE'S INTELLIGENCE",
      'principle3_description': "Rather than replicating outdated systems, Just Empower roots its work in nature's original intelligence—adaptive, regenerative, and quietly revolutionary."
    },
    'pillars': {
      'title': 'The Pillars',
      'subtitle': 'Our Guiding Framework',
      'description': 'These principles inform everything we create and share.'
    },
    'newsletter': {
      'title': 'Continue the Conversation',
      'description': 'Receive occasional reflections on embodiment, conscious leadership, and the lived philosophy behind Just Empower.',
      'buttonText': 'Subscribe',
      'placeholder': 'Enter your email'
    }
  },

  // ==================== FOUNDER PAGE ====================
  'founder': {
    'hero': {
      'title': 'The Founder',
      'subtitle': 'JUSTICE BARTLETT',
      'description': 'Visionary behind Just Empower'
    },
    'opening': {
      'title': 'The Story',
      'content': 'A journey of transformation',
      'paragraph1': 'Justice Bartlett is the founder of Just Empower, a platform dedicated to embodied leadership and conscious self-authority for women.',
      'paragraph2': 'Her work emerges from decades of personal inquiry, professional experience, and a deep commitment to supporting women in their own becoming.',
      'paragraph3': 'What began as personal practice evolved into a body of work designed to serve others on similar journeys of reclamation and empowerment.'
    },
    'truth': {
      'title': 'The Truth Behind Just Empower',
      'description': 'Born from experience',
      'content': 'Just Empower was born from a deep commitment to supporting women in reclaiming their inner authority.',
      'paragraph1': 'This is not motivational content. It is a body of work built on inquiry, integration, and responsibility.',
      'paragraph2': 'It unfolds over time, meeting each woman where she is in her journey.'
    },
    'depth': {
      'title': 'The Depth Beneath',
      'content': 'Beyond the surface',
      'paragraph1': 'Beyond the surface of personal development lies a profound journey of self-discovery and transformation.',
      'paragraph2': 'This work asks you to go deeper—to examine not just what you do, but who you are becoming.',
      'paragraph3': 'It invites you into relationship with your own wisdom, your own authority, your own becoming.',
      'paragraph4': 'The depth beneath is where real transformation happens.',
      'paragraph5': 'This is the work of a lifetime, unfolding one moment at a time.'
    },
    'remembrance': {
      'title': 'Remembrance',
      'description': 'Coming home to yourself',
      'content': 'The journey of remembrance',
      'quote': 'We are not here to become something new. We are here to remember what we have always been.',
      'paragraph1': 'Remembrance is the recognition that everything you seek already exists within you.',
      'paragraph2': 'It is the return to your original wisdom, your innate authority, your essential self.',
      'paragraph3': 'This is not about learning something new—it is about uncovering what was always there.',
      'paragraph4': 'The journey home begins with a single step inward.'
    },
    'renewal': {
      'title': 'Renewal',
      'description': 'The continuous unfolding',
      'content': 'Renewal as practice',
      'paragraph1': 'Renewal is not a destination but a practice—a continuous unfolding of who we are becoming.',
      'paragraph2': 'Each day offers an opportunity to begin again, to choose differently, to align more fully with our truth.'
    },
    'future': {
      'title': 'The Future',
      'description': 'What lies ahead',
      'content': 'Building what comes next',
      'paragraph1': 'The future of Just Empower is being written in real time, shaped by the women who engage with this work.',
      'paragraph2': 'New offerings continue to emerge—each one designed to meet the evolving needs of our community.',
      'paragraph3': 'We are building something that will outlast us, a body of work that serves generations to come.',
      'paragraph4': 'The future is not something to predict—it is something to create together.'
    },
    'newsletter': {
      'title': 'Stay Connected',
      'description': 'Join our community for insights and updates on the journey ahead.'
    }
  },

  // ==================== ABOUT PAGE ====================
  'about': {
    'hero': {
      'title': 'About Just Empower',
      'subtitle': 'Our Story & Mission',
      'description': 'A platform dedicated to embodied leadership and conscious self-authority for women.'
    },
    'opening': {
      'paragraph1': 'Just Empower was founded with a vision: to create a space where women could cultivate clarity, leadership, and conscious self-direction.',
      'paragraph2': 'We believe meaningful leadership begins within—through self-trust, discernment, and embodied integrity.',
      'paragraph3': 'Our work extends outward into the ways we build, steward, and lead in the world.'
    },
    'truth': {
      'title': 'Our Truth',
      'description': 'This is not motivational content. It is a body of work built on inquiry, integration, and responsibility.'
    },
    'depth': {
      'title': 'Going Deeper',
      'paragraph1': 'We invite you to go beyond the surface.',
      'paragraph2': 'To examine not just what you do, but who you are becoming.',
      'paragraph3': 'To develop relationship with your own wisdom and authority.',
      'paragraph4': 'Real transformation happens in the depths.',
      'paragraph5': 'This is the work of a lifetime.'
    },
    'remembrance': {
      'title': 'Remembrance',
      'quote': 'Everything you seek already exists within you.',
      'paragraph1': 'Remembrance is returning to your original wisdom.',
      'paragraph2': 'Your innate authority. Your essential self.',
      'paragraph3': 'This is about uncovering what was always there.',
      'paragraph4': 'The journey home begins with a single step inward.'
    },
    'renewal': {
      'title': 'Continuous Renewal',
      'paragraph1': 'Renewal is a practice—a continuous unfolding.',
      'paragraph2': 'Each day offers an opportunity to align more fully with our truth.'
    },
    'future': {
      'title': 'Looking Ahead',
      'paragraph1': 'The future is being shaped by the women who engage with this work.',
      'paragraph2': 'New offerings continue to emerge.',
      'paragraph3': 'We are building something that will serve generations to come.',
      'paragraph4': 'The future is something we create together.'
    },
    'newsletter': {
      'title': 'Stay Connected',
      'description': 'Join our community for insights, updates, and wisdom.'
    }
  },

  // ==================== OFFERINGS PAGE ====================
  'offerings': {
    'hero': {
      'title': 'Our Offerings',
      'subtitle': 'Pathways to Embodied Transformation',
      'description': 'Choose your path to conscious leadership and self-authority.'
    },
    'emerge': {
      'title': 'Emerge With Us',
      'subtitle': 'Community Gatherings',
      'description': 'Community gatherings and transformative experiences designed to support your journey of becoming.',
      'buttonText': 'Join Us',
      'buttonLink': '/community-events'
    },
    'rootedUnity': {
      'title': 'Rooted Unity',
      'subtitle': 'Coming Fall 2026',
      'description': 'Framework for ecological stewardship and collective responsibility. Where personal healing meets planetary care.',
      'buttonText': 'Learn More',
      'buttonLink': '/rooted-unity'
    },
    'seeds': {
      'title': 'Seeds of a New Paradigm',
      'subtitle': 'The Foundation',
      'description': 'The foundational body of work: embodied leadership and conscious self-authority.',
      'buttonText': 'Explore',
      'buttonLink': '/offerings/seeds'
    },
    'sheWrites': {
      'title': 'She Writes',
      'subtitle': 'Written Wisdom',
      'description': 'Written reflections on embodiment, discernment, and truth. Lessons from the Living Codex.',
      'buttonText': 'Read',
      'buttonLink': '/blog'
    }
  },

  // ==================== CONTACT PAGE ====================
  'contact': {
    'hero': {
      'title': 'Get in Touch',
      'subtitle': 'We Would Love to Hear From You',
      'description': 'Reach out with questions, inquiries, or to learn more about our work.'
    },
    'info': {
      'heading': 'Contact Information',
      'description': 'Connect with us through any of the channels below.',
      'address': 'Austin, Texas',
      'phone': '',
      'email': 'hello@justxempower.com',
      'location': 'Austin, TX'
    }
  },

  // ==================== SHOP PAGE ====================
  'shop': {
    'hero': {
      'title': 'The Shop',
      'subtitle': 'Curated Tools for Your Journey',
      'description': 'Products and resources designed to support your path of transformation.'
    },
    'overview': {
      'title': 'Browse Our Collection',
      'paragraph1': 'Each item in our shop has been thoughtfully created to support your journey of embodied leadership.',
      'paragraph2': 'From journals to guides, these tools are designed to accompany you on your path.'
    }
  },

  // ==================== GLOBAL (Footer, Newsletter) ====================
  'global': {
    'footer': {
      'tagline': 'Catalyzing the Rise of Her',
      'column1Title': 'Navigate',
      'column2Title': 'Connect',
      'column3Title': 'Legal',
      'newsletterTitle': 'Stay Connected',
      'newsletterDescription': 'Join our community for updates on offerings, events, and wisdom.',
      'copyright': '© 2026 Just Empower. All rights reserved.'
    },
    'newsletter': {
      'title': 'Join Our Community',
      'description': 'Subscribe to receive updates on new offerings, events, and wisdom from Just Empower.',
      'ctaText': 'Subscribe',
      'privacyText': 'We respect your privacy. Unsubscribe at any time.'
    },
    'newsletter_popup': {
      'title': 'Stay Connected',
      'description': 'Join our monthly mailing list for insights on embodied transformation and conscious leadership.',
      'ctaText': 'Subscribe to Newsletter',
      'privacyText': 'We respect your privacy. Unsubscribe anytime.'
    }
  }
};

async function restoreRealContent() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== RESTORING REAL JUSTXEMPOWER CONTENT ===\n');
  
  let updated = 0;
  let errors = 0;
  
  for (const [page, sections] of Object.entries(REAL_CONTENT)) {
    console.log(`\nRestoring page: ${page}`);
    
    for (const [section, fields] of Object.entries(sections)) {
      for (const [contentKey, contentValue] of Object.entries(fields)) {
        try {
          await conn.query(`
            UPDATE siteContent 
            SET contentValue = ? 
            WHERE page = ? AND section = ? AND contentKey = ?
          `, [contentValue, page, section, contentKey]);
          
          // Check if row existed, if not insert it
          const [result] = await conn.query(`
            SELECT id FROM siteContent 
            WHERE page = ? AND section = ? AND contentKey = ?
          `, [page, section, contentKey]);
          
          if (result.length === 0) {
            await conn.query(`
              INSERT INTO siteContent (page, section, contentKey, contentValue)
              VALUES (?, ?, ?, ?)
            `, [page, section, contentKey, contentValue]);
          }
          
          updated++;
        } catch (e) {
          console.log(`  ✗ ${section}.${contentKey}: ${e.message}`);
          errors++;
        }
      }
      console.log(`  ✓ ${section}`);
    }
  }
  
  console.log(`\n=== RESTORE COMPLETE ===`);
  console.log(`Updated: ${updated} content fields`);
  console.log(`Errors: ${errors}`);
  
  // Verify restoration
  const [testFields] = await conn.query(`
    SELECT page, section, contentKey, LEFT(contentValue, 50) as val 
    FROM siteContent 
    WHERE contentValue != 'TEST' 
    AND contentKey NOT LIKE '%Url%'
    AND contentKey NOT LIKE '%image%'
    LIMIT 15
  `);
  
  console.log('\nSample restored content:');
  testFields.forEach(f => console.log(`  ${f.page}.${f.section}.${f.contentKey} = "${f.val}..."`));
  
  await conn.end();
}

restoreRealContent().catch(console.error);
