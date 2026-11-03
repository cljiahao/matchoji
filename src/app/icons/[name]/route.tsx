import { ImageResponse } from 'next/og';

import { LogoMark, OG } from '@/features/share';

// Every app icon is drawn from the logo at build time (no sharp, no committed binaries). The
// maskable variant fills the square and shrinks the mark into the centre 60%, inside the safe
// zone launchers crop to.
const ICONS = {
  'icon-32.png': { size: 32, mark: 28, tile: true },
  'icon-192.png': { size: 192, mark: 192, tile: true },
  'icon-512.png': { size: 512, mark: 512, tile: true },
  'icon-maskable-512.png': { size: 512, mark: 307, tile: false },
  'apple-icon.png': { size: 180, mark: 180, tile: false },
} as const;

type IconName = keyof typeof ICONS;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const icon = ICONS[name as IconName];
  if (!icon) return new Response('Not found', { status: 404 });
  return new ImageResponse(
    <div
      style={{
        width: icon.size,
        height: icon.size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: icon.tile ? 'transparent' : OG.logoGround,
      }}
    >
      <LogoMark size={icon.mark} tile={icon.tile} />
    </div>,
    { width: icon.size, height: icon.size }
  );
}
