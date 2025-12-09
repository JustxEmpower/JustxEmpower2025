import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

interface NewsletterSignupProps {
  variant?: 'inline' | 'footer' | 'modal';
  className?: string;
}

export default function NewsletterSignup({ variant = 'inline', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
      setFirstName('');
      setLastName('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    subscribeMutation.mutate({
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  };

  // Footer variant - horizontal layout
  if (variant === 'footer') {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400"
          disabled={subscribeMutation.isPending}
        />
        <Button
          type="submit"
          disabled={subscribeMutation.isPending}
          className="bg-white text-black hover:bg-neutral-200"
        >
          {subscribeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
    );
  }

  // Modal variant - compact with name fields
  if (variant === 'modal') {
    return (
      <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="h-11"
            disabled={subscribeMutation.isPending}
          />
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="h-11"
            disabled={subscribeMutation.isPending}
          />
        </div>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="h-11"
          disabled={subscribeMutation.isPending}
        />
        <Button
          type="submit"
          disabled={subscribeMutation.isPending}
          className="w-full h-11"
        >
          {subscribeMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Subscribing...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Subscribe to Newsletter
            </>
          )}
        </Button>
      </form>
    );
  }

  // Inline variant - full form with name fields
  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            First Name
          </label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            className="h-11"
            disabled={subscribeMutation.isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Last Name
          </label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            className="h-11"
            disabled={subscribeMutation.isPending}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Email Address *
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          className="h-11"
          disabled={subscribeMutation.isPending}
        />
      </div>
      <Button
        type="submit"
        disabled={subscribeMutation.isPending}
        className="w-full h-11"
      >
        {subscribeMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Subscribing...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            Subscribe to Newsletter
          </>
        )}
      </Button>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
        By subscribing, you agree to receive monthly updates from Just Empower.
        You can unsubscribe at any time.
      </p>
    </form>
  );
}
