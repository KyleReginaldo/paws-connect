import ClientOnly from '@/app/components/ClientOnly';
import ClientProviders from '@/app/components/ClientProviders';
import Footer from '@/app/components/Footer';
import NavBar from '@/app/components/NavBar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          <NavBar />
          {children}
          <Footer />
          <ClientOnly />
        </ClientProviders>
      </body>
    </html>
  );
}
