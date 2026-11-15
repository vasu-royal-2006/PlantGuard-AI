import { AlertTriangle } from 'lucide-react';

export default function ResearchBanner() {
  return (
    <div className="bg-amber-50 border-y border-amber-200 px-4 py-3" role="alert">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="font-medium">
          PlantGuard AI is a research prototype. Not an agricultural diagnosis service.
        </span>
      </div>
    </div>
  );
}
