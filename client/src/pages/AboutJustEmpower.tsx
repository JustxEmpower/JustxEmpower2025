import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageSectionContent } from '@/hooks/usePageSectionContent';

export default function AboutJustEmpower() {
  const [location] = useLocation();
  const { getSection, isLoading } = usePageSectionContent('about-justxempower');

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

  // Get content from CMS
  const heroContent = getSection('hero');
  const heroTitle = heroContent.title || 'About JustxEmpower';
  const heroSubtitle = heroContent.subtitle || 'The Organization';
  const heroImageUrl = heroContent.imageUrl || '';

  const contentSection = getSection('content');
  const introText = contentSection.description || '';
  const introText2 = contentSection.content2 || '';
  const introText3 = contentSection.content3 || '';

  const missionTitle = contentSection.title || 'Our Mission';
  const missionDescription = contentSection.missionDescription || '';
  const missionIntro = contentSection.missionIntro || '';

  const pillar1Title = contentSection.pillar1Title || '';
  const pillar1Desc = contentSection.pillar1Description || '';

  const pillar2Title = contentSection.pillar2Title || '';
  const pillar2Desc = contentSection.pillar2Description || '';

  const pillar3Title = contentSection.pillar3Title || '';
  const pillar3Desc = contentSection.pillar3Description || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: heroImageUrl ? `url('${heroImageUrl}')` : undefined,
            backgroundColor: !heroImageUrl ? '#1c1917' : undefined,
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
            {introText && (
              <p className="text-xl leading-relaxed text-stone-700 mb-8">
                {introText}
              </p>
            )}

            {introText2 && (
              <p className="text-lg leading-relaxed text-stone-600 mb-8">
                {introText2}
              </p>
            )}

            {introText3 && (
              <p className="text-lg leading-relaxed text-stone-600 mb-12">
                {introText3}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      {(missionTitle || pillar1Title || pillar2Title || pillar3Title) && (
        <section className="py-20 px-6 bg-stone-900 text-stone-100">
          <div className="container max-w-5xl">
            {missionTitle && (
              <h2 className="font-serif text-4xl md:text-5xl text-center mb-12">
                {missionTitle}
              </h2>
            )}

            {missionDescription && (
              <p className="text-xl leading-relaxed text-center mb-12 max-w-3xl mx-auto">
                {missionDescription}
              </p>
            )}

            {missionIntro && (
              <p className="text-lg text-center mb-12 text-stone-300">
                {missionIntro}
              </p>
            )}

            <div className="grid md:grid-cols-3 gap-8">
              {/* Pillar 1 */}
              {pillar1Title && (
                <div className="bg-stone-800/50 p-8 rounded-lg border border-stone-700">
                  <h3 className="font-serif text-2xl mb-4 text-amber-200">
                    {pillar1Title}
                  </h3>
                  <p className="text-stone-300 leading-relaxed">
                    {pillar1Desc}
                  </p>
                </div>
              )}

              {/* Pillar 2 */}
              {pillar2Title && (
                <div className="bg-stone-800/50 p-8 rounded-lg border border-stone-700">
                  <h3 className="font-serif text-2xl mb-4 text-amber-200">
                    {pillar2Title}
                  </h3>
                  <p className="text-stone-300 leading-relaxed">
                    {pillar2Desc}
                  </p>
                </div>
              )}

              {/* Pillar 3 */}
              {pillar3Title && (
                <div className="bg-stone-800/50 p-8 rounded-lg border border-stone-700">
                  <h3 className="font-serif text-2xl mb-4 text-amber-200">
                    {pillar3Title}
                  </h3>
                  <p className="text-stone-300 leading-relaxed">
                    {pillar3Desc}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
