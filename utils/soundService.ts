/**
 * Service pour jouer des sons dans l'application
 */
import { getStaticAssetPath } from './electronPaths';

/**
 * Génère un son programmatiquement en utilisant l'API Web Audio
 * @param frequency - Fréquence en Hz
 * @param duration - Durée en millisecondes
 * @param volume - Volume entre 0 et 1
 * @param type - Type d'onde ('sine', 'square', 'sawtooth', 'triangle')
 */
const generateTone = (
  frequency: number,
  duration: number,
  volume: number = 0.3,
  type: OscillatorType = 'sine'
): void => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.debug('Erreur lors de la génération du son:', error);
  }
};

/**
 * Joue un son depuis le dossier public/sounds, ou génère un son de fallback
 * @param soundName - Nom du fichier audio (sans extension)
 * @param volume - Volume entre 0 et 1 (défaut: 0.7)
 * @param fallbackTone - Fonction pour générer un son de fallback si le fichier n'existe pas
 */
const playSound = (
  soundName: string,
  volume: number = 0.7,
  fallbackTone?: () => void
): void => {
  try {
    const audioPath = getStaticAssetPath(`sounds/${soundName}.mp3`);
    const audio = new Audio(audioPath);
    audio.volume = Math.max(0, Math.min(1, volume));
    
    audio.play().catch((error) => {
      // Si le fichier n'existe pas, utiliser le fallback
      if (fallbackTone) {
        fallbackTone();
      } else {
        console.debug('Impossible de jouer le son:', soundName, error);
      }
    });
  } catch (error) {
    // Si erreur, utiliser le fallback
    if (fallbackTone) {
      fallbackTone();
    } else {
      console.debug('Erreur lors de la lecture du son:', soundName, error);
    }
  }
};

/**
 * Joue un son de victoire (fanfare ascendante)
 */
export const playVictorySound = (): void => {
  playSound('victory', 0.8, () => {
    // Son de victoire : séquence de notes ascendantes
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do (octave supérieure)
    notes.forEach((freq, index) => {
      setTimeout(() => {
        generateTone(freq, 200, 0.2, 'sine');
      }, index * 150);
    });
  });
};

/**
 * Joue un son de défaite/égalité (ton bas et neutre)
 */
export const playDefeatOrTieSound = (): void => {
  playSound('defeat-tie', 0.7, () => {
    // Son de défaite/égalité : ton bas et court
    generateTone(200, 300, 0.15, 'sine');
  });
};

