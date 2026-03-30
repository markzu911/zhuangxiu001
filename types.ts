
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

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
