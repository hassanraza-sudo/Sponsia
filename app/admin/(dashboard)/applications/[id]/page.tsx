import { ApplicationDetail } from '@/components/admin/application-detail';

export const metadata = { title: 'Application — Admin' };

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ApplicationDetail id={params.id} />;
}
