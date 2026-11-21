'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, Save, Mail, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type DonorEnquiry, type ContactEnquiry, type EnquiryStatus, formatDate, formatPKR } from '@/lib/types';
import { ENQUIRY_STATUS_LABEL, SPONSORSHIP_TYPE_LABEL } from '@/lib/form-constants';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const statusStyle: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  interested: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-200 text-gray-700',
};

type Row = DonorEnquiry | ContactEnquiry;

function isDonor(r: Row): r is DonorEnquiry {
  return 'donor_name' in r;
}

const STATUSES: EnquiryStatus[] = ['new', 'contacted', 'interested', 'closed'];

export function EnquiriesTable({ kind }: { kind: 'donor' | 'contact' }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EnquiryStatus | 'all'>('all');
  const [selected, setSelected] = useState<Row | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from(kind === 'donor' ? 'donor_enquiries' : 'contact_enquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setRows(data ?? []);
        setLoading(false);
      });
  }, [kind]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (q) {
        const hay = isDonor(r)
          ? `${r.enquiry_code} ${r.donor_name} ${r.donor_email} ${r.country} ${r.student_name ?? ''} ${r.message}`
          : `${r.enquiry_code} ${r.full_name} ${r.email} ${r.country} ${r.subject} ${r.message}`;
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, status, kind]);

  async function updateStatus(row: Row, next: EnquiryStatus) {
    const { error } = await createClient()
      .from(kind === 'donor' ? 'donor_enquiries' : 'contact_enquiries')
      .update({ status: next })
      .eq('id', row.id);
    if (error) return toast.error('Could not update the status.');
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
    if (selected?.id === row.id) setSelected({ ...selected, status: next });
    toast.success(`Marked as ${ENQUIRY_STATUS_LABEL[next]}.`);
  }

  async function saveNote() {
    if (!selected) return;
    setSaving(true);
    const { error } = await createClient()
      .from(kind === 'donor' ? 'donor_enquiries' : 'contact_enquiries')
      .update({ admin_notes: noteDraft })
      .eq('id', selected.id);
    setSaving(false);
    if (error) return toast.error('Could not save the note.');
    setRows((rs) => rs.map((r) => (r.id === selected.id ? { ...r, admin_notes: noteDraft } : r)));
    toast.success('Private note saved.');
  }

  function openDetail(r: Row) {
    setSelected(r);
    setNoteDraft(r.admin_notes ?? '');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, reference…"
              className="rounded-full bg-card pl-11"
              aria-label="Search enquiries"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as EnquiryStatus | 'all')}>
            <SelectTrigger className="w-full rounded-full bg-card sm:w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{ENQUIRY_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-forest/25 bg-card px-8 py-14 text-center">
            <h2 className="font-display text-lg font-semibold text-forest-deep">No enquiries found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {rows.length === 0
                ? kind === 'donor'
                  ? 'Sponsorship enquiries from the website will appear here.'
                  : 'Messages from the contact form will appear here.'
                : 'Try changing your search or filter.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => {
              const name = isDonor(r) ? r.donor_name : r.full_name;
              const email = isDonor(r) ? r.donor_email : r.email;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => openDetail(r)}
                    className={cn(
                      'w-full rounded-2xl border p-5 text-left transition-all hover:shadow-md',
                      selected?.id === r.id ? 'border-forest bg-sage/30' : 'border-border bg-card'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-charcoal">
                        <span className="font-mono text-xs text-forest">{r.enquiry_code}</span> · {name}
                      </p>
                      <Badge className={cn('border-0', statusStyle[r.status])}>
                        {ENQUIRY_STATUS_LABEL[r.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {email} · {r.country} · {formatDate(r.created_at)}
                    </p>
                    {isDonor(r) && r.student_name && (
                      <p className="mt-1 text-sm text-forest">Interested in: {r.student_name} ({r.student_public_code})</p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.message}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <aside className="xl:sticky xl:top-8 xl:self-start">
        {selected ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-forest-deep">
                  {isDonor(selected) ? selected.donor_name : selected.full_name}
                </h2>
                <p className="font-mono text-xs text-muted-foreground">{selected.enquiry_code}</p>
              </div>
              <Badge className={cn('border-0', statusStyle[selected.status])}>
                {ENQUIRY_STATUS_LABEL[selected.status]}
              </Badge>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-forest" />
                <a
                  href={`mailto:${isDonor(selected) ? selected.donor_email : selected.email}`}
                  className="break-all font-medium text-forest hover:underline"
                >
                  {isDonor(selected) ? selected.donor_email : selected.email}
                </a>
              </div>
              {isDonor(selected) && selected.donor_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-forest" />
                  <a href={`tel:${selected.donor_phone}`} className="font-medium text-forest hover:underline">
                    {selected.donor_phone}
                  </a>
                </div>
              )}
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Country</dt><dd className="text-charcoal">{selected.country}</dd></div>
              {isDonor(selected) ? (
                <>
                  {selected.student_public_code && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">Student</dt>
                      <dd className="text-charcoal">{selected.student_name} ({selected.student_public_code})</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Sponsorship type</dt>
                    <dd className="text-charcoal">{SPONSORSHIP_TYPE_LABEL[selected.sponsorship_type]}</dd>
                  </div>
                  {selected.proposed_amount_pkr != null && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">Proposed amount</dt>
                      <dd className="text-charcoal">{formatPKR(selected.proposed_amount_pkr)}</dd>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Subject</dt>
                  <dd className="text-charcoal">{selected.subject}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Message</dt>
                <dd className="mt-1 whitespace-pre-line leading-relaxed text-charcoal">{selected.message}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Received</dt>
                <dd className="text-charcoal">{formatDate(selected.created_at)}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</label>
              <Select value={selected.status} onValueChange={(v) => updateStatus(selected, v as EnquiryStatus)}>
                <SelectTrigger className="mt-2 rounded-full" aria-label="Enquiry status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{ENQUIRY_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Private notes</label>
              <Textarea
                rows={4}
                className="mt-2"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Notes are never shown publicly…"
                aria-label="Private notes"
              />
              <Button onClick={saveNote} disabled={saving} size="sm" className="mt-3 rounded-full bg-forest text-white hover:bg-forest-deep">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save note
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Select an enquiry to read the full message, update its status and add private notes.
          </div>
        )}
      </aside>
    </div>
  );
}
