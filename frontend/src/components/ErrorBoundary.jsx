import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-darkBg text-primaryText p-6">
          <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-glassBorder text-center space-y-6 animate-fade-in">
            <div className="h-20 w-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="h-10 w-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-sm text-secondaryText">The application encountered an unexpected error. Don't worry, your data is safe.</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 rounded-2xl glass-btn-primary font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
