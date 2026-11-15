import { useCallback, useEffect, useRef, useState } from 'react';
import { requestAugmentPreview, predictAllModels } from '../services/api';
import ImageUploader from '../components/ImageUploader';
import PredictionTable from '../components/PredictionTable';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { RotateCcw, Send } from 'lucide-react';

const DEFAULTS = { hue: 0, saturation: 1.0, brightness: 1.0 };

export default function AugmentationLab() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [hue, setHue] = useState(DEFAULTS.hue);
  const [saturation, setSaturation] = useState(DEFAULTS.saturation);
  const [brightness, setBrightness] = useState(DEFAULTS.brightness);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [predictLoading, setPredictLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const debounceRef = useRef(null);

  const handleFileSelect = useCallback((f, url) => {
    setFile(f);
    setOriginalUrl(url);
    setPreviewUrl(null);
    setResult(null);
    setError('');
    setHue(DEFAULTS.hue);
    setSaturation(DEFAULTS.saturation);
    setBrightness(DEFAULTS.brightness);
  }, []);

  // Debounced preview fetch
  useEffect(() => {
    if (!file) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      setError('');
      const res = await requestAugmentPreview(file, hue, saturation, brightness);
      setPreviewLoading(false);
      if (res.ok) {
        setPreviewUrl(`data:image/png;base64,${res.data.preview_base64}`);
      } else {
        setError(res.error);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [file, hue, saturation, brightness]);

  const handleReset = useCallback(() => {
    setHue(DEFAULTS.hue);
    setSaturation(DEFAULTS.saturation);
    setBrightness(DEFAULTS.brightness);
  }, []);

  const handlePredict = useCallback(async () => {
    if (!previewUrl) return;
    setPredictLoading(true);
    setError('');
    setResult(null);

    // Convert preview base64 to File
    const resp = await fetch(previewUrl);
    const blob = await resp.blob();
    const distortedFile = new File([blob], 'distorted.png', { type: 'image/png' });

    const res = await predictAllModels(distortedFile);
    setPredictLoading(false);
    if (res.ok) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  }, [previewUrl]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-2">
        Augmentation Lab
      </h1>
      <p className="text-gray-600 mb-8">
        Apply photometric distortions to a leaf image and see how each model responds.
      </p>

      <ImageUploader onFileSelect={handleFileSelect} disabled={predictLoading} />

      {file && (
        <>
          {/* Sliders */}
          <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-800">Distortion Controls</h2>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-brand-teal flex items-center gap-1 transition-colors"
                aria-label="Reset all sliders to default values"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Reset
              </button>
            </div>

            <SliderControl
              id="hue-slider"
              label="Hue"
              description="Fraction of the hue circle — matches the experimental hue shift."
              value={hue}
              onChange={setHue}
              min={-0.5}
              max={0.5}
              step={0.05}
            />
            <SliderControl
              id="saturation-slider"
              label="Saturation"
              description="Multiplicative scale factor (1.0 = unchanged)."
              value={saturation}
              onChange={setSaturation}
              min={0}
              max={2.0}
              step={0.05}
            />
            <SliderControl
              id="brightness-slider"
              label="Brightness"
              description="Multiplicative scale factor (1.0 = unchanged)."
              value={brightness}
              onChange={setBrightness}
              min={0}
              max={2.0}
              step={0.05}
            />
          </div>

          {/* Before / After */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                Original
              </div>
              {originalUrl && (
                <img
                  src={originalUrl}
                  alt="Original uploaded image"
                  className="w-full object-contain max-h-72 p-2 bg-gray-50"
                />
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                Distorted Preview
              </div>
              {previewLoading ? (
                <div className="flex items-center justify-center h-72">
                  <Loader text="Generating preview…" />
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Distorted preview image"
                  className="w-full object-contain max-h-72 p-2 bg-gray-50"
                />
              ) : (
                <div className="flex items-center justify-center h-72 text-gray-400 text-sm">
                  Adjust sliders to see preview
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Preview is generated server-side using the same distortion implementation as the evaluation pipeline.
          </p>

          {/* Predict button */}
          <div className="mt-6">
            <button
              onClick={handlePredict}
              disabled={!previewUrl || predictLoading}
              className="inline-flex items-center gap-2 bg-brand-teal text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Predict with the distorted image"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              {predictLoading ? 'Predicting…' : 'Predict with this distortion'}
            </button>
          </div>

          {predictLoading && <Loader text="Running inference…" />}
          {error && <ErrorMessage message={error} className="mt-6" />}

          {result && (
            <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Prediction on Distorted Image</h2>
              </div>
              <PredictionTable
                predictions={result.predictions}
                modelOrder={result.model_order}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SliderControl({ id, label, description, value, onChange, min, max, step }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-sm font-mono tabular-nums text-gray-500">
          {Number(value).toFixed(2)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-teal"
        aria-label={`${label}: ${description}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}
