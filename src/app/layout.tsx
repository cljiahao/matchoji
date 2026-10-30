import type { ReactNode } from 'react';

import { Providers, ThemeProvider } from '@/components/layout';
import { SITE_URL } from '@/lib/constants/env';
import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { headers } from 'next/headers';
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

// The CSP nonce is minted per request in proxy.ts. Reading it here makes every page render per
// request (Next can only stamp a nonce on scripts it renders per request) and lets next-themes
// tag its inline theme script, which Next does not know about.
export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className="no-scrollbar">
      <body className={`${figtree.variable} relative antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
          nonce={nonce}
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
