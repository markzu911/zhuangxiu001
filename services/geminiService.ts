
import { GoogleGenAI } from "@google/genai";

export enum InteriorStyle {
  NEW_CHINESE = "NEW_CHINESE",
  CLASSICAL = "CLASSICAL",
  LIGHT_LUXURY = "LIGHT_LUXURY",
  FRENCH = "FRENCH",
  MODERN_MINIMALIST = "MODERN_MINIMALIST"
}

export const STYLE_PROMPTS: Record<string, string> = {
  [InteriorStyle.NEW_CHINESE]: "Modern Chinese style, clean lines, neutral colors, dark wood accents, elegant furniture, balanced composition.",
  [InteriorStyle.CLASSICAL]: "Classical Chinese, rosewood furniture, intricate lattice screens, silk textures, symmetrical layout, traditional art.",
  [InteriorStyle.LIGHT_LUXURY]: "Light luxury style, sophisticated, high-quality materials, metallic accents, refined elegance.",
  [InteriorStyle.FRENCH]: "French style, romantic, elegant moldings, ornate details, soft color palette, vintage furniture.",
  [InteriorStyle.MODERN_MINIMALIST]: "Modern minimalist style, black white and gray, sleek lines, open space, functional furniture."
};

declare const __GEMINI_API_KEY__: string;

export async function transformRoomImage(
  base64Image: string,
  style: string,
  aspectRatio: string = "1:1"
): Promise<string> {
  // 优先使用构建时注入的全局常量
  const apiKey = __GEMINI_API_KEY__ || (import.meta as any).env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key 未配置。请在 Vercel 环境变量中设置 VITE_GEMINI_API_KEY 并重新部署。");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = STYLE_PROMPTS[style] || STYLE_PROMPTS[InteriorStyle.NEW_CHINESE];

  try {
    const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/jpeg';
    const data = base64Image.split(',')[1] || base64Image;

    const systemInstruction = `[STRUCTURAL PRESERVATION]
Transform this bare room into a fully furnished space in the following style: ${prompt}
Preserve the EXACT geometric structure, walls, windows, and perspective of the input image. 
Do NOT alter architectural elements. Only apply materials, textures, furniture, and lighting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: systemInstruction }
        ],
      },
      config: {
        imageConfig: { aspectRatio, imageSize: "1K" }
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    throw new Error("模型未生成图像，请重试。");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
