// Simple client-side encryption helper
export const encryptPassData = async (data: any, key: string) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const keyBuffer = encoder.encode(key);
  
  // Use SubtleCrypto for AES-GCM encryption
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBuffer.slice(0, 32), { name: 'AES-GCM' }, false, ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, cryptoKey, dataBuffer
  );
  
  return { encrypted, iv };
};
