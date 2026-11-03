import { OG } from '../lib/palette';

// public/image_assets/logo.svg redrawn for satori; the rounded tile is optional because the
// maskable app icon fills the whole square instead.
export function LogoMark({ size, tile = true }: { size: number; tile?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      {tile && <rect width="64" height="64" rx="16" fill={OG.logoGround} />}
      <path d="M32 12c9 6 14 13 14 21a14 14 0 0 1-28 0c0-8 5-15 14-21Z" fill={OG.matchaJade} />
      <path d="M32 30c6 4 9 8 9 13a9 9 0 0 1-18 0c0-5 3-9 9-13Z" fill={OG.hojichaAmber} />
    </svg>
  );
}
