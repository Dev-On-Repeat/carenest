import React, { useRef } from 'react';
import { Camera, Upload, X, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface ImageCaptureProps {
  file: File | null;
  previewUrl: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  onProcess: () => void;
  processing: boolean;
  processLabel: string;
  hint: string;
  altText: string;
}

/** Shared capture step for both camera pipelines (prescription + pill). */
export const ImageCapture: React.FC<ImageCaptureProps> = ({
  file,
  previewUrl,
  onSelect,
  onClear,
  onProcess,
  processing,
  processLabel,
  hint,
  altText,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) onSelect(picked);
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="sr-only"
        id="cn-capture-input"
      />

      {!previewUrl ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const dropped = e.dataTransfer.files?.[0];
            if (dropped?.type.startsWith('image/')) onSelect(dropped);
          }}
          className="rounded-panel border border-dashed border-line bg-paper px-6 py-12 text-center transition-colors hover:border-teal/50 hover:bg-teal-tint"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-line bg-paper-cool text-teal">
            <Camera className="h-6 w-6" />
          </span>
          <p className="mt-4 font-display text-section font-medium text-ink">Photograph your prescription</p>
          <p className="mx-auto mt-1.5 max-w-md text-body text-ink-mute">{hint}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {`Choose a photo`}
            </Button>
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              <Camera className="h-4 w-4" />
              Use camera
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <figure className="relative overflow-hidden rounded-panel border border-line bg-ink-deep">
            <img src={previewUrl} alt={altText} className="mx-auto max-h-[380px] w-auto object-contain" />
            <button
              onClick={onClear}
              aria-label="Remove photo"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-paper-cool/90 text-ink shadow-panel transition-colors hover:bg-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </figure>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="truncate text-micro text-ink-mute">{file?.name}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                Replace photo
              </Button>
              <Button onClick={onProcess} disabled={processing} className={cn(processing && 'opacity-80')}>
                {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {processing ? 'Working…' : processLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
