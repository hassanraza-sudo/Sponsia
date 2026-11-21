import Link from 'next/link';
import { ArrowRight, Target, Eye, HeartHandshake, ShieldCheck, Lock, Compass } from 'lucide-react';

export const metadata = { title: 'About Us' };

const values = [
  {
    icon: HeartHandshake,
    title: 'Dignity first',
    text: 'We never trade a student’s dignity for donations. Profiles are shared with consent, care and respect.',
  },
  {
    icon: ShieldCheck,
    title: 'Verification before publication',
    text: 'Nothing appears on this website until we have personally reviewed and verified it.',
  },
  {
    icon: Lock,
    title: 'Privacy by default',
    text: 'Students choose what is public. Anonymous profiles are supported and never disadvantaged.',
  },
  {
    icon: Compass,
    title: 'Transparency',
    text: 'Supporters see the real educational needs behind every profile — no inflated figures, no vague promises.',
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-forest-deep py-16 text-white md:py-20">
        <div className="container-tight max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">About Us</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            A friend of education, when it matters most.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            Sponsia is inspired by the idea of being <em>a friend of education</em>. We exist for one reason: to make sure
            that a family’s financial situation never decides whether a child stays in school.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-tight grid gap-12 lg:grid-cols-2">
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-2xl font-semibold text-forest-deep">Our Story</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Sponsia began with a simple observation: across Pakistan, students with real ability leave
                education every year for one reason alone — money. Not talent, not ambition, not effort. The cost of
                fees, books, a uniform, or a bus ride.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                We built this platform to connect those students with people who can help — carefully, transparently,
                and with the student’s dignity at the centre of everything.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-forest-deep">Why Sponsia Exists</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Many generous people want to educate a child but do not know where to start — whom to trust, how to
                verify a need, how to help without middlemen. At the same time, many families need support but have no
                safe, respectful way to ask. Sponsia bridges that gap: students apply, we verify, and supporters
                connect with confidence.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-forest-deep">Our Approach to Student Verification</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Every application is reviewed by our team, not an algorithm. We check educational details, speak with
                guardians where appropriate, and review supporting documents such as fee challans and academic
                records. Only applications that pass this personal review can become public profiles — and even then,
                only the information the family has approved.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-forest-deep">Our Commitment to Transparency</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                We do not publish donation totals, sponsorship counts or impact statistics we cannot stand behind.
                When support is arranged, we share verified educational progress updates with the supporter — with the
                student’s consent. Trust is built slowly, and we intend to keep it.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-forest p-10 text-white">
              <p className="font-display text-2xl leading-snug">
                “We don’t showcase poverty. We showcase potential.”
              </p>
              <p className="mt-4 text-sm text-white/60">The philosophy behind every profile we publish.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <Target className="mb-4 h-7 w-7 text-forest" />
              <h3 className="font-display text-xl font-semibold text-forest-deep">Our Mission</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                To connect financially struggling students with individuals, donors and organisations who believe
                that every child deserves access to education.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <Eye className="mb-4 h-7 w-7 text-forest" />
              <h3 className="font-display text-xl font-semibold text-forest-deep">Our Vision</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                A Pakistan where no student is forced to abandon education because of financial barriers — where
                potential, not circumstance, decides a child’s future.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sage/40 py-16 md:py-20">
        <div className="container-tight">
          <h2 className="text-center font-display text-3xl font-semibold text-forest-deep">Our Values</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-card p-7 ring-1 ring-border">
                <v.icon className="mb-4 h-6 w-6 text-forest" />
                <h3 className="font-semibold text-forest-deep">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/students"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 font-semibold text-white transition-colors hover:bg-forest-deep"
            >
              Meet the students <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
