import React, { useState, useRef } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FormatNav } from '../components/FormatNav';
import { cleanRawPhoto, detectRawMetadata, type DetectedRawMetadata, type RawCleanResult } from '../engine/rawCleaner';
import JSZip from 'jszip';
import {
  Camera,
  Play,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Tag,
  Hash,
  User,
  Sliders,
  ChevronDown,
  AlertCircle,
  FileImage
} from 'lucide-react';

interface RawItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'idle' | 'scanned' | 'cleaning' | 'completed' | 'error';
  detected?: DetectedRawMetadata;
  cleanedBlob?: Blob;
  outputName?: string;
  outputType?: 'dng' | 'jpeg' | 'png';
  cleanedSize?: number;
  verification?: RawCleanResult['verification'];
  error?: string;
}

const RAW_FAQS = [
  {
    q: 'Why do camera RAW files leak more personal data than JPEGs?',
    a: 'Camera manufacturers (Canon, Sony, Nikon, Fujifilm) embed deep proprietary MakerNote tags in RAW files. These include your camera body serial number, lens serial number, shutter actuation count, camera owner name, copyright string, exact focal adjustments, and GPS coordinates. Reverse-search engines and gear databases can index your serial numbers to link all photos you have ever taken.'
  },
  {
    q: 'What camera RAW formats are supported?',
    a: 'Our engine parses and sanitizes Adobe DNG (.dng), Canon (.cr2, .cr3), Nikon (.nef), Sony (.arw), Fujifilm (.raf), Panasonic Lumix (.rw2), and Olympus (.orf).'
  },
  {
    q: 'How does the cleaner handle proprietary RAW formats?',
    a: 'For open Adobe DNG and TIFF RAW formats, the engine directly scrubs the IFD private tags, MakerNotes, and XMP packets. For proprietary formats (like CR2 or ARW), it extracts the high-resolution sensor frame or clean preview and removes all identifying hardware serials, producing a pristine sanitized output.'
  },
  {
    q: 'Can this remove camera serial numbers before submitting to photo contests?',
    a: 'Yes! Anonymizing submissions for photo contests, blind jury evaluations, or client deliveries is one of the primary use cases. All camera body serials, lens serials, and author tags are stripped.'
  }
];

export const RawCleanerPage: React.FC = () => {
  const [items, setItems] = useState<RawItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const rawExtensions = ['.cr2', '.cr3', '.nef', '.arw', '.dng', '.raf', '.rw2', '.orf', '.pef', '.tiff', '.tif'];
    const rawFiles = Array.from(files).filter((f) => {
      const ext = '.' + (f.name.split('.').pop()?.toLowerCase() || '');
      return rawExtensions.includes(ext) || f.type.includes('raw') || f.type.includes('dng');
    });

    if (rawFiles.length === 0) {
      showToast('Please select valid camera RAW files (DNG, CR2, NEF, ARW, etc.)');
      return;
    }

    const newItems: RawItem[] = rawFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      status: 'idle'
    }));

    setItems((prev) => [...prev, ...newItems]);
    showToast(`Added ${newItems.length} RAW photo${newItems.length > 1 ? 's' : ''}`);

    // Pre-scan metadata
    for (const it of newItems) {
      try {
        const detected = await detectRawMetadata(it.file);
        setItems((prev) =>
          prev.map((item) =>
            item.id === it.id ? { ...item, detected, status: 'scanned' } : item
          )
        );
      } catch (err) {
        console.warn('Pre-scan error for RAW:', it.name, err);
      }
    }
  };

  const handleCleanAll = async () => {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.status === 'completed') continue;

      setItems((prev) =>
        prev.map((item) => (item.id === it.id ? { ...item, status: 'cleaning' } : item))
      );

      try {
        const result = await cleanRawPhoto(it.file);
        setItems((prev) =>
          prev.map((item) =>
            item.id === it.id
              ? {
                  ...item,
                  status: 'completed',
                  cleanedBlob: result.blob,
                  outputName: result.outputName,
                  outputType: result.outputType,
                  cleanedSize: result.cleanedSize,
                  verification: result.verification
                }
              : item
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === it.id ? { ...item, status: 'error', error: err?.message || 'Clean failed' } : item
          )
        );
      }
    }

    setIsProcessing(false);
    showToast('All RAW photos sanitized and verified clean!');
  };

  const handleDownloadSingle = (item: RawItem) => {
    if (!item.cleanedBlob) return;
    const url = URL.createObjectURL(item.cleanedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.outputName || `${item.name}_cleaned.dng`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    const completed = items.filter((it) => it.status === 'completed' && it.cleanedBlob);
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach((it) => {
      const name = it.outputName || `${it.name}_cleaned.dng`;
      zip.file(name, it.cleanedBlob!);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_raw_photos_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completedCount = items.filter((it) => it.status === 'completed').length;
  const pendingCount = items.filter((it) => it.status !== 'completed').length;

  return (
    <div className="app-wrapper">
      <Header />
      <FormatNav />

      <main className="main-content">
        {toastMessage && (
          <div className="toast-floating-pill" role="status">
            <CheckCircle2 size={15} color="var(--ok)" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-badge-row">
            <span className="hero-badge highlight">
              <Camera size={12} />
              <span>Camera Hardware &amp; Serial Sanitizer</span>
            </span>
            <span className="hero-badge">
              <ShieldCheck size={12} />
              <span>100% In-Browser Execution</span>
            </span>
            <span className="hero-badge">
              <span>Canon &bull; Nikon &bull; Sony &bull; DNG</span>
            </span>
          </div>

          <h1 className="hero-title">
            Free Camera RAW Photo <em>Metadata Remover</em>
          </h1>

          <p className="hero-subtitle">
            Detect and remove camera serial numbers, owner names, lens profiles, GPS coordinates, and shutter actuation counts from RAW photos — 100% locally on your machine.
          </p>
        </div>

        {/* Dedicated RAW Dropzone */}
        <div
          className="dropzone-container"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload camera RAW files"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".cr2,.cr3,.nef,.arw,.dng,.raf,.rw2,.orf,.pef,.tiff,.tif"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          <div className="dropzone-icon-circle">
            <Camera size={32} color="var(--terracotta)" />
          </div>

          <h2 className="dropzone-title">Drop your Camera RAW photos here</h2>
          <p className="dropzone-subtitle">or click to browse DNG, CR2, CR3, NEF, ARW files</p>

          <div className="dropzone-caps-pills">
            <span className="cap-pill">Canon, Nikon, Sony, DNG</span>
            <span className="cap-pill">Camera Body Serial Removal</span>
            <span className="cap-pill">Lens Profiles &amp; GPS Stripped</span>
            <span className="cap-pill">Zero Server Uploads</span>
          </div>
        </div>

        {/* Batch Action Toolbar */}
        {items.length > 0 && (
          <div className="batch-actions-bar">
            <div className="batch-stats-group">
              <div className="batch-stats-badges">
                <span className="stat-pill total">
                  <strong>{items.length}</strong> Total
                </span>
                <span className="stat-pill cleaned">
                  <strong>{completedCount}</strong> Cleaned
                </span>
                {pendingCount > 0 && (
                  <span className="stat-pill pending">
                    <strong>{pendingCount}</strong> Pending
                  </span>
                )}
              </div>
            </div>

            <div className="batch-buttons">
              {pendingCount > 0 && (
                <button
                  type="button"
                  className="btn-primary btn-pulse-action"
                  onClick={handleCleanAll}
                  disabled={isProcessing}
                >
                  <Play size={14} />
                  <span>{isProcessing ? 'Sanitizing...' : `Clean ${pendingCount} RAW Photo${pendingCount > 1 ? 's' : ''}`}</span>
                </button>
              )}

              {completedCount > 0 && (
                <button
                  type="button"
                  className="btn-secondary btn-zip-export"
                  onClick={handleDownloadZip}
                >
                  <Download size={14} />
                  <span>Download All as ZIP</span>
                </button>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setItems([])}
                disabled={isProcessing}
              >
                <Trash2 size={14} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* RAW Queue List */}
        {items.length > 0 && (
          <div className="results-list" role="feed" aria-label="RAW Photo Queue">
            {items.map((it) => (
              <div key={it.id} className="pdf-item-card">
                <div className="pdf-card-main">
                  <div className="pdf-icon-frame">
                    <FileImage size={24} color="var(--terracotta)" />
                  </div>

                  <div className="pdf-card-info">
                    <div className="pdf-card-title-row">
                      <span className="pdf-name">{it.name}</span>
                      <span className="pdf-size">{(it.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>

                    {/* Pre-scan Tags */}
                    {it.detected && (
                      <div className="pdf-tags-row">
                        {it.detected.cameraSerialNumber && (
                          <span className="pdf-tag alert">
                            <Hash size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                            Serial: <strong>{it.detected.cameraSerialNumber}</strong>
                          </span>
                        )}
                        {it.detected.cameraMake && (
                          <span className="pdf-tag">
                            <Camera size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                            {it.detected.cameraMake} {it.detected.cameraModel || ''}
                          </span>
                        )}
                        {it.detected.lensModel && (
                          <span className="pdf-tag">
                            Lens: {it.detected.lensModel}
                          </span>
                        )}
                        {it.detected.ownerName && (
                          <span className="pdf-tag alert">
                            <User size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                            Owner: <strong>{it.detected.ownerName}</strong>
                          </span>
                        )}
                        {it.detected.gpsCoordinates && (
                          <span className="pdf-tag alert">
                            <MapPin size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                            GPS: {it.detected.gpsCoordinates}
                          </span>
                        )}
                        {it.detected.shutterCount && (
                          <span className="pdf-tag">
                            Shutter: {it.detected.shutterCount.toLocaleString()} actuations
                          </span>
                        )}
                        {it.detected.hasC2pa && (
                          <span className="pdf-tag c2pa">C2PA Manifest Detected</span>
                        )}
                      </div>
                    )}

                    {/* Status Message */}
                    {it.status === 'completed' && (
                      <div className="pdf-status-clean">
                        <CheckCircle2 size={14} color="var(--ok)" />
                        <span>Sanitized &bull; Camera serials, owner info &amp; GPS tags stripped ({it.outputType?.toUpperCase()})</span>
                      </div>
                    )}
                    {it.status === 'error' && (
                      <div className="pdf-status-error">
                        <AlertCircle size={14} color="var(--danger)" />
                        <span>{it.error}</span>
                      </div>
                    )}
                  </div>

                  <div className="pdf-card-actions">
                    {it.status === 'completed' ? (
                      <button
                        type="button"
                        className="btn-clean-download"
                        onClick={() => handleDownloadSingle(it)}
                      >
                        <Download size={14} />
                        <span>Download Clean File</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-card-action"
                        onClick={() => handleCleanAll()}
                        disabled={isProcessing}
                      >
                        <Play size={13} />
                        <span>Clean</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-card-remove"
                      onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
                      title="Remove from queue"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Why Photographers Need RAW Sanitization */}
        <section className="content-section">
          <div className="section-header">
            <span className="section-label">Equipment &amp; Identity Privacy</span>
            <h2 className="section-title">Why Photographers Sanitize RAW Photos</h2>
            <p className="section-desc">
              Every RAW exposure encodes deep hardware identifiers that can be scraped to link all your work together.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--danger)' }}>
                <Hash size={22} />
              </div>
              <h3 className="feature-title">Camera &amp; Lens Serial Numbers</h3>
              <p className="feature-desc">
                Public scrapers (like StolenCameraFinder) index serial numbers from MakerNotes. Stripping them prevents tracing equipment back to your identity.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--ok)' }}>
                <User size={22} />
              </div>
              <h3 className="feature-title">Owner &amp; Copyright Fields</h3>
              <p className="feature-desc">
                Eradicates camera owner names and copyright tags before submitting photos to anonymous competitions or blind portfolio reviews.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--terracotta)' }}>
                <MapPin size={22} />
              </div>
              <h3 className="feature-title">Precise GPS Geotags</h3>
              <p className="feature-desc">
                Safeguards sensitive shooting locations, private client properties, and wildlife nesting sites from being exposed through GPS IFDs.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: '#7c3aed' }}>
                <Sliders size={22} />
              </div>
              <h3 className="feature-title">Lightroom &amp; XMP History</h3>
              <p className="feature-desc">
                Cleans embedded XMP packets that record your raw adjustments, preset names, and editing revisions before delivery.
              </p>
            </div>
          </div>
        </section>

        {/* Supported Cameras Banner */}
        <div className="editorial-callout-card">
          <div className="callout-badge-row">
            <Camera size={16} color="var(--terracotta)" />
            <span className="callout-badge">Universal Compatibility</span>
          </div>
          <h3 className="callout-title">Supported Camera Brands &amp; Formats</h3>
          <p className="callout-text">
            Our engine handles RAW photos from all major photographic systems: <strong>Adobe DNG</strong> (.dng), <strong>Canon</strong> (.CR2, .CR3), <strong>Nikon</strong> (.NEF), <strong>Sony</strong> (.ARW), <strong>Fujifilm</strong> (.RAF), <strong>Panasonic Lumix</strong> (.RW2), and <strong>Olympus</strong> (.ORF). Processing runs 100% in local memory.
          </p>
        </div>

        {/* RAW FAQs */}
        <section className="content-section">
          <div className="section-header">
            <span className="section-label">Camera RAW Questions</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-accordion-list">
            {RAW_FAQS.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-question-text">{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className="faq-chevron"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div className="faq-answer-wrapper">
                      <p className="faq-answer-text">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
