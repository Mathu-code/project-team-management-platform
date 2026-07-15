import ProjectDetailClient from './ProjectDetailClient';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProjectDetailClient projectId={params.id} />;
}
