import { Suspense } from 'react';
import FacilityDetailClient from './FacilityDetailClient';

export default function FacilityDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="card" style={{ marginTop: 24 }}>Chargement…</div>}>
      <FacilityDetailClient facilityId={params.id} />
    </Suspense>
  );
}
