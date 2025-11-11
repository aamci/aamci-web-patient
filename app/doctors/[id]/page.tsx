

import SlotsGridForPatient from './SlotsGridForPatient';

export default async function DoctorPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;

  return (
    <div style={{ padding: '24px 0', display: 'grid', gap: 16 }}>
      {/* ... fiche doctor ... */}
      <SlotsGridForPatient doctorId={id} />
    </div>
  );
}
