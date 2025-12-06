import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Image from 'next/image';
import pawslogo from '../../../public/pawsconnectlogo.ico';

export const metadata = {
  title: 'FAQ - PawsConnect',
  description:
    'Frequently Asked Questions about PawsConnect - Pet adoption, donations, and animal welfare',
};

export default function FAQPage() {
  const faqs = [
    {
      id: 'faq-1',
      question: 'What is PawsConnect?',
      answer:
        'PawsConnect is a mobile and web-based application that connects potential adopters, donors, and volunteers with rescued animals. It aims to simplify pet adoption, promote transparency, and support animal welfare efforts of local shelters.',
    },
    {
      id: 'faq-2',
      question: 'Who manages PawsConnect?',
      answer:
        'PawsConnect is managed by a non-government organization (NGO) animal shelter Humanity for Animals located in GMA, Cavite. The Humanity for Animals currently cares for around 200 dogs and 50 cats, including kittens, most of which are rescued strays or surrendered pets.',
    },
    {
      id: 'faq-3',
      question: 'What is the purpose of PawsConnect?',
      answer:
        'The main goal of PawsConnect is to make animal adoption and shelter support easier and more accessible. It bridges the gap between the shelter and the public by providing a digital platform for adoption, donation, and communication.',
    },
    {
      id: 'faq-4',
      question: 'How can I adopt a pet through PawsConnect?',
      answer:
        'Users can view available animals on the app, learn about their breed, age, and health condition, and submit an adoption application. The shelter staff reviews each request and contacts the adopter for verification and home assessment.',
    },
    {
      id: 'faq-5',
      question: 'What information is required for adoption?',
      answer:
        'Applicants must provide their full name, contact number, email address, home address, and a photo of their house. These details help verify that adopters can provide a safe and suitable home for the pet.',
    },
    {
      id: 'faq-6',
      question: 'Is there an adoption fee?',
      answer:
        'Yes, a minimal fee is charged to help cover veterinary care, vaccinations, and shelter upkeep. The fee also helps sustain ongoing rescue and rehabilitation programs for other animals.',
    },
    {
      id: 'faq-7',
      question: 'How long does the adoption process take?',
      answer:
        'The adoption process typically takes a few days to a week, depending on how quickly verification and the home visit can be completed. Applicants are informed of their adoption status through the app.',
    },
    {
      id: 'faq-8',
      question: 'Can I donate to the shelter through PawsConnect?',
      answer:
        'Yes. Users can browse fundraising campaigns on the app and make secure donations. Each campaign clearly states its purpose, target amount, and progress to ensure transparency.',
    },
    {
      id: 'faq-9',
      question: 'How are donations used?',
      answer:
        'All donations go directly toward food, medical supplies, shelter maintenance, rescue missions, and animal care needs. The shelter maintains transparency by providing campaign updates through PawsConnect.',
    },
    {
      id: 'faq-10',
      question: 'Can I volunteer at the shelter?',
      answer:
        'Yes, volunteers are always welcome. The shelter accepts volunteers for tasks like feeding, cleaning, and helping with events or animal care. Interested individuals can sign up through the app or contact the shelter.',
    },
    {
      id: 'faq-11',
      question: 'Does PawsConnect require access to my location and notifications?',
      answer:
        'Yes. The app automatically enables location services to help verify addresses during adoption and donation processes. It may also request permission to send notifications for updates, reminders, and announcements.',
    },
    {
      id: 'faq-12',
      question: 'How does PawsConnect ensure user privacy?',
      answer:
        'PawsConnect follows the Philippine Data Privacy Act, ensuring that all personal data collected, including contact information, photos, and addresses, are securely stored and used only for authorized purposes.',
    },
    {
      id: 'faq-13',
      question: 'Do you accept surrendered or rescued animals?',
      answer:
        'The shelter accepts surrendered pets and rescued strays based on capacity. Priority is given to animals in distress, those rescued from the streets, or those needing medical attention.',
    },
    {
      id: 'faq-14',
      question: 'How can I track my adoption or donation activity?',
      answer:
        'Users can check their application status, donation history, and ongoing campaigns directly on the app dashboard. Updates are provided in real time for full transparency.',
    },
    {
      id: 'faq-15',
      question: 'How can I contact the shelter or PawsConnect support team?',
      answer:
        "You can reach the shelter through the app's built-in contact form, email, or social media pages. Visits are also welcome at the GMA, Cavite location during operating hours.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white/70 dark:bg-card p-6 md:p-10 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 flex-shrink-0">
              <Image
                src={pawslogo}
                alt="PawsConnect"
                width={48}
                height={48}
                className="rounded-md object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h1>
              <p className="text-sm text-muted-foreground">
                Everything you need to know about PawsConnect
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Find answers to common questions about pet adoption, donations, volunteering, and
              using the PawsConnect platform.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-4 bg-white/50 dark:bg-card/50"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-medium text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 dark:text-gray-200 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
              Still have questions?
            </h3>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              If you can&apos;t find the answer you&apos;re looking for, please don&apos;t hesitate
              to contact us through the app&apos;s contact form or visit us at our shelter in GMA,
              Cavite.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
