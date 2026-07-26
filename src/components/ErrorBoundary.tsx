import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
          <div className="w-full max-w-md border border-border bg-card p-6 shadow-md rounded-[var(--radius)] text-center flex flex-col gap-4">
            <h2 className="text-[20px] font-semibold text-foreground">
              Ceva n-a mers bine
            </h2>
            <p className="text-[15px] text-muted-foreground">
              Pagina nu s-a putut încărca. Poți încerca din nou sau te poți întoarce la pagina de start.
            </p>
            <div className="flex flex-col gap-2 mt-2 w-full">
              <button
                onClick={() => window.location.reload()}
                className="w-full min-h-[52px] bg-primary text-primary-foreground font-semibold rounded-[var(--radius)] flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                Încearcă din nou
              </button>
              <button
                onClick={() => { window.location.href = "/"; }}
                className="w-full min-h-[52px] border border-border bg-card text-foreground font-semibold rounded-[var(--radius)] flex items-center justify-center hover:bg-muted/10 transition-colors"
              >
                Înapoi la Azi
              </button>
            </div>
            {isDev && this.state.error && (
              <div className="mt-4 text-left p-3 bg-muted/20 border border-border rounded-[var(--radius)] overflow-auto max-h-[200px]">
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
