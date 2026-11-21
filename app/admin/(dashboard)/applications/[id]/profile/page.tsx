import { ProfileEditor } from '@/components/admin/profile-editor';

export const metadata = { title: 'Public Profile — Admin' };

export default function ProfileEditorPage({
  params,
}: {
  params: { id: string };
}) {
  return <ProfileEditor applicationId={params.id} />;
}
