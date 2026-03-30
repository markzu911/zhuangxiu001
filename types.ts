
export enum ChineseStyle {
  NEW_CHINESE = '新中式',
  CLASSICAL = '古典中式',
  ZEN_MINIMALISM = '禅意简约',
  LUXURY_ORIENTAL = '东方奢华',
  AMERICAN = '美式',
  EUROPEAN = '欧式'
}

export interface DesignConfig {
  style: ChineseStyle;
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
