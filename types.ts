
export enum InteriorStyle {
  NEW_CHINESE = '新中式',
  CLASSICAL = '古典中式',
  LIGHT_LUXURY = '轻奢风',
  FRENCH = '法式',
  MEDITERRANEAN = '美式地中海',
  MID_CENTURY = '中古风',
  PASTORAL = '田园风',
  NORDIC = '北欧风',
  AMERICAN = '美式',
  MODERN_MINIMALIST = '现代简约'
}

export interface DesignConfig {
  style: InteriorStyle;
  roomType: string;
  intensity: number;
}

export interface TransformationResult {
  originalUrl: string;
  resultUrl: string;
  timestamp: number;
}

export interface SaasUser {
  name: string;
  enterprise: string;
  integral: number;
}

export interface SaasTool {
  name: string;
  integral: number;
}

export interface SaasLaunchResponse {
  success: boolean;
  data: {
    user: SaasUser;
    tool: SaasTool;
  };
}

export interface SaasVerifyResponse {
  success: boolean;
  message?: string;
  data?: {
    currentIntegral: number;
    requiredIntegral: number;
  };
}

export interface SaasConsumeResponse {
  success: boolean;
  data: {
    currentIntegral: number;
    consumedIntegral: number;
  };
}

export interface SaasInitData {
  userId: string;
  toolId: string;
  context?: string;
  prompt?: string[];
  callbackUrl?: string;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
