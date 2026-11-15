import { useEffect, useState } from 'react';
import { fetchAccuracy, fetchRobustness } from '../services/api';
import { MODEL_ORDER, MODEL_META } from '../constants';
import MetricChart from '../components/MetricChart';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { AlertCircle, BarChart3 } from 'lucide-react';

export default function Robustness() {
  const [accuracyData, setAccuracyData] = useState(null);
  const [robustnessData, setRobustnessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [accRes, robRes] = await Promise.all([
        fetchAccuracy(),
        fetchRobustness(),
      ]);

      if (cancelled) return;

      if (accRes.ok && robRes.ok) {
        setAccuracyData(accRes.data);
        setRobustnessData(robRes.data);
      } else {
        setError(accRes.error || robRes.error || 'Failed to load experimental results.');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <Loader text="Loading experimental robustness results…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorMessage message={error} />
      </div>
    );
  }

  // 1. Clean accuracy chart data
  const cleanChartData = MODEL_ORDER.map((key) => {
    const row = accuracyData?.find((r) => r.model === key);
    return {
      key,
      name: MODEL_META[key]?.label || key,
      accuracy: row ? row.accuracy : 0,
    };
  });

  // Helper to extract distortion series for grouped bar / line charts
  const buildDistortionData = (distType, strengths) => {
    return strengths.map((strVal) => {
      const point = {
        strength: String(strVal),
      };
      MODEL_ORDER.forEach((modelKey) => {
        const row = robustnessData?.find(
          (r) =>
            r.model === modelKey &&
            r.distortion === distType &&
            Math.abs(Number(r.strength) - Number(strVal)) < 0.001
        );
        point[modelKey] = row ? row.accuracy : 0;
      });
      return point;
    });
  };

  const hueData = buildDistortionData('hue', [0.1, 0.2, 0.3]);
  const saturationData = buildDistortionData('saturation', [0.8, 1.0, 1.2]);
  const brightnessData = buildDistortionData('brightness', [0.8, 1.0, 1.2]);

  // Heatmap columns
  const heatmapCols = [
    { dist: 'clean', str: 0.0, label: 'Clean (0)' },
    { dist: 'hue', str: 0.1, label: 'Hue 0.1' },
    { dist: 'hue', str: 0.2, label: 'Hue 0.2' },
    { dist: 'hue', str: 0.3, label: 'Hue 0.3' },
    { dist: 'saturation', str: 0.8, label: 'Sat 0.8×' },
    { dist: 'saturation', str: 1.0, label: 'Sat 1.0×' },
    { dist: 'saturation', str: 1.2, label: 'Sat 1.2×' },
    { dist: 'brightness', str: 0.8, label: 'Bright 0.8×' },
    { dist: 'brightness', str: 1.0, label: 'Bright 1.0×' },
    { dist: 'brightness', str: 1.2, label: 'Bright 1.2×' },
  ];

  const getHeatmapColor = (acc) => {
    if (acc >= 99.0) return 'bg-emerald-100 text-emerald-900';
    if (acc >= 95.0) return 'bg-teal-100 text-teal-900';
    if (acc >= 80.0) return 'bg-amber-100 text-amber-900';
    if (acc >= 60.0) return 'bg-orange-100 text-orange-900';
    return 'bg-red-100 text-red-900';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-2">
          Experimental Robustness Results
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Empirical evaluation of all six ResNet18 checkpoints under systematic photometric distortions on the PlantVillage test split (8,146 images).
        </p>
      </div>

      {/* Section 1: Clean Accuracy */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-teal" />
          1. Clean Test Accuracy by Model
        </h2>
        <MetricChart
          type="horizontalBar"
          data={cleanChartData}
          title="Clean Accuracy (%) — No Distortion"
          caption="Dataset: PlantVillage test split (8,146 images) | Distortion: None | Metric: Top-1 Accuracy (%)"
        />
      </section>

      {/* Section 2: Headline Chart - Hue Distortion */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-teal" />
          2. Hue Distortion Robustness (Headline Result)
        </h2>

        {/* Dedicated Callout */}
        <div className="flex items-start gap-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 mb-4" role="note">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 font-medium leading-relaxed">
            Hue shift at +0.20 is a strong synthetic shift, not equivalent to ordinary outdoor lighting variation.
          </p>
        </div>

        <MetricChart
          type="groupedBar"
          data={hueData}
          title="Accuracy vs. Hue Shift Strength"
          caption="Dataset: PlantVillage test split (8,146 images) | Distortion order: adjust_hue before ToTensor/Normalize | X-axis: Fraction of hue circle [0.1, 0.2, 0.3] | Metric: Top-1 Accuracy (%)"
        />
      </section>

      {/* Section 3: Saturation Distortion */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-teal" />
          3. Saturation Distortion Robustness
        </h2>
        <MetricChart
          type="groupedBar"
          data={saturationData}
          title="Accuracy vs. Saturation Multiplier"
          caption="Dataset: PlantVillage test split (8,146 images) | Distortion order: adjust_saturation before ToTensor/Normalize | X-axis: Multiplicative scale [0.8, 1.0, 1.2] | Metric: Top-1 Accuracy (%)"
        />
        <p className="text-xs text-gray-500 mt-2 italic px-2">
          Distortion range 0.8–1.2× had little effect on any model — the differences here are within run-to-run variance.
        </p>
      </section>

      {/* Section 4: Brightness Distortion */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-teal" />
          4. Brightness Distortion Robustness
        </h2>
        <MetricChart
          type="groupedBar"
          data={brightnessData}
          title="Accuracy vs. Brightness Multiplier"
          caption="Dataset: PlantVillage test split (8,146 images) | Distortion order: adjust_brightness before ToTensor/Normalize | X-axis: Multiplicative scale [0.8, 1.0, 1.2] | Metric: Top-1 Accuracy (%)"
        />
        <p className="text-xs text-gray-500 mt-2 italic px-2">
          Distortion range 0.8–1.2× had little effect on any model — the differences here are within run-to-run variance.
        </p>
      </section>

      {/* Section 5: Heatmap Table */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          5. Complete Robustness Heatmap
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto p-4">
          <table className="w-full text-xs sm:text-sm text-center" role="table">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Model</th>
                {heatmapCols.map((c) => (
                  <th key={c.label} className="py-2 px-2 font-semibold text-gray-700 whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL_ORDER.map((modelKey) => {
                const meta = MODEL_META[modelKey];
                return (
                  <tr key={modelKey} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="text-left py-2.5 px-3 font-medium whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden="true"
                        />
                        {meta.label}
                      </span>
                    </td>
                    {heatmapCols.map((c) => {
                      let val = null;
                      if (c.dist === 'clean') {
                        const r = accuracyData?.find((item) => item.model === modelKey);
                        val = r ? r.accuracy : null;
                      } else {
                        const r = robustnessData?.find(
                          (item) =>
                            item.model === modelKey &&
                            item.distortion === c.dist &&
                            Math.abs(Number(item.strength) - Number(c.str)) < 0.001
                        );
                        val = r ? r.accuracy : null;
                      }

                      return (
                        <td key={c.label} className="py-2 px-2 font-mono tabular-nums">
                          {val !== null ? (
                            <span className={`inline-block px-2 py-0.5 rounded font-semibold text-xs ${getHeatmapColor(val)}`}>
                              {val.toFixed(2)}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-4 leading-relaxed">
            Values are top-1 accuracy (%) on 8,146 test images. Green cells indicate sustained accuracy (≥95%), amber indicates moderate degradation (80–95%), and red indicates severe breakdown (&lt;60%).
          </p>
        </div>
      </section>
    </div>
  );
}

