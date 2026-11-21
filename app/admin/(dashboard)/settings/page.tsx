import { SettingsForm } from '@/components/admin/settings-form';

export const metadata = { title: 'Settings — Admin' };

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-forest-deep">Website Settings</h1>
      <p className="mb-8 mt-1 text-muted-foreground">
        Changes appear on the public website immediately after saving.
      </p>
      <SettingsForm />
    </div>
  );
}
