export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Politique de confidentialité</h1>
          <p className="text-gray-500 text-sm">Dernière mise à jour : mai 2026</p>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-sm text-teal-800 space-y-1">
          <p className="font-semibold">Base légale</p>
          <p>Loi N° 025/2023 du 9 juillet 2023 modifiant la loi de 2011 sur la protection des données personnelles — République Gabonaise.</p>
          <p>Autorité de contrôle : APDPVP (Autorité pour la Protection des Données Personnelles et de la Vie Privée).</p>
        </div>

        {[
          {
            title: '1. Responsable du traitement',
            content: `Ibogha Health, société de droit gabonais, est responsable du traitement de vos données personnelles collectées via cette application.`,
          },
          {
            title: '2. Données collectées',
            content: `Nous collectons : données d'identification (nom, email, téléphone), données de santé (rendez-vous, dossiers médicaux, prescriptions, notes médicales), données de facturation et de paiement, et données de connexion (logs, adresses IP).`,
          },
          {
            title: '3. Finalités du traitement',
            content: `Vos données sont traitées pour : la gestion de votre compte patient, la prise et le suivi de rendez-vous médicaux, la communication sécurisée avec les professionnels de santé, la facturation et le remboursement, et l'amélioration de nos services.`,
          },
          {
            title: '4. Données de santé (données sensibles)',
            content: `Les données de santé bénéficient d'une protection renforcée. Elles sont chiffrées (AES-256-GCM) au repos et en transit. Leur traitement est strictement limité aux professionnels de santé qui vous suivent et à notre équipe technique dans le cadre de la maintenance du système.`,
          },
          {
            title: '5. Durée de conservation',
            content: `Vos données de profil sont conservées pendant la durée de votre inscription. Les données médicales sont conservées 10 ans conformément aux obligations légales gabonaises. Les données de connexion sont conservées 12 mois.`,
          },
          {
            title: '6. Vos droits',
            content: `Conformément à la Loi 025/2023, vous disposez des droits suivants :\n• Droit d'accès : obtenir une copie de vos données (section "Mes données" de votre compte)\n• Droit de rectification : corriger vos données via votre profil\n• Droit à l'effacement : demander la suppression de votre compte (section "Mes données")\n• Droit à la portabilité : exporter vos données au format JSON\n• Droit d'opposition : vous opposer à certains traitements\n• Droit à la limitation : limiter l'utilisation de vos données`,
          },
          {
            title: '7. Sécurité',
            content: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement AES-256-GCM des données sensibles, hachage Argon2 des mots de passe, authentification à deux facteurs (2FA), connexions sécurisées HTTPS/TLS, journalisation des accès.`,
          },
          {
            title: '8. Partage des données',
            content: `Vos données ne sont jamais vendues. Elles sont partagées uniquement avec : les professionnels de santé que vous consultez, nos prestataires techniques (hébergement sécurisé), et les autorités compétentes sur réquisition légale.`,
          },
          {
            title: '9. Contact',
            content: `Pour exercer vos droits ou pour toute question relative à vos données personnelles, contactez-nous via le formulaire de support de l'application ou par email à : privacy@ibogha.ga`,
          },
        ].map((section) => (
          <div key={section.title} className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">{section.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}

        <div className="text-center">
          <a href="/account" className="text-teal-600 hover:underline text-sm">← Retour à mon compte</a>
        </div>
      </div>
    </div>
  );
}
