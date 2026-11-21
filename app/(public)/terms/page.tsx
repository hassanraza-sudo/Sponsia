import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Terms and Conditions' };
export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const settings = await getSettings();

  return (
    <div>
      <section className="bg-forest-deep py-16 text-white md:py-20">
        <div className="container-tight max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">Legal</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Terms and Conditions</h1>
          <p className="mt-6 text-lg text-white/75">The terms that govern the use of this website.</p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-tight max-w-3xl space-y-10 text-[15px] leading-relaxed text-muted-foreground">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">1. About the platform</h2>
            <p className="mt-3">
              Sponsia is an education support initiative that lets students apply for educational support and
              lets supporters express interest in sponsorship. The platform is currently in its pre-launch phase.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">2. No payments are collected</h2>
            <p className="mt-3">
              Online payment collection is not yet available. Enquiries made through this website are expressions of
              interest only and create no financial obligation for any party. Any future payment features will be
              introduced with clear notice.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">3. Student applications</h2>
            <p className="mt-3">
              By submitting an application, you confirm that the information provided is accurate and that you are
              the student or the student’s authorised guardian. Submitting an application does not guarantee
              approval, publication or support. We may verify any information provided, including with the
              applicant’s educational institution.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">4. Public profiles</h2>
            <p className="mt-3">
              Published student profiles contain only the information the student or guardian has approved.
              Sponsia does not guarantee sponsorship outcomes and does not act as an employment or immigration
              agent. Published profiles may be updated or removed at the administrator’s discretion.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">5. Acceptable use</h2>
            <p className="mt-3">
              You agree not to submit false information, impersonate any person, upload unlawful content, or attempt
              to access private data, administrative routes or other users’ information. We may remove content and
              restrict access for misuse.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">6. Limitation of liability</h2>
            <p className="mt-3">
              The website is provided “as is”. To the extent permitted by law, Sponsia is not liable for indirect
              or consequential loss arising from use of this website.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">7. Changes</h2>
            <p className="mt-3">
              We may update these terms from time to time. Continued use of the website after changes means you
              accept the updated terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-forest-deep">8. Contact</h2>
            <p className="mt-3">
              Questions about these terms? Reach us via the details on our{' '}
              <a href="/contact" className="font-medium text-forest hover:underline">Contact page</a>
              {settings.contact_email && !settings.contact_email.startsWith('[') ? (
                <> or at {settings.contact_email}</>
              ) : null}
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
