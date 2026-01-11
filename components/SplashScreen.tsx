import React from 'react';
import { Camera, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  isVisible: boolean;
}

/**
 * Composant SplashScreen pour afficher un écran de chargement complet lors des changements de page
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-500/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-fadeInScale">
        {/* Logo Container */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/50 to-purple-500/50 rounded-full blur-3xl animate-pulseGlow"></div>
          
          {/* Icon Wrapper */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Camera Icon */}
            <Camera 
              className="absolute w-16 h-16 text-pink-500 animate-float"
              style={{ animationDelay: '0s', animationDuration: '3s' }}
            />
            
            {/* Sparkles Icon */}
            <Sparkles 
              className="absolute w-20 h-20 text-purple-500 animate-float"
              style={{ animationDelay: '1.5s', animationDuration: '3s' }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient">
            <span>Live Party Wall</span>
            <span className="text-pink-500 animate-pulse">.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-medium">
            L'expérience photobooth interactive
          </p>
          <p className="text-sm text-slate-500 font-light">
            by Maysson Dev
          </p>
        </div>

        {/* Loader */}
        <div className="relative w-16 h-16 mt-4">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500/90 border-r-purple-500/70 animate-spin"></div>
          
          {/* Inner ring */}
          <div className="absolute inset-[15%] rounded-full border-3 border-transparent border-t-purple-500/80 border-r-pink-500/60 animate-spin-reverse"></div>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-dotPulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg);
          }
        }

        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes dotPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-fadeInScale {
          animation: fadeInScale 0.6s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .animate-pulseGlow {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-dotPulse {
          animation: dotPulse 1.4s ease-in-out infinite;
        }

        .animate-spin-reverse {
          animation: spin 1s linear infinite reverse;
        }
      `}</style>
    </div>
  );
};

export default React.memo(SplashScreen);

