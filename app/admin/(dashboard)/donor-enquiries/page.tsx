import { EnquiriesTable } from '@/components/admin/enquiries-table';

export const metadata = { title: 'Donor Enquiries — Admin' };

export default function DonorEnquiriesPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-forest-deep">Donor Enquiries</h1>
      <p className="mb-8 mt-1 text-muted-foreground">
        People who want to support a student — contact them using the details they provided.
      </p>
      <EnquiriesTable kind="donor" />
    </div>
  );
}
