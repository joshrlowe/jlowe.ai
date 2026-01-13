import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)] p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[var(--color-primary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              Something went wrong
            </h1>

            <p className="text-[var(--color-text-secondary)] mb-8">
              We're sorry, but something unexpected happened. Please try
              refreshing the page.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left mb-8 p-4 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)]">
                <summary className="cursor-pointer text-[var(--color-text-secondary)] mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-[var(--color-text-muted)] overflow-auto">
                  {this.state.error.toString()}
                </pre>
                <pre className="text-xs text-[var(--color-text-muted)] overflow-auto mt-2">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
