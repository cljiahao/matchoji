'use client';

import { Camera, Loader2 } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { useLabelScanEnabled, useScanLabel } from '../hooks/use-label-scan';
import { LabelScanError, SCAN_ERROR_MESSAGES } from '../lib/scan-label';
import type { ScanResponse } from '../schemas';

interface ScanLabelButtonProps {
  onScanned: (result: ScanResponse) => void;
}

// Renders nothing until the server reports label scanning is switched on.
export function ScanLabelButton({ onScanned }: ScanLabelButtonProps) {
  const enabled = useLabelScanEnabled();
  const scan = useScanLabel();
  const inputRef = useRef<HTMLInputElement>(null);

  if (!enabled) return null;

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so photographing the same label again still fires change.
    event.target.value = '';
    if (!file) return;
    try {
      onScanned(await scan.mutateAsync(file));
    } catch (error) {
      toast.error(SCAN_ERROR_MESSAGES[error instanceof LabelScanError ? error.failure : 'failed']);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="label-scan-input"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full"
        disabled={scan.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {scan.isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Camera aria-hidden="true" />
        )}
        {scan.isPending ? 'Reading label…' : 'Scan label'}
      </Button>
    </div>
  );
}
