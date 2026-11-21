'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/students', label: 'Explore Students' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-ivory/90 backdrop-blur-md">
      <div className="container-tight flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth="2">
              <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinejoin="round" />
              <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold text-forest-deep">Sponsia</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                pathname === l.href
                  ? 'bg-forest text-white'
                  : 'text-charcoal hover:bg-sage'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/apply"
            className="hidden items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-forest-deep shadow-sm transition-all hover:shadow-md hover:brightness-105 sm:inline-flex"
          >
            <HeartHandshake className="h-4 w-4" />
            Apply for Support
          </Link>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-charcoal transition-colors hover:bg-sage lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/60 bg-ivory px-4 pb-6 pt-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  pathname === l.href ? 'bg-forest text-white' : 'text-charcoal hover:bg-sage'
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/apply"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl bg-gold px-4 py-3 text-center text-sm font-semibold text-forest-deep"
            >
              Apply for Support
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
