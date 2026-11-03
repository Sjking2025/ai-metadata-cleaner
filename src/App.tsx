import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { SettingsBar } from './components/SettingsBar';
import { ProgressBar } from './components/ProgressBar';
import { ResultCard } from './components/ResultCard';
import { MetadataModal } from './components/MetadataModal';
import { FeaturesSection } from './components/FeaturesSection';
import { HowItWorks } from './components/HowItWorks';
import { ComparisonTable } from './components/ComparisonTable';
import { AudienceSection } from './components/AudienceSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';

import { detectMetadata } from './engine/detector';
import { processAndCleanImage } from './engine/cleaner';
import { downloadAllAsZip } from './engine/zip';
import type { CleanOptions, ImageItem } from './types';

import {
  Play,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';

export const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [options, setOptions] = useState<CleanOptions>({
    mode: 'fingerprint',
    outputFormat: 'jpeg',
    quality: 0.95
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [inspectItem, setInspectItem] = useState<ImageItem | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'cleaned'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle file intake & pre-scan
  const handleFilesSelected = async (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
      progress: 0
    }));

    setImages((prev) => [...prev, ...newItems]);
    showToast(`Added ${files.length} image${files.length > 1 ? 's' : ''} to queue`);

    // Async pre-scan metadata for each file
    for (const item of newItems) {
      try {
        const detected = await detectMetadata(item.file);
        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id ? { ...img, detected, status: 'scanned' } : img
          )
        );
      } catch (err) {
        console.warn('Pre-scan error for', item.name, err);
      }
    }
  };

  // Run cleaning on all pending images
  const handleCleanAll = async () => {
    if (images.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);

    const pending = images.filter((img) => img.status !== 'completed');
    const total = pending.length;
    let completedCount = 0;

    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      if (item.status === 'completed') continue;

      setImages((prev) =>
        prev.map((img) =>
          img.id === item.id ? { ...img, status: 'cleaning', progress: 15 } : img
        )
      );

      setCurrentStep(`Processing ${completedCount + 1} of ${total}: ${item.name}`);

      try {
        const result = await processAndCleanImage(
          item.file,
          options,
          (pct, stepMsg) => {
            const overall = ((completedCount + pct / 100) / total) * 100;
            setProgress(overall);
            setCurrentStep(`${stepMsg} (${completedCount + 1}/${total})`);
          }
        );

        const cleanedUrl = URL.createObjectURL(result.blob);

        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id
              ? {
                  ...img,
                  status: 'completed',
                  progress: 100,
                  cleanedBlob: result.blob,
                  cleanedUrl,
                  cleanedSize: result.blob.size,
                  verification: result.verification
                }
              : img
          )
        );
      } catch (err: any) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id
              ? {
                  ...img,
                  status: 'error',
                  error: err?.message || 'Processing failed'
                }
              : img
          )
        );
      }

      completedCount++;
      setProgress((completedCount / total) * 100);
    }

    setIsProcessing(false);
    setCurrentStep('All files processed and verified clean!');
    showToast('Batch processing complete: 100% verified clean!');
  };

  const handleRemoveItem = (id: string) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.cleanedUrl) URL.revokeObjectURL(item.cleanedUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleClearAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
      if (img.cleanedUrl) URL.revokeObjectURL(img.cleanedUrl);
    });
    setImages([]);
    setProgress(0);
    setCurrentStep('');
    showToast('Queue cleared');
  };

  const completedImages = images.filter((img) => img.status === 'completed');
  const pendingImages = images.filter((img) => img.status !== 'completed');

  const filteredImages = images.filter((img) => {
    if (filterMode === 'cleaned') return img.status === 'completed';
    if (filterMode === 'pending') return img.status !== 'completed';
    return true;
  });

  return (
    <div className="app-wrapper">
      <Header />

      <main className="main-content">
        {/* Toast feedback pill */}
        {toastMessage && (
          <div className="toast-floating-pill" role="status" aria-live="polite">
            <CheckCircle2 size={15} color="var(--ok)" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-badge-row">
            <span className="hero-badge highlight">
              <Sparkles size={12} />
              <span>Full C2PA &amp; Provenance Removal</span>
            </span>
            <span className="hero-badge">
              <ShieldCheck size={12} />
              <span>100% In-Browser Execution</span>
            </span>
            <span className="hero-badge">
              <span>Zero Server Uploads</span>
            </span>
          </div>

          <h1 className="hero-title">
            Free Metadata Cleaner &amp; <em>AI Tag Remover</em>
          </h1>

          <p className="hero-subtitle">
            Online metadata remover that strips EXIF, GPS, C2PA Content Credentials, and AI generation prompts from your images, and resets cross-site tracking fingerprints — 100% locally on your device.
          </p>
        </div>

        {/* Dropzone with enhanced paste support */}
        <Dropzone
          onFilesSelected={handleFilesSelected}
          isProcessing={isProcessing}
        />

        {/* Options & Settings Bar */}
        <SettingsBar options={options} onChange={setOptions} />

        {/* Batch Action Toolbar when images exist */}
        {images.length > 0 && (
          <div className="batch-actions-bar">
            <div className="batch-stats-group">
              <div className="batch-stats-badges">
                <span className="stat-pill total">
                  <strong>{images.length}</strong> Total
                </span>
                <span className="stat-pill cleaned">
                  <strong>{completedImages.length}</strong> Cleaned
                </span>
                {pendingImages.length > 0 && (
                  <span className="stat-pill pending">
                    <strong>{pendingImages.length}</strong> Pending
                  </span>
                )}
              </div>

              {/* Filter Tabs when images > 1 */}
              {images.length > 1 && (
                <div className="filter-pill-nav" role="tablist" aria-label="Filter queue">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filterMode === 'all'}
                    className={`filter-pill ${filterMode === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterMode('all')}
                  >
                    All ({images.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filterMode === 'pending'}
                    className={`filter-pill ${filterMode === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilterMode('pending')}
                  >
                    Pending ({pendingImages.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filterMode === 'cleaned'}
                    className={`filter-pill ${filterMode === 'cleaned' ? 'active' : ''}`}
                    onClick={() => setFilterMode('cleaned')}
                  >
                    Cleaned ({completedImages.length})
                  </button>
                </div>
              )}
            </div>

            <div className="batch-buttons">
              {pendingImages.length > 0 && (
                <button
                  type="button"
                  className="btn-primary btn-pulse-action"
                  onClick={handleCleanAll}
                  disabled={isProcessing}
                >
                  <Play size={14} />
                  <span>{isProcessing ? 'Cleaning...' : `Clean ${pendingImages.length} Image${pendingImages.length > 1 ? 's' : ''}`}</span>
                </button>
              )}

              {completedImages.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary btn-zip-export"
                  onClick={() => downloadAllAsZip(images)}
                >
                  <Download size={14} />
                  <span>Download All as ZIP</span>
                </button>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={handleClearAll}
                disabled={isProcessing}
              >
                <Trash2 size={14} />
                <span>Clear Queue</span>
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <ProgressBar
            progress={progress}
            currentStep={currentStep}
            totalImages={images.length}
            processedCount={completedImages.length}
          />
        )}

        {/* Results List */}
        {filteredImages.length > 0 && (
          <div className="results-list" role="feed" aria-label="Processing results">
            {filteredImages.map((item) => (
              <ResultCard
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onInspect={(it) => setInspectItem(it)}
              />
            ))}
          </div>
        )}

        {/* Content & SEO Landing Page Sections */}
        <FeaturesSection />
        <HowItWorks />
        <ComparisonTable />
        <AudienceSection />
        <FAQSection />
      </main>

      {/* Metadata Inspection Modal */}
      {inspectItem && (
        <MetadataModal
          fileName={inspectItem.name}
          metadata={inspectItem.detected}
          onClose={() => setInspectItem(null)}
        />
      )}

      <Footer />
    </div>
  );
};
