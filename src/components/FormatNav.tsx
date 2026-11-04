import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Image, FileText, Video, Camera, Sparkles } from 'lucide-react';

export const FORMAT_TOOLS = [
  {
    path: '/',
    label: 'Image & AI Cleaner',
    shortLabel: 'Images',
    icon: Image,
    badge: 'C2PA + EXIF',
    desc: 'JPEG, PNG, WebP, AVIF'
  },
  {
    path: '/remove-metadata-from-pdf',
    label: 'PDF Metadata Remover',
    shortLabel: 'PDF Documents',
    icon: FileText,
    badge: 'XMP + Author',
    desc: 'PDF Documents'
  },
  {
    path: '/remove-metadata-from-video',
    label: 'Video Metadata Remover',
    shortLabel: 'Videos',
    icon: Video,
    badge: 'Lossless MP4/MOV',
    desc: 'MP4, MOV, M4V'
  },
  {
    path: '/remove-metadata-from-raw',
    label: 'Camera RAW Remover',
    shortLabel: 'Camera RAW',
    icon: Camera,
    badge: 'Serials + GPS',
    desc: 'CR2, NEF, ARW, DNG'
  }
];

export const FormatNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="format-tools-nav" aria-label="Format Tools Selector">
      <div className="format-tools-inner">
        <span className="format-nav-label">
          <Sparkles size={13} color="var(--terracotta)" />
          <span>Format Tools:</span>
        </span>
        <div className="format-pills-row">
          {FORMAT_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = location.pathname === tool.path;
            return (
              <Link
                key={tool.path}
                to={tool.path}
                className={`format-tool-pill ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={15} />
                <span className="format-pill-title">{tool.shortLabel}</span>
                <span className="format-pill-badge">{tool.badge}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
