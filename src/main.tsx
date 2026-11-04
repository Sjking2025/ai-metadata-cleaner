import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './App';
import { PdfCleanerPage } from './pages/PdfCleanerPage';
import { VideoCleanerPage } from './pages/VideoCleanerPage';
import { RawCleanerPage } from './pages/RawCleanerPage';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/remove-metadata-from-images" element={<App />} />
        <Route path="/remove-metadata-from-pdf" element={<PdfCleanerPage />} />
        <Route path="/remove-metadata-from-video" element={<VideoCleanerPage />} />
        <Route path="/remove-metadata-from-raw" element={<RawCleanerPage />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
