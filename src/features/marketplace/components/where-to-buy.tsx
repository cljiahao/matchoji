import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { PAGE_ROUTES } from '@/lib/constants/routes';

import { countryName, formatPrice, shipsToLabel } from '../lib';
import type { ProductOffer } from '../types';

const LOW_STOCK = 5;

function stockLabel(stock: number): string {
  if (stock === 0) return 'Out of stock';
  return stock <= LOW_STOCK ? `${stock} left` : 'In stock';
}

// Buying happens on the vendor's own site until Matchoji has checkout, so each offer is a
// link out rather than an add-to-cart.
export function WhereToBuy({ offers }: { offers: ProductOffer[] }) {
  return (
    <section aria-labelledby="buy-heading">
      <h2 id="buy-heading" className="text-2xl font-bold tracking-tight">
        Where to buy
      </h2>
      {offers.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">
          No sellers list this tea yet.{' '}
          <Link href={PAGE_ROUTES.SELL} className="text-foreground underline underline-offset-2">
            Sell it on Matchoji
          </Link>
        </p>
      ) : (
        <ul className="mt-4 divide-y rounded-2xl border">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="font-semibold">{offer.vendor.name}</p>
                <p className="text-muted-foreground text-sm">
                  Ships from {countryName(offer.vendor.country)} to{' '}
                  {shipsToLabel(offer.vendor.shipsTo)}
                </p>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    {formatPrice(offer.price, offer.currency)}
                  </p>
                  <p className="text-muted-foreground text-sm">{stockLabel(offer.stock)}</p>
                </div>
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                >
                  Buy from {offer.vendor.name}
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
