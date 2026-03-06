// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { AuthProvider } from "@/app/_providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import PatientLayoutClient from "@/app/_components/PatientLayoutClient";

export const metadata: Metadata = {
  title: "Plateforme Santé",
  description: "Prise de rendez-vous et gestion patient/pro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-900 antialiased">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <PatientLayoutClient>
              <div className="pb-16 lg:pb-0">{children}</div>
            </PatientLayoutClient>
            <BottomNav />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
