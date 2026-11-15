import { MODEL_META } from '../constants';

export default function PredictionTable({ predictions, modelOrder }) {
  if (!predictions || !modelOrder) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700" scope="col">Model</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700" scope="col">Predicted Class</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700" scope="col">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {modelOrder.map((key) => {
            const pred = predictions[key];
            if (!pred) return null;
            const meta = MODEL_META[key] || { color: '#6B7280', label: key };
            return (
              <tr key={key} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium">{meta.label}</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">{pred.class_name}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {(pred.confidence * 100).toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-3 px-4">
        Confidence is softmax output, not a calibrated probability of correctness.
      </p>
    </div>
  );
}
