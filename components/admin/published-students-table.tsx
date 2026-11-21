'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  type ApplicationStatus, type StudentPublicProfile, formatDate, formatPKR, educationLevelLabel, resolvedDisplayName,
} from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function PublishedStudentsTable() {
  const [profiles, setProfiles] = useState<(StudentPublicProfile & {
    application?: { full_name: string; status: ApplicationStatus } | null;
  })[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('student_public_profiles')
      .select('*, application:student_applications(full_name, status)')
      .order('updated_at', { ascending: false });
    if (error) console.error(error);
    setProfiles((data as typeof profiles) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(p: (typeof profiles)[number]) {
    const publish = p.publication_status !== 'published';
    const supabase = createClient();
    if (publish) {
      const { data: application, error: statusError } = await supabase
        .from('student_applications')
        .select('status')
        .eq('id', p.application_id)
        .maybeSingle();
      if (statusError) {
        console.error('Could not verify the linked application status before publishing.', statusError);
        toast.error('Could not verify application approval. The profile was not published.');
        return;
      }
      if (application?.status !== 'approved') {
        toast.error('Only profiles linked to approved applications can be published.');
        load();
        return;
      }
    }

    const { error } = await supabase
      .from('student_public_profiles')
      .update(
        publish
          ? { publication_status: 'published', published_at: new Date().toISOString() }
          : { publication_status: 'draft', published_at: null }
      )
      .eq('id', p.id);
    if (error) {
      toast.error(error.message.includes('Guardian consent')
        ? 'Guardian consent is required before publishing a minor’s profile.'
        : 'Could not update the profile.');
      return;
    }
    toast.success(publish ? 'Profile published.' : 'Profile unpublished.');
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-forest/25 bg-card px-8 py-16 text-center">
        <h2 className="font-display text-lg font-semibold text-forest-deep">No public profiles yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Approve a student application, then open it and choose “Edit &amp; Prepare Public Profile” to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-sage/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-4 font-medium">Profile</th>
            <th className="px-5 py-4 font-medium">Student (private)</th>
            <th className="px-5 py-4 font-medium">Level</th>
            <th className="px-5 py-4 font-medium">Support</th>
            <th className="px-5 py-4 font-medium">Amount</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {profiles.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-sage/20">
              <td className="px-5 py-4">
                <Link href={`/students/${p.public_code.toLowerCase()}`} target="_blank" className="font-semibold text-forest hover:underline">
                  {resolvedDisplayName(p.display_mode, p.display_name, null, p.public_code)}
                </Link>
                <p className="font-mono text-xs text-muted-foreground">{p.public_code}</p>
              </td>
              <td className="px-5 py-4 text-muted-foreground">{p.application?.full_name ?? '—'}</td>
              <td className="px-5 py-4 text-muted-foreground">{educationLevelLabel(p.education_level)}</td>
              <td className="px-5 py-4 text-muted-foreground capitalize">{p.support_category}</td>
              <td className="px-5 py-4 text-muted-foreground">
                {p.show_amount && p.estimated_amount_pkr != null ? formatPKR(p.estimated_amount_pkr) : '—'}
              </td>
              <td className="px-5 py-4">
                <Badge className={p.publication_status === 'published'
                  ? 'bg-emerald-600 text-white border-0'
                  : 'bg-amber-100 text-amber-800 border-0'}
                >
                  {p.publication_status === 'published'
                    ? `Live${p.published_at ? ` · ${formatDate(p.published_at)}` : ''}`
                    : 'Draft'}
                </Badge>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href={`/admin/applications/${p.application_id}/profile`}>Edit</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => togglePublish(p)}
                    disabled={p.publication_status !== 'published' && p.application?.status !== 'approved'}
                    title={p.publication_status !== 'published' && p.application?.status !== 'approved'
                      ? 'Only profiles linked to approved applications can be published.'
                      : undefined}
                  >
                    {p.publication_status === 'published'
                      ? <><EyeOff className="h-4 w-4" /> Unpublish</>
                      : <><Eye className="h-4 w-4" /> Publish</>}
                  </Button>
                </div>
                {p.publication_status !== 'published' && p.application?.status !== 'approved' && (
                  <p className="mt-2 max-w-48 text-xs text-muted-foreground">
                    Approval is required before publishing.
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
