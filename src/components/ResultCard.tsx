import React from 'react';
import {
  CheckCircle,
  Download,
  Info,
  Trash2,
  ShieldCheck,
  Sparkles,
  ShieldAlert,
  Loader2
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
  const isCompleted = item.status === 'completed';
  const isCleaning = item.status === 'cleaning' || item.status === 'scanning';

  return (
    <div className={`result-card ${isCompleted ? 'completed' : ''}`}>
      <div className="result-card-inner">
        {/* Thumbnail Preview */}
        <div className="result-thumb-wrapper">
          <img src={item.previewUrl} alt={item.name} className="result-thumb" />
          {isCleaning && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Loader2 className="animate-spin" size={24} color="var(--accent)" />
            </div>
          )}
        </div>

        {/* Information & Metrics */}
        <div className="result-info">
          <div className="result-title-row">
            <span className="result-filename">{item.name}</span>

            {isCompleted && item.verification?.clean && (
              <span className="badge badge-clean">
                <CheckCircle size={12} />
                <span>Verified Clean</span>
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

          {/* Metrics */}
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
                    <span style={{ fontSize: '10px', marginLeft: 4, fontWeight: 400 }}>
                      ({item.verification.sizeReductionPercent > 0 ? '-' : '+'}
                      {Math.abs(item.verification.sizeReductionPercent)}%)
                    </span>
                  )}
                </span>
              </div>

              <div className="metric-item">
                <span className="metric-label">Original SHA-256</span>
                <span className="metric-value" title={item.verification.originalHash}>
                  {item.verification.originalHash.substring(0, 12)}...
                </span>
              </div>

              <div className="metric-item">
                <span className="metric-label">Cleaned SHA-256</span>
                <span className="metric-value highlight-ok" title={item.verification.cleanedHash}>
                  {item.verification.cleanedHash.substring(0, 12)}...
                </span>
              </div>
            </div>
          )}

          {/* Cleaning Report */}
          {isCompleted && (
            <div className="cleaning-report-box">
              <div className="cleaning-report-title">
                <ShieldCheck size={13} color="var(--ok)" />
                <span>Stripped Metadata &amp; Signatures</span>
              </div>

              <div className="cleaning-tags-grid">
                {item.detected?.c2pa && (
                  <span className="tag-stripped">
                    &bull; C2PA Manifest ({item.detected.c2paIssuer || 'Provenance'})
                  </span>
                )}
                {item.detected?.exif && (
                  <span className="tag-stripped">&bull; EXIF &amp; Camera Hardware Data</span>
                )}
                {item.detected?.gps && (
                  <span className="tag-stripped">&bull; GPS Geotag &amp; Location Coordinates</span>
                )}
                {item.detected?.xmp && <span className="tag-stripped">&bull; XMP Creator History</span>}
                {item.detected?.iptc && (
                  <span className="tag-stripped">&bull; IPTC Digital Source Type</span>
                )}
                {item.detected?.pngTextChunks && (
                  <span className="tag-stripped">&bull; Stable Diffusion / AI Prompts</span>
                )}
                {item.verification?.pHashDefenseApplied && (
                  <span className="tag-stripped">&bull; Perceptual Hash Tracking Fingerprint</span>
                )}
                {!item.detected?.hasAny && (
                  <span style={{ fontSize: '12px', color: 'var(--ok)' }}>
                    File had no embedded metadata. Verification confirmed 100% clean.
                  </span>
                )}
              </div>
            </div>
          )}

          {item.error && (
            <div style={{ color: 'var(--accent)', fontSize: '13px' }}>
              Error: {item.error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          {isCompleted && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => downloadSingleImage(item)}
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
            >
              <Info size={14} />
              <span>Inspect Tags</span>
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => onRemove(item.id)}
            style={{ color: 'var(--ink-3)' }}
            title="Remove from queue"
          >
            <Trash2 size={14} />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
};
