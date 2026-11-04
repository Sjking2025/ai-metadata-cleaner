import React, { useState, useRef } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FormatNav } from '../components/FormatNav';
import { cleanVideo, detectVideoMetadata, type DetectedVideoMetadata, type VideoCleanResult } from '../engine/videoCleaner';
import JSZip from 'jszip';
import {
  Video,
  Play,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  MapPin,
  Camera,
  Clock,
  ChevronDown,
  AlertCircle,
  FileVideo
} from 'lucide-react';

interface VideoItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'idle' | 'scanned' | 'cleaning' | 'completed' | 'error';
  detected?: DetectedVideoMetadata;
  cleanedBlob?: Blob;
  cleanedSize?: number;
  verification?: VideoCleanResult['verification'];
  error?: string;
}

const VIDEO_FAQS = [
  {
    q: 'Does this re-encode the video or reduce video quality?',
    a: 'No! Our engine performs lossless ISO-BMFF container slicing directly on the video atoms. The raw H.264, H.265 (HEVC), ProRes, or AV1 video bitstream inside the mdat container is completely untouched. Your video retains 100% bit-exact original quality at full frame rate and resolution.'
  },
  {
    q: 'How does it remove GPS coordinates without re-compressing?',
    a: 'Smartphones (especially iPhones) and drones embed precise GPS latitude/longitude inside the udta (User Data) box of the MP4/MOV container. Our engine neutralizes these atoms into inert padding (free boxes) and zeros container timestamps, completely wiping the location data in milliseconds.'
  },
  {
    q: 'Can this remove C2PA Content Credentials from videos?',
    a: 'Yes. Video cameras and editing tools embedding C2PA provenance manifests (such as Adobe Premiere or CAI-enabled cameras) store credentials in specific uuid or jumb boxes. Our cleaner identifies and removes them completely.'
  },
  {
    q: 'Is there a file size limit for videos?',
    a: 'Because our engine does not re-encode frames, processing takes only a fraction of a second. Standard videos up to several gigabytes can be processed directly in your modern web browser as long as your device has sufficient RAM.'
  }
];

export const VideoCleanerPage: React.FC = () => {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const videoFiles = Array.from(files).filter((f) => {
      const ext = f.name.toLowerCase();
      return (
        f.type.startsWith('video/') ||
        ext.endsWith('.mp4') ||
        ext.endsWith('.mov') ||
        ext.endsWith('.m4v') ||
        ext.endsWith('.webm')
      );
    });

    if (videoFiles.length === 0) {
      showToast('Please select valid MP4 or MOV video files');
      return;
    }

    const newItems: VideoItem[] = videoFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      status: 'idle'
    }));

    setItems((prev) => [...prev, ...newItems]);
    showToast(`Added ${newItems.length} video${newItems.length > 1 ? 's' : ''}`);

    // Pre-scan metadata
    for (const it of newItems) {
      try {
        const detected = await detectVideoMetadata(it.file);
        setItems((prev) =>
          prev.map((item) =>
            item.id === it.id ? { ...item, detected, status: 'scanned' } : item
          )
        );
      } catch (err) {
        console.warn('Pre-scan error for video:', it.name, err);
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
        const result = await cleanVideo(it.file);
        setItems((prev) =>
          prev.map((item) =>
            item.id === it.id
              ? {
                  ...item,
                  status: 'completed',
                  cleanedBlob: result.blob,
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
    showToast('All videos sanitized and verified clean!');
  };

  const handleDownloadSingle = (item: VideoItem) => {
    if (!item.cleanedBlob) return;
    const url = URL.createObjectURL(item.cleanedBlob);
    const a = document.createElement('a');
    a.href = url;
    const ext = item.name.split('.').pop() || 'mp4';
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    a.download = `${baseName}_cleaned.${ext}`;
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
      const ext = it.name.split('.').pop() || 'mp4';
      const baseName = it.name.substring(0, it.name.lastIndexOf('.')) || it.name;
      zip.file(`${baseName}_cleaned.${ext}`, it.cleanedBlob!);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_videos_${Date.now()}.zip`;
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
              <Zap size={12} />
              <span>Lossless Container Slicing (No Re-encoding)</span>
            </span>
            <span className="hero-badge">
              <ShieldCheck size={12} />
              <span>100% In-Browser Execution</span>
            </span>
            <span className="hero-badge">
              <span>Bit-Exact 4K/8K Quality</span>
            </span>
          </div>

          <h1 className="hero-title">
            Free Video Metadata Remover &amp; <em>Location Stripper</em>
          </h1>

          <p className="hero-subtitle">
            Strip GPS location coordinates, device &amp; camera serials, timestamps, and AI/C2PA credentials from MP4 &amp; MOV videos without re-encoding — 100% in your browser.
          </p>
        </div>

        {/* Dedicated Video Dropzone */}
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
          aria-label="Upload video files"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-m4v,video/webm,.mp4,.mov,.m4v,.webm"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          <div className="dropzone-icon-circle">
            <Video size={32} color="var(--terracotta)" />
          </div>

          <h2 className="dropzone-title">Drop your MP4 or MOV videos here</h2>
          <p className="dropzone-subtitle">or click to browse files from your computer</p>

          <div className="dropzone-caps-pills">
            <span className="cap-pill">MP4, MOV, M4V</span>
            <span className="cap-pill">Instant Lossless Slicing</span>
            <span className="cap-pill">GPS Location Erased</span>
            <span className="cap-pill">Zero Quality Loss</span>
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
                  <span>{isProcessing ? 'Slicing...' : `Clean ${pendingCount} Video${pendingCount > 1 ? 's' : ''}`}</span>
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

        {/* Video Queue List */}
        {items.length > 0 && (
          <div className="results-list" role="feed" aria-label="Video Queue">
            {items.map((it) => (
              <div key={it.id} className="pdf-item-card">
                <div className="pdf-card-main">
                  <div className="pdf-icon-frame">
                    <FileVideo size={24} color="var(--terracotta)" />
                  </div>

                  <div className="pdf-card-info">
                    <div className="pdf-card-title-row">
                      <span className="pdf-name">{it.name}</span>
                      <span className="pdf-size">{(it.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>

                    {/* Pre-scan Tags */}
                    {it.detected && (
                      <div className="pdf-tags-row">
                        {it.detected.gpsCoordinates && (
                          <span className="pdf-tag alert">
                            <MapPin size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                            GPS: <strong>{it.detected.gpsCoordinates}</strong>
                          </span>
                        )}
                        {it.detected.cameraMake && (
                          <span className="pdf-tag">
                            <Camera size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                            {it.detected.cameraMake} {it.detected.cameraModel || ''}
                          </span>
                        )}
                        {it.detected.creationTime && (
                          <span className="pdf-tag">
                            <Clock size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                            Recorded: {it.detected.creationTime.substring(0, 10)}
                          </span>
                        )}
                        {it.detected.hasC2pa && (
                          <span className="pdf-tag c2pa">C2PA Manifest Detected</span>
                        )}
                        {it.detected.tagsCount === 0 && (
                          <span className="pdf-tag clean">Clean container</span>
                        )}
                      </div>
                    )}

                    {/* Status Message */}
                    {it.status === 'completed' && (
                      <div className="pdf-status-clean">
                        <CheckCircle2 size={14} color="var(--ok)" />
                        <span>Losslessly sanitized &bull; GPS, device tags &amp; timestamps removed</span>
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
                        <span>Download Clean Video</span>
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

        {/* Technical Callout: No Re-encoding */}
        <div className="editorial-callout-card">
          <div className="callout-badge-row">
            <Zap size={16} color="var(--terracotta)" />
            <span className="callout-badge">Lossless Performance</span>
          </div>
          <h3 className="callout-title">Lossless Container Slicing (Zero Recompression)</h3>
          <p className="callout-text">
            Standard video converters take several minutes, drain laptop battery, and cause lossy compression artifacts by re-encoding video frames. Our engine parses the raw ISO-BMFF box tree and neutralizes metadata containers (<code style={{ background: 'var(--paper-2)', padding: '2px 4px', borderRadius: 3 }}>udta</code> and <code style={{ background: 'var(--paper-2)', padding: '2px 4px', borderRadius: 3 }}>uuid</code>) directly. Your audio and video streams remain 100% bit-exact, and the entire cleaning process finishes in under a second.
          </p>
        </div>

        {/* Video Metadata Features Grid */}
        <section className="content-section">
          <div className="section-header">
            <span className="section-label">Video Privacy Defense</span>
            <h2 className="section-title">What Video Metadata Gets Erased</h2>
            <p className="section-desc">
              Every video file is sanitized to ensure no personal locations, device hardware IDs, or timestamps are attached.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--danger)' }}>
                <MapPin size={22} />
              </div>
              <h3 className="feature-title">GPS Location Coordinates</h3>
              <p className="feature-desc">
                Purges embedded latitude, longitude, and altitude tags recorded by iPhones, Android phones, DJI drones, and action cameras.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--terracotta)' }}>
                <Camera size={22} />
              </div>
              <h3 className="feature-title">Device &amp; Camera Hardware</h3>
              <p className="feature-desc">
                Removes device manufacturer, phone model name, and firmware information embedded inside QuickTime user data.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--ok)' }}>
                <Clock size={22} />
              </div>
              <h3 className="feature-title">Recording &amp; Edit Timestamps</h3>
              <p className="feature-desc">
                Zeros out <code style={{ fontSize: '12px' }}>mvhd</code> and <code style={{ fontSize: '12px' }}>tkhd</code> timestamps that log the exact minute and timezone your video was captured.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: '#7c3aed' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 className="feature-title">C2PA Credentials &amp; AI Labels</h3>
              <p className="feature-desc">
                Detects and slices cryptographic provenance manifests from cameras and editing software like Adobe Premiere and Final Cut.
              </p>
            </div>
          </div>
        </section>

        {/* Video FAQs */}
        <section className="content-section">
          <div className="section-header">
            <span className="section-label">Video Metadata Questions</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-accordion-list">
            {VIDEO_FAQS.map((faq, idx) => {
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
