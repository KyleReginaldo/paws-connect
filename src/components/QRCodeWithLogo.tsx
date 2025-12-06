import { useQRCode } from 'next-qrcode';
import Image from 'next/image';
import playstore from '../../public/playstore.png';

interface QRCodeWithLogoProps {
  text: string;
  width?: number;
  logoSize?: number;
}

export default function QRCodeWithLogo({ text, width = 120, logoSize = 32 }: QRCodeWithLogoProps) {
  const { SVG } = useQRCode();

  return (
    <div className="bg-white w-fit p-[8px] relative">
      <SVG
        text={text}
        options={{
          margin: 1,
          width: width,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        }}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full">
        <Image
          src={playstore}
          alt="Playstore"
          width={logoSize}
          height={logoSize}
          className="rounded-full"
        />
      </div>
    </div>
  );
}
