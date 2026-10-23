import Link from 'next/link';
import { connection } from 'next/server';

import { discoverHref } from '@/features/products';
import {
  Sparkline,
  formatChange,
  getSupplyOverview,
  percentChange,
  type PrefectureSupply,
  type YearValue,
} from '@/features/supply';
import { createClient } from '@/integrations/supabase/server';
import { PAGE_ROUTES } from '@/lib/constants/routes';

const number = (value: number) => value.toLocaleString('en-US');

function Change({ points }: { points: YearValue[] }) {
  const change = percentChange(points);
  if (change === null) return null;
  return (
    <span className="text-muted-foreground">
      {formatChange(change)} since {points[0].year}
    </span>
  );
}

function Trend({ title, points, unit }: { title: string; points: YearValue[]; unit: string }) {
  const last = points.at(-1);
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="text-sm">
        <div className="text-muted-foreground">{title}</div>
        {last ? (
          <div>
            <span className="text-base font-semibold">
              {number(last.value)} {unit}
            </span>{' '}
            <span className="text-muted-foreground">in {last.year}</span>
          </div>
        ) : (
          <div className="text-muted-foreground">Not surveyed</div>
        )}
        <Change points={points} />
      </div>
      <Sparkline points={points} label={title} unit={unit} className="text-foreground/70" />
    </div>
  );
}

function PrefectureCard({ supply }: { supply: PrefectureSupply }) {
  return (
    <article className="bg-muted flex h-full flex-col gap-4 rounded-2xl px-5 py-4">
      <header>
        <h2 className="text-lg font-bold tracking-tight">{supply.prefecture}</h2>
        {supply.regions.length > 0 && (
          <p className="text-sm">
            {supply.regions.map((region, i) => (
              <span key={region.id}>
                {i > 0 && ', '}
                <Link
                  href={discoverHref({ sort: 'top' }, { regionId: region.id })}
                  className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  {region.name}
                </Link>
              </span>
            ))}
          </p>
        )}
      </header>
      <div className="text-sm">
        <div className="text-muted-foreground">Tencha, the leaf matcha is ground from</div>
        {supply.tencha ? (
          <div>
            <span className="text-matcha text-base font-semibold">
              {number(supply.tencha.tonnes)} t
            </span>{' '}
            <span className="text-muted-foreground">
              in {supply.tencha.year}, {Math.round(supply.tencha.share * 100)}% of its tea
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground">Not reported</div>
        )}
      </div>
      <Trend title="Tea fields" points={supply.fields} unit="ha" />
      <Trend title="Raw tea made" points={supply.rawTea} unit="t" />
    </article>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-muted rounded-2xl px-5 py-4">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-muted-foreground mt-1 text-sm">{note}</div>
    </div>
  );
}

function NationalTiles({ national }: { national: PrefectureSupply }) {
  const fields = national.fields.at(-1);
  const rawTea = national.rawTea.at(-1);
  const fieldsChange = percentChange(national.fields);
  const rawTeaChange = percentChange(national.rawTea);
  const since = (change: number | null, year?: number) =>
    change === null || year === undefined ? '' : `${formatChange(change)} since ${year}`;
  return (
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {fields && (
        <Tile
          label={`Tea fields in Japan, ${fields.year}`}
          value={`${number(fields.value)} ha`}
          note={since(fieldsChange, national.fields[0]?.year)}
        />
      )}
      {rawTea && (
        <Tile
          label={`Raw tea made in Japan, ${rawTea.year}`}
          value={`${number(rawTea.value)} t`}
          note={since(rawTeaChange, national.rawTea[0]?.year)}
        />
      )}
      {national.tencha && (
        <Tile
          label={`Tencha made in Japan, ${national.tencha.year}`}
          value={`${number(national.tencha.tonnes)} t`}
          note={`${Math.round(national.tencha.share * 1000) / 10}% of all tea`}
        />
      )}
    </div>
  );
}

function FiguresTable({ prefectures }: { prefectures: PrefectureSupply[] }) {
  const years = [
    ...new Set(prefectures.flatMap((p) => [...p.fields, ...p.rawTea].map((v) => v.year))),
  ].sort((a, b) => a - b);
  const cell = (points: YearValue[], year: number) => {
    const point = points.find((v) => v.year === year);
    return point ? number(point.value) : '–';
  };
  return (
    <details className="mt-10">
      <summary className="cursor-pointer font-semibold">All figures</summary>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-right text-sm tabular-nums">
          <thead>
            <tr className="text-muted-foreground">
              <th scope="col" className="py-2 pr-4 text-left font-normal">
                Prefecture
              </th>
              <th scope="col" className="py-2 pr-4 text-left font-normal">
                Measure
              </th>
              {years.map((year) => (
                <th key={year} scope="col" className="px-2 py-2 font-normal">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prefectures.flatMap((p) =>
              [
                { label: 'Tea fields (ha)', points: p.fields },
                { label: 'Raw tea (t)', points: p.rawTea },
              ].map((row) => (
                <tr key={`${p.prefecture}-${row.label}`} className="border-t">
                  <th scope="row" className="py-2 pr-4 text-left font-semibold">
                    {p.prefecture}
                  </th>
                  <td className="py-2 pr-4 text-left">{row.label}</td>
                  {years.map((year) => (
                    <td key={year} className="px-2 py-2">
                      {cell(row.points, year)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default async function SupplyPage() {
  // Figures change only when the seed is rerun, but the page reads Supabase, so like the
  // other public pages it renders per request; see the home page for why.
  await connection();
  const { national, prefectures } = await getSupplyOverview(await createClient());

  return (
    <div className="max-w-site mx-auto w-full px-6 py-10 sm:py-14">
      <Link
        href={PAGE_ROUTES.REGIONS}
        className="text-muted-foreground hover:text-foreground text-sm"
      >
        ← Tea regions
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tea supply in numbers</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        Official harvest figures for the prefectures our regions are in. Tea fields are shrinking in
        every one of them; tencha, the leaf matcha is made from, is a small share of Japan&apos;s
        tea, and most of it comes from a few prefectures.
      </p>

      {national && <NationalTiles national={national} />}

      {prefectures.length > 0 ? (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prefectures.map((supply) => (
            <li key={supply.prefecture}>
              <PrefectureCard supply={supply} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="bg-muted text-muted-foreground mt-8 rounded-3xl py-16 text-center">
          No harvest figures loaded yet.
        </p>
      )}

      {prefectures.length > 0 && <FiguresTable prefectures={prefectures} />}

      <footer className="text-muted-foreground mt-10 max-w-2xl space-y-2 text-xs">
        <p>
          Tea fields and raw tea: 出典：農林水産省「作物統計調査」（
          <a href="https://www.e-stat.go.jp/" className="underline underline-offset-2">
            e-Stat
          </a>
          ）を加工して作成. The ministry surveys every prefecture only every few years (2020 and
          2026 most recently) and the main tea prefectures in between, so Aichi has no raw-tea
          figures after 2020 and no field figures for 2021–2025.
        </p>
        <p>
          Tencha: 全国茶生産団体連合会 (national tea growers&apos; federation) figures, as published
          by{' '}
          <a
            href="https://www.pref.aichi.jp/uploaded/attachment/622005.pdf"
            className="underline underline-offset-2"
          >
            Aichi Prefecture
          </a>
          . The ministry stopped publishing tencha by prefecture after 2008, and its totals differ
          from the federation&apos;s, so tencha shares use the federation&apos;s own totals.
        </p>
        <p>
          The scarce and tight levels on the regions page are Matchoji&apos;s reading of shortage
          reporting, not part of these statistics.
        </p>
      </footer>
    </div>
  );
}
