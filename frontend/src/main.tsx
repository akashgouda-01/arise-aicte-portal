import React from 'react';
import ReactDOM from 'react-dom/client';
import 'ux4g-web-components/styles.css';
import 'ux4g-web-components/design-system';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
