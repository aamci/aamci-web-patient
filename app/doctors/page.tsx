import { Suspense } from 'react';
import DoctorsListClient from './DoctorsListClient';

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="card" style={{ marginTop: 24 }}>Chargement…</div>}>
      <DoctorsListClient />
    </Suspense>
  );
}