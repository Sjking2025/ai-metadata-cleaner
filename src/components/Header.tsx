import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';

const NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'faq', label: 'FAQ' }
];

export const Header: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll-spy to highlight active section in navbar when on home page
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

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
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(id);
      }
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="logo-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="logo-badge">PROVENANCE CLEANER</span>
          <span className="logo-title">AI Metadata Cleaner</span>
        </Link>

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
