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

import { Play, Download, Trash2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

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

    const total = images.length;
    let completedCount = 0;

    for (let i = 0; i < total; i++) {
      const item = images[i];
      if (item.status === 'completed') {
        completedCount++;
        continue;
      }

      setImages((prev) =>
        prev.map((img) =>
          img.id === item.id ? { ...img, status: 'cleaning', progress: 10 } : img
        )
      );

      setCurrentStep(`Processing ${i + 1} of ${total}: ${item.name}`);

      try {
        const result = await processAndCleanImage(
          item.file,
          options,
          (pct, stepMsg) => {
            const itemProgress = pct;
            const overall = ((i + itemProgress / 100) / total) * 100;
            setProgress(overall);
            setCurrentStep(`${stepMsg} (${i + 1}/${total})`);
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
  };

  const completedImages = images.filter((img) => img.status === 'completed');

  return (
    <div className="app-wrapper">
      <Header />

      <main className="main-content">
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

        {/* Dropzone */}
        <Dropzone
          onFilesSelected={handleFilesSelected}
          isProcessing={isProcessing}
        />

        {/* Options & Settings Bar */}
        <SettingsBar options={options} onChange={setOptions} />

        {/* Batch Action Toolbar when images exist */}
        {images.length > 0 && (
          <div className="batch-actions-bar">
            <div className="batch-stats">
              <span><strong>{images.length}</strong> image{images.length === 1 ? '' : 's'} queued</span>
              <span>&bull;</span>
              <span><strong>{completedImages.length}</strong> cleaned &amp; verified</span>
            </div>

            <div className="batch-buttons">
              <button
                type="button"
                className="btn-primary"
                onClick={handleCleanAll}
                disabled={isProcessing}
              >
                <Play size={14} />
                <span>{isProcessing ? 'Cleaning...' : 'Clean All Images'}</span>
              </button>

              {completedImages.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
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
        {images.length > 0 && (
          <div className="results-list">
            {images.map((item) => (
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
