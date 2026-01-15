import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Sparkles, ArrowRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

// ============================================================================
// Types
// ============================================================================

interface AuthDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  variant?: "login" | "signup" | "restricted";
  redirectTo?: string;
  onLogin?: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

// ============================================================================
// Inspirational Messages
// ============================================================================

const inspirationalMessages = [
  "Your journey to empowerment begins here.",
  "Unlock your potential with Just Empower.",
  "Step into your power today.",
  "Transform your wellness journey.",
  "Embrace the path to self-discovery.",
];

// ============================================================================
// Auth Dialog Component - Enhanced
// ============================================================================

/**
 * Authentication Dialog - Enhanced
 * 
 * Features:
 * - Multiple variants (login, signup, restricted)
 * - Animated transitions
 * - Inspirational messaging
 * - JustxEmpower branding
 */
export function AuthDialog({
  title,
  logo,
  open = false,
  variant = "login",
  redirectTo,
  onLogin,
  onOpenChange,
  onClose,
}: AuthDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);
  const [message] = useState(
    () => inspirationalMessages[Math.floor(Math.random() * inspirationalMessages.length)]
  );
  
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try {
    navigate = useNavigate();
  } catch {
    // Not in router context
  }

  useEffect(() => {
    if (!onOpenChange) {
      setInternalOpen(open);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      onClose?.();
    }
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else if (navigate) {
      navigate(redirectTo || "/admin/login");
    } else {
      window.location.href = redirectTo || "/admin/login";
    }
  };

  const variantConfig = {
    login: {
      icon: User,
      buttonText: "Sign In",
      description: "Access your account to continue",
    },
    signup: {
      icon: Sparkles,
      buttonText: "Get Started",
      description: "Join our community of empowered individuals",
    },
    restricted: {
      icon: Lock,
      buttonText: "Login Required",
      description: "This content requires authentication",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Dialog
      open={onOpenChange ? open : internalOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="p-0 gap-0 overflow-hidden bg-gradient-to-br from-[#f8f8f7] to-[#f0efe9] rounded-2xl w-[420px] max-w-[95vw] shadow-2xl border border-[#c9a86c]/20">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-[#1a1a19] to-[#2d2d2b] px-6 py-8 text-center">
          {/* Close button */}
          <button
            onClick={() => handleOpenChange(false)}
            className="absolute top-3 right-3 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Logo or Icon */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a86c] to-[#a08050] flex items-center justify-center shadow-lg">
            {logo ? (
              <img src={logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <Icon className="w-8 h-8 text-white" />
            )}
          </div>

          {/* Title */}
          <DialogTitle className="text-xl font-serif text-white mb-2">
            {title || "Welcome to Just Empower"}
          </DialogTitle>

          {/* Inspirational message */}
          <p className="text-[#c9a86c] text-sm italic font-serif">
            "{message}"
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <DialogDescription className="text-center text-[#5a5a58] mb-6">
            {config.description}
          </DialogDescription>

          {/* Features list */}
          <div className="space-y-3 mb-6">
            {[
              "Access exclusive wellness content",
              "Track your empowerment journey",
              "Connect with our community",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[#34322d]">
                <div className="w-5 h-5 rounded-full bg-[#c9a86c]/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-[#c9a86c]" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 pt-0">
          <Button
            onClick={handleLogin}
            className="w-full h-12 bg-gradient-to-r from-[#1a1a19] to-[#2d2d2b] hover:from-[#2d2d2b] hover:to-[#1a1a19] text-white rounded-xl text-base font-medium shadow-lg transition-all duration-300 group"
          >
            {config.buttonText}
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          {variant !== "restricted" && (
            <p className="w-full text-center text-xs text-[#858481] mt-3">
              By continuing, you agree to our{" "}
              <a href="/terms" className="text-[#c9a86c] hover:underline">Terms</a>
              {" & "}
              <a href="/privacy" className="text-[#c9a86c] hover:underline">Privacy Policy</a>
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Quick Login Prompt - Simpler variant
// ============================================================================

interface LoginPromptProps {
  message?: string;
  onLogin?: () => void;
}

export function LoginPrompt({ message, onLogin }: LoginPromptProps) {
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try {
    navigate = useNavigate();
  } catch {
    // Not in router context
  }

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else if (navigate) {
      navigate("/admin/login");
    } else {
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#f8f8f7] rounded-xl border border-[#c9a86c]/20">
      <Lock className="w-12 h-12 text-[#c9a86c] mb-4" />
      <p className="text-[#34322d] text-center mb-4 font-serif">
        {message || "Please sign in to access this content"}
      </p>
      <Button
        onClick={handleLogin}
        className="bg-[#1a1a19] hover:bg-[#2d2d2b] text-white px-6 py-2 rounded-lg"
      >
        Sign In
      </Button>
    </div>
  );
}

