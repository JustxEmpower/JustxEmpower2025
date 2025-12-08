import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Philosophy from "./pages/Philosophy";
import Offerings from "./pages/Offerings";
import Journal from "./pages/Journal";
import Contact from "./pages/Contact";
import WalkWithUs from "./pages/WalkWithUs";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Preloader from "./components/Preloader";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
