import React, { useRef, useState, useEffect } from 'react';
import { Upload, ShieldCheck, FolderOpen, Clipboard, Sparkles } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const SUPPORTED_FORMATS = ['JPG', 'PNG', 'WEBP', 'AVIF', 'HEIC'];

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [justPasted, setJustPasted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler to allow pasting screenshots from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.items) return;
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const ext = file.type.split('/')[1] || 'png';
            const namedFile = new File([file], `clipboard_${Date.now()}.${ext}`, {
              type: file.type
            });
            imageFiles.push(namedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        setJustPasted(true);
        setTimeout(() => setJustPasted(false), 2000);
        onFilesSelected(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name)
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      e.target.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Image drop zone and file selector"
      className={`editorial-dropzone ${isDragOver ? 'dragover' : ''} ${justPasted ? 'just-pasted' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      onClick={() => fileInputRef.current?.click()}
    >
      {/* Corner bracket ticks */}
      <div className="dropzone-corner tl" />
      <div className="dropzone-corner tr" />
      <div className="dropzone-corner bl" />
      <div className="dropzone-corner br" />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.heic,.heif"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      <div className="dropzone-content">
        <div className="dropzone-icon-circle">
          <Upload size={30} strokeWidth={1.5} />
        </div>

        <div className="dropzone-text-group">
          <h2 className="dropzone-heading">Drop images here to clean</h2>
          <p className="dropzone-subtext">
            Drag files, tap to browse, or paste directly from clipboard
          </p>
        </div>

        {/* Format Badges */}
        <div className="dropzone-formats-row">
          {SUPPORTED_FORMATS.map((fmt) => (
            <span key={fmt} className="format-badge-chip">
              .{fmt.toLowerCase()}
            </span>
          ))}
          <span className="format-badge-chip plus">+ Batch Queue</span>
        </div>

        {/* Interactive Action Bar inside Dropzone */}
        <div className="dropzone-action-bar">
          <button
            type="button"
            className="btn-browse-trigger"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <FolderOpen size={15} />
            <span>Browse Files</span>
          </button>

          <span className="dropzone-divider">or</span>

          <span className="dropzone-paste-hint">
            <Clipboard size={13} />
            <span>Paste clipboard (Ctrl + V)</span>
          </span>
        </div>

        {/* Local Processing Guarantee Pill */}
        <div className="dropzone-privacy-note">
          <ShieldCheck size={14} />
          <span>Zero Server Uploads &bull; Processed 100% locally in browser memory</span>
        </div>
      </div>
    </div>
  );
};
