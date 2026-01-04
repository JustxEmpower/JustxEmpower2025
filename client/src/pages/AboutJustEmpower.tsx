import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

export default function AboutJustEmpower() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('about-just-empower');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Get content from CMS with minimal fallbacks
  const heroTitle = getContent('hero', 'title') || 'About Just Empower';
  const heroSubtitle = getContent('hero', 'subtitle') || 'Restoring Alignment · Reimagining Culture · Empowering Her Voice';
  const heroImageUrl = getContent('hero', 'imageUrl') || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2088';

  const introText = getContent('intro', 'content') || 'Just Empower™ is a women-centered initiative devoted to restoring inner alignment and advancing cultural regeneration. We operate at the intersection of personal transformation and systemic change—helping women rebuild from the inside out so their clarity and leadership ripple through families, organizations, and communities.';

  const missionTitle = getContent('mission', 'title') || 'Our Mission';
  const missionDescription = getContent('mission', 'description') || 'Through somatic restoration, subconscious re-patterning, and collective empowerment, we dissolve inherited limitations and reimagine systems rooted in equity, coherence, and sustainable change.';
  const missionIntro = getContent('mission', 'intro') || 'Our mission is realized through three integrated pillars:';

  const pillar1Title = getContent('pillar1', 'title') || 'Personal Empowerment';
  const pillar1Desc = getContent('pillar1', 'description') || 'Somatic restoration and embodied leadership development for individual transformation.';

  const pillar2Title = getContent('pillar2', 'title') || 'Collective Empowerment';
  const pillar2Desc = getContent('pillar2', 'description') || 'Community-based initiatives that strengthen networks and amplify women\'s voices.';

  const pillar3Title = getContent('pillar3', 'title') || 'Systemic Change';
  const pillar3Desc = getContent('pillar3', 'description') || 'Strategic partnerships and advocacy to reshape organizational and cultural systems.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${heroImageUrl}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6 tracking-wide">
            {heroTitle}
          </h1>
          <p className="text-xl md:text-2xl font-light italic tracking-wider">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl">
          <div className="prose prose-lg prose-stone mx-auto">
            <p className="text-xl leading-relaxed text-stone-700 mb-8">
              {introText}
            </p>

            <p className="text-lg leading-relaxed text-stone-600 mb-8">
              {getContent('intro', 'content2') || 'Rooted in trauma-informed and research-supported frameworks, we honor the regenerative capacity and intuitive intelligence within every woman. Our work bridges psychology, embodiment, and social innovation to create sustainable models of empowerment that endure beyond inspiration.'}
            </p>

            <p className="text-lg leading-relaxed text-stone-600 mb-12">
              {getContent('intro', 'content3') || 'Through guided empowerment, transformational education, and community initiatives, we reconnect women to their voice, agency, and power to create lasting change.'}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-stone-900 text-stone-100">
        <div className="container max-w-5xl">
          <h2 className="font-serif text-4xl md:text-5xl text-center mb-12">
            {missionTitle}
          </h2>

          <p className="text-xl leading-relaxed text-center mb-12 max-w-3xl mx-auto">
            {missionDescription}
          </p>

          <p className="text-lg text-center mb-12 text-stone-300">
            {missionIntro}
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-stone-800/50 p-8 rounded-lg border border-stone-700">
              <h3 className="font-serif text-2xl mb-4 text-amber-200">
                {pillar1Title}
              </h3>
              <p className="text-stone-300 leading-relaxed">
                {pillar1Desc}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-stone-800/50 p-8 rounded-lg border border-stone-700">
              <h3 className="font-serif text-2xl mb-4 text-amber-200">
                {pillar2Title}
              </h3>
              <p className="text-stone-300 leading-relaxed">
                {pillar2Desc}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-stone-800/50 p-8 rounded-lg border border-stone-700">
              <h3 className="font-serif text-2xl mb-4 text-amber-200">
                {pillar3Title}
              </h3>
              <p className="text-stone-300 leading-relaxed">
                {pillar3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
