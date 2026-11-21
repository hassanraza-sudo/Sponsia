import { Mail, Phone, MapPin, MessageCircle, Facebook, Instagram, Linkedin } from 'lucide-react';
import { getSettings } from '@/lib/settings';
import { EnquiryForm } from '@/components/site/enquiry-form';

export const metadata = { title: 'Contact Us' };
export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const settings = await getSettings();

  const hasEmail = settings.contact_email && !settings.contact_email.startsWith('[');
  const hasPhone = settings.contact_phone && !settings.contact_phone.startsWith('[');
  const hasWhatsApp = settings.contact_whatsapp && !settings.contact_whatsapp.startsWith('[');
  const hasAddress = settings.office_address && !settings.office_address.startsWith('[');
  const socials = [
    { href: settings.facebook_url, icon: Facebook, label: 'Facebook' },
    { href: settings.instagram_url, icon: Instagram, label: 'Instagram' },
    { href: settings.linkedin_url, icon: Linkedin, label: 'LinkedIn' },
  ].filter((s) => s.href);

  const details = [
    { icon: Mail, label: 'Official email', value: settings.contact_email, ok: !!hasEmail, href: hasEmail ? `mailto:${settings.contact_email}` : undefined },
    { icon: Phone, label: 'Phone', value: settings.contact_phone, ok: !!hasPhone, href: hasPhone ? `tel:${settings.contact_phone}` : undefined },
    { icon: MessageCircle, label: 'WhatsApp', value: settings.contact_whatsapp, ok: !!hasWhatsApp },
    { icon: MapPin, label: 'Office address', value: settings.office_address, ok: !!hasAddress },
  ];

  return (
    <div>
      <section className="bg-forest-deep py-16 text-white md:py-20">
        <div className="container-tight max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">Contact Us</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Let’s Connect</h1>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            Have a question, want to support a student, or interested in partnering with us? We’d love to hear
            from you.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-tight grid gap-12 lg:grid-cols-[2fr_3fr]">
          <div className="space-y-4">
            {details.map((d) => (
              <div key={d.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage">
                    <d.icon className="h-5 w-5 text-forest" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{d.label}</p>
                    {d.ok ? (
                      <p className="mt-1 break-words text-sm font-medium text-charcoal">
                        {d.href ? (
                          <a href={d.href} className="hover:text-forest">{d.value}</a>
                        ) : (
                          d.value
                        )}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm italic text-muted-foreground/70">
                        Placeholder — the site owner can set this in the admin Settings.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {socials.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Follow us</p>
                <div className="flex gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-forest transition-colors hover:bg-forest hover:text-white"
                    >
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
            <h2 className="font-display text-2xl font-semibold text-forest-deep">Send us a message</h2>
            <p className="mb-8 mt-2 text-sm text-muted-foreground">
              We read every message and reply as soon as we can.
            </p>
            <EnquiryForm kind="contact" />
          </div>
        </div>
      </section>
    </div>
  );
}
