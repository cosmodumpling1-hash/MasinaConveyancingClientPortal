import app from '../server';

export default function handler(req: any, res: any) {
  try {
    // 1. Determine requested path from Vercel headers or req.url
    let requestedPath = req.headers['x-forwarded-uri'] || req.headers['x-original-url'] || req.url || '/api';
    if (typeof requestedPath !== 'string') {
      requestedPath = '/api';
    }

    // Clean up Vercel function internal handler path if needed
    requestedPath = requestedPath.replace('/api/index.ts', '/api').replace('/api/index', '/api');

    // Make sure API request path starts with /api
    if (!requestedPath.startsWith('/api') && !requestedPath.includes('.')) {
      requestedPath = '/api' + (requestedPath.startsWith('/') ? requestedPath : '/' + requestedPath);
    }

    req.url = requestedPath;
    req.originalUrl = requestedPath;

    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Function Execution Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Vercel Serverless Function Execution Error', 
        message: err?.message || String(err) 
      });
    }
  }
}


