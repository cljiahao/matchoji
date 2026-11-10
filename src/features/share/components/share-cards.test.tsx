import { ImageResponse } from 'next/og';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { loadFonts } from '../lib/fonts';
import { OG_SIZE } from '../lib/palette';
import { LogoMark } from './logo-mark';
import { ProfileCard, SiteCard, TeaCard, YearCard, type TeaCardData } from './share-cards';

// 1×1 transparent PNG, standing in for a fetched tea photo.
const PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const base: TeaCardData = {
  id: 'a',
  name: 'Samidori',
  brand: 'Ippodo',
  category: 'matcha',
  avgStars: 4.26,
  reviewCount: 12,
  photo: null,
};

async function png(card: React.ReactElement) {
  const res = new ImageResponse(card, { ...OG_SIZE, fonts: await loadFonts() });
  expect(res.headers.get('content-type')).toBe('image/png');
  const bytes = new Uint8Array(await res.arrayBuffer());
  expect([...bytes.slice(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
}

describe('share cards', () => {
  it('draws the site card', async () => {
    await png(<SiteCard />);
  });

  it('draws a rated tea on its tin', async () => {
    await png(<TeaCard tea={base} />);
  });

  it('draws a single rating and a long name', async () => {
    await png(
      <TeaCard
        tea={{
          ...base,
          name: 'Kyoto Roasted Hojicha Tea Leaves Premium Reserve Harvest',
          category: 'hojicha',
          reviewCount: 1,
        }}
      />
    );
  });

  it('draws an unrated tea with no maker', async () => {
    await png(<TeaCard tea={{ ...base, brand: null, avgStars: null, reviewCount: 0 }} />);
  });

  it('draws a tea with its photo', async () => {
    await png(<TeaCard tea={{ ...base, photo: PHOTO }} />);
  });

  it('draws a profile with one and many teas', async () => {
    await png(<ProfileCard name="Mei" teas={1} />);
    await png(<ProfileCard name="A taster with a rather long display name" teas={30} />);
  });

  it('draws a trusted taster with a long bio and a handle', async () => {
    await png(
      <ProfileCard name="Foodcnl" teas={0} taster={{ bio: 'x'.repeat(300), handle: 'foodcnl' }} />
    );
    await png(<ProfileCard name="Foodcnl" teas={0} taster={{ bio: null, handle: null }} />);
  });

  it('draws the logo mark without its tile', async () => {
    await png(
      <div style={{ display: 'flex', width: 1200, height: 630 }}>
        <LogoMark size={64} tile={false} />
      </div>
    );
  });
});

describe('YearCard', () => {
  const data = {
    taster: 'Mei',
    year: 2026,
    tastings: 12,
    teas: 9,
    split: { matcha: 7, hojicha: 2 },
    topRated: { tea: 'Samidori', stars: 5 },
    busiestMonth: 'March',
  };

  it('draws a PNG', async () => {
    await png(<YearCard data={data} />);
  });

  it('shows counts and a tea name and carries no note text', () => {
    // Even if a caller smuggles an extra field in, the card reads only its own fields.
    const smuggled = { ...data, notes: 'a private thought' } as typeof data;
    const html = renderToStaticMarkup(<YearCard data={smuggled} />);
    expect(html).toContain('Mei');
    expect(html).toContain('Samidori');
    expect(html).toContain('12 tastings');
    expect(html).not.toContain('private thought');
  });
});
