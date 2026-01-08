import React from 'react';
import { RefreshCw, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import { Photo } from '../../types';

interface ModerationTabProps {
  photos: Photo[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (photo: Photo) => void;
}

export const ModerationTab: React.FC<ModerationTabProps> = ({
  photos,
  loading,
  onRefresh,
  onDelete
}) => {
  return (
    <>
      <div className="flex justify-end mb-4">
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 hover:bg-slate-800/50 rounded-lg transition-colors text-sm text-slate-300 border border-slate-800"
          title="Rafraîchir la liste"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualiser</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {photos.map(photo => (
            <div 
              key={photo.id} 
              className="relative group bg-slate-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="aspect-square bg-slate-950 relative overflow-hidden">
                {photo.type === 'video' ? (
                  <video
                    src={photo.url}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img 
                    src={photo.url} 
                    alt={photo.caption} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                {photo.type === 'video' && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                    <Video className="w-3 h-3 text-white" />
                    {photo.duration && (
                      <span className="text-white text-[10px] font-medium">
                        {Math.floor(photo.duration)}s
                      </span>
                    )}
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                  <button
                    onClick={() => onDelete(photo)}
                    className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white transform hover:scale-110 transition-all shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <p className="font-medium text-sm truncate text-slate-100 mb-1">
                  {photo.author || 'Anonyme'}
                </p>
                <p className="text-xs text-slate-400 truncate mb-2">
                  {photo.caption || 'Sans description'}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(photo.timestamp).toLocaleString('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}

          {photos.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-64 text-slate-500">
              <ImageIcon className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-base font-medium">Aucune photo à modérer</p>
              <p className="text-sm text-slate-600 mt-2">Les nouvelles photos apparaîtront ici</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

