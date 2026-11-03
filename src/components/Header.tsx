import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="#" className="logo-link">
          <span className="logo-badge">PROVENANCE CLEANER</span>
          <span className="logo-title">AI Metadata Cleaner</span>
        </a>

        <nav className="header-nav">
          <a href="#features" className="nav-item">Features</a>
          <a href="#how-it-works" className="nav-item">How It Works</a>
          <a href="#comparison" className="nav-item">Comparison</a>
          <a href="#faq" className="nav-item">FAQ</a>
          
          <div className="privacy-pill">
            <ShieldCheck size={14} />
            <span>100% Client-Side</span>
          </div>
        </nav>
      </div>
    </header>
  );
};
