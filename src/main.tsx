import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SettingsProvider } from './context/SettingsContext';
import ErrorBoundary from './ErrorBoundary';
import './main.css';

const root = document.createElement('div');

document.body.appendChild(root);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
