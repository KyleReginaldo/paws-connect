import { Github, Globe, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import aljhon from '../../../../../public/aljhon.jpg';
import kyle from '../../../../../public/kyle.jpg';

import mission from '../../../../../public/mission.png';
import paws from '../../../../../public/pawsconnectlogo.ico';
import vision from '../../../../../public/vision.png';
const page = () => {
  const missionData = {
    image: mission,
    title: 'Our Mission',
    description:
      'Our mission is to empower communities to rescue, support, and care for stray dogs by providing an easy-to-use mobile platform that simplifies adoption, encourages donations, enables transparent fundraising, and connects people through meaningful events—making compassion accessible to everyone.',
  };
  const visionData = {
    image: vision,
    title: 'Our Vision',
    description:
      'To create a world where every stray dog is seen, valued, and given a chance to live a safe, happy, and loving life through the power of community and technology.',
  };
  const innovators = [
    {
      image: kyle,
      name: 'Kyle Reginaldo',
      role: 'Lead Developer',
      email: 'kyledennis099@gmail.com',
      website: 'https://kylereginaldo.site',
      github: 'https://github.com/KyleReginaldo',
    },
    {
      image: paws,
      name: 'Norly Villanueva',
      role: 'UI/UX Designer',

      email: 'norlyvillanueva4@gmail.com',
    },
    {
      image: aljhon,
      name: 'Aljhon Balmes',
      role: 'Leader & Documentation',
      email: 'aljhonbalmes39@gmail.com',
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="relative w-full h-[500px]">
        <div className="absolute -z-10  w-full h-[400px] bg-[linear-gradient(to_right,#ddd_1px,transparent_1px),linear-gradient(to_bottom,#ddd_1px,transparent_1px)] bg-[size:40px_40px]  [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        <div className="flex flex-col gap-[20px] items-center justify-center text-center px-4 py-[24px] max-w-4xl mx-auto">
          <h5 className="text-lg">Welcome to Paws Connect</h5>
          <p className="text-4xl font-extrabold text-center">
            Bringing hope to stray dogs with a <span className="text-orange-600">mobile</span> app
            that simplifies adoption, fundraising, and community action
          </p>
          <p className="text-xl text-center max-w-4xl">
            Experience a new era of compassionate pet care with our mobile app. We connect animal
            lovers, rescuers, and communities through a seamless platform that makes adopting,
            donating, fundraising, and joining events easier than ever—empowering everyone to give
            stray dogs the second chance they deserve.
          </p>
        </div>
      </div>
      {/* Mission Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-16 px-4 md:px-20 py-12 max-w-7xl mx-auto">
        <div className="relative flex-shrink-0">
          <div className="absolute -z-10 left-1/2 bottom-0 h-[250px] w-[250px] md:h-[350px] md:w-[350px] -translate-x-1/2 rounded-full bg-orange-400 border-2 border-orange-500"></div>
          <Image
            src={missionData.image}
            alt="Our Mission"
            className="max-h-[300px] md:max-h-[500px] w-auto"
          />
        </div>

        <div className="flex flex-col items-start justify-center px-4 md:px-8 max-w-lg text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{missionData.title}</h2>
          <p className="text-md md:text-lg text-gray-700">{missionData.description}</p>
        </div>
      </div>
      {/* Vision Section */}
      <div className="flex flex-col-reverse md:flex-row-reverse justify-between items-center gap-8 md:gap-16 px-4 md:px-20 py-12 max-w-7xl mx-auto">
        <div className="relative flex-shrink-0">
          <div className="absolute -z-10 left-1/2 bottom-0 h-[250px] w-[250px] md:h-[350px] md:w-[350px] -translate-x-1/2 rounded-full bg-gray-100 border-2 border-gray-200"></div>

          <Image
            src={visionData.image}
            alt="Our Vision"
            className="max-h-[300px] md:max-h-[500px] w-auto"
          />
        </div>
        <div className="flex flex-col items-start justify-center px-4 md:px-8 max-w-lg text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{visionData.title}</h2>
          <p className="text-md md:text-lg text-gray-700">{visionData.description}</p>
        </div>
      </div>
      {/* Innovators Section */}
      <div className="flex flex-col items-center justify-center px-4 md:px-20 py-12 mb-20 mt-12 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">Meet the Innovators</h2>
        <div className="flex flex-wrap justify-center gap-8"></div>
        <div className="flex flex-wrap justify-center gap-16 text-center">
          {innovators.map((innovator, index) => {
            return (
              <div key={index} className="flex flex-col gap-[8px] items-center">
                <Image
                  src={innovator.image}
                  alt={innovator.name}
                  width={100}
                  height={100}
                  className="rounded-full w-[100px] h-[100px] object-cover"
                />
                <h3 className="text-xl font-semibold mt-4">{innovator.name}</h3>
                <p className="text-md font-medium max-w-[200px]">{innovator.role}</p>
                <div className="flex gap-[16px]">
                  {innovator.email && (
                    <Link
                      href={`mailto:${innovator.email}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Mail size={16} />
                    </Link>
                  )}
                  {innovator.github && (
                    <Link href={innovator.github} target="_blank" rel="noopener noreferrer">
                      <Github size={16} />
                    </Link>
                  )}
                  {innovator.website && (
                    <Link href={innovator.website} target="_blank" rel="noopener noreferrer">
                      <Globe size={16} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default page;
