export default async function handler(req: any, res: any) {
  const apiKey = (req.query.key as string) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error: {
        message: 'GEMINI_API_KEY belum dikonfigurasi. Harap tambahkan GEMINI_API_KEY di menu Environment Variables di dashboard Vercel.',
        status: 'MISSING_API_KEY'
      }
    });
  }

  // Get path parameter
  const pathParam = req.query.path;
  const subPath = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') {
      searchParams.set(key, String(value));
    }
  }
  searchParams.set('key', apiKey);

  const targetUrl = `https://generativelanguage.googleapis.com/${subPath}?${searchParams.toString()}`;

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err: any) {
    console.error('Vercel API Proxy Error:', err);
    return res.status(500).json({ error: { message: err.message || 'Internal proxy error' } });
  }
}
