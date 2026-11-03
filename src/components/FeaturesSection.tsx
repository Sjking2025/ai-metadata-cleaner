import React from 'react';
import {
  Camera,
  MapPin,
  FileCode,
  ShieldAlert,
  Sliders,
  Sparkles,
  Fingerprint,
  Layers
} from 'lucide-react';

const FEATURES = [
  {
    icon: Camera,
    title: 'EXIF Data',
    desc: 'Camera model, lens specifications, exposure settings, ISO, timestamps, serial numbers, and device identifiers.'
  },
  {
    icon: MapPin,
    title: 'GPS & Location Tags',
    desc: 'Exact latitude, longitude coordinates, altitude, and location metadata embedded by smartphones and digital cameras.'
  },
  {
    icon: FileCode,
    title: 'XMP & IPTC Metadata',
    desc: 'Creator information, copyright fields, digitalSourceType (trained algorithmic media), keywords, and editing software history.'
  },
  {
    icon: ShieldAlert,
    title: 'C2PA Content Credentials',
    desc: 'Cryptographic provenance manifests embedded by Adobe Firefly, Photoshop, DALL-E, Microsoft Designer, and CAI tools.'
  },
  {
    icon: Sliders,
    title: 'Stable Diffusion Parameters',
    desc: 'Prompts, negative prompts, seeds, CFG scale, sampler, model hashes, and workflow JSON from Automatic1111, ComfyUI, and Forge.'
  },
  {
    icon: Sparkles,
    title: 'AI Generator Signatures',
    desc: 'DALL-E, Midjourney, Adobe Firefly, and generator-specific fingerprints that trigger AI labeling on social platforms.'
  },
  {
    icon: Fingerprint,
    title: 'Image Hash / Fingerprint',
    desc: 'Micro-subpixel alteration resets the perceptual hash (pHash) so reverse-image searches cannot link copies back to you.'
  },
  {
    icon: Layers,
    title: 'PNG Info Chunks',
    desc: 'tEXt, iTXt, and zTXt chunks used by generative AI web interfaces to store full generation history and model weights.'
  }
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="content-section">
      <div className="section-header">
        <span className="section-label">Complete Provenance Removal</span>
        <h2 className="section-title">What Our Metadata Cleaner Removes</h2>
        <p className="section-desc">
          We strip every type of hidden tracking data and digital provenance signature that can compromise your privacy or label your content.
        </p>
      </div>

      <div className="features-grid">
        {FEATURES.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div key={idx} className="feature-card">
              <div className="feature-icon-box">
                <Icon size={22} strokeWidth={1.5} />
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
