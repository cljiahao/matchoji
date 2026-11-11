// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ScorePair as Scores } from '../types';
import { ScorePair } from './score-pair';

const scores = (over: Partial<Scores> = {}): Scores => ({
  tasterAvg: 4.5,
  tasterCount: 2,
  tasterDisclosedCount: 0,
  communityAvg: 3.8,
  communityCount: 5,
  ...over,
});

describe('ScorePair', () => {
  it('shows the taster block before the community block, never blended', () => {
    render(<ScorePair scores={scores()} />);
    const text = document.body.textContent ?? '';
    expect(text.indexOf('Taster score')).toBeGreaterThanOrEqual(0);
    expect(text.indexOf('Taster score')).toBeLessThan(text.indexOf('Community score'));
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('3.8')).toBeTruthy();
  });

  it('shows disclosed line only when > 0', () => {
    const { rerender } = render(<ScorePair scores={scores()} />);
    expect(screen.queryByText(/paid\/gifted/)).toBeNull();
    rerender(<ScorePair scores={scores({ tasterDisclosedCount: 1 })} />);
    expect(screen.getByText('1 paid/gifted')).toBeTruthy();
    rerender(<ScorePair scores={scores({ tasterDisclosedCount: 2 })} />);
    expect(screen.getByText('2 paid/gifted')).toBeTruthy();
  });

  it('hides an empty side', () => {
    const { rerender } = render(<ScorePair scores={scores({ tasterAvg: null, tasterCount: 0 })} />);
    expect(screen.queryByText('Taster score')).toBeNull();
    expect(screen.getByText('Community score')).toBeTruthy();
    rerender(<ScorePair scores={scores({ communityAvg: null, communityCount: 0 })} />);
    expect(screen.queryByText('Community score')).toBeNull();
    expect(screen.getByText('Taster score')).toBeTruthy();
  });

  it('says so once when nobody has rated it', () => {
    render(
      <ScorePair
        scores={scores({ tasterAvg: null, tasterCount: 0, communityAvg: null, communityCount: 0 })}
      />
    );
    expect(screen.getByText('Not yet rated')).toBeTruthy();
  });

  it('has a compact form for lists', () => {
    render(<ScorePair scores={scores({ tasterDisclosedCount: 1 })} compact />);
    expect(screen.getByText(/Taster/)).toBeTruthy();
    expect(screen.getByText('1 paid/gifted')).toBeTruthy();
  });

  it('counts reviews, never people, under both scores', () => {
    render(<ScorePair scores={scores({ tasterCount: 1, communityCount: 3 })} />);
    expect(screen.getByText('1 review')).toBeTruthy();
    expect(screen.getByText('3 reviews')).toBeTruthy();
  });
});
