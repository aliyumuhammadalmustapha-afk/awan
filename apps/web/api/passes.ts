interface StoredPassRecord {
  ciphertextB64: string;
  ivB64: string;
  expiresAt: string;
  expiresAtMs?: number;
  revoked: boolean;
}

const memoryStore = new Map<string, StoredPassRecord>();

function getRedisConfig(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function redisGet(key: string): Promise<StoredPassRecord | null> {
  const cfg = getRedisConfig();
  if (!cfg) return memoryStore.get(key) || null;
  const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  if (!data.result) return null;
  try {
    return JSON.parse(data.result) as StoredPassRecord;
  } catch {
    return null;
  }
}

async function redisSet(
  key: string,
  value: StoredPassRecord,
  ttlSeconds?: number
): Promise<void> {
  const cfg = getRedisConfig();
  if (!cfg) {
    memoryStore.set(key, value);
    return;
  }
  const body =
    ttlSeconds && ttlSeconds > 0
      ? ['SET', key, JSON.stringify(value), 'EX', String(ttlSeconds)]
      : ['SET', key, JSON.stringify(value)];
  await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST') {
    try {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { token, ciphertextB64, ivB64, expiresAt, expiresAtMs } = body;
      if (!token || !ciphertextB64 || !ivB64) {
        res.status(400).json({ error: 'missing_fields' });
        return;
      }
      const ttlSeconds = expiresAtMs
        ? Math.max(60, Math.ceil((expiresAtMs - Date.now()) / 1000))
        : 30 * 86400;
      const record: StoredPassRecord = {
        ciphertextB64,
        ivB64,
        expiresAt: expiresAt || '',
        expiresAtMs,
        revoked: false,
      };
      await redisSet(`pass:${token}`, record, ttlSeconds);
      res.status(201).json({
        ok: true,
        token,
        persisted: getRedisConfig() ? 'redis' : 'memory',
      });
    } catch {
      res.status(400).json({ error: 'invalid_json' });
    }
    return;
  }

  if (req.method === 'GET') {
    const token =
      (req.query && req.query.token) ||
      new URL(req.url, 'http://localhost').searchParams.get('token');
    if (!token) {
      res.status(400).json({ error: 'missing_token' });
      return;
    }
    const record = await redisGet(`pass:${token}`);
    if (!record) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(200).json(record);
    return;
  }

  if (req.method === 'PATCH') {
    try {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const tokens: string[] = Array.isArray(body.tokens)
        ? body.tokens
        : body.token
        ? [body.token]
        : [];
      for (const tok of tokens) {
        const existing = await redisGet(`pass:${tok}`);
        if (existing) {
          existing.revoked = true;
          await redisSet(`pass:${tok}`, existing);
        } else {
          await redisSet(`pass:${tok}`, {
            ciphertextB64: '',
            ivB64: '',
            expiresAt: '',
            revoked: true,
          });
        }
      }
      res.status(200).json({ ok: true });
    } catch {
      res.status(400).json({ error: 'invalid_json' });
    }
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
