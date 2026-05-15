export default function ConditionsUtilisation() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Conditions générales d&apos;utilisation</h1>
          <p className="text-slate-400 text-sm">Version 1.0 — en vigueur depuis mai 2026</p>
        </div>

        <div className="bg-teal-900/30 border border-teal-500/30 rounded-xl p-5 text-sm text-teal-300">
          En utilisant l&apos;application Ibogha Health, vous acceptez les présentes conditions générales d&apos;utilisation.
          Veuillez les lire attentivement avant toute utilisation du service.
        </div>

        {[
          {
            title: '1. Présentation du service',
            content: `Ibogha Health est une plateforme numérique de santé permettant aux patients de rechercher des médecins, de prendre des rendez-vous médicaux en ligne, de consulter leurs dossiers de santé et de communiquer avec des professionnels de santé agréés.

Le service est édité par Ibogha Health, société de droit gabonais, et opère sous la supervision des autorités sanitaires compétentes de la République Gabonaise.`,
          },
          {
            title: '2. Accès au service',
            content: `L'accès à Ibogha Health est réservé aux personnes physiques majeures (18 ans et plus) ou aux mineurs représentés par un titulaire de l'autorité parentale.

L'inscription est gratuite pour les patients. Certaines fonctionnalités peuvent être soumises à des frais (téléconsultations, services premium).

Vous êtes responsable de la confidentialité de vos identifiants de connexion. Tout accès à votre compte avec vos identifiants est présumé effectué par vous.`,
          },
          {
            title: '3. Utilisation du service',
            content: `Vous vous engagez à :
• Fournir des informations exactes et à jour lors de votre inscription
• Ne pas usurper l'identité d'une autre personne
• Ne pas utiliser le service à des fins illicites ou contraires aux bonnes mœurs
• Ne pas tenter d'accéder aux données d'autres utilisateurs
• Respecter les professionnels de santé et leur personnel

Ibogha Health se réserve le droit de suspendre ou supprimer tout compte en violation de ces règles.`,
          },
          {
            title: '4. Prise de rendez-vous',
            content: `La réservation d'un rendez-vous via Ibogha Health constitue un engagement. En cas d'empêchement, vous devez annuler le rendez-vous au moins 24 heures à l'avance via l'application.

Les annulations tardives répétées peuvent entraîner la restriction d'accès au service de réservation.

Ibogha Health est un intermédiaire entre patients et professionnels de santé. La relation médicale s'établit directement entre le patient et le professionnel.`,
          },
          {
            title: '5. Informations médicales',
            content: `Les informations médicales disponibles sur Ibogha Health ont un caractère informatif et ne se substituent pas à une consultation médicale.

En cas d'urgence médicale, composez immédiatement le 1300 (SAMU Gabon) ou rendez-vous aux urgences les plus proches.

Ibogha Health ne saurait être tenu responsable des décisions médicales prises sur la base des informations disponibles sur la plateforme.`,
          },
          {
            title: '6. Paiements',
            content: `Les paiements effectués via Ibogha Health sont sécurisés. Les tarifs affichés sont ceux pratiqués par les professionnels de santé et peuvent varier.

Les remboursements en cas d'annulation sont soumis à la politique de chaque professionnel. Ibogha Health ne prélève pas de frais supplémentaires sur les consultations standard.`,
          },
          {
            title: '7. Propriété intellectuelle',
            content: `L'ensemble du contenu de l'application Ibogha Health (textes, graphiques, logos, interface) est protégé par le droit de la propriété intellectuelle gabonais et international.

Toute reproduction, distribution ou utilisation sans autorisation écrite est strictement interdite.`,
          },
          {
            title: '8. Responsabilité',
            content: `Ibogha Health s'efforce d'assurer la disponibilité du service 24h/24, 7j/7, mais ne peut garantir une disponibilité sans interruption.

Ibogha Health ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation du service, d'une interruption de service, ou d'une erreur dans les informations affichées.`,
          },
          {
            title: '9. Données personnelles',
            content: `Le traitement de vos données personnelles est régi par notre Politique de confidentialité, conforme à la Loi N° 025/2023 sur la protection des données personnelles (Gabon).

Vous disposez d'un droit d'accès, de rectification et de suppression de vos données depuis votre espace compte.`,
          },
          {
            title: '10. Modification des CGU',
            content: `Ibogha Health se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications substantielles par email ou notification dans l'application.

La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions.`,
          },
          {
            title: '11. Droit applicable',
            content: `Les présentes CGU sont soumises au droit gabonais. En cas de litige, les tribunaux compétents de Libreville, Gabon, seront seuls compétents.

Pour toute réclamation : support@ibogha.ga`,
          },
        ].map((section) => (
          <div key={section.title} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-3">{section.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
          <a href="/politique-confidentialite" className="text-teal-400 hover:underline">
            Politique de confidentialité
          </a>
          <span className="text-slate-600 hidden sm:block">·</span>
          <a href="/auth/login" className="text-teal-400 hover:underline">
            ← Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
