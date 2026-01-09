export const APP_NAME = "Live Party Wall";

// Prompt for Gemini to generate captions
export const CAPTION_PROMPT = `
Tu es l'animateur virtuel star du "Live Party Wall", le cœur battant de cet événement ! 🎉 
Ta mission est de transformer chaque image projetée sur le grand écran en un moment de gloire collectif. 🖥️✨

IMPORTANT : Analyse d'abord en détail le CONTENU VISIBLE de la photo, puis adapte ta légende selon ce que tu vois ET le contexte de l'événement.

1. ANALYSE DÉTAILLÉE DE LA PHOTO (PRIORITÉ ABSOLUE) :
   - Observe attentivement TOUT ce qui est visible dans l'image : personnes, objets, décorations, ambiance, expressions, actions
   - Détecte le type de contenu : collage (2 à 4 photos), portrait, groupe, selfie, nourriture/boisson, moment de danse, décor, objet spécifique
   - Identifie les éléments clés : nombre de personnes, leurs expressions (joie, émotion, complicité), ce qu'elles font, l'ambiance générale
   - Repère les détails significatifs : gâteau d'anniversaire, bouquet de mariée, décoration spécifique, tenues, accessoires, etc.
   - Note l'ambiance visuelle : éclairage, couleurs dominantes, atmosphère (festive, intime, dynamique, élégante)

2. CRÉATION DE LA LÉGENDE BASÉE SUR LA PHOTO :
   - Si c'est un collage (2 à 4 photos) : commente la créativité ou la mini-histoire racontée par les images combinées
   - Si des personnes sont visibles : fais-en les "Stars du mur" en mentionnant ce qu'elles font ou leur expression (ex: "Sourires radieux qui illuminent la soirée ! 😊✨")
   - Si c'est un objet, un plat ou un cocktail : rends-le irrésistible en décrivant ce que tu vois (ex: "Cocktail coloré qui fait saliver ! 🍹")
   - Si tu détectes des éléments spécifiques (gâteau, bouquet, décoration) : mentionne-les naturellement dans la légende
   - La légende DOIT refléter ce qui est réellement visible dans la photo, pas seulement être générique

3. STYLE & TON :
   - Maximum 12 mots. Uniquement en français.
   - Ton "électrique", drôle, chaleureux et 100% inclusif.
   - Utilise des jeux de mots liés à l'univers de la fête et de l'événementiel.
   - Multiplie les émojis pour booster l'énergie visuelle sur le mur.

4. CONTRAINTES :
   - Pas de hashtags, pas de phrases génériques type "Super photo".
   - Ne mentionne jamais que tu es une IA ou que tu suis des consignes.
   - La légende doit provoquer un effet "wow" immédiat et inciter les autres à liker dans la galerie ! 🚀
   - TOUJOURS baser la légende sur ce que tu vois réellement dans la photo, jamais inventer des éléments absents
`;

// Prompt enrichi pour personnalisation selon le type d'événement
export const buildPersonalizedCaptionPrompt = (eventContext?: string | null): string => {
  const basePrompt = CAPTION_PROMPT;
  
  if (!eventContext || !eventContext.trim()) {
    return basePrompt;
  }

  const contextRaw = eventContext.trim();
  const context = contextRaw.toLowerCase();
  
  // Extraire les informations spécifiques du contexte
  const extractNames = (text: string): string[] => {
    // Cherche des noms propres (mots commençant par une majuscule, pas en début de phrase)
    const words = text.split(/\s+/);
    const names: string[] = [];
    
    // Patterns communs pour les noms : "de X", "X et Y", "X et Y -", etc.
    const namePatterns = [
      /(?:de|pour|avec)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)/g,
      /([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)\s+et\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)/g,
    ];
    
    for (const pattern of namePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        for (let i = 1; i < match.length; i++) {
          if (match[i] && match[i].length > 2) {
            names.push(match[i]);
          }
        }
      }
    }
    
    // Fallback : chercher des mots avec majuscule après certains mots-clés
    for (let i = 1; i < words.length; i++) {
      const word = words[i].replace(/[.,!?;:()]/g, '');
      const prevWord = words[i - 1]?.toLowerCase();
      if (word.length > 2 && 
          /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]/.test(word) &&
          (prevWord === 'de' || prevWord === 'pour' || prevWord === 'avec' || prevWord === 'et')) {
        names.push(word);
      }
    }
    
    return [...new Set(names)]; // Dédupliquer
  };

  const extractedNames = extractNames(contextRaw);
  const hasHumoristicTone = /\(|!|folie|rigolade|fous rires|épique|mémorable|inoubliable|magique/i.test(contextRaw);
  const hasSpecificDetails = /-|:|de |pour |avec |et /.test(contextRaw);
  
  // Détection intelligente du type d'événement
  let eventType = 'generic';
  let eventSpecificGuidance = '';
  let vocabularyExamples = '';
  let emojiStyle = '🎉✨🌟';
  let contextIntegration = '';
  
  // Mariage
  if (context.includes('mariage') || context.includes('wedding') || context.includes('noces')) {
    eventType = 'wedding';
    eventSpecificGuidance = `
   - Vocabulaire : utilise des termes élégants et romantiques (union, alliance, promesse, éternité, bonheur, célébration)
   - Ton : raffiné, émotionnel, poétique mais toujours festif
   - Références : mentionne les mariés si visible, l'ambiance romantique, les moments précieux
   - Évite : termes trop familiers ou décontractés`;
    vocabularyExamples = `
   Exemples de légendes pour mariage :
   - "Union éternelle, bonheur infini 💍✨"
   - "Promesse d'amour scellée aujourd'hui 💕"
   - "Moment magique à jamais gravé 💒"
   - "Célébration de l'amour en grand style 👰🤵"`;
    emojiStyle = '💍💕✨👰🤵💒';
  }
  // Anniversaire
  else if (context.includes('anniversaire') || context.includes('birthday') || context.includes('anniv') || /\d+\s*(ans|years?)/.test(context)) {
    const ageMatch = context.match(/(\d+)\s*(ans|years?)/);
    const age = ageMatch ? ageMatch[1] : '';
    eventType = 'birthday';
    eventSpecificGuidance = `
   - Vocabulaire : joyeux, dynamique, mentionne l'âge si pertinent (${age ? `${age} ans` : 'l\'anniversaire'})
   - Ton : énergique, festif, complice
   - Références : célébration, nouvelle année de vie, moments de joie partagés
   - Évite : termes trop formels`;
    vocabularyExamples = `
   Exemples de légendes pour anniversaire :
   - "${age ? `${age} ans de bonheur !` : 'Joyeux anniversaire !'} 🎂🎈"
   - "Nouvelle année de vie qui commence ! 🎉"
   - "Célébration en grande pompe ! 🎊"
   - "Moment magique à partager ! 🎁✨"`;
    emojiStyle = '🎂🎈🎉🎊🎁✨';
  }
  // Événement entreprise / Corporate
  else if (context.includes('entreprise') || context.includes('corporate') || context.includes('business') || context.includes('team building') || context.includes('séminaire')) {
    eventType = 'corporate';
    eventSpecificGuidance = `
   - Vocabulaire : professionnel mais chaleureux, mentionne l'esprit d'équipe, la collaboration
   - Ton : positif, motivant, inclusif, moins familier mais toujours engageant
   - Références : travail d'équipe, moments de convivialité, succès partagés
   - Évite : termes trop décontractés ou trop formels`;
    vocabularyExamples = `
   Exemples de légendes pour événement entreprise :
   - "Esprit d'équipe au rendez-vous ! 👥✨"
   - "Moments de convivialité mémorables 🤝"
   - "Cohésion et bonne humeur ! 💼🎉"
   - "Souvenirs de collaboration précieux ! 📊✨"`;
    emojiStyle = '👥🤝💼📊✨🎯';
  }
  // Soirée étudiante / Fête étudiante
  else if (context.includes('étudiant') || context.includes('étudiant') || context.includes('student') || context.includes('promo') || context.includes('graduation')) {
    eventType = 'student';
    eventSpecificGuidance = `
   - Vocabulaire : jeune, dynamique, décontracté, mentionne les études ou la promo si pertinent
   - Ton : très énergique, complice, fun, générationnel
   - Références : amitié, moments de détente, réussite académique
   - Évite : termes trop formels`;
    vocabularyExamples = `
   Exemples de légendes pour événement étudiant :
   - "Promo unie, souvenirs inoubliables ! 🎓🎉"
   - "Amis pour la vie, moments de folie ! 👨‍🎓✨"
   - "Soirée légendaire entre potes ! 🍻🎊"
   - "Mémoires de promo à jamais ! 📚💫"`;
    emojiStyle = '🎓👨‍🎓🍻📚💫🎉';
  }
  // Fête de famille
  else if (context.includes('famille') || context.includes('family') || context.includes('réunion') || context.includes('cousin')) {
    eventType = 'family';
    eventSpecificGuidance = `
   - Vocabulaire : chaleureux, affectueux, mentionne les liens familiaux
   - Ton : tendre, complice, nostalgique mais joyeux
   - Références : liens familiaux, traditions, moments précieux ensemble
   - Évite : termes trop décontractés`;
    vocabularyExamples = `
   Exemples de légendes pour fête de famille :
   - "Liens familiaux précieux à jamais ! 👨‍👩‍👧‍👦💕"
   - "Moment de bonheur en famille ! 🏠✨"
   - "Souvenirs de famille inestimables ! 📸💖"
   - "Amour et complicité au rendez-vous ! ❤️🎉"`;
    emojiStyle = '👨‍👩‍👧‍👦💕🏠📸💖❤️';
  }
  // Soirée entre amis
  else if (context.includes('amis') || context.includes('friends') || context.includes('potes') || context.includes('soirée')) {
    eventType = 'friends';
    eventSpecificGuidance = `
   - Vocabulaire : décontracté, complice, mentionne l'amitié et la complicité
   - Ton : très chaleureux, fun, complice, décontracté
   - Références : amitié, moments de rigolade, complicité
   - Évite : termes trop formels`;
    vocabularyExamples = `
   Exemples de légendes pour soirée entre amis :
   - "Amis pour la vie, soirée de folie ! 👯‍♀️🎉"
   - "Complicité et fous rires garantis ! 😂✨"
   - "Moment de bonheur entre potes ! 🍻🎊"
   - "Souvenirs inoubliables à partager ! 💫🎈"`;
    emojiStyle = '👯‍♀️😂🍻💫🎈🎉';
  }
  // Événement sportif
  else if (context.includes('sport') || context.includes('match') || context.includes('championnat') || context.includes('tournoi')) {
    eventType = 'sport';
    eventSpecificGuidance = `
   - Vocabulaire : dynamique, compétitif mais fair-play, mentionne l'esprit sportif
   - Ton : énergique, motivant, positif
   - Références : performance, esprit d'équipe, dépassement de soi
   - Évite : termes trop formels`;
    vocabularyExamples = `
   Exemples de légendes pour événement sportif :
   - "Esprit sportif au rendez-vous ! ⚽🏆"
   - "Performance et détermination ! 💪✨"
   - "Victoire partagée en équipe ! 🎯🏅"
   - "Moment de gloire sportive ! 🥇🎉"`;
    emojiStyle = '⚽🏆💪🎯🏅🥇';
  }
  // Événement culturel / Artistique
  else if (context.includes('culture') || context.includes('art') || context.includes('concert') || context.includes('spectacle') || context.includes('festival')) {
    eventType = 'cultural';
    eventSpecificGuidance = `
   - Vocabulaire : artistique, créatif, mentionne l'émotion artistique
   - Ton : poétique, inspirant, raffiné mais accessible
   - Références : créativité, émotion, partage culturel
   - Évite : termes trop techniques`;
    vocabularyExamples = `
   Exemples de légendes pour événement culturel :
   - "Émotion artistique à son apogée ! 🎭✨"
   - "Créativité et inspiration partagées ! 🎨🎉"
   - "Moment culturel mémorable ! 🎪💫"
   - "Art et passion réunis ! 🎵🌟"`;
    emojiStyle = '🎭🎨🎪🎵🌟✨';
  }
  // Événement personnalisé (fallback)
  else {
    eventType = 'custom';
    eventSpecificGuidance = `
   - Adapte le vocabulaire au contexte spécifique : "${context}"
   - Ton : chaleureux, festif, adapté au type d'événement décrit
   - Références : utilise des éléments du contexte pour personnaliser
   - Sois créatif tout en restant pertinent`;
    vocabularyExamples = `
   - Adapte tes légendes au contexte : "${context}"
   - Utilise des termes pertinents pour ce type d'événement
   - Reste festif et engageant`;
    emojiStyle = '🎉✨🌟💫🎊';
  }

  // Construire les instructions d'intégration du contexte
  if (extractedNames.length > 0) {
    contextIntegration += `
   - NOMS IDENTIFIÉS DANS LE CONTEXTE : ${extractedNames.join(', ')}
     → Si tu vois des personnes dans la photo, tu peux faire référence à ces noms de manière naturelle et respectueuse
     → Exemple : si le contexte mentionne "Mariage de Sophie et Marc" et que tu vois un couple, tu peux dire "Sophie et Marc rayonnent ! 💍✨"
     → Mais ne force JAMAIS les noms si la photo ne montre pas clairement ces personnes`;
  }

  if (hasHumoristicTone) {
    contextIntegration += `
   - TON HUMORISTIQUE DÉTECTÉ : Le contexte a un ton humoristique et festif
     → Reprends ce ton dans tes légendes : sois drôle, léger, festif, mais toujours respectueux
     → Utilise l'énergie et la joie du contexte pour créer des légendes mémorables
     → Exemple : si le contexte dit "Trente ans de folie et ça continue !", adapte ce ton dans tes légendes`;
  }

  if (hasSpecificDetails) {
    contextIntegration += `
   - DÉTAILS SPÉCIFIQUES : Le contexte contient des détails précis
     → Utilise ces détails pour enrichir tes légendes quand ils sont pertinents à la photo
     → Fais des références subtiles et naturelles au contexte sans être trop explicite`;
  }

  // Instructions spécifiques pour utiliser le contexte
  const contextUsageInstructions = `
   UTILISATION DU CONTEXTE "${contextRaw}" :
   ${contextIntegration}
   
   - ADAPTATION INTELLIGENTE : 
     → Si le contexte mentionne un type d'événement spécifique, adapte tes légendes en conséquence
     → Si le contexte a un ton humoristique, reprends ce ton dans tes légendes
     → Si le contexte mentionne des noms, utilise-les naturellement quand pertinent
     → Si le contexte contient des détails spécifiques (âge, type d'événement, etc.), intègre-les subtilement
   
   - EXEMPLES D'INTÉGRATION :
     → Contexte : "Mariage de Sophie et Marc - Union de deux âmes qui s'aiment (et qui aiment faire la fête !)"
       Photo avec couple : "Sophie et Marc, amour et fête réunis ! 💍🎉"
       Photo avec gâteau : "Gâteau d'amour pour Sophie et Marc ! 🎂💕"
     
     → Contexte : "Anniversaire 30 ans de Marie - Trente ans de folie et ça continue !"
       Photo avec gâteau : "30 bougies pour 30 ans de folie ! 🎂🎉"
       Photo avec groupe : "30 ans de bonheur partagé ! 🎈✨"
     
     → Contexte : "Soirée entreprise - Parce que le succès se célèbre en équipe (et avec style !)"
       Photo avec groupe : "Équipe unie, succès partagé ! 👥✨"
       Photo avec toast : "Toast au succès de l'équipe ! 🥂🎯"`;

  return `${basePrompt}

4. PERSONNALISATION SELON L'ÉVÉNEMENT :
   Type d'événement détecté : ${eventType}
   Contexte fourni : "${contextRaw}"
   
   ${eventSpecificGuidance}
   
   ${vocabularyExamples}
   
   Style d'émojis recommandé : ${emojiStyle}
   
   ${contextUsageInstructions}
   
   MÉTHODE DE CRÉATION DE LA LÉGENDE (ORDRE D'ANALYSE) :
   
   ÉTAPE 1 - ANALYSE DE LA PHOTO (OBLIGATOIRE) :
   - Commence TOUJOURS par observer attentivement ce qui est visible dans la photo
   - Identifie les éléments concrets : personnes, objets, actions, expressions, décorations, ambiance visuelle
   - Note les détails spécifiques qui pourraient être liés au type d'événement (gâteau, bouquet, tenue, décoration, etc.)
   - Détecte si des personnes visibles correspondent aux noms mentionnés dans le contexte (si applicable)
   
   ÉTAPE 2 - ANALYSE DU CONTEXTE :
   - Relis attentivement le contexte : "${contextRaw}"
   - Identifie le ton (humoristique, formel, festif, etc.)
   - Repère les informations clés : noms, type d'événement, détails spécifiques, âge, etc.
   - Note le style et l'énergie du contexte pour les reprendre dans ta légende
   
   ÉTAPE 3 - COMBINAISON INTELLIGENTE PHOTO + CONTEXTE :
   - Utilise le vocabulaire et le ton adaptés au type d'événement détecté (${eventType})
   - Si tu vois dans la photo des éléments qui correspondent au contexte (ex: gâteau pour anniversaire, bouquet pour mariage), 
     mentionne-les explicitement dans la légende
   - Si le contexte mentionne des noms et que tu vois des personnes correspondantes dans la photo, fais une référence naturelle
   - Si le contexte a un ton humoristique, reprends ce ton dans ta légende
   - Si la photo montre des personnes, adapte ton compliment selon le type d'événement ET le contexte spécifique
   - Si la photo montre de la nourriture/boisson, adapte le vocabulaire selon le contexte (ex: "Toast à l'amour" pour mariage, 
     "Cocktail de célébration" pour anniversaire)
   - Fais des références subtiles et naturelles au contexte sans être trop explicite ou répétitif
   
   ÉTAPE 4 - SYNTHÈSE FINALE :
   - La légende DOIT combiner : [Élément visible dans la photo] + [Vocabulaire adapté au type d'événement] + [Référence subtile au contexte]
   - Exemple pour un mariage "Sophie et Marc" avec des personnes qui sourient : "Sophie et Marc rayonnent d'amour ! 💍✨" 
     (sourires = photo, noms = contexte, amour = vocabulaire mariage)
   - Exemple pour un anniversaire "30 ans de Marie" avec un gâteau : "30 bougies pour Marie, 30 ans de joie ! 🎂🎉"
     (gâteau/bougies = photo, nom et âge = contexte, joie = vocabulaire anniversaire)
   - Exemple pour un contexte humoristique "folie et ça continue" avec un groupe : "La folie continue ! 🎉✨"
     (groupe = photo, ton humoristique = contexte)
   - Reste authentique : si la photo ne contient pas d'éléments liés à l'événement, utilise quand même le vocabulaire 
     adapté et le ton du contexte, mais base-toi sur ce qui est réellement visible
   - Ne force JAMAIS des références au contexte si elles ne sont pas naturelles
   
   RÈGLE D'OR : La légende = [Ce que je vois dans la photo] + [Ton/vocabulaire adapté à ${eventType}] + [Référence naturelle au contexte "${contextRaw}"]
   
   IMPORTANT : Le contexte est là pour enrichir et personnaliser, pas pour être répété mot pour mot. Sois créatif et adapte le contexte à chaque photo unique.
`;
};

// Maximum number of photos to keep in memory to prevent crash
export const MAX_PHOTOS_HISTORY = 150;

// ⚡ Minimum number of photos to display (optimisé pour 200+ photos)
export const MIN_PHOTOS_DISPLAYED = 200;

// Placeholder for simulated data
export const PLACEHOLDER_AVATAR = "https://picsum.photos/50/50";

// Image processing constants
export const MAX_IMAGE_WIDTH = 1000;
export const IMAGE_QUALITY = 0.9;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Video processing constants - Retiré (mode vidéo désactivé)

// Aftermovie (timelapse) presets
export const AFTERMOVIE_PRESETS = {
  '720p': {
    label: 'HD (720p)',
    width: 1280,
    height: 720,
    fps: 30,
    videoBitsPerSecond: 6_000_000
  },
  '1080p': {
    label: 'Full HD (1080p)',
    width: 1920,
    height: 1080,
    fps: 30,
    videoBitsPerSecond: 12_000_000
  }
} as const;

export type AftermoviePresetKey = keyof typeof AFTERMOVIE_PRESETS;

export const AFTERMOVIE_DEFAULT_TARGET_SECONDS = 60;
export const AFTERMOVIE_MIN_MS_PER_PHOTO = 50;
export const AFTERMOVIE_MAX_MS_PER_PHOTO = 5000;
export const AFTERMOVIE_DEFAULT_TRANSITION_DURATION = 1500; // 1500ms par défaut
export const AFTERMOVIE_MIN_TRANSITION_DURATION = 100;
export const AFTERMOVIE_MAX_TRANSITION_DURATION = 5000;

// Camera constants
export const CAMERA_VIDEO_CONSTRAINTS = {
  facingMode: 'user' as const,
  width: { ideal: 1920 },
  height: { ideal: 1080 }
};

// Auto-scroll constants
export const AUTO_SCROLL_SPEED = 0.3; // pixels per frame
export const AUTO_PLAY_INTERVAL = 4000; // 4 seconds

// Kiosque mode constants
export const KIOSQUE_DEFAULT_INTERVAL = 5000; // 5 seconds par défaut
export const KIOSQUE_TRANSITION_DURATION = 1000; // 1 seconde pour les transitions
export const KIOSQUE_TRANSITION_TYPES = ['fade', 'slide', 'zoom'] as const;
export type KiosqueTransitionType = typeof KIOSQUE_TRANSITION_TYPES[number];

// Author name constants
export const MAX_AUTHOR_NAME_LENGTH = 50;
export const MIN_AUTHOR_NAME_LENGTH = 1;

// Collage mode constants
export const MIN_COLLAGE_PHOTOS = 2;
export const MAX_COLLAGE_PHOTOS = 4;
export const COLLAGE_GAP = 10; // Espacement entre les images en pixels

// Burst mode constants
export const BURST_MIN_PHOTOS = 3;
export const BURST_MAX_PHOTOS = 5;
export const BURST_DEFAULT_PHOTOS = 3;
export const BURST_CAPTURE_INTERVAL = 300; // Intervalle entre chaque capture en ms

// Wall View Layout Modes
export const WALL_LAYOUT_MODES = ['masonry', 'grid'] as const;
export type WallLayoutMode = typeof WALL_LAYOUT_MODES[number];

// AR Scene (Scène Augmentée) constants
export const AR_DEFAULT_LIKES_THRESHOLD = 5; // Seuil de likes pour déclencher un effet

// Réactions avec emojis
export const REACTIONS: Record<import('./types').ReactionType, import('./types').ReactionConfig> = {
  heart: {
    type: 'heart',
    emoji: '❤️',
    label: 'Cœur',
    color: 'text-red-500'
  },
  laugh: {
    type: 'laugh',
    emoji: '😂',
    label: 'Rire',
    color: 'text-yellow-500'
  },
  cry: {
    type: 'cry',
    emoji: '😢',
    label: 'Je pleure',
    color: 'text-blue-500'
  },
  fire: {
    type: 'fire',
    emoji: '🔥',
    label: 'Feu',
    color: 'text-orange-500'
  },
  wow: {
    type: 'wow',
    emoji: '😮',
    label: 'Wow !',
    color: 'text-purple-500'
  },
  thumbsup: {
    type: 'thumbsup',
    emoji: '👍',
    label: 'Bravo !',
    color: 'text-green-500'
  }
};

// Liste des réactions disponibles (pour itération)
export const REACTION_TYPES = Object.keys(REACTIONS) as import('./types').ReactionType[];
export const AR_DEFAULT_TIME_WINDOW = 15; // Fenêtre de temps en minutes pour ouverture/fermeture
export const AR_APPLAUSE_THRESHOLD = 0.6; // Seuil de détection d'applaudissements (0-1)
export const AR_EFFECT_DURATION = {
  fireworks: 15000
} as const;