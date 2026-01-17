import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Video, Copy, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface ShareSectionProps {
  shareUrl: string;
  onCopyLink: () => Promise<void>;
}

export const ShareSection: React.FC<ShareSectionProps> = ({ shareUrl, onCopyLink }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    await onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 sm:mt-6 bg-gradient-to-br from-slate-950/80 to-slate-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-4 sm:p-6 shadow-2xl"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-1.5 sm:p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/30 flex-shrink-0">
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-100">Lien de partage</h3>
          <p className="text-[10px] sm:text-xs text-slate-400">Partagez l'aftermovie avec vos invités</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* QR Code avec design amélioré */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-white to-gray-50 p-3 sm:p-4 md:p-5 rounded-2xl shadow-2xl border-2 border-indigo-200/50"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl"></div>
            
            <div className="w-[180px] sm:w-[220px] h-[180px] sm:h-[220px]">
              <QRCodeCanvas
                value={shareUrl}
                size={180}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
                includeMargin={true}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-white/95 backdrop-blur-sm rounded-full p-2 sm:p-2.5 shadow-xl border-2 border-indigo-200/50"
              >
                <Video className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-indigo-600" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Lien de partage amélioré */}
        <div className="space-y-2 sm:space-y-3">
          <label className="block text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Lien de téléchargement
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-slate-900/70 border border-slate-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleCopy}
              className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-green-600 hover:bg-green-700 text-white border border-green-500/50'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/50'
              }`}
              title="Copier le lien"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Copier</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Instructions améliorées */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="p-1 sm:p-1.5 bg-indigo-500/20 rounded-lg flex-shrink-0">
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-indigo-300 mb-1">
                Comment partager ?
              </p>
              <ul className="text-[10px] sm:text-xs text-slate-400 space-y-0.5 sm:space-y-1 list-disc list-inside">
                <li>Scannez le QR code avec votre téléphone</li>
                <li>Ou copiez le lien et partagez-le</li>
                <li>L'aftermovie sera visible dans la galerie</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

