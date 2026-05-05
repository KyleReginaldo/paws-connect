import Image from 'next/image';
import pawslogo from '../../../public/pawsconnectlogo.ico';

export const metadata = {
  title: 'Safety Standards & CSAE Policy - PawsConnect',
  description:
    'PawsConnect safety standards and zero-tolerance policy against child sexual abuse and exploitation (CSAE).',
};

export default function SafetyStandardsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white/70 dark:bg-card p-6 md:p-10 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-6">
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
                Safety Standards & CSAE Policy
              </h1>
              <p className="text-sm text-muted-foreground">
                PawsConnect — Effective May 5, 2026
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-200 mb-6">
            PawsConnect is committed to maintaining a safe, respectful, and inclusive environment
            for all users. We enforce strict safety standards across our platform and have a
            zero-tolerance policy toward any content or behavior that harms, exploits, or endangers
            individuals — especially children.
          </p>

          <section className="space-y-6">
            <article>
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
                1. Zero-Tolerance Policy Against Child Sexual Abuse and Exploitation (CSAE)
              </h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                Paws Connect has a zero-tolerance policy against child sexual abuse and exploitation
                (CSAE). We strictly prohibit any content, behavior, or communication on our
                platform that sexually exploits, abuses, or harms minors in any way. This includes,
                but is not limited to:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>Child sexual abuse material (CSAM) in any form.</li>
                <li>Grooming, solicitation, or any sexual communication directed at minors.</li>
                <li>Sharing, distributing, or linking to any content that sexualizes minors.</li>
                <li>
                  Any attempt to facilitate offline contact with a minor for exploitative purposes.
                </li>
              </ul>
              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                Users who violate this policy will be immediately and permanently banned from the
                platform and reported to appropriate law enforcement authorities and relevant
                child-protection agencies without prior notice.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">2. How We Enforce This Policy</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                PawsConnect employs the following measures to detect, prevent, and respond to CSAE
                and other harmful content:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  User reporting tools that allow any member to flag suspected CSAE content or
                  behavior.
                </li>
                <li>
                  Prompt review and removal of reported content by our trust and safety team.
                </li>
                <li>
                  Immediate account suspension pending investigation upon receipt of a credible
                  CSAE report.
                </li>
                <li>
                  Cooperation with law enforcement agencies, including the Philippine National
                  Police (PNP) and the Inter-Agency Council Against Trafficking (IACAT), when
                  required.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">3. General Platform Safety Standards</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                Beyond CSAE, PawsConnect prohibits all of the following:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>Harassment, threats, or intimidation of any user.</li>
                <li>Hate speech or content that discriminates based on race, gender, religion, or other protected characteristics.</li>
                <li>Fraud, impersonation, or misrepresentation.</li>
                <li>Sharing of private personal information without consent (doxxing).</li>
                <li>Any content promoting violence or illegal activity.</li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">4. How to Report CSAE or Harmful Content</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                If you encounter any content or behavior on PawsConnect that you believe constitutes
                child sexual abuse or exploitation, or any other serious safety violation, please
                report it immediately through one of the following channels:
              </p>
              <ul className="list-disc list-inside mt-3 text-sm text-gray-700 dark:text-gray-200 space-y-2">
                <li>
                  <strong>In-app reporting:</strong> Use the report button available on any post,
                  message, or user profile.
                </li>
                <li>
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:karl@xube.io"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    karl@xube.io
                  </a>{' '}
                  — include as much detail as possible (screenshots, usernames, timestamps).
                </li>
              </ul>
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                All reports are treated with strict confidentiality. We aim to respond to all
                safety reports within 24 hours.
              </p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                You may also report CSAE directly to the{' '}
                <strong>National Center for Missing &amp; Exploited Children (NCMEC)</strong> at{' '}
                <span className="font-medium">cybertipline.org</span>, or to the{' '}
                <strong>Philippine Internet Crimes Against Children Center (PICACC)</strong>.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">5. Our Commitment</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                PawsConnect is dedicated to continuous improvement of our safety practices. We
                regularly review our policies, invest in trust and safety tooling, and cooperate
                fully with authorized investigations. The protection of children and vulnerable
                users is a non-negotiable priority for our platform and our team.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">6. Contact Us</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                For questions or concerns about our safety policies, please contact us at:
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                <a
                  href="mailto:karl@xube.io"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  karl@xube.io
                </a>
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                Humanity for Animals — GMA, Cavite, Philippines
              </p>
            </article>
          </section>

          <p className="text-sm text-gray-700 dark:text-gray-200 mt-8 border-t pt-4">
            By using PawsConnect, you agree to abide by these safety standards. Violations may
            result in immediate account termination and reporting to law enforcement.
          </p>
        </div>
      </div>
    </main>
  );
}
