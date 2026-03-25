import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-900 bg-red-950/60 px-4 py-3">
      <AlertTriangle className="shrink-0 text-red-400" size={18} />
      <p className="flex-1 text-sm text-red-300">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-red-300 transition-colors hover:bg-red-900/50 hover:text-red-100"
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
