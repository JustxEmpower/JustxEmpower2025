import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'wouter';

gsap.registerPlugin(ScrollTrigger);

const offerings = [
  {
    title: "Seeds of a New Paradigm",
    image: "/media/Tri-Cover-1280x960.jpg",
    desc: "Cultivating consciousness for future generations.",
    link: "/offerings"
  },
  {
    title: "Emerge With Us",
    image: "/media/12/IMG_0513-1280x1358.jpg",
    desc: "A journey of collective transformation.",
    link: "/offerings"
  },
  {
    title: "Rooted Unity",
    image: "/media/12/IMG_0516-800x1044.jpg",
    desc: "Connecting deeply with nature and self.",
    link: "/offerings"
  },
  {
    title: "MOM VI-X",
    image: "/media/Cover-Final-Emblem-V1-1024x731.png",
    desc: "Empowering mothers as leaders of change.",
    link: "/offerings"
  }
];

export default function Carousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      const container = containerRef.current;
      
      if (!track || !container) return;

      const scrollWidth = track.scrollWidth;
      const windowWidth = window.innerWidth;
      const xMove = -(scrollWidth - windowWidth + 200); // Extra padding

      // Horizontal Scroll Animation
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

      // Parallax effect for individual cards
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        const image = card.querySelector('.card-image');
        
        gsap.to(image, {
          xPercent: -15,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            horizontal: true
          }
        });
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-screen bg-background overflow-hidden flex flex-col justify-center">
      <div className="absolute top-12 left-6 md:left-12 z-10">
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground font-light italic tracking-tight">
          Our Offerings
        </h2>
      </div>

      <div ref={trackRef} className="flex gap-12 px-6 md:px-12 w-max items-center h-[70vh] pl-[20vw]">
        {offerings.map((item, i) => (
          <Link key={i} href={item.link}>
            <div 
              ref={(el) => {
                if (el) cardsRef.current[i] = el;
              }}
              className="relative w-[80vw] md:w-[40vw] lg:w-[30vw] h-full group overflow-hidden cursor-pointer rounded-[2rem] shadow-2xl shadow-black/5 transition-all duration-500 hover:-translate-y-4"
            >
              <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                <div 
                  className="card-image absolute inset-[-10%] w-[120%] h-[120%] bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
              </div>
              
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-500 rounded-[2rem]" />
              
              <div className="absolute bottom-0 left-0 p-10 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 z-20">
                <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/90 mb-4 block border-l-2 border-white/50 pl-3">
                  Explore
                </span>
                <h3 className="font-serif text-4xl text-white mb-4 italic font-light leading-tight drop-shadow-lg">
                  {item.title}
                </h3>
                <p className="font-sans text-white/90 text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 transform translate-y-4 group-hover:translate-y-0 drop-shadow-md">
                  {item.desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="absolute bottom-12 left-6 md:left-12 flex items-center gap-4">
        <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Scroll to Explore</span>
        <div className="w-24 h-[1px] bg-muted-foreground/30" />
      </div>
    </div>
  );
}
