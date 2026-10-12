import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check & status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Proxy for Google Generative Language API
app.all('/api/gemini/*', async (req, res) => {
  const apiKey = (req.query.key as string) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error: {
        message: 'GEMINI_API_KEY is not configured on the server. Please check your .env settings or AI Studio Secrets.',
        status: 'MISSING_API_KEY'
      }
    });
  }

  // Extract path after /api/gemini
  let subPath = (req.params as any)[0] || '';
  const searchParams = new URLSearchParams(req.query as Record<string, string>);
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
      fetchOptions.body = JSON.stringify(req.body);
    }

    return fetch(targetUrl, fetchOptions);
  };

  try {
    let response = await executeFetch(subPath);

    // If model is not found (404), try suitable fallback models
    if (response.status === 404 && subPath.includes('models/')) {
      const fallbackMap: Record<string, string[]> = {
        'gemini-3-flash-preview': ['gemini-2.5-flash', 'gemini-2.0-flash'],
        'gemini-2.5-flash-preview-09-2025': ['gemini-2.5-flash', 'gemini-2.0-flash'],
        'gemini-3.1-flash-image': ['imagen-3.0-generate-002', 'gemini-2.0-flash-exp'],
        'gemini-2.5-flash-preview-tts': ['gemini-2.0-flash']
      };

      for (const [target, alternatives] of Object.entries(fallbackMap)) {
        if (subPath.includes(target)) {
          for (const alt of alternatives) {
            const altPath = subPath.replace(target, alt);
            console.log(`404 received for ${target}, trying fallback to ${alt}`);
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
    console.error('Error proxying to Gemini API:', err);
    return res.status(500).json({
      error: {
        message: err.message || 'Internal proxy error',
      }
    });
  }
});

// Start Vite middleware in dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
