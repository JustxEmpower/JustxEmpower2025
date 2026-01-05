/**
 * Complete pageSections seed from commit 62d36e4
 * This script populates ALL sections for ALL pages in the Visual Section Mapper
 */

import mysql from 'mysql2/promise';

async function seedPageSections() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Complete sections data for ALL pages
    const allPageSections = [
      // ===== HOME PAGE (pageId: 1) =====
      {
        pageId: 1,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 1,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Catalyzing the Rise of Her',
          subtitle: 'Welcome to Just Empower',
          description: 'Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership.',
          videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/home-slide-1.mp4',
          imageUrl: '',
          ctaText: 'Discover More',
          ctaLink: '/founder',
          backgroundImage: ''
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'ctaText', 'ctaLink', 'videoUrl']),
        isVisible: 1
      },
      {
        pageId: 1,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Philosophy Section',
        content: JSON.stringify({
          label: 'Our Approach',
          title: 'The Philosophy',
          description: 'Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity—and radiates outward into the structures we shape, steward, and reimagine.',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/12/IMG_0513-1280x1358.jpg',
          ctaText: 'Discover More',
          ctaLink: '/philosophy/vision-ethos'
        }),
        requiredFields: JSON.stringify(['title', 'description', 'ctaText', 'ctaLink']),
        isVisible: 1
      },
      {
        pageId: 1,
        sectionType: 'carousel',
        sectionOrder: 3,
        title: 'Offerings Carousel',
        content: JSON.stringify({
          offerings: [
            {
              title: 'The Living Codex™',
              description: 'A proprietary 160-question archetypal assessment system for deep self-discovery and transformation.',
              imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/carousel/living-codex.jpg',
              link: '/offerings/living-codex'
            },
            {
              title: 'MOM VI•X Journal Trilogy',
              description: 'Three-volume healing journey for maternal lineage work and intergenerational transformation.',
              imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/carousel/mom-vix.jpg',
              link: '/offerings/mom-vix'
            },
            {
              title: 'BloomXFlight',
              description: 'Pollinator restoration initiative creating butterfly habitats and ecological stewardship.',
              imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/carousel/bloomxflight.jpg',
              link: '/offerings/bloomxflight'
            },
            {
              title: 'She Writes Blog',
              description: 'Lessons from the Living Codex - wisdom, insights, and transformational content.',
              imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/carousel/she-writes.jpg',
              link: '/blog'
            },
            {
              title: 'Workshops & Programs',
              description: 'Trauma-informed programming serving foster youth, veterans, and survivors.',
              imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/carousel/workshops.jpg',
              link: '/offerings/workshops-programs'
            }
          ]
        }),
        requiredFields: JSON.stringify(['offerings']),
        isVisible: 1
      },
      {
        pageId: 1,
        sectionType: 'community',
        sectionOrder: 4,
        title: 'Community Section',
        content: JSON.stringify({
          label: 'Community',
          title: 'Emerge With Us',
          description: 'We are planting seeds for a new paradigm—one rooted in consciousness, compassion, and sacred reciprocity. This is an invitation for women ready to move beyond survival patterns and into grounded discernment, embodied presence, and conscious self-authority.',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Tri-Cover-1280x960.jpg',
          ctaText: 'Walk With Us',
          ctaLink: '/walk-with-us'
        }),
        requiredFields: JSON.stringify(['title', 'description', 'ctaText', 'ctaLink']),
        isVisible: 1
      },
      {
        pageId: 1,
        sectionType: 'rooted-unity',
        sectionOrder: 5,
        title: 'Rooted Unity Section',
        content: JSON.stringify({
          label: 'Coming 2026',
          title: 'Rooted Unity',
          description: 'Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self.',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/forest-sunlight.jpg',
          ctaText: 'Learn More',
          ctaLink: '/offerings/rooted-unity'
        }),
        requiredFields: JSON.stringify(['title', 'description', 'ctaText', 'ctaLink']),
        isVisible: 1
      },
      {
        pageId: 1,
        sectionType: 'newsletter',
        sectionOrder: 6,
        title: 'Newsletter Section',
        content: JSON.stringify({
          title: 'Stay Connected',
          description: 'Join our community and receive monthly reflections, wisdom, and updates on upcoming offerings.',
          buttonText: 'Subscribe',
          placeholder: 'Your email address'
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 1,
        sectionType: 'footer',
        sectionOrder: 7,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          },
          footerLinks: ['About', 'Philosophy', 'Offerings', 'Journal', 'Contact', 'Walk With Us'],
          legalLinks: ['Accessibility', 'Privacy Policy', 'Terms of Service', 'Cookie Policy']
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== FOUNDER PAGE (pageId: 60002) =====
      {
        pageId: 60002,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60002,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'The Founder',
          subtitle: 'APRIL GAMBARDELLA',
          description: 'Steward of Embodied Change & Energetic Coherence',
          videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/09/seeds-of-power.mp4',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Fam.jpg',
          backgroundImage: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/founder/hero.jpg'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'videoUrl', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60002,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Biography - Opening',
        content: JSON.stringify({
          sectionId: 'opening',
          paragraph1: 'From the moment my eyes opened to this world, I have been drawn to truth—not from a need to know, but from a need to understand. This inclination was nurtured by my mother, who taught me that true stewardship means leaving everything better than we found it: a space, a system, or the Earth itself.',
          paragraph2: 'That ethos of restoration and responsibility became the ground of my devotion. Over time, it expanded beyond personal integrity into a greater mission: empowering visionaries, reimagining inherited systems, and contributing to planetary regeneration.',
          paragraph3: 'Just as we are responsible for the spaces we inhabit, we are stewards of the Earth, entrusted with its vitality.'
        }),
        requiredFields: JSON.stringify(['paragraph1', 'paragraph2', 'paragraph3']),
        isVisible: 1
      },
      {
        pageId: 60002,
        sectionType: 'content',
        sectionOrder: 3,
        title: 'Biography - Truth',
        content: JSON.stringify({
          sectionId: 'truth',
          title: 'Just Empower is Built on This Truth',
          description: 'Real change is both individual and collective—an energetic imprint that reverberates through humanity and the living world alike.'
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60002,
        sectionType: 'content',
        sectionOrder: 4,
        title: 'Biography - Depth',
        content: JSON.stringify({
          sectionId: 'depth',
          title: 'The Depth Beneath the Framework',
          paragraph1: 'Though my roots first took hold in Southern California, I have since grounded in the vibrant soils of Austin, Texas, a sanctuary that attuned my rhythm, mirrored my reinvention, and revealed the sacred nature of emergence.',
          paragraph2: 'My understanding of trauma, healing, and transformation is not theoretical; it was forged through lived experience.',
          paragraph3: 'With a degree in Communication Studies and a background in law, I came to know the mechanics of language, perception, and influence. Ongoing studies in consciousness, energy dynamics, and systemic change offered the scaffolding, but it was the descent itself that transmuted knowledge into truth.',
          paragraph4: 'I was not taught—I was tempered. Not by intellect, but by initiation.',
          paragraph5: 'The truths I carry were etched into the language of my body as knowing. What emerged now lives within our offerings and through the field of Just Empower.'
        }),
        requiredFields: JSON.stringify(['title', 'paragraph1', 'paragraph2', 'paragraph3', 'paragraph4', 'paragraph5']),
        isVisible: 1
      },
      {
        pageId: 60002,
        sectionType: 'quote',
        sectionOrder: 5,
        title: 'Personal Quote - Remembrance',
        content: JSON.stringify({
          sectionId: 'remembrance',
          title: 'A Thread of Remembrance',
          quote: 'We do not rise by climbing over others. We rise by lifting as we climb—and sometimes, by descending into the depths to retrieve what was lost.',
          paragraph1: 'There is a thread that runs through all of my work—a golden filament of remembrance. It whispers of a time when women gathered in circles, when wisdom was passed through story and song, when the Earth was honored as mother and teacher.',
          paragraph2: 'This thread is not nostalgia. It is a living pulse, calling us forward into a future that honors what came before while creating something entirely new.',
          paragraph3: 'Just Empower is my offering to this remembrance. It is a space where women can reclaim their voices, their bodies, their sovereignty. Where healing happens not in isolation, but in community. Where transformation is not a destination, but a way of being.',
          paragraph4: 'I invite you to walk with me on this path. Not as followers, but as fellow travelers. Each of us carrying our own medicine, our own gifts, our own piece of the puzzle.'
        }),
        requiredFields: JSON.stringify(['title', 'quote', 'paragraph1', 'paragraph2', 'paragraph3', 'paragraph4']),
        isVisible: 1
      },
      {
        pageId: 60002,
        sectionType: 'content',
        sectionOrder: 6,
        title: 'Biography - Renewal',
        content: JSON.stringify({
          sectionId: 'renewal',
          title: 'The Art of Renewal',
          paragraph1: 'Renewal is not about becoming someone new. It is about returning to who you have always been—beneath the conditioning, the expectations, the stories you were told about who you should be.',
          paragraph2: 'This is the work I am devoted to. This is the invitation I extend to every woman who feels the stirring of something more within her.'
        }),
        requiredFields: JSON.stringify(['title', 'paragraph1', 'paragraph2']),
        isVisible: 1
      },
      {
        pageId: 60002,
        sectionType: 'content',
        sectionOrder: 7,
        title: 'Biography - Future',
        content: JSON.stringify({
          sectionId: 'future',
          title: 'Looking Forward',
          paragraph1: 'As we stand at this threshold of collective transformation, I am filled with both reverence and anticipation. The old paradigms are crumbling, and in their place, something new is being born.',
          paragraph2: 'Just Empower is part of this birthing. We are midwives to a new way of being—one that honors the feminine, respects the Earth, and recognizes the inherent dignity of all life.',
          paragraph3: 'I do not know exactly what this future will look like. But I know it will be built by women who have done the inner work. Women who have faced their shadows and emerged with greater compassion. Women who lead not from ego, but from essence.',
          paragraph4: 'If you feel called to this work, I welcome you. The path is not always easy, but it is always worth walking.'
        }),
        requiredFields: JSON.stringify(['title', 'paragraph1', 'paragraph2', 'paragraph3', 'paragraph4']),
        isVisible: 1
      },
      {
        pageId: 60002,
        sectionType: 'newsletter',
        sectionOrder: 8,
        title: 'Newsletter Section',
        content: JSON.stringify({
          title: 'Stay Connected',
          description: 'Join our community and receive monthly reflections, wisdom, and updates on upcoming offerings.',
          buttonText: 'Subscribe to Newsletter',
          fields: ['firstName', 'lastName', 'email']
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60002,
        sectionType: 'footer',
        sectionOrder: 9,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== PHILOSOPHY PAGE (pageId: 60001) =====
      {
        pageId: 60001,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60001,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Our Philosophy',
          subtitle: 'EMBODIMENT OVER INTELLECTUALIZATION',
          description: 'True transformation is not a concept—it is a lived experience.',
          videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/home-fog-slide-3.mp4',
          imageUrl: ''
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'videoUrl']),
        isVisible: 1
      },
      {
        pageId: 60001,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Core Principles',
        content: JSON.stringify({
          sectionId: 'principles',
          title: 'Core Principles',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg',
          principle1_title: 'Embodiment',
          principle1_description: 'We believe that true transformation happens not in the mind alone, but in the body. Our work integrates somatic practices, nervous system regulation, and embodied awareness as pathways to lasting change.',
          principle2_title: 'Sacred Reciprocity',
          principle2_description: 'We honor the law of sacred reciprocity—the understanding that we must give back what we take, and that our healing is interconnected with the healing of the Earth and all beings.',
          principle3_title: 'Feminine Wisdom',
          principle3_description: 'We honor the intelligence of the feminine—the intuitive, the cyclical, the regenerative. Our work bridges ancient wisdom and modern science to create pathways of healing that are both grounded and transcendent.'
        }),
        requiredFields: JSON.stringify(['title', 'principle1_title', 'principle1_description', 'principle2_title', 'principle2_description', 'principle3_title', 'principle3_description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60001,
        sectionType: 'content',
        sectionOrder: 3,
        title: 'The Three Pillars',
        content: JSON.stringify({
          sectionId: 'pillars',
          title: 'The Three Pillars',
          subtitle: 'Foundation of Our Work',
          description: 'Our approach rests on three interconnected pillars: Personal Sovereignty, Collective Healing, and Planetary Stewardship. Each supports and strengthens the others, creating a holistic framework for transformation.',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/IMG_3018.jpg',
          pillar1_title: 'Personal Sovereignty',
          pillar1_description: 'Reclaiming your authentic power and self-authority through embodied practices and inner work.',
          pillar2_title: 'Collective Healing',
          pillar2_description: 'Healing in community, recognizing that our individual journeys are interconnected with the collective.',
          pillar3_title: 'Planetary Stewardship',
          pillar3_description: 'Tending to the Earth as an extension of tending to ourselves, honoring our role as caretakers.'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'pillar1_title', 'pillar1_description', 'pillar2_title', 'pillar2_description', 'pillar3_title', 'pillar3_description']),
        isVisible: 1
      },
      {
        pageId: 60001,
        sectionType: 'newsletter',
        sectionOrder: 4,
        title: 'Newsletter Section',
        content: JSON.stringify({
          title: 'Deepen Your Practice',
          description: 'Receive monthly reflections, practices, and wisdom to support your journey of embodied transformation.'
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60001,
        sectionType: 'footer',
        sectionOrder: 5,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== OFFERINGS PAGE (pageId: 60004) =====
      {
        pageId: 60004,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60004,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Our Offerings',
          subtitle: 'SEEDS OF A NEW PARADIGM',
          description: 'Transformational programs designed to restore alignment and catalyze conscious leadership.',
          videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/09/seeds-of-video-2.mp4',
          imageUrl: ''
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'videoUrl']),
        isVisible: 1
      },
      {
        pageId: 60004,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Seeds of a New Paradigm',
        content: JSON.stringify({
          sectionId: 'seeds',
          title: 'Seeds of a New Paradigm',
          subtitle: 'Foundational Program',
          description: 'A transformative journey for women ready to plant seeds of conscious leadership. This foundational program guides you through the essential practices of embodied empowerment, nervous system regulation, and authentic self-expression.',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/seeds-cover.jpg',
          link: '/offerings/seeds-of-a-new-paradigm'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60004,
        sectionType: 'content',
        sectionOrder: 3,
        title: 'She Writes',
        content: JSON.stringify({
          sectionId: 'sheWrites',
          title: 'She Writes',
          subtitle: 'Written Expression',
          description: 'Explore the power of written expression as a tool for healing and transformation. Through guided journaling, creative writing, and reflective practices, discover your authentic voice and reclaim your narrative.',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/she-writes-cover.jpg',
          link: '/offerings/she-writes'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60004,
        sectionType: 'content',
        sectionOrder: 4,
        title: 'Emerge With Us',
        content: JSON.stringify({
          sectionId: 'emerge',
          title: 'Emerge With Us',
          subtitle: 'Community Experience',
          description: 'An immersive experience of collective transformation and conscious community. Join women from around the world in a container of deep witnessing, shared practice, and mutual support as we emerge together into our fullest expression.',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Tri-Cover-1280x960.jpg',
          link: '/offerings/emerge-with-us'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60004,
        sectionType: 'content',
        sectionOrder: 5,
        title: 'Rooted Unity',
        content: JSON.stringify({
          sectionId: 'rootedUnity',
          title: 'Rooted Unity',
          subtitle: 'Coming 2026',
          description: 'Ecological stewardship meets personal healing. This upcoming program weaves together regenerative practices, land-based learning, and inner work to create a holistic approach to planetary and personal restoration.',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/forest-sunlight.jpg',
          link: '/offerings/rooted-unity'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60004,
        sectionType: 'newsletter',
        sectionOrder: 6,
        title: 'Newsletter Section',
        content: JSON.stringify({
          title: 'Stay Updated',
          description: 'Be the first to know about new offerings, workshops, and transformational opportunities.'
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60004,
        sectionType: 'footer',
        sectionOrder: 7,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== CONTACT PAGE (pageId: 60012) =====
      {
        pageId: 60012,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60012,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Connect',
          subtitle: 'BEGIN THE CONVERSATION',
          description: 'Reach out to explore how we can support your journey.',
          videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/home-top-2.mp4',
          imageUrl: ''
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'videoUrl']),
        isVisible: 1
      },
      {
        pageId: 60012,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Contact Information',
        content: JSON.stringify({
          sectionId: 'info',
          heading: "Let's Connect",
          description: "Whether you're curious about our offerings, interested in collaboration, or simply want to say hello, we'd love to hear from you. Reach out and let's explore how we can support your journey.",
          location: 'Austin, Texas',
          email: 'partners@justxempower.com',
          phone: '(512) 730-9586',
          address: 'Austin, Texas',
          instagramUrl: 'https://instagram.com/justxempower',
          linkedinUrl: 'https://linkedin.com/company/justxempower'
        }),
        requiredFields: JSON.stringify(['heading', 'description', 'email', 'phone', 'location']),
        isVisible: 1
      },
      {
        pageId: 60012,
        sectionType: 'form',
        sectionOrder: 3,
        title: 'Contact Form',
        content: JSON.stringify({
          title: 'Send a Message',
          fields: ['name', 'email', 'subject', 'message'],
          submitText: 'Send Message',
          successMessage: 'Thank you for reaching out. We will get back to you soon.'
        }),
        requiredFields: JSON.stringify(['title', 'fields', 'submitText']),
        isVisible: 1
      },
      {
        pageId: 60012,
        sectionType: 'footer',
        sectionOrder: 4,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== WALK WITH US PAGE (pageId: 60011) =====
      {
        pageId: 60011,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60011,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Walk With Us',
          subtitle: 'JOIN THE JOURNEY',
          description: 'Ways to connect, contribute, and become part of our community',
          videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/home-fog-slide-3.mp4',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'videoUrl', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60011,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Main Content',
        content: JSON.stringify({
          sectionId: 'main',
          title: 'Join Our Community',
          description: "There are many ways to walk with us on this journey of transformation. Whether you're an organization seeking partnership or an individual ready to deepen your practice, we welcome you."
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60011,
        sectionType: 'content',
        sectionOrder: 3,
        title: 'For Organizations',
        content: JSON.stringify({
          sectionId: 'partners',
          title: 'For Organizations',
          description: 'Partner with us to bring transformative programming to your community, workplace, or organization. We offer customized workshops, retreats, and ongoing support.',
          ctaText: 'Partner With Us',
          ctaLink: '/contact'
        }),
        requiredFields: JSON.stringify(['title', 'description', 'ctaText', 'ctaLink']),
        isVisible: 1
      },
      {
        pageId: 60011,
        sectionType: 'content',
        sectionOrder: 4,
        title: 'For Individuals',
        content: JSON.stringify({
          sectionId: 'individuals',
          title: 'For Individuals',
          description: 'Join our community of conscious women committed to personal and collective transformation. Access programs, resources, and a supportive network of fellow travelers.',
          ctaText: 'Explore Offerings',
          ctaLink: '/offerings'
        }),
        requiredFields: JSON.stringify(['title', 'description', 'ctaText', 'ctaLink']),
        isVisible: 1
      },
      {
        pageId: 60011,
        sectionType: 'quote',
        sectionOrder: 5,
        title: 'Quote Section',
        content: JSON.stringify({
          sectionId: 'quote',
          text: 'We do not walk alone. We walk together, each step a prayer, each breath a blessing.',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Tri-Cover-1280x960.jpg'
        }),
        requiredFields: JSON.stringify(['text', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60011,
        sectionType: 'footer',
        sectionOrder: 6,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== RESOURCES PAGE (pageId: 60010) =====
      {
        pageId: 60010,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60010,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Resources',
          subtitle: 'TOOLS FOR TRANSFORMATION',
          description: 'Free resources to support your journey of embodied empowerment',
          videoUrl: '',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Fam.jpg'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60010,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Resource Categories',
        content: JSON.stringify({
          categories: [
            { name: 'Guides', slug: 'guides', description: 'Comprehensive guides for personal growth' },
            { name: 'Worksheets', slug: 'worksheets', description: 'Interactive worksheets and exercises' },
            { name: 'Meditations', slug: 'meditations', description: 'Guided meditations and audio resources' },
            { name: 'Articles', slug: 'articles', description: 'In-depth articles and essays' }
          ]
        }),
        requiredFields: JSON.stringify(['categories']),
        isVisible: 1
      },
      {
        pageId: 60010,
        sectionType: 'newsletter',
        sectionOrder: 3,
        title: 'Newsletter Section',
        content: JSON.stringify({
          title: 'Get Free Resources',
          description: 'Subscribe to receive exclusive resources, guides, and transformational tools delivered to your inbox.'
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60010,
        sectionType: 'footer',
        sectionOrder: 4,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== COMMUNITY EVENTS PAGE (pageId: 60009) =====
      {
        pageId: 60009,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60009,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Community Events',
          subtitle: 'GATHER WITH US',
          description: 'Local gatherings and community-led experiences',
          videoUrl: '',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Fam.jpg'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60009,
        sectionType: 'calendar',
        sectionOrder: 2,
        title: 'Events Calendar',
        content: JSON.stringify({
          title: 'Upcoming Events',
          description: 'Join us for transformational gatherings, workshops, and community experiences.',
          events: []
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60009,
        sectionType: 'newsletter',
        sectionOrder: 3,
        title: 'Newsletter Section',
        content: JSON.stringify({
          title: 'Stay Informed',
          description: 'Subscribe to receive updates about upcoming events and community gatherings.'
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60009,
        sectionType: 'footer',
        sectionOrder: 4,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== BLOG PAGE (pageId: 60007) =====
      {
        pageId: 60007,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60007,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'She Writes',
          subtitle: 'THE JOURNAL',
          description: 'Reflections, wisdom, and stories from our community of conscious leaders',
          videoUrl: '',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60007,
        sectionType: 'articles',
        sectionOrder: 2,
        title: 'Blog Articles',
        content: JSON.stringify({
          title: 'Latest Articles',
          description: 'Insights on embodied transformation, conscious leadership, and the rise of her.',
          articlesPerPage: 9
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60007,
        sectionType: 'newsletter',
        sectionOrder: 3,
        title: 'Newsletter Section',
        content: JSON.stringify({
          title: 'Subscribe to She Writes',
          description: 'Receive new articles and wisdom directly in your inbox.'
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60007,
        sectionType: 'footer',
        sectionOrder: 4,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== SHOP PAGE (pageId: 60008) =====
      {
        pageId: 60008,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60008,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Shop',
          subtitle: 'SACRED OFFERINGS',
          description: 'Curated products to support your journey of transformation',
          videoUrl: '',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60008,
        sectionType: 'products',
        sectionOrder: 2,
        title: 'Products Grid',
        content: JSON.stringify({
          title: 'Our Products',
          categories: [
            { name: 'Books', slug: 'books', description: 'Transformative literature' },
            { name: 'Journals', slug: 'journals', description: 'Guided journaling experiences' },
            { name: 'Apparel', slug: 'apparel', description: 'Conscious fashion' },
            { name: 'Accessories', slug: 'accessories', description: 'Mindful accessories' }
          ]
        }),
        requiredFields: JSON.stringify(['title', 'categories']),
        isVisible: 1
      },
      {
        pageId: 60008,
        sectionType: 'footer',
        sectionOrder: 3,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== VISION & ETHOS PAGE (pageId: 60003) =====
      {
        pageId: 60003,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60003,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Vision & Ethos',
          subtitle: 'OUR VISION',
          description: 'Embodiment Over Intellectualization',
          videoUrl: '',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60003,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Our Vision',
        content: JSON.stringify({
          sectionId: 'vision',
          title: 'Our Vision',
          paragraph1: 'We envision a world where women lead from a place of wholeness, authenticity, and embodied wisdom.',
          paragraph2: 'A world where the feminine principle is honored as essential to collective healing and transformation.'
        }),
        requiredFields: JSON.stringify(['title', 'paragraph1', 'paragraph2']),
        isVisible: 1
      },
      {
        pageId: 60003,
        sectionType: 'content',
        sectionOrder: 3,
        title: 'Our Ethos',
        content: JSON.stringify({
          sectionId: 'ethos',
          title: 'Our Ethos',
          paragraph1: 'We believe that true transformation is not a concept—it is a lived experience.',
          paragraph2: 'Our approach integrates ancient wisdom with modern understanding, honoring the body as a vessel of knowledge.',
          paragraph3: 'We practice sacred reciprocity, recognizing our interconnection with all of life.'
        }),
        requiredFields: JSON.stringify(['title', 'paragraph1', 'paragraph2', 'paragraph3']),
        isVisible: 1
      },
      {
        pageId: 60003,
        sectionType: 'newsletter',
        sectionOrder: 4,
        title: 'Newsletter Section',
        content: JSON.stringify({
          title: 'Join Our Vision',
          description: 'Subscribe to receive updates and wisdom as we build this new paradigm together.'
        }),
        requiredFields: JSON.stringify(['title', 'description']),
        isVisible: 1
      },
      {
        pageId: 60003,
        sectionType: 'footer',
        sectionOrder: 5,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== WORKSHOPS & PROGRAMS PAGE (pageId: 60005) =====
      {
        pageId: 60005,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60005,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'Workshops & Programs',
          subtitle: 'TRANSFORMATIVE EXPERIENCES',
          description: 'Immersive journeys designed to awaken your authentic power',
          videoUrl: '',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Fam.jpg'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60005,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Programs Overview',
        content: JSON.stringify({
          sectionId: 'overview',
          title: 'Our Programs',
          paragraph1: 'Each program is designed to create lasting transformation through embodied practices, community connection, and deep inner work.',
          paragraph2: 'Whether you join us for a single workshop or commit to a longer journey, you will be held in a container of safety, support, and sacred witnessing.'
        }),
        requiredFields: JSON.stringify(['title', 'paragraph1', 'paragraph2']),
        isVisible: 1
      },
      {
        pageId: 60005,
        sectionType: 'grid',
        sectionOrder: 3,
        title: 'Programs Grid',
        content: JSON.stringify({
          programs: [
            {
              title: 'Seeds of a New Paradigm',
              description: 'Our foundational 12-week program for women ready to reclaim their power.',
              duration: '12 weeks',
              format: 'Online + In-Person Retreat'
            },
            {
              title: 'Embodied Leadership Intensive',
              description: 'A deep dive into somatic leadership practices.',
              duration: '6 weeks',
              format: 'Online'
            },
            {
              title: 'Sacred Circle Facilitator Training',
              description: 'Learn to hold transformational space for others.',
              duration: '8 weeks',
              format: 'Hybrid'
            }
          ]
        }),
        requiredFields: JSON.stringify(['programs']),
        isVisible: 1
      },
      {
        pageId: 60005,
        sectionType: 'cta',
        sectionOrder: 4,
        title: 'Call to Action',
        content: JSON.stringify({
          title: 'Ready to Begin?',
          description: 'Schedule a discovery call to find the right program for your journey.',
          ctaText: 'Book a Call',
          ctaLink: '/contact'
        }),
        requiredFields: JSON.stringify(['title', 'description', 'ctaText', 'ctaLink']),
        isVisible: 1
      },
      {
        pageId: 60005,
        sectionType: 'footer',
        sectionOrder: 5,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      },

      // ===== VI•X JOURNAL TRILOGY PAGE (pageId: 60006) =====
      {
        pageId: 60006,
        sectionType: 'header',
        sectionOrder: 0,
        title: 'Header Navigation',
        content: JSON.stringify({
          logo: '/logo.svg',
          navItems: ['Philosophy', 'Offerings', 'Shop', 'Community Events', 'Resources', 'Walk With Us', 'Contact']
        }),
        requiredFields: JSON.stringify(['navItems', 'logo']),
        isVisible: 1
      },
      {
        pageId: 60006,
        sectionType: 'hero',
        sectionOrder: 1,
        title: 'Hero Section',
        content: JSON.stringify({
          title: 'VI • X Journal Trilogy',
          subtitle: 'THE WRITTEN WORD',
          description: 'A collection of reflections, wisdom, and transformative writings',
          videoUrl: '',
          imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/IMG_3018.jpg'
        }),
        requiredFields: JSON.stringify(['title', 'subtitle', 'description', 'imageUrl']),
        isVisible: 1
      },
      {
        pageId: 60006,
        sectionType: 'content',
        sectionOrder: 2,
        title: 'Trilogy Overview',
        content: JSON.stringify({
          title: 'The MOM VI•X Journal Trilogy',
          description: 'A three-volume healing journey for maternal lineage work and intergenerational transformation. Each journal guides you through a different aspect of the mother-daughter relationship and ancestral healing.',
          volume1_title: 'Volume I: Roots',
          volume1_description: 'Exploring your maternal lineage and inherited patterns.',
          volume2_title: 'Volume II: Reckoning',
          volume2_description: 'Processing grief, anger, and the wounds of the mother wound.',
          volume3_title: 'Volume III: Rising',
          volume3_description: 'Integrating your healing and stepping into your power.'
        }),
        requiredFields: JSON.stringify(['title', 'description', 'volume1_title', 'volume1_description', 'volume2_title', 'volume2_description', 'volume3_title', 'volume3_description']),
        isVisible: 1
      },
      {
        pageId: 60006,
        sectionType: 'cta',
        sectionOrder: 3,
        title: 'Purchase Section',
        content: JSON.stringify({
          title: 'Begin Your Journey',
          description: 'The complete trilogy is available now.',
          ctaText: 'Shop Now',
          ctaLink: '/shop'
        }),
        requiredFields: JSON.stringify(['title', 'description', 'ctaText', 'ctaLink']),
        isVisible: 1
      },
      {
        pageId: 60006,
        sectionType: 'footer',
        sectionOrder: 4,
        title: 'Footer',
        content: JSON.stringify({
          copyright: '© 2025 Just Empower. All rights reserved.',
          socialLinks: {
            instagram: 'https://instagram.com/justxempower',
            linkedin: 'https://linkedin.com/company/justxempower'
          }
        }),
        requiredFields: JSON.stringify(['copyright', 'socialLinks']),
        isVisible: 1
      }
    ];

    console.log(`\nClearing existing pageSections for pages we're updating...`);
    
    // Get unique pageIds we're updating
    const pageIdsToUpdate = [...new Set(allPageSections.map(s => s.pageId))];
    
    for (const pageId of pageIdsToUpdate) {
      await connection.execute('DELETE FROM pageSections WHERE pageId = ?', [pageId]);
    }
    
    console.log(`Inserting ${allPageSections.length} sections for ${pageIdsToUpdate.length} pages...`);
    
    let insertedCount = 0;
    let errorCount = 0;

    for (const section of allPageSections) {
      try {
        await connection.execute(
          `INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [section.pageId, section.sectionType, section.sectionOrder, section.title, section.content, section.requiredFields, section.isVisible]
        );
        insertedCount++;
      } catch (err) {
        console.error(`  ✗ Failed to insert section "${section.title}" for pageId ${section.pageId}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n========================================`);
    console.log(`Page Sections Seed Completed!`);
    console.log(`  Inserted: ${insertedCount} sections`);
    console.log(`  Pages updated: ${pageIdsToUpdate.length}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`========================================`);

  } finally {
    await connection.end();
  }
}

seedPageSections().catch(console.error);
