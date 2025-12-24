import { GoogleGenAI, Type } from "@google/genai";
import { Point, ConstellationMetadata } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction to ensure the persona is consistent
const SYSTEM_INSTRUCTION = `You are a mystical astrologer and artist. 
You interpret star patterns into 2026 horoscopes and visual descriptions for trading cards.
Tone: Mystical, encouraging, sophisticated.`;

/**
 * Step 1: Analyze coordinates to generate Name, Horoscope, and Image Prompt.
 * Uses gemini-3-flash-preview for logic/text.
 */
export const generateConstellationMetadata = async (
  stars: Point[],
  canvasWidth: number,
  canvasHeight: number
): Promise<ConstellationMetadata> => {
  // Normalize coordinates to 0-100 scale for the model
  const normalizedStars = stars.map(s => ({
    x: Math.round((s.x / canvasWidth) * 100),
    y: Math.round((s.y / canvasHeight) * 100)
  }));

  const prompt = `
    I have connected 5 stars on a 100x100 grid at these coordinates:
    ${JSON.stringify(normalizedStars)}
    
    1. ANALYZE THE SHAPE formed by these lines. Does it look like a crown, a spear, a cup, a wave, a bird?
    2. Create a unique, mythical name for this constellation DIRECTLY RELATED to that shape.
    3. Write a one-sentence high-vibe horoscope for 2026.
    4. Write a detailed visual prompt for an AI image generator to create a "Holographic Trading Card".
       
    CRITICAL PROMPT REQUIREMENTS:
    - The prompt MUST instruct the image generator to WRITE text on the card.
    - Title: "${'{name}'}" (Top Left).
    - Body Text: "${'{horoscope}'}" (In the bottom text box).
    - Visuals: Vertical trading card. Top half features the constellation shape (glowing gold lines matching the user's input shape) on a deep nebula background. Bottom half features a parchment style text box.
    - Style: Pokémon-GX holofoil, intricate gold filigree, 8k resolution, mystic noir aesthetic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            horoscope: { type: Type.STRING },
            visualPrompt: { type: Type.STRING }
          },
          required: ["name", "horoscope", "visualPrompt"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");
    return JSON.parse(text) as ConstellationMetadata;

  } catch (error) {
    console.error("Metadata Generation Error:", error);
    // Fallback if API fails
    return {
      name: "The Unseen Path",
      horoscope: "Your 2026 is a canvas waiting for your own light to guide the way.",
      visualPrompt: "A glowing mystic constellation on a dark blue card, gold filigree borders, holographic style."
    };
  }
};

/**
 * Helper: Create a visual sketch of the constellation to guide the image generator.
 * Maps screen coordinates to a 3:4 canvas suitable for the card art.
 */
const createConstellationSketch = (stars: Point[]): string => {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  // 3:4 Ratio for high res input
  canvas.width = 768; 
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Fill Black Background (ControlNet style input)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (stars.length === 0) return canvas.toDataURL('image/png').split(',')[1];

  // 2. Calculate Bounding Box of input stars
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  stars.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  // 3. Define Target Area on the Card
  // We want the constellation to occupy the top portion of the card (where art goes).
  // Target: Center X, Upper Center Y.
  const targetW = canvas.width * 0.6; // Max 60% of card width
  const targetH = canvas.height * 0.4; // Max 40% of card height (top half)
  const targetCenterX = canvas.width / 2;
  const targetCenterY = canvas.height * 0.35; // Positioned in the upper visual area

  // 4. Calculate Scale
  const scaleX = width > 0 ? targetW / width : 1;
  const scaleY = height > 0 ? targetH / height : 1;
  const scale = Math.min(scaleX, scaleY);

  // 5. Draw
  // Draw Connection Lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 15; // Thick lines for clear guidance
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  stars.forEach((p, i) => {
    // Center in BB -> Scale -> Translate to Target
    const relX = p.x - (minX + width / 2);
    const relY = p.y - (minY + height / 2);
    const drawX = targetCenterX + (relX * scale);
    const drawY = targetCenterY + (relY * scale);

    if (i === 0) ctx.moveTo(drawX, drawY);
    else ctx.lineTo(drawX, drawY);
  });
  ctx.stroke();

  // Draw Stars (Nodes)
  ctx.fillStyle = '#ffffff';
  stars.forEach(p => {
    const relX = p.x - (minX + width / 2);
    const relY = p.y - (minY + height / 2);
    const drawX = targetCenterX + (relX * scale);
    const drawY = targetCenterY + (relY * scale);
    
    ctx.beginPath();
    ctx.arc(drawX, drawY, 20, 0, Math.PI * 2); // Big dots
    ctx.fill();
  });

  return canvas.toDataURL('image/png').split(',')[1];
};

/**
 * Step 2: Generate the Card Image.
 * Uses gemini-2.5-flash-image (Nano Banana) with Sketch guidance.
 */
export const generateCardImage = async (
  prompt: string, 
  stars: Point[]
): Promise<string> => {
  try {
    // Generate the sketch reference
    const sketchBase64 = createConstellationSketch(stars);

    // Injecting strong instructions for text rendering and shape adherence
    const enhancedPrompt = `
      Create a vertical fantasy trading card based on the provided sketch layout.
      
      VISUAL STRUCTURE:
      - The provided image is a SCHEMATIC. You must turn the white lines and dots into a GLOWING GOLDEN CONSTELLATION.
      - The constellation MUST match the shape and position shown in the schematic exactly.
      - The background should be a deep cosmic nebula.
      
      TEXT RULES:
      1. Title (Top Left): Write the card name clearly.
      2. Body (Bottom Box): Write the horoscope sentence clearly in the parchment box.
      3. FONTS: Use the EXACT SAME elegant fantasy serif font for BOTH the Title and the Horoscope text. The fonts must match.
      
      STYLE:
      - High quality, masterpiece, 8k, photorealistic textures, golden glow, Pokémon-GX holofoil style.
      
      Prompt Details: ${prompt}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [
          { text: enhancedPrompt },
          { 
            inlineData: {
              mimeType: 'image/png',
              data: sketchBase64
            }
          }
        ] 
      },
      config: {
        imageConfig: {
            aspectRatio: '3:4'
        }
      }
    });

    // Extract image from response parts
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart) {
        console.warn("Model returned text:", textPart.text);
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

/**
 * Step 3: Edit the Card Image.
 * Uses gemini-2.5-flash-image for editing.
 */
export const editCardImage = async (
  base64Image: string,
  editInstruction: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Edit this image: ${editInstruction}. Maintain the trading card style, layout, and LEGIBLE text with matching fonts.`,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
      config: {
        imageConfig: {
            aspectRatio: '3:4'
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    throw new Error("No edited image returned");
  } catch (error) {
    console.error("Image Edit Error:", error);
    throw error;
  }
};