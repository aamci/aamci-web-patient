'use client';

import { useAuth } from '@/app/_providers/AuthProvider';

export default function PatientLayoutClient({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 gap-4 z-20">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white">M</span>
        </div>
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <main className="min-h-screen bg-slate-900">{children}</main>;
}
