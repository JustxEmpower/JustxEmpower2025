/**
 * Just Empower Shop Error Boundaries
 * 
 * Granular error boundaries to prevent single component failures
 * from crashing the entire shop experience.
 * 
 * @version 2.0
 * @date January 2026
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShoppingCart, Package, CreditCard } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// ============================================================================
// BASE ERROR BOUNDARY
// ============================================================================

/**
 * Base error boundary with retry capability
 */
class BaseShopErrorBoundary extends Component<
  ErrorBoundaryProps & { 
    title: string;
    icon: ReactNode;
    retryText?: string;
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error('[Shop Error Boundary]', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
              {this.props.icon}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-amber-900 mb-2">
            {this.props.title}
          </h3>
          
          <p className="text-amber-700 mb-4">
            We encountered an issue loading this section.
          </p>
          
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {this.props.retryText || 'Try Again'}
          </button>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left text-xs text-amber-800 bg-amber-100 p-3 rounded">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap overflow-auto">
                {this.state.error.message}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// SHOP PAGE ERROR BOUNDARY
// ============================================================================

/**
 * Top-level error boundary for the entire shop page
 */
export class ShopErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[Shop Page Error]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-rose-100 rounded-full text-rose-600">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Unable to Load Shop
            </h2>
            
            <p className="text-gray-600 mb-6">
              We're having trouble loading the shop right now. 
              Please try refreshing the page.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Page
              </button>
              
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// PRODUCT GRID ERROR BOUNDARY
// ============================================================================

/**
 * Error boundary for the product listing grid
 */
export function ProductGridErrorBoundary({ 
  children, 
  onError 
}: ErrorBoundaryProps) {
  return (
    <BaseShopErrorBoundary
      title="Products Unavailable"
      icon={<Package className="w-6 h-6" />}
      retryText="Load Products"
      onError={onError}
    >
      {children}
    </BaseShopErrorBoundary>
  );
}

// ============================================================================
// PRODUCT CARD ERROR BOUNDARY
// ============================================================================

interface ProductCardErrorBoundaryProps extends ErrorBoundaryProps {
  productName?: string;
}

/**
 * Lightweight error boundary for individual product cards
 * Shows minimal error state to not disrupt grid layout
 */
export class ProductCardErrorBoundary extends Component<
  ProductCardErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ProductCardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Product Card Error]', this.props.productName, error);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Compact error state that fits in grid
      return (
        <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center aspect-square text-gray-500">
          <Package className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-sm">Unable to load</span>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// CART ERROR BOUNDARY
// ============================================================================

/**
 * Error boundary for cart components (slideout, cart page)
 */
export function CartErrorBoundary({ 
  children, 
  fallback,
  onError 
}: ErrorBoundaryProps) {
  return (
    <BaseShopErrorBoundary
      title="Cart Error"
      icon={<ShoppingCart className="w-6 h-6" />}
      retryText="Reload Cart"
      onError={onError}
      fallback={fallback}
    >
      {children}
    </BaseShopErrorBoundary>
  );
}

// ============================================================================
// CHECKOUT ERROR BOUNDARY
// ============================================================================

interface CheckoutErrorBoundaryProps extends ErrorBoundaryProps {
  onRecoverCart?: () => void;
}

/**
 * Error boundary for checkout flow with recovery options
 */
export class CheckoutErrorBoundary extends Component<
  CheckoutErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: CheckoutErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Checkout Error]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleBackToCart = () => {
    this.props.onRecoverCart?.();
    window.location.href = '/shop';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="max-w-md mx-auto p-6">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-rose-100 rounded-full text-rose-600">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-rose-900 mb-2">
              Checkout Error
            </h3>
            
            <p className="text-rose-700 mb-4">
              We couldn't complete your checkout. Your cart has been preserved.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleBackToCart}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Return to Cart
              </button>
            </div>
            
            {/* Payment was not processed message */}
            <p className="mt-4 text-sm text-rose-600">
              Don't worry — no payment was processed.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// PAYMENT ELEMENT ERROR BOUNDARY
// ============================================================================

/**
 * Specific error boundary for Stripe Payment Element
 */
export class PaymentElementErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Payment Element Error]', error);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          <CreditCard className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-3">
            Unable to load payment form
          </p>
          <button
            onClick={this.handleRetry}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Click to retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// HOOK: useErrorHandler
// ============================================================================

/**
 * Hook for reporting errors to parent boundaries or logging services
 */
export function useShopErrorHandler() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    console.error(`[Shop Error${context ? ` - ${context}` : ''}]`, error);
    
    // Could integrate with error tracking service here
    // e.g., Sentry.captureException(error, { tags: { context } });
  }, []);

  return { reportError };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ShopErrorBoundary,
  ProductGridErrorBoundary,
  ProductCardErrorBoundary,
  CartErrorBoundary,
  CheckoutErrorBoundary,
  PaymentElementErrorBoundary,
  useShopErrorHandler,
};
