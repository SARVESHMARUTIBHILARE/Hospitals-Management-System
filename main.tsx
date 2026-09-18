import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign WebSocket/Vite HMR connection errors to keep the application stable on mobile and desktop previews
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
      event.reason.message?.includes('WebSocket') || 
      event.reason.message?.includes('websocket') ||
      event.reason.toString().includes('WebSocket')
    )) {
      event.preventDefault();
      console.warn('Suppressed benign HMR WebSocket rejection:', event.reason);
    }
  });

  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('WebSocket') || 
      event.message.includes('websocket')
    )) {
      event.preventDefault();
      console.warn('Suppressed benign HMR WebSocket error:', event.message);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

