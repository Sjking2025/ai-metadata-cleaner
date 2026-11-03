import React from 'react';
import { Check, X } from 'lucide-react';

const COMPARISONS = [
  {
    feature: '100% Client-Side Processing (Zero Server Uploads)',
    us: true,
    exifcleaner: true,
    metadata2go: false
  },
  {
    feature: 'C2PA / Content Credentials Provenance Removal',
    us: true,
    exifcleaner: false,
    metadata2go: false
  },
  {
    feature: 'Perceptual Hash / pHash Fingerprint Defense',
    us: true,
    exifcleaner: false,
    metadata2go: false
  },
  {
    feature: 'AI Prompts & Parameters Stripping (SD / ComfyUI)',
    us: true,
    exifcleaner: false,
    metadata2go: false
  },
  {
    feature: 'Batch Multi-Image Processing + ZIP Export',
    us: true,
    exifcleaner: true,
    metadata2go: false
  },
  {
    feature: 'Zero Installation Required (Runs in Browser)',
    us: true,
    exifcleaner: false,
    metadata2go: true
  },
  {
    feature: 'Lossless Bit-Exact Mode Option',
    us: true,
    exifcleaner: true,
    metadata2go: false
  },
  {
    feature: 'Social Media / Pinterest / Instagram Optimized',
    us: true,
    exifcleaner: false,
    metadata2go: false
  }
];

export const ComparisonTable: React.FC = () => {
  return (
    <section id="comparison" className="content-section">
      <div className="section-header">
        <span className="section-label">Unmatched Privacy &amp; Power</span>
        <h2 className="section-title">How We Compare</h2>
        <p className="section-desc">
          Traditional EXIF cleaners only target camera fields. Our cleaner is purpose-built for the AI era.
        </p>
      </div>

      <div className="table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th className="brand-col">AI Metadata Cleaner</th>
              <th>ExifCleaner</th>
              <th>Metadata2Go</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISONS.map((row, idx) => (
              <tr key={idx}>
                <td><strong>{row.feature}</strong></td>
                <td className="brand-col">
                  {row.us ? (
                    <span className="status-icon yes">
                      <Check size={16} /> YES
                    </span>
                  ) : (
                    <span className="status-icon no">
                      <X size={16} /> NO
                    </span>
                  )}
                </td>
                <td>
                  {row.exifcleaner ? (
                    <span className="status-icon yes">
                      <Check size={16} /> YES
                    </span>
                  ) : (
                    <span className="status-icon no">
                      <X size={16} /> NO
                    </span>
                  )}
                </td>
                <td>
                  {row.metadata2go ? (
                    <span className="status-icon yes">
                      <Check size={16} /> YES
                    </span>
                  ) : (
                    <span className="status-icon no">
                      <X size={16} /> NO
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
