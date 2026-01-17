import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { getMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapView } from '@/components/Map';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { usePageContent } from '@/hooks/usePageContent';
import { EditablePageZone } from '@/components/PageZone';

const contactSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactProps {
  slug?: string;
}

export default function Contact({ slug = 'contact' }: ContactProps) {
  const [location] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getContent, getTextStyle, isLoading } = usePageContent(slug);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema)
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to send message. Please try again.");
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get hero content from CMS
  const heroTitle = getContent('hero', 'title');
  const heroSubtitle = getContent('hero', 'subtitle');
  const heroVideoUrl = getContent('hero', 'videoUrl');
  const heroImageUrl = getContent('hero', 'imageUrl');
  
  // Get contact info from CMS (using 'info' section as per seed script)
  const contactTitle = getContent('info', 'heading');
  const contactDescription = getContent('info', 'description');
  const contactLocation = getContent('info', 'location');
  const contactEmail = getContent('info', 'email');
  const contactInstagram = getContent('info', 'instagramUrl');
  const contactLinkedin = getContent('info', 'linkedinUrl');
  
  // Determine which media to use (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[50vh] w-full overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-black/30 z-10" />
        
        {/* Video or Image Background */}
        {heroMediaUrl && isVideo ? (
          <video
            src={heroMediaUrl.startsWith('http') ? heroMediaUrl : getMediaUrl(heroMediaUrl)}
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : heroMediaUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroMediaUrl.startsWith('http') ? heroMediaUrl : getMediaUrl(heroMediaUrl)})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-400 to-neutral-600" />
        )}
        
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            {heroTitle}
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            {heroSubtitle}
          </p>
        </div>
      </div>

      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div className="space-y-12">
            <div>
              <h2 className="font-serif text-4xl italic mb-6 text-foreground">{contactTitle}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {contactDescription}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-2 text-foreground">Location</h3>
                <p className="text-muted-foreground">{contactLocation}</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-2 text-foreground">Email</h3>
                <p className="text-muted-foreground">{contactEmail}</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-2 text-foreground">Social</h3>
                <div className="flex gap-4">
                  {contactInstagram && contactInstagram !== '#' && (
                    <a href={contactInstagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Instagram</a>
                  )}
                  {contactLinkedin && contactLinkedin !== '#' && (
                    <a href={contactLinkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">LinkedIn</a>
                  )}
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">First Name</label>
                  <Input 
                    {...register("firstName")}
                    className={cn(
                      "bg-background border-transparent focus:border-primary rounded-lg",
                      errors.firstName && "border-red-500 focus:border-red-500"
                    )} 
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Last Name</label>
                  <Input 
                    {...register("lastName")}
                    className={cn(
                      "bg-background border-transparent focus:border-primary rounded-lg",
                      errors.lastName && "border-red-500 focus:border-red-500"
                    )} 
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Email</label>
                <Input 
                  type="email" 
                  {...register("email")}
                  className={cn(
                    "bg-background border-transparent focus:border-primary rounded-lg",
                    errors.email && "border-red-500 focus:border-red-500"
                  )} 
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Subject</label>
                <Input 
                  {...register("subject")}
                  className={cn(
                    "bg-background border-transparent focus:border-primary rounded-lg",
                    errors.subject && "border-red-500 focus:border-red-500"
                  )} 
                />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Message</label>
                <Textarea 
                  {...register("message")}
                  className={cn(
                    "bg-background border-transparent focus:border-primary rounded-lg min-h-[150px]",
                    errors.message && "border-red-500 focus:border-red-500"
                  )} 
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-xs tracking-widest uppercase disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Page Builder Zone: Before Footer */}
      <EditablePageZone pageSlug="contact" zoneName="before-footer" />
    </div>
  );
}
