'use client';

import { useEffect, useRef } from 'react';
import type { Doctor } from '@/components/cards';

interface Props {
  doctors: Doctor[];
  onSelectDoctor: (id: string) => void;
}

// Default center: Libreville, Gabon
const DEFAULT_LAT = 0.4162;
const DEFAULT_LNG = 9.4673;

export default function DoctorMapView({ doctors, onSelectDoctor }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView([DEFAULT_LAT, DEFAULT_LNG], 12);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Spread doctors without coords slightly around Libreville for visual context
      const plotted = doctors.map((d, i) => ({
        ...d,
        lat: d.doctorProfile?.latitude ?? DEFAULT_LAT + Math.sin(i * 1.3) * 0.02,
        lng: d.doctorProfile?.longitude ?? DEFAULT_LNG + Math.cos(i * 1.3) * 0.02,
      }));

      const bounds: [number, number][] = [];

      for (const d of plotted) {
        const specialty = d.doctorProfile?.specialty ?? 'Médecin';
        const popup = `
          <div style="min-width:160px;font-family:system-ui">
            <strong style="font-size:13px">${d.fullName ?? 'Dr. Médecin'}</strong><br/>
            <span style="color:#64748b;font-size:12px">${specialty}</span><br/>
            ${d.doctorProfile?.city ? `<span style="color:#64748b;font-size:11px">📍 ${d.doctorProfile.city}</span><br/>` : ''}
            <button
              onclick="window.__doctorMapSelect('${d.id}')"
              style="margin-top:8px;padding:4px 12px;background:#0d9488;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px"
            >Voir le profil</button>
          </div>
        `;
        L.marker([d.lat, d.lng]).bindPopup(popup).addTo(map);
        bounds.push([d.lat, d.lng]);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds as any, { padding: [40, 40] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      }

      (window as any).__doctorMapSelect = onSelectDoctor;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      delete (window as any).__doctorMapSelect;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (window as any).__doctorMapSelect = onSelectDoctor;
  }, [onSelectDoctor]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-slate-700"
        style={{ height: '520px' }}
      />
    </>
  );
}
