'use client';

import { Button } from '@/components/ui/button';
import { HeroVideoDialog } from '@/components/ui/hero-video-dialog';
import {
  Blend,
  BookCheck,
  Download,
  Mail,
  MessageCircle,
  TramFront,
  UsersRound,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import phones from '../../../../public/phones.png';

export default function HomePage() {
  const whyChooseValues = [
    {
      title: 'Fast Adoption Process',
      description: 'We connect loving families with rescue pets looking for their perfect match.',
      icon: Zap,
    },
    {
      title: 'Donation Transparency',
      description: 'Engage with a community of pet lovers, share stories, and get advice.',
      icon: Blend,
    },
    {
      title: 'Realtime Fundraising Tracking',
      description:
        'Monitor active campaigns, approve donations, and track fundraising progress in real-time.',
      icon: TramFront,
    },
    {
      title: 'Event Participation',
      description:
        'Join local and virtual events to support animal rescue and adoption initiatives.',
      icon: UsersRound,
    },
    {
      title: 'Trusted Fundraising Platform',
      description:
        'Your contributions directly support rescue efforts and provide care for animals in need.',
      icon: BookCheck,
    },
    {
      title: 'Interactive Forum',
      description: 'Engage with a community of pet lovers, share stories, and get advice.',
      icon: MessageCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Nav moved to global layout NavBar component */}
      {/* Hero Section (side-by-side even on mobile) */}
      <div className="relative flex flex-col md:flex-row w-full min-h-[70vh] md:min-h-[90vh] bg-[url('/hero.png')] bg-cover bg-center bg-no-repeat overflow-hidden">
        {/* Text Column */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-8">
          <div className="max-w-md space-y-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Every Pet Deserves a Chance
            </h1>
            <p className="text-base sm:text-xl text-white">
              Join a compassionate community working together to rescue, care for, and rehome
              animals in need.
            </p>
            <div className="flex flex-row xs:flex-row gap-3 justify-center sm:justify-start mt-2">
              <Link href="/contact">
                <Button className="bg-orange-500 hover:bg-orange-600 w-full xs:w-auto">
                  <Mail /> Get In Touch
                </Button>
              </Link>
              <Link href="https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/apk/pawsconnect/v1/pawsconnect.apk">
                <Button
                  variant="default"
                  className="bg-teal-500 hover:bg-white/10 w-full xs:w-auto"
                >
                  <Download /> Download App
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Image Column */}
        <div className="flex-1 flex items-center justify-center relative py-1">
          <div
            className="pointer-events-none absolute -z-10 rounded-full border-2 border-orange-500 bg-orange-500/30 shadow-xl"
            aria-hidden="true"
            style={{
              width: '800px',
              height: '800px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <Image
            src={phones}
            alt="Paws Display"
            className="w-auto max-h-[1200px] sm:max-h-[900px] animate-in drop-shadow-2xl"
            priority
            sizes="(max-width: 640px) 70vw, (max-width: 768px) 65vw, 50vw"
          />
        </div>
      </div>

      <HeroVideoDialog
        className="block dark:hidden max-w-[70%] mx-auto my-16"
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/YgDMA1HtnJQ?si=dVjhasKnoAvLmm0b"
        thumbnailSrc="/pet_bg.png"
        thumbnailAlt="Dummy Video Thumbnail"
      />
      <div className="container mx-auto px-4 py-16 relative">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-6 h-6 bg-purple-400/20 rotate-45 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-4 h-4 bg-orange-300/20 rotate-12 animate-pulse delay-75"></div>
        <div className="absolute bottom-20 left-1/4 w-5 h-5 bg-teal-400/20 rotate-45 animate-pulse delay-150"></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-300/20 rotate-12 animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 right-16 w-4 h-4 bg-pink-400/20 rotate-45 animate-pulse delay-500"></div>
        <div className="absolute top-10 left-10 w-6 h-6 bg-purple-400/20 rotate-45 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-4 h-4 bg-orange-300/20 rotate-12 animate-pulse delay-75"></div>
        <div className="absolute bottom-20 left-1/4 w-5 h-5 bg-teal-400/20 rotate-45 animate-pulse delay-150"></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-300/20 rotate-12 animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 right-16 w-4 h-4 bg-pink-400/20 rotate-45 animate-pulse delay-500"></div>
        <div className="flex flex-col gap-[16px] items-center mb-10">
          <h4 className="font-bold text-2xl">Why Choose Paws Connect?</h4>
          <div className="flex flex-wrap gap-[24px] items-start justify-center">
            {whyChooseValues.map((item, index) => {
              return (
                <div
                  key={index}
                  className="flex flex-col items-center md:flex-row md:items-start gap-[16px] border-2 p-8 rounded-[8px] border-orange-50 bg-white w-full md:w-[45%]"
                >
                  {item.icon && (
                    <div className="bg-orange-50 p-3 rounded-full">
                      <item.icon className="text-orange-500 h-8 w-8" />
                    </div>
                  )}
                  <div className="text-center md:text-left">
                    <p className="text-lg font-semibold text-black">{item.title}</p>
                    <p className="text-md text-gray-800">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}
