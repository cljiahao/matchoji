import type { ReactNode } from 'react';

import { MobileTabBar } from './mobile-tab-bar';
import { Navbar } from './navbar';
import { SiteFooter } from './site-footer';

export const MAIN_CONTENT_ID = 'main-content';

// First focusable element, so keyboard users can jump past the navbar; it only shows on focus.
function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="bg-background text-foreground focus-visible:ring-ring sr-only z-[60] rounded-md px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus-visible:ring-2"
    >
      Skip to content
    </a>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    // Bottom padding below sm keeps the footer clear of the fixed tab bar.
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <SkipLink />
      <Navbar />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
