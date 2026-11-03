import React, { useRef, useState } from 'react';
import { Upload, ShieldCheck, Image as ImageIcon } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
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
      // Reset input value so same files can be re-uploaded if desired
      e.target.value = '';
    }
  };

  return (
    <div
      className={`editorial-dropzone ${isDragOver ? 'dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
          <Upload size={28} strokeWidth={1.5} />
        </div>

        <div className="dropzone-heading">Drop images here to clean</div>

        <div className="dropzone-subtext">
          .jpg &bull; .png &bull; .webp &bull; .avif &bull; .heic &bull; batch upload supported
        </div>

        <div className="dropzone-privacy-note">
          <ShieldCheck size={14} />
          <span>No files leave your device — processed 100% locally in browser</span>
        </div>
      </div>
    </div>
  );
};
