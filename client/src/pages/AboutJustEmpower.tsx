export default function AboutJustEmpower() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2088')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6 tracking-wide">
            About Just Empower
          </h1>
          <p className="text-xl md:text-2xl font-light italic tracking-wider">
            Restoring Alignment · Reimagining Culture · Empowering Her Voice
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl">
          <div className="prose prose-lg prose-stone mx-auto">
            <p className="text-xl leading-relaxed text-stone-700 mb-8">
              Just Empower™ is a women-centered initiative devoted to restoring
              inner alignment and advancing cultural regeneration. We operate at
              the intersection of personal transformation and systemic
              change—helping women rebuild from the inside out so their clarity
              and leadership ripple through families, organizations, and
              communities.
            </p>

            <p className="text-lg leading-relaxed text-stone-600 mb-8">
              Rooted in trauma-informed and research-supported frameworks, we
              honor the regenerative capacity and intuitive intelligence within
              every woman. Our work bridges psychology, embodiment, and social
              innovation to create sustainable models of empowerment that endure
              beyond inspiration.
            </p>

            <p className="text-lg leading-relaxed text-stone-600 mb-12">
              Through guided empowerment, transformational education, and
              community initiatives, we reconnect women to their voice, agency,
              and power to create lasting change.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-stone-900 text-stone-100">
        <div className="container max-w-5xl">
          <h2 className="font-serif text-4xl md:text-5xl text-center mb-12">
            Our Mission
          </h2>

          <p className="text-xl leading-relaxed text-center mb-12 max-w-3xl mx-auto">
            Through somatic restoration, subconscious re-patterning, and
            collective empowerment, we dissolve inherited limitations and
            reimagine systems rooted in equity, coherence, and sustainable
            change.
          </p>

          <p className="text-lg text-center mb-12 text-stone-300">
            Our mission is realized through three integrated pillars:
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-stone-800/50 p-8 rounded-lg border border-stone-700">
              <h3 className="font-serif text-2xl mb-4 text-amber-200">
                Personal Empowerment
              </h3>
              <p className="text-stone-300 leading-relaxed">
                Trauma-informed coaching, self-guided journeys, and programs
                that restore nervous-system balance and self-trust.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-stone-800/50 p-8 rounded-lg border border-stone-700">
              <h3 className="font-serif text-2xl mb-4 text-amber-200">
                Community & Cultural Initiatives
              </h3>
              <p className="text-stone-300 leading-relaxed">
                Collaborative projects that advance women's leadership, creative
                expression, and ecological responsibility.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-stone-800/50 p-8 rounded-lg border border-stone-700">
              <h3 className="font-serif text-2xl mb-4 text-amber-200">
                Systemic Regeneration
              </h3>
              <p className="text-stone-300 leading-relaxed">
                Partnerships with educators, businesses, and institutions to
                embed conscious leadership and human-centered design into
                organizational frameworks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-amber-50 to-stone-50">
        <div className="container max-w-4xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl mb-8 text-stone-900">
            Our Vision
          </h2>
          <p className="text-2xl leading-relaxed text-stone-700 font-light">
            Just Empower cultivates emotional resilience, embodied clarity, and
            transformational impact for women and communities worldwide.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-stone-900 text-center">
        <div className="container max-w-3xl">
          <h2 className="font-serif text-3xl md:text-4xl mb-6 text-stone-100">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-lg text-stone-300 mb-8">
            Discover how Just Empower can support your transformation and
            leadership.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/offerings"
              className="inline-block px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
            >
              Explore Our Offerings
            </a>
            <a
              href="/contact"
              className="inline-block px-8 py-4 bg-transparent border-2 border-stone-400 hover:border-amber-600 text-stone-100 hover:text-amber-400 font-medium rounded-lg transition-colors"
            >
              Connect With Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
