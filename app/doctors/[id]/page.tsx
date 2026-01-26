import DoctorDetailClient from './DoctorDetailClient';

export default async function DoctorPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return <DoctorDetailClient doctorId={id} />;
}
