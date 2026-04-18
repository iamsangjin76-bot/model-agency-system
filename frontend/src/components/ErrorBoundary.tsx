import React from 'react';
import { AlertOctagon } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode; // optional custom fallback override
}

interface State {
  hasError: boolean;
  message: string;
}

// ── Default fallback UI ────────────────────────────────────────────────────

function DefaultFallback({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center space-y-4 p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
        <AlertOctagon className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          예기치 않은 오류가 발생했습니다
        </h1>
        {message && (
          <p className="text-sm text-gray-500 dark:text-gray-400 break-words">{message}</p>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          새로고침
        </button>
      </div>
    </div>
  );
}

// ── ErrorBoundary class component ──────────────────────────────────────────

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message ?? '' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <DefaultFallback message={this.state.message} />
      );
    }
    return this.props.children;
  }
}
