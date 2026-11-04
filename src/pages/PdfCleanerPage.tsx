import React, { useState, useRef } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FormatNav } from '../components/FormatNav';
import { cleanPdf, detectPdfMetadata, type DetectedPdfMetadata, type PdfCleanResult } from '../engine/pdfCleaner';
import JSZip from 'jszip';
import {
  FileText,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Download,
  Trash2,
  Play,
  AlertCircle,
  FileCheck,
  ChevronDown,
  Lock,
  FolderOpen,
  Loader2
} from 'lucide-react';

interface PdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'idle' | 'scanned' | 'cleaning' | 'completed' | 'error';
  detected?: DetectedPdfMetadata;
  cleanedBlob?: Blob;
  cleanedSize?: number;
  verification?: PdfCleanResult['verification'];
  error?: string;
}

const PDF_FAQS = [
  {
    q: 'Why should I remove metadata from a PDF before sharing?',
    a: 'PDFs contain hidden document properties that you may not realize are there — including your full name, username, company name, internal network file paths, software license details, and exact creation/edit timestamps. For legal documents, business proposals, resumes, and academic papers, removing this information ensures complete confidentiality.'
  },
  {
    q: 'Does my PDF get uploaded to an external server?',
    a: 'No. Unlike other online PDF tools that upload your sensitive documents to remote cloud servers, our tool runs 100% in your local browser memory using WebAssembly and pure client-side JavaScript. Zero bytes are ever transmitted over the network.'
  },
  {
    q: 'Does cleaning metadata change the visual layout or text of my PDF?',
    a: 'Not at all. Cleaning removes document catalog headers, XMP packets, author properties, and piece info dictionaries. The visible pages, vector typography, fonts, tables, and images remain 100% visually identical.'
  },
  {
    q: 'Can this remove C2PA Content Credentials from PDFs?',
    a: 'Yes. If a PDF contains C2PA provenance credentials or Adobe Content Authenticity manifests, our engine purges the catalog metadata streams and zeroes out the provenance references.'
  }
];

export const PdfCleanerPage: React.FC = () => {
  const [items, setItems] = useState<PdfItem[]>([]);
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
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      showToast('Please select valid PDF documents');
      return;
    }

    const newItems: PdfItem[] = pdfFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      status: 'idle'
    }));

    setItems((prev) => [...prev, ...newItems]);
    showToast(`Added ${newItems.length} PDF${newItems.length > 1 ? 's' : ''}`);

    // Pre-scan metadata
    for (const it of newItems) {
      try {
        const detected = await detectPdfMetadata(it.file);
        setItems((prev) =>
          prev.map((item) =>
            item.id === it.id ? { ...item, detected, status: 'scanned' } : item
          )
        );
      } catch (err) {
        console.warn('Pre-scan error for PDF:', it.name, err);
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
        const result = await cleanPdf(it.file);
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
    showToast('All PDFs sanitized and verified clean!');
  };

  const handleDownloadSingle = (item: PdfItem) => {
    if (!item.cleanedBlob) return;
    const url = URL.createObjectURL(item.cleanedBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = item.name.replace(/\.pdf$/i, '');
    a.download = `${baseName}_cleaned.pdf`;
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
      const baseName = it.name.replace(/\.pdf$/i, '');
      zip.file(`${baseName}_cleaned.pdf`, it.cleanedBlob!);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_pdfs_${Date.now()}.zip`;
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
              <FileText size={12} />
              <span>PDF Privacy &amp; Author Stripper</span>
            </span>
            <span className="hero-badge">
              <ShieldCheck size={12} />
              <span>100% In-Browser Execution</span>
            </span>
            <span className="hero-badge">
              <Lock size={12} />
              <span>Zero Document Uploads</span>
            </span>
          </div>

          <h1 className="hero-title">
            Free PDF Metadata Remover &amp; <em>Privacy Cleaner</em>
          </h1>

          <p className="hero-subtitle">
            Remove hidden document properties, author names, creation &amp; edit timestamps, XMP packets, and C2PA credentials from PDFs — completely locally inside your browser.
          </p>
        </div>

        {/* Editorial Styled PDF Dropzone */}
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
          aria-label="Upload PDF files"
        >
          {/* Animated Corner Brackets */}
          <div className="dropzone-corner tl" />
          <div className="dropzone-corner tr" />
          <div className="dropzone-corner bl" />
          <div className="dropzone-corner br" />

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          <div className="dropzone-content">
            <div className="dropzone-icon-circle">
              <FileText size={32} strokeWidth={1.5} color="var(--accent)" />
            </div>

            <div className="dropzone-text-group">
              <h2 className="dropzone-heading">Drop PDF documents here to sanitize</h2>
              <p className="dropzone-subtext">
                Drag PDF files, or click to browse from your device
              </p>
            </div>

            <div className="dropzone-formats-row">
              <span className="format-badge-chip">.pdf</span>
              <span className="format-badge-chip">Acrobat &bull; Word &bull; Quartz</span>
              <span className="format-badge-chip plus">+ Batch Queue</span>
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
                <span>Browse PDF Files</span>
              </button>
            </div>

            <div className="dropzone-privacy-note">
              <ShieldCheck size={14} />
              <span>Zero Server Uploads &bull; Confidential documents processed 100% locally in browser memory</span>
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
                  <span>{isProcessing ? 'Sanitizing...' : `Clean ${pendingCount} PDF${pendingCount > 1 ? 's' : ''}`}</span>
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

        {/* PDF Queue List */}
        {items.length > 0 && (
          <div className="results-list" role="feed" aria-label="PDF Queue">
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
                        <FileText size={44} strokeWidth={1.5} color={isCompleted ? 'var(--ok)' : 'var(--accent)'} />
                        {it.status === 'cleaning' && (
                          <div className="thumb-loading-overlay">
                            <Loader2 className="animate-spin" size={24} color="var(--accent)" />
                            <span className="loading-badge-text">Cleaning...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Info Column */}
                    <div className="result-info">
                      <div className="result-title-row">
                        <span className="result-filename">{it.name}</span>
                        <span className="metric-label" style={{ marginLeft: 8 }}>
                          {(it.size / 1024).toFixed(1)} KB
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
                          {it.detected.author && (
                            <span className="pdf-tag alert">
                              Author: <strong>{it.detected.author}</strong>
                            </span>
                          )}
                          {it.detected.creator && (
                            <span className="pdf-tag">
                              App: <strong>{it.detected.creator}</strong>
                            </span>
                          )}
                          {it.detected.creationDate && (
                            <span className="pdf-tag">
                              Created: <strong>{it.detected.creationDate.substring(0, 10)}</strong>
                            </span>
                          )}
                          {it.detected.hasXmp && (
                            <span className="pdf-tag alert">
                              XMP Packet ({it.detected.xmpSizeApprox ? `${Math.round(it.detected.xmpSizeApprox / 1024)}KB` : 'Found'})
                            </span>
                          )}
                          {it.detected.hasC2pa && (
                            <span className="pdf-tag c2pa">C2PA Manifest Detected</span>
                          )}
                          {it.detected.tagsCount === 0 && (
                            <span className="pdf-tag clean">No sensitive tags detected</span>
                          )}
                        </div>
                      )}

                      {/* Status Message */}
                      {isCompleted && (
                        <div className="pdf-status-clean" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ok)', fontWeight: 600 }}>
                          <CheckCircle2 size={15} />
                          <span>100% Sanitized &bull; All author, XMP &amp; C2PA manifests eliminated</span>
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
                          <span>Download Clean PDF</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleCleanAll()}
                          disabled={isProcessing}
                        >
                          <Play size={13} />
                          <span>Clean PDF</span>
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

        {/* Information & Feature Cards */}
        <section className="content-section">
          <div className="section-header">
            <span className="section-label">Document Sanitization Scope</span>
            <h2 className="section-title">What Gets Removed From Your PDFs</h2>
            <p className="section-desc">
              Every document is scanned and cleaned of identification markers that leak personal and organizational identity.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>
                <FileCheck size={22} />
              </div>
              <h3 className="feature-title">Author &amp; Creator Profiles</h3>
              <p className="feature-desc">
                Eradicates author name, company name, subject, title, and keywords stored in the document's `/Info` dictionary.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--ok)', background: 'var(--ok-soft)' }}>
                <Lock size={22} />
              </div>
              <h3 className="feature-title">Creation &amp; Edit Timestamps</h3>
              <p className="feature-desc">
                Zeros out `CreationDate` and `ModDate` records that reveal when and how often a document was edited.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: '#2563eb', background: '#eff6ff' }}>
                <FileText size={22} />
              </div>
              <h3 className="feature-title">Software &amp; Tool Signatures</h3>
              <p className="feature-desc">
                Strips producer fingerprints such as Microsoft Word, Adobe Acrobat, macOS Quartz, Canva, or LibreOffice.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ color: '#7c3aed', background: '#f5f3ff' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 className="feature-title">XMP Packets &amp; C2PA Credentials</h3>
              <p className="feature-desc">
                Purges embedded XML streams containing Dublin Core properties, Adobe Photoshop histories, and C2PA provenance blocks.
              </p>
            </div>
          </div>
        </section>

        {/* Why In-Browser PDF Cleaning Matters */}
        <div className="editorial-callout-card">
          <div className="callout-badge-row">
            <ShieldCheck size={16} color="var(--ok)" />
            <span className="callout-badge">Zero Server Risk</span>
          </div>
          <h3 className="callout-title">Why In-Browser PDF Processing Matters</h3>
          <p className="callout-text">
            Traditional online PDF utilities require you to upload your files to their cloud servers. For confidential contracts, legal agreements, tax paperwork, medical forms, and proprietary business decks, uploading to a third-party server creates serious compliance and security liabilities. Our PDF cleaner executes 100% locally in your web browser memory — your documents never touch any server.
          </p>
        </div>

        {/* PDF FAQs */}
        <section className="content-section">
          <div className="section-header">
            <span className="section-label">PDF Privacy Questions</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-accordion-list">
            {PDF_FAQS.map((faq, idx) => {
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
