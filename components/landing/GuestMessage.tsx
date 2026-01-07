import React from 'react';
import { QrCode, Smartphone, Zap, Camera, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Section message pour les invités - Design modernisé
 */
export const GuestMessage: React.FC = () => {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative backdrop-blur-2xl bg-black/40 border border-white/10 rounded-3xl p-8 sm:p-12 overflow-hidden"
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-pink-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center gap-10 sm:gap-12 relative z-10">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-semibold text-white tracking-wide uppercase">Expérience Invité</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
                Simplicité radicale pour<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">vos invités</span>
              </h2>
              
              <p className="text-lg text-gray-300 leading-relaxed mb-8 font-light">
                Fini les applications lourdes à télécharger. Vos invités scannent, sourient et partagent. L'expérience est fluide, instantanée et magique.
              </p>
              
              <ul className="space-y-4 mb-8 text-left">
                {[
                  "Scan QR Code instantané (3 secondes)",
                  "Aucune inscription requise",
                  "Compatible iOS & Android",
                  "Confidentialité respectée"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 text-pink-200/80 bg-pink-500/5 border border-pink-500/10 rounded-xl px-4 py-3 text-sm">
                <Smartphone className="w-5 h-5 flex-shrink-0" />
                <span>100% Web App • Zéro installation</span>
              </div>
            </div>

            {/* Right Visual (QR Code Demo) */}
            <div className="flex-shrink-0 relative">
              <div className="w-64 h-64 sm:w-72 sm:h-72 bg-white p-4 rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 ease-out border-4 border-white/5">
                <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <QrCode className="w-24 h-24 text-gray-800 mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Scan Me</p>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full blur-xl opacity-20 animate-pulse" />
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-pink-400 rounded-full blur-xl opacity-20 animate-pulse delay-700" />
                </div>
              </div>

              {/* Decorative phone floating behind */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-gradient-to-r from-pink-500 to-purple-600 blur-[60px] opacity-40 -z-10" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
