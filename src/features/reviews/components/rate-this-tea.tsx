'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession, useSignInPrompt } from '@/features/auth';
import { CATEGORY_STYLES, type ProductSummary } from '@/features/products';
import { cn } from '@/lib/utils';

import { RateProductForm } from './rate-product-form';

interface RateThisTeaProps {
  product: ProductSummary;
  className?: string;
}

// Vivino's "Add your own rating": one tap on a star is the whole first step. Signed out,
// that tap asks for sign-in; signed in, it opens the full tasting form with the star set.
export function RateThisTea({ product, className }: RateThisTeaProps) {
  const { session, isLoading } = useSession();
  const promptSignIn = useSignInPrompt();
  const [hovered, setHovered] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  function choose(stars: number) {
    if (isLoading) return;
    if (!session) {
      promptSignIn({
        nextPath: `/products/${product.id}#rate`,
        reason: `Sign in to rate ${product.name}.`,
      });
      return;
    }
    setChosen(stars);
  }

  return (
    <>
      <div
        role="group"
        aria-label={`Rate ${product.name}`}
        className={cn('flex gap-1', className)}
        onMouseLeave={() => setHovered(0)}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
              onClick={() => choose(value)}
              onMouseEnter={() => setHovered(value)}
              onFocus={() => setHovered(value)}
              onBlur={() => setHovered(0)}
              className="rounded-full p-0.5 transition-transform hover:scale-110"
            >
              <Star
                aria-hidden="true"
                className={cn(
                  'h-8 w-8 transition-colors',
                  value <= hovered ? CATEGORY_STYLES[product.category].star : 'text-neutral-300'
                )}
              />
            </button>
          );
        })}
      </div>

      <Dialog open={chosen !== null} onOpenChange={(open) => !open && setChosen(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rate {product.name}</DialogTitle>
            <DialogDescription>
              Add notes, a taste profile or how you made it, or just save your stars.
            </DialogDescription>
          </DialogHeader>
          {chosen !== null && (
            <RateProductForm
              product={product}
              initialStars={chosen}
              onLogged={() => setChosen(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
