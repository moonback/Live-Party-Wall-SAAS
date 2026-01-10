import React, { useState } from 'react';
import { ArrowLeft, Download, Trash2, Shield, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { exportUserData, deleteUserData, revokeConsent } from '../../services/rgpdService';
import { useToast } from '../../context/ToastContext';
import { disconnectUser } from '../../utils/userAvatar';

interface DataManagementProps {
  onBack: () => void;
}

/**
 * Page de gestion des données personnelles (droits RGPD)
 */
const DataManagement: React.FC<DataManagementProps> = ({ onBack }) => {
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportUserData();
      
      // Créer un fichier JSON téléchargeable
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addToast('Vos données ont été exportées avec succès', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      addToast('Erreur lors de l\'export des données', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Supprimer les données du localStorage
      await deleteUserData();
      
      // Déconnecter l'utilisateur
      disconnectUser();
      
      // Révoquer le consentement
      revokeConsent();
      
      addToast('Vos données ont été supprimées avec succès', 'success');
      
      // Rediriger vers la page d'accueil après un délai
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 2000);
    } catch (error) {
      console.error('Error deleting data:', error);
      addToast('Erreur lors de la suppression des données', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto p-4 pt-8 pb-16">
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
                Gestion de mes données
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Exercer vos droits RGPD
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Export Section */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Exporter mes données</h2>
                <p className="text-slate-300 text-sm mb-4">
                  Téléchargez toutes vos données personnelles dans un fichier JSON. 
                  Cela inclut vos préférences, votre profil et vos interactions.
                </p>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Export en cours...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Exporter mes données
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Delete Section */}
          <div className="backdrop-blur-xl bg-white/5 border border-red-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Supprimer mes données</h2>
                <p className="text-slate-300 text-sm mb-4">
                  <strong className="text-red-400">Action irréversible :</strong> Cette action supprimera 
                  toutes vos données personnelles stockées localement, y compris votre profil, vos préférences 
                  et votre consentement. Vous serez déconnecté et redirigé vers la page d'accueil.
                </p>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      <p className="font-semibold text-red-400 mb-1">Attention :</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Vos photos partagées sur le mur ne seront pas supprimées automatiquement</li>
                        <li>Contactez l'organisateur de l'événement pour supprimer vos photos du mur</li>
                        <li>Cette action ne peut pas être annulée</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Supprimer toutes mes données
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm text-yellow-300 font-semibold mb-2">
                        Êtes-vous sûr de vouloir supprimer toutes vos données ?
                      </p>
                      <p className="text-xs text-slate-300">
                        Cette action est définitive et ne peut pas être annulée.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Suppression...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Confirmer la suppression
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Informations complémentaires</h3>
            <div className="text-slate-300 text-sm space-y-2">
              <p>
                Pour toute demande relative à vos données personnelles stockées sur nos serveurs 
                (photos partagées, etc.), contactez l'organisateur de l'événement.
              </p>
              <p>
                Les données supprimées via cette page concernent uniquement les données stockées 
                localement sur votre appareil (localStorage, cookies).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;

