import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, RotateCcw, Sun, Contrast, Droplets, 
  Type, Smile, Filter, Wand2, ChevronLeft, ChevronRight,
  Type as TypeIcon, Trash2, Move, Scaling
} from 'lucide-react';
import { Photo } from '../../types';
import { applyImageFilter, FilterType } from '../../utils/imageFilters';
import { useToast } from '../../context/ToastContext';

interface PhotoEditorProps {
  photo: Photo;
  onClose: () => void;
  onSave: (editedDataUrl: string) => void;
}

interface Sticker {
  id: string;
  type: 'emoji' | 'text';
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  font?: string;
  color?: string;
}

const FONTS = [
  { name: 'Sans', value: 'sans-serif' },
  { name: 'Serif', value: 'serif' },
  { name: 'Handwriting', value: '"Caveat", cursive' },
  { name: 'Modern', value: '"Montserrat", sans-serif' },
  { name: 'Playful', value: '"Bubblegum Sans", cursive' }
];

const EMOJIS = ['❤️', '🔥', '✨', '🎉', '📸', '🥳', '🤘', '⭐', '🎈', '💖', '🌈', '😎'];

const FILTERS: { name: string; type: FilterType; label: string }[] = [
  { name: 'Aucun', type: 'none', label: 'None' },
  { name: 'Vintage', type: 'vintage', label: 'Vintage' },
  { name: 'Noir & Blanc', type: 'blackwhite', label: 'B&W' },
  { name: 'Sépia', type: 'sepia', label: 'Sepia' },
  { name: 'Chaud', type: 'warm', label: 'Warm' },
  { name: 'Froid', type: 'cool', label: 'Cool' }
];

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ photo, onClose, onSave }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters' | 'stickers' | 'text'>('adjust');
  
  // Base image state
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  
  // Stickers and Text layers
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Text input state
  const [textInput, setTextInput] = useState('');
  const [activeFont, setActiveFont] = useState(FONTS[0].value);
  const [activeColor, setActiveColor] = useState('#ffffff');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.url;
    img.onload = () => {
      imageRef.current = img;
      renderPreview();
    };
  }, [photo.url]);

  const renderPreview = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Set canvas dimensions to match image natural size for processing
    // But for the editor UI, we might need a display scaling
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply basic adjustments and filter
    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    // For specialized filters like vintage/sepia, we might need to apply them differently
    // but here we combine them in the ctx.filter string if possible, 
    // or we'd need a multi-pass approach. 
    // To keep it simple, let's use the CSS filter string.
    let filterString = ctx.filter;
    if (activeFilter === 'vintage') filterString += ' sepia(50%) contrast(120%)';
    if (activeFilter === 'blackwhite') filterString += ' grayscale(100%)';
    if (activeFilter === 'sepia') filterString += ' sepia(100%)';
    if (activeFilter === 'warm') filterString += ' sepia(30%) saturate(120%)';
    if (activeFilter === 'cool') filterString += ' hue-rotate(180deg) saturate(80%)';
    
    ctx.filter = filterString;
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // Layers (stickers and text) will be rendered by React on top of the canvas for interaction
    // Only the final export will draw them to the canvas.
  }, [brightness, contrast, saturation, activeFilter]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const addEmoji = (emoji: string) => {
    const newSticker: Sticker = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'emoji',
      content: emoji,
      x: 50, // center %
      y: 50,
      scale: 1,
      rotation: 0
    };
    setStickers([...stickers, newSticker]);
    setSelectedElementId(newSticker.id);
  };

  const addText = () => {
    if (!textInput.trim()) return;
    const newText: Sticker = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: textInput,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      font: activeFont,
      color: activeColor
    };
    setStickers([...stickers, newText]);
    setTextInput('');
    setSelectedElementId(newText.id);
  };

  const removeElement = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleExport = async () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    addToast('Génération de l\'image...', 'info');
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The canvas already has the filtered image. Now we draw stickers.
    // We need to map % coordinates to pixel coordinates.
    stickers.forEach(s => {
      ctx.save();
      const px = (s.x / 100) * canvas.width;
      const py = (s.y / 100) * canvas.height;
      
      ctx.translate(px, py);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.scale(s.scale, s.scale);

      if (s.type === 'emoji') {
        const fontSize = Math.floor(canvas.width * 0.1);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.content, 0, 0);
      } else {
        const fontSize = Math.floor(canvas.width * 0.08);
        ctx.font = `${fontSize}px ${s.font || 'sans-serif'}`;
        ctx.fillStyle = s.color || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.content, 0, 0);
      }
      ctx.restore();
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(dataUrl);
  };

  const resetAll = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setActiveFilter('none');
    setStickers([]);
    setSelectedElementId(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col md:flex-row overflow-hidden"
    >
      {/* Header - Mobile Only */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10">
        <button onClick={onClose} className="p-2 text-white/70">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold">Éditeur Photo</h2>
        <button onClick={handleExport} className="p-2 text-indigo-400 font-bold">
          OK
        </button>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-12 overflow-hidden">
        <div 
          ref={containerRef}
          className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden"
          onClick={() => setSelectedElementId(null)}
        >
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain block"
          />
          
          {/* Overlay for Stickers/Text interaction */}
          <div className="absolute inset-0 pointer-events-none">
            {stickers.map((s) => (
              <motion.div
                key={s.id}
                drag
                dragMomentum={false}
                onDrag={(e, info) => {
                  if (!containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  const newX = ((info.point.x - rect.left) / rect.width) * 100;
                  const newY = ((info.point.y - rect.top) / rect.height) * 100;
                  setStickers(prev => prev.map(item => 
                    item.id === s.id ? { ...item, x: newX, y: newY } : item
                  ));
                }}
                onTap={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(s.id);
                }}
                className={`absolute pointer-events-auto cursor-move select-none ${selectedElementId === s.id ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent rounded' : ''}`}
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
                  color: s.color,
                  fontFamily: s.font,
                  fontSize: s.type === 'emoji' ? '3rem' : '2rem',
                  fontWeight: 'bold',
                  zIndex: selectedElementId === s.id ? 50 : 10
                }}
              >
                {s.content}
                
                {/* Control handles when selected */}
                {selectedElementId === s.id && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-xl">
                    <button 
                      className="p-1 text-red-400 hover:text-red-300"
                      onClick={(e) => { e.stopPropagation(); removeElement(s.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <button 
                      className="p-1 text-white hover:text-indigo-400"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // Scale/Rotate logic simplified
                        setStickers(prev => prev.map(item => 
                          item.id === s.id ? { ...item, scale: Math.min(3, item.scale + 0.1) } : item
                        ));
                      }}
                    >
                      <Scaling className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-1 text-white hover:text-indigo-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStickers(prev => prev.map(item => 
                          item.id === s.id ? { ...item, rotation: (item.rotation + 45) % 360 } : item
                        ));
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="w-full md:w-[400px] bg-slate-900/50 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col p-6 overflow-y-auto">
        <div className="hidden md:flex items-center justify-between mb-8">
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 uppercase tracking-widest">Éditeur</h2>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-black/20 p-1 rounded-2xl">
          {[
            { id: 'adjust', icon: Wand2, label: 'Retouche' },
            { id: 'filters', icon: Filter, label: 'Filtres' },
            { id: 'stickers', icon: Smile, label: 'Stickers' },
            { id: 'text', icon: TypeIcon, label: 'Texte' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 space-y-8">
          {activeTab === 'adjust' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Sun className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase">Luminosité</span>
                  </div>
                  <span className="text-xs font-mono">{brightness}%</span>
                </div>
                <input 
                  type="range" min="50" max="150" value={brightness} 
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Contrast className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase">Contraste</span>
                  </div>
                  <span className="text-xs font-mono">{contrast}%</span>
                </div>
                <input 
                  type="range" min="50" max="150" value={contrast} 
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Droplets className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase">Saturation</span>
                  </div>
                  <span className="text-xs font-mono">{saturation}%</span>
                </div>
                <input 
                  type="range" min="0" max="200" value={saturation} 
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              <button 
                onClick={resetAll}
                className="w-full py-4 mt-8 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="grid grid-cols-2 gap-4">
              {FILTERS.map((f) => (
                <button
                  key={f.type}
                  onClick={() => setActiveFilter(f.type)}
                  className={`group relative overflow-hidden rounded-2xl aspect-video border-2 transition-all ${
                    activeFilter === f.type ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-white/10'
                  }`}
                >
                  <div className="absolute inset-0 bg-slate-800 flex items-center justify-center font-bold text-xs uppercase tracking-wider text-slate-400">
                    {f.name}
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'stickers' && (
            <div className="grid grid-cols-4 gap-4">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="aspect-square flex items-center justify-center text-4xl bg-white/5 hover:bg-white/10 rounded-2xl transition-all hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none"
                />
                
                <div className="flex flex-wrap gap-2">
                  {FONTS.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => setActiveFont(font.value)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        activeFont === font.value ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['#ffffff', '#f8fafc', '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#22d3ee', '#10b981', '#f59e0b', '#000000'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setActiveColor(color)}
                      className={`w-8 h-8 rounded-full flex-shrink-0 border-2 ${
                        activeColor === color ? 'border-white ring-2 ring-indigo-500' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <button
                  onClick={addText}
                  disabled={!textInput.trim()}
                  className="w-full py-4 bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Ajouter le texte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

