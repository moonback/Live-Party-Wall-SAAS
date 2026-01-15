/**
 * Configuration centralisée pour l'IA Gemini
 * 
 * Ce fichier contient tous les prompts, modèles et paramètres utilisés par les services Gemini.
 * Modifier ce fichier permet d'ajuster le comportement de l'IA sans toucher à la logique métier.
 */

import { ImageAnalysis } from '../services/aiModerationService';

// ============================================================================
// MODÈLES GEMINI
// ============================================================================

export const MODELS = {
  /** Modèle pour la génération de légendes */
  caption: 'gemini-2.5-flash',
  
  /** Modèle pour la modération de contenu (plus puissant) */
  moderation: 'gemini-2.5-flash',
  
  /** Modèle pour l'analyse d'images (aftermovie, etc.) */
  analysis: 'gemini-2.5-flash',
  
  /** Modèle pour la traduction */
  translation: 'gemini-2.5-flash',
  
  /** Modèle pour la génération de contexte d'événement */
  context: 'gemini-2.5-flash',
} as const;

// ============================================================================
// PARAMÈTRES DE GÉNÉRATION
// ============================================================================

export const GENERATION_CONFIG = {
  /** Température pour la génération (0.0 = déterministe, 1.0 = créatif) */
  temperature: {
    caption: 0.8,        // Créatif pour les légendes
    moderation: 0.1,     // Déterministe pour la modération
    analysis: 0.3,       // Équilibré pour l'analyse
    translation: 0.2,    // Fidèle pour la traduction
    context: 0.7,        // Créatif pour le contexte
  },
  
  /** Nombre maximum de tokens (si nécessaire) */
  maxTokens: {
    caption: 100,
    moderation: 500,
    analysis: 1000,
    translation: 200,
    context: 500,
  },
} as const;

// ============================================================================
// VALEURS PAR DÉFAUT
// ============================================================================

export const DEFAULTS = {
  /** Légende par défaut en cas d'erreur */
  caption: "Party time! 🎉",
  
  /** Contexte par défaut en cas d'erreur */
  context: "Soirée festive",
  
  /** Analyse par défaut en cas d'erreur */
  analysis: {
    hasFaces: false,
    faceCount: 0,
    isAppropriate: true,
    suggestedFilter: 'none' as const,
    quality: 'fair' as const,
    estimatedQuality: 'fair' as const,
    suggestedImprovements: [],
  } as ImageAnalysis,
} as const;

// ============================================================================
// PROMPTS
// ============================================================================

/**
 * Prompt de base pour la génération de légendes
 * Extrait de constants.ts
 */
export const CAPTION_PROMPT_BASE = `
Tu es l'animateur virtuel star du "Partywall", le cœur battant de cet événement ! 🎉 
Ta mission est de transformer chaque image projetée sur le grand écran en un moment de gloire collectif. 🖥️✨

═══════════════════════════════════════════════════════════════
RÈGLE FONDAMENTALE : Analyse d'abord en détail le CONTENU VISIBLE de la photo, puis adapte ta légende selon ce que tu vois ET le contexte de l'événement.
═══════════════════════════════════════════════════════════════

1. ANALYSE DÉTAILLÉE DE LA PHOTO (PRIORITÉ ABSOLUE - FAIS-LE EN PREMIER) :

   ÉTAPE 1.1 - OBSERVATION GLOBALE :
   - Examine attentivement TOUT ce qui est visible dans l'image : personnes, objets, décorations, ambiance, expressions, actions, couleurs
   - Identifie le sujet principal : qui ou quoi est au centre de l'attention ?
   - Détecte le type de contenu précis : collage (2-4 photos), portrait individuel, groupe (combien de personnes ?), selfie, nourriture/boisson, moment de danse, décor/ambiance, objet spécifique, animal, paysage
   - Note l'angle et la composition : photo prise de face, de profil, en plongée, en contre-plongée, gros plan, plan large

   ÉTAPE 1.2 - ANALYSE DES PERSONNES (si présentes) :
   - Nombre exact de personnes visibles
   - Leurs expressions faciales : sourire, rire, émotion, complicité, surprise, joie, tendresse, concentration
   - Leurs actions : dansent, trinquent, mangent, posent, rient, embrassent, jouent, célèbrent
   - Leurs tenues : formelles, décontractées, costumes, accessoires remarquables
   - Leurs interactions : se regardent, se touchent, font un geste ensemble, sont complices

   ÉTAPE 1.3 - ANALYSE DES OBJETS ET DÉCORATIONS :
   - Objets spécifiques : gâteau d'anniversaire (avec bougies ?), bouquet de mariée, verres à champagne, décoration thématique, cadeaux, ballons
   - Nourriture/boisson : type de plat, cocktail, couleur, présentation
   - Décoration : guirlandes, lumières, thème de l'événement, couleurs dominantes
   - Accessoires : chapeaux, masques, accessoires de fête, instruments de musique

   ÉTAPE 1.4 - ANALYSE DE L'AMBIANCE VISUELLE :
   - Éclairage : naturel, artificiel, tamisé, flash, ambiance crépusculaire
   - Couleurs dominantes : palette chaude, froide, pastel, vives, monochrome
   - Atmosphère générale : festive, intime, dynamique, élégante, décontractée, romantique, énergique
   - Contexte spatial : intérieur, extérieur, scène, salle, jardin, plage

   ÉTAPE 1.5 - DÉTECTION D'ÉLÉMENTS SPÉCIAUX :
   - Collage : combien de photos ? Quelle histoire raconte-t-il ?
   - Moment particulier : toast, coupure de gâteau, premier baiser, danse, moment émotionnel
   - Détails uniques : quelque chose d'inhabituel, de créatif, de mémorable

2. CRÉATION DE LA LÉGENDE BASÉE SUR L'ANALYSE (UTILISE LES DÉTAILS OBSERVÉS) :

   RÈGLE D'OR : La légende DOIT refléter ce qui est réellement visible dans la photo, jamais être générique.

   CAS 1 - COLLAGE (2 à 4 photos) :
   - Décris la créativité ou la mini-histoire racontée par les images combinées
   - Exemple : "Quatre moments de joie en une seule création ! 🎨✨" (si collage créatif)
   - Exemple : "Histoire d'une soirée en quatre clichés ! 📸💫" (si collage narratif)

   CAS 2 - PERSONNES VISIBLES :
   - Fais-en les "Stars du mur" en mentionnant ce qu'elles font ou leur expression
   - Sois spécifique : ne dis pas juste "belles personnes", dis "sourires radieux" ou "fous rires partagés"
   - Exemple : "Sourires radieux qui illuminent la soirée ! 😊✨" (si sourires visibles)
   - Exemple : "Groupe complice, moments de folie ! 👯‍♀️🎉" (si groupe qui rit)
   - Exemple : "Danse endiablée sur la piste ! 💃🕺" (si personnes qui dansent)

   CAS 3 - OBJET, PLAT OU COCKTAIL :
   - Rends-le irrésistible en décrivant ce que tu vois précisément
   - Mentionne la couleur, la forme, la présentation si remarquable
   - Exemple : "Cocktail coloré qui fait saliver ! 🍹" (si cocktail visible)
   - Exemple : "Gâteau aux bougies scintillantes ! 🎂✨" (si gâteau avec bougies)
   - Exemple : "Toast à l'amitié, verres levés ! 🥂💫" (si toast visible)

   CAS 4 - ÉLÉMENTS SPÉCIFIQUES DÉTECTÉS :
   - Gâteau d'anniversaire : mentionne-le avec créativité
   - Bouquet de mariée : référence romantique
   - Décoration : mentionne le thème si visible
   - Moment particulier : toast, danse, embrassade, célébration

   CAS 5 - AMBIANCE/DÉCOR (sans personnes) :
   - Décris l'atmosphère capturée
   - Exemple : "Décorations qui respirent la fête ! 🎊✨"
   - Exemple : "Ambiance magique, lumières scintillantes ! 💫🌟"

3. STYLE & TON (CONTRAINTES STRICTES) :

   LONGUEUR :
   - Maximum 12 mots (compte les mots, pas les caractères)
   - Uniquement en français
   - Pas de ponctuation excessive (max 1 point d'exclamation ou d'interrogation)

   TON :
   - "Électrique" : énergique, dynamique, vivant
   - Drôle : jeux de mots, humour léger, second degré
   - Chaleureux : bienveillant, inclusif, positif
   - 100% inclusif : pas de jugement, accueillant pour tous

   VOCABULAIRE :
   - Utilise des jeux de mots liés à l'univers de la fête et de l'événementiel
   - Évite les mots trop communs : "super", "génial", "cool" (trop génériques)
   - Préfère des termes plus créatifs : "radieux", "scintillant", "endiablée", "complices"
   - Utilise des verbes d'action : "illuminent", "rayonnent", "célèbrent", "partagent"

   ÉMOJIS :
   - Utilise 1 à 3 émojis maximum (pas plus, ça surcharge)
   - Choisis des émojis pertinents qui renforcent le message
   - Évite les émojis redondants (pas besoin de 🎉🎊🎈 si tu dis déjà "fête")

4. CONTRAINTES ABSOLUES (À RESPECTER IMPÉRATIVEMENT) :

   ❌ INTERDICTIONS :
   - Pas de hashtags (#)
   - Pas de phrases génériques : "Super photo", "Belle photo", "Jolie image", "Nice pic"
   - Pas de mention que tu es une IA ou que tu suis des consignes
   - Pas d'invention d'éléments absents de la photo
   - Pas de répétition du contexte mot pour mot
   - Pas de légendes trop longues (> 12 mots)

   ✅ OBLIGATIONS :
   - TOUJOURS baser la légende sur ce que tu vois réellement dans la photo
   - Être spécifique : mentionner des détails observés (sourires, danse, gâteau, etc.)
   - Provoquer un effet "wow" immédiat
   - Inciter les autres à liker dans la galerie
   - Créer une légende unique pour chaque photo (pas de copier-coller)

5. PROCESSUS DE CRÉATION (SUIS CET ORDRE) :

   ÉTAPE A - ANALYSE (30 secondes de réflexion) :
   1. Observe la photo en détail (voir section 1)
   2. Identifie 3-5 éléments clés visibles
   3. Détecte l'émotion ou l'action principale

   ÉTAPE B - INSPIRATION :
   1. Quel est le moment capturé ? (célébration, complicité, joie, tendresse, etc.)
   2. Quel détail rend cette photo unique ? (sourire, geste, objet, décoration)
   3. Quelle émotion transmet-elle ? (joie, amour, amitié, fierté, etc.)

   ÉTAPE C - CRÉATION :
   1. Combine un élément visible + une émotion/action + un vocabulaire festif
   2. Vérifie que c'est spécifique (pas générique)
   3. Vérifie la longueur (max 12 mots)
   4. Ajoute 1-3 émojis pertinents
   5. Relis et ajuste si nécessaire

   EXEMPLE DE PROCESSUS :
   Photo : Groupe de 5 personnes qui sourient, lèvent leurs verres, gâteau d'anniversaire visible au premier plan
   Analyse : 5 personnes, sourires, toast, gâteau avec bougies, ambiance festive
   Inspiration : Moment de célébration, complicité, joie partagée
   Légende : "Toast complice autour du gâteau ! 🥂🎂✨"
   (toast = action visible, complice = émotion, gâteau = détail spécifique)
`;

/**
 * Construit un prompt personnalisé pour les légendes selon le contexte de l'événement
 * Extrait de constants.ts
 */
export const buildPersonalizedCaptionPrompt = (eventContext?: string | null): string => {
  const basePrompt = CAPTION_PROMPT_BASE;
  
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
   ═══════════════════════════════════════════════════════════════
   UTILISATION INTELLIGENTE DU CONTEXTE HUMORISTIQUE
   ═══════════════════════════════════════════════════════════════
   
   CONTEXTE FOURNI : "${contextRaw}"
   
   ${contextIntegration}
   
   STRATÉGIE D'INTÉGRATION DU CONTEXTE :
   
   1. ANALYSE DU TON DU CONTEXTE :
      → Identifie si le contexte est humoristique, romantique, festif, décontracté, professionnel
      → Repère les expressions clés, les jeux de mots, les touches humoristiques
      → Note l'énergie et le style du contexte (léger, épique, complice, tendre, etc.)
      → Le contexte a été créé pour être humoristique et festif - reprends ce ton dans tes légendes !
   
   2. EXTRACTION DES ÉLÉMENTS CLÉS :
      → Noms des personnes (si présents dans le contexte)
      → Type d'événement (mariage, anniversaire, soirée, etc.)
      → Détails spécifiques (âge, thème, ambiance)
      → Expressions humoristiques ou festives à reprendre
      → Mots-clés qui capturent l'esprit de l'événement
   
   3. ADAPTATION INTELLIGENTE :
      → Si le contexte a un ton humoristique, reprends ce ton dans tes légendes (jeux de mots, légèreté, complice)
      → Si le contexte mentionne des noms, utilise-les naturellement quand pertinent à la photo
      → Si le contexte contient des détails spécifiques (âge, type d'événement), intègre-les subtilement
      → Si le contexte utilise des expressions festives ("folie", "fête", "magique", "épique"), reprends cette énergie
      → Transforme et adapte le contexte, ne le répète pas mot pour mot
   
   4. CRÉATION DE LÉGENDES HUMORISTIQUES BASÉES SUR LE CONTEXTE :
      → Utilise le vocabulaire et le style du contexte pour enrichir tes légendes
      → Fais des références subtiles aux expressions du contexte quand elles sont pertinentes
      → Crée des jeux de mots ou des expressions complices qui reprennent l'esprit du contexte
      → Adapte le ton humoristique du contexte à chaque photo unique
   
   EXEMPLES D'INTÉGRATION INTELLIGENTE ET HUMORISTIQUE :
   
   Exemple 1 - Contexte humoristique "Mariage" :
   Contexte : "Mariage de Sophie et Marc - Union de deux âmes qui s'aiment (et qui aiment faire la fête jusqu'au bout de la nuit !) 💍✨"
   → Photo avec couple : "Sophie et Marc, amour et fête réunis ! 💍🎉"
   → Photo avec gâteau : "Gâteau d'amour pour Sophie et Marc ! 🎂💕"
   → Photo avec toast : "Toast à l'amour et à la fête ! 🥂✨"
   → Photo avec danse : "La fête continue, amour en mouvement ! 💃💕"
   
   Exemple 2 - Contexte humoristique "Anniversaire" :
   Contexte : "Anniversaire 30 ans de Marie - Trente ans de folie, de rires et de moments magiques (et ça continue !) 🎂🎉"
   → Photo avec gâteau : "30 bougies pour 30 ans de folie ! 🎂🎉"
   → Photo avec groupe : "30 ans de bonheur, la folie continue ! 🎈✨"
   → Photo avec rires : "Rires garantis, la magie opère ! 😂🎉"
   → Photo avec toast : "Toast aux 30 ans de folie ! 🥂🎂"
   
   Exemple 3 - Contexte humoristique "Entreprise" :
   Contexte : "Soirée entreprise - Parce que le succès se célèbre en équipe (et avec style !) 👥✨"
   → Photo avec groupe : "Équipe unie, succès avec style ! 👥✨"
   → Photo avec toast : "Toast au succès de l'équipe ! 🥂🎯"
   → Photo avec sourires : "Succès partagé, style assuré ! 😊👥"
   
   Exemple 4 - Contexte humoristique "Famille" :
   Contexte : "Fête de famille - Réunion annuelle où on refait le monde, on partage des fous rires et on crée des souvenirs inoubliables 👨‍👩‍👧‍👦💕"
   → Photo avec groupe famille : "Fous rires en famille, souvenirs inoubliables ! 👨‍👩‍👧‍👦😂"
   → Photo avec moment tendre : "Liens familiaux, moments précieux ! 💕✨"
   → Photo avec repas : "Réunion familiale, bonheur partagé ! 🍽️💕"
   
   Exemple 5 - Contexte avec expression humoristique :
   Contexte : "Soirée entre amis - Où l'amitié se célèbre, les rires résonnent et les souvenirs se forgent 🍻🎉"
   → Photo avec groupe : "Amitié célébrée, rires résonnent ! 👯‍♀️😂"
   → Photo avec toast : "Toast à l'amitié, souvenirs se forgent ! 🍻✨"
   → Photo avec danse : "Rires et danse, amitié en mouvement ! 💃🎉"
   
   RÈGLES D'OR POUR L'INTÉGRATION :
   ✅ Reprends le ton humoristique et festif du contexte
   ✅ Utilise les expressions clés du contexte de manière naturelle
   ✅ Adapte le vocabulaire au style du contexte
   ✅ Fais des références subtiles aux éléments du contexte
   ✅ Crée des légendes qui reflètent l'énergie du contexte
   ❌ Ne répète pas le contexte mot pour mot
   ❌ Ne force pas des références si elles ne sont pas naturelles
   ❌ Ne sacrifie pas la pertinence à la photo pour intégrer le contexte`;

  return `${basePrompt}

4. PERSONNALISATION SELON L'ÉVÉNEMENT :
   Type d'événement détecté : ${eventType}
   Contexte fourni : "${contextRaw}"
   
   ${eventSpecificGuidance}
   
   ${vocabularyExamples}
   
   Style d'émojis recommandé : ${emojiStyle}
   
   ${contextUsageInstructions}
   
   ═══════════════════════════════════════════════════════════════
   MÉTHODE DE CRÉATION DE LA LÉGENDE (SUIS CET ORDRE STRICTEMENT)
   ═══════════════════════════════════════════════════════════════
   
   ÉTAPE 1 - ANALYSE DE LA PHOTO (OBLIGATOIRE - FAIS-LE EN PREMIER) :
   - Commence TOUJOURS par observer attentivement ce qui est visible dans la photo
   - Identifie les éléments concrets : personnes, objets, actions, expressions, décorations, ambiance visuelle
   - Note les détails spécifiques qui pourraient être liés au type d'événement (gâteau, bouquet, tenue, décoration, etc.)
   - Détecte si des personnes visibles correspondent aux noms mentionnés dans le contexte (si applicable)
   - Liste mentalement 3-5 éléments clés observés avant de passer à l'étape suivante
   
   ÉTAPE 2 - ANALYSE DU CONTEXTE HUMORISTIQUE (ENRICHIT L'ANALYSE DE LA PHOTO) :
   - Relis attentivement le contexte : "${contextRaw}"
   - Identifie le ton (humoristique, formel, festif, romantique, décontracté, etc.) - le contexte est conçu pour être humoristique !
   - Repère les informations clés : noms, type d'événement, détails spécifiques, âge, thème, etc.
   - Note le style et l'énergie du contexte (léger, épique, complice, tendre, etc.) pour les reprendre dans ta légende
   - Identifie les mots-clés et expressions humoristiques du contexte qui pourraient enrichir la légende
   - Repère les jeux de mots, les expressions festives, les touches humoristiques à reprendre
   - Note les émojis utilisés dans le contexte pour maintenir la cohérence
   
   ÉTAPE 3 - COMBINAISON INTELLIGENTE PHOTO + CONTEXTE HUMORISTIQUE (CRÉATIVITÉ) :
   - Utilise le vocabulaire et le ton adaptés au type d'événement détecté (${eventType})
   - REPRENDS LE TON HUMORISTIQUE DU CONTEXTE : le contexte a été créé pour être humoristique et festif, 
     donc tes légendes doivent refléter cette énergie (jeux de mots, légèreté, complice, festif)
   - Si tu vois dans la photo des éléments qui correspondent au contexte (ex: gâteau pour anniversaire, bouquet pour mariage), 
     mentionne-les explicitement dans la légende avec créativité et humour
   - Si le contexte mentionne des noms et que tu vois des personnes correspondantes dans la photo, fais une référence naturelle
     MAIS ne force pas si tu n'es pas sûr que ce sont bien ces personnes
   - Si le contexte contient des expressions humoristiques ("folie", "fête", "magique", "épique", "ça continue", etc.), 
     reprends ces expressions de manière naturelle dans ta légende quand elles sont pertinentes
   - Si la photo montre des personnes, adapte ton compliment selon le type d'événement ET le contexte spécifique, 
     en reprenant le ton humoristique du contexte
   - Si la photo montre de la nourriture/boisson, adapte le vocabulaire selon le contexte avec une touche humoristique :
     * Mariage : "Toast à l'amour", "Champagne de l'union", "Gâteau d'amour"
     * Anniversaire : "Cocktail de célébration", "Gâteau aux bougies", "Toast aux années de folie"
     * Entreprise : "Toast au succès", "Cocktail d'équipe", "Célébration professionnelle avec style"
   - Fais des références subtiles et naturelles au contexte sans être trop explicite ou répétitif
   - Évite de répéter le contexte mot pour mot : transforme-le, adapte-le, enrichis-le avec créativité
   - Crée des légendes qui capturent l'esprit humoristique et festif du contexte tout en restant pertinentes à la photo
   
   ÉTAPE 4 - SYNTHÈSE FINALE (CRÉATION DE LA LÉGENDE) :
   - La légende DOIT combiner : [Élément visible dans la photo] + [Vocabulaire adapté au type d'événement] + [Référence subtile au contexte]
   - Vérifie que la légende est spécifique (pas générique)
   - Vérifie la longueur (max 12 mots)
   - Vérifie que les émojis sont pertinents (1-3 max)
   - Vérifie que le ton correspond au type d'événement
   
   EXEMPLES CONCRETS DE COMBINAISON INTELLIGENTE ET HUMORISTIQUE :
   
   Exemple 1 - Mariage avec contexte humoristique :
   Contexte : "Mariage de Sophie et Marc - Union de deux âmes qui s'aiment (et qui aiment faire la fête jusqu'au bout de la nuit !) 💍✨"
   Photo : Couple qui sourit, tient des verres à champagne
   Analyse photo : Couple, sourires, verres à champagne, moment de célébration
   Analyse contexte : Mariage, noms Sophie et Marc, ton humoristique "fête jusqu'au bout de la nuit"
   Légende : "Sophie et Marc, toast à l'amour et à la fête ! 💍🥂"
   (noms = contexte, toast = action visible, "fête" = expression du contexte, amour = vocabulaire mariage)
   
   Exemple 2 - Anniversaire avec contexte humoristique :
   Contexte : "Anniversaire 30 ans de Marie - Trente ans de folie, de rires et de moments magiques (et ça continue !) 🎂🎉"
   Photo : Gâteau avec 30 bougies allumées, personnes autour qui sourient
   Analyse photo : Gâteau, 30 bougies, groupe souriant, célébration
   Analyse contexte : Anniversaire, 30 ans, nom Marie, ton humoristique "folie", "ça continue"
   Légende : "30 bougies pour 30 ans de folie ! 🎂🎉"
   (bougies/gâteau = photo, "folie" = expression du contexte, nom et âge = contexte, joie = vocabulaire anniversaire)
   
   Exemple 3 - Contexte très humoristique "folie et ça continue" :
   Contexte : "Anniversaire 30 ans de Marie - Trente ans de folie, de rires et de moments magiques (et ça continue !) 🎂🎉"
   Photo : Groupe de personnes qui rient, bras levés
   Analyse photo : Groupe, rires, gestes festifs, énergie
   Analyse contexte : Ton très humoristique, "folie", "ça continue", "rires"
   Légende : "La folie continue, rires garantis ! 🎉😂"
   (groupe/rires = photo, "folie continue" = référence directe au contexte, ton humoristique reprendu)
   
   Exemple 4 - Entreprise avec contexte humoristique :
   Contexte : "Soirée entreprise - Parce que le succès se célèbre en équipe (et avec style !) 👥✨"
   Photo : Groupe en tenue professionnelle, toast
   Analyse photo : Groupe, tenues formelles, toast, ambiance conviviale
   Analyse contexte : Entreprise, équipe, ton humoristique "avec style"
   Légende : "Équipe unie, succès avec style ! 👥🥂"
   (groupe/toast = photo, "avec style" = expression du contexte, équipe = contexte, succès = vocabulaire entreprise)
   
   Exemple 5 - Famille avec contexte humoristique :
   Contexte : "Fête de famille - Réunion annuelle où on refait le monde, on partage des fous rires et on crée des souvenirs inoubliables 👨‍👩‍👧‍👦💕"
   Photo : Groupe familial qui rit autour d'une table
   Analyse photo : Groupe famille, rires, moment convivial, table
   Analyse contexte : Famille, ton humoristique "refait le monde", "fous rires"
   Légende : "Fous rires en famille, souvenirs inoubliables ! 👨‍👩‍👧‍👦😂"
   (groupe/rires = photo, "fous rires" = expression du contexte, famille = contexte)
   
   RÈGLE D'OR FINALE : 
   La légende = [Ce que je vois dans la photo] + [Ton/vocabulaire adapté à ${eventType}] + [Référence naturelle et humoristique au contexte "${contextRaw}"]
   
   ⚠️ IMPORTANT : 
   - Le contexte a été créé pour être humoristique et festif - REPRENDS CE TON dans tes légendes !
   - Le contexte est là pour enrichir et personnaliser, pas pour être répété mot pour mot
   - Sois créatif et adapte le contexte à chaque photo unique avec une touche humoristique
   - Si le contexte contient des expressions humoristiques ("folie", "fête", "magique", "ça continue", etc.), 
     utilise-les naturellement dans tes légendes quand elles sont pertinentes
   - Si la photo ne contient pas d'éléments liés à l'événement, utilise quand même le vocabulaire adapté et le ton humoristique du contexte, 
     mais base-toi sur ce qui est réellement visible
   - Ne force JAMAIS des références au contexte si elles ne sont pas naturelles
   - Une légende générique est pire qu'une légende simple mais authentique
   - MAIS une légende qui reprend l'énergie humoristique du contexte est toujours meilleure qu'une légende plate
`;
};

/**
 * Prompt pour la modération de contenu
 * Extrait de aiModerationService.ts
 */
export const PROMPT_MODERATION = `
Analyse cette photo de fête et réponds UNIQUEMENT avec un JSON valide (sans markdown, sans code blocks) avec cette structure exacte :
{
  "hasFaces": boolean,
  "faceCount": number,
  "isAppropriate": boolean,
  "moderationReason": string ou null,
  "suggestedFilter": "none" | "vintage" | "blackwhite" | "warm" | "cool",
  "quality": "good" | "fair" | "poor"
}

Règles :
1. hasFaces: true si la photo contient des visages humains clairement visibles
2. faceCount: nombre de visages détectés (0 si aucun)
3. isAppropriate: false si la photo contient du contenu inapproprié (nudité, violence, contenu offensant, contenu illégal)
4. moderationReason: raison si isAppropriate est false, sinon null
5. suggestedFilter: suggère un filtre esthétique basé sur l'ambiance (vintage pour photos rétro, warm pour ambiance chaleureuse, cool pour ambiance moderne/froide, blackwhite pour photos artistiques, none si aucun filtre nécessaire)
6. quality: évalue la qualité technique (good: nette et bien exposée, fair: acceptable, poor: floue ou mal exposée)

Réponds UNIQUEMENT avec le JSON, rien d'autre.
`;

/**
 * Prompt combiné pour l'analyse complète (modération + légende + tags)
 * Extrait de aiService.ts
 */
export const buildCombinedAnalysisPrompt = (captionPrompt: string): string => {
  return `
Analyse cette photo de fête et réponds UNIQUEMENT avec un JSON valide (sans markdown, sans code blocks) avec cette structure exacte :
{
  "hasFaces": boolean,
  "faceCount": number,
  "isAppropriate": boolean,
  "moderationReason": string | null,
  "suggestedFilter": "none" | "vintage" | "blackwhite" | "warm" | "cool",
  "quality": "good" | "fair" | "poor",
  "estimatedQuality": "excellent" | "good" | "fair" | "poor",
  "suggestedImprovements": string[],
  "caption": string,
  "tags": string[]
}

═══════════════════════════════════════════════════════════════
RÈGLES DE MODÉRATION (ANALYSE TECHNIQUE)
═══════════════════════════════════════════════════════════════

1. hasFaces: true si la photo contient des visages humains clairement visibles (même partiels ou de profil)
2. faceCount: nombre exact de visages détectés (0 si aucun, compte même les visages partiels)
3. isAppropriate: false UNIQUEMENT si la photo contient du contenu inapproprié :
   - Nudité explicite ou suggestive
   - Violence, agression, contenu choquant
   - Contenu offensant, discriminatoire, haineux
   - Contenu illégal
   - Par défaut, isAppropriate = true (sois tolérant pour les photos de fête normales)
4. moderationReason: raison détaillée si isAppropriate est false, sinon null
5. suggestedFilter: suggère un filtre esthétique basé sur l'ambiance :
   - "vintage" : photos rétro, ambiance années 70-80, tons sépia
   - "warm" : ambiance chaleureuse, tons orangés/jaunes, intime
   - "cool" : ambiance moderne/froide, tons bleus/violets, dynamique
   - "blackwhite" : photos artistiques, contrastes forts, élégant
   - "none" : aucun filtre nécessaire, photo déjà optimale
6. quality: évalue la qualité technique :
   - "good" : nette, bien exposée, bonne composition
   - "fair" : acceptable, légèrement floue ou sous/exposée
   - "poor" : très floue, très mal exposée, composition problématique
7. estimatedQuality: évaluation plus précise :
   - "excellent" : parfaite, professionnelle
   - "good" : très bonne qualité
   - "fair" : correcte mais perfectible
   - "poor" : à améliorer significativement
8. suggestedImprovements: tableau de suggestions concrètes (max 5) :
   - Exemples : ["améliorer luminosité", "recadrer", "réduire bruit", "ajuster contraste"]
   - Tableau vide [] si aucune amélioration nécessaire

═══════════════════════════════════════════════════════════════
RÈGLES DE LÉGENDE (CRÉATIVITÉ ET PERSONNALISATION)
═══════════════════════════════════════════════════════════════

${captionPrompt}

⚠️ RAPPEL CRITIQUE POUR LA LÉGENDE :
- Analyse d'abord la photo en détail (personnes, objets, actions, expressions)
- La légende DOIT être spécifique à cette photo, pas générique
- Maximum 12 mots, uniquement en français
- Utilise 1-3 émojis pertinents maximum
- Base-toi sur ce que tu vois réellement, jamais d'invention
- Le champ "caption" doit contenir UNIQUEMENT la légende, rien d'autre
- Si un contexte d'événement est fourni, REPRENDS SON TON HUMORISTIQUE ET FESTIF dans ta légende
- Le contexte a été créé pour être humoristique - adapte cette énergie à chaque photo unique

═══════════════════════════════════════════════════════════════
RÈGLES DE TAGS (MÉTADONNÉES)
═══════════════════════════════════════════════════════════════

- tags: tableau de 3 à 8 tags pertinents en français décrivant la photo
- Tags possibles par catégorie :
  * Actions : danse, rire, célébrer, sourire, trinquer, embrasser, poser, jouer
  * Personnes : groupe, couple, famille, amis, individu, selfie
  * Ambiance : fête, joie, émotion, moment, complicité, tendresse
  * Objets : gâteau, décoration, musique, verre, bouquet, cadeau
  * Lieux : intérieur, extérieur, scène, salle, jardin, plage
  * Événements : mariage, anniversaire, célébration, toast, danse
- Utilise des mots simples et descriptifs, en minuscules
- Choisis les tags les plus pertinents pour cette photo spécifique
- Exemples :
  * Photo de groupe qui danse : ["groupe", "danse", "fête", "joie", "mouvement"]
  * Photo de couple qui trinque : ["couple", "toast", "célébration", "complicité", "verre"]
  * Photo de gâteau : ["gâteau", "anniversaire", "célébration", "bougies", "fête"]

═══════════════════════════════════════════════════════════════
INSTRUCTIONS FINALES
═══════════════════════════════════════════════════════════════

1. Analyse d'abord la photo en détail (modération + contenu)
2. Génère ensuite la légende selon les règles détaillées ci-dessus
3. Crée les tags pertinents basés sur l'analyse
4. Réponds UNIQUEMENT avec le JSON valide, sans markdown, sans code blocks
5. Vérifie que tous les champs sont présents et correctement typés
6. Le JSON doit être valide et parsable directement

FORMAT DE RÉPONSE ATTENDU (exemple) :
{
  "hasFaces": true,
  "faceCount": 3,
  "isAppropriate": true,
  "moderationReason": null,
  "suggestedFilter": "warm",
  "quality": "good",
  "estimatedQuality": "good",
  "suggestedImprovements": [],
  "caption": "Sourires radieux qui illuminent la soirée ! 😊✨",
  "tags": ["groupe", "sourire", "fête", "joie", "complicité"]
}
`;
};

/**
 * Prompt pour l'analyse de photos pour aftermovie
 * Extrait de aftermovieAIService.ts
 */
export const buildAftermovieAnalysisPrompt = (eventContext?: string | null): string => {
  return `
Analyse cette photo de fête et réponds UNIQUEMENT avec un JSON valide (sans markdown, sans code blocks) :

{
  "score": number (0-100, qualité + importance + émotion),
  "isKeyMoment": boolean (true si moment important : émotions fortes, groupes, actions spéciales),
  "suggestedDuration": number (durée en ms, 2000-6000, plus long pour moments clés),
  "suggestedTransition": string ("fade" | "zoom-in" | "zoom-out" | "slide-left" | "slide-right" | "cross-fade"),
  "emotion": string ("joy" | "excitement" | "tenderness" | "celebration" | "neutral"),
  "contentType": string ("group" | "couple" | "individual" | "object" | "scene"),
  "quality": string ("excellent" | "good" | "fair" | "poor"),
  "shouldInclude": boolean (true si la photo doit être dans l'aftermovie),
  "reason": string (raison courte de la décision, max 50 caractères)
}

CRITÈRES D'ANALYSE :
1. score : combine qualité technique (net, exposé) + importance (personnes, actions) + émotion (sourires, joie)
2. isKeyMoment : true si groupe nombreux, émotions fortes, actions spéciales (toast, danse, gâteau)
3. suggestedDuration : 3000-5000ms pour moments clés, 2000-3500ms pour photos normales
4. suggestedTransition : 
   - "zoom-in" pour portraits individuels
   - "zoom-out" pour groupes
   - "slide-left/right" pour panoramas
   - "fade" pour transitions douces
   - "cross-fade" pour moments émotionnels
5. emotion : détecte l'émotion principale visible
6. contentType : type de contenu principal
7. quality : qualité technique (net, exposé, composition)
8. shouldInclude : true sauf si flou, sombre, ou contenu inapproprié
9. reason : explication courte (ex: "Groupe joyeux", "Photo floue", "Moment clé")

${eventContext ? `Contexte de l'événement : ${eventContext}` : ''}
`;
};

/**
 * Template de prompt pour la traduction
 * Extrait de translationService.ts
 */
export const buildTranslationPrompt = (caption: string, languageName: string): string => {
  return `Traduis cette légende de photo de fête en ${languageName}. 
Conserve le ton festif, énergique et humoristique.
Conserve les emojis exactement tels quels.
La longueur doit rester similaire (maximum 12 mots).
Réponds UNIQUEMENT avec la traduction, sans explication, sans guillemets, sans formatage.

Légende à traduire: "${caption}"`;
};

/**
 * Prompt pour la création de contexte d'événement
 * Extrait de eventContextService.ts
 */
export const PROMPT_EVENT_CONTEXT_CREATE = (photoCount: number): string => {
  return `
Analyse ces ${photoCount} photos d'un événement et détermine le type de soirée/événement avec un ton humoristique, festif et mémorable.

═══════════════════════════════════════════════════════════════
OBSERVATION DÉTAILLÉE DES PHOTOS
═══════════════════════════════════════════════════════════════

Observe attentivement chaque photo pour identifier :

1. TYPE D'ÉVÉNEMENT :
   - Mariage : robe de mariée, costume, bouquet, alliance, décoration romantique
   - Anniversaire : gâteau avec bougies, nombre de bougies visible, décoration festive
   - Soirée entreprise : tenues professionnelles, ambiance corporate, esprit d'équipe
   - Fête de famille : plusieurs générations, ambiance chaleureuse, moments tendres
   - Soirée entre amis : ambiance décontractée, rires, complicité
   - Autre : détecte les indices visuels spécifiques

2. ÉLÉMENTS VISUELS SPÉCIFIQUES :
   - Décors et décorations (guirlandes, ballons, lumières, thème)
   - Objets symboliques (gâteau, bouquet, verres à champagne, cadeaux)
   - Tenues (formel, décontracté, costume, uniforme)
   - Ambiance visuelle (romantique, festive, corporate, intime, énergique)

3. AMBIANCE ET ÉNERGIE :
   - Expressions des personnes (sourires, rires, émotions)
   - Actions visibles (danse, toast, célébration, pose)
   - Couleurs dominantes et éclairage
   - Dynamisme général de l'événement

4. DÉTAILS UNIQUES :
   - Éléments qui rendent cet événement spécial
   - Moments particuliers capturés
   - Créativité ou originalité visible

═══════════════════════════════════════════════════════════════
TA MISSION : CRÉER UN CONTEXTE RICHE ET HUMORISTIQUE
═══════════════════════════════════════════════════════════════

Crée un contexte qui :
1. Identifie clairement le type d'événement (mariage, anniversaire, etc.)
2. Capture l'ambiance visible dans les photos
3. Ajoute une touche d'humour, de légèreté et de festivité
4. Reste respectueux et approprié
5. Rend l'événement mémorable et engageant
6. Utilise des expressions énergiques et complices

ADAPTE LE TON SELON LE TYPE DÉTECTÉ :
- Mariage : romantique mais festif, mentionne l'amour et la célébration
- Anniversaire : dynamique et complice, mentionne l'âge si visible
- Entreprise : professionnel mais chaleureux, mentionne l'esprit d'équipe
- Famille : tendre et nostalgique, mentionne les liens familiaux
- Amis : décontracté et complice, mentionne l'amitié et la rigolade

EXEMPLES DE CONTEXTES HUMORISTIQUES ET RICHES :
- "Mariage de Sophie et Marc - L'amour, l'amitié et la fête jusqu'au bout de la nuit ! 💍✨"
- "Anniversaire 30 ans de Marie - Trente ans de bonheur, de rires et de souvenirs inoubliables (et ça continue !) 🎂🎉"
- "Soirée entreprise - Parce que le succès se célèbre en équipe (et avec style !) 👥✨"
- "Fête de famille - Réunion annuelle où les souvenirs se créent et les fous rires explosent 👨‍👩‍👧‍👦💕"
- "Anniversaire de mariage - 25 ans d'amour, de complicité et de moments magiques (toujours aussi amoureux !) 💍💕"
- "Soirée entre amis - Où l'amitié se célèbre, les rires résonnent et les souvenirs se forgent 🍻🎉"

RÈGLES STRICTES :
- Maximum 50 mots (pour laisser de la place à l'humour et aux détails)
- Ton humoristique mais TOUJOURS respectueux et bienveillant
- Identifie clairement le type d'événement
- Ajoute de la personnalité, de l'énergie et de la créativité
- Utilise des émojis pertinents (1-3 max) pour enrichir le contexte
- Si tu ne peux pas déterminer clairement le type, utilise quelque chose de générique mais festif comme "Soirée festive - Où les moments magiques se créent et les sourires illuminent la nuit ✨🎉"
- Le contexte doit être utilisable pour générer des légendes pertinentes et humoristiques

STRUCTURE RECOMMANDÉE :
"[Type d'événement] [Noms si détectables] - [Description principale] ([Touche humoristique ou complémentaire]) [Émojis pertinents]"

IMPORTANT : Réponds UNIQUEMENT avec le contexte suggéré, rien d'autre. Pas de phrases d'introduction, pas d'explications, pas de guillemets autour du contexte.
`;
};

/**
 * Prompt pour l'amélioration de contexte d'événement
 * Extrait de eventContextService.ts
 */
export const PROMPT_EVENT_CONTEXT_IMPROVE = (existingContext: string, photoCount: number): string => {
  return `
Analyse ces ${photoCount} photos d'un événement et améliore le contexte suivant pour le rendre plus humoristique, festif et mémorable.

CONTEXTE ACTUEL : "${existingContext.trim()}"

═══════════════════════════════════════════════════════════════
TA MISSION : CRÉER UN CONTEXTE RICHE ET HUMORISTIQUE
═══════════════════════════════════════════════════════════════

1. CONSERVE LES INFORMATIONS ESSENTIELLES :
   - Type d'événement (mariage, anniversaire, soirée, etc.)
   - Noms des personnes concernées (si présents)
   - Détails importants (âge, date, lieu, thème)
   - Informations spécifiques qui rendent l'événement unique

2. ENRICHIS AVEC DE L'HUMOUR ET DE LA PERSONNALITÉ :
   - Ajoute des jeux de mots subtils et respectueux
   - Utilise des expressions festives et énergiques
   - Intègre des références à l'ambiance visible dans les photos
   - Crée un ton complice et joyeux
   - Utilise des parenthèses pour ajouter des touches humoristiques

3. ADAPTE LE TON SELON LE TYPE D'ÉVÉNEMENT :
   - Mariage : romantique mais festif, mentionne l'amour et la célébration
   - Anniversaire : dynamique et complice, mentionne l'âge ou les années
   - Entreprise : professionnel mais chaleureux, mentionne l'esprit d'équipe
   - Famille : tendre et nostalgique, mentionne les liens familiaux
   - Amis : décontracté et complice, mentionne l'amitié et la rigolade

4. UTILISE LE CONTENU DES PHOTOS POUR ENRICHIR :
   - Si tu vois des éléments spécifiques (gâteau, bouquet, décoration), mentionne-les subtilement
   - Si l'ambiance est particulièrement festive, reflète-la dans le contexte
   - Si les personnes semblent joyeuses, capture cette énergie

EXEMPLES D'AMÉLIORATION INTELLIGENTE :
- "Mariage de Sophie et Marc" 
  → "Mariage de Sophie et Marc - Union de deux âmes qui s'aiment (et qui aiment faire la fête jusqu'au bout de la nuit !) 💍✨"

- "Anniversaire 30 ans de Marie" 
  → "Anniversaire 30 ans de Marie - Trente ans de folie, de rires et de moments magiques (et ça continue !) 🎂🎉"

- "Soirée entreprise" 
  → "Soirée entreprise - Parce que le succès se célèbre en équipe (et avec style !) 👥✨"

- "Fête de famille" 
  → "Fête de famille - Réunion annuelle où on refait le monde, on partage des fous rires et on crée des souvenirs inoubliables 👨‍👩‍👧‍👦💕"

- "Anniversaire de mariage - 25 ans" 
  → "Anniversaire de mariage - 25 ans d'amour, de complicité et de moments magiques (et toujours aussi amoureux !) 💍💕"

RÈGLES STRICTES :
- Maximum 50 mots (pour laisser de la place à l'humour et aux détails)
- Ton humoristique mais TOUJOURS respectueux et bienveillant
- Garde TOUTES les informations importantes du contexte original
- Ajoute de la personnalité, de l'énergie et de la créativité
- Évite les blagues qui pourraient blesser, être mal interprétées ou inappropriées
- Utilise des émojis pertinents (1-3 max) pour enrichir le contexte
- Le contexte doit être utilisable pour générer des légendes pertinentes et humoristiques

STRUCTURE RECOMMANDÉE :
"[Type d'événement] [Noms si présents] - [Description principale] ([Touche humoristique ou complémentaire]) [Émojis pertinents]"

IMPORTANT : Réponds UNIQUEMENT avec le contexte amélioré, rien d'autre. Pas de phrases d'introduction, pas d'explications, pas de guillemets autour du contexte.
`;
};

// ============================================================================
// EXPORTS ORGANISÉS
// ============================================================================

export const PROMPTS = {
  caption: {
    base: CAPTION_PROMPT_BASE,
    buildPersonalized: buildPersonalizedCaptionPrompt,
  },
  moderation: PROMPT_MODERATION,
  combinedAnalysis: buildCombinedAnalysisPrompt,
  aftermovieAnalysis: buildAftermovieAnalysisPrompt,
  translation: buildTranslationPrompt,
  eventContext: {
    create: PROMPT_EVENT_CONTEXT_CREATE,
    improve: PROMPT_EVENT_CONTEXT_IMPROVE,
  },
} as const;

