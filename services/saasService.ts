import { 
  SaasLaunchResponse, 
  SaasVerifyResponse, 
  SaasConsumeResponse, 
  SaasInitData 
} from '../types';

export const saasLaunch = async (userId: string, toolId: string): Promise<SaasLaunchResponse> => {
  const response = await fetch('/api/tool/launch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, toolId })
  });
  if (!response.ok) throw new Error('SaaS Launch Failed');
  return response.json();
};

export const saasVerify = async (userId: string, toolId: string): Promise<SaasVerifyResponse> => {
  const response = await fetch('/api/tool/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, toolId })
  });
  if (!response.ok) throw new Error('SaaS Verify Failed');
  return response.json();
};

export const saasConsume = async (userId: string, toolId: string): Promise<SaasConsumeResponse> => {
  const response = await fetch('/api/tool/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, toolId })
  });
  if (!response.ok) throw new Error('SaaS Consume Failed');
  return response.json();
};

/**
 * Validates and filters placeholder strings like "null" or "undefined"
 */
export const validateSaasId = (id: string | null | undefined): string | null => {
  if (!id) return null;
  const normalized = String(id).trim().toLowerCase();
  if (normalized === 'null' || normalized === 'undefined' || normalized === '') {
    return null;
  }
  return id;
};
