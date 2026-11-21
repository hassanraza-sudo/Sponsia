'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  type StudentApplication, type ApplicationStatus, formatDate, educationLevelLabel,
} from '@/lib/types';
import { STATUS_LABEL } from '@/lib/form-constants';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 10;
const ALL_STATUSES: (ApplicationStatus | 'all')[] = ['all', 'pending', 'under_review', 'approved', 'rejected', 'archived'];

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-200 text-gray-700',
};

export function ApplicationsTable() {
  const params = useSearchParams();
  const [apps, setApps] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | 'all'>(
    (params.get('status') as ApplicationStatus) || 'all'
  );
  const [page, setPage] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('student_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error(error); setError(true); }
        setApps(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((a) => {
      if (status !== 'all' && a.status !== status) return false;
      if (q) {
        const hay = `${a.application_code} ${a.full_name} ${a.city} ${a.district}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [apps, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">
        Could not load applications. Please refresh the page.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by ID, name or city…"
            className="rounded-full bg-card pl-11"
            aria-label="Search applications"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as ApplicationStatus | 'all'); setPage(0); }}>
          <SelectTrigger className="w-full rounded-full bg-card md:w-52" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All statuses' : STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-forest/25 bg-card px-8 py-16 text-center">
          <h2 className="font-display text-lg font-semibold text-forest-deep">No applications found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {apps.length === 0
              ? 'New applications from the website will appear here automatically.'
              : 'Try changing your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-sage/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-4 font-medium">Application ID</th>
                <th className="px-5 py-4 font-medium">Applicant</th>
                <th className="px-5 py-4 font-medium">Level</th>
                <th className="px-5 py-4 font-medium">City</th>
                <th className="px-5 py-4 font-medium">Submitted</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-sage/20">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-forest">{a.application_code}</td>
                  <td className="px-5 py-4 font-medium text-charcoal">{a.full_name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{educationLevelLabel(a.education_level)}</td>
                  <td className="px-5 py-4 text-muted-foreground">{a.city}</td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDate(a.created_at)}</td>
                  <td className="px-5 py-4">
                    <Badge className={`border-0 ${statusStyle[a.status] ?? ''}`}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/applications/${a.id}`}
                      className="font-semibold text-forest hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {pageCount}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
