import React from 'react';
import { Award, Camera, Star } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { AuthorStats } from '../../types';

interface TopPhotographerCardProps {
  topPhotographer: AuthorStats | null;
  uploadUrl: string;
  variant?: 'display' | 'normal';
}

export const TopPhotographerCard: React.FC<TopPhotographerCardProps> = ({
  topPhotographer,
  uploadUrl,
  variant = 'normal',
}) => {
  if (variant === 'display') {
    return (
      <div className="col-span-5 rounded-lg border border-white/5 bg-gray-900/50 backdrop-blur-sm p-3 overflow-hidden relative">
        <div className="absolute top-0 right-0 px-2 py-1 rounded-bl-lg bg-purple-500/10 border-b border-l border-purple-400/15 text-purple-300 text-xs font-bold flex items-center gap-1.5">
          <Award className="w-3 h-3" />
          Photographe
        </div>

        <div className="h-full flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {topPhotographer ? (
              <>
                <div className="text-lg font-bold text-white truncate">
                  {topPhotographer.author}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-400/15 text-blue-200 text-xs font-semibold">
                    <Camera className="w-3 h-3" /> {topPhotographer.photoCount}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-500/10 border border-yellow-400/15 text-yellow-200 text-xs font-semibold">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" /> {topPhotographer.totalLikes}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-white/40">
                  Score = likes × 10 + photos × 5
                </div>
              </>
            ) : (
              <div className="h-full flex items-center text-white/40 text-sm font-medium">
                En attente de photos…
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div className="rounded-lg border border-white/5 bg-white/5 p-1.5">
              <QRCodeCanvas value={uploadUrl} size={70} includeMargin={false} />
            </div>
            <div className="text-[10px] text-white/50 max-w-[100px] leading-tight">
              Scanne pour rejoindre
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-purple-400" />
        <h3 className="text-base font-bold text-white">Photographe de la Soirée 📸</h3>
      </div>
      {topPhotographer ? (
        <div className="space-y-1.5">
          <p className="text-gray-300 text-sm">
            <span className="font-semibold text-white">{topPhotographer.author}</span>
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Camera className="w-3 h-3 text-blue-400" />
              <span>{topPhotographer.photoCount} photos</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span>{topPhotographer.totalLikes} likes totaux</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">En attente de photos…</p>
      )}
    </div>
  );
};

