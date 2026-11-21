import { EnquiriesTable } from '@/components/admin/enquiries-table';

export const metadata = { title: 'Contact Enquiries — Admin' };

export default function ContactEnquiriesPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-forest-deep">Contact Enquiries</h1>
      <p className="mb-8 mt-1 text-muted-foreground">
        Messages sent through the public contact form.
      </p>
      <EnquiriesTable kind="contact" />
    </div>
  );
}
