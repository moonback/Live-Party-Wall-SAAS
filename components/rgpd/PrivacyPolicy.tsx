import React from 'react';
import { ArrowLeft, Shield, FileText, Lock, Eye, Trash2, Download, Mail } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

/**
 * Page de politique de confidentialité RGPD
 */
const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
        <div 
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 animate-blob"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto p-4 pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-3 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white transition-all duration-300 group shadow-lg"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300">
                Politique de Confidentialité
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              1. Introduction
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Live Party Wall ("nous", "notre", "l'application") s'engage à protéger votre vie privée. 
                Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et 
                protégeons vos données personnelles conformément au Règlement Général sur la Protection des 
                Données (RGPD).
              </p>
              <p>
                En utilisant notre application, vous acceptez les pratiques décrites dans cette politique.
              </p>
            </div>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-purple-400" />
              2. Données collectées
            </h2>
            <div className="text-slate-300 space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">2.1 Données que vous nous fournissez</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nom d'utilisateur (invité)</li>
                  <li>Photo de profil (avatar)</li>
                  <li>Photos et vidéos partagées</li>
                  <li>Légendes et descriptions</li>
                  <li>Réactions et likes sur les photos</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">2.2 Données collectées automatiquement</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Identifiant unique de session (localStorage)</li>
                  <li>Préférences de cookies</li>
                  <li>Données de navigation (via cookies analytiques si acceptés)</li>
                  <li>Métadonnées des photos (date, heure, orientation)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Usage */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-indigo-400" />
              3. Utilisation des données
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>Nous utilisons vos données pour :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Permettre le partage de photos en temps réel</li>
                <li>Gérer votre profil utilisateur</li>
                <li>Faciliter les interactions sociales (likes, réactions)</li>
                <li>Améliorer l'expérience utilisateur</li>
                <li>Assurer la modération du contenu (via IA)</li>
                <li>Générer des statistiques et classements (gamification)</li>
                <li>Analyser l'utilisation de l'application (si vous acceptez les cookies analytiques)</li>
              </ul>
            </div>
          </section>

          {/* Storage */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Stockage et sécurité</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Vos données sont stockées de manière sécurisée sur les serveurs de Supabase (UE) avec 
                chiffrement en transit et au repos. Les photos sont stockées dans Supabase Storage avec 
                des politiques d'accès strictes.
              </p>
              <p>
                Nous conservons vos données pendant la durée de l'événement et jusqu'à 30 jours après 
                sa fin, sauf demande de suppression de votre part.
              </p>
            </div>
          </section>

          {/* Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Vos droits RGPD</h2>
            <div className="text-slate-300 space-y-4">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Droit d'accès
                  </h3>
                  <p className="text-sm">Vous pouvez accéder à toutes vos données personnelles.</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Droit à la portabilité
                  </h3>
                  <p className="text-sm">Vous pouvez exporter vos données dans un format structuré.</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Droit à l'effacement
                  </h3>
                  <p className="text-sm">Vous pouvez demander la suppression de vos données.</p>
                </div>
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Droit d'opposition
                  </h3>
                  <p className="text-sm">Vous pouvez vous opposer au traitement de vos données.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Cookies</h2>
            <div className="text-slate-300 space-y-3">
              <p>Nous utilisons différents types de cookies :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-white">Cookies essentiels :</strong> Nécessaires au fonctionnement 
                  de l'application (authentification, préférences). Ces cookies ne peuvent pas être désactivés.
                </li>
                <li>
                  <strong className="text-white">Cookies analytiques :</strong> Nous permettent d'analyser 
                  l'utilisation de l'application pour l'améliorer.
                </li>
                <li>
                  <strong className="text-white">Cookies fonctionnels :</strong> Améliorent les fonctionnalités 
                  et la personnalisation.
                </li>
                <li>
                  <strong className="text-white">Cookies marketing :</strong> Utilisés pour la publicité 
                  personnalisée (actuellement non utilisés).
                </li>
              </ul>
              <p className="text-sm text-slate-400 mt-4">
                Vous pouvez gérer vos préférences de cookies à tout moment depuis les paramètres de l'application.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-400" />
              7. Contact
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Pour exercer vos droits ou pour toute question concernant cette politique de confidentialité, 
                contactez l'organisateur de l'événement ou :
              </p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm">
                  <strong className="text-white">Email :</strong> privacy@livepartywall.com
                </p>
                <p className="text-sm mt-2">
                  <strong className="text-white">Délégué à la protection des données :</strong> 
                  Contactez l'organisateur de l'événement pour toute demande relative à vos données.
                </p>
              </div>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Modifications</h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Nous nous réservons le droit de modifier cette politique de confidentialité. 
                Toute modification sera communiquée via l'application et nécessitera votre nouveau consentement 
                si les changements sont substantiels.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

