import { ShieldCheck, Clock, UserCheck, FileCheck2 } from 'lucide-react';
import { ApplicationForm } from '@/components/site/application-form';

export const metadata = { title: 'Apply for Support' };

const assurances = [
  {
    icon: ShieldCheck,
    title: 'Private and secure',
    text: 'Your documents and personal details are stored privately and are never shown publicly without your consent.',
  },
  {
    icon: UserCheck,
    title: 'Personally reviewed',
    text: 'Every application is read and verified by the Sponsia team — not an algorithm.',
  },
  {
    icon: Clock,
    title: 'No account needed',
    text: 'Just fill in the form. You will receive a reference number to track your application.',
  },
  {
    icon: FileCheck2,
    title: 'Anonymous options',
    text: 'If approved, you choose what appears publicly — including staying anonymous.',
  },
];

export default function ApplyPage() {
  return (
    <div>
      <section className="bg-forest-deep py-16 text-white md:py-20">
        <div className="container-tight max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">Apply for Support</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Tell us about your education.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            If financial difficulties are putting your education at risk, we want to hear from you. The form takes
            about 15 minutes, and every application is personally reviewed by our team.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-tight">
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {assurances.map((a) => (
              <div key={a.title} className="rounded-2xl border border-border bg-card p-5">
                <a.icon className="mb-3 h-5 w-5 text-forest" />
                <h2 className="text-sm font-semibold text-forest-deep">{a.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.text}</p>
              </div>
            ))}
          </div>

          <ApplicationForm />
        </div>
      </section>
    </div>
  );
}
