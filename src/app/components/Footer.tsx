'use client';
import { CircleQuestionMark, MapPin } from 'lucide-react';
import { useQRCode } from 'next-qrcode';
import Link from 'next/link';

const Footer = () => {
  const { SVG } = useQRCode();

  return (
    <footer className="flex flex-row gap-[32px] p-[16px] justify-center text-gray-900 py-8 transition-all">
      <div className="flex flex-col items-center gap-[8px] md:bg-gray-100 md:p-4 md:rounded-[8px]">
        <p className="font-bold text-md">Download Paws Connect!</p>
        <SVG
          text={
            'https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/apk/pawsconnect/v1/pawsconnect.apk'
          }
          options={{
            margin: 1,
            width: 120,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          }}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-[32px]">
        <div className="flex flex-col gap-[8px]">
          <p className="font-bold text-xl">Shelter</p>
          <Link
            href="/faq"
            className="flex items-center hover:text-orange-400 font-semibold transition-colors"
          >
            <CircleQuestionMark className="inline-block mr-1" size={15} />
            FAQs
          </Link>
          <Link
            href="https://maps.app.goo.gl/Z8ZRmqTa2gF4sz9GA"
            target="_blank"
            className="flex items-center hover:text-orange-400 font-semibold transition-colors"
          >
            <MapPin className="inline-block mr-1" size={15} />
            Google Map
          </Link>
        </div>
        <div className="flex flex-col gap-[8px]">
          <p className="font-bold text-xl">Legals</p>
          <Link
            href="/terms-and-condition"
            className="hover:text-orange-400 font-semibold transition-colors"
          >
            Terms & Conditions
          </Link>
        </div>
        <div className="flex flex-col gap-[8px]">
          <p className="font-bold text-xl">Social Medias</p>
          <Link
            href="https://www.facebook.com/tailsoffreedom"
            className="hover:text-orange-400  font-semibold transition-colors"
          >
            Facebook
          </Link>
          <Link
            href="https://www.instagram.com/tailsoffreedom"
            className="hover:text-orange-400  font-semibold transition-colors"
          >
            Instagram
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
