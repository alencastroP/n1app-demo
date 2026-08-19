// src/context/ApiDocContext.jsx
import { createContext, useContext, useState } from 'react';

const ApiDocContext = createContext(null);

export function ApiDocProvider({ children }) {
  const [apiDocOpen, setApiDocOpen] = useState(false);
  return (
    <ApiDocContext.Provider value={{ apiDocOpen, setApiDocOpen }}>
      {children}
    </ApiDocContext.Provider>
  );
}

export function useApiDoc() {
  const ctx = useContext(ApiDocContext);
  if (!ctx) throw new Error('useApiDoc must be used inside ApiDocProvider');
  return ctx;
}
