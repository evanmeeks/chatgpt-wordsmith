import React from 'react';
import ReactDOM from 'react-dom/client';
import { SettingsProvider } from '../context/SettingsContext';
import Popup from './Popup';
import ErrorBoundary from '../ErrorBoundary';
import './index.css';

const root = document.createElement('div');
root.id = 'crx-root';
document.body.appendChild(root);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <SettingsProvider>
      <ErrorBoundary>
        <Popup />
      </ErrorBoundary>
    </SettingsProvider>
  </React.StrictMode>,
);
