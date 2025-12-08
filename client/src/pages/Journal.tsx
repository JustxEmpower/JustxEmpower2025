import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Journal() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const posts = [
    {
      title: "The Alchemist's Path",
      category: "Transformation",
      date: "October 2025",
      excerpt: "Transforming wound into wisdom requires the heat of initiation. It is not a passive process, but an active engagement with the fires of change.",
      image: "/media/12/IMG_0513-1280x1358.jpg"
    },
    {
      title: "Universal Laws",
      category: "Wisdom",
      date: "September 2025",
      excerpt: "Understanding the Hermetic principles and cosmic laws that govern our reality allows us to move with the current of life rather than against it.",
      image: "/media/11/Tri-Cover-1280x960.jpg"
    },
    {
      title: "The Phoenix Rising",
      category: "Archetypes",
      date: "August 2025",
      excerpt: "The Phoenix does not mourn the ashes; it understands them as the necessary precursor to rebirth. Every ending holds the seed of a new beginning.",
      image: "/media/12/IMG_0516-800x1044.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/media/11/Cover-Final-Emblem-1280x960.jpg)' }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            She Writes
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            Lessons from the Living Codex
          </p>
        </div>
      </div>

      {/* Journal Grid */}
      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {posts.map((post, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="overflow-hidden rounded-[1.5rem] mb-6 aspect-[4/5]">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-sans tracking-widest uppercase text-muted-foreground">
                  <span>{post.category}</span>
                  <span>{post.date}</span>
                </div>
                <h3 className="font-serif text-2xl italic group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="pt-4">
                  <span className="text-xs font-sans tracking-widest uppercase border-b border-primary pb-1 group-hover:border-transparent transition-colors">
                    Read Article
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
