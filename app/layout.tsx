import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'web-patient',
  description: 'Health platform — web-patient',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="site">
          <div className="container bar">
            <strong className="brand">Plateforme Santé — web-patient</strong>
            <nav style={{ display:'flex', gap:8, marginLeft:'auto' }}>
              <a href="/">Accueil</a>
              <a href="/auth/login">Connexion</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}