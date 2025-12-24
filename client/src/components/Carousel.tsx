import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'wouter';

gsap.registerPlugin(ScrollTrigger);

const offerings = [
  {
    title: "Seeds of a New Paradigm",
    image: "/media/11/Tri-Cover-1280x960.jpg",
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
    image: "/media/11/Cover-Final-Emblem-V1-1024x731.png",
    desc: "Empowering mothers as leaders of change.",
    link: "/offerings"
  }
];

export default function Carousel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current;
      const track = trackRef.current;

      if (!section || !track) return;

      // Calculate scroll amount
      const getScrollAmount = () => {
        const trackWidth = track.scrollWidth;
        const viewportWidth = window.innerWidth;
        return -(trackWidth - viewportWidth + 100);
      };

      // Create the scroll tween
      const tween = gsap.to(track, {
        x: getScrollAmount,
        ease: "none",
      });

      // Create the ScrollTrigger
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${track.scrollWidth - window.innerWidth}`,
        pin: true,
        animation: tween,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen bg-background overflow-hidden flex flex-col justify-center py-20">
      
      <div className="absolute top-12 left-6 md:left-12 z-10">
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground font-light italic tracking-tight">
          Our Offerings
        </h2>
      </div>

      <div ref={trackRef} className="flex gap-8 md:gap-12 px-6 md:px-12 w-max items-center h-[60vh] md:h-[70vh] pl-[10vw] md:pl-[20vw] z-20">
        {offerings.map((item, i) => (
          <Link key={i} href={item.link} className="block h-full shrink-0">
            <div 
              className="relative w-[80vw] md:w-[40vw] lg:w-[30vw] h-full group overflow-hidden cursor-pointer rounded-[2rem] shadow-2xl shadow-black/5 transition-all duration-500 hover:-translate-y-4 bg-gray-900"
            >
              <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-500 rounded-[2rem]" />
              
              <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 z-20">
                <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/90 mb-4 block border-l-2 border-white/50 pl-3">
                  Explore
                </span>
                <h3 className="font-serif text-3xl md:text-4xl text-white mb-4 italic font-light leading-tight drop-shadow-lg">
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
      
      <div className="absolute bottom-12 left-6 md:left-12 flex items-center gap-4 z-10">
        <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Scroll to Explore</span>
        <div className="w-24 h-[1px] bg-muted-foreground/30" />
      </div>

    </section>
  );
}
