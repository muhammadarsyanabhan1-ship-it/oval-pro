export default async function handler(req: any, res: any) {
  const apiKey = (req.query.key as string) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error: {
        message: 'GEMINI_API_KEY is not configured. Please add it to your environment variables.',
        status: 'MISSING_API_KEY'
      }
    });
  }

  // Extract path from slug or url
  let slug = req.query.slug;
  let subPath = Array.isArray(slug) ? slug.join('/') : (slug || '');
  if (!subPath && req.url) {
    const parsed = new URL(req.url, 'http://localhost');
    subPath = parsed.pathname.replace(/^\/api\/gemini\/?/, '');
  }

  const queryParams = { ...req.query };
  delete queryParams.slug;
  const searchParams = new URLSearchParams(queryParams as Record<string, string>);
  searchParams.set('key', apiKey);

  const executeFetch = async (path: string) => {
    const targetUrl = `https://generativelanguage.googleapis.com/${path}?${searchParams.toString()}`;
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    return fetch(targetUrl, fetchOptions);
  };

  try {
    let response = await executeFetch(subPath);

    if (response.status === 404 && subPath.includes('models/')) {
      const fallbackMap: Record<string, string[]> = {
        'gemini-3-flash-preview': ['gemini-3.8-flash', 'gemini-1.5-flash'],
        'gemini-2.5-flash-preview-09-2025': ['gemini-3.8-flash', 'gemini-1.5-flash'],
        'gemini-2.5-flash': ['gemini-3.8-flash', 'gemini-1.5-flash'],
        'gemini-2.0-flash': ['gemini-3.8-flash', 'gemini-1.5-flash'],
        'gemini-3.1-flash-image': ['gemini-3.8-flash', 'imagen-3.0-generate-002'],
        'gemini-2.5-flash-preview-tts': ['gemini-3.8-flash-tts']
      };

      for (const [target, alternatives] of Object.entries(fallbackMap)) {
        if (subPath.includes(target)) {
          for (const alt of alternatives) {
            const altPath = subPath.replace(target, alt);
            const retryResp = await executeFetch(altPath);
            if (retryResp.ok) {
              response = retryResp;
              break;
            }
          }
          break;
        }
      }
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err: any) {
    console.error('Error proxying to Gemini API on Vercel:', err);
    return res.status(500).json({
      error: {
        message: err.message || 'Internal proxy error',
      }
    });
  }
}
