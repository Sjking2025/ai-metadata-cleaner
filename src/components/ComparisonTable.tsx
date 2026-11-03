import React, { useState } from 'react';
import { Check, X, Info, ChevronDown, ChevronUp, ShieldCheck, Zap } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  category: 'ai' | 'privacy' | 'usability';
  us: boolean;
  exifcleaner: boolean;
  metadata2go: boolean;
  detail: string;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    feature: '100% Client-Side Processing (Zero Server Uploads)',
    category: 'privacy',
    us: true,
    exifcleaner: true,
    metadata2go: false,
    detail: 'Your images never leave your local device. Metadata2Go uploads user photos to remote backend cloud servers where they may be logged or retained.'
  },
  {
    feature: 'C2PA Content Credentials & Provenance Removal',
    category: 'ai',
    us: true,
    exifcleaner: false,
    metadata2go: false,
    detail: 'Traditional EXIF tools only strip APP1 segments; they completely miss APP2 JUMBF provenance containers, leaving AI generator tags and cryptographic signatures intact.'
  },
  {
    feature: 'Perceptual Hash / pHash Tracking Defense',
    category: 'ai',
    us: true,
    exifcleaner: false,
    metadata2go: false,
    detail: 'Applies sub-pixel scaling and 32x32 bilinear random noise to alter perceptual hash fingerprints without human-visible changes, defeating reverse image search indexing.'
  },
  {
    feature: 'AI Prompts & Parameters Stripping (SD / ComfyUI)',
    category: 'ai',
    us: true,
    exifcleaner: false,
    metadata2go: false,
    detail: 'Eradicates hidden tEXt, zTXt, and iTXt chunks containing positive/negative prompts, seeds, samplers, model checkpoints, and ComfyUI workflow JSON.'
  },
  {
    feature: 'Batch Multi-Image Processing + ZIP Export',
    category: 'usability',
    us: true,
    exifcleaner: true,
    metadata2go: false,
    detail: 'Drag and drop multiple images simultaneously and download all verified clean outputs packaged into a single ZIP archive.'
  },
  {
    feature: 'Zero Installation Required (Runs Anywhere)',
    category: 'usability',
    us: true,
    exifcleaner: false,
    metadata2go: true,
    detail: 'Runs directly in any web browser on desktop, mobile, tablet, or Chromebook without installing heavy desktop binaries or frameworks.'
  },
  {
    feature: 'Lossless Bit-Exact Mode Option',
    category: 'privacy',
    us: true,
    exifcleaner: true,
    metadata2go: false,
    detail: 'Slices metadata containers directly from the binary stream without recompression, keeping pixel DCT streams 100% bit-exact.'
  },
  {
    feature: 'Social Media / Pinterest / Instagram Optimized',
    category: 'ai',
    us: true,
    exifcleaner: false,
    metadata2go: false,
    detail: 'Specifically engineered to strip the provenance signatures and digital tracking fingerprints used by social algorithms to flag content.'
  }
];

export const ComparisonTable: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ai' | 'privacy' | 'usability'>('all');
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredRows = COMPARISON_DATA.filter((row) =>
    selectedCategory === 'all' ? true : row.category === selectedCategory
  );

  return (
    <section id="comparison" className="content-section" style={{ scrollMarginTop: '80px' }}>
      <div className="section-header">
        <span className="section-label">Side-by-Side Analysis</span>
        <h2 className="section-title">How We Compare</h2>
        <p className="section-desc">
          Traditional EXIF strippers were created years ago for digital cameras. Our cleaner is purpose-built from the ground up for the generative AI era.
        </p>

        {/* Filter Navigation */}
        <div className="features-filter-nav" role="tablist" aria-label="Comparison categories">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            className={`feature-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Features ({COMPARISON_DATA.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'ai'}
            className={`feature-tab-btn ${selectedCategory === 'ai' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ai')}
          >
            AI &amp; Provenance (4)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'privacy'}
            className={`feature-tab-btn ${selectedCategory === 'privacy' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('privacy')}
          >
            Privacy &amp; Security (2)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'usability'}
            className={`feature-tab-btn ${selectedCategory === 'usability' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('usability')}
          >
            Usability (2)
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="comparison-table" aria-label="Tool feature comparison matrix">
          <thead>
            <tr>
              <th scope="col" style={{ width: '40%' }}>Feature / Capability</th>
              <th scope="col" className="brand-col" style={{ width: '24%' }}>
                <div className="brand-col-header">
                  <span className="brand-name">AI Metadata Cleaner</span>
                  <span className="brand-badge-pill">All-in-One Engine</span>
                </div>
              </th>
              <th scope="col" style={{ width: '18%' }}>ExifCleaner</th>
              <th scope="col" style={{ width: '18%' }}>Metadata2Go</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => {
              const isExpanded = !!expandedRows[idx];
              return (
                <React.Fragment key={idx}>
                  <tr
                    className={`comparison-row ${isExpanded ? 'is-expanded' : ''}`}
                    onClick={() => toggleRow(idx)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleRow(idx);
                      }
                    }}
                  >
                    <td>
                      <div className="feature-cell-content">
                        <span className="feature-name-text">{row.feature}</span>
                        <span className="expand-indicator-btn" aria-hidden="true">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </div>
                    </td>

                    <td className="brand-col">
                      <span className="status-pill supported">
                        <Check size={13} strokeWidth={2.5} />
                        <span>YES</span>
                      </span>
                    </td>

                    <td>
                      {row.exifcleaner ? (
                        <span className="status-pill supported-neutral">
                          <Check size={13} />
                          <span>YES</span>
                        </span>
                      ) : (
                        <span className="status-pill unsupported">
                          <X size={13} />
                          <span>NO</span>
                        </span>
                      )}
                    </td>

                    <td>
                      {row.metadata2go ? (
                        <span className="status-pill supported-neutral">
                          <Check size={13} />
                          <span>YES</span>
                        </span>
                      ) : (
                        <span className="status-pill unsupported">
                          <X size={13} />
                          <span>NO</span>
                        </span>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="comparison-detail-row">
                      <td colSpan={4}>
                        <div className="comparison-detail-box">
                          <Info size={14} className="detail-icon" />
                          <p className="detail-text">{row.detail}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Comparison Verdict Callout */}
      <div className="comparison-verdict-card">
        <div className="verdict-icon-box">
          <ShieldCheck size={28} color="var(--ok)" />
        </div>
        <div className="verdict-content">
          <h3 className="verdict-title">The Bottom Line: Why EXIF Strippers Fall Short</h3>
          <p className="verdict-desc">
            Traditional camera EXIF removers were designed before C2PA Content Credentials and AI models existed. They strip camera fields but leave cryptographic provenance containers, generation prompt chunks, and perceptual hashes untouched. AI Metadata Cleaner addresses the entire modern pipeline in a single in-browser pass.
          </p>
        </div>
      </div>
    </section>
  );
};
