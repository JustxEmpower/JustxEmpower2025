import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function SwiperOfferingsCarousel() {
  const { data: dbOfferings, isLoading } = trpc.carousel.getAll.useQuery();

  const offerings = dbOfferings?.map(o => ({
    id: o.id, title: o.title, imageUrl: o.imageUrl || '',
    description: o.description || '', link: o.link || '/offerings'
  })) || [];

  if (!isLoading && offerings.length === 0) return null;
  if (isLoading) return <div className="h-[70vh] flex items-center justify-center">Loading...</div>;

  return (
    <section className="relative min-h-[80vh] bg-background py-20">
      <h2 className="font-serif text-4xl md:text-6xl text-foreground font-light italic px-6 md:px-12 mb-12">
        Our Offerings
      </h2>
      <div className="px-4 md:px-12 relative">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          loop={true}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          navigation={{ prevEl: '.swiper-prev', nextEl: '.swiper-next' }}
          pagination={{ clickable: true }}
          slidesPerView={1}
          spaceBetween={30}
          breakpoints={{
            640: { slidesPerView: 1.5 },
            1024: { slidesPerView: 2.5 },
            1280: { slidesPerView: 3 },
          }}
          className="!pb-16"
        >
          {offerings.map((item) => (
            <SwiperSlide key={item.id}>
              <Link href={item.link}>
                <div className="relative h-[55vh] group rounded-[2rem] overflow-hidden shadow-2xl bg-gray-900 hover:-translate-y-4 transition-transform duration-500">
                  {item.imageUrl && (
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                      style={{ backgroundImage: `url(${item.imageUrl})` }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 p-8 w-full">
                    <span className="text-xs uppercase tracking-widest text-white/80 mb-3 block">Explore</span>
                    <h3 className="font-serif text-3xl text-white italic mb-3">{item.title}</h3>
                    <p className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity">{item.description}</p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
        <button className="swiper-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button className="swiper-next absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
