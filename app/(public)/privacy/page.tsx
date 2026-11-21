import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Privacy Policy' };
export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const settings = await getSettings();

  return (
    <div>
      <section className="bg-forest-deep py-16 text-white md:py-20">
        <div className="container-tight max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">Legal</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Privacy Policy</h1>
          <p className="mt-6 text-lg text-white/75">
            How Sponsia collects, uses and protects student and supporter information.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-tight max-w-3xl space-y-10 text-[15px] leading-relaxed text-muted-foreground">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">1. Who we are</h2>
            <p className="mt-3">
              Sponsia (“we”, “us”) is an education support initiative that helps students at risk of
              discontinuing their education due to financial difficulties. This policy explains what information we
              collect through this website and how we handle it.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">2. Information we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong className="text-charcoal">Student applications:</strong> personal details (name, date of birth, contact information), educational details (school, grade, academic record), financial details (educational expenses), uploaded documents, and consent choices.</li>
              <li><strong className="text-charcoal">Enquiries:</strong> your name, email, country and message when you contact us or express interest in supporting a student.</li>
              <li><strong className="text-charcoal">Technical data:</strong> basic server logs used for security and reliability.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">3. How student information is protected</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Application details, documents, addresses, phone numbers and notes are <strong className="text-charcoal">private</strong>. They are visible only to the platform administrator.</li>
              <li>Documents are stored in private, access-controlled storage and are never publicly downloadable.</li>
              <li>Public student profiles contain <strong className="text-charcoal">only</strong> the information the student or guardian explicitly approved. Students may publish under an alias or anonymously.</li>
              <li>We never publish CNIC numbers, home addresses, phone numbers, private emails or financial records.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">4. How we use information</h2>
            <p className="mt-3">
              We use application data solely to verify educational need and prepare public profiles. Enquiry data is
              used solely to respond to you and manage potential sponsorship. We do not sell or share personal
              information with third parties for marketing.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">5. Consent and withdrawal</h2>
            <p className="mt-3">
              Public display of a student’s name, photograph, story, school or location happens only with explicit
              consent recorded during the application. Consent can be withdrawn by contacting us; we will remove the
              public profile promptly while retaining the private application record for accountability.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">6. Minors</h2>
            <p className="mt-3">
              Most applicants are minors. For any student under 18, guardian consent is recorded before any public
              profile is published, and our systems prevent publication without it.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">7. Contact</h2>
            <p className="mt-3">
              Questions about this policy or your data? Contact us at{' '}
              {settings.contact_email && !settings.contact_email.startsWith('[') ? (
                <a href={`mailto:${settings.contact_email}`} className="font-medium text-forest hover:underline">
                  {settings.contact_email}
                </a>
              ) : (
                'the contact details on our Contact page'
              )}
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
