import React, { useState } from 'react';
import {
  Camera,
  MapPin,
  FileCode,
  ShieldAlert,
  Sliders,
  Sparkles,
  Fingerprint,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface FeatureItem {
  id: string;
  category: 'ai' | 'camera' | 'privacy';
  icon: React.ElementType;
  title: string;
  technicalTag: string;
  desc: string;
  affected: string[];
}

const ALL_FEATURES: FeatureItem[] = [
  {
    id: 'c2pa',
    category: 'ai',
    icon: ShieldAlert,
    title: 'C2PA Content Credentials',
    technicalTag: 'caBX / JUMBF Manifest',
    desc: 'Cryptographic provenance manifests embedded in image headers and JUMBF boxes, proving digital origin and AI creation.',
    affected: ['Adobe Firefly', 'Photoshop', 'DALL-E 3', 'Microsoft Designer', 'CAI']
  },
  {
    id: 'sd-params',
    category: 'ai',
    icon: Sliders,
    title: 'Stable Diffusion Parameters',
    technicalTag: 'tEXt / zTXt parameters',
    desc: 'Full embedded generation prompts, negative prompts, seeds, CFG scales, samplers, and node graph workflows.',
    affected: ['Automatic1111', 'ComfyUI', 'InvokeAI', 'SD WebUI', 'Forge']
  },
  {
    id: 'ai-signatures',
    category: 'ai',
    icon: Sparkles,
    title: 'AI Generator Signatures',
    technicalTag: 'AI Watermarks & Tags',
    desc: 'Vendor-specific tool fingerprints and model IDs that automated platform crawlers read to label content.',
    affected: ['Midjourney', 'DALL-E', 'Firefly', 'Meta Imagine', 'NovelAI']
  },
  {
    id: 'exif',
    category: 'camera',
    icon: Camera,
    title: 'EXIF Hardware Data',
    technicalTag: 'TIFF / EXIF 2.32 IFD',
    desc: 'Camera serial numbers, lens specifications, shutter count, aperture, ISO, exposure time, and exact device models.',
    affected: ['iPhones', 'Android Devices', 'Sony', 'Canon', 'Nikon', 'Fujifilm']
  },
  {
    id: 'gps',
    category: 'camera',
    icon: MapPin,
    title: 'GPS & Location Tags',
    technicalTag: 'GPS IFD Coordinates',
    desc: 'Precise latitude, longitude coordinates, altitude, compass bearing, and timestamp geotags embedded in photo headers.',
    affected: ['Smartphones', 'Drones', 'GoPro', 'GPS Cameras']
  },
  {
    id: 'phash',
    category: 'privacy',
    icon: Fingerprint,
    title: 'Perceptual Hash Tracking',
    technicalTag: 'pHash / dHash 64-bit',
    desc: 'Subtle bilateral micro-variation resets image perceptual hashing, defeating reverse-image indexing across platforms.',
    affected: ['Pinterest', 'Instagram', 'Google Lens', 'TinEye']
  },
  {
    id: 'xmp-iptc',
    category: 'privacy',
    icon: FileCode,
    title: 'XMP & IPTC Metadata',
    technicalTag: 'trainedAlgorithmicMedia',
    desc: 'Creator provenance fields, copyright statements, digital source types, and editing history sidecars.',
    affected: ['IPTC Standards', 'Adobe XMP', 'Stock Photo Sites']
  },
  {
    id: 'png-chunks',
    category: 'privacy',
    icon: Layers,
    title: 'PNG Ancillary Chunks',
    technicalTag: 'iTXt / pHYs / eXIf',
    desc: 'Auxiliary chunks storing software history, physical DPI dimensions, and custom application metadata.',
    affected: ['All PNG Generation & Editing Software']
  }
];

export const FeaturesSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'ai' | 'camera' | 'privacy'>('all');

  const filteredFeatures = ALL_FEATURES.filter((f) =>
    activeCategory === 'all' ? true : f.category === activeCategory
  );

  return (
    <section id="features" className="content-section" style={{ scrollMarginTop: '80px' }}>
      <div className="section-header">
        <span className="section-label">Complete Provenance Removal</span>
        <h2 className="section-title">What Our Metadata Cleaner Removes</h2>
        <p className="section-desc">
          We strip every type of hidden tracking marker, digital signature, and provenance manifest that can compromise your privacy or label your content.
        </p>

        {/* Category Filter Pills */}
        <div className="features-filter-nav" role="tablist" aria-label="Feature categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            className={`feature-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Features ({ALL_FEATURES.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'ai'}
            className={`feature-tab-btn ${activeCategory === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ai')}
          >
            AI &amp; Credentials (3)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'camera'}
            className={`feature-tab-btn ${activeCategory === 'camera' ? 'active' : ''}`}
            onClick={() => setActiveCategory('camera')}
          >
            Camera &amp; GPS (2)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'privacy'}
            className={`feature-tab-btn ${activeCategory === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveCategory('privacy')}
          >
            Tracking &amp; Privacy (3)
          </button>
        </div>
      </div>

      <div className="features-grid">
        {filteredFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div key={feat.id} className="feature-card">
              <div className="feature-card-top">
                <div className="feature-icon-box">
                  <Icon size={22} strokeWidth={1.5} />
                </div>
                <span className="feature-technical-tag">{feat.technicalTag}</span>
              </div>

              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>

              <div className="feature-card-footer">
                <span className="affected-label">Targets:</span>
                <div className="affected-chips-row">
                  {feat.affected.slice(0, 3).map((tool, i) => (
                    <span key={i} className="affected-chip">
                      {tool}
                    </span>
                  ))}
                  {feat.affected.length > 3 && (
                    <span className="affected-chip more">+{feat.affected.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
