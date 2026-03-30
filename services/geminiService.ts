
import { GoogleGenAI } from "@google/genai";
import { ChineseStyle } from "../types";

export async function transformRoomImage(
  base64Image: string,
  style: ChineseStyle,
  roomType: string,
  aspectRatio: string = "1:1",
  onProgress?: (status: string) => void
): Promise<string> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const stylePrompts: Record<ChineseStyle, string> = {
    [ChineseStyle.NEW_CHINESE]: "关键词1, Modern Chinese style, clean lines, neutral colors, dark wood accents, elegant furniture, balanced composition.",
    [ChineseStyle.CLASSICAL]: "关键词2, Classical Chinese, rosewood furniture, intricate lattice screens, silk textures, symmetrical layout, traditional art.",
    [ChineseStyle.ZEN_MINIMALISM]: "Zen style, bamboo, stone, light wood, simple furniture, peaceful atmosphere, natural lighting.",
    [ChineseStyle.LUXURY_ORIENTAL]: "Grand Oriental luxury, marble flooring, high ceilings, gold accents, premium wooden beams, expensive textures.",
    [ChineseStyle.AMERICAN]: "American style, cozy and comfortable, practical, casual elegance, solid wood furniture, fabric upholstery, warm tones.",
    [ChineseStyle.EUROPEAN]: "European style, luxurious and elegant, ornate details, flowing lines, rich colors, classic moldings, crystal chandeliers."
  };

  try {
    const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/jpeg';
    const data = base64Image.split(',')[1] || base64Image;

    if (onProgress) onProgress("正在渲染精装修材质与光影...");
    
    const systemInstruction = `[CRITICAL INSTRUCTION: STRICT STRUCTURAL PRESERVATION]
This is an image-to-image translation task. You MUST preserve the EXACT geometric structure, perspective, and layout of the provided input image. 
Do NOT alter the position, size, or shape of any walls, windows, doors, beams, or columns. 

Your ONLY task is to apply surface materials, textures, and lighting to the existing surfaces to transform this bare room into a fully furnished ${roomType} in the following style: ${stylePrompts[style]}

Execution Rules:
1. NO STRUCTURAL CHANGES: The skeleton of the room must remain 100% identical to the input image. Absolutely no moving, adding, or deleting walls, columns, beams, doors, or windows.
2. SURFACE OVERLAY ONLY: Replace bare concrete/brick with finished materials (wood, marble, paint, wallpaper, etc.) according to the requested style.
3. SPATIAL MATCHING: Add furniture and decor that fits perfectly within the existing spatial constraints without blocking key architectural lines or messing up the scale.
4. LIGHTING INHERITANCE: Preserve the existing natural light direction and add matching artificial lighting.
5. NO WATERMARKS: The final image must not contain any text, watermarks, or logos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: mimeType,
            },
          },
          {
            text: systemInstruction,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("模型未生成图像，请重试。");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
