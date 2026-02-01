import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade, EffectCoverflow } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-coverflow';

interface SwiperCarouselProps {
  slides: React.ReactNode[];
  slidesPerView?: number | 'auto';
  spaceBetween?: number;
  loop?: boolean;
  autoplay?: boolean | { delay: number; disableOnInteraction?: boolean };
  navigation?: boolean;
  pagination?: boolean | 'bullets' | 'fraction' | 'progressbar';
  effect?: 'slide' | 'fade' | 'coverflow';
  centeredSlides?: boolean;
  breakpoints?: Record<number, { slidesPerView: number; spaceBetween?: number }>;
  className?: string;
  slideClassName?: string;
  onSlideChange?: (index: number) => void;
}

export default function SwiperCarousel({
  slides,
  slidesPerView = 1,
  spaceBetween = 20,
  loop = true,
  autoplay = false,
  navigation = true,
  pagination = true,
  effect = 'slide',
  centeredSlides = false,
  breakpoints,
  className = '',
  slideClassName = '',
  onSlideChange,
}: SwiperCarouselProps) {
  const modules = [Navigation, Pagination, Autoplay];
  
  if (effect === 'fade') modules.push(EffectFade);
  if (effect === 'coverflow') modules.push(EffectCoverflow);

  const autoplayConfig = typeof autoplay === 'boolean' 
    ? autoplay ? { delay: 5000, disableOnInteraction: false } : false
    : autoplay;

  const paginationConfig = pagination === true 
    ? { clickable: true }
    : pagination === 'bullets' 
      ? { clickable: true, type: 'bullets' as const }
      : pagination === 'fraction'
        ? { type: 'fraction' as const }
        : pagination === 'progressbar'
          ? { type: 'progressbar' as const }
          : false;

  return (
    <div className={`swiper-carousel-wrapper relative ${className}`}>
      <Swiper
        modules={modules}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        loop={loop}
        autoplay={autoplayConfig}
        navigation={navigation ? {
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        } : false}
        pagination={paginationConfig}
        effect={effect}
        centeredSlides={centeredSlides}
        breakpoints={breakpoints}
        onSlideChange={(swiper) => onSlideChange?.(swiper.realIndex)}
        className="w-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className={slideClassName}>
            {slide}
          </SwiperSlide>
        ))}
      </Swiper>

      {navigation && (
        <>
          <button 
            className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-neutral-700 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-neutral-700 dark:text-white" />
          </button>
          <button 
            className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-neutral-700 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-neutral-700 dark:text-white" />
          </button>
        </>
      )}

      <style>{`
        .swiper-carousel-wrapper .swiper-pagination-bullet {
          background: rgba(0, 0, 0, 0.3);
          opacity: 1;
        }
        .swiper-carousel-wrapper .swiper-pagination-bullet-active {
          background: #d4a574;
        }
        .swiper-carousel-wrapper .swiper-pagination {
          bottom: 16px;
        }
      `}</style>
    </div>
  );
}

// Testimonial Carousel variant
interface TestimonialSlide {
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
}

export function TestimonialCarousel({ 
  testimonials,
  autoplay = true,
  className = '',
}: { 
  testimonials: TestimonialSlide[];
  autoplay?: boolean;
  className?: string;
}) {
  const slides = testimonials.map((t, i) => (
    <div key={i} className="text-center px-8 py-12">
      <blockquote className="text-xl md:text-2xl font-serif italic text-neutral-700 dark:text-neutral-200 mb-8 max-w-3xl mx-auto">
        "{t.quote}"
      </blockquote>
      <div className="flex items-center justify-center gap-4">
        {t.avatar && (
          <img 
            src={t.avatar} 
            alt={t.author} 
            className="w-14 h-14 rounded-full object-cover"
          />
        )}
        <div className="text-left">
          <p className="font-semibold text-neutral-900 dark:text-white">{t.author}</p>
          {t.role && <p className="text-sm text-neutral-500">{t.role}</p>}
        </div>
      </div>
    </div>
  ));

  return (
    <SwiperCarousel
      slides={slides}
      autoplay={autoplay ? { delay: 6000, disableOnInteraction: false } : false}
      loop={true}
      effect="fade"
      navigation={true}
      pagination="bullets"
      className={className}
    />
  );
}

// Image Gallery Carousel variant
export function ImageGalleryCarousel({
  images,
  aspectRatio = '16/9',
  className = '',
}: {
  images: { src: string; alt?: string; caption?: string }[];
  aspectRatio?: string;
  className?: string;
}) {
  const slides = images.map((img, i) => (
    <div key={i} className="relative">
      <div style={{ aspectRatio }} className="overflow-hidden rounded-2xl">
        <img 
          src={img.src} 
          alt={img.alt || `Image ${i + 1}`} 
          className="w-full h-full object-cover"
        />
      </div>
      {img.caption && (
        <p className="mt-4 text-center text-sm text-neutral-500">{img.caption}</p>
      )}
    </div>
  ));

  return (
    <SwiperCarousel
      slides={slides}
      slidesPerView={1}
      spaceBetween={30}
      breakpoints={{
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 30 },
      }}
      navigation={true}
      pagination="bullets"
      className={className}
    />
  );
}
