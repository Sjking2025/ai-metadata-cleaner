import React from 'react';
import { X, ShieldAlert, Camera, MapPin, Sparkles, FileText } from 'lucide-react';
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
  if (!metadata) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Detected Metadata: {fileName}</div>
          <button type="button" onClick={onClose} style={{ color: 'var(--ink-3)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* C2PA Provenance Section */}
          {metadata.c2pa && (
            <div className="modal-section">
              <div className="modal-section-title" style={{ color: '#b83210' }}>
                <ShieldAlert size={14} style={{ display: 'inline', marginRight: 4 }} />
                C2PA Content Credentials &amp; Provenance
              </div>
              <div className="modal-raw-box" style={{ background: '#fdf3f0', borderColor: '#f3c7b8' }}>
                <div><strong>Issuer / Generator:</strong> {metadata.c2paIssuer || 'Unknown / Embedded Manifest'}</div>
                <div><strong>Status:</strong> Active cryptographic provenance manifest found</div>
                <div><strong>Impact:</strong> Platforms (Instagram, Facebook, Pinterest) detect this signature to label image as AI.</div>
              </div>
            </div>
          )}

          {/* AI Prompts & Generation Parameters */}
          {metadata.pngTextChunks && metadata.pngPrompts && (
            <div className="modal-section">
              <div className="modal-section-title" style={{ color: 'var(--accent)' }}>
                <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
                AI Generation Prompts &amp; Parameters
              </div>
              <div className="modal-raw-box">
                {metadata.pngPrompts.prompt && (
                  <div style={{ marginBottom: 6 }}>
                    <strong>Positive Prompt:</strong> {metadata.pngPrompts.prompt}
                  </div>
                )}
                {metadata.pngPrompts.negativePrompt && (
                  <div style={{ marginBottom: 6 }}>
                    <strong>Negative Prompt:</strong> {metadata.pngPrompts.negativePrompt}
                  </div>
                )}
                {metadata.pngPrompts.parameters && (
                  <div>
                    <strong>Full Generation Info:</strong>
                    <div style={{ marginTop: 4, opacity: 0.9 }}>{metadata.pngPrompts.parameters}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXIF Data */}
          {metadata.exif && metadata.exifDetails && (
            <div className="modal-section">
              <div className="modal-section-title">
                <Camera size={14} style={{ display: 'inline', marginRight: 4 }} />
                Camera &amp; EXIF Information
              </div>
              <div className="modal-raw-box">
                {metadata.exifDetails.make && <div><strong>Make:</strong> {metadata.exifDetails.make}</div>}
                {metadata.exifDetails.model && <div><strong>Model:</strong> {metadata.exifDetails.model}</div>}
                {metadata.exifDetails.lens && <div><strong>Lens:</strong> {metadata.exifDetails.lens}</div>}
                {metadata.exifDetails.software && <div><strong>Software:</strong> {metadata.exifDetails.software}</div>}
                {metadata.exifDetails.dateTime && <div><strong>Date/Time:</strong> {String(metadata.exifDetails.dateTime)}</div>}
                {metadata.exifDetails.iso && <div><strong>ISO:</strong> {metadata.exifDetails.iso}</div>}
                {metadata.exifDetails.fNumber && <div><strong>F-Number:</strong> f/{metadata.exifDetails.fNumber}</div>}
                {metadata.exifDetails.exposureTime && <div><strong>Exposure:</strong> {metadata.exifDetails.exposureTime}s</div>}
              </div>
            </div>
          )}

          {/* GPS Location Data */}
          {metadata.gps && metadata.gpsDetails && (
            <div className="modal-section">
              <div className="modal-section-title" style={{ color: '#a0331a' }}>
                <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                GPS Coordinates &amp; Geotag
              </div>
              <div className="modal-raw-box">
                <div><strong>Latitude:</strong> {metadata.gpsDetails.latitude?.toFixed(6)}</div>
                <div><strong>Longitude:</strong> {metadata.gpsDetails.longitude?.toFixed(6)}</div>
                {metadata.gpsDetails.altitude && <div><strong>Altitude:</strong> {metadata.gpsDetails.altitude}m</div>}
                {metadata.gpsDetails.latitude && metadata.gpsDetails.longitude && (
                  <div style={{ marginTop: 6 }}>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${metadata.gpsDetails.latitude}&mlon=${metadata.gpsDetails.longitude}#map=16/${metadata.gpsDetails.latitude}/${metadata.gpsDetails.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                    >
                      View on OpenStreetMap &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IPTC & XMP */}
          {(metadata.iptc || metadata.xmp) && (
            <div className="modal-section">
              <div className="modal-section-title">
                <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
                XMP &amp; IPTC Provenance Tags
              </div>
              <div className="modal-raw-box">
                {metadata.digitalSourceType && (
                  <div><strong>Digital Source Type:</strong> {metadata.digitalSourceType}</div>
                )}
                {metadata.software && <div><strong>Creator Tool:</strong> {metadata.software}</div>}
                {metadata.xmp && <div><strong>XMP Structure:</strong> Present</div>}
                {metadata.iptc && <div><strong>IPTC Profile:</strong> Present</div>}
              </div>
            </div>
          )}

          {!metadata.hasAny && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ok)' }}>
              No embedded metadata found in this file. It is already clean!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
