'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2, CheckCircle2, Upload, Trash2, ShieldCheck, Info, AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EDUCATION_LEVELS, EDUCATION_LABEL, type EducationLevel } from '@/lib/form-constants';

const MAX_FILE_MB = 5;
const MAX_FILES = 8;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

type DocKind = 'photo' | 'fee_challan' | 'academic_result' | 'other';

interface DocEntry {
  file: File;
  kind: DocKind;
}

const docKindLabels: Record<DocKind, string> = {
  photo: 'Student photograph (optional)',
  fee_challan: 'Fee challan or fee structure',
  academic_result: 'Academic result or marksheet',
  other: 'Other supporting document',
};

function validEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

const emptyForm = {
  fullName: '', dob: '', gender: '',
  guardianName: '', guardianPhone: '', studentPhone: '', email: '',
  city: '', district: '', address: '',
  educationLevel: '', institution: '', grade: '', performance: '', goal: '',
  supportReason: '', atRisk: 'yes',
  expensesMonthly: '', tuition: '', books: '', uniform: '', transport: '', other: '', otherNote: '',
};

const sections = ['Personal Information', 'Educational Information', 'Financial Information', 'Documents', 'Consent'] as const;

export function ApplicationForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [consents, setConsents] = useState({
    accurate: false, guardian: false, name: false, photo: false,
    story: false, school: false, location: false, updates: false,
  });
  const [honey, setHoney] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const age = useMemo(() => {
    if (!form.dob) return null;
    const dob = new Date(`${form.dob}T00:00:00`);
    const today = new Date();
    if (Number.isNaN(dob.getTime()) || dob > today) return null;
    return today.getFullYear() - dob.getFullYear()
      - (today.getMonth() < dob.getMonth()
        || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
  }, [form.dob]);

  const isMinor = age == null || age < 18;

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.fullName.trim()) return 'Please enter the student’s full legal name.';
      if (!form.dob) return 'Please provide the date of birth.';
      if (age == null || age < 3 || age > 30) return 'Please enter a valid date of birth.';
      if (!form.guardianName.trim()) return 'Please enter the guardian’s full name.';
      if (!form.guardianPhone.trim()) return 'Please enter the guardian’s phone number.';
      if (form.email && !validEmail(form.email)) return 'Please enter a valid email address.';
      if (!form.city.trim()) return 'Please enter the city.';
      if (!form.district.trim()) return 'Please enter the district.';
      if (!form.address.trim()) return 'Please enter the residential address.';
    }
    if (s === 1) {
      if (!form.educationLevel) return 'Please select the current education level.';
      if (!form.institution.trim()) return 'Please enter the school or college name.';
      if (!form.grade.trim()) return 'Please enter the current class or grade.';
      if (!form.goal.trim() || form.goal.trim().length < 10)
        return 'Please describe the future educational goal (at least 10 characters).';
      if (!form.supportReason.trim() || form.supportReason.trim().length < 20)
        return 'Please explain why financial support is needed (at least 20 characters).';
    }
    if (s === 2) {
      const total = Number(form.expensesMonthly);
      if (!form.expensesMonthly || Number.isNaN(total) || total <= 0)
        return 'Please enter the total monthly educational expenses.';
      for (const v of [form.tuition, form.books, form.uniform, form.transport, form.other]) {
        if (v && (Number.isNaN(Number(v)) || Number(v) < 0)) return 'Expense values must be positive numbers.';
      }
    }
    if (s === 3) {
      if (!docs.some((d) => d.kind === 'fee_challan'))
        return 'Please upload a fee challan or fee structure document.';
      if (!docs.some((d) => d.kind === 'academic_result'))
        return 'Please upload an academic result or marksheet.';
    }
    if (s === 4) {
      if (!consents.accurate) return 'Please confirm that the submitted information is accurate.';
      if (isMinor && !consents.guardian)
        return 'Guardian consent is required because the applicant is a minor.';
      if (!consents.name && !consents.photo && !consents.story)
        return 'Please allow at least one public display option (name, photograph or story) — or contact us to discuss an anonymous application.';
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, sections.length - 1));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: DocEntry[] = [];
    for (const file of Array.from(files)) {
      if (docs.length + next.length >= MAX_FILES) {
        toast.error(`You can upload at most ${MAX_FILES} documents.`);
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`“${file.name}” is not accepted. Use JPG, PNG, WEBP or PDF.`);
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`“${file.name}” is larger than ${MAX_FILE_MB} MB.`);
        continue;
      }
      next.push({ file, kind: next.length === 0 && !docs.some((d) => d.kind === 'fee_challan') ? 'fee_challan' : 'other' });
    }
    if (next.length) setDocs((d) => [...d, ...next]);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function uploadDocs(applicationId: string) {
    const supabase = createClient();
    for (const d of docs) {
      const ext = d.file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${applicationId}/${d.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('application-documents')
        .upload(path, d.file, { contentType: d.file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from('student_documents').insert({
        application_id: applicationId,
        doc_type: d.kind,
        storage_path: path,
        original_filename: d.file.name,
        mime_type: d.file.type,
        size_bytes: d.file.size,
      });
      if (dbErr) throw dbErr;
    }
  }

  async function handleSubmit() {
    for (let s = 0; s <= 4; s++) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        return toast.error(err);
      }
    }
    if (honey) return; // bot — silently drop

    setSubmitting(true);
    let failedStep = 'prepare your application';
    try {
      const supabase = createClient();
      failedStep = 'generate your application reference';
      const { data: code, error: codeErr } = await supabase.rpc('next_public_code', { prefix: 'TD' });
      if (codeErr || !code) throw codeErr || new Error('Could not generate application ID');

      failedStep = 'save your application details';
      const applicationId = crypto.randomUUID();
      const { error: appErr } = await supabase
        .from('student_applications')
        .insert({
          id: applicationId,
          application_code: code,
          full_name: form.fullName.trim(),
          date_of_birth: form.dob,
          gender: form.gender || null,
          guardian_name: form.guardianName.trim(),
          guardian_phone: form.guardianPhone.trim(),
          student_phone: form.studentPhone.trim() || null,
          email: form.email.trim() || null,
          city: form.city.trim(),
          district: form.district.trim(),
          address: form.address.trim(),
          education_level: form.educationLevel,
          institution_name: form.institution.trim(),
          current_grade: form.grade.trim(),
          academic_performance: form.performance.trim() || null,
          educational_goal: form.goal.trim(),
          support_reason: form.supportReason.trim(),
          at_risk: form.atRisk === 'yes',
          expenses_monthly: form.expensesMonthly ? Number(form.expensesMonthly) : null,
          expense_tuition: form.tuition ? Number(form.tuition) : null,
          expense_books: form.books ? Number(form.books) : null,
          expense_uniform: form.uniform ? Number(form.uniform) : null,
          expense_transport: form.transport ? Number(form.transport) : null,
          expense_other: form.other ? Number(form.other) : null,
        });
      if (appErr) throw appErr;

      failedStep = 'save your consent preferences';
      const { error: consErr } = await supabase.from('student_consents').insert({
        application_id: applicationId,
        confirm_accurate: consents.accurate,
        guardian_consent: consents.guardian,
        consent_name: consents.name,
        consent_photo: consents.photo,
        consent_story: consents.story,
        consent_school: consents.school,
        consent_location: consents.location,
        consent_progress_updates: consents.updates,
      });
      if (consErr) throw consErr;

      failedStep = 'upload your supporting documents';
      await uploadDocs(applicationId);

      setDone(code);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(`Application submission failed while attempting to ${failedStep}.`, err);
      toast.error(`We could not ${failedStep}. Please try again, or contact support if the problem continues.`);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-forest" />
        <h2 className="mt-6 font-display text-2xl font-semibold text-forest-deep">Application submitted</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Thank you for applying. Our team will personally review your application and contact you about the
          decision.
        </p>
        <div className="mt-6 rounded-2xl bg-sage/60 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your application reference</p>
          <p className="mt-1 font-display text-3xl font-semibold text-forest-deep">{done}</p>
          <p className="mt-2 text-xs text-muted-foreground">Please save this reference — you may be asked for it when we contact you.</p>
        </div>
        <Button
          onClick={() => router.push('/')}
          className="mt-8 rounded-full bg-forest px-8 py-3 text-white hover:bg-forest-deep"
        >
          Back to home
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <nav aria-label="Form sections" className="hidden lg:block">
        <ol className="sticky top-24 space-y-1">
          {sections.map((s, i) => (
            <li key={s}>
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  i === step
                    ? 'bg-forest font-semibold text-white'
                    : i < step
                      ? 'cursor-pointer text-forest hover:bg-sage'
                      : 'text-muted-foreground'
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  i === step ? 'bg-white/20' : i < step ? 'bg-forest text-white' : 'bg-muted'
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="rounded-3xl border border-border bg-card p-6 md:p-10">
        {/* Progress bar (mobile) */}
        <div className="mb-6 lg:hidden">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>{sections[step]}</span>
            <span>{step + 1} / {sections.length}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-forest transition-all"
              style={{ width: `${((step + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="font-display text-2xl font-semibold text-forest-deep">{sections[step]}</h2>

        {/* STEP 0 — Personal */}
        {step === 0 && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Full legal name *" id="f-name">
                <Input id="f-name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="As written on school records" />
              </Field>
              <Field label="Date of birth *" id="f-dob">
                <Input id="f-dob" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} max={new Date().toISOString().slice(0, 10)} />
              </Field>
            </div>
            {isMinor && (
              <p className="flex items-start gap-2 rounded-xl bg-sage/50 p-4 text-sm text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                The applicant is a minor, so guardian consent will be required in the consent section.
              </p>
            )}
            <Field label="Gender (optional)" id="f-gender">
              <Select value={form.gender || undefined} onValueChange={(v) => set('gender', v)}>
                <SelectTrigger id="f-gender"><SelectValue placeholder="Prefer not to say" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="not_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Guardian’s full name *" id="f-gname">
                <Input id="f-gname" value={form.guardianName} onChange={(e) => set('guardianName', e.target.value)} />
              </Field>
              <Field label="Guardian’s phone number *" id="f-gphone">
                <Input id="f-gphone" type="tel" value={form.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} placeholder="+92 3XX XXXXXXX" />
              </Field>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Student phone number (optional)" id="f-sphone">
                <Input id="f-sphone" type="tel" value={form.studentPhone} onChange={(e) => set('studentPhone', e.target.value)} />
              </Field>
              <Field label="Email address (optional)" id="f-email">
                <Input id="f-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="City *" id="f-city">
                <Input id="f-city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Lahore" />
              </Field>
              <Field label="District *" id="f-district">
                <Input id="f-district" value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="e.g. Lahore" />
              </Field>
            </div>
            <Field label="Complete residential address (private — never shown publicly) *" id="f-address">
              <Textarea id="f-address" rows={3} value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            {/* Honeypot */}
            <div className="hidden" aria-hidden>
              <label htmlFor="f-website">Website</label>
              <input id="f-website" tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} />
            </div>
          </div>
        )}

        {/* STEP 1 — Education */}
        {step === 1 && (
          <div className="mt-8 space-y-6">
            <Field label="Current education level *" id="f-level">
              <Select value={form.educationLevel || undefined} onValueChange={(v) => set('educationLevel', v)}>
                <SelectTrigger id="f-level"><SelectValue placeholder="Select education level" /></SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <p className="flex items-start gap-2 rounded-xl bg-sage/50 p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
              Sponsia currently supports students up to higher secondary / college level. University applicants
              are outside our initial scope.
            </p>
            <Field label="School or college name (private by default) *" id="f-inst">
              <Input id="f-inst" value={form.institution} onChange={(e) => set('institution', e.target.value)} />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Current class or grade *" id="f-grade">
                <Input id="f-grade" value={form.grade} onChange={(e) => set('grade', e.target.value)} placeholder="e.g. Class 8" />
              </Field>
              <Field label="Previous academic performance" id="f-perf">
                <Input id="f-perf" value={form.performance} onChange={(e) => set('performance', e.target.value)} placeholder="e.g. 85% in last exams" />
              </Field>
            </div>
            <Field label="Future educational goal *" id="f-goal">
              <Textarea id="f-goal" rows={3} value={form.goal} onChange={(e) => set('goal', e.target.value)} placeholder="What does the student want to achieve in education?" />
            </Field>
            <Field label="Why does the student need financial support? *" id="f-reason">
              <Textarea id="f-reason" rows={4} value={form.supportReason} onChange={(e) => set('supportReason', e.target.value)} placeholder="Explain the family’s financial situation and why support is needed to continue education." />
            </Field>
            <Field label="Is the student at risk of discontinuing education? *" id="f-risk">
              <RadioGroup value={form.atRisk} onValueChange={(v) => set('atRisk', v)} className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="yes" /> Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="no" /> No
                </label>
              </RadioGroup>
            </Field>
          </div>
        )}

        {/* STEP 2 — Financial */}
        {step === 2 && (
          <div className="mt-8 space-y-6">
            <p className="rounded-xl bg-sage/50 p-4 text-sm text-muted-foreground">
              All amounts in PKR (per month). Provide the best estimate you can — details can be verified later.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Total educational expenses * " id="f-exp-total">
                <Input id="f-exp-total" type="number" min="0" value={form.expensesMonthly} onChange={(e) => set('expensesMonthly', e.target.value)} placeholder="e.g. 6500" />
              </Field>
              <Field label="Tuition fees" id="f-exp-tuition">
                <Input id="f-exp-tuition" type="number" min="0" value={form.tuition} onChange={(e) => set('tuition', e.target.value)} placeholder="PKR per month" />
              </Field>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Books and stationery" id="f-exp-books">
                <Input id="f-exp-books" type="number" min="0" value={form.books} onChange={(e) => set('books', e.target.value)} />
              </Field>
              <Field label="Uniform" id="f-exp-uniform">
                <Input id="f-exp-uniform" type="number" min="0" value={form.uniform} onChange={(e) => set('uniform', e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Transport" id="f-exp-transport">
                <Input id="f-exp-transport" type="number" min="0" value={form.transport} onChange={(e) => set('transport', e.target.value)} />
              </Field>
              <Field label="Other educational expenses" id="f-exp-other">
                <Input id="f-exp-other" type="number" min="0" value={form.other} onChange={(e) => set('other', e.target.value)} />
              </Field>
            </div>
            <Field label="Note about other expenses" id="f-exp-other-note">
              <Input id="f-exp-other-note" value={form.otherNote} onChange={(e) => set('otherNote', e.target.value)} placeholder="e.g. exam fees, glasses for reading…" />
            </Field>
          </div>
        )}

        {/* STEP 3 — Documents */}
        {step === 3 && (
          <div className="mt-8 space-y-6">
            <p className="flex items-start gap-2 rounded-xl bg-sage/50 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
              Documents are stored in private, encrypted storage. Only the Sponsia administrator can view them,
              and they are never shown on the public website.
            </p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
              aria-label="Upload documents"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-forest/30 bg-sage/30 px-6 py-12 text-center transition-colors hover:border-forest/50 hover:bg-sage/50"
            >
              <Upload className="h-8 w-8 text-forest" />
              <span className="font-medium text-forest-deep">Click to upload documents</span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG, WEBP or PDF · up to {MAX_FILE_MB} MB each · required: fee challan & academic result
              </span>
            </button>

            {docs.length > 0 && (
              <ul className="space-y-3">
                {docs.map((d, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-ivory p-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-charcoal">{d.file.name}</span>
                      <span className="text-xs text-muted-foreground">{(d.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </span>
                    <Select
                      value={d.kind}
                      onValueChange={(v: DocKind) => setDocs((ds) => ds.map((x, j) => (j === i ? { ...x, kind: v } : x)))}
                    >
                      <SelectTrigger className="w-64" aria-label="Document type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(docKindLabels) as DocKind[]).map((k) => (
                          <SelectItem key={k} value={k}>{docKindLabels[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => setDocs((ds) => ds.filter((_, j) => j !== i))}
                      aria-label={`Remove ${d.file.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* STEP 4 — Consent */}
        {step === 4 && (
          <div className="mt-8 space-y-8">
            <p className="flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              Public display options are entirely your choice. Choosing to stay anonymous will never count against
              an application.
            </p>
            <ConsentRow
              checked={consents.accurate}
              onChange={(v) => setConsents((c) => ({ ...c, accurate: v }))}
              title="Accuracy confirmation *"
              desc="I confirm that the information submitted in this application is accurate to the best of my knowledge."
              disabled
            />
            {isMinor && (
              <ConsentRow
                checked={consents.guardian}
                onChange={(v) => setConsents((c) => ({ ...c, guardian: v }))}
                title="Guardian consent (required for minors) *"
                desc="As the parent or legal guardian, I consent to this application being submitted and reviewed by Sponsia."
              />
            )}

            <div>
              <h3 className="mb-1 font-display text-lg font-semibold text-forest-deep">Public display permissions</h3>
              <p className="mb-5 text-sm text-muted-foreground">
                If the application is approved, which details may appear on the public website? You can change your
                mind later by contacting us.
              </p>
              <div className="space-y-4">
                <ConsentRow checked={consents.name} onChange={(v) => setConsents((c) => ({ ...c, name: v }))} title="Student’s real name" desc="Show the student’s real name publicly. If declined, an alias or anonymous label can be used." />
                <ConsentRow checked={consents.photo} onChange={(v) => setConsents((c) => ({ ...c, photo: v }))} title="Student’s photograph" desc="Show the student’s photograph publicly." />
                <ConsentRow checked={consents.story} onChange={(v) => setConsents((c) => ({ ...c, story: v }))} title="Educational story" desc="Show the student’s story and circumstances publicly." />
                <ConsentRow checked={consents.school} onChange={(v) => setConsents((c) => ({ ...c, school: v }))} title="School name" desc="Show the name of the student’s school or college publicly." />
                <ConsentRow checked={consents.location} onChange={(v) => setConsents((c) => ({ ...c, location: v }))} title="Location (city / district)" desc="Show the student’s city or district publicly." />
                <ConsentRow checked={consents.updates} onChange={(v) => setConsents((c) => ({ ...c, updates: v }))} title="Public progress updates" desc="Share educational progress updates publicly while support continues." />
              </div>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="rounded-full"
          >
            Back
          </Button>
          {step < sections.length - 1 ? (
            <Button type="button" onClick={next} className="rounded-full bg-forest px-8 text-white hover:bg-forest-deep">
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting} className="rounded-full bg-forest px-8 text-white hover:bg-forest-deep">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                'Submit application'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ConsentRow({
  checked, onChange, title, desc, disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-colors ${
      checked ? 'border-forest/40 bg-sage/40' : 'border-border bg-ivory'
    }`}>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" aria-label={title} />
      <span>
        <span className="block font-medium text-charcoal">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
      </span>
    </label>
  );
}
