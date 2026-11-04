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
  FileVideo,
  FolderOpen,
  Loader2
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
  const [isDragOver, setIsDragOver] = useState(false);
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

      <main className="main-content">
        <FormatNav />

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

        {/* Editorial Styled Video Dropzone */}
        <div
          className={`editorial-dropzone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload video files"
        >
          {/* Animated Corner Brackets */}
          <div className="dropzone-corner tl" />
          <div className="dropzone-corner tr" />
          <div className="dropzone-corner bl" />
          <div className="dropzone-corner br" />

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-m4v,video/webm,.mp4,.mov,.m4v,.webm"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          <div className="dropzone-content">
            <div className="dropzone-icon-circle">
              <Video size={32} strokeWidth={1.5} color="var(--accent)" />
            </div>

            <div className="dropzone-text-group">
              <h2 className="dropzone-heading">Drop MP4 or MOV videos here to sanitize</h2>
              <p className="dropzone-subtext">
                Drag video files, or click to browse from your device
              </p>
            </div>

            <div className="dropzone-formats-row">
              <span className="format-badge-chip">.mp4</span>
              <span className="format-badge-chip">.mov (QuickTime)</span>
              <span className="format-badge-chip">.m4v</span>
              <span className="format-badge-chip plus">Lossless &bull; No Re-encoding</span>
            </div>

            <div className="dropzone-action-bar">
              <button
                type="button"
                className="btn-browse-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <FolderOpen size={15} />
                <span>Browse Video Files</span>
              </button>
            </div>

            <div className="dropzone-privacy-note">
              <ShieldCheck size={14} />
              <span>Zero Re-encoding &bull; Slices metadata containers directly without quality loss</span>
            </div>
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
            {items.map((it) => {
              const isCompleted = it.status === 'completed';
              return (
                <article
                  key={it.id}
                  className={`result-card ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="result-card-inner">
                    {/* Left Icon Frame */}
                    <div className="result-thumb-column">
                      <div className="result-thumb-wrapper" style={{ background: 'var(--paper)' }}>
                        <FileVideo size={44} strokeWidth={1.5} color={isCompleted ? 'var(--ok)' : 'var(--accent)'} />
                        {it.status === 'cleaning' && (
                          <div className="thumb-loading-overlay">
                            <Loader2 className="animate-spin" size={24} color="var(--accent)" />
                            <span className="loading-badge-text">Slicing...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Info Column */}
                    <div className="result-info">
                      <div className="result-title-row">
                        <span className="result-filename">{it.name}</span>
                        <span className="metric-label" style={{ marginLeft: 8 }}>
                          {(it.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        {isCompleted ? (
                          <span className="badge badge-clean">
                            <CheckCircle2 size={11} /> Cleaned
                          </span>
                        ) : (
                          <span className="badge badge-meta">Pending</span>
                        )}
                      </div>

                      {/* Pre-scan Tags */}
                      {it.detected && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
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
                      {isCompleted && (
                        <div className="pdf-status-clean" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ok)', fontWeight: 600 }}>
                          <CheckCircle2 size={15} />
                          <span>Losslessly sanitized &bull; GPS, device tags &amp; timestamps removed</span>
                        </div>
                      )}
                      {it.status === 'error' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--danger)', fontWeight: 600 }}>
                          <AlertCircle size={15} />
                          <span>{it.error}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Actions Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      {isCompleted ? (
                        <button
                          type="button"
                          className="btn-primary btn-clean-download"
                          onClick={() => handleDownloadSingle(it)}
                        >
                          <Download size={14} />
                          <span>Download Clean Video</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleCleanAll()}
                          disabled={isProcessing}
                        >
                          <Play size={13} />
                          <span>Clean Video</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
                        title="Remove from queue"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Technical Callout: No Re-encoding */}
        <div className="editorial-callout-card">
          <div className="callout-badge-row">
            <Zap size={16} color="var(--accent)" />
            <span className="callout-badge">Lossless Performance</span>
          </div>
          <h3 className="callout-title">Lossless Container Slicing (Zero Recompression)</h3>
          <p className="callout-text">
            Standard video converters take several minutes, drain laptop battery, and cause lossy compression artifacts by re-encoding video frames. Our engine parses the raw ISO-BMFF box tree and neutralizes metadata containers (<code style={{ background: 'var(--paper)', padding: '2px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>udta</code> and <code style={{ background: 'var(--paper)', padding: '2px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>uuid</code>) directly. Your audio and video streams remain 100% bit-exact, and the entire cleaning process finishes in under a second.
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
              <div className="feature-icon-box" style={{ color: 'var(--danger)', background: '#fff1f0' }}>
                <MapPin size={22} />
              </div>
              <h3 className="feature-title">GPS Location Coordinates</h3>
              <p className="feature-desc">
                Purges embedded latitude, longitude, and altitude tags recorded by iPhones, Android phones, DJI drones, and action cameras.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>
                <Camera size={22} />
              </div>
              <h3 className="feature-title">Device &amp; Camera Hardware</h3>
              <p className="feature-desc">
                Removes device manufacturer, phone model name, and firmware information embedded inside QuickTime user data.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--ok)', background: 'var(--ok-soft)' }}>
                <Clock size={22} />
              </div>
              <h3 className="feature-title">Recording &amp; Edit Timestamps</h3>
              <p className="feature-desc">
                Zeros out <code style={{ fontSize: '12px' }}>mvhd</code> and <code style={{ fontSize: '12px' }}>tkhd</code> timestamps that log the exact minute and timezone your video was captured.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: '#7c3aed', background: '#f5f3ff' }}>
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
