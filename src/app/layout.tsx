import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://nimra-weds-owais.vercel.app'),
  title: 'Nimra & Owais — Wedding Invitation',
  description: 'A beautiful beginning. Nimra & Owais are getting married on 23 December 2026 in Karachi.',
  applicationName: 'Nimra & Owais Wedding',
  alternates: { canonical: 'https://nimra-weds-owais.vercel.app' },
  openGraph: {
    title: 'Nimra & Owais — We’re getting married',
    description: '23 December 2026 · Karachi · Save the date.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Nimra & Owais Wedding',
    url: 'https://nimra-weds-owais.vercel.app',
    images: [
      { 
        url: 'https://nimra-weds-owais.vercel.app/opengraph-image.jpg', 
        width: 1200, 
        height: 630, 
        alt: 'Nimra & Owais — Wedding Invitation' 
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nimra & Owais — We’re getting married',
    description: '23 December 2026 · Karachi',
    images: ['https://nimra-weds-owais.vercel.app/opengraph-image.jpg'],
  },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { 
  themeColor: '#281d23', 
  width: 'device-width', 
  initialScale: 1 
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}