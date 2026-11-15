import { useCallback, useState } from 'react';
import { predictAllModels } from '../services/api';
import { usePrediction } from '../context/PredictionContext';
import ImageUploader from '../components/ImageUploader';
import PredictionTable from '../components/PredictionTable';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { Send } from 'lucide-react';

export default function Detect() {
  const { setPrediction } = usePrediction();
  const [file, setFile] = useState(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = useCallback((f, url) => {
    setFile(f);
    setDataUrl(url);
    setResult(null);
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    const res = await predictAllModels(file);
    setLoading(false);

    if (res.ok) {
      setResult(res.data);
      setPrediction({ imageDataUrl: dataUrl, response: res.data });
    } else {
      setError(res.error);
    }
  }, [file, dataUrl, setPrediction]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-2">
        Detect Plant Disease
      </h1>
      <p className="text-gray-600 mb-8">
        Upload a leaf image and get predictions from all six models simultaneously.
      </p>

      <ImageUploader onFileSelect={handleFileSelect} disabled={loading} />

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="inline-flex items-center gap-2 bg-brand-teal text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Submit image for prediction"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          {loading ? 'Analyzing…' : 'Predict with all models'}
        </button>
      </div>

      {loading && <Loader text="Running inference on all six models…" />}
      {error && <ErrorMessage message={error} className="mt-6" />}

      {result && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">Prediction Results</h2>
          </div>
          <PredictionTable
            predictions={result.predictions}
            modelOrder={result.model_order}
          />
        </div>
      )}
    </div>
  );
}
