import Link from 'next/link';
import { GraduationCap, Facebook, Instagram, Linkedin, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import type { WebsiteSettings } from '@/lib/types';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
          light ? 'bg-white/10' : 'bg-forest'
        }`}
      >
        <GraduationCap className={`h-5 w-5 ${light ? 'text-white' : 'text-white'}`} />
      </span>
      <span className="leading-tight">
        <span className={`block font-display text-lg font-semibold ${light ? 'text-white' : 'text-forest-deep'}`}>
          Sponsia
        </span>
      </span>
    </Link>
  );
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/students', label: 'Explore Students' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
];

export function SiteFooter({ settings }: { settings: WebsiteSettings }) {
  const socials = [
    { href: settings.facebook_url, icon: Facebook, label: 'Facebook' },
    { href: settings.instagram_url, icon: Instagram, label: 'Instagram' },
    { href: settings.linkedin_url, icon: Linkedin, label: 'LinkedIn' },
    { href: settings.twitter_url, icon: Twitter, label: 'Twitter' },
    { href: settings.youtube_url, icon: Youtube, label: 'YouTube' },
  ].filter((s) => s.href);

  return (
    <footer className="bg-forest-deep text-white">
      <div className="container-tight grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo light />
          <p className="text-sm leading-relaxed text-white/70">{settings.site_description}</p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Explore</h3>
          <ul className="space-y-2.5 text-sm">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/75 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/apply" className="text-white/75 transition-colors hover:text-white">
                Apply for Support
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Contact</h3>
          <ul className="space-y-2.5 text-sm text-white/75">
            {settings.contact_email !== '[Edit in Settings: official email]' && (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                <a href={`mailto:${settings.contact_email}`} className="hover:text-white">{settings.contact_email}</a>
              </li>
            )}
            {settings.contact_phone !== '[Edit in Settings: phone number]' && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                <a href={`tel:${settings.contact_phone}`} className="hover:text-white">{settings.contact_phone}</a>
              </li>
            )}
            {settings.office_address !== '[Edit in Settings: office address]' && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                <span>{settings.office_address}</span>
              </li>
            )}
          </ul>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Legal</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/privacy" className="text-white/75 transition-colors hover:text-white">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms" className="text-white/75 transition-colors hover:text-white">Terms and Conditions</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-tight flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Sponsia. Every Student Deserves a Chance.</p>
          <p>Pre-launch phase — online donations are not yet accepted.</p>
        </div>
      </div>
    </footer>
  );
}
