import { Photo, FilterOptions } from '../types';

/**
 * Filtre et trie les photos selon les options fournies
 * @param photos - Liste des photos à filtrer
 * @param options - Options de filtrage et tri
 * @returns Liste filtrée et triée des photos
 */
export const filterAndSortPhotos = (
  photos: Photo[],
  options: FilterOptions
): Photo[] => {
  let filtered = [...photos];
  
  // Filtre par type de média
  if (options.mediaFilter !== 'all') {
    filtered = filtered.filter(p => p.type === options.mediaFilter);
  }
  
  // Filtre par auteur(s)
  if (options.selectedAuthors && options.selectedAuthors.length > 0) {
    filtered = filtered.filter(p => 
      options.selectedAuthors.includes(p.author)
    );
  }
  
  // Filtre par recherche textuelle (auteur ou légende)
  if (options.searchQuery.trim()) {
    const query = options.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.author.toLowerCase().includes(query) || 
      p.caption.toLowerCase().includes(query)
    );
  }
  
  // Tri
  if (options.sortBy === 'recent') {
    filtered.sort((a, b) => b.timestamp - a.timestamp);
  } else {
    filtered.sort((a, b) => b.likes_count - a.likes_count);
  }
  
  return filtered;
};

