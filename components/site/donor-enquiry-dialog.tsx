'use client';

import { useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EnquiryForm } from '@/components/site/enquiry-form';

export function DonorEnquiryDialog({
  student,
  contactEmail,
}: {
  student: { code: string; name: string };
  contactEmail?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-8 py-4 font-semibold text-white transition-all hover:bg-forest-deep hover:shadow-lg">
          <HeartHandshake className="h-5 w-5" />
          Support This Student
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sponsorship enquiry</DialogTitle>
          <DialogDescription>
            Tell us a little about yourself and how you would like to support {student.name}. Our team will contact
            you by email.
            {contactEmail && !contactEmail.startsWith('[') && (
              <> You can also reach us directly at {contactEmail}.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <EnquiryForm kind="donor" student={student} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
