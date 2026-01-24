import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { nanoid } from "nanoid";

export function AnalyticsTracker() {
  const [location] = useLocation();
  const sessionIdRef = useRef<string>("");
  const visitorIdRef = useRef<string>("");
  const trackPageViewMutation = trpc.analytics.trackPageView.useMutation();

  // Initialize session and visitor IDs
  useEffect(() => {
    // Get or create visitor ID (persists across sessions)
    const existingVisitorId = localStorage.getItem("je_visitor_id");
    if (existingVisitorId) {
      visitorIdRef.current = existingVisitorId;
    } else {
      const newVisitorId = nanoid();
      localStorage.setItem("je_visitor_id", newVisitorId);
      visitorIdRef.current = newVisitorId;
    }

    // Create session ID (unique per browser session)
    const existingSessionId = sessionStorage.getItem("je_session_id");
    if (existingSessionId) {
      sessionIdRef.current = existingSessionId;
    } else {
      const newSessionId = nanoid();
      sessionStorage.setItem("je_session_id", newSessionId);
      sessionIdRef.current = newSessionId;
    }
  }, []);

  // Track page views
  useEffect(() => {
    if (!sessionIdRef.current) return;

    // Don't track admin pages
    if (typeof location === 'string' && location.startsWith("/admin")) return;

    trackPageViewMutation.mutate({
      visitorId: visitorIdRef.current,
      sessionId: sessionIdRef.current,
      page: location,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
  }, [location]);

  return null; // This component doesn't render anything
}
