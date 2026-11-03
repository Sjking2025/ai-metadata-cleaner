import React from 'react';
import { Sliders, Sparkles, Feather, FileCheck, Check, Info } from 'lucide-react';
import type { CleanOptions, CleaningMode, OutputFormat } from '../types';

interface SettingsBarProps {
  options: CleanOptions;
  onChange: (options: CleanOptions) => void;
}

const FORMAT_DESCRIPTIONS: Record<OutputFormat, string> = {
  jpeg: 'Maximum compatibility for all devices & platforms',
  png: 'Lossless graphics, transparency support',
  webp: 'Modern compact web format with high compression',
  avif: 'Next-generation image format with superior efficiency'
};

const QUALITY_PRESETS = [0.85, 0.90, 0.95, 1.00];

export const SettingsBar: React.FC<SettingsBarProps> = ({ options, onChange }) => {
  const handleModeChange = (mode: CleaningMode) => {
    onChange({ ...options, mode });
  };

  const handleFormatChange = (outputFormat: OutputFormat) => {
    onChange({ ...options, outputFormat });
  };

  const handleQualityChange = (val: number) => {
    onChange({ ...options, quality: val });
  };

  return (
    <div className="settings-bar" role="region" aria-label="Cleaning and export settings">
      <div className="settings-grid">
        {/* Cleaning Mode Selection */}
        <div className="setting-col">
          <div className="setting-label">
            <Sliders size={13} />
            <span>Select Cleaning Engine</span>
          </div>

          <div className="mode-selector" role="radiogroup" aria-label="Cleaning Mode">
            <button
              type="button"
              role="radio"
              aria-checked={options.mode === 'fingerprint'}
              className={`mode-card ${options.mode === 'fingerprint' ? 'active' : ''}`}
              onClick={() => handleModeChange('fingerprint')}
            >
              <div className="mode-card-header">
                <div className="mode-radio-dot">
                  {options.mode === 'fingerprint' && <div className="dot-inner" />}
                </div>
                <div className="mode-title-text">
                  <div className="mode-title">
                    <span>Re-encode &amp; pHash Defense</span>
                    <Sparkles size={13} color="var(--accent)" />
                  </div>
                  <span className="mode-badge-recommended">Recommended for Social</span>
                </div>
              </div>
              <p className="mode-desc">
                Decodes to canvas &amp; applies sub-pixel bilateral noise. Eradicates cross-site tracking fingerprints &amp; all metadata containers.
              </p>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={options.mode === 'lossless'}
              className={`mode-card ${options.mode === 'lossless' ? 'active' : ''}`}
              onClick={() => handleModeChange('lossless')}
            >
              <div className="mode-card-header">
                <div className="mode-radio-dot">
                  {options.mode === 'lossless' && <div className="dot-inner" />}
                </div>
                <div className="mode-title-text">
                  <div className="mode-title">
                    <span>Preserve Original Quality</span>
                    <Feather size={13} color="var(--ok)" />
                  </div>
                  <span className="mode-badge-neutral">Bit-Exact Lossless</span>
                </div>
              </div>
              <p className="mode-desc">
                Direct binary stream chunk stripper. Leaves JPEG DCT &amp; PNG IDAT streams 100% untouched for zero re-compression.
              </p>
            </button>
          </div>
        </div>

        {/* Output Format & Quality */}
        <div className="setting-col">
          <div className="setting-label">
            <FileCheck size={13} />
            <span>Output Format &amp; Compression</span>
          </div>

          <div className="format-options-row" role="radiogroup" aria-label="Target format">
            {(['jpeg', 'png', 'webp', 'avif'] as OutputFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                role="radio"
                aria-checked={options.outputFormat === fmt}
                className={`format-pill-btn ${options.outputFormat === fmt ? 'active' : ''}`}
                onClick={() => handleFormatChange(fmt)}
              >
                <span className="format-name">{fmt.toUpperCase()}</span>
                {options.outputFormat === fmt && <Check size={12} className="check-icon" />}
              </button>
            ))}
          </div>

          <div className="format-hint-text">
            <Info size={12} style={{ flexShrink: 0 }} />
            <span>{FORMAT_DESCRIPTIONS[options.outputFormat]}</span>
          </div>

          {/* Quality slider for lossy formats */}
          {options.mode === 'fingerprint' &&
            (options.outputFormat === 'jpeg' || options.outputFormat === 'webp' || options.outputFormat === 'avif') && (
              <div className="quality-slider-container">
                <div className="slider-header">
                  <span className="slider-label">Encoding Quality</span>
                  <div className="slider-presets">
                    {QUALITY_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`preset-btn ${options.quality === preset ? 'active' : ''}`}
                        onClick={() => handleQualityChange(preset)}
                      >
                        {Math.round(preset * 100)}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="slider-track-wrap">
                  <input
                    type="range"
                    min="0.70"
                    max="1.00"
                    step="0.01"
                    aria-label="Image encoding quality"
                    value={options.quality}
                    onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                    className="styled-range-input"
                  />
                  <div className="slider-fill-indicator" style={{ width: `${((options.quality - 0.70) / 0.30) * 100}%` }} />
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
