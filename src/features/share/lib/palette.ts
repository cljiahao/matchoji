// DESIGN.md colour tokens as hex: next/og renders with no CSS variables, so the share images
// carry their own copy. Keep in step with the colors block in DESIGN.md.
export const OG = {
  matchaGreen: '#2f5233',
  matchaJade: '#5c7a4f',
  hojichaAmber: '#8f6224',
  onGreen: '#ffffff',
  ink: '#101010',
  pageWhite: '#ffffff',
  shelfTile: '#f4f3f0',
  mutedInk: '#6b6862',
  hairline: '#e6e4df',
  emptyStar: '#d4d4d4',
  logoGround: '#f5f1e6',
} as const;

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

export const SITE_TAGLINE = 'Rate and discover hojicha and matcha, one cup at a time.';
