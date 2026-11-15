import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FlaskConical, Microscope } from 'lucide-react';
import { fetchAccuracy } from '../services/api';
import { MODEL_ORDER, MODEL_META } from '../constants';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function Home() {
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchAccuracy();
      if (cancelled) return;
      if (res.ok) {
        setAccuracy(res.data);
      } else {
        setError(res.error);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const getAccuracyForModel = (key) => {
    if (!accuracy) return null;
    const row = accuracy.find((r) => r.model === key);
    return row ? row.accuracy : null;
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-50 via-white to-emerald-50 py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark leading-tight">
            Evaluating Photometric Robustness in Plant Disease Classification Through Targeted Color Augmentation
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            A research prototype evaluating how targeted photometric augmentations affect convolutional neural network robustness under synthetic color distortions.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/robustness"
              className="inline-flex items-center gap-2 bg-brand-teal text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors shadow-sm"
            >
              <FlaskConical className="w-5 h-5" aria-hidden="true" />
              Explore the experiment
            </Link>
            <Link
              to="/detect"
              className="inline-flex items-center gap-2 bg-white text-brand-teal border-2 border-brand-teal px-6 py-3 rounded-lg font-medium hover:bg-teal-50 transition-colors"
            >
              <Microscope className="w-5 h-5" aria-hidden="true" />
              Try six-model prediction
            </Link>
          </div>
        </div>
      </section>

      {/* Research question */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-teal-50 border-l-4 border-brand-teal rounded-r-xl p-6">
            <p className="text-sm font-semibold text-brand-teal uppercase tracking-wide mb-2">
              Research Question
            </p>
            <p className="text-lg text-brand-dark font-medium leading-relaxed">
              Does color augmentation provide general color robustness, or does robustness mainly apply to the specific color factor used during training?
            </p>
          </div>
        </div>
      </section>

      {/* Model cards */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-brand-dark text-center mb-8">
            Six Models, One Architecture
          </h2>

          {loading && <Loader text="Loading model accuracies…" />}
          {error && <ErrorMessage message={error} className="max-w-lg mx-auto" />}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MODEL_ORDER.map((key) => {
                const meta = MODEL_META[key];
                const acc = getAccuracyForModel(key);
                return (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="inline-block w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
                        aria-hidden="true"
                      />
                      <h3 className="font-semibold text-gray-800">{meta.label}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{meta.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-brand-dark font-mono tabular-nums">
                        {acc !== null ? `${Number(acc).toFixed(2)}%` : '—'}
                      </span>
                      <span className="text-xs text-gray-500">clean accuracy</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Research findings preview */}
      <section className="py-12 px-4 bg-gradient-to-r from-teal-700 to-teal-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Research findings preview</h2>
          <p className="text-teal-100 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
            Robustness depends on the distortion factor and the training exposure — see the results.
          </p>
          <Link
            to="/robustness"
            className="inline-flex items-center gap-2 mt-6 text-white font-medium border-b-2 border-teal-300 hover:border-white transition-colors pb-1"
          >
            View full results
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
