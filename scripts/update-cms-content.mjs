/**
 * Update CMS content with correct data from commit 62d36e4
 * This script updates the siteContent table with all the proper content
 */

import mysql from 'mysql2/promise';

async function updateCMSContent() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // All content data from commit 62d36e4
    const contentData = [
      // ===== HOME PAGE =====
      { page: "home", section: "hero", contentKey: "title", contentValue: "Catalyzing the Rise of Her" },
      { page: "home", section: "hero", contentKey: "subtitle", contentValue: "Welcome to Just Empower" },
      { page: "home", section: "hero", contentKey: "description", contentValue: "Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership." },
      { page: "home", section: "hero", contentKey: "subDescription", contentValue: "Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership." },
      { page: "home", section: "hero", contentKey: "videoUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/home-slide-1.mp4" },
      { page: "home", section: "hero", contentKey: "buttonText", contentValue: "Discover More" },
      { page: "home", section: "hero", contentKey: "ctaText", contentValue: "Discover More" },
      { page: "home", section: "hero", contentKey: "buttonLink", contentValue: "/founder" },
      { page: "home", section: "hero", contentKey: "ctaLink", contentValue: "/founder" },
      
      { page: "home", section: "philosophy", contentKey: "title", contentValue: "The Philosophy" },
      { page: "home", section: "philosophy", contentKey: "label", contentValue: "Our Approach" },
      { page: "home", section: "philosophy", contentKey: "subtitle", contentValue: "Our Approach" },
      { page: "home", section: "philosophy", contentKey: "description", contentValue: "Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity—and radiates outward into the structures we shape, steward, and reimagine." },
      { page: "home", section: "philosophy", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/12/IMG_0513-1280x1358.jpg" },
      { page: "home", section: "philosophy", contentKey: "ctaText", contentValue: "Discover More" },
      { page: "home", section: "philosophy", contentKey: "ctaLink", contentValue: "/philosophy/vision-ethos" },
      
      { page: "home", section: "community", contentKey: "title", contentValue: "Emerge With Us" },
      { page: "home", section: "community", contentKey: "label", contentValue: "Community" },
      { page: "home", section: "community", contentKey: "subtitle", contentValue: "Community" },
      { page: "home", section: "community", contentKey: "description", contentValue: "We are planting seeds for a new paradigm—one rooted in consciousness, compassion, and sacred reciprocity. This is an invitation for women ready to move beyond survival patterns and into grounded discernment, embodied presence, and conscious self-authority." },
      { page: "home", section: "community", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Tri-Cover-1280x960.jpg" },
      { page: "home", section: "community", contentKey: "ctaText", contentValue: "Walk With Us" },
      { page: "home", section: "community", contentKey: "ctaLink", contentValue: "/walk-with-us" },
      
      { page: "home", section: "rootedUnity", contentKey: "title", contentValue: "Rooted Unity" },
      { page: "home", section: "rootedUnity", contentKey: "label", contentValue: "Coming 2026" },
      { page: "home", section: "rootedUnity", contentKey: "subtitle", contentValue: "Coming 2026" },
      { page: "home", section: "rootedUnity", contentKey: "description", contentValue: "Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self." },
      { page: "home", section: "rootedUnity", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/forest-sunlight.jpg" },
      { page: "home", section: "rootedUnity", contentKey: "ctaText", contentValue: "Learn More" },
      { page: "home", section: "rootedUnity", contentKey: "ctaLink", contentValue: "/offerings/rooted-unity" },

      // ===== FOUNDER PAGE =====
      { page: "founder", section: "hero", contentKey: "title", contentValue: "The Founder" },
      { page: "founder", section: "hero", contentKey: "subtitle", contentValue: "APRIL GAMBARDELLA" },
      { page: "founder", section: "hero", contentKey: "description", contentValue: "Steward of Embodied Change & Energetic Coherence" },
      { page: "founder", section: "hero", contentKey: "videoUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/09/seeds-of-power.mp4" },
      { page: "founder", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Fam.jpg" },
      
      { page: "founder", section: "opening", contentKey: "paragraph1", contentValue: "From the moment my eyes opened to this world, I have been drawn to truth—not from a need to know, but from a need to understand. This inclination was nurtured by my mother, who taught me that true stewardship means leaving everything better than we found it: a space, a system, or the Earth itself." },
      { page: "founder", section: "opening", contentKey: "paragraph2", contentValue: "That ethos of restoration and responsibility became the ground of my devotion. Over time, it expanded beyond personal integrity into a greater mission: empowering visionaries, reimagining inherited systems, and contributing to planetary regeneration." },
      { page: "founder", section: "opening", contentKey: "paragraph3", contentValue: "Just as we are responsible for the spaces we inhabit, we are stewards of the Earth, entrusted with its vitality." },
      
      { page: "founder", section: "truth", contentKey: "title", contentValue: "Just Empower is Built on This Truth" },
      { page: "founder", section: "truth", contentKey: "description", contentValue: "Real change is both individual and collective—an energetic imprint that reverberates through humanity and the living world alike." },
      
      { page: "founder", section: "depth", contentKey: "title", contentValue: "The Depth Beneath the Framework" },
      { page: "founder", section: "depth", contentKey: "paragraph1", contentValue: "Though my roots first took hold in Southern California, I have since grounded in the vibrant soils of Austin, Texas, a sanctuary that attuned my rhythm, mirrored my reinvention, and revealed the sacred nature of emergence." },
      { page: "founder", section: "depth", contentKey: "paragraph2", contentValue: "My understanding of trauma, healing, and transformation is not theoretical; it was forged through lived experience." },
      { page: "founder", section: "depth", contentKey: "paragraph3", contentValue: "With a degree in Communication Studies and a background in law, I came to know the mechanics of language, perception, and influence. Ongoing studies in consciousness, energy dynamics, and systemic change offered the scaffolding, but it was the descent itself that transmuted knowledge into truth." },
      { page: "founder", section: "depth", contentKey: "paragraph4", contentValue: "I was not taught—I was tempered. Not by intellect, but by initiation." },
      { page: "founder", section: "depth", contentKey: "paragraph5", contentValue: "The truths I carry were etched into the language of my body as knowing. What emerged now lives within our offerings and through the field of Just Empower." },
      
      { page: "founder", section: "remembrance", contentKey: "title", contentValue: "A Thread of Remembrance" },
      { page: "founder", section: "remembrance", contentKey: "quote", contentValue: "We do not rise by climbing over others. We rise by lifting as we climb—and sometimes, by descending into the depths to retrieve what was lost." },
      { page: "founder", section: "remembrance", contentKey: "paragraph1", contentValue: "There is a thread that runs through all of my work—a golden filament of remembrance. It whispers of a time when women gathered in circles, when wisdom was passed through story and song, when the Earth was honored as mother and teacher." },
      { page: "founder", section: "remembrance", contentKey: "paragraph2", contentValue: "This thread is not nostalgia. It is a living pulse, calling us forward into a future that honors what came before while creating something entirely new." },
      { page: "founder", section: "remembrance", contentKey: "paragraph3", contentValue: "Just Empower is my offering to this remembrance. It is a space where women can reclaim their voices, their bodies, their sovereignty. Where healing happens not in isolation, but in community. Where transformation is not a destination, but a way of being." },
      { page: "founder", section: "remembrance", contentKey: "paragraph4", contentValue: "I invite you to walk with me on this path. Not as followers, but as fellow travelers. Each of us carrying our own medicine, our own gifts, our own piece of the puzzle." },
      
      { page: "founder", section: "renewal", contentKey: "title", contentValue: "The Art of Renewal" },
      { page: "founder", section: "renewal", contentKey: "paragraph1", contentValue: "Renewal is not about becoming someone new. It is about returning to who you have always been—beneath the conditioning, the expectations, the stories you were told about who you should be." },
      { page: "founder", section: "renewal", contentKey: "paragraph2", contentValue: "This is the work I am devoted to. This is the invitation I extend to every woman who feels the stirring of something more within her." },
      
      { page: "founder", section: "future", contentKey: "title", contentValue: "Looking Forward" },
      { page: "founder", section: "future", contentKey: "paragraph1", contentValue: "As we stand at this threshold of collective transformation, I am filled with both reverence and anticipation. The old paradigms are crumbling, and in their place, something new is being born." },
      { page: "founder", section: "future", contentKey: "paragraph2", contentValue: "Just Empower is part of this birthing. We are midwives to a new way of being—one that honors the feminine, respects the Earth, and recognizes the inherent dignity of all life." },
      { page: "founder", section: "future", contentKey: "paragraph3", contentValue: "I do not know exactly what this future will look like. But I know it will be built by women who have done the inner work. Women who have faced their shadows and emerged with greater compassion. Women who lead not from ego, but from essence." },
      { page: "founder", section: "future", contentKey: "paragraph4", contentValue: "If you feel called to this work, I welcome you. The path is not always easy, but it is always worth walking." },
      
      { page: "founder", section: "newsletter", contentKey: "title", contentValue: "Stay Connected" },
      { page: "founder", section: "newsletter", contentKey: "description", contentValue: "Join our community and receive monthly reflections, wisdom, and updates on upcoming offerings." },

      // ===== ABOUT PAGE (Legacy - redirects to founder) =====
      { page: "about", section: "hero", contentKey: "title", contentValue: "The Founder" },
      { page: "about", section: "hero", contentKey: "subtitle", contentValue: "APRIL GAMBARDELLA" },
      { page: "about", section: "hero", contentKey: "description", contentValue: "Steward of Embodied Change & Energetic Coherence" },
      { page: "about", section: "hero", contentKey: "videoUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/09/seeds-of-power.mp4" },
      { page: "about", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Fam.jpg" },
      
      { page: "about", section: "opening", contentKey: "paragraph1", contentValue: "From the moment my eyes opened to this world, I have been drawn to truth—not from a need to know, but from a need to understand. This inclination was nurtured by my mother, who taught me that true stewardship means leaving everything better than we found it: a space, a system, or the Earth itself." },
      { page: "about", section: "opening", contentKey: "paragraph2", contentValue: "That ethos of restoration and responsibility became the ground of my devotion. Over time, it expanded beyond personal integrity into a greater mission: empowering visionaries, reimagining inherited systems, and contributing to planetary regeneration." },
      { page: "about", section: "opening", contentKey: "paragraph3", contentValue: "Just as we are responsible for the spaces we inhabit, we are stewards of the Earth, entrusted with its vitality." },
      
      { page: "about", section: "truth", contentKey: "title", contentValue: "Just Empower is Built on This Truth" },
      { page: "about", section: "truth", contentKey: "description", contentValue: "Real change is both individual and collective—an energetic imprint that reverberates through humanity and the living world alike." },
      
      { page: "about", section: "depth", contentKey: "title", contentValue: "The Depth Beneath the Framework" },
      { page: "about", section: "depth", contentKey: "paragraph1", contentValue: "Though my roots first took hold in Southern California, I have since grounded in the vibrant soils of Austin, Texas, a sanctuary that attuned my rhythm, mirrored my reinvention, and revealed the sacred nature of emergence." },
      { page: "about", section: "depth", contentKey: "paragraph2", contentValue: "My understanding of trauma, healing, and transformation is not theoretical; it was forged through lived experience." },
      { page: "about", section: "depth", contentKey: "paragraph3", contentValue: "With a degree in Communication Studies and a background in law, I came to know the mechanics of language, perception, and influence. Ongoing studies in consciousness, energy dynamics, and systemic change offered the scaffolding, but it was the descent itself that transmuted knowledge into truth." },
      { page: "about", section: "depth", contentKey: "paragraph4", contentValue: "I was not taught—I was tempered. Not by intellect, but by initiation." },
      { page: "about", section: "depth", contentKey: "paragraph5", contentValue: "The truths I carry were etched into the language of my body as knowing. What emerged now lives within our offerings and through the field of Just Empower." },
      
      { page: "about", section: "remembrance", contentKey: "title", contentValue: "A Thread of Remembrance" },
      { page: "about", section: "remembrance", contentKey: "quote", contentValue: "We do not rise by climbing over others. We rise by lifting as we climb—and sometimes, by descending into the depths to retrieve what was lost." },
      { page: "about", section: "remembrance", contentKey: "paragraph1", contentValue: "There is a thread that runs through all of my work—a golden filament of remembrance. It whispers of a time when women gathered in circles, when wisdom was passed through story and song, when the Earth was honored as mother and teacher." },
      { page: "about", section: "remembrance", contentKey: "paragraph2", contentValue: "This thread is not nostalgia. It is a living pulse, calling us forward into a future that honors what came before while creating something entirely new." },
      { page: "about", section: "remembrance", contentKey: "paragraph3", contentValue: "Just Empower is my offering to this remembrance. It is a space where women can reclaim their voices, their bodies, their sovereignty. Where healing happens not in isolation, but in community. Where transformation is not a destination, but a way of being." },
      { page: "about", section: "remembrance", contentKey: "paragraph4", contentValue: "I invite you to walk with me on this path. Not as followers, but as fellow travelers. Each of us carrying our own medicine, our own gifts, our own piece of the puzzle." },
      
      { page: "about", section: "renewal", contentKey: "title", contentValue: "The Art of Renewal" },
      { page: "about", section: "renewal", contentKey: "paragraph1", contentValue: "Renewal is not about becoming someone new. It is about returning to who you have always been—beneath the conditioning, the expectations, the stories you were told about who you should be." },
      { page: "about", section: "renewal", contentKey: "paragraph2", contentValue: "This is the work I am devoted to. This is the invitation I extend to every woman who feels the stirring of something more within her." },
      
      { page: "about", section: "future", contentKey: "title", contentValue: "Looking Forward" },
      { page: "about", section: "future", contentKey: "paragraph1", contentValue: "As we stand at this threshold of collective transformation, I am filled with both reverence and anticipation. The old paradigms are crumbling, and in their place, something new is being born." },
      { page: "about", section: "future", contentKey: "paragraph2", contentValue: "Just Empower is part of this birthing. We are midwives to a new way of being—one that honors the feminine, respects the Earth, and recognizes the inherent dignity of all life." },
      { page: "about", section: "future", contentKey: "paragraph3", contentValue: "I do not know exactly what this future will look like. But I know it will be built by women who have done the inner work. Women who have faced their shadows and emerged with greater compassion. Women who lead not from ego, but from essence." },
      { page: "about", section: "future", contentKey: "paragraph4", contentValue: "If you feel called to this work, I welcome you. The path is not always easy, but it is always worth walking." },
      
      { page: "about", section: "newsletter", contentKey: "title", contentValue: "Stay Connected" },
      { page: "about", section: "newsletter", contentKey: "description", contentValue: "Join our community and receive monthly reflections, wisdom, and updates on upcoming offerings." },

      // ===== PHILOSOPHY PAGE =====
      { page: "philosophy", section: "hero", contentKey: "title", contentValue: "Our Philosophy" },
      { page: "philosophy", section: "hero", contentKey: "subtitle", contentValue: "EMBODIMENT OVER INTELLECTUALIZATION" },
      { page: "philosophy", section: "hero", contentKey: "description", contentValue: "True transformation is not a concept—it is a lived experience." },
      { page: "philosophy", section: "hero", contentKey: "videoUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/home-fog-slide-3.mp4" },
      
      { page: "philosophy", section: "main", contentKey: "paragraph1", contentValue: "Just Empower is rooted in the understanding that real change happens not in the mind alone, but in the body, the nervous system, and the energetic field." },
      { page: "philosophy", section: "main", contentKey: "paragraph2", contentValue: "We honor the intelligence of the feminine—the intuitive, the cyclical, the regenerative. Our work bridges ancient wisdom and modern science to create pathways of healing that are both grounded and transcendent." },

      // ===== VISION & ETHOS PAGE =====
      { page: "vision-ethos", section: "hero", contentKey: "subtitle", contentValue: "OUR VISION" },
      { page: "vision-ethos", section: "hero", contentKey: "title", contentValue: "Vision & Ethos" },
      { page: "vision-ethos", section: "hero", contentKey: "description", contentValue: "Embodiment Over Intellectualization" },
      { page: "vision-ethos", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg" },
      
      { page: "vision-ethos", section: "vision", contentKey: "title", contentValue: "Our Vision" },
      { page: "vision-ethos", section: "vision", contentKey: "paragraph1", contentValue: "We envision a world where women lead from a place of wholeness, authenticity, and embodied wisdom." },
      { page: "vision-ethos", section: "vision", contentKey: "paragraph2", contentValue: "A world where the feminine principle is honored as essential to collective healing and transformation." },
      
      { page: "vision-ethos", section: "ethos", contentKey: "title", contentValue: "Our Ethos" },
      { page: "vision-ethos", section: "ethos", contentKey: "paragraph1", contentValue: "We believe that true transformation is not a concept—it is a lived experience." },
      { page: "vision-ethos", section: "ethos", contentKey: "paragraph2", contentValue: "Our approach integrates ancient wisdom with modern understanding, honoring the body as a vessel of knowledge." },
      { page: "vision-ethos", section: "ethos", contentKey: "paragraph3", contentValue: "We practice sacred reciprocity, recognizing our interconnection with all of life." },

      // ===== OFFERINGS PAGE =====
      { page: "offerings", section: "hero", contentKey: "title", contentValue: "Our Offerings" },
      { page: "offerings", section: "hero", contentKey: "subtitle", contentValue: "SEEDS OF A NEW PARADIGM" },
      { page: "offerings", section: "hero", contentKey: "description", contentValue: "Transformational programs designed to restore alignment and catalyze conscious leadership." },
      { page: "offerings", section: "hero", contentKey: "videoUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/09/seeds-of-video-2.mp4" },

      // ===== WORKSHOPS & PROGRAMS PAGE =====
      { page: "workshops-programs", section: "hero", contentKey: "subtitle", contentValue: "TRANSFORMATIVE EXPERIENCES" },
      { page: "workshops-programs", section: "hero", contentKey: "title", contentValue: "Workshops & Programs" },
      { page: "workshops-programs", section: "hero", contentKey: "description", contentValue: "Immersive journeys designed to awaken your authentic power" },
      { page: "workshops-programs", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Fam.jpg" },
      
      { page: "workshops-programs", section: "overview", contentKey: "title", contentValue: "Our Programs" },
      { page: "workshops-programs", section: "overview", contentKey: "paragraph1", contentValue: "Each program is designed to create lasting transformation through embodied practices, community connection, and deep inner work." },
      { page: "workshops-programs", section: "overview", contentKey: "paragraph2", contentValue: "Whether you join us for a single workshop or commit to a longer journey, you will be held in a container of safety, support, and sacred witnessing." },

      // ===== VI•X JOURNAL TRILOGY PAGE =====
      { page: "vix-journal-trilogy", section: "hero", contentKey: "subtitle", contentValue: "THE WRITTEN WORD" },
      { page: "vix-journal-trilogy", section: "hero", contentKey: "title", contentValue: "VI • X Journal Trilogy" },
      { page: "vix-journal-trilogy", section: "hero", contentKey: "description", contentValue: "A collection of reflections, wisdom, and transformative writings" },
      { page: "vix-journal-trilogy", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/IMG_3018.jpg" },

      // ===== BLOG PAGE =====
      { page: "blog", section: "hero", contentKey: "subtitle", contentValue: "SHE WRITES" },
      { page: "blog", section: "hero", contentKey: "title", contentValue: "Blog" },
      { page: "blog", section: "hero", contentKey: "description", contentValue: "Reflections, wisdom, and stories from our community of conscious leaders" },
      { page: "blog", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg" },

      // ===== JOURNAL PAGE =====
      { page: "journal", section: "hero", contentKey: "title", contentValue: "The Journal" },
      { page: "journal", section: "hero", contentKey: "subtitle", contentValue: "WISDOM & REFLECTIONS" },
      { page: "journal", section: "hero", contentKey: "description", contentValue: "Insights on embodied transformation, conscious leadership, and the rise of her." },
      { page: "journal", section: "hero", contentKey: "videoUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/home-fog-slide-3.mp4" },

      // ===== CONTACT PAGE =====
      { page: "contact", section: "hero", contentKey: "title", contentValue: "Connect" },
      { page: "contact", section: "hero", contentKey: "subtitle", contentValue: "BEGIN THE CONVERSATION" },
      { page: "contact", section: "hero", contentKey: "description", contentValue: "Reach out to explore how we can support your journey." },
      { page: "contact", section: "hero", contentKey: "videoUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/home-top-2.mp4" },
      
      { page: "contact", section: "info", contentKey: "email", contentValue: "partners@justxempower.com" },
      { page: "contact", section: "info", contentKey: "phone", contentValue: "(512) 730-9586" },
      { page: "contact", section: "info", contentKey: "address", contentValue: "Austin, Texas" },

      // ===== RESOURCES PAGE =====
      { page: "resources", section: "hero", contentKey: "subtitle", contentValue: "TOOLS FOR TRANSFORMATION" },
      { page: "resources", section: "hero", contentKey: "title", contentValue: "Resources" },
      { page: "resources", section: "hero", contentKey: "description", contentValue: "Free resources to support your journey of embodied empowerment" },
      { page: "resources", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Fam.jpg" },

      // ===== WALK WITH US PAGE =====
      { page: "walk-with-us", section: "hero", contentKey: "subtitle", contentValue: "JOIN THE JOURNEY" },
      { page: "walk-with-us", section: "hero", contentKey: "title", contentValue: "Walk With Us" },
      { page: "walk-with-us", section: "hero", contentKey: "description", contentValue: "Ways to connect, contribute, and become part of our community" },
      { page: "walk-with-us", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg" },

      // ===== COMMUNITY EVENTS PAGE =====
      { page: "community-events", section: "hero", contentKey: "subtitle", contentValue: "GATHER WITH US" },
      { page: "community-events", section: "hero", contentKey: "title", contentValue: "Community Events" },
      { page: "community-events", section: "hero", contentKey: "description", contentValue: "Local gatherings and community-led experiences" },
      { page: "community-events", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Fam.jpg" },

      // ===== SHOP PAGE =====
      { page: "shop", section: "hero", contentKey: "subtitle", contentValue: "SACRED OFFERINGS" },
      { page: "shop", section: "hero", contentKey: "title", contentValue: "Shop" },
      { page: "shop", section: "hero", contentKey: "description", contentValue: "Curated products to support your journey of transformation" },
      { page: "shop", section: "hero", contentKey: "imageUrl", contentValue: "https://justxempower-assets.s3.us-east-1.amazonaws.com/media/11/Lavender1.jpg" },
    ];

    console.log(`\nUpdating ${contentData.length} content entries...`);
    
    let updatedCount = 0;
    let insertedCount = 0;
    let errorCount = 0;

    for (const content of contentData) {
      try {
        // Try to update first
        const [updateResult] = await connection.execute(
          'UPDATE siteContent SET contentValue = ?, updatedAt = NOW() WHERE page = ? AND section = ? AND contentKey = ?',
          [content.contentValue, content.page, content.section, content.contentKey]
        );
        
        if (updateResult.affectedRows > 0) {
          updatedCount++;
        } else {
          // Insert if not exists
          await connection.execute(
            'INSERT INTO siteContent (page, section, contentKey, contentValue, updatedAt) VALUES (?, ?, ?, ?, NOW())',
            [content.page, content.section, content.contentKey, content.contentValue]
          );
          insertedCount++;
        }
      } catch (err) {
        console.error(`  ✗ Failed ${content.page}/${content.section}/${content.contentKey}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n========================================`);
    console.log(`CMS Content Update Complete!`);
    console.log(`  Updated: ${updatedCount} entries`);
    console.log(`  Inserted: ${insertedCount} new entries`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`========================================`);

  } finally {
    await connection.end();
  }
}

updateCMSContent().catch(console.error);
