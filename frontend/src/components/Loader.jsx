import { Loader2 } from 'lucide-react';

export default function Loader({ text = 'Processing…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3" role="status" aria-live="polite">
      <Loader2 className="w-8 h-8 text-brand-teal animate-spin" aria-hidden="true" />
      <p className="text-sm text-gray-600 font-medium">{text}</p>
    </div>
  );
}
