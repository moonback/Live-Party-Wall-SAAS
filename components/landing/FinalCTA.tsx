import React from 'react';
import { Users, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface FinalCTAProps {
  onAdminClick: () => void;
}

/**
 * Section CTA final - Design impactant
 */
export const FinalCTA: React.FC<FinalCTAProps> = ({ onAdminClick }) => {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Burst */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-blue-600/20 rounded-[100%] blur-[100px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-6 h-6 rounded-full border border-white bg-gray-700 flex items-center justify-center text-[8px] text-white font-bold z-${30-i*10}`}>
                   {i === 1 ? 'A' : i === 2 ? 'L' : 'M'}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </div>
            <span className="text-xs text-gray-300 font-medium">Rejoignez +500 événements</span>
          </div>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-8 tracking-tight leading-tight"
        >
          Prêt à créer l'événement <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400">
            de l'année ?
          </span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-light"
        >
          Transformez votre soirée en quelques clics. 
          <span className="block mt-2 text-white font-medium">Pas de carte bancaire requise pour tester.</span>
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onAdminClick}
            className="group relative px-8 py-4 bg-white text-black font-bold rounded-full text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.7)] transition-all transform hover:-translate-y-1 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Commencer gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          
          <button className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-full text-lg backdrop-blur-sm transition-all">
            Voir la démo live
          </button>
        </motion.div>
        
        <p className="mt-6 text-sm text-gray-500">
          Installation en 5 minutes • Support réactif 7j/7
        </p>
      </div>
    </section>
  );
};
