import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    q: 'What is a metadata cleaner?',
    a: 'A metadata cleaner (also called a metadata remover, meta cleaner, or EXIF cleaner) is a tool that removes hidden data embedded inside image files — camera information, GPS coordinates, timestamps, editing history, and AI generation signatures. This tool runs entirely in your browser, so your images never leave your device and no account is required.'
  },
  {
    q: 'Is this an EXIF remover and image metadata stripper too?',
    a: 'Yes. Our tool removes all standard EXIF fields (camera make, model, lens, GPS coordinates, timestamps, ISO, aperture, shutter speed) along with XMP, IPTC, and C2PA metadata. If you are looking for a free EXIF cleaner or image metadata remover, this tool handles both traditional photo metadata and AI-specific signatures in a single click.'
  },
  {
    q: 'What does this tool remove before I share images on Pinterest or Instagram?',
    a: 'It removes the embedded data that travels inside your file — EXIF, GPS coordinates, C2PA content credentials, XMP/IPTC fields, and AI generation tags — and resets the image fingerprint that can link copies of a photo back to you across the web. This gives you control over the personal and provenance information attached to your images before you publish them.'
  },
  {
    q: 'Is my data safe? Do you store my images?',
    a: "Absolutely safe. 100% of processing happens client-side in your browser's local memory. Your images never leave your device — they are not uploaded to any server at any point. We prioritize complete privacy and security in our design."
  },
  {
    q: 'What AI image generators does this work with?',
    a: 'Our tool works with all major AI image generators including DALL-E, Midjourney, Stable Diffusion, Automatic1111, ComfyUI, Adobe Firefly, Microsoft Designer, and any other AI tool that embeds metadata or digital signatures in generated images.'
  },
  {
    q: 'How many images can I process at once?',
    a: 'You can batch process unlimited images at once! Drag & drop any number of images into the dropzone, let the engine process them in parallel or sequence, and download them all together in a single convenient ZIP file.'
  },
  {
    q: 'Will this reduce my image quality?',
    a: 'No visible quality loss occurs. When you choose "Preserve Original Quality" (Lossless Strip), the pixel data is 100% bit-exact and zero re-compression happens. When you choose "Re-encode & pHash Defense", the image is encoded with high visual fidelity while applying a subtle sub-pixel transform to break cross-site tracking fingerprints.'
  },
  {
    q: 'What can a metadata cleaner not remove?',
    a: "A metadata cleaner removes data stored in the file's container headers and resets the perceptual hash fingerprint. It cannot remove watermarks encoded in the pixels themselves — for example invisible pixel-pattern watermarks such as Google's SynthID or visual AI classifier models. Those are not metadata, so no metadata stripper removes them."
  }
];

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="content-section">
      <div className="section-header">
        <span className="section-label">Answers to Common Questions</span>
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-desc">
          Everything you need to know about metadata removal, C2PA content credentials, and fingerprint defense.
        </p>
      </div>

      <div className="faq-list">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="faq-item">
              <button
                type="button"
                className="faq-question-btn"
                onClick={() => toggle(idx)}
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isOpen && <div className="faq-answer">{faq.a}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
};
