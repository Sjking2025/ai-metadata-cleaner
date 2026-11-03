import React from 'react';

const STEPS = [
  {
    num: '01 / SELECT',
    title: 'Pick Your Images',
    desc: 'Drag & drop single or batch images into the browser. Works with JPG, PNG, WebP, AVIF, and HEIC.'
  },
  {
    num: '02 / STRIP',
    title: 'Metadata Removed',
    desc: 'Our engine strips C2PA manifests, EXIF data, GPS coordinates, IPTC tags, and prompt text.'
  },
  {
    num: '03 / DEFEND',
    title: 'Fingerprint Reset',
    desc: 'In pHash mode, a subtle bilateral noise transform resets perceptual hashes and cross-site tracking fingerprints.'
  },
  {
    num: '04 / VERIFY',
    title: 'Download Clean Files',
    desc: 'A secondary verification scan confirms 100% clean output. Download individually or as a single batch ZIP.'
  }
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="content-section">
      <div className="section-header">
        <span className="section-label">4-Step Workflow</span>
        <h2 className="section-title">How It Works</h2>
        <p className="section-desc">
          Zero server uploads. 100% of detection, stripping, fingerprint defense, and verification happens right in your browser.
        </p>
      </div>

      <div className="steps-grid">
        {STEPS.map((step, idx) => (
          <div key={idx} className="step-card">
            <span className="step-number">{step.num}</span>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
