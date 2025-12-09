import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminSettings from "@/pages/AdminSettings";
import AdminContent from "@/pages/AdminContent";
import AdminArticles from "@/pages/AdminArticles";
import AdminMedia from "@/pages/AdminMedia";
import AdminTheme from "@/pages/AdminTheme";
import AdminAnalytics from "@/pages/AdminAnalytics";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Philosophy from "./pages/Philosophy";
import Offerings from "./pages/Offerings";
import Journal from "./pages/Journal";
import Contact from "./pages/Contact";
import WalkWithUs from "./pages/WalkWithUs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";
import NewsletterPopup from "@/components/NewsletterPopup";
import { AIChatAssistant } from "@/components/AIChatAssistant";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/content" component={AdminContent} />
      <Route path="/admin/articles" component={AdminArticles} />
      <Route path="/admin/media" component={AdminMedia} />
      <Route path="/admin/theme" component={AdminTheme} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path={"/404"} component={NotFound} />
      <Route path="/about" component={About} />
      <Route path="/philosophy" component={Philosophy} />
      <Route path="/offerings" component={Offerings} />
      <Route path="/journal" component={Journal} />
      <Route path="/contact" component={Contact} />
      <Route path="/walk-with-us" component={WalkWithUs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [location] = useLocation();
  
  // Don't show newsletter popup on admin pages
  const isAdminPage = location.startsWith('/admin');

  // Only show preloader on initial load or home page refresh
  useEffect(() => {
    if (location !== '/') {
      setIsLoading(false);
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
          <div className={`transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
            <Header />
            <Router />
            <Footer />
            {!isAdminPage && <NewsletterPopup />}
            {!isAdminPage && <AIChatAssistant />}
            {!isAdminPage && <AnalyticsTracker />}
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
