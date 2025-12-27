
import React, { useState, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { 
  ThumbnailConfig, 
  GenerationState, 
  StylePreset, 
  FacePosition, 
  TextSize, 
  ColorMood, 
  GlowIntensity,
  Platform,
  AspectRatio,
  BackgroundStyle,
  FontFamily
} from './types';
import { getDesignAdvice, generateThumbnail } from './services/geminiService';
import { 
  Upload, 
  Settings2, 
  Sparkles, 
  Download, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  Eye,
  Image as ImageIcon,
  Smartphone,
  Youtube,
  Instagram,
  FileImage,
  Layers,
  Palette,
  Sun,
  Type,
  Square,
  Compass
} from 'lucide-react';

const STYLE_PRESETS: StylePreset[] = ['Cinematic', 'Horror/Dark', 'Viral Bright', 'Minimal Clean', 'Dramatic Storytelling', 'Neon Cyber'];
const FACE_POSITIONS: FacePosition[] = ['Left', 'Right', 'Center'];
const TEXT_SIZES: TextSize[] = ['Small', 'Medium', 'Large'];
const COLOR_MOODS: ColorMood[] = ['Auto', 'Warm', 'Cold', 'Neon', 'Dark'];
const GLOW_INTENSITIES: GlowIntensity[] = ['Auto', 'Low', 'Medium', 'High'];
const FONT_FAMILIES: FontFamily[] = ['Auto (AI Select)', 'Modern Sans', 'Impact Heavy', 'Cyberpunk', 'Elegant Serif', 'Playful Rounded'];

const BG_STYLES: BackgroundStyle[] = [
  'Auto-Context',
  'Cinematic',
  'Horror / Dark',
  'Bright / Viral',
  'Minimal Clean',
  'Tech / Futuristic',
  'Mystery / Thriller',
  'Fantasy / Anime',
  'Custom'
];

interface PlatformOption {
  id: Platform;
  name: string;
  ratio: AspectRatio;
  icon: React.ReactNode;
}

const PLATFORMS: PlatformOption[] = [
  { id: 'YouTube', name: 'YouTube Thumbnail', ratio: '16:9', icon: <Youtube className="w-4 h-4" /> },
  { id: 'Shorts/Reels', name: 'Shorts / Reels', ratio: '9:16', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'IG Post', name: 'Instagram Post', ratio: '1:1', icon: <Instagram className="w-4 h-4" /> },
  { id: 'IG Portrait', name: 'Instagram Portrait', ratio: '3:4', icon: <FileImage className="w-4 h-4" /> },
];

export default function App() {
  const [config, setConfig] = useState<ThumbnailConfig>({
    videoTitle: '',
    faceImage: null,
    backgroundImage: null,
    referenceImage: null,
    backgroundStyle: 'Auto-Context',
    customBackgroundDescription: '',
    style: 'Cinematic',
    facePosition: 'Right',
    textSize: 'Medium',
    fontFamily: 'Auto (AI Select)',
    textOutline: true,
    textShadow: true,
    colorMood: 'Auto',
    glowIntensity: 'Auto',
    platform: 'YouTube',
    aspectRatio: '16:9',
    exportFormat: 'png'
  });

  const [state, setState] = useState<GenerationState>({
    isAnalyzing: false,
    isGenerating: false,
    error: null,
    resultImage: null,
    logs: [],
  });

  const faceInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setState(prev => ({ ...prev, logs: [msg, ...prev.logs.slice(0, 4)] }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'bg' | 'ref') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'face') {
          setConfig(prev => ({ ...prev, faceImage: result }));
        } else if (type === 'bg') {
          setConfig(prev => ({ ...prev, backgroundImage: result }));
        } else {
          setConfig(prev => ({ ...prev, referenceImage: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = (type: 'face' | 'bg' | 'ref') => {
    if (type === 'face') setConfig(prev => ({ ...prev, faceImage: null }));
    else if (type === 'bg') setConfig(prev => ({ ...prev, backgroundImage: null }));
    else setConfig(prev => ({ ...prev, referenceImage: null }));
  };

  const handlePlatformChange = (p: PlatformOption) => {
    setConfig(prev => ({ 
      ...prev, 
      platform: p.id, 
      aspectRatio: p.ratio,
      textSize: (p.id === 'Shorts/Reels' || p.id === 'IG Portrait') ? 'Large' : 'Medium'
    }));
  };

  const handleGenerate = async () => {
    if (!config.videoTitle.trim()) {
      setState(prev => ({ ...prev, error: "Please enter a video title." }));
      return;
    }
    if (!config.faceImage) {
      setState(prev => ({ ...prev, error: "Please upload your headshot image." }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null, resultImage: null, logs: [] }));
    addLog(`Targeting ${config.platform}...`);

    try {
      const advice = await getDesignAdvice(config);
      addLog(`AI Hook: "${advice.hookText}"`);
      if (config.referenceImage) addLog("Analyzing reference style...");
      
      setState(prev => ({ ...prev, isAnalyzing: false, isGenerating: true }));
      addLog("Generating platform-optimized composition...");

      const image = await generateThumbnail(config, advice);
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        resultImage: image, 
        logs: ["Visual ready!", ...prev.logs] 
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        isGenerating: false, 
        error: err.message || "Something went wrong during generation." 
      }));
    }
  };

  const downloadImage = () => {
    if (!state.resultImage) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill white background for JPGs (since PNG might have transparency)
      if (config.exportFormat === 'jpg') {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);

      const mimeType = config.exportFormat === 'png' ? 'image/png' : 'image/jpeg';
      const quality = config.exportFormat === 'jpg' ? 0.92 : undefined;
      
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `thumbnail-${config.platform.toLowerCase().replace('/', '-')}-${Date.now()}.${config.exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = state.resultImage;
  };

  const getAspectClass = () => {
    switch(config.aspectRatio) {
      case '16:9': return 'aspect-video w-full';
      case '9:16': return 'aspect-[9/16] h-[600px] w-auto mx-auto';
      case '1:1': return 'aspect-square h-[500px] w-auto mx-auto';
      case '3:4': return 'aspect-[3/4] h-[550px] w-auto mx-auto';
      default: return 'aspect-video w-full';
    }
  };

  const handleGlowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setConfig({ ...config, glowIntensity: GLOW_INTENSITIES[value] });
  };

  const glowIndex = GLOW_INTENSITIES.indexOf(config.glowIntensity);

  return (
    <Layout>
      {/* Sidebar Controls */}
      <aside className="w-full md:w-80 lg:w-96 border-r border-white/10 p-6 flex flex-col gap-6 bg-black/40 overflow-y-auto max-h-screen no-scrollbar">
        <section>
          <label className="text-xs font-bold text-zinc-500 mb-3 block uppercase tracking-widest">Target Platform</label>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePlatformChange(p)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-[10px] transition-all ${
                  config.platform === p.id 
                    ? 'bg-red-600/10 border-red-600 text-red-500' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {p.icon}
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="text-xs font-bold text-zinc-500 mb-3 block uppercase tracking-widest">Content Hook</label>
          <textarea
            value={config.videoTitle}
            onChange={(e) => setConfig({ ...config, videoTitle: e.target.value })}
            placeholder="Enter video title or topic..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-600/50 transition-all min-h-[60px] mb-4"
          />
          
          <label className="text-[10px] font-bold text-zinc-500 mb-2 block uppercase tracking-widest">Visual Assets</label>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <div 
                onClick={() => faceInputRef.current?.click()}
                className={`border border-dashed rounded-lg p-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative overflow-hidden h-24 bg-zinc-900/50 hover:bg-zinc-900 ${
                  config.faceImage ? 'border-red-600/40' : 'border-zinc-800'
                }`}
              >
                {config.faceImage ? (
                  <img src={config.faceImage} alt="Headshot" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[8px] text-zinc-500 text-center leading-tight font-bold uppercase tracking-tighter">Your Face</span>
                  </>
                )}
              </div>
              {config.faceImage && (
                <button onClick={() => clearImage('face')} className="absolute -top-1 -right-1 bg-black border border-white/10 rounded-full p-1 z-10 hover:bg-zinc-800">
                  <Trash2 className="w-2.5 h-2.5 text-red-500" />
                </button>
              )}
              <input type="file" ref={faceInputRef} onChange={(e) => handleImageUpload(e, 'face')} className="hidden" accept="image/*" />
            </div>

            <div className="relative">
              <div 
                onClick={() => bgInputRef.current?.click()}
                className={`border border-dashed rounded-lg p-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative overflow-hidden h-24 bg-zinc-900/50 hover:bg-zinc-900 ${
                  config.backgroundImage ? 'border-red-600/40' : 'border-zinc-800'
                }`}
              >
                {config.backgroundImage ? (
                  <img src={config.backgroundImage} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[8px] text-zinc-500 text-center leading-tight font-bold uppercase tracking-tighter">Custom BG</span>
                  </>
                )}
              </div>
              {config.backgroundImage && (
                <button onClick={() => clearImage('bg')} className="absolute -top-1 -right-1 bg-black border border-white/10 rounded-full p-1 z-10 hover:bg-zinc-800">
                  <Trash2 className="w-2.5 h-2.5 text-red-500" />
                </button>
              )}
              <input type="file" ref={bgInputRef} onChange={(e) => handleImageUpload(e, 'bg')} className="hidden" accept="image/*" />
            </div>

            <div className="relative">
              <div 
                onClick={() => refInputRef.current?.click()}
                className={`border border-dashed rounded-lg p-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative overflow-hidden h-24 bg-zinc-900/50 hover:bg-zinc-900 ${
                  config.referenceImage ? 'border-red-600/40' : 'border-zinc-800'
                }`}
              >
                {config.referenceImage ? (
                  <img src={config.referenceImage} alt="Reference" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[8px] text-zinc-500 text-center leading-tight font-bold uppercase tracking-tighter">Style Ref</span>
                  </>
                )}
              </div>
              {config.referenceImage && (
                <button onClick={() => clearImage('ref')} className="absolute -top-1 -right-1 bg-black border border-white/10 rounded-full p-1 z-10 hover:bg-zinc-800">
                  <Trash2 className="w-2.5 h-2.5 text-red-500" />
                </button>
              )}
              <input type="file" ref={refInputRef} onChange={(e) => handleImageUpload(e, 'ref')} className="hidden" accept="image/*" />
            </div>
          </div>
        </section>

        <section>
          <label className="text-xs font-bold text-zinc-500 mb-3 block uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            Background Configuration
          </label>
          <div className="space-y-3">
             <select 
                value={config.backgroundStyle}
                onChange={(e) => setConfig({...config, backgroundStyle: e.target.value as BackgroundStyle})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-red-600/50"
              >
                {BG_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {config.backgroundStyle === 'Custom' && (
                <textarea
                  value={config.customBackgroundDescription}
                  onChange={(e) => setConfig({...config, customBackgroundDescription: e.target.value})}
                  placeholder="Describe the background scene..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-red-600/50 transition-all min-h-[50px]"
                />
              )}
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-xs font-bold text-zinc-500 mb-3 block uppercase tracking-widest flex items-center gap-2">
            <Type className="w-3.5 h-3.5" />
            Typography & Stylization
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-zinc-600 mb-1 block uppercase">Font Family</label>
              <select 
                value={config.fontFamily}
                onChange={(e) => setConfig({...config, fontFamily: e.target.value as FontFamily})}
                className={`w-full bg-zinc-900 border rounded-lg p-2 text-[10px] focus:outline-none transition-colors ${
                  config.fontFamily === 'Auto (AI Select)' ? 'border-red-600/50 text-red-400' : 'border-zinc-800 text-zinc-300'
                }`}
              >
                {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-zinc-600 mb-1 block uppercase">Text Scale</label>
              <select 
                value={config.textSize}
                onChange={(e) => setConfig({...config, textSize: e.target.value as TextSize})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10px] focus:outline-none"
              >
                {TEXT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
             <button
               onClick={() => setConfig({...config, textOutline: !config.textOutline})}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-[9px] uppercase font-bold transition-all ${
                 config.textOutline ? 'bg-red-600/10 border-red-600 text-red-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
               }`}
             >
               <Square className={`w-3 h-3 ${config.textOutline ? 'fill-red-600' : ''}`} />
               Outline
             </button>
             <button
               onClick={() => setConfig({...config, textShadow: !config.textShadow})}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-[9px] uppercase font-bold transition-all ${
                 config.textShadow ? 'bg-red-600/10 border-red-600 text-red-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
               }`}
             >
               <Square className={`w-3 h-3 ${config.textShadow ? 'fill-red-600' : ''}`} />
               Shadow
             </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] text-zinc-600 mb-1 block uppercase">Preset</label>
              <select 
                value={config.style}
                onChange={(e) => setConfig({...config, style: e.target.value as StylePreset})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10px] focus:outline-none"
              >
                {STYLE_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-zinc-600 mb-1 block uppercase">Pos</label>
              <select 
                value={config.facePosition}
                onChange={(e) => setConfig({...config, facePosition: e.target.value as FacePosition})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10px] focus:outline-none"
              >
                {FACE_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-zinc-600 mb-1 block uppercase">Tone</label>
              <select 
                value={config.colorMood}
                onChange={(e) => setConfig({...config, colorMood: e.target.value as ColorMood})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10px] focus:outline-none"
              >
                {COLOR_MOODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-2">
             <div className="flex items-center justify-between mb-2">
               <label className="text-[9px] text-zinc-600 uppercase flex items-center gap-1.5">
                 <Sun className="w-3 h-3 text-red-500" />
                 Glow Intensity
               </label>
               <span className="text-[10px] font-bold text-red-500 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">{config.glowIntensity}</span>
             </div>
             <div className="px-1">
               <input 
                 type="range" 
                 min="0" 
                 max="3" 
                 step="1"
                 value={glowIndex}
                 onChange={handleGlowChange}
                 className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600 hover:accent-red-500 transition-all"
               />
               <div className="flex justify-between mt-2">
                 {GLOW_INTENSITIES.map((label, i) => (
                   <span key={label} className={`text-[8px] font-bold transition-colors ${i === glowIndex ? 'text-zinc-300' : 'text-zinc-700'}`}>
                     {label}
                   </span>
                 ))}
               </div>
             </div>
          </div>
        </section>

        <section>
          <label className="text-[9px] font-bold text-zinc-500 mb-2 block uppercase tracking-widest">Download Format</label>
          <div className="flex gap-2">
            {(['png', 'jpg'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => setConfig({...config, exportFormat: fmt})}
                className={`flex-1 py-2 text-[10px] rounded-lg transition-all border uppercase font-bold tracking-widest ${
                  config.exportFormat === fmt 
                    ? 'bg-zinc-100 border-zinc-100 text-zinc-950' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </section>

        <button 
          onClick={handleGenerate}
          disabled={state.isAnalyzing || state.isGenerating}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-red-600/20 mt-2"
        >
          {state.isAnalyzing || state.isGenerating ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {state.isAnalyzing ? "Analyzing Creative..." : state.isGenerating ? "Processing Vision..." : "Generate Masterpiece"}
        </button>

        {state.error && (
          <div className="bg-red-950/30 border border-red-900/50 p-3 rounded-lg flex gap-2.5 text-red-200 text-[11px]">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <p>{state.error}</p>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-1.5">
           {state.logs.map((log, i) => (
             <div key={i} className={`text-[9px] flex items-center gap-2 ${i === 0 ? 'text-zinc-300' : 'text-zinc-600'}`}>
               <CheckCircle2 className={`w-3 h-3 ${i === 0 ? 'text-green-500' : 'text-zinc-700'}`} />
               {log}
             </div>
           ))}
        </div>
      </aside>

      {/* Main Preview Area */}
      <div className="flex-1 bg-zinc-950 p-4 md:p-8 flex flex-col items-center justify-start overflow-y-auto no-scrollbar">
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-zinc-600 flex items-center gap-2 uppercase tracking-[0.2em]">
              <Eye className="w-4 h-4 text-red-600" />
              Live Workspace
            </h2>
            {state.resultImage && (
              <button 
                onClick={downloadImage}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 transition-all font-bold shadow-xl shadow-red-600/20"
              >
                <Download className="w-4 h-4" />
                Export {config.exportFormat.toUpperCase()}
              </button>
            )}
          </div>

          <div className={`bg-zinc-900/30 rounded-3xl border border-white/5 shadow-[0_0_100px_-20px_rgba(220,38,38,0.1)] overflow-hidden relative group transition-all duration-500 ${getAspectClass()}`}>
            {!state.resultImage && !state.isGenerating && !state.isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-4">
                <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900/50">
                   <ImageIcon className="w-5 h-5 text-zinc-700" />
                </div>
                <div className="text-center px-6">
                  <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Waiting for creative input</p>
                  <p className="text-[10px] text-zinc-800 mt-1">Upload headshot and inspiration to begin</p>
                </div>
              </div>
            )}

            {(state.isAnalyzing || state.isGenerating) && (
              <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <RefreshCw className="w-12 h-12 text-red-600 animate-spin" />
                  <Sparkles className="w-6 h-6 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white uppercase tracking-[0.2em] animate-pulse">
                    {state.isAnalyzing ? "Analyzing Direction" : "Crafting Masterpiece"}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-2">Harmonizing style reference & content hook...</p>
                </div>
              </div>
            )}

            {state.resultImage && (
              <div className="relative w-full h-full animate-in fade-in zoom-in duration-700">
                <img 
                  src={state.resultImage} 
                  alt="Generated Masterpiece" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Enhancement Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-zinc-900/30 border border-white/5 p-5 rounded-2xl">
                <h3 className="text-[10px] font-bold text-red-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Visual Harmonization
                </h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                  {config.referenceImage 
                    ? "Style profile extracted from your reference image. Color palette, lighting atmosphere, and energy have been merged with your unique headshot and hook."
                    : "Platform-optimized composition active. Rim lighting and high-contrast text placement ensures maximum thumb-stopping potential."}
                </p>
             </div>
             <div className="bg-zinc-900/30 border border-white/5 p-5 rounded-2xl">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  Intelligent Composition
                </h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                  {config.backgroundImage 
                    ? "Your custom background has been enhanced with atmospheric lighting to perfectly match the subject's skin tones."
                    : "AI-generated background is context-aware, creating deep visual storytelling tied directly to your content's emotional hook."}
                </p>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
