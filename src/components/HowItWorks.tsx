import React, { useState } from 'react';
import {
  Upload,
  Binary,
  Fingerprint,
  CheckCircle,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface StepDetail {
  num: string;
  badge: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  technicalBreakdown: {
    title: string;
    items: { label: string; status: 'preserved' | 'stripped' | 'altered' | 'verified'; desc: string }[];
  };
}

const DETAILED_STEPS: StepDetail[] = [
  {
    num: '01',
    badge: 'STAGE 1: LOCAL INGESTION',
    title: 'Select & Instant Pre-Scan',
    desc: 'Drag & drop single or batch images. The engine inspects the first 512KB for C2PA boxes and parses EXIF/IPTC/XMP in browser memory with zero network uploads.',
    icon: Upload,
    technicalBreakdown: {
      title: 'In-Memory Pre-Scan Execution',
      items: [
        { label: 'Client Memory Pipeline', status: 'verified', desc: 'FileReader API reads buffer locally; no files leave the client' },
        { label: 'C2PA Box Search', status: 'verified', desc: 'Binary search for c2pa, jumd, caBX, and cabX markers' },
        { label: 'EXIF & GPS Parser', status: 'verified', desc: 'exifr reads TIFF tags, camera details, and latitude/longitude' },
        { label: 'AI Prompts Scanner', status: 'verified', desc: 'Reads tEXt & iTXt chunks for Stable Diffusion parameters' }
      ]
    }
  },
  {
    num: '02',
    badge: 'STAGE 2: METADATA PURGE',
    title: 'Dual-Engine Binary Stripping',
    desc: 'Depending on your mode choice, the engine losslessly slices out metadata containers from binary streams, or renders the image onto an isolated canvas.',
    icon: Binary,
    technicalBreakdown: {
      title: 'Binary Stream Segmentation',
      items: [
        { label: 'Pixel Data Streams (IDAT / SOF)', status: 'preserved', desc: 'Bit-exact image streams preserved without recompression' },
        { label: 'C2PA Manifests (caBX / APP2)', status: 'stripped', desc: 'Cryptographic provenance containers completely purged' },
        { label: 'Hardware EXIF (APP1)', status: 'stripped', desc: 'Camera model, lens, serial numbers, and ISO removed' },
        { label: 'GPS Geotags & Timestamps', status: 'stripped', desc: 'Coordinates, altitude, and device timestamps erased' }
      ]
    }
  },
  {
    num: '03',
    badge: 'STAGE 3: ANTI-TRACKING DEFENSE',
    title: 'Fingerprint & pHash Reset',
    desc: 'In pHash mode, a sub-pixel transform and 32x32 bilinear interpolated random noise field (+/-2.5 intensity) alters perceptual hashes without human-visible changes.',
    icon: Fingerprint,
    technicalBreakdown: {
      title: 'Anti-Perceptual Hash Defense Mechanics',
      items: [
        { label: 'Sub-Pixel Zoom (1.001-1.003x)', status: 'altered', desc: 'Micro-scale shifts pixel grid to break rigid perceptual hash matching' },
        { label: 'Micro-Rotation (0.04-0.16°)', status: 'altered', desc: 'Imperceptible rotation resets orientation vector heuristics' },
        { label: '32x32 Bilinear Noise Field', status: 'altered', desc: 'Smooth random intensity perturbation across RGB color channels' },
        { label: 'Visual Fidelity', status: 'preserved', desc: '100% indistinguishable to the human eye, verified artifact-free' }
      ]
    }
  },
  {
    num: '04',
    badge: 'STAGE 4: VERIFICATION & EXPORT',
    title: 'Dual-Pass Verification & Download',
    desc: 'A secondary verification scan verifies that all provenance containers are 100% eliminated, confirms SHA-256 hash changes, and generates single or batch ZIP exports.',
    icon: CheckCircle,
    technicalBreakdown: {
      title: 'Post-Clean Verification Checkpoints',
      items: [
        { label: 'Zero Leaked Markers Pass', status: 'verified', desc: 'Secondary scan confirms 0 C2PA, 0 EXIF, 0 GPS tags remain' },
        { label: 'Cryptographic Hash Check', status: 'verified', desc: 'SHA-256 calculated before and after; hashChanged verified' },
        { label: 'Single Cleaned Download', status: 'verified', desc: 'Download individual sanitized images with _cleaned suffix' },
        { label: 'Batch ZIP Packaging', status: 'verified', desc: 'Client-side JSZip bundles entire queue into one archive' }
      ]
    }
  }
];

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const currentDetail = DETAILED_STEPS[activeStep];
  const StepIcon = currentDetail.icon;

  return (
    <section id="how-it-works" className="content-section" style={{ scrollMarginTop: '80px' }}>
      <div className="section-header">
        <span className="section-label">Interactive Process Stepper</span>
        <h2 className="section-title">How Our Cleaning Pipeline Works</h2>
        <p className="section-desc">
          Zero server uploads. 100% of detection, binary container stripping, fingerprint defense, and verification executes in local browser memory.
        </p>
      </div>

      {/* Stepper Timeline Navigation */}
      <div className="how-it-works-stepper" role="tablist" aria-label="Workflow Steps">
        {DETAILED_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === idx;
          return (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`step-stepper-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveStep(idx)}
            >
              <div className="stepper-num-circle">
                <span>{step.num}</span>
              </div>
              <div className="stepper-btn-content">
                <span className="stepper-btn-badge">{step.badge.split(':')[0]}</span>
                <span className="stepper-btn-title">{step.title}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Interactive Showcase Card */}
      <div className="step-showcase-card">
        <div className="showcase-header">
          <div className="showcase-badge-row">
            <span className="showcase-num-badge">STEP {currentDetail.num}</span>
            <span className="showcase-stage-badge">{currentDetail.badge}</span>
          </div>
          <h3 className="showcase-title">{currentDetail.title}</h3>
          <p className="showcase-desc">{currentDetail.desc}</p>
        </div>

        {/* Technical Diagram Matrix */}
        <div className="showcase-matrix">
          <div className="matrix-header">
            <span className="matrix-title">{currentDetail.technicalBreakdown.title}</span>
            <span className="matrix-indicator">Live Client Execution</span>
          </div>

          <div className="matrix-grid">
            {currentDetail.technicalBreakdown.items.map((item, i) => (
              <div key={i} className={`matrix-item ${item.status}`}>
                <div className="matrix-item-top">
                  <span className="matrix-item-label">{item.label}</span>
                  <span className={`status-badge ${item.status}`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <p className="matrix-item-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stepper Quick Navigation Bar */}
        <div className="showcase-nav-row">
          <button
            type="button"
            className="btn-stepper-nav"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
          >
            &larr; Previous Stage
          </button>

          <span className="stepper-counter-text">
            Stage {activeStep + 1} of {DETAILED_STEPS.length}
          </span>

          <button
            type="button"
            className="btn-stepper-nav next"
            disabled={activeStep === DETAILED_STEPS.length - 1}
            onClick={() => setActiveStep((prev) => Math.min(DETAILED_STEPS.length - 1, prev + 1))}
          >
            Next Stage &rarr;
          </button>
        </div>
      </div>
    </section>
  );
};
