import React from 'react';

interface ProgressBarProps {
  progress: number;
  currentStep: string;
  totalImages: number;
  processedCount: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  currentStep,
  totalImages,
  processedCount
}) => {
  return (
    <div className="progress-container">
      <div className="progress-header">
        <span style={{ color: 'var(--ink)' }}>{currentStep}</span>
        <span style={{ color: 'var(--ink-3)' }}>
          {processedCount} of {totalImages} ({Math.round(progress)}%)
        </span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>
    </div>
  );
};
