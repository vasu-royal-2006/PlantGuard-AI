import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  timeout: 120000,
});

function wrapError(err) {
  if (err.response) {
    const msg = err.response.data?.detail || err.response.statusText || 'Server error';
    return { ok: false, error: `${err.response.status}: ${msg}` };
  }
  if (err.request) {
    return { ok: false, error: 'Network error — could not reach the server.' };
  }
  return { ok: false, error: err.message || 'Unknown error' };
}

export async function predictAllModels(file) {
  try {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/api/predict', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function fetchAccuracy() {
  try {
    const res = await api.get('/api/results/accuracy');
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function fetchRobustness() {
  try {
    const res = await api.get('/api/results/robustness');
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function fetchClassNames() {
  try {
    const res = await api.get('/api/class-names');
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function requestAugmentPreview(file, hue, saturation, brightness) {
  try {
    const form = new FormData();
    form.append('file', file);
    form.append('hue', hue);
    form.append('saturation', saturation);
    form.append('brightness', brightness);
    const res = await api.post('/api/augment-preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}

export async function checkHealth() {
  try {
    const res = await api.get('/api/health');
    return { ok: true, data: res.data };
  } catch (err) {
    return wrapError(err);
  }
}
