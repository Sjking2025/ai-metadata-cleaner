import React from 'react';
import { Palette, Share2, ShoppingBag, BookOpen, Briefcase, Lock } from 'lucide-react';

const AUDIENCES = [
  {
    icon: Palette,
    title: 'Digital Artists & AI Creators',
    desc: 'Remove AI model signatures from DALL-E, Midjourney, and Stable Diffusion creations before showcasing your portfolio online.'
  },
  {
    icon: Share2,
    title: 'Social Media Managers',
    desc: 'Strip C2PA provenance manifests and metadata before posting to Pinterest, Instagram, Facebook, and TikTok to maintain control over labeling.'
  },
  {
    icon: ShoppingBag,
    title: 'Print-on-Demand Sellers',
    desc: 'Clean metadata and tracking hashes from AI-assisted artwork before uploading to Etsy, Amazon Merch, or Shopify.'
  },
  {
    icon: BookOpen,
    title: 'Bloggers & Content Marketers',
    desc: 'Incorporate AI visuals seamlessly in articles, newsletters, and guides without technical metadata revealing backend tooling.'
  },
  {
    icon: Briefcase,
    title: 'Businesses & Design Agencies',
    desc: 'Ensure client brand assets, mockups, and presentations appear completely professional, sanitized, and free of extraneous tags.'
  },
  {
    icon: Lock,
    title: 'Privacy-Conscious Users',
    desc: 'Eradicate GPS coordinates, camera serial numbers, and device details from your personal photos before sharing them on the open web.'
  }
];

export const AudienceSection: React.FC = () => {
  return (
    <section className="content-section">
      <div className="section-header">
        <span className="section-label">Built for Every Workflow</span>
        <h2 className="section-title">Perfect for Content Creators &amp; Businesses</h2>
        <p className="section-desc">
          Whether you are publishing original art, managing campaigns, or safeguarding family photos, we have you covered.
        </p>
      </div>

      <div className="features-grid">
        {AUDIENCES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="feature-card">
              <div className="feature-icon-box" style={{ color: 'var(--ok)' }}>
                <Icon size={22} strokeWidth={1.5} />
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
