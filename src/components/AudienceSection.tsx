import React from 'react';
import { Palette, Share2, ShoppingBag, BookOpen, Briefcase, Lock } from 'lucide-react';

interface AudienceItem {
  icon: React.ElementType;
  tag: string;
  title: string;
  desc: string;
}

const AUDIENCES: AudienceItem[] = [
  {
    icon: Palette,
    tag: 'PORTFOLIOS & GALLERIES',
    title: 'Digital Artists & AI Creators',
    desc: 'Remove AI model signatures from DALL-E, Midjourney, and Stable Diffusion creations before showcasing your portfolio online.'
  },
  {
    icon: Share2,
    tag: 'ALGORITHMIC VISIBILITY',
    title: 'Social Media Managers',
    desc: 'Strip C2PA provenance manifests and metadata before posting to Pinterest, Instagram, Facebook, and TikTok to maintain control over labeling.'
  },
  {
    icon: ShoppingBag,
    tag: 'MERCHANT SANITIZATION',
    title: 'Print-on-Demand Sellers',
    desc: 'Clean metadata and tracking hashes from AI-assisted artwork before uploading to Etsy, Amazon Merch, or Shopify.'
  },
  {
    icon: BookOpen,
    tag: 'EDITORIAL CLEANLINESS',
    title: 'Bloggers & Content Marketers',
    desc: 'Incorporate AI visuals seamlessly in articles, newsletters, and guides without technical metadata revealing backend tooling.'
  },
  {
    icon: Briefcase,
    tag: 'CLIENT DELIVERABLES',
    title: 'Businesses & Design Agencies',
    desc: 'Ensure client brand assets, mockups, and presentations appear completely professional, sanitized, and free of extraneous tags.'
  },
  {
    icon: Lock,
    tag: 'IDENTITY PROTECTION',
    title: 'Privacy-Conscious Users',
    desc: 'Eradicate GPS coordinates, camera serial numbers, and device details from your personal photos before sharing them on the open web.'
  }
];

export const AudienceSection: React.FC = () => {
  return (
    <section id="audience" className="content-section" style={{ scrollMarginTop: '80px' }}>
      <div className="section-header">
        <span className="section-label">Tailored For Real-World Workflows</span>
        <h2 className="section-title">Built For Content Creators, Agencies &amp; Individuals</h2>
        <p className="section-desc">
          Whether you are publishing original art, delivering commercial client work, or safeguarding personal privacy, our client-side cleaner provides an uncompromised workflow.
        </p>
      </div>

      <div className="features-grid">
        {AUDIENCES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="feature-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div className="feature-icon-box" style={{ color: 'var(--ok)', background: 'var(--ok-light)' }}>
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <span className="feature-badge" style={{ fontSize: '10px', color: 'var(--ink-3)', fontWeight: 600 }}>
                  {item.tag}
                </span>
              </div>
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-desc">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
