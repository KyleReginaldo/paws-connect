import type { Metadata } from 'next';
import { Fredoka, Geist, Geist_Mono, Nunito } from 'next/font/google';
import ClientProviders from './components/ClientProviders';
import './global.css';
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Paws Connect',
  description:
    'Connect with adorable pets looking for their forever homes. Support fundraising campaigns and join our pet-loving community.',
  keywords: ['pets', 'adoption', 'dogs', 'cats', 'animal rescue', 'fundraising'],
  authors: [{ name: 'Paws Connect Team' }],

  creator: 'Paws Connect',
  publisher: 'Paws Connect',
  openGraph: {
    title: 'Paws Connect - Find Your Perfect Pet Companion',
    description:
      'Connect with adorable pets looking for their forever homes. Support fundraising campaigns and join our pet-loving community.',
    type: 'website',
    locale: 'en_US',
  },
  icons: {
    icon: '/pawsconnectlogo.ico',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paws Connect - Find Your Perfect Pet Companion',
    description:
      'Connect with adorable pets looking for their forever homes. Support fundraising campaigns and join our pet-loving community.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${nunito.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
