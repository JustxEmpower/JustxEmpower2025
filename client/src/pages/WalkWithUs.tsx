import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function WalkWithUs() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/media/11/Tri-Cover-1280x960.jpg)' }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            Walk With Us
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            A Collective Invocation
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-4xl italic mb-8 text-foreground">Join the Movement</h2>
        <p className="text-lg text-muted-foreground leading-relaxed mb-12">
          This is not a solitary endeavor; it is a collective invocation. We call forth aligned professionals: policy strategists, environmental scientists, systems thinkers, legal advocates, planners, and community organizers who carry both vision and skill. Equally, we seek those who may not have borne formal titles yet held within them the heart, conviction, and devotion to move purpose into form.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-muted/30 p-8 rounded-[1.5rem] text-left">
            <h3 className="font-serif text-2xl italic mb-4">For Partners</h3>
            <p className="text-muted-foreground mb-6">
              Collaborate on initiatives that restore coherence between people, purpose, and planet.
            </p>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
              Partner With Us
            </Button>
          </div>
          <div className="bg-muted/30 p-8 rounded-[1.5rem] text-left">
            <h3 className="font-serif text-2xl italic mb-4">For Individuals</h3>
            <p className="text-muted-foreground mb-6">
              Join our community of awakened women reclaiming sovereignty and embodied truth.
            </p>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
              Join Community
            </Button>
          </div>
        </div>

        <div className="relative rounded-[1.5rem] overflow-hidden h-[400px]">
          <img 
            src="/media/12/IMG_0513-1280x1358.jpg" 
            alt="Community" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <p className="text-white font-serif text-3xl italic max-w-2xl px-4">
              "In protecting what flourishes, we protect the right of all beings to rise, to renew, and to remain free."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
