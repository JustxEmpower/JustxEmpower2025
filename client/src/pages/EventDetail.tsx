import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Users, Clock, ChevronLeft, Loader2, CheckCircle, Video } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface RegistrationInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

function RegistrationForm({ 
  event, 
  onSuccess 
}: { 
  event: { id: number; title: string; price: number; isFree: number; formattedPrice: string }; 
  onSuccess: (confirmationNumber: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<RegistrationInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const createPaymentIntent = trpc.events.createPaymentIntent.useMutation();
  const completeRegistration = trpc.events.completeRegistration.useMutation();

  const isFree = event.isFree === 1 || event.price === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!info.firstName || !info.lastName || !info.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      if (isFree) {
        const result = await completeRegistration.mutateAsync({
          eventId: event.id,
          firstName: info.firstName,
          lastName: info.lastName,
          email: info.email,
          phone: info.phone,
        });
        onSuccess(result.confirmationNumber);
        toast.success("Registration successful!");
      } else {
        if (!stripe || !elements) {
          toast.error("Payment system not ready");
          return;
        }

        const { clientSecret } = await createPaymentIntent.mutateAsync({
          eventId: event.id,
          attendeeEmail: info.email,
          quantity: 1,
        });

        if (!clientSecret) {
          throw new Error("Failed to create payment intent");
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not found");

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${info.firstName} ${info.lastName}`,
              email: info.email,
              phone: info.phone,
            },
          },
        });

        if (error) {
          toast.error(error.message || "Payment failed");
          return;
        }

        if (paymentIntent?.status === "succeeded") {
          const result = await completeRegistration.mutateAsync({
            eventId: event.id,
            firstName: info.firstName,
            lastName: info.lastName,
            email: info.email,
            phone: info.phone,
            paymentIntentId: paymentIntent.id,
          });
          onSuccess(result.confirmationNumber);
          toast.success("Registration and payment successful!");
        }
      }
    } catch (err) {
      toast.error("Registration failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" value={info.firstName} onChange={(e) => setInfo({ ...info, firstName: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" value={info.lastName} onChange={(e) => setInfo({ ...info, lastName: e.target.value })} required />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} />
      </div>

      {!isFree && (
        <div>
          <Label>Payment Details</Label>
          <div className="p-4 border rounded-md mt-2">
            <CardElement options={{ style: { base: { fontSize: "16px", color: "#424770", "::placeholder": { color: "#aab7c4" } } } }} />
          </div>
        </div>
      )}

      <Separator />

      <div className="flex justify-between items-center">
        <span className="font-medium">Total:</span>
        <span className="text-lg font-semibold">{event.formattedPrice}</span>
      </div>

      <Button type="submit" className="w-full" disabled={loading || (!isFree && !stripe)}>
        {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>) : isFree ? "Register Free" : `Pay ${event.formattedPrice}`}
      </Button>
    </form>
  );
}

function RegistrationDialog({ event, trigger }: { event: { id: number; title: string; price: number; isFree: number; formattedPrice: string }; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        {confirmationNumber ? (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <DialogTitle className="text-xl mb-2">Registration Complete!</DialogTitle>
            <p className="text-muted-foreground mb-2">Your confirmation number:</p>
            <p className="text-2xl font-mono font-bold mb-4">{confirmationNumber}</p>
            <p className="text-sm text-muted-foreground">A confirmation email has been sent to your email address.</p>
            <Button className="mt-6" onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader><DialogTitle>Register for {event.title}</DialogTitle></DialogHeader>
            <Elements stripe={stripePromise}><RegistrationForm event={event} onSuccess={setConfirmationNumber} /></Elements>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function EventDetail() {
  const [, params] = useRoute("/events/:slug");
  const slug = params?.slug;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event, isLoading, error } = trpc.events.bySlug.useQuery({ slug: slug || "" }, { enabled: !!slug }) as { data: any; isLoading: boolean; error: any };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--theme-background)]">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6"><Skeleton className="aspect-video rounded-lg" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-24 w-full" /></div>
            <div><Skeleton className="h-64 rounded-lg" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Event not found</h1>
          <Link href="/events"><Button>Back to Events</Button></Link>
        </div>
      </div>
    );
  }

  const isFree = event.isFree === 1 || event.price === 0;
  const isPast = new Date(event.startDate) < new Date();
  const isSoldOut = event.spotsRemaining !== null && event.spotsRemaining <= 0;
  const canRegister = !isPast && !isSoldOut && event.registrationOpen === 1;
  const location = event.venue || event.city || (event.locationType === "virtual" ? "Online Event" : "TBA");

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      <div className="container mx-auto px-4 py-8">
        <Link href="/events" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ChevronLeft className="h-4 w-4 mr-1" />Back to Events
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {event.featuredImage ? (
                <img src={event.featuredImage} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                  <Calendar className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {isPast && <Badge variant="secondary">Event Ended</Badge>}
                {!isPast && isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
                {!isPast && isFree && <Badge className="bg-green-500">Free</Badge>}
                {event.locationType === "virtual" && <Badge className="bg-blue-500">Virtual</Badge>}
                {event.locationType === "hybrid" && <Badge className="bg-purple-500">Hybrid</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-serif mb-4">{event.title}</h1>
            </div>

            <div className="prose max-w-none">
              {event.description ? <div dangerouslySetInnerHTML={{ __html: event.description }} /> : <p className="text-muted-foreground">No description available.</p>}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Event Details</span>
                  <span className="text-2xl font-bold">{event.formattedPrice}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {event.locationType === "virtual" ? <Video className="h-5 w-5 text-muted-foreground" /> : <MapPin className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">{location}</p>
                      {event.city && event.state && <p className="text-muted-foreground">{event.city}, {event.state}</p>}
                    </div>
                  </div>
                  {event.capacity && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">{event.spotsRemaining !== null ? `${event.spotsRemaining} spots remaining` : `${event.capacity} capacity`}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {canRegister ? (
                  <RegistrationDialog
                    event={{ id: event.id, title: event.title, price: event.price || 0, isFree: event.isFree, formattedPrice: event.formattedPrice }}
                    trigger={<Button className="w-full" size="lg">{isFree ? "Register Free" : `Register - ${event.formattedPrice}`}</Button>}
                  />
                ) : (
                  <Button className="w-full" size="lg" disabled>{isPast ? "Event Ended" : isSoldOut ? "Sold Out" : "Registration Closed"}</Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
