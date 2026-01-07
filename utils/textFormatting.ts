/**
 * Divise un texte en lignes de maximum maxLength caractères sans couper les mots
 * @param text - Le texte à diviser
 * @param maxLength - La longueur maximale par ligne (défaut: 50)
 * @returns Un tableau de lignes
 */
export const splitTextIntoLines = (text: string, maxLength: number = 50): string[] => {
  if (!text || text.length === 0) {
    return [];
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxLength) {
      currentLine = testLine;
    } else {
      // Si la ligne actuelle n'est pas vide, on l'ajoute et on commence une nouvelle ligne
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Si le mot seul dépasse maxLength, on le coupe (cas rare)
        lines.push(word.substring(0, maxLength));
        currentLine = word.substring(maxLength);
      }
    }
  }

  // Ajouter la dernière ligne si elle existe
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

