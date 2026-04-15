import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import App from './App.tsx';
import './index.css';

const ThemeProviderAny = ThemeProvider as any;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProviderAny attribute="class" defaultTheme="light">
      <App />
    </ThemeProviderAny>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}
