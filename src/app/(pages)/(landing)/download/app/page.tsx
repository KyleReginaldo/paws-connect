'use client';

// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
// import Link from 'next/link';
// import android from '../../../../../../public/android.png';
// import playstore from '../../../../../../public/playstore.png';
import { Button } from '@/components/ui/button';
import { BadgeCheck, IdCard, Smartphone } from 'lucide-react';
import { useQRCode } from 'next-qrcode';
import Link from 'next/link';
import downloadNow from '../../../../../../public/download-now.png';
export default function AppDownloadPage() {
  const downloadUrl =
    'https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/apk/pawsconnect/v1/pawsconnect.apk';
  const { SVG } = useQRCode();
  const requirements = [
    {
      icon: IdCard,
      title: '1 ID Card',
      description:
        'Make sure your ID is visible in the photo and the entire card is readable. Check your ID details before submitting to ensure all data is valid.',
    },
    {
      icon: BadgeCheck,
      title: 'Account Verification',
      description:
        'All users are required to apply for account verification to be able to adopt a pet.',
    },
    {
      icon: Smartphone,
      title: 'Submitting Details',
      description:
        'Before adopting please make sure that the input details are correct, so the admin can verify you as fast as possible.',
    },
  ];

  return (
    <div className="bg-gray-50">
      <div className="flex flex-col items-center md:flex-row-reverse gap-[30px] justify-center mx-[5%]">
        <Image src={downloadNow} alt="download now" className="w-[90%] md:w-[35%]" />
        <div className="flex flex-col items-center md:items-start justify-center max-w-[550px]">
          <h1 className="text-2xl">Adopt a Pet Now!</h1>
          <p className="text-lg text-center md:text-start mb-[16px]">
            Download our app to adopt a pet today, or support our ongoing fundraising efforts to
            help improve our community!
          </p>
          <Link href={downloadUrl}>
            <Button className="w-fit bg-orange-500 mb-[32px]" size={'lg'}>
              Get Started
            </Button>
          </Link>
          <h4 className="font-bold">DOWNLOAD THE PAWS CONNECT APP</h4>
          <div className="bg-white w-fit p-[8px]">
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
        </div>
      </div>
      <div className="bg-white flex flex-col items-center pt-16 mb-[100px]">
        <h1 className="text-lg mb-[16px]">Requirements for Adopting a pet</h1>
        <div className="flex flex-col md:flex-row gap-[50px]">
          {requirements.map((e, index) => {
            return (
              <div
                key={index}
                className="flex flex-col gap-[8px] items-center bg-orange-400 p-[16px] rounded-[8px]"
              >
                <e.icon color="white" />
                <p className="text-white font-semibold text-[16px]">{e.title}</p>
                <p className="w-fit max-w-[200px] text-center text-white text-[13px]">
                  {e.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    // <html>
    //   <body>
    //     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
    //       <Card className="max-w-2xl w-full shadow-none">
    //         <CardContent className="p-8 text-center space-y-6">
    //           {/* Icon / Logo */}
    //           <div className="flex justify-center">
    //             <Image src={playstore} alt={'logo'} height={100} className="rounded-md" />
    //           </div>

    //           {/* Title & Subtitle */}
    //           <div className="space-y-4">
    //             <h1 className="text-2xl font-bold text-gray-800">Get Paws Connect</h1>
    //             <p className="text-gray-600 text-base">
    //               Access the full Paws Connect experience on your mobile device. Track donations,
    //               adopt pets, and stay connected with the community anytime, anywhere.
    //             </p>
    //           </div>

    //           {/* Download Button */}
    //           <div className="flex justify-center pt-4">
    //             <Button asChild size="lg" className="bg-black hover:bg-orange-800">
    //               <Link
    //                 href="https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/apk/pawsconnect/v1/pawsconnect.apk"
    //                 target="_blank"
    //               >
    //                 <Image
    //                   src={android}
    //                   alt="Android Logo"
    //                   color="white"
    //                   className="inline-block mr-2 text-white"
    //                   height={20}
    //                   width={20}
    //                 />
    //                 Download the App
    //               </Link>
    //             </Button>
    //           </div>

    //           {/* Footer / Note */}
    //           <div className="pt-6 border-t">
    //             <p className="text-sm text-gray-500">Available on Android. Free to download.</p>
    //           </div>
    //         </CardContent>
    //       </Card>
    //     </div>
    //   </body>
    // </html>
  );
}
