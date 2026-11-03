import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="logo-badge">PROVENANCE CLEANER</span>
            <span className="logo-title" style={{ fontSize: '18px' }}>AI Metadata Cleaner</span>
          </div>
          <p className="footer-desc">
            Privacy-focused utility for detecting and removing AI provenance metadata, C2PA content credentials, EXIF data, and digital fingerprints from your media files. 100% client-side in your browser.
          </p>
        </div>

        <div>
          <div className="footer-col-title">Capabilities</div>
          <ul className="footer-links">
            <li><a href="#features" className="footer-link">C2PA Provenance Stripper</a></li>
            <li><a href="#features" className="footer-link">EXIF &amp; GPS Geotag Remover</a></li>
            <li><a href="#features" className="footer-link">Stable Diffusion Prompt Cleaner</a></li>
            <li><a href="#features" className="footer-link">pHash Tracking Fingerprint Reset</a></li>
            <li><a href="#features" className="footer-link">Batch Multi-Image Processing</a></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Formats &amp; Modes</div>
          <ul className="footer-links">
            <li><span className="footer-link">JPEG / JPG Sanitization</span></li>
            <li><span className="footer-link">PNG Chunk Filtering</span></li>
            <li><span className="footer-link">WebP &amp; AVIF Strip</span></li>
            <li><span className="footer-link">Lossless Bit-Exact Mode</span></li>
            <li><span className="footer-link">pHash Anti-Tracking Mode</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          &copy; {new Date().getFullYear()} AI Metadata Cleaner. All processing occurs locally on your device.
          <span style={{ marginLeft: 12, opacity: 0.8 }}>
            Idea &amp; Reference Credit:{' '}
            <a
              href="https://aimetadatacleaner.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline' }}
            >
              aimetadatacleaner.com
            </a>
          </span>
        </div>
        <div style={{ maxWidth: '600px', textAlign: 'right', fontSize: '11px', color: 'var(--ink-3)' }}>
          Disclaimer: This application is a privacy and sanitization utility. It removes metadata headers and resets perceptual hash tracking. It does not alter invisible pixel watermarks (e.g., SynthID) or guarantee specific outcomes on third-party platforms.
        </div>
      </div>
    </footer>
  );
};
