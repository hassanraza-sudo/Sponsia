import { HeartHandshake, Users, Building2, Globe2 } from 'lucide-react';
import { EnquiryForm } from '@/components/site/enquiry-form';

export const metadata = { title: 'Become a Supporter' };

const audiences = [
  {
    icon: Users,
    title: 'Individuals & families',
    text: 'Sponsor a student’s fees, books or transport — as an ongoing commitment or a one-time gift.',
  },
  {
    icon: Building2,
    title: 'Organisations',
    text: 'Partner with us to support verified students at scale, with reporting your team can trust.',
  },
  {
    icon: Globe2,
    title: 'International donors',
    text: 'Wherever you are in the world, your support can keep a Pakistani student in school.',
  },
];

export default function SupportPage() {
  return (
    <div>
      <section className="bg-forest-deep py-16 text-white md:py-20">
        <div className="container-tight max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">Become a Supporter</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Help a student stay in school.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            Every published profile on Sponsia represents a real, verified educational need. Tell us how you
            would like to help, and our team will contact you to arrange the next steps together.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-tight">
          <div className="grid gap-6 md:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="rounded-2xl border border-border bg-card p-8">
                <a.icon className="mb-4 h-8 w-8 text-forest" />
                <h2 className="font-display text-lg font-semibold text-forest-deep">{a.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-12 rounded-3xl border border-border bg-card p-8 md:p-10 lg:grid-cols-[2fr_3fr]">
            <div>
              <HeartHandshake className="mb-4 h-10 w-10 text-gold" />
              <h2 className="font-display text-2xl font-semibold text-forest-deep">
                Send a supporter enquiry
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Fill in the form and we will get back to you by email. There is no payment step — support always
                begins with a conversation, so we can match your intention to a verified need.
              </p>
              <p className="mt-4 rounded-xl bg-sage/50 p-4 text-sm text-muted-foreground">
                Note: Sponsia is in its pre-launch phase. Online payment collection is not yet available, and
                nothing on this form commits you to any amount.
              </p>
            </div>
            <EnquiryForm kind="donor" />
          </div>
        </div>
      </section>
    </div>
  );
}
