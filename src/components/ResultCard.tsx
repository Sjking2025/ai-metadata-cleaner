import React, { useState } from 'react';
import {
  CheckCircle,
  Download,
  Info,
  Trash2,
  ShieldCheck,
  Sparkles,
  ShieldAlert,
  Loader2,
  Copy,
  Check,
  Eye,
  Camera,
  MapPin,
  FileCode,
  Fingerprint
} from 'lucide-react';
import { downloadSingleImage } from '../engine/zip';
import type { ImageItem } from '../types';

interface ResultCardProps {
  item: ImageItem;
  onRemove: (id: string) => void;
  onInspect: (item: ImageItem) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const ResultCard: React.FC<ResultCardProps> = ({
  item,
  onRemove,
  onInspect
}) => {
  const [showCleanedThumb, setShowCleanedThumb] = useState(true);
  const [copiedHash, setCopiedHash] = useState<'orig' | 'clean' | null>(null);

  const isCompleted = item.status === 'completed';
  const isCleaning = item.status === 'cleaning' || item.status === 'scanning';

  const handleCopyHash = (hash: string, type: 'orig' | 'clean') => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  const currentDisplayUrl =
    isCompleted && showCleanedThumb && item.cleanedUrl
      ? item.cleanedUrl
      : item.previewUrl;

  return (
    <article
      className={`result-card ${isCompleted ? 'completed' : ''}`}
      aria-label={`Image processing result for ${item.name}`}
    >
      <div className="result-card-inner">
        {/* Interactive Thumbnail Preview */}
        <div className="result-thumb-column">
          <div className="result-thumb-wrapper">
            <img
              src={currentDisplayUrl}
              alt={item.name}
              className="result-thumb"
              loading="lazy"
            />

            {/* In-flight loading spinner */}
            {isCleaning && (
              <div className="thumb-loading-overlay">
                <Loader2 className="animate-spin" size={26} color="var(--accent)" />
                <span className="loading-badge-text">Processing...</span>
              </div>
            )}

            {/* Before / After toggle button */}
            {isCompleted && item.cleanedUrl && (
              <button
                type="button"
                className="thumb-toggle-pill"
                onClick={() => setShowCleanedThumb(!showCleanedThumb)}
                title="Click to toggle between Cleaned and Original visual view"
                aria-label="Toggle preview comparison"
              >
                <Eye size={11} />
                <span>{showCleanedThumb ? 'Cleaned View' : 'Original View'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Information & Metrics */}
        <div className="result-info">
          <div className="result-title-row">
            <h3 className="result-filename">{item.name}</h3>

            {isCompleted && item.verification?.clean && (
              <span className="badge badge-clean">
                <CheckCircle size={12} />
                <span>Verified 100% Clean</span>
              </span>
            )}

            {item.detected?.c2pa && (
              <span className="badge badge-c2pa">
                <ShieldAlert size={12} />
                <span>C2PA / {item.detected.c2paIssuer || 'Credentials'}</span>
              </span>
            )}

            {isCompleted && item.verification?.pHashDefenseApplied && (
              <span className="badge badge-meta">
                <Sparkles size={12} color="var(--accent)" />
                <span>Fingerprint Altered</span>
              </span>
            )}
          </div>

          {/* Metrics Row */}
          {isCompleted && item.verification && (
            <div className="metrics-row">
              <div className="metric-item">
                <span className="metric-label">Original Size</span>
                <span className="metric-value">{formatBytes(item.verification.originalSize)}</span>
              </div>

              <div className="metric-item">
                <span className="metric-label">Cleaned Size</span>
                <span className="metric-value highlight-ok">
                  {formatBytes(item.verification.cleanedSize)}
                  {item.verification.sizeReductionPercent !== 0 && (
                    <span className="metric-delta-pill">
                      {item.verification.sizeReductionPercent > 0 ? '-' : '+'}
                      {Math.abs(item.verification.sizeReductionPercent)}%
                    </span>
                  )}
                </span>
              </div>

              <div className="metric-item">
                <div className="metric-label-with-copy">
                  <span className="metric-label">Original Hash</span>
                  <button
                    type="button"
                    className="copy-hash-btn"
                    onClick={() => handleCopyHash(item.verification!.originalHash, 'orig')}
                    title="Copy full SHA-256 hash"
                    aria-label="Copy original SHA-256 hash"
                  >
                    {copiedHash === 'orig' ? <Check size={11} color="var(--ok)" /> : <Copy size={11} />}
                  </button>
                </div>
                <span className="metric-value hash-code" title={item.verification.originalHash}>
                  {item.verification.originalHash.substring(0, 10)}...
                </span>
              </div>

              <div className="metric-item">
                <div className="metric-label-with-copy">
                  <span className="metric-label">Cleaned Hash</span>
                  <button
                    type="button"
                    className="copy-hash-btn"
                    onClick={() => handleCopyHash(item.verification!.cleanedHash, 'clean')}
                    title="Copy full SHA-256 hash"
                    aria-label="Copy cleaned SHA-256 hash"
                  >
                    {copiedHash === 'clean' ? <Check size={11} color="var(--ok)" /> : <Copy size={11} />}
                  </button>
                </div>
                <span className="metric-value highlight-ok hash-code" title={item.verification.cleanedHash}>
                  {item.verification.cleanedHash.substring(0, 10)}...
                </span>
              </div>
            </div>
          )}

          {/* Itemized Removal Checklist */}
          {isCompleted && (
            <div className="cleaning-report-box">
              <div className="cleaning-report-title">
                <ShieldCheck size={14} color="var(--ok)" />
                <span>Sanitized Provenance &amp; Metadata Components</span>
              </div>

              <div className="cleaning-tags-grid">
                {item.detected?.c2pa && (
                  <span className="tag-pill tag-c2pa">
                    <ShieldAlert size={12} />
                    <span>C2PA Manifest ({item.detected.c2paIssuer || 'Provenance Signature'})</span>
                  </span>
                )}
                {item.detected?.exif && (
                  <span className="tag-pill tag-exif">
                    <Camera size={12} />
                    <span>EXIF &amp; Camera Hardware Tags</span>
                  </span>
                )}
                {item.detected?.gps && (
                  <span className="tag-pill tag-gps">
                    <MapPin size={12} />
                    <span>GPS Coordinates &amp; Geotag</span>
                  </span>
                )}
                {item.detected?.pngTextChunks && (
                  <span className="tag-pill tag-ai">
                    <Sparkles size={12} />
                    <span>Stable Diffusion / AI Prompts</span>
                  </span>
                )}
                {(item.detected?.xmp || item.detected?.iptc) && (
                  <span className="tag-pill tag-meta">
                    <FileCode size={12} />
                    <span>XMP / IPTC Algorithmic Media Tags</span>
                  </span>
                )}
                {item.verification?.pHashDefenseApplied && (
                  <span className="tag-pill tag-phash">
                    <Fingerprint size={12} />
                    <span>Perceptual Hash Tracking Fingerprint</span>
                  </span>
                )}
                {!item.detected?.hasAny && (
                  <span className="tag-clean-notice">
                    No initial metadata detected. Binary strip confirmed 100% clean.
                  </span>
                )}
              </div>
            </div>
          )}

          {item.error && (
            <div className="error-banner" role="alert">
              <strong>Processing Alert:</strong> {item.error}
            </div>
          )}
        </div>

        {/* Action Buttons Column */}
        <div className="result-actions">
          {isCompleted && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => downloadSingleImage(item)}
              aria-label={`Download cleaned ${item.name}`}
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          )}

          {item.detected && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onInspect(item)}
              title="Inspect detected tags"
              aria-label={`Inspect tags for ${item.name}`}
            >
              <Info size={14} />
              <span>Inspect Tags</span>
            </button>
          )}

          <button
            type="button"
            className="btn-secondary btn-remove"
            onClick={() => onRemove(item.id)}
            title="Remove from queue"
            aria-label={`Remove ${item.name} from queue`}
          >
            <Trash2 size={14} />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </article>
  );
};
