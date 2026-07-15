import ProjectDetailClient from './ProjectDetailClient';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProjectDetailClient projectId={params.id} />;
}
