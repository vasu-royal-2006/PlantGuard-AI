import { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import ErrorMessage from './ErrorMessage';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export default function ImageUploader({ onFileSelect, disabled }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validate = useCallback((file) => {
    if (!file) return 'No file selected.';
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported file type "${file.type}". Please upload JPG, PNG, or WEBP.`;
    }
    if (file.size > MAX_SIZE) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 8 MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file) => {
      setError('');
      const err = validate(file);
      if (err) {
        setError(err);
        onFileSelect(null, null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        // Validate it's actually an image
        const img = new Image();
        img.onload = () => {
          setPreview(e.target.result);
          setFileName(file.name);
          onFileSelect(file, e.target.result);
        };
        img.onerror = () => {
          setError('The file could not be read as a valid image.');
          onFileSelect(null, null);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    [validate, onFileSelect]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      if (disabled) return;
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled]
  );

  const handleChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const remove = useCallback(() => {
    setPreview(null);
    setFileName('');
    setError('');
    onFileSelect(null, null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onFileSelect]);

  return (
    <div className="w-full">
      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-brand-teal bg-white cursor-pointer'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-label="Upload a plant leaf image"
        >
          <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-700">
            Drag &amp; drop or click to upload
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, or WEBP — max 8 MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleChange}
            className="hidden"
            aria-label="Choose image file"
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <img
            src={preview}
            alt={`Preview of ${fileName}`}
            className="w-full max-h-80 object-contain bg-gray-50 p-2"
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm text-gray-600 truncate">{fileName}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="text-sm text-brand-teal hover:text-teal-800 font-medium disabled:opacity-50"
                aria-label="Replace uploaded image"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={disabled}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                aria-label="Remove uploaded image"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <ErrorMessage message={error} className="mt-3" />}
    </div>
  );
}
