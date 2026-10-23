// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildTasteProfile } from '../lib';
import { MatchBadge } from './match-badge';
import { MatchSummary } from './match-summary';
import { YourTaste } from './your-taste';

const great = {
  score: 86,
  band: 'great' as const,
  because: [
    { name: 'Sayaka', stars: 5 },
    { name: 'Unkaku', stars: 4 },
  ],
};

describe('MatchSummary', () => {
  it('shows the score, its band and the ratings behind it', () => {
    render(<MatchSummary match={great} hasRatings />);
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText(/Great match/)).toBeInTheDocument();
    expect(screen.getByText('Because you rated Sayaka 5★ and Unkaku 4★.')).toBeInTheDocument();
  });

  it('invites a first rating, or says there is nothing comparable yet', () => {
    const { rerender } = render(<MatchSummary match={null} hasRatings={false} />);
    expect(screen.getByText(/Rate a few teas/)).toBeInTheDocument();
    rerender(<MatchSummary match={null} hasRatings />);
    expect(screen.getByText(/Not enough like it in your ratings/)).toBeInTheDocument();
  });
});

describe('MatchBadge', () => {
  it('reads the band in words, and renders nothing without a match', () => {
    const { container, rerender } = render(<MatchBadge match={great} />);
    expect(container).toHaveTextContent('86% match for you: great match');
    rerender(<MatchBadge match={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('YourTaste', () => {
  it('summarises notes, preparation, teas per category and loved versus disliked taste', () => {
    const profile = buildTasteProfile([
      {
        product: { id: 'a', category: 'matcha' },
        stars: 5,
        flavorNotes: ['umami', 'creamy'],
        profile: { umami: 5 },
        prep: { method: 'usucha' },
      },
      {
        product: { id: 'b', category: 'hojicha' },
        stars: 1,
        flavorNotes: [],
        profile: { umami: 2 },
        prep: { method: null },
      },
    ]);
    render(<YourTaste profile={profile} />);

    expect(screen.getByRole('heading', { name: 'Your taste' })).toBeInTheDocument();
    expect(screen.getByText(/Early read from 2 teas/)).toBeInTheDocument();
    expect(screen.getByText('Umami, Creamy')).toBeInTheDocument();
    expect(screen.getByText('Usucha')).toBeInTheDocument();
    expect(screen.getByText('1 tea, 5.0 out of 5 on average')).toBeInTheDocument();
    const row = screen.getByRole('row', { name: /Umami/ });
    expect(row).toHaveTextContent('Umami5.02.0');
  });
});
