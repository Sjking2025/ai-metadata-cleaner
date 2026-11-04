import React from 'react';
import { Link } from 'react-router-dom';

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
            Privacy-focused utility for detecting and removing AI provenance metadata, C2PA content credentials, EXIF data, and digital fingerprints from your photos, videos, PDFs, and RAW files. 100% client-side in your browser.
          </p>
        </div>

        <div>
          <div className="footer-col-title">Dedicated Format Tools</div>
          <ul className="footer-links">
            <li><Link to="/" className="footer-link">Image Metadata Cleaner (C2PA &amp; EXIF)</Link></li>
            <li><Link to="/remove-metadata-from-pdf" className="footer-link">PDF Metadata Remover (XMP &amp; Author)</Link></li>
            <li><Link to="/remove-metadata-from-video" className="footer-link">Video Metadata Remover (MP4 / MOV)</Link></li>
            <li><Link to="/remove-metadata-from-raw" className="footer-link">Camera RAW Photo Remover (DNG / CR2)</Link></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Capabilities &amp; Modes</div>
          <ul className="footer-links">
            <li><span className="footer-link">Lossless Bit-Exact Binary Slicing</span></li>
            <li><span className="footer-link">pHash Tracking Fingerprint Reset</span></li>
            <li><span className="footer-link">MP4 / QuickTime udta Container Scrub</span></li>
            <li><span className="footer-link">In-Browser PDF Info &amp; XMP Purge</span></li>
            <li><span className="footer-link">Batch Multi-File ZIP Export</span></li>
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
