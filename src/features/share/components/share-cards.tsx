import type { YearCardData } from '@/features/journal';
import type { ProductCategory } from '@/features/products';

import { OG, OG_SIZE, SITE_TAGLINE } from '../lib/palette';
import { LogoMark } from './logo-mark';
import { ShareTin } from './share-tin';

const CATEGORY = {
  matcha: { label: 'Matcha', colour: OG.matchaJade },
  hojicha: { label: 'Hojicha', colour: OG.hojichaAmber },
} as const;

const STAR_POINTS = '12,2 15,9 22.5,9.5 16.7,14.3 18.6,21.7 12,17.7 5.4,21.7 7.3,14.3 1.5,9.5 9,9';

function Star({ fill, colour, size }: { fill: number; colour: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: 4 }}>
      <defs>
        <linearGradient id={`s${Math.round(fill * 100)}`}>
          <stop offset={`${fill * 100}%`} stopColor={colour} />
          <stop offset={`${fill * 100}%`} stopColor={OG.emptyStar} />
        </linearGradient>
      </defs>
      <polygon points={STAR_POINTS} fill={`url(#s${Math.round(fill * 100)})`} />
    </svg>
  );
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <LogoMark size={48} />
      <div
        style={{
          display: 'flex',
          marginLeft: 16,
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: OG.ink,
        }}
      >
        Matchoji
      </div>
    </div>
  );
}

export function SiteCard() {
  return (
    <div
      style={{
        ...OG_SIZE,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 96px',
        background: OG.matchaGreen,
        color: OG.onGreen,
        fontFamily: 'Figtree',
      }}
    >
      <div style={{ display: 'flex' }}>
        <LogoMark size={168} />
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 40,
          fontSize: 128,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          lineHeight: 1,
        }}
      >
        Matchoji
      </div>
      <div style={{ display: 'flex', marginTop: 24, fontSize: 44, fontWeight: 400, maxWidth: 900 }}>
        {SITE_TAGLINE}
      </div>
    </div>
  );
}

// Long names shrink instead of overflowing; satori has no text-fit.
function nameSize(name: string): number {
  if (name.length <= 18) return 84;
  if (name.length <= 32) return 64;
  return 48;
}

export interface TeaCardData {
  id: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
  avgStars: number | null;
  reviewCount: number;
  photo: string | null;
}

export function TeaCard({ tea }: { tea: TeaCardData }) {
  const category = CATEGORY[tea.category];
  const rated = tea.avgStars !== null;
  return (
    <div
      style={{
        ...OG_SIZE,
        display: 'flex',
        background: OG.pageWhite,
        fontFamily: 'Figtree',
        color: OG.ink,
      }}
    >
      <div
        style={{
          width: 480,
          height: OG_SIZE.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: OG.shelfTile,
        }}
      >
        {tea.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tea.photo}
            alt=""
            width={480}
            height={OG_SIZE.height}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <ShareTin category={tea.category} seed={tea.id} width={320} />
        )}
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            <div
              style={{
                display: 'flex',
                padding: '6px 22px',
                borderRadius: 9999,
                background: category.colour,
                color: OG.pageWhite,
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {category.label}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: nameSize(tea.name),
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
            }}
          >
            {tea.name}
          </div>
          {tea.brand && (
            <div style={{ display: 'flex', marginTop: 16, fontSize: 40, color: OG.mutedInk }}>
              {tea.brand}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            {rated ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    fontSize: 88,
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                    lineHeight: 1,
                    marginRight: 24,
                  }}
                >
                  {tea.avgStars?.toFixed(1)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex' }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        size={36}
                        colour={category.colour}
                        fill={Math.max(0, Math.min(1, (tea.avgStars ?? 0) - i))}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', marginTop: 8, fontSize: 28, color: OG.mutedInk }}>
                    {tea.reviewCount} {tea.reviewCount === 1 ? 'rating' : 'ratings'}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, color: OG.mutedInk }}>
                Not yet rated
              </div>
            )}
          </div>
          <Wordmark />
        </div>
      </div>
    </div>
  );
}

export function ProfileCard({ name, teas }: { name: string; teas: number }) {
  return (
    <div
      style={{
        ...OG_SIZE,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 96px',
        background: OG.shelfTile,
        fontFamily: 'Figtree',
        color: OG.ink,
      }}
    >
      <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: OG.matchaGreen }}>
        Taster on Matchoji
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: nameSize(name) + 24,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
          }}
        >
          {name}
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 52, color: OG.mutedInk }}>
          {teas} {teas === 1 ? 'tea' : 'teas'} rated
        </div>
      </div>
      <Wordmark />
    </div>
  );
}

// Counts and tea names only: YearCardData has no field a private note could travel in.
export function YearCard({ data }: { data: YearCardData }) {
  const { tastings, teas, split } = data;
  return (
    <div
      style={{
        ...OG_SIZE,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 96px',
        background: OG.matchaGreen,
        fontFamily: 'Figtree',
        color: OG.onGreen,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 700 }}>
          {data.taster}&apos;s year in tea
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 8,
            fontSize: 148,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1,
          }}
        >
          {data.year}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 52, fontWeight: 800 }}>
          {tastings} {tastings === 1 ? 'tasting' : 'tastings'} · {teas}{' '}
          {teas === 1 ? 'tea' : 'teas'}
        </div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 36 }}>
          Matcha {split.matcha} · Hojicha {split.hojicha} · Busiest in {data.busiestMonth}
        </div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 36 }}>
          Top rated: {data.topRated.tea} ({data.topRated.stars}★)
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <LogoMark size={48} />
        <div style={{ display: 'flex', marginLeft: 16, fontSize: 36, fontWeight: 800 }}>
          Matchoji
        </div>
      </div>
    </div>
  );
}

interface ScoreLine {
  value: number;
  label: string;
}

// The taster score leads; a community score is shown only when there is no taster score, and
// labelled as the community's. The two are never combined.
function scoreLine(s: {
  tasterAvg: number | null;
  tasterCount: number;
  communityAvg: number | null;
  communityCount: number;
}): ScoreLine | null {
  if (s.tasterAvg !== null && s.tasterCount > 0) {
    return {
      value: s.tasterAvg,
      label: `Taster score · ${s.tasterCount} ${s.tasterCount === 1 ? 'review' : 'reviews'}`,
    };
  }
  if (s.communityAvg !== null && s.communityCount > 0) {
    return {
      value: s.communityAvg,
      label: `Community score · ${s.communityCount} ${s.communityCount === 1 ? 'review' : 'reviews'}`,
    };
  }
  return null;
}

function ScoreBlock({ line, colour }: { line: ScoreLine | null; colour: string }) {
  if (!line) {
    return (
      <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, color: OG.mutedInk }}>
        Not yet rated
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          marginRight: 24,
        }}
      >
        {line.value.toFixed(1)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={36}
              colour={colour}
              fill={Math.max(0, Math.min(1, line.value - i))}
            />
          ))}
        </div>
        <div style={{ display: 'flex', marginTop: 8, fontSize: 28, color: OG.mutedInk }}>
          {line.label}
        </div>
      </div>
    </div>
  );
}

export interface CafeCardData {
  name: string;
  area: string | null;
  cityName: string;
  drinkCount: number;
  tasterAvg: number | null;
  tasterCount: number;
}

export function CafeCard({ cafe }: { cafe: CafeCardData }) {
  return (
    <div
      style={{
        ...OG_SIZE,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 96px',
        background: OG.shelfTile,
        fontFamily: 'Figtree',
        color: OG.ink,
      }}
    >
      <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: OG.matchaGreen }}>
        Café on Matchoji
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: nameSize(cafe.name) + 24,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
          }}
        >
          {cafe.name}
        </div>
        <div style={{ display: 'flex', marginTop: 16, fontSize: 40, color: OG.mutedInk }}>
          {cafe.area ? `${cafe.area}, ${cafe.cityName}` : cafe.cityName} · {cafe.drinkCount}{' '}
          {cafe.drinkCount === 1 ? 'drink' : 'drinks'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', marginBottom: 40 }}>
          <ScoreBlock
            line={scoreLine({
              tasterAvg: cafe.tasterAvg,
              tasterCount: cafe.tasterCount,
              communityAvg: null,
              communityCount: 0,
            })}
            colour={OG.matchaJade}
          />
        </div>
        <Wordmark />
      </div>
    </div>
  );
}

export interface DrinkCardData {
  name: string;
  base: ProductCategory;
  cafeName: string;
  area: string | null;
  photo: string | null;
  tasterAvg: number | null;
  tasterCount: number;
  tasterDisclosedCount: number;
  communityAvg: number | null;
  communityCount: number;
}

export function DrinkCard({ drink }: { drink: DrinkCardData }) {
  const base = CATEGORY[drink.base];
  return (
    <div
      style={{
        ...OG_SIZE,
        display: 'flex',
        background: OG.pageWhite,
        fontFamily: 'Figtree',
        color: OG.ink,
      }}
    >
      <div
        style={{
          width: 480,
          height: OG_SIZE.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: drink.photo ? OG.shelfTile : base.colour,
        }}
      >
        {drink.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={drink.photo}
            alt=""
            width={480}
            height={OG_SIZE.height}
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            <div
              style={{
                display: 'flex',
                padding: '6px 22px',
                borderRadius: 9999,
                background: base.colour,
                color: OG.pageWhite,
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {base.label}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: nameSize(drink.name),
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
            }}
          >
            {drink.name}
          </div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: 40, color: OG.mutedInk }}>
            {drink.area ? `${drink.cafeName} · ${drink.area}` : drink.cafeName}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 40 }}>
            <ScoreBlock line={scoreLine(drink)} colour={base.colour} />
            {drink.tasterDisclosedCount > 0 && (
              <div style={{ display: 'flex', marginTop: 12, fontSize: 28, color: OG.mutedInk }}>
                {drink.tasterDisclosedCount} of {drink.tasterCount} taster{' '}
                {drink.tasterCount === 1 ? 'review was' : 'reviews were'} gifted/paid
              </div>
            )}
          </div>
          <Wordmark />
        </div>
      </div>
    </div>
  );
}
