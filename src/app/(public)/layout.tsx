import type { ReactNode } from 'react';

import { MobileTabBar, Navbar, SiteFooter } from '@/components/layout';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    // Bottom padding below sm keeps the footer clear of the fixed tab bar.
    <div className="flex min-h-screen flex-col pb-16 sm:pb-0">
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
