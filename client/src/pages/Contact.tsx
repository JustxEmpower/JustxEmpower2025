import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapView } from '@/components/Map';

export default function Contact() {
  const [location] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/media/12/IMG_0516-1280x1358.jpg)' }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            Connect
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            Begin the Conversation
          </p>
        </div>
      </div>

      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div className="space-y-12">
            <div>
              <h2 className="font-serif text-4xl italic mb-6 text-foreground">Get in Touch</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you are interested in partnership, coaching, or simply have a question, we invite you to reach out. Our team is dedicated to supporting your journey of empowerment and transformation.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-2 text-foreground">Location</h3>
                <p className="text-muted-foreground">Austin, Texas</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-2 text-foreground">Email</h3>
                <p className="text-muted-foreground">connect@justxempower.com</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-2 text-foreground">Social</h3>
                <div className="flex gap-4">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Instagram</a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">LinkedIn</a>
                </div>
              </div>
            </div>

            {/* Map Integration */}
            <div className="w-full h-[300px] rounded-[1.5rem] overflow-hidden shadow-lg mt-8">
              <MapView 
                initialCenter={{ lat: 30.2672, lng: -97.7431 }} // Austin, TX coordinates
                initialZoom={12}
                className="w-full h-full"
                onMapReady={(map) => {
                  mapRef.current = map;
                  // Add a marker for Austin
                  new google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: { lat: 30.2672, lng: -97.7431 },
                    title: "Just Empower HQ",
                  });
                }}
              />
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-muted/30 p-8 md:p-12 rounded-[1.5rem]">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">First Name</label>
                  <Input className="bg-background border-transparent focus:border-primary rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Last Name</label>
                  <Input className="bg-background border-transparent focus:border-primary rounded-lg" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Email</label>
                <Input type="email" className="bg-background border-transparent focus:border-primary rounded-lg" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Subject</label>
                <Input className="bg-background border-transparent focus:border-primary rounded-lg" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Message</label>
                <Textarea className="bg-background border-transparent focus:border-primary rounded-lg min-h-[150px]" />
              </div>

              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-xs tracking-widest uppercase">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
