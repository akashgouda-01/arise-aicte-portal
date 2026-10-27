import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7F6] flex items-center justify-center p-6 text-neutral-900">
          <div className="max-w-lg w-full bg-white rounded-lg border border-neutral-200 shadow-md p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Application Notice</h2>
              <p className="text-xs text-neutral-600 mt-1">
                The portal encountered an unexpected display issue while updating records.
              </p>
              {this.state.error && (
                <div className="mt-3 p-2 bg-neutral-50 rounded border border-neutral-200 text-left font-mono text-[11px] text-neutral-700 max-h-32 overflow-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-[#123B32] hover:bg-[#0B2924] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
