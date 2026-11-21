import Link from 'next/link';
import { FileText, Upload, ShieldCheck, MailCheck, Search, BookOpen, MessageSquare, HandHeart, Info } from 'lucide-react';

export const metadata = { title: 'How It Works' };

const studentSteps = [
  {
    icon: FileText,
    title: 'Submit an application',
    text: 'Fill in the application form with your personal, educational and financial details. No account is needed.',
  },
  {
    icon: Upload,
    title: 'Provide documents',
    text: 'Upload supporting documents such as your fee challan and latest academic results. They are stored securely and privately.',
  },
  {
    icon: ShieldCheck,
    title: 'Wait for verification',
    text: 'Our team personally reviews each application and may contact your guardian to verify details.',
  },
  {
    icon: MailCheck,
    title: 'Receive a decision',
    text: 'We inform every applicant of the decision. Approved students get a public profile — showing only what you consented to share.',
  },
];

const supporterSteps = [
  {
    icon: Search,
    title: 'Explore published profiles',
    text: 'Browse verified student profiles, each published only after personal review by our team.',
  },
  {
    icon: BookOpen,
    title: 'Read verified educational needs',
    text: 'Each profile shows the student’s real educational costs and goals — nothing inflated, nothing hidden.',
  },
  {
    icon: MessageSquare,
    title: 'Submit a sponsorship enquiry',
    text: 'Interested in helping? Send an enquiry directly from a student’s profile or our supporter page.',
  },
  {
    icon: HandHeart,
    title: 'Talk to our team',
    text: 'We contact you, answer your questions, and arrange the support together with the student’s institution.',
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <section className="bg-forest-deep py-16 text-white md:py-20">
        <div className="container-tight max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">How It Works</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Simple steps, built on trust.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            Whether you are a student seeking support or a supporter ready to give one, the process is personal,
            verified and transparent from start to finish.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-semibold text-forest-deep">For Students</h2>
          <p className="mt-2 text-muted-foreground">Four steps between you and educational support.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {studentSteps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-border bg-card p-7">
                <span className="absolute right-5 top-5 font-display text-4xl font-semibold text-sage">{i + 1}</span>
                <s.icon className="mb-4 h-7 w-7 text-forest" />
                <h3 className="font-semibold text-forest-deep">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
          <Link
            href="/apply"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 font-semibold text-white transition-colors hover:bg-forest-deep"
          >
            Start an application
          </Link>
        </div>
      </section>

      <section className="bg-sage/40 py-16 md:py-20">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-semibold text-forest-deep">For Supporters</h2>
          <p className="mt-2 text-muted-foreground">How your support reaches a real classroom.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {supporterSteps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl bg-card p-7 ring-1 ring-border">
                <span className="absolute right-5 top-5 font-display text-4xl font-semibold text-sage">{i + 1}</span>
                <s.icon className="mb-4 h-7 w-7 text-forest" />
                <h3 className="font-semibold text-forest-deep">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/students"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 font-semibold text-white transition-colors hover:bg-forest-deep"
            >
              Explore students
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full border border-forest/25 px-7 py-3.5 font-semibold text-forest transition-colors hover:bg-sage"
            >
              Become a supporter
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-tight max-w-3xl">
          <div className="flex gap-4 rounded-2xl border border-gold/40 bg-gold/10 p-6">
            <Info className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <h2 className="font-semibold text-forest-deep">About payments</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Sponsia is in its pre-launch phase, and online payment collection is not yet available. Sponsorship
                begins with an enquiry and a conversation with our team — we will personally guide you through the next
                steps. This keeps every contribution accountable while we complete our payment and reporting
                infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
