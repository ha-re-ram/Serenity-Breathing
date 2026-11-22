import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

/**
 * Enterprise-grade React Error Boundary.
 * Prevents "White Screen of Death" by catching unhandled exceptions anywhere
 * in the React tree and rendering a calming, functional recovery screen.
 * Allows full text selection and one-click copying for error diagnostics.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Serenity ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    window.location.reload();
  };

  handleHardReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    } catch (e) {
      console.warn('Cache clearing failed:', e);
    }
    window.location.href = '/';
  };

  handleCopyError = () => {
    const errorText = `${this.state.error?.toString() || ''}\n${this.state.errorInfo?.componentStack || ''}`;
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(errorText);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      }
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center p-6 text-center font-sans text-deep-forest select-text">
          <div className="max-w-md w-full bg-card border border-cream rounded-[32px] p-8 shadow-xl flex flex-col items-center gap-6">
            {/* Visual Icon */}
            <div className="w-16 h-16 rounded-3xl bg-soft-sage/20 text-accent-green flex items-center justify-center shadow-lg shadow-accent-green/10">
              <Sparkles className="w-8 h-8 animate-pulse text-accent-green" />
            </div>

            {/* Messaging */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-serif text-deep-forest">
                Take a Deep Breath
              </h1>
              <p className="text-xs sm:text-sm text-accent-green/80 leading-relaxed">
                Something interrupted the rhythm, but your breathwork progress and settings remain safe on your device.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Button
                onClick={this.handleReload}
                className="bg-accent-green hover:bg-deep-forest text-white rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Sanctuary
              </Button>

              <Button
                variant="outline"
                onClick={this.handleHardReset}
                className="border-cream text-accent-green hover:bg-muted rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                Clear Cache & Restart
              </Button>
            </div>

            {/* Collapsible Error Details for Troubleshooting */}
            {this.state.error && (
              <div className="w-full text-left pt-2 border-t border-cream/60">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                    className="text-[10px] font-bold uppercase tracking-widest text-accent-green/60 hover:text-accent-green flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {this.state.showDetails ? 'Hide Details' : 'Technical Details'}
                  </button>

                  {this.state.showDetails && (
                    <button
                      type="button"
                      onClick={this.handleCopyError}
                      className="text-[10px] font-bold uppercase tracking-wider text-accent-green hover:text-deep-forest flex items-center gap-1"
                    >
                      {this.state.copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Details</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {this.state.showDetails && (
                  <pre className="mt-3 p-3 bg-muted rounded-xl text-[10px] font-mono text-deep-forest/80 overflow-x-auto max-h-40 text-left whitespace-pre-wrap break-words select-all">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
