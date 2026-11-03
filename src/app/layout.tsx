import type { ReactNode } from 'react';

import { Providers, ThemeProvider } from '@/components/layout';
import { SITE_URL } from '@/lib/constants/env';
import type { Metadata, Viewport } from 'next';
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
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/icons/apple-icon.png', sizes: '180x180', type: 'image/png' },
  },
  appleWebApp: { capable: true, title: 'Matchoji', statusBarStyle: 'default' },
};

// The browser bar follows the page: white in light, the dark page colour in dark.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101010' },
  ],
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
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
