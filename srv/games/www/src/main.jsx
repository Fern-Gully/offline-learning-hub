import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { getPageConfig } from './data/pages.js';
import './index.css';

const rootElement = document.getElementById('root');
const pageId = rootElement?.dataset.page ?? 'arcade';
const pageConfig = getPageConfig(pageId);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App pageConfig={pageConfig} />
  </React.StrictMode>
);
