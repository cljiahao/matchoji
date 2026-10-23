import type { ReactNode } from 'react';

import { Providers, ThemeProvider } from '@/components/layout';
import { SITE_URL } from '@/lib/constants/env';
import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';

const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Matchoji', template: '%s · Matchoji' },
  description: 'Rate and discover hojicha and matcha, one cup at a time.',
  openGraph: { siteName: 'Matchoji', type: 'website' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className="no-scrollbar">
      <body className={`${figtree.variable} relative antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
