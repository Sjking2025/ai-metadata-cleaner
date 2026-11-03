import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

const NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'faq', label: 'FAQ' }
];

export const Header: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('');

  // Scroll-spy to highlight active section in navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(link.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="#" className="logo-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="logo-badge">PROVENANCE CLEANER</span>
          <span className="logo-title">AI Metadata Cleaner</span>
        </a>

        <nav className="header-nav" aria-label="Main Navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`nav-item ${activeSection === link.id ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, link.id)}
            >
              <span>{link.label}</span>
              {activeSection === link.id && <span className="nav-active-dot" />}
            </a>
          ))}

          <div className="privacy-pill" title="All processing happens 100% locally in your browser memory">
            <ShieldCheck size={14} />
            <span>100% Client-Side</span>
          </div>
        </nav>
      </div>
    </header>
  );
};
