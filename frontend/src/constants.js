export const MODEL_ORDER = [
  'baseline',
  'hue_only',
  'saturation_only',
  'brightness_only',
  'broad_colorjitter',
  'all_factor',
];

export const MODEL_META = {
  baseline: {
    key: 'baseline',
    label: 'Baseline',
    color: '#6B7280',
    description: 'None (no color augmentation during training).',
  },
  hue_only: {
    key: 'hue_only',
    label: 'Hue-only',
    color: '#F59E0B',
    description: 'ColorJitter(hue=0.2)',
  },
  saturation_only: {
    key: 'saturation_only',
    label: 'Saturation-only',
    color: '#3B82F6',
    description: 'ColorJitter(saturation=0.5)',
  },
  brightness_only: {
    key: 'brightness_only',
    label: 'Brightness-only',
    color: '#F97316',
    description: 'ColorJitter(brightness=0.5)',
  },
  broad_colorjitter: {
    key: 'broad_colorjitter',
    label: 'Broad ColorJitter',
    color: '#8B5CF6',
    description: 'ColorJitter(brightness=0.4, contrast=0.4, saturation=0.4, hue=0.1)',
  },
  all_factor: {
    key: 'all_factor',
    label: 'All-factor',
    color: '#0F766E',
    description: 'ColorJitter(brightness=0.5, contrast=0.5, saturation=0.5, hue=0.2)',
  },
};
