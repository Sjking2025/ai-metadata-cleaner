export interface DetectedMetadata {
  hasAny: boolean;
  c2pa: boolean;
  c2paIssuer?: string;
  c2paDetails?: {
    claimGenerator?: string;
    title?: string;
    format?: string;
    assertions?: string[];
  };
  exif: boolean;
  exifDetails?: {
    make?: string;
    model?: string;
    lens?: string;
    software?: string;
    dateTime?: string;
    fNumber?: number;
    iso?: number;
    exposureTime?: number | string;
    allTags?: Record<string, any>;
  };
  gps: boolean;
  gpsDetails?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  iptc: boolean;
  iptcDetails?: Record<string, any>;
  xmp: boolean;
  xmpDetails?: Record<string, any>;
  pngTextChunks: boolean;
  pngPrompts?: {
    parameters?: string;
    prompt?: string;
    negativePrompt?: string;
    workflow?: string;
    metadata?: Record<string, string>;
  };
  software?: string;
  digitalSourceType?: string;
}

export interface VerificationResult {
  clean: boolean;
  leakedTags?: string[];
  originalSize: number;
  cleanedSize: number;
  sizeReductionPercent: number;
  originalHash: string;
  cleanedHash: string;
  hashChanged: boolean;
  pixelsModified: number;
  pHashDefenseApplied: boolean;
  losslessStrip: boolean;
  format: string;
}

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';
export type CleaningMode = 'fingerprint' | 'lossless';

export interface CleanOptions {
  mode: CleaningMode;
  outputFormat: OutputFormat;
  quality: number; // 0.70 to 1.00
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  status: 'idle' | 'scanning' | 'scanned' | 'cleaning' | 'completed' | 'error';
  progress: number;
  detected?: DetectedMetadata;
  cleanedBlob?: Blob;
  cleanedUrl?: string;
  cleanedSize?: number;
  verification?: VerificationResult;
  error?: string;
}
