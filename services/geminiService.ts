import { GoogleGenAI, Type } from "@google/genai";
import { ThumbnailConfig, DesignAdvice } from "../types";

// Helper to get API key from Vite environment variables or fallback
const getApiKey = () => {
  // @ts-ignore
  const key = import.meta.env.VITE_API_KEY;
  if (!key) {
    console.error("Missing VITE_API_KEY environment variable");
    throw new Error("API Key is missing. Please check your Vercel settings.");
  }
  return key;
};

/**
 * Gets creative direction for a high-CTR thumbnail using Gemini 3 Flash.
 */
export const getDesignAdvice = async (config: ThumbnailConfig): Promise<DesignAdvice> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const textPrompt = `Analyze this ${config.platform} content title: "${config.videoTitle}". 
  Your goal is to provide creative direction for a high-CTR visual for ${config.platform} (${config.aspectRatio} aspect ratio).
  
  Instructions:
  1. Create a "hook text" (3-6 words maximum) that is punchier than the title.
  2. Identify the dominant emotion (shock, fear, curiosity, excitement, mystery, anger, motivation).
  3. Describe a cinematic, context-aware background scene based on the title.
  4. Suggest lighting and color mood (e.g., "dramatic blue and orange teal", "vibrant neon pink", "dark moody shadows").
  5. Provide composition notes based on a face being in the ${config.facePosition} position.
  ${config.referenceImage ? "6. Analyze the style of the provided reference image (colors, lighting, text energy) and summarize how to adapt its vibe WITHOUT copying its specific content." : ""}
  
  Return the response in valid JSON format only.`;

  const contentsParts: any[] = [];
  if (config.referenceImage) {
    const refBase64Data = config.referenceImage.split(',')[1];
    const refMimeType = config.referenceImage.split(';')[0].split(':')[1];
    contentsParts.push({
      inlineData: {
        data: refBase64Data,
        mimeType: refMimeType,
      },
    });
  }
  contentsParts.push({ text: textPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: contentsParts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hookText: { type: Type.STRING },
          emotion: { type: Type.STRING },
          backgroundDescription: { type: Type.STRING },
          lightingDescription: { type: Type.STRING },
          compositionNotes: { type: Type.STRING },
          styleInspiration: { type: Type.STRING, description: "Style cues extracted from the reference thumbnail." },
        },
        required: ['hookText', 'emotion', 'backgroundDescription', 'lightingDescription', 'compositionNotes'],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error("Failed to parse design advice from Gemini.");
  }
};

/**
 * Generates the thumbnail image using Gemini 2.5 Flash Image.
 */
export const generateThumbnail = async (
  config: ThumbnailConfig, 
  advice: DesignAdvice
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  let backgroundPrompt = "";
  if (config.backgroundImage) {
    backgroundPrompt = "Use the provided background image (Image 2) as the scene. Blend the subject from Image 1 naturally onto this background.";
  } else if (config.backgroundStyle === 'Custom') {
    backgroundPrompt = `Generate a background matching this description: ${config.customBackgroundDescription}.`;
  } else if (config.backgroundStyle !== 'Auto-Context') {
    backgroundPrompt = `Generate a background in the ${config.backgroundStyle} style.`;
  } else {
    backgroundPrompt = `Generate a context-aware background: ${advice.backgroundDescription}.`;
  }

  // Handle platform-specific safe zone hints
  let safeZoneHint = "";
  if (config.platform === 'Shorts/Reels') {
    safeZoneHint = "Keep critical content (face and text) in the vertical center. Avoid the top 15% and bottom 25% where UI overlays appear.";
  } else if (config.platform === 'IG Portrait') {
    safeZoneHint = "Ensure composition works for a tall portrait frame.";
  }

  const textEffects = [];
  if (config.textOutline) textEffects.push("bold high-contrast outline/stroke around the letters");
  if (config.textShadow) textEffects.push("deep, realistic drop shadow for maximum legibility");

  const fontFamilyDesc = config.fontFamily === 'Auto (AI Select)' 
    ? "a typography style that best matches the viral mood and core emotion of the content" 
    : `a ${config.fontFamily} font style`;

  const referenceStyleNote = advice.styleInspiration 
    ? `STYLE REFERENCE: ${advice.styleInspiration}. Use the provided reference image only for its color palette and energy. Do NOT copy its layout or text.` 
    : "";

  const prompt = `
    Create a professional, high-CTR ${config.platform} thumbnail/post.
    
    PRIORITY 1: SUBJECT. Use the person in Image 1. Place them on the ${config.facePosition.toLowerCase()} side. Enhance features, add professional lighting.
    PRIORITY 2: TITLE/HOOK. Include text "${advice.hookText}". Size: ${config.textSize.toLowerCase()}. Typography: ${fontFamilyDesc}. ${textEffects.length > 0 ? "Apply " + textEffects.join(" and ") + "." : ""}
    PRIORITY 3: BACKGROUND. ${backgroundPrompt} Use high depth of field.
    PRIORITY 4: STYLE GUIDANCE. ${referenceStyleNote} ${config.style} preset.
    
    LIGHTING: ${advice.lightingDescription}. Apply dramatic rim lighting on the subject.
    MOOD: ${config.colorMood === 'Auto' ? 'Optimized for viral appeal' : config.colorMood} mood.
    GLOW: ${config.glowIntensity} intensity.
    TECHNICAL: 8k resolution, cinematic grading, high contrast.
    No watermarks. No extra text besides "${advice.hookText}".
  `;

  if (!config.faceImage) {
     throw new Error("No headshot image provided.");
  }

  const contentsParts: any[] = [];
  
  // Image 1: Subject
  const faceBase64Data = config.faceImage.split(',')[1];
  const faceMimeType = config.faceImage.split(';')[0].split(':')[1];
  contentsParts.push({
    inlineData: {
      data: faceBase64Data,
      mimeType: faceMimeType,
    },
  });

  // Image 2: Background (Optional)
  if (config.backgroundImage) {
    const bgBase64Data = config.backgroundImage.split(',')[1];
    const bgMimeType = config.backgroundImage.split(';')[0].split(':')[1];
    contentsParts.push({
      inlineData: {
        data: bgBase64Data,
        mimeType: bgMimeType,
      },
    });
  }

  // Image 3: Reference (Optional)
  if (config.referenceImage) {
    const refBase64Data = config.referenceImage.split(',')[1];
    const refMimeType = config.referenceImage.split(';')[0].split(':')[1];
    contentsParts.push({
      inlineData: {
        data: refBase64Data,
        mimeType: refMimeType,
      },
    });
  }

  contentsParts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: contentsParts },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image was generated by the model.");
};