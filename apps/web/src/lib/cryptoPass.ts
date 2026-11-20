export interface EncryptedPassBundle {
  ciphertextB64: string;
  ivB64: string;
  keyFragment: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '==='.slice((b64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptPassSnapshot(payload: unknown): Promise<EncryptedPassBundle> {
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded
  );
  return {
    ciphertextB64: bytesToBase64Url(new Uint8Array(cipherBuffer)),
    ivB64: bytesToBase64Url(iv),
    keyFragment: bytesToBase64Url(rawKey),
  };
}

export async function decryptPassSnapshot<T>(
  ciphertextB64: string,
  ivB64: string,
  keyFragment: string
): Promise<T> {
  const rawKey = base64UrlToBytes(keyFragment);
  const iv = base64UrlToBytes(ivB64);
  const cipherBytes = base64UrlToBytes(ciphertextB64);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    cryptoKey,
    cipherBytes as BufferSource
  );
  const json = new TextDecoder().decode(plainBuffer);
  return JSON.parse(json) as T;
}
