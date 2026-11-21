import { Suspense } from 'react';
import { ApplicationsTable } from '@/components/admin/applications-table';

export const metadata = { title: 'Student Applications — Admin' };

export default function AdminApplicationsPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-forest-deep">Student Applications</h1>
      <p className="mb-8 mt-1 text-muted-foreground">
        Review, verify and manage every support application.
      </p>
      <Suspense>
        <ApplicationsTable />
      </Suspense>
    </div>
  );
}
