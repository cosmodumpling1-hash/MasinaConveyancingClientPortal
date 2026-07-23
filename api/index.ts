import app from '../server.ts';

export default function handler(req: any, res: any) {
  try {
    // Ensure request URL starts with /api for Express routing on Vercel
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Function Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'Server error in Vercel function' });
    }
  }
}

