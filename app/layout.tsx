// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/app/_providers/AuthProvider"; // ← adapte le chemin si besoin

export const metadata: Metadata = {
  title: "Plateforme Santé",
  description: "Prise de rendez-vous et gestion patient/pro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <AuthProvider>
          <main className="max-w-6xl mx-auto px-4 py-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}