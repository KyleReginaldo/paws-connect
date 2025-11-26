import Footer from '@/app/components/Footer';
import NavBar from '@/app/components/NavBar';

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      {children}
      <Footer />
    </>
  );
}
