'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@radix-ui/react-separator';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import playstore from '../../../public/playstore.png';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { userId } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide nav on auth and admin pages
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 p-4 bg-gradient-to-br bg-white backdrop-blur-sm border-b-1">
      {/* Desktop Navigation */}
      <div className="hidden md:flex md:justify-between justify-end">
        <Link href="/">
          <div className="flex gap-2 items-center">
            <Image
              src={playstore}
              alt="PawsConnect Logo"
              width={40}
              height={25}
              className="object-contain rounded-[4px]"
            />
            <p className="text-md font-bold text-black">PawsConnect</p>
          </div>
        </Link>
        <ul className="flex gap-6 items-center">
          <Link href="/">
            <li
              className={`hover:font-bold hover:text-orange-500 transition-all cursor-pointer${pathname === '/' ? ' font-bold text-orange-500' : ''}`}
            >
              HOME
            </li>
          </Link>
          <Link href="/pets">
            <li
              className={`hover:font-bold hover:text-orange-500 transition-all cursor-pointer${pathname === '/pets' ? ' font-bold text-orange-500' : ''}`}
            >
              PETS
            </li>
          </Link>

          <Link href="/about">
            <li
              className={`hover:font-bold hover:text-orange-500 transition-all cursor-pointer${pathname === '/about' ? ' font-bold text-orange-500' : ''}`}
            >
              {' '}
              ABOUT
            </li>
          </Link>
          <Link href="/contact">
            <li
              className={`hover:font-bold hover:text-orange-500 transition-all cursor-pointer${pathname === '/contact' ? ' font-bold text-orange-500' : ''}`}
            >
              {' '}
              GET IN TOUCH
            </li>
          </Link>
          <Link href="/download/app">
            <Button className="rounded-full bg-orange-500">DOWNLOAD NOW</Button>
          </Link>
          <Separator orientation="vertical" className="bg-orange-500 h-6 w-[2px]" />
          <Link href={userId ? '/dashboard' : '/auth/signin'}>
            <li className="hover:font-bold text-orange-500 hover:text-gray-600 transition-all cursor-pointer">
              {userId ? 'ADMIN DASHBOARD' : 'ADMIN SIGN IN'}
            </li>
          </Link>
        </ul>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-2">
            <Image
              src={playstore}
              alt="PawsConnect Logo"
              width={40}
              height={25}
              className="object-contain rounded-[4px]"
            />
            <p className="text-md font-bold text-black">PawsConnect</p>
          </div>
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-gray-600 transition-all duration-300 ease-in-out"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6h18 M6 12h15 M12 18h9"
              className={`
        transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}
      `}
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
              className={`
        transition-all duration-300 ease-in-out
        absolute
        ${isMobileMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
      `}
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t z-50">
          <ul className="flex flex-col p-4 space-y-4">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <li
                className={`py-2 border-b border-gray-100 hover:text-orange-500 transition-all cursor-pointer${pathname === '/' ? ' font-bold text-orange-500' : ''}`}
              >
                HOME{' '}
              </li>
            </Link>
            <Link href="/pets" onClick={() => setIsMobileMenuOpen(false)}>
              <li
                className={`py-2 border-b border-gray-100 hover:text-orange-500 transition-all cursor-pointer${pathname === '/pets' ? ' font-bold text-orange-500' : ''}`}
              >
                PETS{' '}
              </li>
            </Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>
              <li
                className={`py-2 border-b border-gray-100 hover:text-orange-500 transition-all cursor-pointer${pathname === '/about' ? ' font-bold text-orange-500' : ''}`}
              >
                ABOUT
              </li>
            </Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
              <li
                className={`py-2 border-b border-gray-100 hover:text-orange-500 transition-all cursor-pointer${pathname === '/contact' ? ' font-bold text-orange-500' : ''}`}
              >
                {' '}
                GET IN TOUCH
              </li>
            </Link>
            <div className="flex gap-[20px]">
              <Link
                href={userId ? '/dashboard' : '/auth/signin'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <li className="py-2 text-orange-500 font-medium hover:text-gray-600 transition-all cursor-pointer">
                  {userId ? 'ADMIN DASHBOARD' : 'ADMIN SIGN IN'}
                </li>
              </Link>{' '}
              <Link href="/download/app" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="rounded-full bg-orange-500">DOWNLOAD NOW</Button>
              </Link>
            </div>
          </ul>
        </div>
      )}
    </nav>
  );
}
