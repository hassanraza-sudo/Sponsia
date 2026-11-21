'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, Globe2, HeartHandshake, Mail, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/site/site-footer';

const links = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/applications', label: 'Student Applications', icon: FileText },
  { href: '/admin/profiles', label: 'Published Students', icon: Globe2 },
  { href: '/admin/donor-enquiries', label: 'Donor Enquiries', icon: HeartHandshake },
  { href: '/admin/contact-enquiries', label: 'Contact Enquiries', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
              active ? 'bg-forest text-white' : 'text-charcoal hover:bg-sage'
            )}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
      <button
        onClick={signOut}
        className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-ivory px-4 lg:hidden">
        <Logo />
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle admin menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-sage"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-b border-border bg-ivory px-4 py-3 lg:hidden">
          {nav}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-ivory p-6 lg:flex">
        <div className="mb-8"><Logo /></div>
        {nav}
        <p className="mt-4 truncate text-xs text-muted-foreground" title={email}>{email}</p>
      </aside>
    </>
  );
}

export function useAdminEmail(): string {
  const [email, setEmail] = useState('');
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
  }, []);
  return email;
}
