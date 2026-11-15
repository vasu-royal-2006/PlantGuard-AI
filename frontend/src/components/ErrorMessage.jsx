import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null;
  return (
    <div
      className={`flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm ${className}`}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
