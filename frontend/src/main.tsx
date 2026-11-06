import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/app.css';
import { clearLegacyBrowserData } from './services/visitSession';

clearLegacyBrowserData();
window.history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
// Each document load begins at login; in-app hash navigation remains available after sign-in.
if (window.location.hash !== '#/login') {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/login`);
}
window.addEventListener('pageshow', event => {
  if (event.persisted) window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
