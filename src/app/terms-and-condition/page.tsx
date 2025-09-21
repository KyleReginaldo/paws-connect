import Image from 'next/image';
import pawslogo from '../../../public/pawsconnectlogo.ico';

export const metadata = {
  title: 'Terms & Conditions - Paws Connect',
  description: 'Terms and Conditions and Privacy Policy for Paws Connect mobile app',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white/70 dark:bg-card p-6 md:p-10 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 flex-shrink-0">
              <Image
                src={pawslogo}
                alt="Paws Connect"
                width={48}
                height={48}
                className="rounded-md object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Terms & Conditions
              </h1>
              <p className="text-sm text-muted-foreground">
                PawsConnect — mobile-first adoption, welfare support, and fundraising
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">
            Welcome to PawsConnect, a mobile-first platform designed to support adoption, welfare
            support, and fundraising for Tails of Freedom Animal Haven in Bacoor City, Cavite. By
            downloading, accessing, or using our app, you agree to the following Terms and
            Conditions, which also include our Privacy Policy. Please read carefully before use.
          </p>

          <section className="space-y-4">
            <article>
              <h2 className="text-lg font-semibold">1. User Accounts and Responsibilities</h2>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  Users must provide accurate and complete personal information, including name,
                  address, contact number, email, and photos of their home, as required for adoption
                  verification.
                </li>
                <li>
                  Users are responsible for maintaining the confidentiality of their login
                  credentials.
                </li>
                <li>
                  Misuse of the platform, including fraudulent information or unauthorized activity,
                  is prohibited.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">2. Permissions</h2>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  The app will automatically enable access to Location services to support adoption
                  logistics and shelter coordination.
                </li>
                <li>
                  PawsConnect will request permission to send Notifications to keep users updated on
                  adoptions, donations, and shelter needs.
                </li>
                <li>
                  Users consent to provide personal information, including home photos, address,
                  email, and contact number, which will be used only for adoption evaluation,
                  communication, and security.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">3. Data Collection and Use</h2>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  PawsConnect collects: name, address, email, phone number, location, photos, and
                  adoption-related data.
                </li>
                <li>
                  Data will be used for: adoption processing, password reset via email,
                  communication, notifications, and donation tracking.
                </li>
                <li>
                  Data will not be sold or shared with third parties except trusted partners
                  necessary for platform services (e.g., Supabase, Firebase, Google, payment
                  processors).
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">4. Data Retention Policy</h2>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>
                  Personal data will be retained only as long as necessary for adoption, donation,
                  or legal requirements.
                </li>
                <li>
                  Adoption records and home verification photos are kept securely for up to 3 years,
                  after which they are deleted unless required for ongoing cases.
                </li>
                <li>
                  Users may request earlier deletion of personal data, subject to applicable laws.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">5. User Rights (GDPR, CCPA, Philippine DPA)</h2>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>Access their personal data.</li>
                <li>Correct inaccurate or incomplete data.</li>
                <li>Request deletion of data (“right to be forgotten”).</li>
                <li>Withdraw consent at any time (may affect ability to use adoption features).</li>
                <li>
                  File complaints with the National Privacy Commission (Philippines) or relevant
                  authorities.
                </li>
              </ul>
            </article>

            <article>
              <h2 className="text-lg font-semibold">6. Children’s Privacy</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                PawsConnect is not intended for children under 18 without parental or guardian
                consent. We do not knowingly collect personal information from minors. If
                discovered, such data will be deleted immediately.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">7. Third-Party Services</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                The platform integrates third-party services such as Google (authentication, email),
                Supabase (database), Firebase (notifications), and payment gateways. Users
                acknowledge that use of these services is subject to their respective Privacy
                Policies and Terms.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">8. Community Guidelines</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                Users must interact respectfully in forums and volunteer spaces. Abusive, harmful,
                or inappropriate behavior will result in account suspension or termination.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">9. Intellectual Property</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                All app content, branding, and designs belong to PawsConnect and may not be copied
                or reused without permission.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">10. Limitation of Liability</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                PawsConnect is not responsible for damages arising from misuse, technical issues, or
                third-party failures. While reasonable security measures are applied, no system is
                100% secure.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">11. Governing Law and Dispute Resolution</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                These Terms shall be governed by the laws of the Philippines. Disputes will be
                subject to the jurisdiction of the courts in Bacoor City, Cavite. Alternative
                resolution methods such as mediation or arbitration may be considered before court
                proceedings.
              </p>
            </article>

            <article>
              <h2 className="text-lg font-semibold">12. Termination</h2>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li>We may suspend or terminate accounts violating these Terms.</li>
                <li>Users may request account deletion at any time.</li>
              </ul>
            </article>
          </section>

          <p className="text-sm text-gray-700 dark:text-gray-200 mt-6">
            By continuing to use PawsConnect, you confirm that you have read, understood, and agreed
            to these Terms and Conditions and Privacy Policy.
          </p>

          {/* Footer actions intentionally removed - page displays Terms only */}
        </div>
      </div>
    </main>
  );
}
