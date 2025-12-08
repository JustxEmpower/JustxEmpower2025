import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const offerings = [
  {
    title: "Seeds of a New Paradigm",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop",
    desc: "Cultivating consciousness for future generations."
  },
  {
    title: "Emerge With Us",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop",
    desc: "A journey of collective transformation."
  },
  {
    title: "Rooted Unity",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop",
    desc: "Connecting deeply with nature and self."
  },
  {
    title: "MOM VI-X",
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=1000&auto=format&fit=crop",
    desc: "Empowering mothers as leaders of change."
  }
];

export default function Carousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      const container = containerRef.current;
      
      if (!track || !container) return;

      const scrollWidth = track.scrollWidth;
      const windowWidth = window.innerWidth;
      const xMove = -(scrollWidth - windowWidth + 100); // Extra padding

      gsap.to(track, {
        x: xMove,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: `+=${scrollWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-screen bg-background overflow-hidden flex flex-col justify-center">
      <div className="absolute top-12 left-6 md:left-12 z-10">
        <h2 className="font-serif text-4xl md:text-5xl text-foreground italic">Our Offerings</h2>
      </div>

      <div ref={trackRef} className="flex gap-8 px-6 md:px-12 w-max items-center h-[70vh]">
        {offerings.map((item, i) => (
          <div 
            key={i} 
            className="relative w-[80vw] md:w-[40vw] lg:w-[30vw] h-full group overflow-hidden cursor-pointer"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
            
            <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="font-serif text-3xl text-white mb-2 italic">{item.title}</h3>
              <p className="font-sans text-white/80 text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-12 left-6 md:left-12 flex items-center gap-4">
        <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">Scroll to Explore</span>
        <div className="w-12 h-[1px] bg-muted-foreground" />
      </div>
    </div>
  );
}
