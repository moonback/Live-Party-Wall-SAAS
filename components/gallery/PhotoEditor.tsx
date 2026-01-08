import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, RotateCcw, Sun, Contrast, Droplets, 
  Type, Smile, Filter, Wand2, ChevronLeft, ChevronRight,
  Type as TypeIcon, Trash2, Move, Scaling, RotateCw, ZoomIn, ZoomOut, Minus, Plus
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

const EMOJIS = ['❤️', '🔥', '✨', '🎉', '📸', '🥳', '🤘', '⭐', '🎈', '💖', '🌈', '😎', '🎊', '💯', '👑', '🎁'];

const FILTERS: { name: string; type: FilterType; label: string; preview?: string }[] = [
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
  const [isSaving, setIsSaving] = useState(false);
  
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
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [displayScale, setDisplayScale] = useState(1);

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
    if (!canvasRef.current || !previewCanvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    if (!ctx || !previewCtx) return;

    const img = imageRef.current;
    
    // Set canvas dimensions to match image natural size for processing
    canvas.width = img.width;
    canvas.height = img.height;

    // Set preview canvas for display (scaled down for performance)
    const maxDisplaySize = 1200;
    const scale = Math.min(maxDisplaySize / img.width, maxDisplaySize / img.height, 1);
    previewCanvas.width = img.width * scale;
    previewCanvas.height = img.height * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Apply basic adjustments and filter
    ctx.save();
    previewCtx.save();
    
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (activeFilter === 'vintage') filterString += ' sepia(50%) contrast(120%)';
    if (activeFilter === 'blackwhite') filterString += ' grayscale(100%)';
    if (activeFilter === 'sepia') filterString += ' sepia(100%)';
    if (activeFilter === 'warm') filterString += ' sepia(30%) saturate(120%)';
    if (activeFilter === 'cool') filterString += ' hue-rotate(180deg) saturate(80%)';
    
    ctx.filter = filterString;
    previewCtx.filter = filterString;
    
    ctx.drawImage(img, 0, 0);
    previewCtx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
    
    ctx.restore();
    previewCtx.restore();
  }, [brightness, contrast, saturation, activeFilter]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const addEmoji = (emoji: string) => {
    const newSticker: Sticker = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'emoji',
      content: emoji,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0
    };
    setStickers([...stickers, newSticker]);
    setSelectedElementId(newSticker.id);
    addToast('Emoji ajouté !', 'success');
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
    addToast('Texte ajouté !', 'success');
  };

  const removeElement = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
    addToast('Élément supprimé', 'info');
  };

  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setStickers(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleExport = async () => {
    if (!canvasRef.current || !imageRef.current || isSaving) return;
    
    setIsSaving(true);
    addToast('Génération de l\'image...', 'info');
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Re-render base image with filters
      renderPreview();

      // Draw stickers on top
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
          
          // Add text stroke for better visibility
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = Math.floor(fontSize * 0.1);
          ctx.strokeText(s.content, 0, 0);
          ctx.fillText(s.content, 0, 0);
        }
        ctx.restore();
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onSave(dataUrl);
    } catch (error) {
      console.error('Export error:', error);
      addToast('Erreur lors de l\'export', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAll = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setActiveFilter('none');
    setStickers([]);
    setSelectedElementId(null);
    addToast('Réinitialisé', 'info');
  };

  const selectedSticker = stickers.find(s => s.id === selectedElementId);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-black to-slate-900 backdrop-blur-2xl flex flex-col md:flex-row overflow-hidden"
    >
      {/* Header - Mobile Only */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button onClick={onClose} className="p-2 text-white/70 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
          Éditeur Photo
        </h2>
        <button 
          onClick={handleExport} 
          disabled={isSaving}
          className="p-2 text-indigo-400 hover:text-indigo-300 font-bold disabled:opacity-50 transition-colors"
        >
          {isSaving ? '...' : 'OK'}
        </button>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
        <div 
          ref={containerRef}
          className="relative max-w-full max-h-full shadow-2xl rounded-2xl overflow-hidden bg-black/20 border border-white/10"
          onClick={() => setSelectedElementId(null)}
        >
          <canvas 
            ref={previewCanvasRef} 
            className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain block"
            style={{ imageRendering: 'high-quality' }}
          />
          
          {/* Hidden canvas for final export */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay for Stickers/Text interaction */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatePresence>
              {stickers.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  drag
                  dragMomentum={false}
                  dragConstraints={containerRef}
                  onDrag={(e, info) => {
                    if (!containerRef.current) return;
                    const rect = containerRef.current.getBoundingClientRect();
                    const newX = Math.max(0, Math.min(100, ((info.point.x - rect.left) / rect.width) * 100));
                    const newY = Math.max(0, Math.min(100, ((info.point.y - rect.top) / rect.height) * 100));
                    updateSticker(s.id, { x: newX, y: newY });
                  }}
                  onTap={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(s.id);
                  }}
                  className={`absolute pointer-events-auto cursor-move select-none transition-all ${
                    selectedElementId === s.id ? 'ring-2 ring-indigo-500 ring-offset-2 z-50' : 'z-10'
                  }`}
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
                    color: s.color,
                    fontFamily: s.font,
                    fontSize: s.type === 'emoji' ? '3rem' : '2rem',
                    fontWeight: 'bold',
                    filter: selectedElementId === s.id ? 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.5))' : 'none'
                  }}
                >
                  {s.content}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="w-full md:w-[420px] bg-gradient-to-b from-slate-900/90 to-black/90 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-6 border-b border-white/10">
          <button 
            onClick={onClose} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 uppercase tracking-widest">
            Éditeur
          </h2>
          <button 
            onClick={handleExport}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-2 bg-black/30 border-b border-white/10">
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
                activeTab === tab.id 
                  ? 'bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <AnimatePresence mode="wait">
            {activeTab === 'adjust' && (
              <motion.div
                key="adjust"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Sun className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold">Luminosité</span>
                      </div>
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded">{brightness}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="150" value={brightness} 
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                      style={{
                        background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${brightness - 50}%, rgba(255,255,255,0.1) ${brightness - 50}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Contrast className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-bold">Contraste</span>
                      </div>
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded">{contrast}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="150" value={contrast} 
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
                      style={{
                        background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${contrast - 50}%, rgba(255,255,255,0.1) ${contrast - 50}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-bold">Saturation</span>
                      </div>
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded">{saturation}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="200" value={saturation} 
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      style={{
                        background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${saturation / 2}%, rgba(255,255,255,0.1) ${saturation / 2}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>
                </div>
                <button 
                  onClick={resetAll}
                  className="w-full py-3.5 border-2 border-white/10 hover:border-white/20 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Réinitialiser
                </button>
              </motion.div>
            )}

            {activeTab === 'filters' && (
              <motion.div
                key="filters"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 gap-3"
              >
                {FILTERS.map((f) => (
                  <button
                    key={f.type}
                    onClick={() => setActiveFilter(f.type)}
                    className={`group relative overflow-hidden rounded-xl aspect-video border-2 transition-all ${
                      activeFilter === f.type 
                        ? 'border-indigo-500 ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/20' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`absolute inset-0 flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-all ${
                      activeFilter === f.type ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50'
                    }`}>
                      {f.name}
                    </div>
                    {activeFilter === f.type && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}

            {activeTab === 'stickers' && (
              <motion.div
                key="stickers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-4 gap-3">
                  {EMOJIS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addEmoji(emoji)}
                      className="aspect-square flex items-center justify-center text-4xl bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
                
                {selectedSticker && selectedSticker.type === 'emoji' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3"
                  >
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contrôles</div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-300">Taille</span>
                          <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded">{Math.round(selectedSticker.scale * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateSticker(selectedSticker.id, { scale: Math.max(0.5, selectedSticker.scale - 0.1) })}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={selectedSticker.scale}
                            onChange={(e) => updateSticker(selectedSticker.id, { scale: parseFloat(e.target.value) })}
                            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none accent-indigo-500"
                          />
                          <button
                            onClick={() => updateSticker(selectedSticker.id, { scale: Math.min(3, selectedSticker.scale + 0.1) })}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-300">Rotation</span>
                          <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded">{selectedSticker.rotation}°</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateSticker(selectedSticker.id, { rotation: (selectedSticker.rotation - 15) % 360 })}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="15"
                            value={selectedSticker.rotation}
                            onChange={(e) => updateSticker(selectedSticker.id, { rotation: parseInt(e.target.value) })}
                            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none accent-indigo-500"
                          />
                          <button
                            onClick={() => updateSticker(selectedSticker.id, { rotation: (selectedSticker.rotation + 15) % 360 })}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeElement(selectedSticker.id)}
                        className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Tapez votre message..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        addText();
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] resize-none"
                  />
                  
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Police</div>
                    <div className="flex flex-wrap gap-2">
                      {FONTS.map((font) => (
                        <button
                          key={font.name}
                          onClick={() => setActiveFont(font.value)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeFont === font.value 
                              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                          style={{ fontFamily: font.value }}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Couleur</div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {['#ffffff', '#f8fafc', '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#22d3ee', '#10b981', '#f59e0b', '#000000'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setActiveColor(color)}
                          className={`w-10 h-10 rounded-xl flex-shrink-0 border-2 transition-all ${
                            activeColor === color 
                              ? 'border-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-110' 
                              : 'border-transparent hover:border-white/30'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={addText}
                    disabled={!textInput.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Type className="w-4 h-4" />
                    Ajouter le texte
                  </button>
                </div>

                {selectedSticker && selectedSticker.type === 'text' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3"
                  >
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contrôles du texte</div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-300">Taille</span>
                          <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded">{Math.round(selectedSticker.scale * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateSticker(selectedSticker.id, { scale: Math.max(0.5, selectedSticker.scale - 0.1) })}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={selectedSticker.scale}
                            onChange={(e) => updateSticker(selectedSticker.id, { scale: parseFloat(e.target.value) })}
                            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none accent-indigo-500"
                          />
                          <button
                            onClick={() => updateSticker(selectedSticker.id, { scale: Math.min(3, selectedSticker.scale + 0.1) })}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-300">Rotation</span>
                          <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded">{selectedSticker.rotation}°</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateSticker(selectedSticker.id, { rotation: (selectedSticker.rotation - 15) % 360 })}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="15"
                            value={selectedSticker.rotation}
                            onChange={(e) => updateSticker(selectedSticker.id, { rotation: parseInt(e.target.value) })}
                            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none accent-indigo-500"
                          />
                          <button
                            onClick={() => updateSticker(selectedSticker.id, { rotation: (selectedSticker.rotation + 15) % 360 })}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-300 mb-2">Couleur</div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {['#ffffff', '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1', '#3b82f6', '#22d3ee', '#10b981', '#f59e0b', '#000000'].map((color) => (
                            <button
                              key={color}
                              onClick={() => updateSticker(selectedSticker.id, { color })}
                              className={`w-8 h-8 rounded-lg flex-shrink-0 border-2 ${
                                selectedSticker.color === color 
                                  ? 'border-white ring-2 ring-indigo-500' 
                                  : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removeElement(selectedSticker.id)}
                        className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
