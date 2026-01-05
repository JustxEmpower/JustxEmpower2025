#!/usr/bin/env node
/**
 * Fix All Content Script
 * 
 * Updates both siteContent and pageSections tables with correct images and videos
 * from S3 to ensure Content Editor, CMS, and database are all in sync.
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: url.hostname.includes('tidb') ? { rejectUnauthorized: true } : undefined
};

const S3_BASE = 'https://justxempower-assets.s3.us-east-1.amazonaws.com';

// All content with correct S3 URLs
const siteContentUpdates = [
  // HOME PAGE
  { page: 'home', section: 'hero', contentKey: 'title', contentValue: 'Catalyzing the Rise of Her' },
  { page: 'home', section: 'hero', contentKey: 'subtitle', contentValue: 'Welcome to Just Empower' },
  { page: 'home', section: 'hero', contentKey: 'description', contentValue: 'Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership.' },
  { page: 'home', section: 'hero', contentKey: 'videoUrl', contentValue: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4` },
  { page: 'home', section: 'hero', contentKey: 'ctaText', contentValue: 'Discover More' },
  { page: 'home', section: 'hero', contentKey: 'ctaLink', contentValue: '/founder' },
  { page: 'home', section: 'philosophy', contentKey: 'title', contentValue: 'The Philosophy' },
  { page: 'home', section: 'philosophy', contentKey: 'subtitle', contentValue: 'OUR APPROACH' },
  { page: 'home', section: 'philosophy', contentKey: 'description', contentValue: 'Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity—and radiates outward into the structures we shape, steward, and reimagine.' },
  { page: 'home', section: 'philosophy', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/About-Founder-NH-Roots.jpg` },
  { page: 'home', section: 'philosophy', contentKey: 'ctaText', contentValue: 'Learn More' },
  { page: 'home', section: 'philosophy', contentKey: 'ctaLink', contentValue: '/philosophy' },
  { page: 'home', section: 'community', contentKey: 'title', contentValue: 'Emerge With Us' },
  { page: 'home', section: 'community', contentKey: 'subtitle', contentValue: 'COMMUNITY' },
  { page: 'home', section: 'community', contentKey: 'description', contentValue: 'We are planting seeds for a new paradigm—one rooted in consciousness, compassion, and sacred reciprocity. This is an invitation for women ready to move beyond survival patterns and into grounded discernment, embodied presence, and conscious self-authority.' },
  { page: 'home', section: 'community', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/Emerge-With-Us-2-Butterfly-dirt.jpg` },
  { page: 'home', section: 'community', contentKey: 'ctaText', contentValue: 'Walk With Us' },
  { page: 'home', section: 'community', contentKey: 'ctaLink', contentValue: '/walk-with-us' },
  { page: 'home', section: 'rooted', contentKey: 'title', contentValue: 'Rooted Unity' },
  { page: 'home', section: 'rooted', contentKey: 'subtitle', contentValue: 'Coming 2026' },
  { page: 'home', section: 'rooted', contentKey: 'description', contentValue: 'Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self.' },
  { page: 'home', section: 'rooted', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/Rooted-Unity-Chalk-1280.jpg` },
  
  // FOUNDER PAGE
  { page: 'founder', section: 'hero', contentKey: 'title', contentValue: 'The Founder' },
  { page: 'founder', section: 'hero', contentKey: 'subtitle', contentValue: 'APRIL GAMBARDELLA' },
  { page: 'founder', section: 'hero', contentKey: 'description', contentValue: 'Steward of Embodied Change & Energetic Coherence' },
  { page: 'founder', section: 'hero', contentKey: 'videoUrl', contentValue: `${S3_BASE}/media/Dsb2B6tn7x1Hpsnh-ZT8c.mp4` },
  { page: 'founder', section: 'hero', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/11/Fam.jpg` },
  { page: 'founder', section: 'opening', contentKey: 'title', contentValue: 'A Journey of Transformation' },
  { page: 'founder', section: 'opening', contentKey: 'content', contentValue: 'April Gambardella is a visionary leader, author, and advocate for women\'s empowerment. Her journey from corporate executive to spiritual guide has been marked by profound transformation and unwavering commitment to helping others discover their authentic power.' },
  { page: 'founder', section: 'opening', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/10/About-April-1st-tinified.jpg` },
  { page: 'founder', section: 'truth', contentKey: 'title', contentValue: 'Just Empower is Built on This Truth' },
  { page: 'founder', section: 'truth', contentKey: 'content', contentValue: 'That every woman holds within her the seeds of profound leadership—not the kind that dominates, but the kind that nurtures, transforms, and elevates. April\'s work is dedicated to helping women remember this truth and embody it fully.' },
  { page: 'founder', section: 'truth', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Marble1.jpg` },
  { page: 'founder', section: 'depth', contentKey: 'title', contentValue: 'The Depth Beneath the Framework' },
  { page: 'founder', section: 'depth', contentKey: 'content', contentValue: 'Beyond the programs and offerings lies a deeper invitation—to reconnect with the wisdom that has always lived within you. April\'s approach weaves together ancient wisdom traditions with modern understanding of the nervous system, creating pathways for lasting transformation.' },
  { page: 'founder', section: 'depth', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Marble2.jpg` },
  { page: 'founder', section: 'remembrance', contentKey: 'title', contentValue: 'A Thread of Remembrance' },
  { page: 'founder', section: 'remembrance', contentKey: 'content', contentValue: '"We are not here to fix what is broken. We are here to remember what is whole." This guiding principle infuses every aspect of April\'s work, inviting women to release the narratives of inadequacy and step into their inherent completeness.' },
  { page: 'founder', section: 'remembrance', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Single-Monarch-wing.jpg` },
  { page: 'founder', section: 'renewal', contentKey: 'title', contentValue: 'The Art of Renewal' },
  { page: 'founder', section: 'renewal', contentKey: 'content', contentValue: 'Like the cycles of nature, April believes in the power of renewal—the shedding of old patterns, the quiet gestation of new possibilities, and the eventual blossoming into fuller expression. Her work honors these natural rhythms of growth and transformation.' },
  { page: 'founder', section: 'renewal', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Cliff1.jpg` },
  { page: 'founder', section: 'future', contentKey: 'title', contentValue: 'Looking Forward' },
  { page: 'founder', section: 'future', contentKey: 'content', contentValue: 'The vision continues to unfold. With each woman who steps into her power, the ripples extend further—into families, communities, and the collective consciousness. April remains committed to this work of awakening, one heart at a time.' },
  { page: 'founder', section: 'future', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Zoom.jpg` },
  
  // PHILOSOPHY PAGE
  { page: 'philosophy', section: 'hero', contentKey: 'title', contentValue: 'Our Philosophy' },
  { page: 'philosophy', section: 'hero', contentKey: 'subtitle', contentValue: 'EMBODIMENT OVER INTELLECTUALIZATION' },
  { page: 'philosophy', section: 'hero', contentKey: 'description', contentValue: 'Truth begins where intellect ends—within the lived intelligence of the body and breath.' },
  { page: 'philosophy', section: 'hero', contentKey: 'videoUrl', contentValue: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4` },
  { page: 'philosophy', section: 'hero', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/About-Founder-NH-Roots.jpg` },
  { page: 'philosophy', section: 'principles', contentKey: 'title', contentValue: 'Foundational Principles' },
  { page: 'philosophy', section: 'principles', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Marble1.jpg` },
  
  // OFFERINGS PAGE
  { page: 'offerings', section: 'hero', contentKey: 'title', contentValue: 'Our Offerings' },
  { page: 'offerings', section: 'hero', contentKey: 'subtitle', contentValue: 'TRANSFORMATIONAL PROGRAMS DESIGNED TO RESTORE ALIGNMENT AND CATALYZE CONSCIOUS LEADERSHIP.' },
  { page: 'offerings', section: 'hero', contentKey: 'description', contentValue: 'Transformative experiences designed to awaken your innate wisdom and leadership.' },
  { page: 'offerings', section: 'hero', contentKey: 'videoUrl', contentValue: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4` },
  { page: 'offerings', section: 'hero', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/08/SEEDS-OF-Peacock-Feather.png` },
  { page: 'offerings', section: 'seeds', contentKey: 'title', contentValue: 'Seeds of a New Paradigm' },
  { page: 'offerings', section: 'seeds', contentKey: 'subtitle', contentValue: 'Foundational Program' },
  { page: 'offerings', section: 'seeds', contentKey: 'description', contentValue: 'A transformative journey for women ready to plant seeds of conscious leadership. This foundational program guides you through the essential practices of embodied empowerment, nervous system regulation, and authentic self-expression.' },
  { page: 'offerings', section: 'seeds', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/08/SEEDS-OF-Peacock-Feather.png` },
  { page: 'offerings', section: 'she-writes', contentKey: 'title', contentValue: 'She Writes' },
  { page: 'offerings', section: 'she-writes', contentKey: 'subtitle', contentValue: 'Written Expression' },
  { page: 'offerings', section: 'she-writes', contentKey: 'description', contentValue: 'Explore the power of written expression as a tool for healing and transformation. Through guided journaling, creative writing, and reflective practices, discover your authentic voice and reclaim your narrative.' },
  { page: 'offerings', section: 'she-writes', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/april-tinified.jpg` },
  { page: 'offerings', section: 'emerge', contentKey: 'title', contentValue: 'Emerge With Us' },
  { page: 'offerings', section: 'emerge', contentKey: 'subtitle', contentValue: 'Community Experience' },
  { page: 'offerings', section: 'emerge', contentKey: 'description', contentValue: 'An immersive experience of collective transformation and conscious community. Join women from around the world in a container of deep witnessing, shared practice, and mutual support as we emerge together into our fullest expression.' },
  { page: 'offerings', section: 'emerge', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/Emerge-With-Us-2-Butterfly-dirt.jpg` },
  { page: 'offerings', section: 'rooted-unity', contentKey: 'title', contentValue: 'Rooted Unity' },
  { page: 'offerings', section: 'rooted-unity', contentKey: 'subtitle', contentValue: 'Coming 2026' },
  { page: 'offerings', section: 'rooted-unity', contentKey: 'description', contentValue: 'Ecological stewardship meets personal healing. This upcoming program weaves together regenerative practices, land-based learning, and inner work to create a holistic approach to planetary and personal restoration.' },
  { page: 'offerings', section: 'rooted-unity', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/Rooted-Unity-Chalk-1280.jpg` },
  
  // CONTACT PAGE
  { page: 'contact', section: 'hero', contentKey: 'title', contentValue: 'Connect' },
  { page: 'contact', section: 'hero', contentKey: 'subtitle', contentValue: 'BEGIN THE CONVERSATION' },
  { page: 'contact', section: 'hero', contentKey: 'description', contentValue: 'We\'d love to hear from you.' },
  { page: 'contact', section: 'hero', contentKey: 'videoUrl', contentValue: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4` },
  { page: 'contact', section: 'hero', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/Contact-Lily-in-pond.jpg` },
  { page: 'contact', section: 'info', contentKey: 'heading', contentValue: 'Let\'s Connect' },
  { page: 'contact', section: 'info', contentKey: 'description', contentValue: 'Whether you\'re curious about our offerings, interested in collaboration, or simply want to say hello, we\'d love to hear from you. Reach out and let\'s explore how we can support your journey.' },
  { page: 'contact', section: 'info', contentKey: 'location', contentValue: 'Austin, Texas' },
  { page: 'contact', section: 'info', contentKey: 'email', contentValue: 'partners@justxempower.com' },
  
  // WALK WITH US PAGE
  { page: 'walk-with-us', section: 'hero', contentKey: 'title', contentValue: 'Walk With Us' },
  { page: 'walk-with-us', section: 'hero', contentKey: 'subtitle', contentValue: 'JOIN THE JOURNEY' },
  { page: 'walk-with-us', section: 'hero', contentKey: 'description', contentValue: 'Step into a community of women committed to conscious leadership, embodied wisdom, and collective transformation.' },
  { page: 'walk-with-us', section: 'hero', contentKey: 'videoUrl', contentValue: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4` },
  { page: 'walk-with-us', section: 'hero', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/Emerge-with-Us-1-Volcano-skyline.jpg` },
  { page: 'walk-with-us', section: 'content', contentKey: 'heading', contentValue: 'Join Our Community' },
  { page: 'walk-with-us', section: 'content', contentKey: 'description', contentValue: 'There are many ways to walk with us on this journey of transformation. Whether you\'re an organization seeking partnership or an individual ready to deepen your practice, we welcome you.' },
  
  // RESOURCES PAGE
  { page: 'resources', section: 'hero', contentKey: 'title', contentValue: 'Resources' },
  { page: 'resources', section: 'hero', contentKey: 'subtitle', contentValue: 'TOOLS FOR TRANSFORMATION' },
  { page: 'resources', section: 'hero', contentKey: 'description', contentValue: 'Curated materials to support your journey of growth and self-discovery.' },
  { page: 'resources', section: 'hero', contentKey: 'videoUrl', contentValue: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4` },
  { page: 'resources', section: 'hero', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Marble2.jpg` },
  
  // COMMUNITY EVENTS PAGE
  { page: 'community-events', section: 'hero', contentKey: 'title', contentValue: 'Community Events' },
  { page: 'community-events', section: 'hero', contentKey: 'subtitle', contentValue: 'GATHER WITH US' },
  { page: 'community-events', section: 'hero', contentKey: 'description', contentValue: 'Join our community for transformative gatherings, workshops, and celebrations.' },
  { page: 'community-events', section: 'hero', contentKey: 'videoUrl', contentValue: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4` },
  { page: 'community-events', section: 'hero', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/Emerge-With-Us-Flower.jpg` },
  
  // JOURNAL/BLOG PAGE
  { page: 'blog', section: 'hero', contentKey: 'title', contentValue: 'Journal' },
  { page: 'blog', section: 'hero', contentKey: 'subtitle', contentValue: 'REFLECTIONS & INSIGHTS' },
  { page: 'blog', section: 'hero', contentKey: 'description', contentValue: 'Explore our collection of writings on embodiment, leadership, and transformation.' },
  { page: 'blog', section: 'hero', contentKey: 'videoUrl', contentValue: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4` },
  { page: 'blog', section: 'hero', contentKey: 'imageUrl', contentValue: `${S3_BASE}/builds/latest/public/media/09/april2-tinified.jpg` },
];

// Page sections for Content Editor (pageSections table)
const pageIdMap = {
  'home': 60001,
  'founder': 60002,
  'philosophy': 60003,
  'offerings': 60004,
  'contact': 60005,
  'walk-with-us': 60006,
  'resources': 60007,
  'community-events': 60008,
  'blog': 60009,
  'shop': 60010,
  'vision-ethos': 60011,
  'workshops': 60012,
  'vix-journal': 60013,
};

const pageSectionsData = [
  // HOME PAGE
  {
    pageId: 60001,
    sectionType: 'hero',
    title: 'Hero Section',
    order: 0,
    content: {
      title: 'Catalyzing the Rise of Her',
      subtitle: 'Welcome to Just Empower',
      description: 'Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership.',
      videoUrl: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4`,
      ctaText: 'Discover More',
      ctaLink: '/founder'
    }
  },
  {
    pageId: 60001,
    sectionType: 'content',
    title: 'Philosophy Section',
    order: 1,
    content: {
      title: 'The Philosophy',
      subtitle: 'OUR APPROACH',
      description: 'Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity—and radiates outward into the structures we shape, steward, and reimagine.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/About-Founder-NH-Roots.jpg`,
      ctaText: 'Learn More',
      ctaLink: '/philosophy'
    }
  },
  {
    pageId: 60001,
    sectionType: 'carousel',
    title: 'Offerings Carousel',
    order: 2,
    content: {
      title: 'Our Offerings',
      subtitle: 'PROGRAMS & EXPERIENCES'
    }
  },
  {
    pageId: 60001,
    sectionType: 'community',
    title: 'Community Section',
    order: 3,
    content: {
      title: 'Emerge With Us',
      subtitle: 'COMMUNITY',
      description: 'We are planting seeds for a new paradigm—one rooted in consciousness, compassion, and sacred reciprocity. This is an invitation for women ready to move beyond survival patterns and into grounded discernment, embodied presence, and conscious self-authority.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/Emerge-With-Us-2-Butterfly-dirt.jpg`,
      ctaText: 'Walk With Us',
      ctaLink: '/walk-with-us'
    }
  },
  {
    pageId: 60001,
    sectionType: 'content',
    title: 'Rooted Unity Section',
    order: 4,
    content: {
      title: 'Rooted Unity',
      subtitle: 'Coming 2026',
      description: 'Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/Rooted-Unity-Chalk-1280.jpg`
    }
  },
  {
    pageId: 60001,
    sectionType: 'newsletter',
    title: 'Newsletter Section',
    order: 5,
    content: {
      title: 'Stay Connected',
      subtitle: 'JOIN OUR NEWSLETTER',
      description: 'Receive insights, updates, and invitations directly to your inbox.'
    }
  },
  {
    pageId: 60001,
    sectionType: 'footer',
    title: 'Footer',
    order: 6,
    content: {}
  },
  
  // FOUNDER PAGE
  {
    pageId: 60002,
    sectionType: 'hero',
    title: 'Hero Section',
    order: 0,
    content: {
      title: 'The Founder',
      subtitle: 'APRIL GAMBARDELLA',
      description: 'Steward of Embodied Change & Energetic Coherence',
      videoUrl: `${S3_BASE}/media/Dsb2B6tn7x1Hpsnh-ZT8c.mp4`,
      imageUrl: `${S3_BASE}/builds/latest/public/media/11/Fam.jpg`
    }
  },
  {
    pageId: 60002,
    sectionType: 'content',
    title: 'Opening',
    order: 1,
    content: {
      title: 'A Journey of Transformation',
      description: 'April Gambardella is a visionary leader, author, and advocate for women\'s empowerment. Her journey from corporate executive to spiritual guide has been marked by profound transformation and unwavering commitment to helping others discover their authentic power.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/10/About-April-1st-tinified.jpg`
    }
  },
  {
    pageId: 60002,
    sectionType: 'content',
    title: 'Truth',
    order: 2,
    content: {
      title: 'Just Empower is Built on This Truth',
      description: 'That every woman holds within her the seeds of profound leadership—not the kind that dominates, but the kind that nurtures, transforms, and elevates. April\'s work is dedicated to helping women remember this truth and embody it fully.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Marble1.jpg`
    }
  },
  {
    pageId: 60002,
    sectionType: 'content',
    title: 'Depth',
    order: 3,
    content: {
      title: 'The Depth Beneath the Framework',
      description: 'Beyond the programs and offerings lies a deeper invitation—to reconnect with the wisdom that has always lived within you. April\'s approach weaves together ancient wisdom traditions with modern understanding of the nervous system, creating pathways for lasting transformation.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Marble2.jpg`
    }
  },
  {
    pageId: 60002,
    sectionType: 'quote',
    title: 'Remembrance',
    order: 4,
    content: {
      title: 'A Thread of Remembrance',
      description: '"We are not here to fix what is broken. We are here to remember what is whole." This guiding principle infuses every aspect of April\'s work, inviting women to release the narratives of inadequacy and step into their inherent completeness.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Single-Monarch-wing.jpg`
    }
  },
  {
    pageId: 60002,
    sectionType: 'content',
    title: 'Renewal',
    order: 5,
    content: {
      title: 'The Art of Renewal',
      description: 'Like the cycles of nature, April believes in the power of renewal—the shedding of old patterns, the quiet gestation of new possibilities, and the eventual blossoming into fuller expression. Her work honors these natural rhythms of growth and transformation.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Cliff1.jpg`
    }
  },
  {
    pageId: 60002,
    sectionType: 'content',
    title: 'Future',
    order: 6,
    content: {
      title: 'Looking Forward',
      description: 'The vision continues to unfold. With each woman who steps into her power, the ripples extend further—into families, communities, and the collective consciousness. April remains committed to this work of awakening, one heart at a time.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Zoom.jpg`
    }
  },
  {
    pageId: 60002,
    sectionType: 'newsletter',
    title: 'Newsletter',
    order: 7,
    content: {
      title: 'Stay Connected',
      description: 'Join our community and receive updates on new offerings, events, and insights.'
    }
  },
  {
    pageId: 60002,
    sectionType: 'footer',
    title: 'Footer',
    order: 8,
    content: {}
  },
  
  // PHILOSOPHY PAGE
  {
    pageId: 60003,
    sectionType: 'hero',
    title: 'Hero Section',
    order: 0,
    content: {
      title: 'Our Philosophy',
      subtitle: 'EMBODIMENT OVER INTELLECTUALIZATION',
      description: 'Truth begins where intellect ends—within the lived intelligence of the body and breath.',
      videoUrl: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4`,
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/About-Founder-NH-Roots.jpg`
    }
  },
  {
    pageId: 60003,
    sectionType: 'content',
    title: 'Core Principles',
    order: 1,
    content: {
      title: 'Foundational Principles',
      description: 'Our work is grounded in three core principles that guide everything we do.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Marble1.jpg`
    }
  },
  {
    pageId: 60003,
    sectionType: 'grid',
    title: 'Three Pillars',
    order: 2,
    content: {
      title: 'The Three Pillars',
      items: [
        { title: 'Embodiment', description: 'Truth begins where intellect ends—within the lived intelligence of the body and breath.' },
        { title: 'Wholeness', description: 'Wholeness is not something to achieve or restore—it is something to reclaim.' },
        { title: 'Nature\'s Intelligence', description: 'Rather than replicating outdated systems, Just Empower roots its work in nature\'s original intelligence.' }
      ]
    }
  },
  {
    pageId: 60003,
    sectionType: 'newsletter',
    title: 'Newsletter',
    order: 3,
    content: {
      title: 'Stay Connected',
      description: 'Join our community and receive updates.'
    }
  },
  {
    pageId: 60003,
    sectionType: 'footer',
    title: 'Footer',
    order: 4,
    content: {}
  },
  
  // OFFERINGS PAGE
  {
    pageId: 60004,
    sectionType: 'hero',
    title: 'Hero Section',
    order: 0,
    content: {
      title: 'Our Offerings',
      subtitle: 'TRANSFORMATIONAL PROGRAMS DESIGNED TO RESTORE ALIGNMENT AND CATALYZE CONSCIOUS LEADERSHIP.',
      description: 'Transformative experiences designed to awaken your innate wisdom and leadership.',
      videoUrl: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4`,
      imageUrl: `${S3_BASE}/builds/latest/public/media/08/SEEDS-OF-Peacock-Feather.png`
    }
  },
  {
    pageId: 60004,
    sectionType: 'content',
    title: 'Seeds of a New Paradigm',
    order: 1,
    content: {
      title: 'Seeds of a New Paradigm',
      subtitle: 'Foundational Program',
      description: 'A transformative journey for women ready to plant seeds of conscious leadership. This foundational program guides you through the essential practices of embodied empowerment, nervous system regulation, and authentic self-expression.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/08/SEEDS-OF-Peacock-Feather.png`,
      ctaText: 'Discover More',
      ctaLink: '/offerings/seeds-of-a-new-paradigm'
    }
  },
  {
    pageId: 60004,
    sectionType: 'content',
    title: 'She Writes',
    order: 2,
    content: {
      title: 'She Writes',
      subtitle: 'Written Expression',
      description: 'Explore the power of written expression as a tool for healing and transformation. Through guided journaling, creative writing, and reflective practices, discover your authentic voice and reclaim your narrative.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/april-tinified.jpg`,
      ctaText: 'Discover More',
      ctaLink: '/offerings/she-writes'
    }
  },
  {
    pageId: 60004,
    sectionType: 'content',
    title: 'Emerge With Us',
    order: 3,
    content: {
      title: 'Emerge With Us',
      subtitle: 'Community Experience',
      description: 'An immersive experience of collective transformation and conscious community. Join women from around the world in a container of deep witnessing, shared practice, and mutual support as we emerge together into our fullest expression.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/Emerge-With-Us-2-Butterfly-dirt.jpg`,
      ctaText: 'Discover More',
      ctaLink: '/offerings/emerge-with-us'
    }
  },
  {
    pageId: 60004,
    sectionType: 'content',
    title: 'Rooted Unity',
    order: 4,
    content: {
      title: 'Rooted Unity',
      subtitle: 'Coming 2026',
      description: 'Ecological stewardship meets personal healing. This upcoming program weaves together regenerative practices, land-based learning, and inner work to create a holistic approach to planetary and personal restoration.',
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/Rooted-Unity-Chalk-1280.jpg`,
      ctaText: 'Discover More',
      ctaLink: '/offerings/rooted-unity'
    }
  },
  {
    pageId: 60004,
    sectionType: 'newsletter',
    title: 'Newsletter',
    order: 5,
    content: {
      title: 'Stay Connected',
      description: 'Join our community and receive updates.'
    }
  },
  {
    pageId: 60004,
    sectionType: 'footer',
    title: 'Footer',
    order: 6,
    content: {}
  },
  
  // CONTACT PAGE
  {
    pageId: 60005,
    sectionType: 'hero',
    title: 'Hero Section',
    order: 0,
    content: {
      title: 'Connect',
      subtitle: 'BEGIN THE CONVERSATION',
      description: 'We\'d love to hear from you.',
      videoUrl: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4`,
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/Contact-Lily-in-pond.jpg`
    }
  },
  {
    pageId: 60005,
    sectionType: 'form',
    title: 'Contact Form',
    order: 1,
    content: {
      title: 'Let\'s Connect',
      description: 'Whether you\'re curious about our offerings, interested in collaboration, or simply want to say hello, we\'d love to hear from you. Reach out and let\'s explore how we can support your journey.',
      location: 'Austin, Texas',
      email: 'partners@justxempower.com'
    }
  },
  {
    pageId: 60005,
    sectionType: 'footer',
    title: 'Footer',
    order: 2,
    content: {}
  },
  
  // WALK WITH US PAGE
  {
    pageId: 60006,
    sectionType: 'hero',
    title: 'Hero Section',
    order: 0,
    content: {
      title: 'Walk With Us',
      subtitle: 'JOIN THE JOURNEY',
      description: 'Step into a community of women committed to conscious leadership, embodied wisdom, and collective transformation.',
      videoUrl: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4`,
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/Emerge-with-Us-1-Volcano-skyline.jpg`
    }
  },
  {
    pageId: 60006,
    sectionType: 'content',
    title: 'Main Content',
    order: 1,
    content: {
      title: 'Join Our Community',
      description: 'There are many ways to walk with us on this journey of transformation. Whether you\'re an organization seeking partnership or an individual ready to deepen your practice, we welcome you.'
    }
  },
  {
    pageId: 60006,
    sectionType: 'grid',
    title: 'Partnership Options',
    order: 2,
    content: {
      title: 'Ways to Connect',
      items: [
        { title: 'For Partners', description: 'Organizations and businesses aligned with our mission.' },
        { title: 'For Individuals', description: 'Women ready to deepen their practice and join our community.' }
      ]
    }
  },
  {
    pageId: 60006,
    sectionType: 'newsletter',
    title: 'Newsletter',
    order: 3,
    content: {
      title: 'Stay Connected',
      description: 'Join our community and receive updates.'
    }
  },
  {
    pageId: 60006,
    sectionType: 'footer',
    title: 'Footer',
    order: 4,
    content: {}
  },
  
  // RESOURCES PAGE
  {
    pageId: 60007,
    sectionType: 'hero',
    title: 'Hero Section',
    order: 0,
    content: {
      title: 'Resources',
      subtitle: 'TOOLS FOR TRANSFORMATION',
      description: 'Curated materials to support your journey of growth and self-discovery.',
      videoUrl: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4`,
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/About-Founder-Marble2.jpg`
    }
  },
  {
    pageId: 60007,
    sectionType: 'grid',
    title: 'Resource Categories',
    order: 1,
    content: {
      title: 'Browse Resources'
    }
  },
  {
    pageId: 60007,
    sectionType: 'footer',
    title: 'Footer',
    order: 2,
    content: {}
  },
  
  // COMMUNITY EVENTS PAGE
  {
    pageId: 60008,
    sectionType: 'hero',
    title: 'Hero Section',
    order: 0,
    content: {
      title: 'Community Events',
      subtitle: 'GATHER WITH US',
      description: 'Join our community for transformative gatherings, workshops, and celebrations.',
      videoUrl: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4`,
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/Emerge-With-Us-Flower.jpg`
    }
  },
  {
    pageId: 60008,
    sectionType: 'grid',
    title: 'Events Calendar',
    order: 1,
    content: {
      title: 'Upcoming Events'
    }
  },
  {
    pageId: 60008,
    sectionType: 'footer',
    title: 'Footer',
    order: 2,
    content: {}
  },
  
  // BLOG/JOURNAL PAGE
  {
    pageId: 60009,
    sectionType: 'hero',
    title: 'Hero Section',
    order: 0,
    content: {
      title: 'Journal',
      subtitle: 'REFLECTIONS & INSIGHTS',
      description: 'Explore our collection of writings on embodiment, leadership, and transformation.',
      videoUrl: `${S3_BASE}/media/OWq_P7pPl7FcH6xEaM2mb.mp4`,
      imageUrl: `${S3_BASE}/builds/latest/public/media/09/april2-tinified.jpg`
    }
  },
  {
    pageId: 60009,
    sectionType: 'grid',
    title: 'Articles',
    order: 1,
    content: {
      title: 'Latest Articles'
    }
  },
  {
    pageId: 60009,
    sectionType: 'footer',
    title: 'Footer',
    order: 2,
    content: {}
  },
];

async function fixAllContent() {
  console.log('🔧 Starting comprehensive content fix...\n');
  
  const connection = await mysql.createConnection(config);
  
  try {
    // 1. Update siteContent table
    console.log('📝 Updating siteContent table...');
    let siteContentUpdated = 0;
    let siteContentInserted = 0;
    
    for (const item of siteContentUpdates) {
      const [existing] = await connection.execute(
        'SELECT id FROM siteContent WHERE page = ? AND section = ? AND contentKey = ?',
        [item.page, item.section, item.contentKey]
      );
      
      if (existing.length > 0) {
        await connection.execute(
          'UPDATE siteContent SET contentValue = ? WHERE page = ? AND section = ? AND contentKey = ?',
          [item.contentValue, item.page, item.section, item.contentKey]
        );
        siteContentUpdated++;
      } else {
        await connection.execute(
          'INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES (?, ?, ?, ?)',
          [item.page, item.section, item.contentKey, item.contentValue]
        );
        siteContentInserted++;
      }
    }
    console.log(`  ✅ siteContent: ${siteContentUpdated} updated, ${siteContentInserted} inserted`);
    
    // 2. Clear and repopulate pageSections table
    console.log('\n📊 Updating pageSections table...');
    
    // Delete existing sections for pages we're updating
    const pageIds = [...new Set(pageSectionsData.map(s => s.pageId))];
    for (const pageId of pageIds) {
      await connection.execute('DELETE FROM pageSections WHERE pageId = ?', [pageId]);
    }
    console.log(`  🗑️ Cleared existing sections for ${pageIds.length} pages`);
    
    // Insert new sections
    let sectionsInserted = 0;
    for (const section of pageSectionsData) {
      await connection.execute(
        'INSERT INTO pageSections (pageId, sectionType, title, sectionOrder, content, isVisible) VALUES (?, ?, ?, ?, ?, 1)',
        [section.pageId, section.sectionType, section.title, section.order, JSON.stringify(section.content)]
      );
      sectionsInserted++;
    }
    console.log(`  ✅ pageSections: ${sectionsInserted} sections inserted across ${pageIds.length} pages`);
    
    console.log('\n✅ All content fixed successfully!\n');
    console.log('Summary:');
    console.log(`  - siteContent: ${siteContentUpdated + siteContentInserted} entries processed`);
    console.log(`  - pageSections: ${sectionsInserted} sections across ${pageIds.length} pages`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixAllContent();
