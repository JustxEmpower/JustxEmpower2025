import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

export default function Journal() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const featuredPost = {
    title: "The Architecture of Belonging",
    category: "Community",
    date: "November 2025",
    excerpt: "True belonging is not found in fitting in, but in the courage to stand alone and still feel connected to the whole. It is an internal architecture that we build through self-acceptance and radical authenticity.",
    image: "/media/11/Cover-Final-Emblem-V1-1024x731.png",
    author: "Just Empower Team"
  };

  const posts = [
    {
      title: "The Alchemist's Path",
      category: "Transformation",
      date: "October 2025",
      excerpt: "Transforming wound into wisdom requires the heat of initiation. It is not a passive process, but an active engagement with the fires of change. We explore how to navigate the crucible of transformation with grace.",
      image: "/media/12/IMG_0513-1280x1358.jpg",
      author: "Sarah Mitchell"
    },
    {
      title: "Universal Laws",
      category: "Wisdom",
      date: "September 2025",
      excerpt: "Understanding the Hermetic principles and cosmic laws that govern our reality allows us to move with the current of life rather than against it. A deep dive into the mechanics of manifestation.",
      image: "/media/11/Tri-Cover-1280x960.jpg",
      author: "Elena Vasquez"
    },
    {
      title: "The Phoenix Rising",
      category: "Archetypes",
      date: "August 2025",
      excerpt: "The Phoenix does not mourn the ashes; it understands them as the necessary precursor to rebirth. Every ending holds the seed of a new beginning. Learning to trust the cycles of death and rebirth.",
      image: "/media/12/IMG_0516-800x1044.jpg",
      author: "Maya Rivers"
    },
    {
      title: "Sacred Reciprocity",
      category: "Nature",
      date: "July 2025",
      excerpt: "Nature does not hoard; it circulates. To live in alignment with the earth is to understand the law of sacred reciprocity—that we must give as much as we receive.",
      image: "/media/12/IMG_0516-1280x1358.jpg",
      author: "Just Empower Team"
    },
    {
      title: "Voice as Vessel",
      category: "Expression",
      date: "June 2025",
      excerpt: "Your voice is not just a tool for communication; it is a vessel for your soul's frequency. Reclaiming your voice is an act of spiritual sovereignty.",
      image: "/media/11/Cover-Final-Emblem-1280x960.jpg",
      author: "Sarah Mitchell"
    },
    {
      title: "Ancestral Healing",
      category: "Lineage",
      date: "May 2025",
      excerpt: "We are the dream of our ancestors. Healing our lineage is not about blaming the past, but about liberating the future from the patterns that no longer serve us.",
      image: "/media/12/IMG_0513-800x1044.jpg",
      author: "Elena Vasquez"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[50vh] w-full overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/media/09/home-fog-slide-3.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            She Writes
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            Lessons from the Living Codex
          </p>
        </div>
      </div>

      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        
        {/* Featured Post */}
        <div className="mb-24">
          <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8 border-b border-border pb-4">Featured Article</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center group cursor-pointer">
            <div className="overflow-hidden rounded-[2rem] aspect-[16/9] lg:aspect-[4/3]">
              <img 
                src={featuredPost.image} 
                alt={featuredPost.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-xs font-sans tracking-widest uppercase text-primary">
                <span>{featuredPost.category}</span>
                <span className="w-1 h-1 rounded-full bg-primary/50" />
                <span className="text-muted-foreground">{featuredPost.date}</span>
              </div>
              <h3 className="font-serif text-4xl md:text-5xl italic leading-tight group-hover:text-primary transition-colors">
                {featuredPost.title}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-3 pt-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-serif italic">JE</div>
                <span className="text-xs font-sans tracking-widest uppercase text-muted-foreground">By {featuredPost.author}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Journal Grid */}
        <div>
          <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-12 border-b border-border pb-4">Recent Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            {posts.map((post, index) => (
              <div key={index} className="group cursor-pointer flex flex-col h-full">
                <div className="overflow-hidden rounded-[1.5rem] mb-6 aspect-[4/5]">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center justify-between text-xs font-sans tracking-widest uppercase text-muted-foreground">
                    <span className="text-primary">{post.category}</span>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="font-serif text-2xl italic group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
                    {post.excerpt}
                  </p>
                </div>
                <div className="pt-6 mt-auto">
                  <span className="text-xs font-sans tracking-widest uppercase border-b border-primary/30 pb-1 group-hover:border-primary transition-colors">
                    Read Article
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination / Load More */}
        <div className="mt-24 flex justify-center">
          <button className="px-8 py-4 rounded-full border border-border hover:border-primary hover:text-primary transition-colors font-sans text-xs tracking-[0.2em] uppercase">
            Load More Articles
          </button>
        </div>

      </div>
    </div>
  );
}
