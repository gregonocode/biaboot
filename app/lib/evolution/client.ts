type EvolutionRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
};

export async function evolutionFetch<T>(
  path: string,
  options: EvolutionRequestOptions = {},
): Promise<T> {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!baseUrl) {
    throw new Error('EVOLUTION_API_URL nao configurada.');
  }

  if (!apiKey) {
    throw new Error('EVOLUTION_API_KEY nao configurada.');
  }

  const url = `${baseUrl.replace(/\/$/, '')}${path}`;

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const text = await response.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    console.error('Erro Evolution API:', {
      status: response.status,
      path,
      url,
      data,
    });

    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: unknown }).message)
        : typeof data === 'string'
          ? data
          : `Erro na Evolution API: ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export function normalizeInstanceName(name: string, userId: string) {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 35);

  const shortUserId = userId.replace(/-/g, '').slice(0, 8);

  return `biabot_${shortUserId}_${cleaned || 'whatsapp'}`;
}
