import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Header />
          <Router />
          <Footer />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
