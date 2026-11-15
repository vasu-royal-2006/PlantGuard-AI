import { createContext, useContext, useState } from 'react';

const PredictionContext = createContext(null);

export function PredictionProvider({ children }) {
  const [prediction, setPrediction] = useState(null);
  // prediction shape: { imageDataUrl: string, response: { predictions, model_order } }

  return (
    <PredictionContext.Provider value={{ prediction, setPrediction }}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  const ctx = useContext(PredictionContext);
  if (!ctx) {
    throw new Error('usePrediction must be used within PredictionProvider');
  }
  return ctx;
}
