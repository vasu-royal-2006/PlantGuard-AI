import { Link } from 'react-router-dom';
import { usePrediction } from '../context/PredictionContext';
import { MODEL_ORDER, MODEL_META } from '../constants';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export default function CompareModels() {
  const { prediction } = usePrediction();

  if (!prediction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-dark mb-4">Compare Models</h1>
        <p className="text-gray-600 mb-6">
          No prediction data available. Run a prediction first to compare model outputs.
        </p>
        <Link
          to="/detect"
          className="inline-flex items-center gap-2 bg-brand-teal text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors shadow-sm"
        >
          Go to Detect
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const { imageDataUrl, response } = prediction;
  const { predictions } = response;
  const modelOrder = response.model_order || MODEL_ORDER;

  // Build chart data
  const chartData = modelOrder.map((key) => ({
    key,
    name: MODEL_META[key]?.label || key,
    confidence: predictions[key] ? predictions[key].confidence * 100 : 0,
    color: MODEL_META[key]?.color || '#6B7280',
  }));

  // Find highest confidence
  const maxConf = Math.max(...chartData.map((d) => d.confidence));
  const highestKey = chartData.find((d) => d.confidence === maxConf)?.key;

  // Check class disagreements
  const classes = [...new Set(modelOrder.map((k) => predictions[k]?.class_name).filter(Boolean))];
  const hasDisagreement = classes.length > 1;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-2">
        Compare Models
      </h1>
      <p className="text-gray-600 mb-8">
        Side-by-side comparison of all six model predictions on your uploaded image.
      </p>

      {/* Uploaded image thumbnail */}
      {imageDataUrl && (
        <div className="mb-8 flex justify-center">
          <img
            src={imageDataUrl}
            alt="Uploaded leaf"
            className="max-h-48 rounded-lg border border-gray-200 shadow-sm"
          />
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Confidence Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Confidence']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
            />
            <Bar dataKey="confidence" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 mt-3">
          Confidence is softmax output, not a calibrated probability of correctness.
        </p>
      </div>

      {/* Disagreement callout */}
      {hasDisagreement && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 mb-8" role="alert">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold text-sm">Class Disagreement Detected</p>
            <p className="text-sm mt-1">
              Models disagree on the predicted class. The following classes were predicted:{' '}
              {classes.map((c, i) => (
                <span key={c}>
                  <strong>{c}</strong>{i < classes.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelOrder.map((key) => {
          const pred = predictions[key];
          if (!pred) return null;
          const meta = MODEL_META[key] || { color: '#6B7280', label: key };
          const isHighest = key === highestKey;
          return (
            <div
              key={key}
              className={`rounded-xl border p-4 transition-shadow ${
                isHighest
                  ? 'border-brand-teal shadow-md ring-2 ring-brand-teal/20 bg-teal-50/50'
                  : 'border-gray-200 shadow-sm bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden="true"
                />
                <span className="font-semibold text-sm text-gray-800">{meta.label}</span>
                {isHighest && (
                  <span className="ml-auto text-xs bg-brand-teal text-white px-2 py-0.5 rounded-full font-medium">
                    Highest
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-1">
                <span className="text-gray-500">Class:</span> {pred.class_name}
              </p>
              <p className="text-lg font-bold font-mono tabular-nums text-brand-dark">
                {(pred.confidence * 100).toFixed(2)}%
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-gray-500 mt-8 text-center">
        All six models share the same architecture and training data; they differ only in the color augmentation applied during training.
      </p>
    </div>
  );
}
