import { AlertOctagon } from 'lucide-react';

export default function Limitations() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <div className="flex items-center gap-3 mb-2">
        <AlertOctagon className="w-8 h-8 text-amber-600 flex-shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">
          Research Limitations & Scope
        </h1>
      </div>
      <p className="text-gray-600 mb-8 leading-relaxed">
        To maintain scientific integrity and prevent misinterpretation of findings, the following experimental constraints and limitations should be noted:
      </p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <ul className="space-y-4 text-gray-700 leading-relaxed list-disc pl-5">
          <li>
            One architecture (ResNet18) and one PlantVillage-derived dataset for the main controlled experiment.
          </li>
          <li>
            The strongest hue shift tested (+0.30) is synthetic and is not equivalent to real-world camera or lighting variation.
          </li>
          <li>
            Saturation and brightness distortions in the 0.8–1.2× range had little effect on any model; conclusions about those factors are limited to that range.
          </li>
          <li>
            Broad ColorJitter was trained with <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">hue=0.1</code>; its drop at <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">hue=0.30</code> reflects out-of-distribution testing, not a generalization failure.
          </li>
          <li>
            This system is a research prototype and must not be used for real agricultural decisions.
          </li>
          <li>
            Softmax confidences are not calibrated probabilities of correctness.
          </li>
          <li>
            All results come from a single training run per model; run-to-run variance has not been characterized.
          </li>
        </ul>
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Notice:</strong> PlantGuard AI is an academic research demonstration for studying visual representation robustness. It is explicitly not designed, tested, or certified for in-field agricultural diagnostics or crop management decisions.
      </div>
    </div>
  );
}

