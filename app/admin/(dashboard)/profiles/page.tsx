import { PublishedStudentsTable } from '@/components/admin/published-students-table';

export const metadata = { title: 'Published Students — Admin' };

export default function AdminProfilesPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-forest-deep">Published Students</h1>
      <p className="mb-8 mt-1 text-muted-foreground">
        All public profiles — publish, unpublish or edit what the website displays.
      </p>
      <PublishedStudentsTable />
    </div>
  );
}
