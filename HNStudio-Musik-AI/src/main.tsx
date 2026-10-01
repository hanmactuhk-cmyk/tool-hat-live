// Ensure window.fetch has a setter if any library or extension attempts to assign to it
try {
  const currentFetch = window.fetch ? window.fetch.bind(window) : undefined;
  let activeFetch = currentFetch;
  Object.defineProperty(window, 'fetch', {
    get() {
      return activeFetch;
    },
    set(v) {
      activeFetch = v;
    },
    configurable: true,
    enumerable: true,
  });
} catch {
  // Ignored if already defined or restricted
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
