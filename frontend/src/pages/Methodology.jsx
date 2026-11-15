import { useEffect, useState } from 'react';
import { fetchClassNames } from '../services/api';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { Database, Cpu, Sliders, Layers, CheckCircle2 } from 'lucide-react';

export default function Methodology() {
  const [classNames, setClassNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchClassNames();
      if (cancelled) return;
      if (res.ok) {
        setClassNames(res.data);
      } else {
        setError(res.error);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-2">
        Experimental Methodology
      </h1>
      <p className="text-gray-600 mb-10 leading-relaxed">
        Full experimental configuration, dataset specifications, model architecture, training hyperparameters, and evaluation protocols.
      </p>

      {/* 1. Dataset */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-brand-teal" />
          <h2 className="text-xl font-bold text-gray-800">1. Dataset</h2>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">
          The study utilizes the <strong>PlantVillage</strong> benchmark dataset, containing 38 crop-disease classes across 54,305 total images. The dataset was partitioned using a 70/15/15 stratified train/validation/test split with random seed 42.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="block text-xs uppercase tracking-wider text-gray-500 font-semibold">Training Split</span>
            <span className="text-xl font-bold text-brand-dark font-mono">38,013</span>
            <span className="block text-xs text-gray-500">70%</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="block text-xs uppercase tracking-wider text-gray-500 font-semibold">Validation Split</span>
            <span className="text-xl font-bold text-brand-dark font-mono">8,146</span>
            <span className="block text-xs text-gray-500">15%</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="block text-xs uppercase tracking-wider text-gray-500 font-semibold">Test Split</span>
            <span className="text-xl font-bold text-brand-dark font-mono">8,146</span>
            <span className="block text-xs text-gray-500">15%</span>
          </div>
        </div>
      </section>

      {/* 2. Class list */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Layers className="w-5 h-5 text-brand-teal" />
          <h2 className="text-xl font-bold text-gray-800">2. Class List (38 Categories)</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Canonical index order (0–37) exactly matching training and evaluation tensors:
        </p>
        {loading && <Loader text="Loading class index contract…" />}
        {error && <ErrorMessage message={error} />}
        {!loading && !error && (
          <div className="flex flex-wrap gap-2">
            {classNames.map((name, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-800"
              >
                <span className="font-mono font-semibold text-brand-teal">{idx}:</span>
                <span className="font-medium">{name}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 3. Architecture */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="w-5 h-5 text-brand-teal" />
          <h2 className="text-xl font-bold text-gray-800">3. Architecture</h2>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Standard <strong>ResNet18</strong> backbone initialized with ImageNet pre-trained weights (<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">torchvision.models.resnet18</code>). The final classification head is replaced with a single linear projection:
        </p>
        <div className="mt-3 bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
          model.fc = nn.Linear(512, 38)
        </div>
      </section>

      {/* 4. Training Hyperparameters */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Sliders className="w-5 h-5 text-brand-teal" />
          <h2 className="text-xl font-bold text-gray-800">4. Training Hyperparameters</h2>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
          <li className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="font-semibold block text-gray-900">Optimizer:</span> AdamW
          </li>
          <li className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="font-semibold block text-gray-900">Learning Rate:</span> 3e-4
          </li>
          <li className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="font-semibold block text-gray-900">Batch Size:</span> 32
          </li>
          <li className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="font-semibold block text-gray-900">Epochs:</span> 10
          </li>
          <li className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="font-semibold block text-gray-900">LR Schedule:</span> Cosine Annealing
          </li>
          <li className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="font-semibold block text-gray-900">Loss Function:</span> Cross-Entropy Loss
          </li>
          <li className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="font-semibold block text-gray-900">Precision:</span> Mixed precision (autocast + GradScaler)
          </li>
          <li className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="font-semibold block text-gray-900">Compute Hardware:</span> NVIDIA T4 GPU (Colab free tier)
          </li>
        </ul>
      </section>

      {/* 5. Augmentation Configs Table */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">5. Augmentation Configurations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse" role="table">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="py-3 px-4 font-semibold text-gray-700">Model</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Training augmentation</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">Baseline</td>
                <td className="py-3 px-4 text-gray-600">None</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">Hue-only</td>
                <td className="py-3 px-4 font-mono text-xs text-brand-dark"><code>ColorJitter(hue=0.2)</code></td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">Saturation-only</td>
                <td className="py-3 px-4 font-mono text-xs text-brand-dark"><code>ColorJitter(saturation=0.5)</code></td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">Brightness-only</td>
                <td className="py-3 px-4 font-mono text-xs text-brand-dark"><code>ColorJitter(brightness=0.5)</code></td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">Broad ColorJitter</td>
                <td className="py-3 px-4 font-mono text-xs text-brand-dark"><code>ColorJitter(brightness=0.4, contrast=0.4, saturation=0.4, hue=0.1)</code></td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">All-factor</td>
                <td className="py-3 px-4 font-mono text-xs text-brand-dark"><code>ColorJitter(brightness=0.5, contrast=0.5, saturation=0.5, hue=0.2)</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Evaluation pipeline */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">6. Evaluation Pipeline</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          For evaluation under photometric distortion, distortions are strictly applied to the raw PIL image before any normalization:
        </p>
        <div className="bg-teal-50 border border-brand-teal/20 rounded-lg p-4 font-mono text-xs text-brand-dark leading-relaxed">
          Raw PIL Image → RGB Conversion → Targeted Color Distortion (Hue / Saturation / Brightness) → Resize((224, 224)) → ToTensor() → Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        </div>
        <p className="text-sm text-gray-600 mt-3">
          <strong>Critical constraint:</strong> Distortion is explicitly applied <em>before</em> normalization. Distorting normalized tensors would violate natural image physics and produce mathematically invalid inputs.
        </p>
      </section>

      {/* 7. Metric */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-5 h-5 text-brand-teal" />
          <h2 className="text-xl font-bold text-gray-800">7. Evaluation Metric</h2>
        </div>
        <p className="text-gray-700 leading-relaxed">
          The primary reported metric is <strong>top-1 accuracy (%)</strong> on the held-out test split of 8,146 images across clean and distorted variations.
        </p>
      </section>
    </div>
  );
}

