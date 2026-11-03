import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldAlert,
  Camera,
  MapPin,
  Sparkles,
  FileText,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import type { DetectedMetadata } from '../types';

interface MetadataModalProps {
  fileName: string;
  metadata?: DetectedMetadata;
  onClose: () => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  fileName,
  metadata,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!metadata) return null;

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(metadata, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-text">
            <h2 id="modal-title" className="modal-title">Detected Metadata Inspection</h2>
            <p className="modal-subtitle">{fileName}</p>
          </div>

          <div className="modal-header-actions">
            <button
              type="button"
              className="btn-modal-action"
              onClick={handleCopyJson}
              title="Copy detected metadata as JSON"
            >
              {copied ? <Check size={14} color="var(--ok)" /> : <Copy size={14} />}
              <span>{copied ? 'Copied JSON' : 'Export JSON'}</span>
            </button>

            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              aria-label="Close modal dialog"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* C2PA Provenance Section */}
          {metadata.c2pa && (
            <section className="modal-section" aria-label="C2PA Credentials">
              <div className="modal-section-title tag-c2pa-title">
                <ShieldAlert size={15} />
                <span>C2PA Content Credentials &amp; Provenance Manifest</span>
              </div>
              <div className="modal-raw-box c2pa-box">
                <div className="info-row">
                  <span className="info-key">Issuer / Generator:</span>
                  <span className="info-val font-bold">{metadata.c2paIssuer || 'Cryptographic Manifest Detected'}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Manifest Status:</span>
                  <span className="info-val">Active JUMBF Provenance Assertion</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Social Impact:</span>
                  <span className="info-val highlight-warn">
                    Platforms (Instagram, Facebook, Pinterest) detect this signature to label image as AI.
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* AI Prompts & Generation Parameters */}
          {metadata.pngTextChunks && metadata.pngPrompts && (
            <section className="modal-section" aria-label="AI Generation Prompts">
              <div className="modal-section-title tag-ai-title">
                <Sparkles size={15} />
                <span>AI Generation Prompts &amp; Sampler Parameters</span>
              </div>
              <div className="modal-raw-box ai-box">
                {metadata.pngPrompts.prompt && (
                  <div className="prompt-block">
                    <span className="prompt-label">Positive Prompt:</span>
                    <p className="prompt-text">{metadata.pngPrompts.prompt}</p>
                  </div>
                )}
                {metadata.pngPrompts.negativePrompt && (
                  <div className="prompt-block">
                    <span className="prompt-label">Negative Prompt:</span>
                    <p className="prompt-text negative">{metadata.pngPrompts.negativePrompt}</p>
                  </div>
                )}
                {metadata.pngPrompts.parameters && (
                  <div className="prompt-block">
                    <span className="prompt-label">Raw Generation Parameters:</span>
                    <pre className="prompt-pre">{metadata.pngPrompts.parameters}</pre>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* EXIF Data */}
          {metadata.exif && metadata.exifDetails && (
            <section className="modal-section" aria-label="Camera EXIF">
              <div className="modal-section-title tag-exif-title">
                <Camera size={15} />
                <span>Camera Hardware &amp; Shot Settings (EXIF)</span>
              </div>
              <div className="modal-raw-box">
                <div className="exif-grid">
                  {metadata.exifDetails.make && (
                    <div className="exif-cell">
                      <span className="exif-label">Make</span>
                      <span className="exif-val">{metadata.exifDetails.make}</span>
                    </div>
                  )}
                  {metadata.exifDetails.model && (
                    <div className="exif-cell">
                      <span className="exif-label">Model</span>
                      <span className="exif-val">{metadata.exifDetails.model}</span>
                    </div>
                  )}
                  {metadata.exifDetails.lens && (
                    <div className="exif-cell">
                      <span className="exif-label">Lens</span>
                      <span className="exif-val">{metadata.exifDetails.lens}</span>
                    </div>
                  )}
                  {metadata.exifDetails.fNumber && (
                    <div className="exif-cell">
                      <span className="exif-label">Aperture</span>
                      <span className="exif-val">f/{metadata.exifDetails.fNumber}</span>
                    </div>
                  )}
                  {metadata.exifDetails.iso && (
                    <div className="exif-cell">
                      <span className="exif-label">ISO</span>
                      <span className="exif-val">{metadata.exifDetails.iso}</span>
                    </div>
                  )}
                  {metadata.exifDetails.exposureTime && (
                    <div className="exif-cell">
                      <span className="exif-label">Exposure</span>
                      <span className="exif-val">{metadata.exifDetails.exposureTime}s</span>
                    </div>
                  )}
                  {metadata.exifDetails.software && (
                    <div className="exif-cell">
                      <span className="exif-label">Software</span>
                      <span className="exif-val">{metadata.exifDetails.software}</span>
                    </div>
                  )}
                  {metadata.exifDetails.dateTime && (
                    <div className="exif-cell">
                      <span className="exif-label">Date Taken</span>
                      <span className="exif-val">{String(metadata.exifDetails.dateTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* GPS Location Data */}
          {metadata.gps && metadata.gpsDetails && (
            <section className="modal-section" aria-label="GPS Coordinates">
              <div className="modal-section-title tag-gps-title">
                <MapPin size={15} />
                <span>Geotag &amp; Location Coordinates</span>
              </div>
              <div className="modal-raw-box gps-box">
                <div className="info-row">
                  <span className="info-key">Latitude:</span>
                  <span className="info-val font-mono">{metadata.gpsDetails.latitude?.toFixed(6)}&deg;</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Longitude:</span>
                  <span className="info-val font-mono">{metadata.gpsDetails.longitude?.toFixed(6)}&deg;</span>
                </div>
                {metadata.gpsDetails.altitude && (
                  <div className="info-row">
                    <span className="info-key">Altitude:</span>
                    <span className="info-val font-mono">{metadata.gpsDetails.altitude}m</span>
                  </div>
                )}
                {metadata.gpsDetails.latitude && metadata.gpsDetails.longitude && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${metadata.gpsDetails.latitude}&mlon=${metadata.gpsDetails.longitude}#map=16/${metadata.gpsDetails.latitude}/${metadata.gpsDetails.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="osm-link"
                    >
                      <span>Preview location on OpenStreetMap</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* IPTC & XMP */}
          {(metadata.iptc || metadata.xmp) && (
            <section className="modal-section" aria-label="XMP and IPTC Tags">
              <div className="modal-section-title">
                <FileText size={15} />
                <span>XMP &amp; IPTC Provenance Tags</span>
              </div>
              <div className="modal-raw-box">
                {metadata.digitalSourceType && (
                  <div className="info-row">
                    <span className="info-key">Digital Source:</span>
                    <span className="info-val">{metadata.digitalSourceType}</span>
                  </div>
                )}
                {metadata.software && (
                  <div className="info-row">
                    <span className="info-key">Editing Software:</span>
                    <span className="info-val">{metadata.software}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-key">Container:</span>
                  <span className="info-val">Standard XMP Packet &amp; IPTC Envelope Present</span>
                </div>
              </div>
            </section>
          )}

          {!metadata.hasAny && (
            <div className="modal-empty-state">
              <Check size={28} color="var(--ok)" />
              <p>No embedded metadata found in this file. It is already 100% clean!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
