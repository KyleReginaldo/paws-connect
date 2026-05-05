import Image from 'next/image';
import pawslogo from '../../../public/pawsconnectlogo.ico';

export const metadata = {
  title: 'Privacy Policy - PawsConnect',
  description: 'Privacy Policy for PawsConnect — how we collect, use, and protect your personal data.',
};

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </h1>
              <p className="text-sm text-muted-foreground">
                PawsConnect — Effective May 5, 2026
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-200 mb-6">
            PawsConnect is committed to protecting your privacy. This Privacy Policy explains how we
            collect, use, store, and safeguard the personal information you provide when using our
            platform. By using PawsConnect, you agree to the practices described in this policy in
            accordance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012).
          </p>

          <section className="space-y-4">
            <article>
              <h2 className="text-lg font-semibold">1. Information We Collect</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                We collect the following types of personal information:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  <strong>Account Information:</strong> Full name, email address, contact number,
                  and password (stored encrypted).
                </li>
                <li>
                  <strong>Adoption Application Data:</strong> Home address, photos of your
                  residence, and any information submitted as part of an adoption request.
                </li>
                <li>
                  <strong>Location Data:</strong> General location to support adoption logistics
                  and shelter coordination.
                </li>
                <li>
                  <strong>Transaction Data:</strong> Donation amounts, payment references, and
                  campaign contributions (payment details are handled by our payment processor and
                  are not stored on our servers).
                </li>
                <li>
                  <strong>Usage Data:</strong> App activity, device type, and browser information
                  for performance and security monitoring.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>To process and manage pet adoption applications.</li>
                <li>To verify your identity and suitability as an adopter.</li>
                <li>To process donations and send donation receipts.</li>
                <li>To send notifications about adoption updates, campaigns, and shelter news.</li>
                <li>To facilitate password resets and account communications via email.</li>
                <li>To improve platform performance and user experience.</li>
                <li>To comply with legal obligations under Philippine law.</li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">3. Legal Basis for Processing</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                We process your personal data based on the following grounds:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  <strong>Consent:</strong> You have given explicit consent when creating an
                  account or submitting an adoption application.
                </li>
                <li>
                  <strong>Contractual Necessity:</strong> Processing is required to fulfill an
                  adoption or donation transaction you initiated.
                </li>
                <li>
                  <strong>Legal Obligation:</strong> To comply with applicable Philippine laws and
                  regulations.
                </li>
                <li>
                  <strong>Legitimate Interest:</strong> To maintain platform security and improve
                  our services.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">4. Data Sharing and Third Parties</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                We do not sell your personal data. We only share it with trusted third-party
                service providers necessary to operate PawsConnect:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  <strong>Supabase</strong> — database hosting and authentication services.
                </li>
                <li>
                  <strong>Firebase</strong> — push notification delivery.
                </li>
                <li>
                  <strong>Google</strong> — authentication (Google Sign-In) and email services.
                </li>
                <li>
                  <strong>Payment Processors</strong> — secure handling of donation transactions.
                </li>
              </ul>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                These providers are bound by their own privacy policies and are required to
                protect your data in accordance with applicable laws.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">5. Data Retention</h2>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  Account data is retained as long as your account is active or as needed to
                  provide our services.
                </li>
                <li>
                  Adoption records and home verification photos are kept for up to 3 years after
                  completion, unless required longer for legal purposes.
                </li>
                <li>Donation records are retained for 7 years for legal and audit compliance.</li>
                <li>
                  Upon account deletion, personal data is removed within 30 days, except where
                  retention is required by law.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">6. Your Rights</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                Under the Philippine Data Privacy Act and other applicable regulations, you have
                the right to:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  <strong>Access</strong> — request a copy of your personal data we hold.
                </li>
                <li>
                  <strong>Correction</strong> — request corrections to inaccurate or incomplete
                  data.
                </li>
                <li>
                  <strong>Erasure</strong> — request deletion of your personal data ("right to be
                  forgotten"), subject to legal retention requirements.
                </li>
                <li>
                  <strong>Portability</strong> — request your data in a structured, commonly used
                  format.
                </li>
                <li>
                  <strong>Objection</strong> — object to certain types of processing.
                </li>
                <li>
                  <strong>Withdraw Consent</strong> — withdraw consent at any time, which may
                  affect your ability to use some features.
                </li>
                <li>
                  <strong>Lodge a Complaint</strong> — file a complaint with the National Privacy
                  Commission (Philippines) at{' '}
                  <span className="font-medium">privacy.gov.ph</span>.
                </li>
              </ul>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                To exercise any of these rights, please contact us through the app&apos;s contact
                form.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">7. Data Security</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                We implement industry-standard security measures to protect your personal data,
                including encrypted storage, secure HTTPS connections, and access controls. While
                we take reasonable precautions, no online system is completely immune to security
                risks. We encourage users to use strong, unique passwords and to keep their login
                credentials confidential.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">8. Children&apos;s Privacy</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                PawsConnect is not intended for use by individuals under 18 years of age without
                parental or guardian consent. We do not knowingly collect personal information
                from minors. If we become aware that a minor has provided personal data without
                appropriate consent, we will delete it immediately.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">9. Cookies and Tracking</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                PawsConnect may use session cookies and local storage to maintain your login
                session and improve app performance. We do not use tracking cookies for
                advertising purposes. You can manage or disable cookies through your browser or
                device settings, though this may affect some app functionality.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">10. Changes to This Policy</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                We may update this Privacy Policy from time to time. Any changes will be posted
                on this page with an updated effective date. Continued use of PawsConnect after
                changes are posted constitutes your acceptance of the revised policy. We encourage
                you to review this page periodically.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">11. Contact Us</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                If you have questions, concerns, or requests regarding this Privacy Policy or your
                personal data, please contact us through the in-app contact form or visit us at:
              </p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 font-medium">
                Humanity for Animals — GMA, Cavite, Philippines
              </p>
            </article>
          </section>

          <p className="text-sm text-gray-700 dark:text-gray-200 mt-6">
            By using PawsConnect, you acknowledge that you have read and understood this Privacy
            Policy and consent to the collection and use of your information as described herein.
          </p>
        </div>
      </div>
    </main>
  );
}
