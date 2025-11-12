'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroVideoDialog } from '@/components/ui/hero-video-dialog';
import { Separator } from '@radix-ui/react-separator';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import community from '../../public/community.png';
import fund from '../../public/fund.png';
import pawslogo from '../../public/pawsconnectlogo.ico';
import pet from '../../public/pet_management.png';
import { useAuth } from './context/AuthContext';

export default function HomePage() {
  const [contactForm, setContactForm] = useState({
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/v1/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'pawsconnecttof@gmail.com',
          subject: `Contact Form Message from ${contactForm.email}`,
          text: `
            <h3>New Contact Form Submission</h3>
            <p><strong>From:</strong> ${contactForm.email}</p>
            <p><strong>Message:</strong></p>
            <p>${contactForm.message.replace(/\n/g, '<br>')}</p>
          `,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setContactForm({ email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== 'undefined') {
      OneSignal.init({
        appId: '323cc2fb-7bab-418b-954e-a578788499bd',
        autoRegister: true,
        notifyButton: {
          enable: true,
          prenotify: true,
          showCredit: false,
          text: {
            'tip.state.unsubscribed': 'Subscribe to notifications',
            'tip.state.subscribed': "You're subscribed to notifications",
            'tip.state.blocked': 'Unblock notifications',
            'message.prenotify': 'Click to subscribe to notifications',
            'message.action.subscribing': 'Thanks for subscribing!',
            'message.action.subscribed': "Thanks! You're subscribed to notifications",
            'message.action.resubscribed': "You're subscribed to notifications",
            'message.action.unsubscribed': "You won't receive notifications again",
            'dialog.main.title': 'Manage Site Notifications',
            'dialog.main.button.subscribe': 'SUBSCRIBE',
            'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
            'dialog.blocked.title': 'Unblock Notifications',
            'dialog.blocked.message': 'Follow these instructions to allow notifications:',
          },
        },
        welcomeNotification: {
          title: 'Welcome to Paws Connect!',
          message: 'Thank you for enabling notifications.',
        },
      });
    }
  }, []);
  const { userId } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <nav className="p-4 relative">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-end">
          <ul className="flex gap-6 items-center">
            <a href="/download/app">
              <li className="hover:font-bold hover:text-orange-500 transition-all cursor-pointer">
                DOWNLOAD APP
              </li>
            </a>
            <a href="#about-us">
              <li className="hover:font-bold hover:text-orange-500 transition-all cursor-pointer">
                ABOUT US
              </li>
            </a>
            <a href="#contact">
              <li className="hover:font-bold hover:text-orange-500 transition-all cursor-pointer">
                CONTACT
              </li>
            </a>
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
          <div className="flex items-center">
            <Image
              src={pawslogo}
              alt="Paws Connect Logo"
              width={40}
              height={25}
              className="object-contain rounded-[4px]"
            />
            <span className="ml-2 text-lg font-semibold text-gray-800">Paws Connect</span>
          </div>

          {/* Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t z-50">
            <ul className="flex flex-col p-4 space-y-4">
              <a href="/download/app" onClick={() => setIsMobileMenuOpen(false)}>
                <li className="py-2 border-b border-gray-100 hover:text-orange-500 transition-all cursor-pointer">
                  DOWNLOAD APP
                </li>
              </a>
              <a href="#about-us" onClick={() => setIsMobileMenuOpen(false)}>
                <li className="py-2 border-b border-gray-100 hover:text-orange-500 transition-all cursor-pointer">
                  ABOUT US
                </li>
              </a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>
                <li className="py-2 border-b border-gray-100 hover:text-orange-500 transition-all cursor-pointer">
                  CONTACT
                </li>
              </a>
              <Link
                href={userId ? '/dashboard' : '/auth/signin'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <li className="py-2 text-orange-500 font-medium hover:text-gray-600 transition-all cursor-pointer">
                  {userId ? 'ADMIN DASHBOARD' : 'ADMIN SIGN IN'}
                </li>
              </Link>
            </ul>
          </div>
        )}
      </nav>
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Image
              src={pawslogo}
              alt="Paws Connect Logo"
              width={80}
              height={50}
              className="object-contain rounded-[8px]"
            />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">
            Welcome to Paws Connect Admin
          </h1>
          <p className="text-base text-gray-600 mb-8 max-w-2xl mx-auto">
            Manage pet adoption listings, oversee fundraising campaigns, and monitor community
            activity efficiently.
          </p>
        </div>
        <HeroVideoDialog
          className="block dark:hidden max-w-[500px] mx-auto mb-16"
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/YgDMA1HtnJQ?si=dVjhasKnoAvLmm0b"
          thumbnailSrc="/pet_bg.png"
          thumbnailAlt="Dummy Video Thumbnail"
        />
        {/* Admin Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Image
                  src={pet}
                  alt="Pet Management"
                  width={120}
                  height={80}
                  className="object-contain"
                />
              </div>
              <CardTitle>Pet Management</CardTitle>
              <CardDescription>
                Add, edit, or remove pet listings, update adoption status, and manage pet profiles.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Image
                  src={fund}
                  alt="Fundraising Oversight"
                  width={120}
                  height={80}
                  className="object-contain"
                />
              </div>
              <CardTitle>Fundraising Oversight</CardTitle>
              <CardDescription>
                Monitor active campaigns, approve donations, and track fundraising progress in
                real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Image
                  src={community}
                  alt="Community Management"
                  width={120}
                  height={80}
                  className="object-contain"
                />
              </div>
              <CardTitle>User & Community</CardTitle>
              <CardDescription>
                Manage user accounts, monitor community interactions, and resolve issues
                efficiently.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* About Us Section */}
        <section id="about-us" className="mb-16 py-12 rounded-lg bg-orange-400 p-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">About Paws Connect</h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-white mb-4">
                Paws Connect is dedicated to three core missions: adopting, donating, and caring for
                pets that need love. We believe every animal deserves a second chance at happiness
                and a forever home filled with compassion.
              </p>
              <p className="text-white mb-4">
                <strong>Adoption:</strong> We connect loving families with rescue pets looking for
                their perfect match. Our platform makes it easy to browse available pets, learn
                their stories, and start the adoption process with trusted shelters and rescue
                organizations.
              </p>
              <p className="text-white mb-4">
                <strong>Donations:</strong> Your generosity directly impacts animal welfare. Through
                our fundraising campaigns, you can support medical treatments, food, shelter
                improvements, and emergency care for pets in need. Every contribution, no matter the
                size, makes a real difference in an animal&apos;s life.
              </p>
              <p className="text-white mb-4">
                <strong>Caring:</strong> Beyond adoption and donations, we foster a community of pet
                lovers who share resources, advice, and support. From volunteer opportunities to
                educational content, we help create a network of care that extends far beyond our
                platform.
              </p>
              <p className="text-white">
                Join our mission to ensure every pet experiences the love, care, and security they
                deserve. Together, we can create a world where no animal is forgotten and every tail
                has a story of hope.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="mb-16 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Get in Touch</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Send us a message</h3>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm text-gray-600 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="your.email@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm text-gray-600 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm((prev) => ({ ...prev, message: e.target.value }))
                      }
                      placeholder="How can we help you?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      required
                    ></textarea>
                  </div>

                  {/* Status Messages */}
                  {submitStatus === 'success' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-700">
                        ✓ Message sent successfully! We&apos;ll get back to you soon.
                      </p>
                    </div>
                  )}
                  {submitStatus === 'error' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">
                        ✗ Failed to send message. Please try again or email us directly.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || !contactForm.email || !contactForm.message}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Email Support</h4>
                    <p className="text-sm text-gray-600">pawsconnecttof@gmail.com</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Business Hours</h4>
                    <p className="text-sm text-gray-600">Monday - Sunday</p>
                    <p className="text-sm text-gray-600">9:00 AM - 5:00 PM PST</p>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      We typically respond within 24 hours during business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Image
                src={pawslogo}
                alt="Paws Connect Logo"
                width={40}
                height={25}
                className="object-contain rounded-[4px] mr-3"
              />
              <span className="text-lg font-semibold">Paws Connect</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-4">
                <a
                  href="https://www.facebook.com/tailsoffreedom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-400 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Facebook
                </a>
                <a
                  href="https://www.instagram.com/tailsoffreedom?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-400 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.017 0C8.396 0 8.002.015 6.78.072 5.56.132 4.757.307 4.057.598a5.838 5.838 0 00-2.115 1.379A5.837 5.837 0 00.52 4.094C.23 4.784.062 5.587.01 6.807.015 8.002 0 8.396 0 12.017c0 3.624.015 4.021.072 5.245.062 1.223.237 2.025.529 2.714.292.692.676 1.275 1.379 2.115a5.84 5.84 0 002.118 1.38c.69.291 1.492.466 2.714.528 1.221.057 1.615.072 5.245.072 3.624 0 4.021-.015 5.245-.072 1.223-.062 2.025-.237 2.714-.528a5.841 5.841 0 002.118-1.38 5.838 5.838 0 001.379-2.115c.291-.69.466-1.491.528-2.714.057-1.221.072-1.615.072-5.245 0-3.624-.015-4.021-.072-5.245-.062-1.223-.237-2.025-.528-2.714a5.838 5.838 0 00-1.379-2.115A5.837 5.837 0 0019.928.52c-.69-.291-1.491-.466-2.714-.528C16.021.015 15.624 0 12.017 0zM12.017 2.162c3.556 0 3.977.015 5.38.072 1.298.059 2.006.277 2.477.461.623.242 1.067.532 1.534.999.467.467.757.911.999 1.534.184.471.402 1.179.461 2.477.057 1.403.072 1.824.072 5.38 0 3.556-.015 3.977-.072 5.38-.059 1.298-.277 2.006-.461 2.477a4.135 4.135 0 01-.999 1.534 4.135 4.135 0 01-1.534.999c-.471.184-1.179.402-2.477.461-1.403.057-1.824.072-5.38.072-3.556 0-3.977-.015-5.38-.072-1.298-.059-2.006-.277-2.477-.461a4.135 4.135 0 01-1.534-.999 4.135 4.135 0 01-.999-1.534c-.184-.471-.402-1.179-.461-2.477-.057-1.403-.072-1.824-.072-5.38 0-3.556.015-3.977.072-5.38.059-1.298.277-2.006.461-2.477.242-.623.532-1.067.999-1.534a4.135 4.135 0 011.534-.999c.471-.184 1.179-.402 2.477-.461 1.403-.057 1.824-.072 5.38-.072z"
                      clipRule="evenodd"
                    />
                    <path d="M12.017 5.838a6.179 6.179 0 100 12.359 6.179 6.179 0 000-12.359zM12.017 16a3.838 3.838 0 110-7.676 3.838 3.838 0 010 7.676z" />
                    <circle cx="18.406" cy="5.594" r="1.44" />
                  </svg>
                  Instagram
                </a>
              </div>
              <Link href="/terms-and-condition" className="hover:text-orange-400 transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/faq" className="hover:text-orange-400 transition-colors">
                FAQ
              </Link>
              <span className="text-gray-400 text-sm">
                © 2025 Paws Connect. All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
