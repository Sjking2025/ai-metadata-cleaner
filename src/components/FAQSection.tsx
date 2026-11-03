import React, { useState } from 'react';
import { ChevronDown, Search, X, HelpCircle, ExternalLink } from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'ai' | 'privacy' | 'quality';
  q: string;
  a: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: 'what-is',
    category: 'privacy',
    q: 'What is a metadata cleaner?',
    a: 'A metadata cleaner (also called a metadata remover, meta cleaner, or EXIF cleaner) is a tool that removes hidden data embedded inside image files — camera information, GPS coordinates, timestamps, editing history, and AI generation signatures. This tool runs entirely in your browser, so your images never leave your device and no account is required.'
  },
  {
    id: 'exif-stripper',
    category: 'privacy',
    q: 'Is this an EXIF remover and image metadata stripper too?',
    a: 'Yes. Our tool removes all standard EXIF fields (camera make, model, lens, GPS coordinates, timestamps, ISO, aperture, shutter speed) along with XMP, IPTC, and C2PA metadata. If you are looking for a free EXIF cleaner or image metadata remover, this tool handles both traditional photo metadata and AI-specific signatures in a single click.'
  },
  {
    id: 'social-platforms',
    category: 'ai',
    q: 'What does this tool remove before I share images on Pinterest or Instagram?',
    a: 'It removes the embedded data that travels inside your file — EXIF, GPS coordinates, C2PA content credentials, XMP/IPTC fields, and AI generation tags — and resets the image fingerprint that can link copies of a photo back to you across the web. This gives you control over the personal and provenance information attached to your images before you publish them.'
  },
  {
    id: 'safety',
    category: 'privacy',
    q: 'Is my data safe? Do you store my images?',
    a: "Absolutely safe. 100% of processing happens client-side in your browser's local memory. Your images never leave your device — they are not uploaded to any server at any point. We prioritize complete privacy and security in our design."
  },
  {
    id: 'ai-generators',
    category: 'ai',
    q: 'What AI image generators does this work with?',
    a: 'Our tool works with all major AI image generators including DALL-E, Midjourney, Stable Diffusion, Automatic1111, ComfyUI, Adobe Firefly, Microsoft Designer, and any other AI tool that embeds metadata or digital signatures in generated images.'
  },
  {
    id: 'batch-limit',
    category: 'quality',
    q: 'How many images can I process at once?',
    a: 'You can batch process unlimited images at once! Drag & drop any number of images into the dropzone, let the engine process them in parallel or sequence, and download them all together in a single convenient ZIP file.'
  },
  {
    id: 'quality-loss',
    category: 'quality',
    q: 'Will this reduce my image quality?',
    a: 'No visible quality loss occurs. When you choose "Preserve Original Quality" (Lossless Strip), the pixel data is 100% bit-exact and zero re-compression happens. When you choose "Re-encode & pHash Defense", the image is encoded with high visual fidelity while applying a subtle sub-pixel transform to break cross-site tracking fingerprints.'
  },
  {
    id: 'limitations',
    category: 'ai',
    q: 'What can a metadata cleaner not remove?',
    a: "A metadata cleaner removes data stored in the file's container headers and resets the perceptual hash fingerprint. It cannot remove watermarks encoded in the pixels themselves — for example invisible pixel-pattern watermarks such as Google's SynthID or visual AI classifier models. Those are not metadata, so no metadata stripper removes them."
  }
];

export const FAQSection: React.FC = () => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'what-is': true });
  const [activeCategory, setActiveCategory] = useState<'all' | 'ai' | 'privacy' | 'quality'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = FAQS_DATA.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      faq.q.toLowerCase().includes(query) ||
      faq.a.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="faq" className="content-section" style={{ scrollMarginTop: '80px' }}>
      <div className="section-header">
        <span className="section-label">Answers to Common Questions</span>
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-desc">
          Everything you need to know about metadata removal, C2PA content credentials, quality preservation, and anti-tracking defense.
        </p>

        {/* Search Bar */}
        <div className="faq-search-wrapper">
          <Search size={16} className="faq-search-icon" />
          <input
            type="text"
            className="faq-search-input"
            placeholder="Search questions or keywords (e.g. Pinterest, DALL-E, quality, GPS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search frequently asked questions"
          />
          {searchQuery && (
            <button
              type="button"
              className="faq-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="features-filter-nav" role="tablist" aria-label="FAQ categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            className={`feature-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Questions ({FAQS_DATA.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'ai'}
            className={`feature-tab-btn ${activeCategory === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ai')}
          >
            AI &amp; C2PA (3)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'privacy'}
            className={`feature-tab-btn ${activeCategory === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveCategory('privacy')}
          >
            Privacy &amp; EXIF (3)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'quality'}
            className={`feature-tab-btn ${activeCategory === 'quality' ? 'active' : ''}`}
            onClick={() => setActiveCategory('quality')}
          >
            Quality &amp; Batch (2)
          </button>
        </div>
      </div>

      <div className="faq-list" role="region" aria-label="Questions list">
        {filteredFaqs.map((faq) => {
          const isOpen = !!openIds[faq.id];
          return (
            <div key={faq.id} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="faq-question-btn"
                onClick={() => toggle(faq.id)}
                aria-expanded={isOpen}
              >
                <span className="faq-question-text">{faq.q}</span>
                <span className={`faq-chevron ${isOpen ? 'rotate' : ''}`}>
                  <ChevronDown size={18} />
                </span>
              </button>

              {isOpen && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <div className="faq-empty-state">
            <HelpCircle size={32} color="var(--ink-3)" />
            <p>No questions matched "{searchQuery}". Try a different keyword like "EXIF", "C2PA", or "quality".</p>
          </div>
        )}
      </div>

      {/* Helper Footer */}
      <div className="faq-footer-callout">
        <HelpCircle size={18} color="var(--accent)" />
        <p>
          Have a question not covered here? Check out the{' '}
          <a
            href="https://github.com/Sjking2025/ai-metadata-cleaner"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
          >
            GitHub documentation
          </a>{' '}
          or inspect your images directly above.
        </p>
      </div>
    </section>
  );
};
