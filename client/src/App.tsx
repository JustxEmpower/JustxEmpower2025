import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboardEnhanced";
import AdminSettings from "@/pages/AdminSettingsEnhanced";
import AdminContent from "@/pages/AdminContent";
import AdminArticles from "@/pages/AdminArticlesEnhanced";
import AdminMedia from "@/pages/AdminMediaEnhanced";
import AdminTheme from "@/pages/AdminThemeEnhanced";
import AdminPages from "@/pages/AdminPagesEnhanced";
import DynamicPage from "@/pages/DynamicPage";
import DynamicPageRouter from "@/pages/DynamicPageRouter";
import AdminAnalytics from "@/pages/AdminAnalyticsEnhanced";
import AdminBrand from "@/pages/AdminBrandEnhanced";
import AdminSEO from "@/pages/AdminSEOEnhanced";
import AdminNavigation from "@/pages/AdminNavigationManager";
import AdminForms from "@/pages/AdminFormsEnhanced";
import AdminRedirects from "@/pages/AdminRedirectsEnhanced";
import AdminCode from "@/pages/AdminCodeEnhanced";
import AdminBackup from "@/pages/AdminBackupEnhanced";
import AdminBackupTimeMachine from "@/pages/AdminBackupTimeMachine";
import AdminUsers from "@/pages/AdminUsersEnhanced";
import AdminProducts from "@/pages/AdminProductsEnhanced";
import AdminEvents from "@/pages/AdminEventsEnhanced";
import AdminOrders from "@/pages/AdminOrdersEnhanced";
import AdminShop from "@/pages/AdminShopEnhanced";
import AdminReviews from "@/pages/AdminReviewsEnhanced";
import AdminCategories from "@/pages/AdminCategoriesEnhanced";
import AdminAttendees from "@/pages/AdminAttendeesEnhanced";
import AdminRevenue from "@/pages/AdminRevenueEnhanced";
import AdminPayments from "@/pages/AdminPaymentsEnhanced";
import AdminFinancialAnalytics from "@/pages/AdminFinancialAnalyticsEnhanced";
import AdminResourcesPage from "@/pages/AdminResourcesPage";
import AdminContactMessages from "@/pages/AdminContactMessagesEnhanced";
import AdminCarousel from "@/pages/AdminCarouselEnhanced";
import AdminCarouselManager from "@/pages/AdminCarouselManagerEnhanced";
import AdminAITraining from "@/pages/AdminAITrainingEnhanced";
import PageBuilderPage from "@/pages/PageBuilderPage";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import About from "./pages/About";
import AboutJustEmpower from "./pages/AboutJustEmpower";
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
import FontProvider from "@/components/FontProvider";
import Analytics from "@/components/Analytics";
import { CartProvider } from "@/contexts/CartContext";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import Resources from "@/pages/Resources";
import CommunityEvents from "@/pages/CommunityEvents";
import ArticleDetail from "@/pages/ArticleDetail";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import AccessibilityStatement from "@/pages/AccessibilityStatement";
import CookiePolicy from "@/pages/CookiePolicy";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/">{() => <Home />}</Route>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/content" component={AdminContent} />
      <Route path="/admin/articles" component={AdminArticles} />
      <Route path="/admin/media" component={AdminMedia} />
      <Route path="/admin/theme" component={AdminTheme} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/pages" component={AdminPages} />
      <Route path="/admin/brand" component={AdminBrand} />
      <Route path="/admin/seo" component={AdminSEO} />
      <Route path="/admin/navigation" component={AdminNavigation} />
      <Route path="/admin/forms" component={AdminForms} />
      <Route path="/admin/redirects" component={AdminRedirects} />
      <Route path="/admin/code" component={AdminCode} />
      <Route path="/admin/backup" component={AdminBackupTimeMachine} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/events" component={AdminEvents} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/shop" component={AdminShop} />
      {/* New admin routes */}
      <Route path="/admin/reviews" component={AdminReviews} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/attendees" component={AdminAttendees} />
      <Route path="/admin/revenue" component={AdminRevenue} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/financial-analytics" component={AdminFinancialAnalytics} />
      <Route path="/admin/resources" component={AdminResourcesPage} />
      <Route path="/admin/messages" component={AdminContactMessages} />
      <Route path="/admin/carousel">{() => { window.location.href = '/admin/carousels'; return null; }}</Route>
      <Route path="/admin/carousels" component={AdminCarouselManager} />
      <Route path="/admin/ai-training" component={AdminAITraining} />
      <Route path="/admin/page-builder" component={PageBuilderPage} />
      <Route path="/admin/page-builder/:pageId" component={PageBuilderPage} />
      <Route path={"/404"} component={NotFound} />
      <Route path="/about">{() => <About />}</Route>
      <Route path="/about-just-empower" component={AboutJustEmpower} />
      <Route path="/philosophy" component={Philosophy} />
      <Route path="/offerings" component={Offerings} />
      <Route path="/journal">{() => <Journal />}</Route>
      <Route path="/contact">{() => <Contact />}</Route>
      <Route path="/founder">{() => <About />}</Route>
      <Route path="/vision-ethos" component={Philosophy} />
      <Route path="/workshops-programs" component={Offerings} />
      <Route path="/vix-journal-trilogy">{() => <Journal />}</Route>
      <Route path="/journal-trilogy">{() => <Journal />}</Route>
      <Route path="/blog-she-writes">{() => <Journal />}</Route>
      <Route path="/blog">{() => <Journal />}</Route>
      <Route path="/blog/:slug" component={ArticleDetail} />
      {/* Shop, Events, Resources pages */}
      <Route path="/shop">{() => <Shop />}</Route>
      <Route path="/community-events">{() => <CommunityEvents />}</Route>
      <Route path="/resources">{() => <Resources />}</Route>
      <Route path="/events">{() => <Events />}</Route>
      {/* Product and event detail routes must come before dynamic router */}
      <Route path="/shop/:slug" component={ProductDetail} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/events/:slug" component={EventDetail} />
      {/* Legal Pages */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/accessibility" component={AccessibilityStatement} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      {/* Dynamic page router handles all other pages based on template field */}
      <Route path="/:slug" component={DynamicPageRouter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [location] = useLocation();
  
  // Check if we're on an admin page
  const isAdminPage = location.startsWith('/admin');

  // Only show preloader on initial load or home page refresh
  useEffect(() => {
    if (location !== '/') {
      setIsLoading(false);
    }
  }, []);

  return (
    <ErrorBoundary>
      <CartProvider>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <FontProvider>
        <TooltipProvider>
          <Toaster />
          {isLoading && !isAdminPage && <Preloader onComplete={() => setIsLoading(false)} />}
          <div className={`transition-opacity duration-1000 ${isLoading && !isAdminPage ? 'opacity-0' : 'opacity-100'}`}>
            {/* Only show Header and Footer on non-admin pages */}
            {!isAdminPage && <Header />}
            <Router />
            {!isAdminPage && <Footer />}
            {!isAdminPage && <NewsletterPopup />}
            {!isAdminPage && <AIChatAssistant />}
            {!isAdminPage && <AnalyticsTracker />}
            <Analytics />
          </div>
        </TooltipProvider>
        </FontProvider>
      </ThemeProvider>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;
