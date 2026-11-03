import React from 'react';
import { Sliders, Sparkles, Feather, FileCheck } from 'lucide-react';
import type { CleanOptions, CleaningMode, OutputFormat } from '../types';

interface SettingsBarProps {
  options: CleanOptions;
  onChange: (options: CleanOptions) => void;
}

export const SettingsBar: React.FC<SettingsBarProps> = ({ options, onChange }) => {
  const handleModeChange = (mode: CleaningMode) => {
    onChange({ ...options, mode });
  };

  const handleFormatChange = (outputFormat: OutputFormat) => {
    onChange({ ...options, outputFormat });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, quality: parseFloat(e.target.value) });
  };

  return (
    <div className="settings-bar">
      <div className="settings-grid">
        {/* Cleaning Mode Selection */}
        <div className="setting-col">
          <div className="setting-label">
            <Sliders size={13} />
            <span>Cleaning Mode</span>
          </div>

          <div className="mode-selector">
            <button
              type="button"
              className={`mode-card ${options.mode === 'fingerprint' ? 'active' : ''}`}
              onClick={() => handleModeChange('fingerprint')}
            >
              <div className="mode-title">
                <span>Re-encode &amp; pHash Defense</span>
                <Sparkles size={14} color="var(--accent)" />
              </div>
              <div className="mode-desc">
                Resets perceptual hash and tracking fingerprint. Best for social media &amp; privacy.
              </div>
            </button>

            <button
              type="button"
              className={`mode-card ${options.mode === 'lossless' ? 'active' : ''}`}
              onClick={() => handleModeChange('lossless')}
            >
              <div className="mode-title">
                <span>Preserve Original Quality</span>
                <Feather size={14} color="var(--ok)" />
              </div>
              <div className="mode-desc">
                Lossless binary strip. Keeps 100% bit-exact pixel quality with zero re-compression.
              </div>
            </button>
          </div>
        </div>

        {/* Output Format & Quality */}
        <div className="setting-col">
          <div className="setting-label">
            <FileCheck size={13} />
            <span>Target Output Format</span>
          </div>

          <div className="format-options-row">
            {(['jpeg', 'png', 'webp', 'avif'] as OutputFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                className={`format-pill-btn ${options.outputFormat === fmt ? 'active' : ''}`}
                onClick={() => handleFormatChange(fmt)}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>

          {options.mode === 'fingerprint' &&
            (options.outputFormat === 'jpeg' || options.outputFormat === 'webp') && (
              <div style={{ marginTop: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--ink-3)',
                    marginBottom: '4px'
                  }}
                >
                  <span>Compression Quality</span>
                  <span>{Math.round(options.quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="1.00"
                  step="0.01"
                  value={options.quality}
                  onChange={handleQualityChange}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
