/**
 * BlockErrorBoundary.tsx - Error Boundary for Page Builder Blocks
 * 
 * FIXES ADDRESSED:
 * - Prevents single block errors from crashing entire page
 * - Provides user-friendly error UI
 * - Allows retry/recovery
 * - Logs errors for debugging
 * 
 * LOCATION: /client/src/components/page-builder/BlockErrorBoundary.tsx
 * ACTION: Create this new file
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X, Copy, ChevronDown } from 'lucide-react';

interface Props {
  children: ReactNode;
  blockId: string;
  blockType: string;
  onReset?: () => void;
  onDelete?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class BlockErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error(
      `[BlockErrorBoundary] Error in block ${this.props.blockId} (${this.props.blockType}):`,
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }
    );
    
    this.setState({ errorInfo });

    // Report to error tracking service if available
    if (typeof window !== 'undefined') {
      // Sentry integration
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: {
            blockId: this.props.blockId,
            blockType: this.props.blockType,
          },
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      }

      // Store error in localStorage for debugging
      try {
        const errorLog = JSON.parse(localStorage.getItem('blockErrors') || '[]');
        errorLog.push({
          blockId: this.props.blockId,
          blockType: this.props.blockType,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        // Keep only last 50 errors
        if (errorLog.length > 50) {
          errorLog.shift();
        }
        localStorage.setItem('blockErrors', JSON.stringify(errorLog));
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false,
    });
    this.props.onReset?.();
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = [
      `Block Error Report`,
      `==================`,
      `Block ID: ${this.props.blockId}`,
      `Block Type: ${this.props.blockType}`,
      `Error: ${error?.message}`,
      ``,
      `Stack Trace:`,
      error?.stack,
      ``,
      `Component Stack:`,
      errorInfo?.componentStack,
    ].join('\n');

    navigator.clipboard.writeText(errorText).then(() => {
      // Could show a toast here
      console.log('Error copied to clipboard');
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="w-full p-6 bg-red-50 border border-red-200 rounded-lg my-2"
          data-error-boundary="true"
          data-block-id={this.props.blockId}
        >
          <div className="flex items-start gap-4">
            {/* Error Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>

            {/* Error Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-800">
                Block Failed to Render
              </h3>
              
              <p className="mt-1 text-sm text-red-600">
                The <code className="px-1 py-0.5 bg-red-100 rounded text-xs font-mono">
                  {this.props.blockType}
                </code> block encountered an error and couldn't display.
              </p>

              {/* Quick Error Message */}
              {this.state.error && (
                <p className="mt-2 text-xs text-red-500 font-mono bg-red-100/50 p-2 rounded">
                  {this.state.error.message}
                </p>
              )}

              {/* Expandable Details */}
              <div className="mt-3">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  <ChevronDown 
                    className={`w-3 h-3 transition-transform ${
                      this.state.showDetails ? 'rotate-180' : ''
                    }`} 
                  />
                  {this.state.showDetails ? 'Hide' : 'Show'} technical details
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 space-y-2">
                    {/* Stack Trace */}
                    {this.state.error?.stack && (
                      <details className="text-xs">
                        <summary className="text-red-500 cursor-pointer hover:text-red-700">
                          Stack Trace
                        </summary>
                        <pre className="mt-1 p-2 bg-red-100 rounded overflow-x-auto text-red-800 max-h-32 overflow-y-auto">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}

                    {/* Component Stack */}
                    {this.state.errorInfo?.componentStack && (
                      <details className="text-xs">
                        <summary className="text-red-500 cursor-pointer hover:text-red-700">
                          Component Stack
                        </summary>
                        <pre className="mt-1 p-2 bg-red-100 rounded overflow-x-auto text-red-800 max-h-32 overflow-y-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>

                <button
                  onClick={this.handleCopyError}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Error
                </button>

                {this.props.onDelete && (
                  <button
                    onClick={this.props.onDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove Block
                  </button>
                )}
              </div>

              {/* Help Text */}
              <p className="mt-4 text-xs text-red-400">
                If this persists, try refreshing the page or contact support with the error details.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC version for functional components
 */
export function withBlockErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  getBlockInfo: (props: P) => { blockId: string; blockType: string }
) {
  return function WithBlockErrorBoundary(props: P) {
    const { blockId, blockType } = getBlockInfo(props);
    
    return (
      <BlockErrorBoundary blockId={blockId} blockType={blockType}>
        <WrappedComponent {...props} />
      </BlockErrorBoundary>
    );
  };
}

export default BlockErrorBoundary;
