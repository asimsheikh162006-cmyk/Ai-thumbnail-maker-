
export type StylePreset = 'Cinematic' | 'Horror/Dark' | 'Viral Bright' | 'Minimal Clean' | 'Dramatic Storytelling' | 'Neon Cyber';
export type FacePosition = 'Left' | 'Right' | 'Center';
export type TextSize = 'Small' | 'Medium' | 'Large';
export type ColorMood = 'Warm' | 'Cold' | 'Neon' | 'Dark' | 'Auto';
export type GlowIntensity = 'Low' | 'Medium' | 'High' | 'Auto';

export type Platform = 'YouTube' | 'Shorts/Reels' | 'IG Post' | 'IG Portrait';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '3:4';

export type FontFamily = 
  | 'Auto (AI Select)'
  | 'Modern Sans' 
  | 'Impact Heavy' 
  | 'Cyberpunk' 
  | 'Elegant Serif' 
  | 'Playful Rounded';

export type BackgroundStyle = 
  | 'Auto-Context' 
  | 'Cinematic' 
  | 'Horror / Dark' 
  | 'Bright / Viral' 
  | 'Minimal Clean' 
  | 'Tech / Futuristic' 
  | 'Mystery / Thriller' 
  | 'Fantasy / Anime' 
  | 'Custom';

export interface ThumbnailConfig {
  videoTitle: string;
  faceImage: string | null;
  backgroundImage: string | null;
  referenceImage: string | null;
  backgroundStyle: BackgroundStyle;
  customBackgroundDescription: string;
  style: StylePreset;
  facePosition: FacePosition;
  textSize: TextSize;
  fontFamily: FontFamily;
  textOutline: boolean;
  textShadow: boolean;
  colorMood: ColorMood;
  glowIntensity: GlowIntensity;
  platform: Platform;
  aspectRatio: AspectRatio;
  exportFormat: 'png' | 'jpg';
}

export interface DesignAdvice {
  hookText: string;
  emotion: string;
  backgroundDescription: string;
  lightingDescription: string;
  compositionNotes: string;
  styleInspiration?: string;
}

export interface GenerationState {
  isAnalyzing: boolean;
  isGenerating: boolean;
  error: string | null;
  resultImage: string | null;
  logs: string[];
}
