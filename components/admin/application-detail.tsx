'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2, ArrowLeft, FileDown, Lock, Save, Globe2, FileText,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  type StudentApplication, type StudentConsents, type StudentDocument,
  type ApplicationStatus, formatDate, formatPKR, educationLevelLabel,
} from '@/lib/types';
import { STATUS_LABEL } from '@/lib/form-constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const docTypeLabels: Record<string, string> = {
  photo: 'Student photograph',
  fee_challan: 'Fee challan / fee structure',
  academic_result: 'Academic result / marksheet',
  other: 'Other document',
};

export function ApplicationDetail({ id }: { id: string }) {
  const router = useRouter();
  const [app, setApp] = useState<StudentApplication | null>(null);
  const [consents, setConsents] = useState<StudentConsents | null>(null);
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: a }, { data: c }, { data: d }, { data: p }] = await Promise.all([
        supabase.from('student_applications').select('*').eq('id', id).maybeSingle(),
        supabase.from('student_consents').select('*').eq('application_id', id).maybeSingle(),
        supabase.from('student_documents').select('*').eq('application_id', id).order('created_at'),
        supabase.from('student_public_profiles').select('id').eq('application_id', id).maybeSingle(),
      ]);
      if (!a) { setApp(null); setLoading(false); return; }
      setApp(a);
      setAdminNote(a.admin_notes ?? '');
      setConsents(c);
      setDocs(d ?? []);
      setProfileExists(!!p);
      setLoading(false);
    })();
  }, [id]);

  async function downloadDoc(doc: StudentDocument) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('application-documents')
      .createSignedUrl(doc.storage_path, 300);
    if (error || !data) {
      toast.error('Could not open the document.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function saveEdits() {
    if (!app) return;
    setSaving(true);
    const { error } = await createClient()
      .from('student_applications')
      .update({
        full_name: app.full_name,
        guardian_name: app.guardian_name,
        guardian_phone: app.guardian_phone,
        city: app.city,
        district: app.district,
        current_grade: app.current_grade,
        academic_performance: app.academic_performance,
        educational_goal: app.educational_goal,
        support_reason: app.support_reason,
        expenses_monthly: app.expenses_monthly,
        expense_tuition: app.expense_tuition,
        expense_books: app.expense_books,
        expense_uniform: app.expense_uniform,
        expense_transport: app.expense_transport,
        expense_other: app.expense_other,
      })
      .eq('id', id);
    setSaving(false);
    if (error) toast.error('Could not save changes.');
    else toast.success('Application updated.');
  }

  async function changeStatus(status: ApplicationStatus) {
    const { error } = await createClient()
      .from('student_applications')
      .update({ status })
      .eq('id', id);
    if (error) return toast.error('Could not update the status.');
    setApp((a) => (a ? { ...a, status } : a));
    toast.success(`Status changed to ${STATUS_LABEL[status]}.`);
  }

  async function addNote() {
    if (!note.trim()) return;
    const merged = [adminNote, note.trim()].filter(Boolean).join('\n\n---\n\n');
    const { error } = await createClient()
      .from('student_applications')
      .update({ admin_notes: merged })
      .eq('id', id);
    if (error) return toast.error('Could not save the note.');
    setAdminNote(merged);
    setNote('');
    toast.success('Private note added.');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <p className="font-medium text-charcoal">Application not found.</p>
        <Link href="/admin/applications" className="mt-4 inline-block font-semibold text-forest hover:underline">
          ← Back to all applications
        </Link>
      </div>
    );
  }

  const consentFlags = consents
    ? [
        ['Real name', consents.consent_name],
        ['Photograph', consents.consent_photo],
        ['Educational story', consents.consent_story],
        ['School name', consents.consent_school],
        ['Location', consents.consent_location],
        ['Progress updates', consents.consent_progress_updates],
      ] as [string, boolean][]
    : [];

  const num = (v: number | null) => (v == null ? '' : String(v));
  const parseNum = (v: string) => (v === '' ? null : Number(v));

  return (
    <div>
      <Link href="/admin/applications" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-forest">
        <ArrowLeft className="h-4 w-4" /> All applications
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest-deep">
            <span className="font-mono text-2xl text-forest">{app.application_code}</span> · {app.full_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Submitted {formatDate(app.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={app.status} onValueChange={(v) => changeStatus(v as ApplicationStatus)}>
            <SelectTrigger className="w-44 rounded-full" aria-label="Application status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['pending', 'under_review', 'approved', 'rejected', 'archived'] as ApplicationStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {app.status === 'approved' && (
            profileExists ? (
              <Button asChild className="rounded-full bg-forest text-white hover:bg-forest-deep">
                <Link href={`/admin/applications/${app.id}/profile`}>
                  <Globe2 className="h-4 w-4" /> Edit Public Profile
                </Link>
              </Button>
            ) : (
              <Button asChild className="rounded-full bg-gold text-forest-deep hover:brightness-105">
                <Link href={`/admin/applications/${app.id}/profile`}>
                  <Globe2 className="h-4 w-4" /> Edit &amp; Prepare Public Profile
                </Link>
              </Button>
            )
          )}
        </div>
      </div>

      {app.status !== 'approved' && (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Public profile preparation is unavailable while this application is <strong>{STATUS_LABEL[app.status]}</strong>.
          An admin must approve it first. This message does not change the application status.
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Personal information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Full legal name" value={app.full_name} />
              <Info label="Date of birth" value={formatDate(app.date_of_birth)} />
              <Info label="Guardian" value={`${app.guardian_name} · ${app.guardian_phone}`} />
              <Info label="Student phone" value={app.student_phone ?? '—'} />
              <Info label="Email" value={app.email ?? '—'} />
              <Info label="City / District" value={`${app.city}, ${app.district}`} />
              <Info label="Address (private)" value={app.address} />
            </div>
          </Section>

          <Section title="Educational information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Education level" value={educationLevelLabel(app.education_level)} />
              <Info label="Institution" value={app.institution_name} />
              <Info label="Current grade" value={app.current_grade} />
              <Info label="Academic performance" value={app.academic_performance ?? '—'} />
              <Info label="At risk of discontinuing" value={app.at_risk ? 'Yes' : 'No'} />
            </div>
            <Info label="Future educational goal" value={app.educational_goal ?? '—'} paragraph />
            <Info label="Why financial support is needed" value={app.support_reason ?? '—'} paragraph />
          </Section>

          <Section title="Financial information (PKR / month)">
            <div className="grid gap-4 sm:grid-cols-3">
              <Info label="Total expenses" value={formatPKR(app.expenses_monthly)} />
              <Info label="Tuition fees" value={formatPKR(app.expense_tuition)} />
              <Info label="Books & stationery" value={formatPKR(app.expense_books)} />
              <Info label="Uniform" value={formatPKR(app.expense_uniform)} />
              <Info label="Transport" value={formatPKR(app.expense_transport)} />
              <Info label="Other" value={formatPKR(app.expense_other)} />
            </div>
          </Section>

          <Section title="Edit application">
            <div className="grid gap-4 sm:grid-cols-2">
              <EditField label="Full name" value={app.full_name} onChange={(v) => setApp({ ...app, full_name: v })} />
              <EditField label="Guardian name" value={app.guardian_name} onChange={(v) => setApp({ ...app, guardian_name: v })} />
              <EditField label="Guardian phone" value={app.guardian_phone} onChange={(v) => setApp({ ...app, guardian_phone: v })} />
              <EditField label="City" value={app.city} onChange={(v) => setApp({ ...app, city: v })} />
              <EditField label="District" value={app.district} onChange={(v) => setApp({ ...app, district: v })} />
              <EditField label="Current grade" value={app.current_grade} onChange={(v) => setApp({ ...app, current_grade: v })} />
              <EditField label="Total monthly expenses (PKR)" type="number" value={num(app.expenses_monthly)} onChange={(v) => setApp({ ...app, expenses_monthly: parseNum(v) })} />
              <EditField label="Tuition fees (PKR)" type="number" value={num(app.expense_tuition)} onChange={(v) => setApp({ ...app, expense_tuition: parseNum(v) })} />
              <EditField label="Books (PKR)" type="number" value={num(app.expense_books)} onChange={(v) => setApp({ ...app, expense_books: parseNum(v) })} />
              <EditField label="Uniform (PKR)" type="number" value={num(app.expense_uniform)} onChange={(v) => setApp({ ...app, expense_uniform: parseNum(v) })} />
              <EditField label="Transport (PKR)" type="number" value={num(app.expense_transport)} onChange={(v) => setApp({ ...app, expense_transport: parseNum(v) })} />
              <EditField label="Other (PKR)" type="number" value={num(app.expense_other)} onChange={(v) => setApp({ ...app, expense_other: parseNum(v) })} />
            </div>
            <div className="mt-4">
              <Label htmlFor="ed-goal">Future educational goal</Label>
              <Textarea id="ed-goal" rows={2} className="mt-1" value={app.educational_goal ?? ''} onChange={(e) => setApp({ ...app, educational_goal: e.target.value })} />
            </div>
            <div className="mt-4">
              <Label htmlFor="ed-reason">Why support is needed</Label>
              <Textarea id="ed-reason" rows={3} className="mt-1" value={app.support_reason ?? ''} onChange={(e) => setApp({ ...app, support_reason: e.target.value })} />
            </div>
            <Button onClick={saveEdits} disabled={saving} className="mt-5 rounded-full bg-forest text-white hover:bg-forest-deep">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </Button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Documents">
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents were uploaded.</p>
            ) : (
              <ul className="space-y-3">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-ivory p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {docTypeLabels[d.doc_type] ?? d.doc_type}
                      </p>
                      <p className="truncate text-sm font-medium text-charcoal">{d.original_filename}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => downloadDoc(d)} className="shrink-0 rounded-full">
                      <FileDown className="h-4 w-4" /> Open
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Documents open in short-lived, authorisation-checked links.
            </p>
          </Section>

          <Section title="Consent record">
            {consents ? (
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-muted-foreground">Information accurate</span><Badge variant={consents.confirm_accurate ? 'default' : 'secondary'} className="bg-forest text-white">{consents.confirm_accurate ? 'Yes' : 'No'}</Badge></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Guardian consent</span><Badge variant={consents.guardian_consent ? 'default' : 'secondary'} className={consents.guardian_consent ? 'bg-forest text-white' : ''}>{consents.guardian_consent ? 'Yes' : 'No'}</Badge></li>
                {consentFlags.map(([label, ok]) => (
                  <li key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <Badge variant={ok ? 'default' : 'secondary'} className={ok ? 'bg-forest text-white' : ''}>{ok ? 'Allowed' : 'Declined'}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No consent record found.</p>
            )}
          </Section>

          <Section title="Private notes">
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a private note (never shown publicly)…"
              aria-label="New private note"
            />
            <Button onClick={addNote} disabled={!note.trim()} className="mt-3 rounded-full bg-forest text-white hover:bg-forest-deep">
              Add note
            </Button>
            {adminNote && (
              <div className="mt-4 whitespace-pre-line rounded-xl bg-ivory p-4 text-sm text-muted-foreground">
                {adminNote}
              </div>
            )}
          </Section>

          {app.status !== 'archived' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-full text-destructive hover:bg-destructive/10">
                  Archive application
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive this application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Archived applications are hidden from the default list but the record is preserved. You can
                    restore it anytime by changing the status.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => changeStatus('archived')}
                  >
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {app.status === 'archived' && (
            <Button variant="outline" onClick={() => changeStatus('pending')} className="w-full rounded-full">
              Restore to pending
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-5 font-display text-lg font-semibold text-forest-deep">{title}</h2>
      {children}
    </div>
  );
}

function Info({ label, value, paragraph }: { label: string; value: string; paragraph?: boolean }) {
  return (
    <div className={paragraph ? 'sm:col-span-2 mt-4' : ''}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm text-charcoal ${paragraph ? 'leading-relaxed' : 'font-medium break-words'}`}>{value || '—'}</p>
    </div>
  );
}

function EditField({
  label, value, onChange, type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={`edit-${label}`}>{label}</Label>
      <Input id={`edit-${label}`} type={type} className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
