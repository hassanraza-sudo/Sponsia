import Link from 'next/link';
import {
  FileText, Clock3, CircleDot, CheckCircle2, XCircle, Globe2, HeartHandshake, Mail, ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface CountRow {
  status: string;
  count: number;
}

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [appsRes, profilesRes, donorRes, contactRes] = await Promise.all([
    supabase.from('student_applications').select('status'),
    supabase.from('student_public_profiles').select('publication_status').eq('publication_status', 'published'),
    supabase.from('donor_enquiries').select('status'),
    supabase.from('contact_enquiries').select('status'),
  ]);

  const appCounts: Record<string, number> = {};
  ((appsRes.data ?? []) as CountRow[]).forEach((r) => {
    appCounts[r.status] = (appCounts[r.status] ?? 0) + 1;
  });
  const donorCounts: Record<string, number> = {};
  ((donorRes.data ?? []) as CountRow[]).forEach((r) => {
    donorCounts[r.status] = (donorCounts[r.status] ?? 0) + 1;
  });
  const contactCount = (contactRes.data ?? []).length;

  const stats = [
    { label: 'Total applications', value: (appsRes.data ?? []).length, icon: FileText, href: '/admin/applications' },
    { label: 'Pending', value: appCounts['pending'] ?? 0, icon: Clock3, href: '/admin/applications?status=pending' },
    { label: 'Under review', value: appCounts['under_review'] ?? 0, icon: CircleDot, href: '/admin/applications?status=under_review' },
    { label: 'Approved', value: appCounts['approved'] ?? 0, icon: CheckCircle2, href: '/admin/applications?status=approved' },
    { label: 'Rejected', value: appCounts['rejected'] ?? 0, icon: XCircle, href: '/admin/applications?status=rejected' },
    { label: 'Published students', value: (profilesRes.data ?? []).length, icon: Globe2, href: '/admin/profiles' },
    { label: 'New donor enquiries', value: donorCounts['new'] ?? 0, icon: HeartHandshake, href: '/admin/donor-enquiries' },
    { label: 'Contact enquiries', value: contactCount, icon: Mail, href: '/admin/contact-enquiries' },
  ];

  const { data: recent } = await supabase
    .from('student_applications')
    .select('application_code, full_name, city, education_level, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-forest-deep">Dashboard Overview</h1>
      <p className="mt-1 text-muted-foreground">Live figures from the platform database.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest/5"
          >
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-forest" />
              <ArrowRight className="h-4 w-4 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
            </div>
            <p className="mt-4 font-display text-3xl font-semibold text-forest-deep">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-forest-deep">Recent applications</h2>
          <Link href="/admin/applications" className="text-sm font-medium text-forest hover:underline">
            View all
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <ul className="divide-y divide-border">
            {recent.map((a) => (
              <li key={a.application_code}>
                <Link
                  href={`/admin/applications?search=${a.application_code}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 transition-colors hover:bg-sage/30"
                >
                  <div>
                    <p className="font-medium text-charcoal">
                      <span className="font-mono text-sm text-forest">{a.application_code}</span> · {a.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{a.city} · {formatDate(a.created_at)}</p>
                  </div>
                  <span className="rounded-full bg-sage px-3 py-1 text-xs font-medium capitalize text-forest">
                    {a.status.replace('_', ' ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No applications yet. When a student applies through the website, they will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
