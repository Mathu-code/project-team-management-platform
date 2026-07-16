import ProjectDetailClient from './ProjectDetailClient';

export default function Page({ params }: { params: { id: string } }) {
  return <ProjectDetailClient projectId={params.id} />;
}
