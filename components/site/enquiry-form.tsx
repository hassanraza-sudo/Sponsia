'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EnquiryFormProps {
  kind: 'contact' | 'donor';
  student?: { code: string; name: string };
  onDone?: () => void;
}

const countries = [
  'Pakistan', 'United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'United States',
  'Canada', 'Australia', 'Germany', 'Qatar', 'Kuwait', 'Other',
];

function validEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function EnquiryForm({ kind, student, onDone }: EnquiryFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    country: '',
    phone: '',
    subject: '',
    amount: '',
    sponsorshipType: '',
    message: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) return toast.error('Please enter your full name.');
    if (!validEmail(form.email)) return toast.error('Please enter a valid email address.');
    if (!form.country) return toast.error('Please select your country.');
    if (kind === 'contact' && !form.subject.trim())
      return toast.error('Please enter a subject.');
    if (!form.message.trim() || form.message.trim().length < 10)
      return toast.error('Please write a message of at least 10 characters.');
    if (kind === 'donor' && !form.sponsorshipType)
      return toast.error('Please choose a sponsorship type.');

    setSubmitting(true);
    try {
      const supabase = createClient();
      let error: unknown;

      if (kind === 'contact') {
        ({ error } = await supabase.from('contact_enquiries').insert({
          full_name: form.name.trim(),
          email: form.email.trim(),
          country: form.country,
          subject: form.subject.trim(),
          message: form.message.trim(),
        }));
      } else {
        ({ error } = await supabase.from('donor_enquiries').insert({
          student_public_code: student?.code ?? null,
          student_name: student?.name ?? null,
          donor_name: form.name.trim(),
          donor_email: form.email.trim(),
          country: form.country,
          donor_phone: form.phone.trim() || null,
          proposed_amount_pkr: form.amount ? Number(form.amount) : null,
          sponsorship_type: form.sponsorshipType,
          message: form.message.trim(),
        }));
      }

      if (error) throw error;

      toast.success(
        kind === 'contact'
          ? 'Thank you! Your message has been received — we will reply by email soon.'
          : 'Thank you for your interest in supporting education! Our team will contact you soon.'
      );
      setForm({
        name: '', email: '', country: '', phone: '',
        subject: '', amount: '', sponsorshipType: '', message: '',
      });
      onDone?.();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong while sending your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {student && (
        <div className="rounded-xl bg-sage/50 px-4 py-3 text-sm">
          <span className="font-medium text-forest-deep">Supporting:</span>{' '}
          <span className="text-muted-foreground">
            {student.name} ({student.code})
          </span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ef-name">Full name *</Label>
          <Input id="ef-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ef-email">Email address *</Label>
          <Input id="ef-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" required />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ef-country">Country *</Label>
          <Select value={form.country} onValueChange={(v) => set('country', v)}>
            <SelectTrigger id="ef-country" aria-label="Country">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {kind === 'donor' ? (
          <div className="space-y-2">
            <Label htmlFor="ef-phone">Contact number (optional)</Label>
            <Input id="ef-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+92 3XX XXXXXXX" />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="ef-subject">Subject *</Label>
            <Input id="ef-subject" value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="How can we help?" required />
          </div>
        )}
      </div>

      {kind === 'donor' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ef-type">Sponsorship type *</Label>
            <Select value={form.sponsorshipType} onValueChange={(v) => set('sponsorshipType', v)}>
              <SelectTrigger id="ef-type" aria-label="Sponsorship type">
                <SelectValue placeholder="I would like to…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_student">Sponsor one student</SelectItem>
                <SelectItem value="educational_expenses">Support educational expenses</SelectItem>
                <SelectItem value="general_support">General education support</SelectItem>
                <SelectItem value="partnership">Discuss an organisational partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ef-amount">Proposed amount in PKR (optional)</Label>
            <Input id="ef-amount" type="number" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="e.g. 5000" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="ef-message">Message *</Label>
        <Textarea id="ef-message" rows={5} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Write your message here…" required />
      </div>

      <Button type="submit" disabled={submitting} className="w-full rounded-full bg-forest py-6 text-white hover:bg-forest-deep sm:w-auto sm:px-10">
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
        ) : (
          <><Send className="h-4 w-4" /> Send enquiry</>
        )}
      </Button>
    </form>
  );
}
