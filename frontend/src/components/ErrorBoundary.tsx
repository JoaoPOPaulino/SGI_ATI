import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary capturou um erro:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
              <AlertTriangle
                size={48}
                className="text-red-400 mx-auto mb-4"
              />
              <h1 className="text-xl font-extrabold text-on-surface mb-2">
                Algo deu errado
              </h1>
              <p className="text-xs text-outline mb-4">
                Um erro inesperado ocorreu. Tente recarregar a página.
              </p>
              {this.state.error && (
                <pre className="text-[10px] text-red-600 bg-red-50/50 p-3 rounded-lg mb-4 max-h-32 overflow-y-auto text-left font-mono">
                  {this.state.error.message}
                </pre>
              )}
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md"
              >
                <RotateCcw size={14} />
                Tentar novamente
              </button>
            </div>
            <p className="text-[10px] text-outline font-semibold">
              SGI-ATI — Sistema de Gestão de Ativos
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
